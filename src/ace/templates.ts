const STOP_WORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "shall", "can", "to", "of", "in", "for",
  "on", "with", "at", "by", "from", "as", "into", "through", "during",
  "before", "after", "and", "but", "or", "nor", "not", "so", "yet",
  "it", "its", "this", "that", "these", "those", "i", "me", "my",
  "you", "your", "he", "she", "we", "they", "them", "please", "just",
  "then", "now", "go", "get", "make", "let", "put", "take",
]);

function extractKeywords(text: string): Set<string> {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);
  return new Set(words.filter(w => w.length > 1 && !STOP_WORDS.has(w)));
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const word of a) {
    if (b.has(word)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

const MATCH_THRESHOLD = 0.4;

export async function storeTemplate(
  storage: DurableObjectStorage,
  instruction: string,
  actions: string[],
): Promise<void> {
  const keywords = Array.from(extractKeywords(instruction));
  if (keywords.length === 0) return;
  const key = `tpl:${keywords.sort().join(":")}`;
  await storage.put(key, { keywords, actions, instruction: instruction.slice(0, 200) });
}

interface StoredTemplate {
  keywords: string[];
  actions: string[];
  instruction: string;
}

export async function matchTemplate(
  storage: DurableObjectStorage,
  instruction: string,
): Promise<string[] | null> {
  const queryKeywords = extractKeywords(instruction);
  if (queryKeywords.size === 0) return null;

  const templates = await storage.list<StoredTemplate>({ prefix: "tpl:" });
  let bestMatch: string[] | null = null;
  let bestScore = 0;

  templates.forEach((raw) => {
    if (Array.isArray(raw)) return;
    const tpl = raw as StoredTemplate;
    if (!tpl.keywords || !tpl.actions) return;
    const tplKeywords = new Set(tpl.keywords);
    const score = jaccardSimilarity(queryKeywords, tplKeywords);
    if (score > bestScore && score >= MATCH_THRESHOLD) {
      bestScore = score;
      bestMatch = tpl.actions;
    }
  });

  return bestMatch;
}
