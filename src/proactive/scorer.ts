import { getDb } from "../db/client";
import { mcpRegistryCache, mcpSuggestions, facts } from "../db/schema";
import { eq, gte } from "drizzle-orm";
import { decrypt } from "../crypto/encrypt";
import type { Env } from "../types";
import type { McpSuggestion } from "./types";

const MIN_SAFETY_SCORE = 70;
const NPM_NAME_RE = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;

export async function generateSuggestions(
  env: Env,
  userId: number,
  maxSuggestions: number,
): Promise<McpSuggestion[]> {
  const db = getDb(env.DB);

  const existingSuggestionMcpIds = await db
    .select({ mcpId: mcpSuggestions.mcpId })
    .from(mcpSuggestions)
    .where(eq(mcpSuggestions.userId, userId))
    .all();

  const excludeIds = existingSuggestionMcpIds.map((s) => s.mcpId);

  const candidates = await db
    .select()
    .from(mcpRegistryCache)
    .where(gte(mcpRegistryCache.safetyScore, MIN_SAFETY_SCORE))
    .limit(100)
    .all();

  const filtered = (excludeIds.length > 0
    ? candidates.filter((c) => !excludeIds.includes(c.id))
    : candidates
  ).filter((c) => NPM_NAME_RE.test(c.name));

  if (filtered.length === 0) return [];

  const userContext = await getUserContext(env, userId);

  const scored = filtered.map((entry) => ({
    entry,
    score: scoreRelevance(entry, userContext),
  }));

  scored.sort((a, b) => b.score - a.score);

  const top = scored.slice(0, maxSuggestions).filter((s) => s.score > 0.3);
  const now = Math.floor(Date.now() / 1000);
  const suggestions: McpSuggestion[] = [];

  for (const { entry, score } of top) {
    const reason = generateReason(entry, userContext);

    const [inserted] = await db
      .insert(mcpSuggestions)
      .values({
        userId,
        mcpId: entry.id,
        relevanceScore: score,
        reason,
        status: "pending",
        presentedAt: now,
      })
      .returning({ id: mcpSuggestions.id })
      .all();

    suggestions.push({
      id: inserted.id,
      name: entry.name,
      description: entry.description || "",
      repoUrl: entry.repoUrl,
      relevanceScore: score,
      reason,
      safetyScore: entry.safetyScore || 0,
      status: "pending",
    });
  }

  return suggestions;
}

async function getUserContext(env: Env, userId: number): Promise<UserContext> {
  const db = getDb(env.DB);

  const userFacts = await db
    .select()
    .from(facts)
    .where(eq(facts.userId, userId))
    .all();

  const decryptedFacts: string[] = [];
  for (const f of userFacts) {
    try {
      const decrypted = await decrypt(f.fact, env.ENCRYPTION_KEY, userId);
      decryptedFacts.push(decrypted);
    } catch {
      decryptedFacts.push(f.fact);
    }
  }

  const keywords = extractKeywords(decryptedFacts.join(" "));

  return { facts: decryptedFacts, keywords };
}

function extractKeywords(text: string): string[] {
  const techTerms = new Set([
    "react", "vue", "angular", "svelte", "next", "nuxt",
    "python", "javascript", "typescript", "rust", "go", "java",
    "docker", "kubernetes", "aws", "gcp", "azure", "cloudflare",
    "postgres", "mysql", "redis", "mongodb", "sqlite",
    "github", "gitlab", "jira", "linear", "slack", "discord",
    "notion", "obsidian", "google", "calendar", "email", "gmail",
    "stripe", "square", "shopify", "etsy",
    "api", "rest", "graphql", "grpc", "websocket",
    "tts", "stt", "voice", "audio", "video", "image",
    "pdf", "csv", "excel", "markdown",
    "testing", "ci", "cd", "deploy", "monitor",
  ]);

  const words = text.toLowerCase().split(/\W+/);
  const found = new Set<string>();

  for (const word of words) {
    if (techTerms.has(word)) found.add(word);
  }

  return Array.from(found);
}

function scoreRelevance(
  entry: typeof mcpRegistryCache.$inferSelect,
  context: UserContext,
): number {
  let score = 0;
  const desc = (entry.description || "").toLowerCase();
  const name = entry.name.toLowerCase();
  const combined = `${name} ${desc}`;

  for (const keyword of context.keywords) {
    if (combined.includes(keyword)) {
      score += 0.2;
    }
  }

  if (entry.stars && entry.stars > 100) score += 0.1;
  if (entry.stars && entry.stars > 500) score += 0.1;
  if (entry.safetyScore && entry.safetyScore > 90) score += 0.1;

  return Math.min(1.0, score);
}

function generateReason(
  entry: typeof mcpRegistryCache.$inferSelect,
  context: UserContext,
): string {
  const desc = (entry.description || "").toLowerCase();
  const name = entry.name.toLowerCase();
  const combined = `${name} ${desc}`;

  const matchedKeywords = context.keywords.filter((k) => combined.includes(k));

  if (matchedKeywords.length > 0) {
    return `Matches your interests: ${matchedKeywords.join(", ")}. ${entry.description || ""}`.slice(0, 300);
  }

  return `Popular MCP server (${entry.stars} stars): ${entry.description || ""}`.slice(0, 300);
}

interface UserContext {
  facts: string[];
  keywords: string[];
}
