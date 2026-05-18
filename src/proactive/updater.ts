import type { Env } from "../types";
import type { UpdateCheckResult } from "./types";

const NPM_REGISTRY = "https://registry.npmjs.org/@anthropic-ai/claude-code";
const DAEMON_REPO = "https://api.github.com/repos/averymkeller83-hub/jarvis-daemon/releases/latest";

export async function checkForUpdates(
  _env: Env,
  config: Record<string, unknown>,
): Promise<UpdateCheckResult[]> {
  const results: UpdateCheckResult[] = [];
  const checkCli = config.check_cli !== false;
  const checkDaemon = config.check_daemon !== false;

  if (checkCli) {
    try {
      const res = await fetch(NPM_REGISTRY, {
        headers: { Accept: "application/json", "User-Agent": "jarvis-cloud/1.0" },
      });

      if (res.ok) {
        const data = (await res.json()) as { "dist-tags": { latest: string } };
        const latest = data["dist-tags"].latest;

        results.push({
          component: "claude_cli",
          currentVersion: null,
          latestVersion: latest,
          updateAvailable: true,
          releaseUrl: "https://www.npmjs.com/package/@anthropic-ai/claude-code",
        });
      }
    } catch {
      // Skip if registry unreachable
    }
  }

  if (checkDaemon) {
    try {
      const res = await fetch(DAEMON_REPO, {
        headers: { Accept: "application/vnd.github.v3+json", "User-Agent": "jarvis-cloud/1.0" },
      });

      if (res.ok) {
        const data = (await res.json()) as { tag_name: string; html_url: string };
        results.push({
          component: "daemon",
          currentVersion: null,
          latestVersion: data.tag_name,
          updateAvailable: true,
          releaseUrl: data.html_url,
        });
      }
    } catch {
      // Skip if GitHub unreachable
    }
  }

  return results;
}
