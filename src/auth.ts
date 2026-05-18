import type { MiddlewareHandler } from "hono";
import { eq } from "drizzle-orm";
import { getDb } from "./db/client";
import { users } from "./db/schema";
import { validateSession, parseSessionCookie } from "./auth/session";
import type { Env, AuthContext } from "./types";

type AuthEnv = { Bindings: Env; Variables: { auth: AuthContext } };

export const sessionAuth: MiddlewareHandler<AuthEnv> = async (c, next) => {
  const cookie = c.req.header("Cookie") ?? null;
  const sessionId = parseSessionCookie(cookie);
  if (!sessionId) {
    return c.redirect("/login");
  }
  const db = getDb(c.env.DB);
  const user = await validateSession(db, sessionId);
  if (!user) {
    return c.redirect("/login");
  }
  c.set("auth", { userId: user.id, userName: user.name, email: user.email, daemonToken: user.daemonToken, plan: user.plan, foundingMember: !!user.foundingMember });
  await next();
};

export const sessionAuthApi: MiddlewareHandler<AuthEnv> = async (c, next) => {
  const cookie = c.req.header("Cookie") ?? null;
  const sessionId = parseSessionCookie(cookie);
  if (!sessionId) {
    return c.json({ error: "unauthorized" }, 401);
  }
  const db = getDb(c.env.DB);
  const user = await validateSession(db, sessionId);
  if (!user) {
    return c.json({ error: "session expired" }, 401);
  }
  c.set("auth", { userId: user.id, userName: user.name, email: user.email, daemonToken: user.daemonToken, plan: user.plan, foundingMember: !!user.foundingMember });
  await next();
};

export const tokenOrSessionAuth: MiddlewareHandler<AuthEnv> = async (c, next) => {
  const authHeader = c.req.header("Authorization") ?? "";
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const db = getDb(c.env.DB);
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.daemonToken, token))
      .limit(1);
    if (rows.length === 0) {
      return c.json({ error: "invalid token" }, 401);
    }
    const user = rows[0];
    c.set("auth", {
      userId: user.id,
      userName: user.name ?? "",
      email: user.email ?? "",
      daemonToken: user.daemonToken ?? "",
      plan: user.plan,
      foundingMember: !!user.foundingMember,
    });
    return next();
  }

  const cookie = c.req.header("Cookie") ?? null;
  const sessionId = parseSessionCookie(cookie);
  if (!sessionId) {
    return c.json({ error: "unauthorized" }, 401);
  }
  const db = getDb(c.env.DB);
  const user = await validateSession(db, sessionId);
  if (!user) {
    return c.json({ error: "session expired" }, 401);
  }
  c.set("auth", { userId: user.id, userName: user.name, email: user.email, daemonToken: user.daemonToken, plan: user.plan, foundingMember: !!user.foundingMember });
  await next();
};

export async function getAuthFromCookie(cookie: string | null, db: ReturnType<typeof getDb>) {
  const sessionId = parseSessionCookie(cookie);
  if (!sessionId) return null;
  return validateSession(db, sessionId);
}
