import { getDb } from "../db/client";
import { mcpRegistryCache } from "../db/schema";
import { eq, isNull, asc } from "drizzle-orm";
import type { Env } from "../types";
import type { SafetyReport, SafetyCheck } from "./types";

const SAFETY_THRESHOLD = 70;

export async function runSafetyScans(
  env: Env,
  config: Record<string, unknown>,
): Promise<number> {
  const batchSize = (config.batch_size as number) || 10;
  const db = getDb(env.DB);

  const unscanned = await db
    .select()
    .from(mcpRegistryCache)
    .where(isNull(mcpRegistryCache.safetyScore))
    .orderBy(asc(mcpRegistryCache.fetchedAt))
    .limit(batchSize)
    .all();

  let scanned = 0;

  for (const entry of unscanned) {
    try {
      const report = await scanMcpServer(env, entry.repoUrl, entry.name);
      const now = Math.floor(Date.now() / 1000);

      await db
        .update(mcpRegistryCache)
        .set({
          safetyScore: report.score,
          safetyReport: JSON.stringify(report),
          scannedAt: now,
        })
        .where(eq(mcpRegistryCache.id, entry.id))
        .run();

      scanned++;
    } catch (e) {
      console.error(`Safety scan failed for ${entry.name}:`, e);
    }
  }

  return scanned;
}

async function scanMcpServer(
  env: Env,
  repoUrl: string,
  name: string,
): Promise<SafetyReport> {
  const checks: SafetyCheck[] = [];

  const repoMeta = await fetchRepoMetadata(repoUrl);
  checks.push(checkRepoHealth(repoMeta));
  checks.push(checkMaintenance(repoMeta));

  const packageJson = await fetchFileFromRepo(repoUrl, "package.json");
  if (packageJson) {
    checks.push(...checkDependencies(packageJson));
  }

  const sourceFiles = await fetchSourceSample(repoUrl);
  if (sourceFiles.length > 0) {
    checks.push(...await analyzeCodeWithAi(env, sourceFiles, name));
  }

  const score = calculateScore(checks);

  return {
    score,
    passed: score >= SAFETY_THRESHOLD,
    checks,
    scannedAt: Math.floor(Date.now() / 1000),
  };
}

async function fetchRepoMetadata(repoUrl: string): Promise<RepoMeta> {
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return { stars: 0, forks: 0, openIssues: 0, archived: false, pushedAt: "", license: null, contributors: 0 };

  const [, owner, repo] = match;
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: { Accept: "application/vnd.github.v3+json", "User-Agent": "jarvis-cloud/1.0" },
  });

  if (!res.ok) return { stars: 0, forks: 0, openIssues: 0, archived: false, pushedAt: "", license: null, contributors: 0 };

  const data = await res.json() as Record<string, unknown>;
  return {
    stars: (data.stargazers_count as number) || 0,
    forks: (data.forks_count as number) || 0,
    openIssues: (data.open_issues_count as number) || 0,
    archived: (data.archived as boolean) || false,
    pushedAt: (data.pushed_at as string) || "",
    license: (data.license as { spdx_id: string } | null)?.spdx_id || null,
    contributors: 0,
  };
}

function checkRepoHealth(meta: RepoMeta): SafetyCheck {
  if (meta.archived) {
    return { name: "repo_archived", passed: false, severity: "warning", detail: "Repository is archived and no longer maintained." };
  }
  if (meta.stars < 5) {
    return { name: "repo_popularity", passed: false, severity: "warning", detail: `Only ${meta.stars} stars — limited community vetting.` };
  }
  return { name: "repo_health", passed: true, severity: "info", detail: `${meta.stars} stars, ${meta.forks} forks. Active community.` };
}

function checkMaintenance(meta: RepoMeta): SafetyCheck {
  if (!meta.pushedAt) {
    return { name: "maintenance", passed: false, severity: "warning", detail: "No push date available." };
  }
  const daysSinceUpdate = (Date.now() - new Date(meta.pushedAt).getTime()) / 86400000;
  if (daysSinceUpdate > 180) {
    return { name: "maintenance", passed: false, severity: "warning", detail: `Last updated ${Math.round(daysSinceUpdate)} days ago.` };
  }
  return { name: "maintenance", passed: true, severity: "info", detail: `Updated ${Math.round(daysSinceUpdate)} days ago.` };
}

