import { encrypt } from "./crypto/encrypt";

export type AuditAction =
  | "signup"
  | "login"
  | "login_failed"
  | "logout"
  | "chat_message"
  | "session_expired"
  | "plan_change"
  | "founding_member_granted"
  | "push_subscribe"
  | "push_unsubscribe"
  | "terms_accepted"
  | "account_locked";

const SENSITIVE_ACTIONS = new Set<AuditAction>(["chat_message"]);

export function audit(
  auditDb: D1Database,
  userId: number | null,
  action: AuditAction,
  detail?: string,
  ip?: string,
  encryptionKey?: string,
): void {
  const write = async () => {
    let storedDetail = detail ?? null;
    if (storedDetail && encryptionKey && userId && SENSITIVE_ACTIONS.has(action)) {
      storedDetail = await encrypt(storedDetail, encryptionKey, userId);
    }
    await auditDb
      .prepare("INSERT INTO audit_log (user_id, action, detail, ip) VALUES (?, ?, ?, ?)")
      .bind(userId, action, storedDetail, ip ?? null)
      .run();
  };
  write().catch(() => {});
}
