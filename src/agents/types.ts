export interface AgentProcess {
  pid: number;
  sessionId: string | null;
  model: string | null;
  permissionMode: string | null;
  project: string | null;
  cpu: number;
  mem: number;
  startedAt: string;
  cpuTime: string;
  cmd: string;
  isSubagent: boolean;
  parentPid: number | null;
}

export interface AgentEvent {
  sessionId: string;
  timestamp: string;
  type: "tool_use" | "tool_result" | "text" | "agent_spawn" | "agent_complete" | "error";
  tool?: string;
  toolInput?: Record<string, unknown>;
  text?: string;
  subagentDesc?: string;
  costUsd?: number;
  tokens?: { input: number; output: number };
}

export interface AgentSnapshot {
  agents: AgentProcess[];
  events: AgentEvent[];
  totalCostUsd: number;
  totalTokens: { input: number; output: number };
}

export type AgentDaemonMessage =
  | { type: "agent_snapshot"; snapshot: AgentSnapshot }
  | { type: "agent_event"; event: AgentEvent };
