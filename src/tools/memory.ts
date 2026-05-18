import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { logToolCall } from "../logger";
import type { UserScopedDb } from "../db/scoped";

export function registerMemoryTools(server: McpServer, db: UserScopedDb): void {
  server.tool(
    "get_user_profile",
    "Get what JARVIS knows about you — interests, projects, people, preferences, facts.",
    async () => {
      const t0 = performance.now();
      try {
        const user = await db.getProfile();
        if (!user) {
          logToolCall("get_user_profile", performance.now() - t0, "ok");
          return { content: [{ type: "text" as const, text: "No profile data yet." }] };
        }

        const userFacts = await db.getFacts(50);
        const userPeople = await db.getPeople();

        const parts: string[] = [];
        if (user.name) parts.push(`Name: ${user.name}`);

        const prefs: Record<string, unknown> = JSON.parse(user.prefs ?? "{}");
        const interests = prefs.interests as string[] | undefined;
        const projects = prefs.projects as string[] | undefined;
        const preferences = prefs.preferences as Record<string, unknown> | undefined;

        if (interests?.length) parts.push(`Interests: ${interests.slice(0, 10).join(", ")}`);
        if (projects?.length) parts.push(`Projects: ${projects.slice(0, 10).join(", ")}`);
        if (preferences) {
          const strs = Object.entries(preferences)
            .slice(0, 8)
            .map(([k, v]) => `${k}: ${v}`);
          parts.push(`Preferences: ${strs.join(", ")}`);
        }
        if (userPeople.length) {
          const strs = userPeople
            .slice(0, 10)
            .map((p) => (p.relationship ? `${p.name} (${p.relationship})` : p.name));
          parts.push(`People: ${strs.join(", ")}`);
        }
        if (userFacts.length) {
          const strs = userFacts
            .slice(0, 10)
            .map((f) => f.fact)
            .reverse();
          parts.push(`Facts: ${strs.join("; ")}`);
        }

        const result = parts.length ? parts.join("\n") : "No profile data yet.";
        logToolCall("get_user_profile", performance.now() - t0, "ok");
        return { content: [{ type: "text" as const, text: result }] };
      } catch (e) {
        logToolCall("get_user_profile", performance.now() - t0, "error", String(e));
        return { content: [{ type: "text" as const, text: `Error: ${e}` }], isError: true };
      }
    },
  );

  server.tool(
    "remember_about_user",
    "Remember a fact about the user (preferences, habits, projects, etc.).",
    { fact: z.string().describe("The fact to remember") },
    async ({ fact }) => {
      const t0 = performance.now();
      try {
        const existing = await db.findFact(fact);
        if (existing) {
          logToolCall("remember_about_user", performance.now() - t0, "ok");
          return { content: [{ type: "text" as const, text: `Already known: ${fact}` }] };
        }

        await db.addFact(fact);
        logToolCall("remember_about_user", performance.now() - t0, "ok");
        return { content: [{ type: "text" as const, text: `Noted: ${fact}` }] };
      } catch (e) {
        logToolCall("remember_about_user", performance.now() - t0, "error", String(e));
        return { content: [{ type: "text" as const, text: `Error: ${e}` }], isError: true };
      }
    },
  );

  server.tool(
    "remember_person",
    "Remember a person the user has mentioned (friend, coworker, family, etc.).",
    {
      name: z.string().describe("Person's name"),
      relationship: z.string().optional().describe("How they relate to the user"),
    },
    async ({ name, relationship }) => {
      const t0 = performance.now();
      const rel = relationship ?? "";
      try {
        const existing = await db.findPerson(name);
        const suffix = rel ? ` (${rel})` : "";

        if (existing) {
          await db.updatePerson(existing.id, rel);
          logToolCall("remember_person", performance.now() - t0, "ok");
          return { content: [{ type: "text" as const, text: `Updated: ${name}${suffix}` }] };
        }

        await db.addPerson(name, rel);
        logToolCall("remember_person", performance.now() - t0, "ok");
        return { content: [{ type: "text" as const, text: `Remembered: ${name}${suffix}` }] };
      } catch (e) {
        logToolCall("remember_person", performance.now() - t0, "error", String(e));
        return { content: [{ type: "text" as const, text: `Error: ${e}` }], isError: true };
      }
    },
  );

  server.tool(
    "forget_fact_about_user",
    "Forget a fact about the user by substring match (case-insensitive).",
    { fact_snippet: z.string().describe("Substring to match against stored facts") },
    async ({ fact_snippet }) => {
      const t0 = performance.now();
      try {
        const matches = await db.searchFacts(fact_snippet);

        if (!matches.length) {
          logToolCall("forget_fact_about_user", performance.now() - t0, "ok");
          return {
            content: [{ type: "text" as const, text: `No fact found matching: '${fact_snippet}'` }],
          };
        }

        if (matches.length === 1) {
          await db.deleteFact(matches[0].id);
          logToolCall("forget_fact_about_user", performance.now() - t0, "ok");
          return { content: [{ type: "text" as const, text: `Forgot: ${matches[0].fact}` }] };
        }

        const lines = ["Multiple matches — re-call with a more specific snippet:"];
        matches.forEach((m, i) => lines.push(`  ${i + 1}. ${m.fact}`));
        logToolCall("forget_fact_about_user", performance.now() - t0, "ok");
        return { content: [{ type: "text" as const, text: lines.join("\n") }] };
      } catch (e) {
        logToolCall("forget_fact_about_user", performance.now() - t0, "error", String(e));
        return { content: [{ type: "text" as const, text: `Error: ${e}` }], isError: true };
      }
    },
  );

  server.tool(
    "forget_person",
    "Forget a person from the user's profile by exact name (case-insensitive).",
    { name: z.string().describe("Person's name to forget") },
    async ({ name }) => {
      const t0 = performance.now();
      try {
        const existing = await db.findPerson(name);

        if (!existing) {
          logToolCall("forget_person", performance.now() - t0, "ok");
          return { content: [{ type: "text" as const, text: `No person found named '${name}'` }] };
        }

        await db.deletePerson(existing.id);
        logToolCall("forget_person", performance.now() - t0, "ok");
        return { content: [{ type: "text" as const, text: `Forgot person: ${name}` }] };
      } catch (e) {
        logToolCall("forget_person", performance.now() - t0, "error", String(e));
        return { content: [{ type: "text" as const, text: `Error: ${e}` }], isError: true };
      }
    },
  );
}
