import { readFileSync } from "fs";
import { join } from "path";

const home = process.env.HOME!;
const profilePath = join(home, "Desktop/projects/jarvis-mcp/config/user_profile.json");

function esc(s: string): string {
  return s.replace(/'/g, "''");
}

let profile: Record<string, unknown>;
try {
  profile = JSON.parse(readFileSync(profilePath, "utf-8"));
} catch {
  console.error(`Could not read ${profilePath}`);
  process.exit(1);
}

const statements: string[] = [];

const prefs = JSON.stringify({
  interests: profile.interests ?? [],
  projects: profile.projects ?? [],
  preferences: profile.preferences ?? {},
});
statements.push(
  `INSERT OR IGNORE INTO users (id, name, timezone, prefs) VALUES (1, '${esc(String(profile.name ?? ""))}', 'America/Indianapolis', '${esc(prefs)}');`,
);

const profileFacts = (profile.facts ?? []) as string[];
for (const fact of profileFacts) {
  statements.push(
    `INSERT OR IGNORE INTO facts (user_id, fact, source) VALUES (1, '${esc(fact)}', 'seed');`,
  );
}

const profilePeople = (profile.people ?? []) as Array<{ name: string; relationship?: string }>;
for (const person of profilePeople) {
  statements.push(
    `INSERT OR IGNORE INTO people (user_id, name, relationship) VALUES (1, '${esc(person.name)}', '${esc(person.relationship ?? "")}');`,
  );
}

console.log("-- JARVIS Cloud seed data from user_profile.json");
console.log("-- Usage: npx tsx scripts/seed.ts > /tmp/seed.sql");
console.log("--   Local:  npx wrangler d1 execute jarvis-memory --local --file=/tmp/seed.sql");
console.log("--   Remote: npx wrangler d1 execute jarvis-memory --remote --file=/tmp/seed.sql");
console.log("");
console.log(statements.join("\n"));
