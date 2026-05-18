import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { logToolCall } from "../logger";
import type { Env } from "../types";

type RpcResult = { ok: boolean; result?: string; error?: string; screenshot_b64?: string };
type McpContent = Array<{ type: "text"; text: string } | { type: "image"; data: string; mimeType: string }>;

async function doAceRpc(
  env: Env,
  userId: number,
  method: string,
  params: Record<string, unknown>,
): Promise<{ content: McpContent }> {
  const t0 = performance.now();
  try {
    const id = env.MAC_BRIDGE.idFromName(`user-${userId}`);
    const stub = env.MAC_BRIDGE.get(id);
    const resp = await stub.fetch(new Request(`http://do/rpc?userId=${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method, params }),
    }));
    const data = await resp.json() as RpcResult;

    if (!data.ok) {
      logToolCall(method, performance.now() - t0, "error", data.error);
      const errMsg = data.error ?? "unknown";
      if (errMsg === "Mac daemon not connected") {
        return { content: [{ type: "text", text: "Daemon not connected. Start it with: launchctl kickstart gui/$(id -u)/com.jarvis.ace-daemon — then retry." }] };
      }
      return { content: [{ type: "text", text: `Error: ${errMsg}` }] };
    }

    const content: McpContent = [{ type: "text", text: data.result ?? "done" }];
    if (data.screenshot_b64) {
      content.push({ type: "image", data: data.screenshot_b64, mimeType: "image/png" });
    }
    logToolCall(method, performance.now() - t0, "ok");
    return { content };
  } catch (e) {
    logToolCall(method, performance.now() - t0, "error", String(e));
    return { content: [{ type: "text", text: `Error: ${e}` }] };
  }
}

export function registerAceTools(server: McpServer, env: Env, userId: number): void {
  server.tool(
    "run_task",
    "Send a natural-language instruction to Ace for execution on the Mac",
    {
      instruction: z.string().describe("What to do on the Mac"),
      budget: z.number().int().min(1).max(100).default(25).describe("Max steps"),
    },
    async ({ instruction, budget }) => doAceRpc(env, userId, "run_task", { instruction, budget }),
  );

  server.tool(
    "get_screenshot",
    "Capture the current Mac screen",
    {},
    async () => doAceRpc(env, userId, "get_screenshot", {}),
  );

  server.tool(
    "get_status",
    "Check daemon connection status and current task",
    {},
    async () => doAceRpc(env, userId, "get_status", {}),
  );

  server.tool(
    "cancel_task",
    "Abort the currently running task",
    {},
    async () => doAceRpc(env, userId, "cancel_task", {}),
  );

  server.tool(
    "list_templates",
    "Show learned action templates",
    {},
    async () => doAceRpc(env, userId, "list_templates", {}),
  );
}
