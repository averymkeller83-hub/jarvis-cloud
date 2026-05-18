const MAX_ATTEMPTS_PER_EMAIL = 5;
const MAX_ATTEMPTS_PER_IP = 20;
const WINDOW_SECONDS = 900; // 15 minutes
const LOCKOUT_SECONDS = 1800; // 30 minutes

interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  retryAfter?: number;
}

export async function checkRateLimit(
  db: D1Database,
  email: string,
  ip: string,
): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - WINDOW_SECONDS;

  const [accountLock, emailAttempts, ipAttempts] = await Promise.all([
    db
      .prepare("SELECT locked_until FROM users WHERE email = ?")
      .bind(email)
      .first<{ locked_until: number | null }>(),
    db
      .prepare(
        "SELECT COUNT(*) as cnt FROM login_attempts WHERE email = ? AND success = 0 AND created_at > ?",
      )
      .bind(email, windowStart)
      .first<{ cnt: number }>(),
    db
      .prepare(
        "SELECT COUNT(*) as cnt FROM login_attempts WHERE ip = ? AND success = 0 AND created_at > ?",
      )
      .bind(ip, windowStart)
      .first<{ cnt: number }>(),
  ]);

  if (accountLock?.locked_until && accountLock.locked_until > now) {
    return {
      allowed: false,
      reason: "Account temporarily locked. Try again later.",
      retryAfter: accountLock.locked_until - now,
    };
  }

  if (emailAttempts && emailAttempts.cnt >= MAX_ATTEMPTS_PER_EMAIL) {
    await db
      .prepare("UPDATE users SET locked_until = ? WHERE email = ?")
      .bind(now + LOCKOUT_SECONDS, email)
      .run();
    return {
      allowed: false,
      reason: "Too many failed attempts. Account locked for 30 minutes.",
      retryAfter: LOCKOUT_SECONDS,
    };
  }

  if (ipAttempts && ipAttempts.cnt >= MAX_ATTEMPTS_PER_IP) {
    return {
      allowed: false,
      reason: "Too many requests. Try again later.",
      retryAfter: WINDOW_SECONDS,
    };
  }

  return { allowed: true };
}

export async function recordAttempt(
  db: D1Database,
  email: string,
  ip: string,
  success: boolean,
): Promise<void> {
  await db
    .prepare(
      "INSERT INTO login_attempts (email, ip, success, created_at) VALUES (?, ?, ?, unixepoch())",
    )
    .bind(email, ip, success ? 1 : 0)
    .run();

  if (success) {
    await db
      .prepare("UPDATE users SET locked_until = NULL WHERE email = ?")
      .bind(email)
      .run();
  }
}

export async function cleanupExpired(db: D1Database): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await Promise.all([
    db.prepare("DELETE FROM sessions WHERE expires_at < ?").bind(now).run(),
    db
      .prepare("DELETE FROM login_attempts WHERE created_at < ?")
      .bind(now - 86400)
      .run(),
  ]);
}
