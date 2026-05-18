import type { MiddlewareHandler } from "hono";
import { getDb } from "../db/client";
import { validateSession, parseSessionCookie } from "../auth/session";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import type { Env, AuthContext } from "../types";

type AdminEnv = { Bindings: Env; Variables: { auth: AuthContext } };

export const requireAdmin: MiddlewareHandler<AdminEnv> = async (c, next) => {
  const cookie = c.req.header("Cookie") ?? null;
  const sessionId = parseSessionCookie(cookie);
  if (!sessionId) return c.redirect("/login");

  const db = getDb(c.env.DB);
  const user = await validateSession(db, sessionId);
  if (!user) return c.redirect("/login");

  const row = await db
    .select({ isAdmin: users.isAdmin })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (!row.length || !row[0].isAdmin) {
    return c.json({ error: "forbidden" }, 403);
  }

  c.set("auth", {
    userId: user.id,
    userName: user.name,
    email: user.email,
    daemonToken: user.daemonToken,
    plan: user.plan,
    foundingMember: !!user.foundingMember,
  });
  await next();
};
