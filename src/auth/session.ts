import { eq, and, gt } from "drizzle-orm";
import { sessions, users } from "../db/schema";
import type { Database } from "../db/client";

const SESSION_TTL = 30 * 24 * 60 * 60;

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  daemonToken: string;
  plan: string;
  foundingMember: number;
}

export async function createSession(db: Database, userId: number): Promise<string> {
  const id = crypto.randomUUID();
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL;
  await db.insert(sessions).values({ id, userId, expiresAt });
  return id;
}

export async function validateSession(db: Database, sessionId: string): Promise<SessionUser | null> {
  const now = Math.floor(Date.now() / 1000);
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      daemonToken: users.daemonToken,
      plan: users.plan,
      foundingMember: users.foundingMember,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, now)))
    .limit(1);

  return rows.length > 0 ? (rows[0] as SessionUser) : null;
}

export async function deleteSession(db: Database, sessionId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export function getSessionCookie(sessionId: string): string {
  return `jarvis_session=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_TTL}`;
}

export function clearSessionCookie(): string {
  return "jarvis_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0";
}

export function parseSessionCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/jarvis_session=([^;]+)/);
  return match ? match[1] : null;
}
