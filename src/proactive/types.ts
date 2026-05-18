export interface McpRegistryEntry {
  source: "github" | "npm" | "clawhub";
  name: string;
  repoUrl: string;
  description: string;
  stars: number;
  lastCommit: string | null;
  installCommand: string;
}

export interface SafetyReport {
  score: number;
  passed: boolean;
  checks: SafetyCheck[];
  scannedAt: number;
}

export interface SafetyCheck {
  name: string;
  passed: boolean;
  severity: "critical" | "warning" | "info";
  detail: string;
}

export interface McpSuggestion {
  id: number;
  name: string;
  description: string;
  repoUrl: string;
  relevanceScore: number;
  reason: string;
  safetyScore: number;
  status: "pending" | "approved" | "rejected" | "installed";
}

export interface UpdateCheckResult {
  component: "claude_cli" | "daemon";
  currentVersion: string | null;
  latestVersion: string;
  updateAvailable: boolean;
  releaseUrl: string;
}

export type ProactiveJobType = "mcp_discovery" | "safety_scan" | "update_check" | "suggest";

export interface DaemonInstallMcpMessage {
  type: "mcp_install";
  id: string;
  name: string;
  command: string;
  config: Record<string, unknown>;
}

export interface DaemonSelfUpdateMessage {
  type: "self_update";
  id: string;
  component: "claude_cli" | "daemon";
  command: string;
}

export interface DaemonProactiveResultMessage {
  type: "proactive_result";
  id: string;
  success: boolean;
  detail: string;
}
