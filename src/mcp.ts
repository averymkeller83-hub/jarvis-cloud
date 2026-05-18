import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getDb } from "./db/client";
import { UserScopedDb } from "./db/scoped";
import { registerMemoryTools } from "./tools/memory";
import { registerWeatherTools } from "./tools/weather";
import { registerAceTools } from "./tools/ace";
import type { Env } from "./types";

export function createMcpServer(env: Env, userId: number, plan: string, foundingMember: boolean): McpServer {
  const server = new McpServer({
    name: "jarvis-cloud",
    version: "2.0.0",
  });

  const db = getDb(env.DB);
  const scopedDb = new UserScopedDb(db, userId, env.ENCRYPTION_KEY);
  registerMemoryTools(server, scopedDb);
  registerWeatherTools(server);

  const isPro = plan === "pro" || foundingMember;
  if (isPro) {
    registerAceTools(server, env, userId);
  }

  const toolCount = isPro ? 11 : 4;
  console.log(
    JSON.stringify({ ts: new Date().toISOString(), event: "server_created", tools: toolCount, userId, plan }),
  );

  return server;
}
