import { Hono } from "hono";
import { getDb } from "../db/client";
import { mcpSuggestions, mcpRegistryCache } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";
import { sessionAuthApi } from "../auth";
import type { Env, AuthContext } from "../types";

type ProactiveEnv = { Bindings: Env; Variables: { auth: AuthContext } };

const proactive = new Hono<ProactiveEnv>();

proactive.use("/api/proactive/*", sessionAuthApi);

proactive.get("/api/proactive/suggestions", async (c) => {
  const auth = c.get("auth");
  const db = getDb(c.env.DB);

  const suggestions = await db
    .select({
      id: mcpSuggestions.id,
      name: mcpRegistryCache.name,
      description: mcpRegistryCache.description,
      repoUrl: mcpRegistryCache.repoUrl,
      relevanceScore: mcpSuggestions.relevanceScore,
      reason: mcpSuggestions.reason,
      safetyScore: mcpRegistryCache.safetyScore,
      status: mcpSuggestions.status,
      createdAt: mcpSuggestions.createdAt,
    })
    .from(mcpSuggestions)
    .innerJoin(mcpRegistryCache, eq(mcpSuggestions.mcpId, mcpRegistryCache.id))
    .where(eq(mcpSuggestions.userId, auth.userId))
    .orderBy(desc(mcpSuggestions.createdAt))
    .limit(20)
    .all();

  return c.json({ suggestions });
});

const NPM_NAME_RE = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;

proactive.post("/api/proactive/suggestions/:id/approve", async (c) => {
  const auth = c.get("auth");
  const db = getDb(c.env.DB);
  const id = parseInt(c.req.param("id"));
  if (isNaN(id)) return c.json({ error: "invalid_id" }, 400);
  const now = Math.floor(Date.now() / 1000);

  const suggestion = await db
    .select()
    .from(mcpSuggestions)
    .where(and(eq(mcpSuggestions.id, id), eq(mcpSuggestions.userId, auth.userId)))
    .get();

  if (!suggestion) return c.json({ error: "not_found" }, 404);

  const mcp = await db
    .select()
    .from(mcpRegistryCache)
    .where(eq(mcpRegistryCache.id, suggestion.mcpId))
    .get();

  if (!mcp) return c.json({ error: "mcp_not_found" }, 404);

  if (!NPM_NAME_RE.test(mcp.name)) {
    return c.json({ error: "invalid_package_name" }, 400);
  }

  await db
    .update(mcpSuggestions)
    .set({ status: "approved", decidedAt: now })
    .where(eq(mcpSuggestions.id, id))
    .run();

  const doId = c.env.MAC_BRIDGE.idFromName(`user-${auth.userId}`);
  const stub = c.env.MAC_BRIDGE.get(doId);

  await stub.fetch(new Request(`http://do/rpc?userId=${auth.userId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      method: "send_to_daemon",
      params: {
        type: "mcp_install",
        id: crypto.randomUUID(),
        name: mcp.name,
        command: `npx -y ${mcp.name}`,
        config: { name: mcp.name, command: `npx -y ${mcp.name}` },
      },
    }),
  }));

  return c.json({ status: "approved", installing: true });
});

proactive.post("/api/proactive/suggestions/:id/reject", async (c) => {
  const auth = c.get("auth");
  const db = getDb(c.env.DB);
  const id = parseInt(c.req.param("id"));
  if (isNaN(id)) return c.json({ error: "invalid_id" }, 400);
  const now = Math.floor(Date.now() / 1000);

  await db
    .update(mcpSuggestions)
    .set({ status: "rejected", decidedAt: now })
    .where(and(eq(mcpSuggestions.id, id), eq(mcpSuggestions.userId, auth.userId)))
    .run();

  return c.json({ status: "rejected" });
});

proactive.post("/api/proactive/update/:component", async (c) => {
  const auth = c.get("auth");
  const component = c.req.param("component") as "claude_cli" | "daemon";

  if (component !== "claude_cli" && component !== "daemon") {
    return c.json({ error: "invalid_component" }, 400);
  }

  const command =
    component === "claude_cli"
      ? "npm update -g @anthropic-ai/claude-code"
      : "cd ~/jarvis && git pull --ff-only && npm install";

  const doId = c.env.MAC_BRIDGE.idFromName(`user-${auth.userId}`);
  const stub = c.env.MAC_BRIDGE.get(doId);

  await stub.fetch(new Request(`http://do/rpc?userId=${auth.userId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      method: "send_to_daemon",
      params: {
        type: "self_update",
        id: crypto.randomUUID(),
        component,
        command,
      },
    }),
  }));

  return c.json({ status: "update_sent" });
});

export { proactive };
