import { DurableObject } from "cloudflare:workers";
import { rewriteInstruction, checkPreflight, assessRisk, DEFAULT_BUDGET } from "./guardrails";
import type { RiskAssessment } from "./guardrails";
import { matchTemplate, storeTemplate } from "./templates";
import { sendPushToUser } from "../push/send";
import { audit } from "../audit";
import { getDueJobs, markJobRan } from "../proactive/scheduler";
import { runDiscovery } from "../proactive/discovery";
import { runSafetyScans } from "../proactive/scanner";
import { checkForUpdates } from "../proactive/updater";
import { generateSuggestions } from "../proactive/scorer";
import type { Env } from "../types";

interface Task {
  id: string;
  instruction: string;
  budget: number;
  status: "queued" | "running" | "done" | "error" | "cancelled";
  steps: number;
  result?: string;
  error?: string;
}

type DaemonMessage =
  | { type: "task_progress"; id: string; step: number; action: string; screenshot_b64?: string }
  | { type: "task_complete"; id: string; result: string; steps: number; actions?: string[]; screenshot_b64?: string }
  | { type: "task_error"; id: string; error: string }
  | { type: "screenshot"; id: string; b64: string }
  | { type: "heartbeat" }
  | { type: "chat_response"; id: string; message: string }
  | { type: "chat_stream"; id: string; delta: string }
  | { type: "chat_done"; id: string }
  | { type: "scheduled_message"; id: string; job_name: string; message: string }
  | { type: "sweep_confirm"; id: string; findings: string; fix_plan: string }
  | { type: "automation_suggest"; id: string; name: string; description: string; job_spec: string }
  | { type: "proactive_result"; id: string; success: boolean; detail: string }
  | { type: "agent_snapshot"; snapshot: Record<string, unknown> }
  | { type: "agent_event"; event: Record<string, unknown> }
  | { type: "usage_report"; id: string; input_tokens: number; output_tokens: number; cost_usd: number; ts: string; session_total: { cost_usd: number; input_tokens: number; output_tokens: number } };

export class MacBridge extends DurableObject<Env> {
  private currentTask: Task | null = null;
  private taskQueue: Task[] = [];
  private pendingRpcs: Map<string, { resolve: (v: { result: string; screenshot_b64?: string }) => void; timer: ReturnType<typeof setTimeout> }> = new Map();
  private agentSpawnChatIds: Set<string> = new Set();
  private vncBuffer: (string | ArrayBuffer)[] = [];
  private static readonly VNC_BUFFER_MAX = 50;
  private userId: number | null = null;
  private pendingConfirmations: Map<string, { instruction: string; budget: number; risk: RiskAssessment; resolve: (v: { result: string }) => void; timer: ReturnType<typeof setTimeout> }> = new Map();
  private pendingSweeps: Map<string, "sweep" | "automation"> = new Map();

  private async ensureUserId(): Promise<number | null> {
    if (this.userId !== null) return this.userId;
    const stored = await this.ctx.storage.get<number>("userId");
    if (stored !== undefined) this.userId = stored;
    return this.userId;
  }

  private async setUserId(id: number): Promise<void> {
    this.userId = id;
    await this.ctx.storage.put("userId", id);
  }

  private getDaemonWs(): WebSocket | null {
    const sockets = this.ctx.getWebSockets("daemon");
    return sockets.length > 0 ? sockets[sockets.length - 1] : null;
  }

  private getClientSockets(): WebSocket[] {
    return this.ctx.getWebSockets("client");
  }

  private broadcastToClients(data: Record<string, unknown>, persist = false): void {
    const msg = JSON.stringify(data);
    const clients = this.getClientSockets();
    for (const client of clients) {
      try { client.send(msg); } catch {}
    }
    if (persist) {
      this.ctx.waitUntil(this.storeOfflineMessage(data));
    }
  }

  private async storeChatMsg(role: string, text: string, id?: string): Promise<void> {
    const messages = (await this.ctx.storage.get<{ role: string; text: string; ts: number; id?: string }[]>("chat_messages")) || [];
    if (id && messages.some(m => m.id === id && m.role === role)) return;
    messages.push({ role, text, ts: Date.now(), id });
    if (messages.length > 200) messages.splice(0, messages.length - 200);
    await this.ctx.storage.put("chat_messages", messages);
  }

  private async getChatHistory(): Promise<{ role: string; text: string; ts: number }[]> {
    return (await this.ctx.storage.get<{ role: string; text: string; ts: number }[]>("chat_messages")) || [];
  }

