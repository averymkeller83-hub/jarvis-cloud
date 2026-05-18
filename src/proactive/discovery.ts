import { getDb } from "../db/client";
import { mcpRegistryCache } from "../db/schema";
import type { Env } from "../types";
import type { McpRegistryEntry } from "./types";

const GITHUB_SEARCH_URL = "https://api.github.com/search/repositories";
const NPM_SEARCH_URL = "https://registry.npmjs.org/-/v1/search";

export async function runDiscovery(
  env: Env,
  config: Record<string, unknown>,
): Promise<number> {
  const sources = (config.sources as string[]) || ["github", "npm"];
  const maxResults = (config.max_results as number) || 50;
  let discovered = 0;

  for (const source of sources) {
    try {
      const entries =
        source === "github"
          ? await searchGitHub(maxResults)
          : await searchNpm(maxResults);

      discovered += await upsertEntries(env, entries);
    } catch (e) {
      console.error(`Discovery failed for ${source}:`, e);
    }
  }

  return discovered;
}

const MCP_NAME_RE = /mcp[-_]server|mcp[-_]|[-_]mcp$/i;

async function searchGitHub(limit: number): Promise<McpRegistryEntry[]> {
  const queries = [
    "mcp-server in:name language:typescript stars:>10",
    "mcp-server in:name language:javascript stars:>10",
  ];

  const entries: McpRegistryEntry[] = [];
  const seen = new Set<string>();

  for (const q of queries) {
    if (entries.length >= limit) break;

    const url = `${GITHUB_SEARCH_URL}?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=30`;
    const res = await fetch(url, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "jarvis-cloud/1.0",
      },
    });

    if (!res.ok) continue;
    const data = (await res.json()) as { items: GitHubRepo[] };

    for (const repo of data.items) {
      if (seen.has(repo.html_url)) continue;
      seen.add(repo.html_url);

      if (!MCP_NAME_RE.test(repo.name)) continue;

      const npmName = repo.name.toLowerCase();
      entries.push({
        source: "github",
        name: npmName,
        repoUrl: repo.html_url,
        description: (repo.description || "").slice(0, 500),
        stars: repo.stargazers_count,
        lastCommit: repo.pushed_at,
        installCommand: `npx -y ${npmName}`,
      });
    }
  }

  return entries.slice(0, limit);
}

async function searchNpm(limit: number): Promise<McpRegistryEntry[]> {
  const queries = ["mcp-server", "model-context-protocol"];
  const entries: McpRegistryEntry[] = [];
  const seen = new Set<string>();

  for (const q of queries) {
    if (entries.length >= limit) break;

    const url = `${NPM_SEARCH_URL}?text=${encodeURIComponent(q)}&size=25&quality=0.5&popularity=0.5`;
    const res = await fetch(url);
    if (!res.ok) continue;

    const data = (await res.json()) as { objects: NpmPackage[] };

    for (const pkg of data.objects) {
      const repoUrl = pkg.package.links?.repository || `https://www.npmjs.com/package/${pkg.package.name}`;
      if (seen.has(repoUrl)) continue;
      seen.add(repoUrl);

      entries.push({
        source: "npm",
        name: pkg.package.name,
        repoUrl,
        description: (pkg.package.description || "").slice(0, 500),
        stars: Math.round((pkg.score?.detail?.popularity || 0) * 1000),
        lastCommit: pkg.package.date || null,
        installCommand: `npx -y ${pkg.package.name}`,
      });
    }
  }

  return entries.slice(0, limit);
}

async function upsertEntries(env: Env, entries: McpRegistryEntry[]): Promise<number> {
  const db = getDb(env.DB);
  let count = 0;

  for (const entry of entries) {
    const now = Math.floor(Date.now() / 1000);
    await db
      .insert(mcpRegistryCache)
      .values({
        source: entry.source,
        name: entry.name,
        repoUrl: entry.repoUrl,
        description: entry.description,
        stars: entry.stars,
        lastCommit: entry.lastCommit,
        fetchedAt: now,
      })
      .onConflictDoUpdate({
        target: [mcpRegistryCache.source, mcpRegistryCache.repoUrl],
        set: {
          description: entry.description,
          stars: entry.stars,
          lastCommit: entry.lastCommit,
          fetchedAt: now,
        },
      })
      .run();
    count++;
  }

  return count;
}

interface GitHubRepo {
  full_name: string;
  name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  pushed_at: string;
}

interface NpmPackage {
  package: {
    name: string;
    description: string;
    date: string;
    links?: { repository?: string };
  };
  score?: { detail?: { popularity?: number } };
}