function checkDependencies(packageJsonStr: string): SafetyCheck[] {
  const checks: SafetyCheck[] = [];

  try {
    const pkg = JSON.parse(packageJsonStr);
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    const depCount = Object.keys(allDeps).length;

    if (depCount > 50) {
      checks.push({ name: "dep_count", passed: false, severity: "warning", detail: `${depCount} dependencies — large attack surface.` });
    } else {
      checks.push({ name: "dep_count", passed: true, severity: "info", detail: `${depCount} dependencies.` });
    }

    const suspicious = ["child_process", "eval", "vm2", "shelljs"];
    const found = suspicious.filter((d) => d in allDeps);
    if (found.length > 0) {
      checks.push({ name: "suspicious_deps", passed: false, severity: "critical", detail: `Suspicious dependencies: ${found.join(", ")}` });
    }
  } catch {
    checks.push({ name: "package_parse", passed: false, severity: "warning", detail: "Could not parse package.json." });
  }

  return checks;
}

async function fetchFileFromRepo(repoUrl: string, path: string): Promise<string | null> {
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return null;

  const [, owner, repo] = match;
  const res = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/main/${path}`, {
    headers: { "User-Agent": "jarvis-cloud/1.0" },
  });

  if (!res.ok) {
    const resFallback = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/master/${path}`, {
      headers: { "User-Agent": "jarvis-cloud/1.0" },
    });
    if (!resFallback.ok) return null;
    return resFallback.text();
  }
  return res.text();
}

async function fetchSourceSample(repoUrl: string): Promise<string[]> {
  const files = ["src/index.ts", "index.ts", "src/index.js", "index.js", "src/server.ts", "server.ts"];
  const results: string[] = [];

  for (const f of files) {
    if (results.length >= 2) break;
    const content = await fetchFileFromRepo(repoUrl, f);
    if (content && content.length < 50000) {
      results.push(`// FILE: ${f}\n${content}`);
    }
  }

  return results;
}

async function analyzeCodeWithAi(env: Env, sources: string[], name: string): Promise<SafetyCheck[]> {
  const checks: SafetyCheck[] = [];
  const combined = sources.join("\n\n---\n\n").slice(0, 15000);

  const prompt = `Analyze this MCP server code "${name}" for security issues. Check for:
1. Data exfiltration (sending user data to external servers)
2. Arbitrary code execution (eval, exec, spawn with user input)
3. File system access beyond declared scope
4. Network requests to undeclared endpoints
5. Credential harvesting or token theft
6. Excessive permissions requested

Respond with JSON only — an array of objects: {"issue": string, "severity": "critical"|"warning"|"info", "found": boolean}
Only include issues you actually found evidence for. If the code looks clean, return an empty array [].`;

  try {
    const res = await env.AI.run("@cf/meta/llama-3.1-8b-instruct" as any, {
      messages: [
        { role: "system", content: "You are a security auditor. Respond with valid JSON only." },
        { role: "user", content: `${prompt}\n\n${combined}` },
      ],
    }) as unknown as { response: string };

    const parsed = JSON.parse(res.response) as { issue: string; severity: string; found: boolean }[];

    for (const finding of parsed) {
      if (!finding.found) continue;
      checks.push({
        name: "ai_audit",
        passed: finding.severity !== "critical",
        severity: finding.severity as "critical" | "warning" | "info",
        detail: finding.issue,
      });
    }

    if (checks.length === 0) {
      checks.push({ name: "ai_audit", passed: true, severity: "info", detail: "No security issues detected by AI analysis." });
    }
  } catch {
    checks.push({ name: "ai_audit", passed: true, severity: "info", detail: "AI analysis unavailable — skipped." });
  }

  return checks;
}

function calculateScore(checks: SafetyCheck[]): number {
  let score = 100;

  for (const check of checks) {
    if (!check.passed) {
      switch (check.severity) {
        case "critical": score -= 40; break;
        case "warning": score -= 15; break;
        case "info": score -= 5; break;
      }
    }
  }

  return Math.max(0, Math.min(100, score));
}

interface RepoMeta {
  stars: number;
  forks: number;
  openIssues: number;
  archived: boolean;
  pushedAt: string;
  license: string | null;
  contributors: number;
}