  private async sendChatHistory(ws: WebSocket): Promise<void> {
    const history = await this.getChatHistory();
    if (history.length === 0) return;
    try { ws.send(JSON.stringify({ type: "chat_history", messages: history })); } catch {}
  }

  private async storeOfflineMessage(data: Record<string, unknown>): Promise<void> {
    const messages = (await this.ctx.storage.get<Record<string, unknown>[]>("offline_messages")) || [];
    messages.push({ ...data, _ts: Date.now() });
    if (messages.length > 50) messages.splice(0, messages.length - 50);
    await this.ctx.storage.put("offline_messages", messages);
  }

  private async replayOfflineMessages(ws: WebSocket): Promise<void> {
    const messages = await this.ctx.storage.get<Record<string, unknown>[]>("offline_messages");
    if (!messages || messages.length === 0) return;
    const cutoff = Date.now() - 86_400_000;
    const kept: Record<string, unknown>[] = [];
    for (const msg of messages) {
      try { ws.send(JSON.stringify(msg)); } catch {}
      if ((msg._ts as number) > cutoff) kept.push(msg);
    }
    if (kept.length > 0) {
      await this.ctx.storage.put("offline_messages", kept);
    } else {
      await this.ctx.storage.delete("offline_messages");
    }
  }

  private broadcastToAgentClients(data: Record<string, unknown>): void {
    const msg = JSON.stringify(data);
    for (const client of this.ctx.getWebSockets("agent-client")) {
      try { client.send(msg); } catch {}
    }
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    const uid = url.searchParams.get("userId");
    if (uid) await this.setUserId(parseInt(uid));

    if (url.pathname === "/rpc") {
      return this.handleRpc(request);
    }

    if (url.pathname === "/remote-url") {
      if (request.method === "PUT" || request.method === "POST") {
        const body = await request.json<{ url: string }>();
        await this.ctx.storage.put("remote_control_url", body.url);
        return Response.json({ ok: true });
      }
      const rcUrl = await this.ctx.storage.get<string>("remote_control_url");
      return Response.json({ url: rcUrl || null });
    }

    if (url.pathname === "/chat") {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("expected websocket", { status: 426 });
      }
      const pair = new WebSocketPair();
      this.ctx.acceptWebSocket(pair[1], ["client"]);

      const welcome = JSON.stringify({
        type: "welcome",
        daemon_connected: this.getDaemonWs() !== null,
      });
      pair[1].send(welcome);
      this.ctx.waitUntil(this.replayOfflineMessages(pair[1]));
      this.ctx.waitUntil(this.sendChatHistory(pair[1]));

      const protocol = request.headers.get("Sec-WebSocket-Protocol") ?? "";
      return new Response(null, {
        status: 101,
        webSocket: pair[0],
        headers: protocol ? { "Sec-WebSocket-Protocol": protocol } : {},
      });
    }

    if (url.pathname === "/vnc") {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("expected websocket", { status: 426 });
      }
      const pair = new WebSocketPair();
      this.ctx.acceptWebSocket(pair[1], ["vnc-client"]);

      const daemon = this.getDaemonWs();
      if (daemon) {
        daemon.send(JSON.stringify({ type: "vnc_start" }));
      }

