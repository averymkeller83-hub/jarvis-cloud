export function logToolCall(
  tool: string,
  durationMs: number,
  status: string,
  error?: string,
): void {
  const entry: Record<string, unknown> = {
    ts: new Date().toISOString(),
    tool,
    duration_ms: Math.round(durationMs * 10) / 10,
    status,
  };
  if (error) entry.error = error;
  console.log(JSON.stringify(entry));
}
