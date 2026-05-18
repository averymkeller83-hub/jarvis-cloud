import { Hono } from "hono";
import { requireAdmin } from "./middleware";
import { getDb } from "../db/client";
import { users, sessions } from "../db/schema";
import { eq, desc, sql, and, gt } from "drizzle-orm";
import { decrypt } from "../crypto/encrypt";
import { audit } from "../audit";
import type { Env, AuthContext } from "../types";

type AdminEnv = { Bindings: Env; Variables: { auth: AuthContext } };

const admin = new Hono<AdminEnv>();

admin.use("/api/admin/*", requireAdmin);

admin.get("/api/admin/stats", async (c) => {
  const db = getDb(c.env.DB);
  const now = Math.floor(Date.now() / 1000);

  const [userCount, sessionCount, foundingCount, configRows] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(users),
    db.select({ count: sql<number>`count(*)` }).from(sessions).where(gt(sessions.expiresAt, now)),
    db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.foundingMember, 1)),
    c.env.DB.prepare("SELECT key, value FROM founding_config").all<{ key: string; value: string }>(),
  ]);

  const config: Record<string, string> = {};
  for (const row of configRows.results) config[row.key] = row.value;

  return c.json({
    users: userCount[0].count,
    activeSessions: sessionCount[0].count,
    foundingMembers: foundingCount[0].count,
    foundingMaxSlots: parseInt(config.max_slots || "100"),
    foundingEnabled: config.enabled === "true",
  });
});

admin.get("/api/admin/users", async (c) => {
  const db = getDb(c.env.DB);
  const search = c.req.query("search") || "";
  const page = parseInt(c.req.query("page") || "1");
  const limit = 25;
  const offset = (page - 1) * limit;

  let query;
  if (search) {
    const pattern = `%${search.toLowerCase()}%`;
    query = db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        plan: users.plan,
        foundingMember: users.foundingMember,
        isAdmin: users.isAdmin,
        lockedUntil: users.lockedUntil,
        termsAcceptedAt: users.termsAcceptedAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(sql`lower(${users.email}) like ${pattern} or lower(${users.name}) like ${pattern}`)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);
  } else {
    query = db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        plan: users.plan,
        foundingMember: users.foundingMember,
        isAdmin: users.isAdmin,
        lockedUntil: users.lockedUntil,
        termsAcceptedAt: users.termsAcceptedAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);
  }

  const rows = await query;
  return c.json({ users: rows, page, limit });
});

admin.get("/api/admin/users/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const db = getDb(c.env.DB);

  const row = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      plan: users.plan,
      planExpiresAt: users.planExpiresAt,
      foundingMember: users.foundingMember,
      isAdmin: users.isAdmin,
      lockedUntil: users.lockedUntil,
      termsAcceptedAt: users.termsAcceptedAt,
      timezone: users.timezone,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!row.length) return c.json({ error: "not found" }, 404);

  const activeSessions = await db
    .select({ count: sql<number>`count(*)` })
    .from(sessions)
    .where(and(eq(sessions.userId, id), gt(sessions.expiresAt, Math.floor(Date.now() / 1000))));

  return c.json({ user: row[0], activeSessions: activeSessions[0].count });
});

admin.post("/api/admin/users/:id/plan", async (c) => {
  const id = parseInt(c.req.param("id"));
  const { plan } = await c.req.json<{ plan: string }>();
  if (!["free", "pro"].includes(plan)) return c.json({ error: "invalid plan" }, 400);

  const db = getDb(c.env.DB);
  await db.update(users).set({ plan }).where(eq(users.id, id));

  const ip = c.req.header("CF-Connecting-IP") || "unknown";
  const adminAuth = c.get("auth");
  audit(c.env.AUDIT_DB, id, "plan_change", `plan=${plan} by_admin=${adminAuth.userId}`, ip);
  return c.json({ ok: true });
});

