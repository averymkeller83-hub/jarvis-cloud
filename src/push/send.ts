import { createVapidJwt, encryptPayload } from "./crypto";
import { decrypt } from "../crypto/encrypt";
import type { Env } from "../types";

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export async function sendPushToUser(
  env: Env,
  userId: number,
  payload: PushPayload,
): Promise<{ sent: number; failed: number }> {
  const { results } = await env.DB.prepare(
    "SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?",
  )
    .bind(userId)
    .all<{ id: number; endpoint: string; p256dh: string; auth: string }>();

  if (!results || results.length === 0) return { sent: 0, failed: 0 };

  const json = JSON.stringify(payload);
  let sent = 0;
  let failed = 0;
  const stale: number[] = [];

  for (const sub of results) {
    try {
      const p256dh = await decrypt(sub.p256dh, env.ENCRYPTION_KEY, userId);
      const authKey = await decrypt(sub.auth, env.ENCRYPTION_KEY, userId);
      const origin = new URL(sub.endpoint).origin;
      const vapid = await createVapidJwt(
        origin,
        `mailto:${env.VAPID_SUBJECT}`,
        env.VAPID_PUBLIC_KEY,
        env.VAPID_PRIVATE_KEY,
      );
      const body = await encryptPayload(json, p256dh, authKey);

      const resp = await fetch(sub.endpoint, {
        method: "POST",
        headers: {
          Authorization: vapid.authorization,
          "Content-Type": "application/octet-stream",
          "Content-Encoding": "aes128gcm",
          TTL: "86400",
        },
        body,
      });

      if (resp.status === 201 || resp.status === 202) {
        sent++;
      } else if (resp.status === 404 || resp.status === 410) {
        stale.push(sub.id);
        failed++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  if (stale.length > 0) {
    await env.DB.prepare(
      `DELETE FROM push_subscriptions WHERE id IN (${stale.map(() => "?").join(",")})`,
    )
      .bind(...stale)
      .run();
  }

  return { sent, failed };
}
