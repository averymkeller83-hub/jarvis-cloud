export const DEFAULT_BUDGET = 25;

export type RiskTier = "low" | "medium" | "high" | "blocked";

const SAFETY_PREFIX = [
  "You are controlling Avery Keller's Mac.",
  "RULES: Do NOT delete files, send messages, make purchases, or modify system settings without explicit confirmation.",
  "If unsure, stop and report what you see.",
  "TASK: ",
].join(" ");

const BLOCKED_PATTERNS: [RegExp, string][] = [
  [/\bformat\s+(disk|drive|hard|ssd|volume)\b/i, "disk formatting"],
  [/\bsudo\s+rm\b/i, "sudo rm"],
  [/\brm\s+-rf\s+[/~]/i, "recursive delete from root/home"],
  [/\bdd\s+if=/i, "raw disk write"],
  [/\bmkfs\b/i, "filesystem creation"],
];

const HIGH_RISK_PATTERNS: [RegExp, string][] = [
  [/\bdelete\s+(all|my|every|the\s+entire)\b/i, "bulk deletion"],
  [/\bremove\s+(all|my|every|the\s+entire)\b/i, "bulk removal"],
  [/\brm\s+-/i, "rm with flags"],
  [/\bsend\s+(message|email|text|slack)/i, "sending communications"],
  [/\bpurchase\b/i, "purchase"],
  [/\bbuy\b/i, "purchase"],
  [/\bpay\b/i, "payment"],
  [/\bsudo\b/i, "elevated privileges"],
  [/\bshutdown\b/i, "system shutdown"],
  [/\brestart\s+(the\s+)?(mac|computer|system)\b/i, "system restart"],
  [/\breboot\b/i, "system reboot"],
  [/\binstall\b/i, "software installation"],
  [/\buninstall\b/i, "software removal"],
  [/\bbrew\s+(install|uninstall|remove)\b/i, "package management"],
  [/\bnpm\s+(install|uninstall)\s+-g/i, "global npm package"],
  [/\bgit\s+push/i, "git push"],
  [/\bgit\s+reset\s+--hard/i, "destructive git reset"],
  [/\bchmod\b/i, "permission change"],
  [/\bchown\b/i, "ownership change"],
  [/\bdefaults\s+write\b/i, "system defaults change"],
];

const MEDIUM_RISK_PATTERNS: [RegExp, string][] = [
  [/\bedit\s+(the\s+)?file\b/i, "file editing"],
  [/\bwrite\s+(to|a|the)\s+file\b/i, "file writing"],
  [/\bcreate\s+(a\s+)?(file|folder|directory)\b/i, "file creation"],
  [/\bmove\s+(the\s+)?file\b/i, "file moving"],
  [/\brename\s+(the\s+)?file\b/i, "file renaming"],
  [/\bgit\s+(commit|merge|rebase|checkout)\b/i, "git operation"],
  [/\bnpm\s+(install|run|build)\b/i, "npm operation"],
  [/\bpython\s+\S/i, "script execution"],
  [/\bnode\s+\S/i, "script execution"],
  [/\bbash\s+\S/i, "shell script"],
  [/\bdownload\s+\S/i, "downloading"],
  [/\bcurl\s+\S/i, "network request"],
  [/\bwget\s+\S/i, "network request"],
];

export interface RiskAssessment {
  tier: RiskTier;
  reason: string;
  requiresConfirmation: boolean;
}

export function assessRisk(instruction: string): RiskAssessment {
  for (const [pattern, reason] of BLOCKED_PATTERNS) {
    if (pattern.test(instruction)) {
      return { tier: "blocked", reason: `Blocked: ${reason}`, requiresConfirmation: false };
    }
  }

  for (const [pattern, reason] of HIGH_RISK_PATTERNS) {
    if (pattern.test(instruction)) {
      return { tier: "high", reason, requiresConfirmation: true };
    }
  }

  for (const [pattern, reason] of MEDIUM_RISK_PATTERNS) {
    if (pattern.test(instruction)) {
      return { tier: "medium", reason, requiresConfirmation: false };
    }
  }

  return { tier: "low", reason: "read-only or navigation", requiresConfirmation: false };
}

export function rewriteInstruction(raw: string): string {
  return SAFETY_PREFIX + raw;
}

export function checkPreflight(instruction: string): string | null {
  const risk = assessRisk(instruction);
  if (risk.tier === "blocked") {
    return `Pre-flight blocked: ${risk.reason}. This operation is not allowed.`;
  }
  return null;
}