admin.post("/api/admin/users/:id/founding", async (c) => {
  const id = parseInt(c.req.param("id"));
  const { founding } = await c.req.json<{ founding: boolean }>();

  const db = getDb(c.env.DB);
  await db.update(users).set({ foundingMember: founding ? 1 : 0 }).where(eq(users.id, id));

  const ip = c.req.header("CF-Connecting-IP") || "unknown";
  const adminAuth = c.get("auth");
  audit(c.env.AUDIT_DB, id, founding ? "founding_member_granted" : "plan_change", `founding=${founding} by_admin=${adminAuth.userId}`, ip);
  return c.json({ ok: true });
});

admin.post("/api/admin/users/:id/lock", async (c) => {
  const id = parseInt(c.req.param("id"));
  const { lock } = await c.req.json<{ lock: boolean }>();

  const lockedUntil = lock ? Math.floor(Date.now() / 1000) + 86400 * 365 : null;
  const db = getDb(c.env.DB);
  await db.update(users).set({ lockedUntil }).where(eq(users.id, id));

  const ip = c.req.header("CF-Connecting-IP") || "unknown";
  const adminAuth = c.get("auth");
  audit(c.env.AUDIT_DB, id, "account_locked", `locked=${lock} by_admin=${adminAuth.userId}`, ip);
  return c.json({ ok: true });
});

admin.post("/api/admin/users/:id/kill-sessions", async (c) => {
  const id = parseInt(c.req.param("id"));
  const db = getDb(c.env.DB);
  await db.delete(sessions).where(eq(sessions.userId, id));

  const ip = c.req.header("CF-Connecting-IP") || "unknown";
  const adminAuth = c.get("auth");
  audit(c.env.AUDIT_DB, id, "logout", `force_logout by_admin=${adminAuth.userId}`, ip);
  return c.json({ ok: true });
});

admin.get("/api/admin/audit", async (c) => {
  const userId = c.req.query("user_id");
  const action = c.req.query("action");
  const page = parseInt(c.req.query("page") || "1");
  const limit = 50;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const binds: (string | number)[] = [];

  if (userId) {
    conditions.push("user_id = ?");
    binds.push(parseInt(userId));
  }
  if (action) {
    conditions.push("action = ?");
    binds.push(action);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = await c.env.AUDIT_DB
    .prepare(`SELECT id, user_id, action, detail, ip, created_at FROM audit_log ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .bind(...binds, limit, offset)
    .all<{ id: number; user_id: number | null; action: string; detail: string | null; ip: string | null; created_at: number }>();

  const decrypted = [];
  for (const row of rows.results) {
    let detail = row.detail;
    if (detail && row.user_id) {
      try {
        detail = await decrypt(detail, c.env.ENCRYPTION_KEY, row.user_id);
      } catch {}
    }
    decrypted.push({ ...row, detail });
  }

  return c.json({ entries: decrypted, page, limit });
});

admin.get("/api/admin/sessions", async (c) => {
  const db = getDb(c.env.DB);
  const now = Math.floor(Date.now() / 1000);

  const rows = await db
    .select({
      sessionId: sessions.id,
      userId: sessions.userId,
      userName: users.name,
      email: users.email,
      expiresAt: sessions.expiresAt,
      createdAt: sessions.createdAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(gt(sessions.expiresAt, now))
    .orderBy(desc(sessions.createdAt))
    .limit(100);

  return c.json({ sessions: rows });
});

admin.post("/api/admin/sessions/:id/kill", async (c) => {
  const sessionId = c.req.param("id");
  const db = getDb(c.env.DB);
  await db.delete(sessions).where(eq(sessions.id, sessionId));
  return c.json({ ok: true });
});

admin.post("/api/admin/config/founding", async (c) => {
  const { maxSlots, enabled } = await c.req.json<{ maxSlots?: number; enabled?: boolean }>();

  if (maxSlots !== undefined) {
    await c.env.DB.prepare("UPDATE founding_config SET value = ? WHERE key = 'max_slots'")
      .bind(String(maxSlots))
      .run();
  }
  if (enabled !== undefined) {
    await c.env.DB.prepare("UPDATE founding_config SET value = ? WHERE key = 'enabled'")
      .bind(enabled ? "true" : "false")
      .run();
  }

  return c.json({ ok: true });
});

export { admin };