      const protocol = request.headers.get("Sec-WebSocket-Protocol") ?? "";
      return new Response(null, {
        status: 101,
        webSocket: pair[0],
        headers: protocol ? { "Sec-WebSocket-Protocol": protocol } : {},
      });
    }

    if (url.pathname === "/vnc-tunnel") {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("expected websocket", { status: 426 });
      }
      const pair = new WebSocketPair();
      this.ctx.acceptWebSocket(pair[1], ["vnc-daemon"]);

      const protocol = request.headers.get("Sec-WebSocket-Protocol") ?? "";
      return new Response(null, {
        status: 101,
        webSocket: pair[0],
        headers: protocol ? { "Sec-WebSocket-Protocol": protocol } : {},
      });
    }

    if (url.pathname === "/agents") {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("expected websocket", { status: 426 });
      }
      const pair = new WebSocketPair();
      this.ctx.acceptWebSocket(pair[1], ["agent-client"]);
      const protocol = request.headers.get("Sec-WebSocket-Protocol") ?? "";
      return new Response(null, {
        status: 101,
        webSocket: pair[0],
        headers: protocol ? { "Sec-WebSocket-Protocol": protocol } : {},
      });
    }

    if (url.pathname !== "/daemon") {
      return new Response(`Unknown path: ${url.pathname}`, { status: 404 });
    }

    for (const old of this.ctx.getWebSockets("daemon")) {
      try { old.close(1000, "new daemon connection"); } catch {}
    }

    const pair = new WebSocketPair();
    this.ctx.acceptWebSocket(pair[1], ["daemon"]);

    this.broadcastToClients({ type: "daemon_status", connected: true });

    const existing = await this.ctx.storage.getAlarm();
    if (!existing) {
      await this.ctx.storage.setAlarm(Date.now() + 60_000);
    }

    const protocol = request.headers.get("Sec-WebSocket-Protocol") ?? "";
    return new Response(null, {
      status: 101,
      webSocket: pair[0],
      headers: protocol ? { "Sec-WebSocket-Protocol": protocol } : {},
    });
  }

  async webSocketMessage(_ws: WebSocket, raw: string | ArrayBuffer): Promise<void> {
    const tags = this.ctx.getTags(_ws);

    if (tags.includes("vnc-client")) {
      const daemons = this.ctx.getWebSockets("vnc-daemon");
      if (daemons.length === 0) {
        if (this.vncBuffer.length < MacBridge.VNC_BUFFER_MAX) {
          this.vncBuffer.push(raw);
        }
      } else {
        for (const d of daemons) {
          try { d.send(raw); } catch {}
        }
      }
      return;
    }

    if (tags.includes("vnc-daemon")) {
      if (this.vncBuffer.length > 0) {
        for (const buffered of this.vncBuffer) {
          try { _ws.send(buffered); } catch {}
        }
        this.vncBuffer = [];
      }
      for (const c of this.ctx.getWebSockets("vnc-client")) {
        try { c.send(raw); } catch {}
      }
      return;
    }

    const text = typeof raw === "string" ? raw : new TextDecoder().decode(raw);
    const msg = JSON.parse(text) as DaemonMessage | { type: "chat"; id: string; message: string };

    if (tags.includes("agent-client")) {
      const agentMsg = msg as { type: string; instruction?: string };
      if (agentMsg.type === "spawn_agent" && agentMsg.instruction) {
        const daemon = this.getDaemonWs();
        if (daemon) {
          const chatId = crypto.randomUUID();
          this.agentSpawnChatIds.add(chatId);
          daemon.send(JSON.stringify({ type: "chat", id: chatId, message: agentMsg.instruction }));
        }
      }
      return;
    }

    if (tags.includes("client")) {
      return this.handleClientMessage(_ws, msg as { type: "chat"; id: string; message: string });
    }

    if (msg.type === "heartbeat") {
      try { _ws.send(JSON.stringify({ type: "heartbeat_ack" })); } catch {}
      return;
    }

    if (msg.type === "proactive_result") {
      this.broadcastToClients(msg as Record<string, unknown>);
      return;
    }

    if (msg.type === "agent_snapshot" || msg.type === "agent_event") {
      this.broadcastToAgentClients(msg as Record<string, unknown>);
      if (msg.type === "agent_event") {
        const ev = (msg as { event: Record<string, unknown> }).event;
        const uid = await this.ensureUserId();
        if (ev.type === "agent_complete" && uid && this.ctx.getWebSockets("agent-client").length === 0) {
          this.ctx.waitUntil(
            sendPushToUser(this.env, uid!, {
              title: "JARVIS — Agent Complete",
              body: `Agent finished — $${((ev.costUsd as number) || 0).toFixed(4)}`,
              tag: "agent-complete",
            }),
          );
        }
      }
      return;
    }

    if ((msg as Record<string, unknown>).type === "health_alert") {
      const alertMsg = msg as unknown as { message: string; issues: string[] };
      this.broadcastToClients({ type: "chat_response", id: crypto.randomUUID(), message: alertMsg.message }, true);
      const uid = await this.ensureUserId();
      if (uid) {
        this.ctx.waitUntil(
          sendPushToUser(this.env, uid, {
            title: "JARVIS — Health Alert",
            body: alertMsg.issues.join(", ").slice(0, 200),
            tag: "health-alert",
          }),
        );
      }
      return;
    }

    if (msg.type === "usage_report") {
      this.broadcastToClients(msg as Record<string, unknown>);
      const uid = await this.ensureUserId();
      if (uid) {
        const today = new Date().toISOString().slice(0, 10);
        const key = `usage:${today}`;
        const existing = (await this.ctx.storage.get<{ cost: number; input: number; output: number; count: number }>(key)) || { cost: 0, input: 0, output: 0, count: 0 };
        existing.cost += msg.cost_usd;
        existing.input += msg.input_tokens;
        existing.output += msg.output_tokens;
        existing.count += 1;
        await this.ctx.storage.put(key, existing);
      }
      return;
    }

    if (msg.type === "command_response") {
      this.broadcastToClients({ type: "chat_response", id: crypto.randomUUID(), message: (msg as unknown as { message: string }).message });
      return;
    }

    if (msg.type === "chat_progress") {
      this.broadcastToClients(msg as Record<string, unknown>, false);
      return;
    }

    if (msg.type === "chat_response" || msg.type === "chat_stream" || msg.type === "chat_done" || msg.type === "scheduled_message") {
      const shouldPersist = msg.type === "chat_response" || msg.type === "scheduled_message";
      this.broadcastToClients(msg as Record<string, unknown>, shouldPersist);
      if (msg.type === "chat_response" || msg.type === "scheduled_message") {
        const text = (msg as { message: string }).message;
        const id = (msg as { id: string }).id;
        this.ctx.waitUntil(this.storeChatMsg("jarvis", text, id));
      }
      const chatId = (msg as { id?: string }).id;
      if (chatId && this.agentSpawnChatIds.has(chatId)) {
        this.broadcastToAgentClients(msg as Record<string, unknown>);
        if (msg.type === "chat_done" || msg.type === "chat_response") {
          this.agentSpawnChatIds.delete(chatId);
        }
      }
      const chatUserId = await this.ensureUserId();
      if (chatUserId) {
        if (msg.type === "scheduled_message") {
          this.ctx.waitUntil(
            sendPushToUser(this.env, chatUserId, {
              title: `JARVIS — ${(msg as { job_name: string }).job_name}`,
              body: (msg as { message: string }).message.slice(0, 200),
              tag: "scheduled",
            }),
          );
        } else if (msg.type === "chat_response") {
          this.ctx.waitUntil(
            sendPushToUser(this.env, chatUserId, {
              title: "JARVIS",
              body: (msg as { message: string }).message.slice(0, 200),
              tag: "chat",
            }),
          );
        }
      }
      return;
    }

    if (msg.type === "sweep_confirm") {
      const sweepMsg = msg as unknown as { id: string; findings: string; fix_plan: string };
      this.pendingSweeps.set(sweepMsg.id, "sweep");
      this.broadcastToClients({
        type: "confirm_task",
        id: sweepMsg.id,
        risk_tier: "sweep",
        risk_reason: "Bug sweep found issues",
        instruction: sweepMsg.findings,
        message: sweepMsg.fix_plan,
      }, true);
      const uid = await this.ensureUserId();
      if (uid) {
        this.ctx.waitUntil(
          sendPushToUser(this.env, uid, {
            title: "JARVIS — Sweep Found Issues",
            body: "Bug sweep found issues that need fixes. Open chat to review.",
            tag: "sweep-confirm",
          }),
        );
      }
      const timer = setTimeout(() => this.pendingSweeps.delete(sweepMsg.id), 600_000);
      void timer;
      return;
    }

    if (msg.type === "automation_suggest") {
      const suggestion = msg as unknown as { id: string; name: string; description: string; job_spec: string };
      this.pendingSweeps.set(suggestion.id, "automation");
      this.broadcastToClients({
        type: "confirm_task",
        id: suggestion.id,
        risk_tier: "automation",
        risk_reason: suggestion.name,
        instruction: suggestion.description,
        message: suggestion.job_spec,
      }, true);
      const uid = await this.ensureUserId();
      if (uid) {
        this.ctx.waitUntil(
          sendPushToUser(this.env, uid, {
            title: "JARVIS — Automation Suggestion",
            body: `New idea: ${suggestion.name}. Open chat to review.`,
            tag: "automation-suggest",
          }),
        );
      }
      const autoTimer = setTimeout(() => this.pendingSweeps.delete(suggestion.id), 86_400_000);
      void autoTimer;
      return;
    }

    if (msg.type === "task_progress") {
      if (this.currentTask?.id === msg.id) {
        this.currentTask.steps = msg.step;
      }
      return;
    }

    if (msg.type === "task_complete") {
      if (this.currentTask?.id === msg.id) {
        this.currentTask.status = "done";
        this.currentTask.result = msg.result;
        this.currentTask.steps = msg.steps;

        if (msg.actions && msg.actions.length > 0) {
          await storeTemplate(this.ctx.storage, this.currentTask.instruction, msg.actions);
        }
      }
      this.resolvePending(msg.id, { result: msg.result, screenshot_b64: msg.screenshot_b64 });
      this.currentTask = null;
      this.drainQueue();
      return;
    }

    if (msg.type === "task_error") {
      if (this.currentTask?.id === msg.id) {
        this.currentTask.status = "error";
        this.currentTask.error = msg.error;
      }
      this.resolvePending(msg.id, { result: `Error: ${msg.error}` });
      this.currentTask = null;
      this.drainQueue();
      return;
    }

    if (msg.type === "screenshot") {
      if (msg.id.startsWith("client:")) {
        this.broadcastToClients({ type: "screenshot", id: msg.id.slice(7), b64: msg.b64 });
      } else {
        this.resolvePending(msg.id, { result: msg.b64 });
      }
      return;
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    const tags = this.ctx.getTags(ws);
    if (tags.includes("daemon")) {
      this.broadcastToClients({ type: "daemon_status", connected: false });
    }
    if (tags.includes("vnc-client")) {
      for (const d of this.ctx.getWebSockets("vnc-daemon")) {
        try { d.close(1000, "client disconnected"); } catch {}
      }
    }
    if (tags.includes("vnc-daemon")) {
      for (const c of this.ctx.getWebSockets("vnc-client")) {
        try { c.close(1000, "tunnel closed"); } catch {}
      }
    }
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    const tags = this.ctx.getTags(ws);
    if (tags.includes("daemon")) {
      this.broadcastToClients({ type: "daemon_status", connected: false });
    }
    if (tags.includes("vnc-client")) {
      for (const d of this.ctx.getWebSockets("vnc-daemon")) {
        try { d.close(1011, "client error"); } catch {}
      }
    }
    if (tags.includes("vnc-daemon")) {
      for (const c of this.ctx.getWebSockets("vnc-client")) {
        try { c.close(1011, "tunnel error"); } catch {}
      }
    }
  }

  async alarm(): Promise<void> {
    const jobs = await getDueJobs(this.env);

    for (const job of jobs) {
      try {
        switch (job.jobType) {
          case "mcp_discovery":
            await runDiscovery(this.env, job.config);
            break;
          case "safety_scan":
            await runSafetyScans(this.env, job.config);
            break;
          case "update_check":
            await this.handleUpdateCheck(job.config);
            break;
          case "suggest":
            await this.handleSuggest(job.config);
            break;
        }
        await markJobRan(this.env, job.id);
      } catch (e) {
        console.error(`Proactive job ${job.jobType} failed:`, e);
      }
    }

    await this.ctx.storage.setAlarm(Date.now() + 3600_000);
  }

  private async handleUpdateCheck(config: Record<string, unknown>): Promise<void> {
    const updates = await checkForUpdates(this.env, config);
    const uid = await this.ensureUserId();

    for (const update of updates) {
      if (!update.updateAvailable) continue;

      const storageKey = `last-notified-${update.component}`;
      const lastNotified = await this.ctx.storage.get<string>(storageKey);
      if (lastNotified === update.latestVersion) continue;
      await this.ctx.storage.put(storageKey, update.latestVersion);

      this.broadcastToClients({
        type: "proactive_suggestion",
        category: "update",
        title: `${update.component === "claude_cli" ? "Claude Code" : "JARVIS Daemon"} Update Available`,
        detail: `Version ${update.latestVersion} is available (you have ${update.currentVersion || "unknown"}).`,
        action_id: `update-${update.component}`,
        data: update,
      }, true);

      if (uid) {
        this.ctx.waitUntil(
          sendPushToUser(this.env, uid, {
            title: "JARVIS — Update Available",
            body: `${update.component === "claude_cli" ? "Claude Code" : "Daemon"} ${update.latestVersion} is ready to install.`,
            tag: "proactive-update",
          }),
        );
      }
    }
  }

  private async handleSuggest(config: Record<string, unknown>): Promise<void> {
    const uid = await this.ensureUserId();
    if (!uid) return;
    const maxSuggestions = (config.max_suggestions_per_user as number) || 3;
    const suggestions = await generateSuggestions(this.env, uid, maxSuggestions);

    for (const suggestion of suggestions) {
      this.broadcastToClients({
        type: "proactive_suggestion",
        category: "mcp",
        title: `MCP Server: ${suggestion.name}`,
        detail: suggestion.reason,
        action_id: `mcp-${suggestion.id}`,
        data: suggestion,
      }, true);

      this.ctx.waitUntil(
        sendPushToUser(this.env, uid, {
          title: "JARVIS — Found Something Useful",
          body: `${suggestion.name}: ${suggestion.reason.slice(0, 150)}`,
          tag: "proactive-mcp",
        }),
      );
    }
  }

  private async handleClientMessage(ws: WebSocket, msg: { type: string; id: string; message: string }): Promise<void> {
    if (msg.type === "chat_history_upload") {
      const uploaded = (msg as unknown as { messages: { role: string; text: string; ts: number }[] }).messages;
      if (Array.isArray(uploaded) && uploaded.length > 0) {
        const existing = (await this.ctx.storage.get<{ role: string; text: string; ts: number; id?: string }[]>("chat_messages")) || [];
        const existingTexts = new Set(existing.map(m => m.text));
        let added = 0;
        for (const m of uploaded) {
          if (m.text && !existingTexts.has(m.text)) {
            existing.push({ role: m.role, text: m.text, ts: m.ts || Date.now() });
            existingTexts.add(m.text);
            added++;
          }
        }
        if (added > 0) {
          existing.sort((a, b) => (a.ts || 0) - (b.ts || 0));
          if (existing.length > 200) existing.splice(0, existing.length - 200);
          await this.ctx.storage.put("chat_messages", existing);
        }
      }
      return;
    }

    if (msg.type === "ping") {
      try { ws.send(JSON.stringify({ type: "pong" })); } catch {}
      return;
    }

    const daemon = this.getDaemonWs();

    if (msg.type === "command") {
      const fullCmd = (msg as unknown as { command: string }).command;
      const cmdKey = fullCmd.split(" ")[0].toLowerCase();
      const cmdArgs = fullCmd.slice(cmdKey.length).trim();

      if (cmdKey === "cost") {
        const today = new Date().toISOString().slice(0, 10);
        const usage = await this.ctx.storage.get<{ cost: number; input: number; output: number; count: number }>(`usage:${today}`);
        const body = usage
          ? `Today: ${usage.count} messages, $${usage.cost.toFixed(4)} (${usage.input.toLocaleString()} in / ${usage.output.toLocaleString()} out)`
          : "No usage recorded today.";
        ws.send(JSON.stringify({ type: "chat_response", id: crypto.randomUUID(), message: body }));
        return;
      }

      if (!daemon) {
        ws.send(JSON.stringify({ type: "chat_response", id: crypto.randomUUID(), message: "Mac daemon not connected." }));
        return;
      }
      const commandMap: Record<string, string> = {
        clear: "clear_session",
        pause: "pause_automations",
        resume: "resume_automations",
        jobs: "list_jobs",
        compact: "compact_session",
        enable: "enable_job",
        disable: "disable_job",
        help: "get_help",
      };
      const daemonType = commandMap[cmdKey];
      if (daemonType) {
        daemon.send(JSON.stringify({ type: daemonType, args: cmdArgs }));
      } else {
        daemon.send(JSON.stringify({ type: "chat", id: crypto.randomUUID(), message: `/${fullCmd}` }));
      }
      return;
    }

    if (msg.type === "chat") {
      const auditUserId = await this.ensureUserId();
      if (auditUserId) {
        audit(this.env.AUDIT_DB, auditUserId, "chat_message", msg.message.slice(0, 500), undefined, this.env.ENCRYPTION_KEY);
      }
      this.ctx.waitUntil(this.storeChatMsg("user", msg.message, msg.id));
      if (!daemon) {
        ws.send(JSON.stringify({
          type: "error",
          id: msg.id,
          message: "Mac daemon not connected. Start the daemon on your Mac to enable remote access.",
        }));
        return;
      }
      const chatPayload: Record<string, unknown> = { type: "chat", id: msg.id, message: msg.message };
      if ((msg as unknown as { attachments?: unknown[] }).attachments) {
        chatPayload.attachments = (msg as unknown as { attachments: unknown[] }).attachments;
      }
      daemon.send(JSON.stringify(chatPayload));
      return;
    }

    if (msg.type === "confirm_task") {
      const pendingKind = this.pendingSweeps.get(msg.id);
      if (pendingKind) {
        this.pendingSweeps.delete(msg.id);
        const approved = msg.message === "approve";
        if (daemon) {
          if (pendingKind === "sweep") {
            daemon.send(JSON.stringify({ type: approved ? "sweep_approved" : "sweep_rejected", id: msg.id }));
          } else {
            daemon.send(JSON.stringify({ type: approved ? "automation_approved" : "automation_rejected", id: msg.id }));
          }
        }
        const label = pendingKind === "sweep" ? "Sweep fixes" : "Automation";
        ws.send(JSON.stringify({ type: "chat_response", id: crypto.randomUUID(), message: approved ? `${label} approved.` : `${label} rejected.` }));
        return;
      }
      const pending = this.pendingConfirmations.get(msg.id);
      if (!pending) {
        ws.send(JSON.stringify({ type: "error", id: msg.id, message: "No pending confirmation for this task." }));
        return;
      }
      clearTimeout(pending.timer);
      this.pendingConfirmations.delete(msg.id);
      if (msg.message === "approve") {
        if (!daemon) {
          ws.send(JSON.stringify({ type: "error", id: msg.id, message: "Daemon not connected" }));
          pending.resolve({ result: "Daemon disconnected during confirmation." });
          return;
        }
        const id = crypto.randomUUID();
        const task: Task = { id, instruction: pending.instruction, budget: pending.budget, status: "running", steps: 0 };
        this.currentTask = task;
        const rewritten = rewriteInstruction(pending.instruction);
        daemon.send(JSON.stringify({ type: "task", id, instruction: rewritten, budget: pending.budget }));
        ws.send(JSON.stringify({ type: "chat_response", id: crypto.randomUUID(), message: `Approved. Executing: ${pending.instruction.slice(0, 100)}` }));
        pending.resolve({ result: "Task approved and dispatched." });
      } else {
        ws.send(JSON.stringify({ type: "chat_response", id: crypto.randomUUID(), message: "Task cancelled." }));
        pending.resolve({ result: "Task rejected by user." });
      }
      return;
    }

    if (msg.type === "screenshot_request") {
      if (!daemon) {
        ws.send(JSON.stringify({ type: "error", id: msg.id, message: "Daemon not connected" }));
        return;
      }
      const reqId = `client:${msg.id || crypto.randomUUID()}`;
      daemon.send(JSON.stringify({ type: "screenshot_request", id: reqId }));
      return;
    }
  }

  private async handleRpc(request: Request): Promise<Response> {
    const body = await request.json() as { method: string; params: Record<string, unknown> };
    const { method, params } = body;
    const ws = this.getDaemonWs();

    if (method === "get_status") {
      const status = {
        daemon_connected: ws !== null,
        current_task: this.currentTask
          ? { id: this.currentTask.id, instruction: this.currentTask.instruction, status: this.currentTask.status, steps: this.currentTask.steps }
          : null,
        queued: this.taskQueue.length,
      };
      return Response.json({ ok: true, result: JSON.stringify(status, null, 2) });
    }

    if (method === "get_usage") {
      const days = (params.days as number) || 7;
      const usage: Record<string, unknown>[] = [];
      for (let i = 0; i < days; i++) {
        const d = new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10);
        const data = await this.ctx.storage.get<{ cost: number; input: number; output: number; count: number }>(`usage:${d}`);
        if (data) usage.push({ date: d, ...data });
      }
      return Response.json({ ok: true, result: usage });
    }

    if (method === "list_templates") {
      const templates = await this.ctx.storage.list({ prefix: "tpl:" });
      const list: string[] = [];
      templates.forEach((v, k) => {
        const count = Array.isArray(v) ? v.length : ((v as { actions?: string[] }).actions?.length ?? 0);
        list.push(`${k.slice(4)}: ${count} actions`);
      });
      return Response.json({ ok: true, result: list.length > 0 ? list.join("\n") : "No templates yet." });
    }

    if (method === "send_to_daemon") {
      const daemon = this.getDaemonWs();
      if (!daemon) return Response.json({ error: "daemon_offline" }, { status: 503 });
      const allowedTypes = new Set(["mcp_install", "self_update", "vnc_start", "screenshot_request"]);
      const msgType = (params as { type?: string }).type;
      if (!msgType || !allowedTypes.has(msgType)) {
        return Response.json({ error: `disallowed message type: ${msgType}` }, { status: 400 });
      }
      daemon.send(JSON.stringify(params));
      return Response.json({ sent: true });
    }

    if (!ws) {
      return Response.json({ ok: false, error: "Mac daemon not connected" });
    }

    if (method === "cancel_task") {
      if (!this.currentTask) {
        return Response.json({ ok: true, result: "No task running." });
      }
      const taskId = this.currentTask.id;
      ws.send(JSON.stringify({ type: "cancel", id: taskId }));
      this.currentTask.status = "cancelled";
      const cancelled = this.currentTask.instruction;
      this.resolvePending(taskId, { result: `Cancelled: ${cancelled}` });
      this.currentTask = null;
      this.drainQueue();
      return Response.json({ ok: true, result: `Cancelled: ${cancelled}` });
    }

    if (method === "get_screenshot") {
      const id = crypto.randomUUID();
      ws.send(JSON.stringify({ type: "screenshot_request", id }));
      const resp = await this.waitForResponse(id, 15_000);
      return Response.json({ ok: true, result: resp.result, screenshot_b64: resp.result });
    }

    if (method === "run_task") {
      const instruction = params.instruction as string;
      const budget = Math.min(Math.max((params.budget as number) || DEFAULT_BUDGET, 1), 100);

      const preflight = checkPreflight(instruction);
      if (preflight) {
        return Response.json({ ok: false, error: preflight });
      }

      const risk = assessRisk(instruction);

      if (risk.requiresConfirmation) {
        const confirmId = crypto.randomUUID();
        this.broadcastToClients({
          type: "confirm_task",
          id: confirmId,
          instruction: instruction.slice(0, 300),
          risk_tier: risk.tier,
          risk_reason: risk.reason,
          message: `⚠️ HIGH RISK: "${instruction.slice(0, 100)}" — ${risk.reason}. Approve?`,
        }, true);

        const uid = await this.ensureUserId();
        if (uid) {
          this.ctx.waitUntil(
            sendPushToUser(this.env, uid, {
              title: "JARVIS — Confirmation Required",
              body: `High-risk task: ${risk.reason}. Open chat to approve.`,
              tag: "confirm-task",
            }),
          );
        }

        const confirmResult = await new Promise<{ result: string }>((resolve) => {
          const timer = setTimeout(() => {
            this.pendingConfirmations.delete(confirmId);
            resolve({ result: "Task expired — no confirmation received within 2 minutes." });
          }, 120_000);
          this.pendingConfirmations.set(confirmId, { instruction, budget, risk, resolve, timer });
        });
        const wasApproved = confirmResult.result.startsWith("Task approved");
        return Response.json({ ok: wasApproved, result: confirmResult.result, risk_tier: risk.tier });
      }

      const template = await matchTemplate(this.ctx.storage, instruction);
      const rewritten = rewriteInstruction(instruction);

      const id = crypto.randomUUID();
      const task: Task = { id, instruction, budget, status: "queued", steps: 0 };

      if (this.currentTask) {
        this.taskQueue.push(task);
        return Response.json({ ok: true, result: `Queued as ${id} (position ${this.taskQueue.length}). ${template ? "Template match found — will use learned sequence." : ""}`, risk_tier: risk.tier });
      }

      this.currentTask = task;
      task.status = "running";
      ws.send(JSON.stringify({
        type: "task",
        id,
        instruction: rewritten,
        budget,
        ...(template ? { template } : {}),
      }));

      const resp = await this.waitForResponse(id, budget * 10_000);
      return Response.json({ ok: true, result: resp.result, screenshot_b64: resp.screenshot_b64, risk_tier: risk.tier });
    }

    return Response.json({ ok: false, error: `Unknown method: ${method}` });
  }

  private waitForResponse(id: string, timeoutMs: number): Promise<{ result: string; screenshot_b64?: string }> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.pendingRpcs.delete(id);
        resolve({ result: "Timed out waiting for daemon response." });
      }, timeoutMs);
      this.pendingRpcs.set(id, { resolve, timer });
    });
  }

  private resolvePending(id: string, value: { result: string; screenshot_b64?: string }): void {
    const pending = this.pendingRpcs.get(id);
    if (pending) {
      clearTimeout(pending.timer);
      pending.resolve(value);
      this.pendingRpcs.delete(id);
    }
  }

  private drainQueue(): void {
    const ws = this.getDaemonWs();
    if (this.currentTask || this.taskQueue.length === 0 || !ws) return;
    const next = this.taskQueue.shift()!;
    this.currentTask = next;
    next.status = "running";
    const rewritten = rewriteInstruction(next.instruction);
    ws.send(JSON.stringify({
      type: "task",
      id: next.id,
      instruction: rewritten,
      budget: next.budget,
    }));
  }
}
