import { Hono } from "hono";
import { createMcpHandler } from "agents/mcp";
import { createMcpServer } from "./mcp";
import { sessionAuth, sessionAuthApi, tokenOrSessionAuth, getAuthFromCookie } from "./auth";
import { getChatPage } from "./chat/page";
import { getLivePage } from "./chat/live";
import { getLoginPage, getSignupPage } from "./auth/pages";
import { getTermsPage } from "./legal/terms";
import { getPrivacyPage } from "./legal/privacy";
import { getUpgradePage } from "./legal/upgrade";
import { requirePro, hasPro } from "./auth/plan-gate";
import { getSetupPage } from "./setup/page";
import { getInstallScript } from "./setup/install-script";
import { admin } from "./admin/routes";
import { proactive } from "./proactive/routes";
import { getAgentsPage } from "./agents/page";
import { getAdminPage } from "./admin/page";
import { requireAdmin } from "./admin/middleware";
import { hashPassword, verifyPassword } from "./auth/password";
import {
  createSession,
  deleteSession,
  getSessionCookie,
  clearSessionCookie,
  parseSessionCookie,
  validateSession,
} from "./auth/session";
import { getDb } from "./db/client";
import { UserScopedDb } from "./db/scoped";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";
import { sendPushToUser } from "./push/send";
import { checkRateLimit, recordAttempt, cleanupExpired } from "./auth/rate-limit";
import { securityHeaders } from "./auth/security-headers";
import { audit } from "./audit";
import novncBundle from "./chat/novnc-bundle.txt";
import chatAppJs from "./chat/chat-app.txt";
import icon192 from "../public/icon-192.png";
import icon512 from "../public/icon-512.png";
import type { Env, AuthContext } from "./types";

type AppEnv = { Bindings: Env; Variables: { auth: AuthContext } };

const app = new Hono<AppEnv>();

app.use("*", securityHeaders);

app.get("/health", async (c) => {
  c.executionCtx.waitUntil(cleanupExpired(c.env.DB));
  return c.json({ status: "ok", service: "jarvis-cloud", tools: 11, build: "2026-04-23-bugfix" });
});

// --- Public endpoints ---
app.get("/install.sh", (c) => {
  return c.body(getInstallScript(), 200, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" });
});

// --- Admin ---
app.get("/admin", requireAdmin, (c) => c.html(getAdminPage()));
app.route("/", admin);

// --- Auth pages (public) ---
app.get("/login", (c) => c.html(getLoginPage()));
app.get("/signup", (c) => c.html(getSignupPage()));
app.get("/terms", (c) => c.html(getTermsPage()));
app.get("/privacy", (c) => c.html(getPrivacyPage()));

// --- Auth API (public) ---
app.post("/api/auth/signup", async (c) => {
  const body = await c.req.parseBody();
  const name = ((body.name as string) || "").trim();
  const email = ((body.email as string) || "").trim().toLowerCase();
  const password = (body.password as string) || "";

  const termsAccepted = body.terms === "1";

  if (!name || !email || !password) {
    return c.html(getSignupPage("All fields are required."));
  }
  if (!termsAccepted) {
    return c.html(getSignupPage("You must agree to the Terms of Service and Privacy Policy."));
  }
  if (password.length < 8) {
    return c.html(getSignupPage("Password must be at least 8 characters."));
  }
  if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return c.html(getSignupPage("Password must include an uppercase letter and a number."));
  }

  const ip = c.req.header("CF-Connecting-IP") || "unknown";
  const rl = await checkRateLimit(c.env.DB, email, ip);
  if (!rl.allowed) {
    return c.html(getSignupPage(rl.reason!));
  }

  const db = getDb(c.env.DB);
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing.length > 0) {
    return c.html(getSignupPage("An account with this email already exists."));
  }

  const passwordHash = await hashPassword(password);
  const daemonToken = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  let isFoundingMember = 0;
  try {
    const cfg = await c.env.DB.prepare(
      "SELECT (SELECT value FROM founding_config WHERE key = 'enabled') AS enabled, (SELECT CAST(value AS INTEGER) FROM founding_config WHERE key = 'max_slots') AS max_slots, (SELECT COUNT(*) FROM users WHERE founding_member = 1) AS current_count",
    ).first<{ enabled: string; max_slots: number; current_count: number }>();
    if (cfg && cfg.enabled === "true" && cfg.current_count < cfg.max_slots) {
      isFoundingMember = 1;
    }
  } catch {}

  const result = await db
    .insert(users)
    .values({ name, email, passwordHash, daemonToken, termsAcceptedAt: now, foundingMember: isFoundingMember })
    .returning({ id: users.id });
  const userId = result[0].id;

  audit(c.env.AUDIT_DB, userId, "signup", `email=${email}`, ip);
  audit(c.env.AUDIT_DB, userId, "terms_accepted", undefined, ip);
  if (isFoundingMember) {
    audit(c.env.AUDIT_DB, userId, "founding_member_granted", `email=${email}`, ip);
  }

  const sessionId = await createSession(db, userId);
  c.header("Set-Cookie", getSessionCookie(sessionId));
  return c.redirect("/");
});

app.post("/api/auth/login", async (c) => {
  const body = await c.req.parseBody();
  const email = ((body.email as string) || "").trim().toLowerCase();
  const password = (body.password as string) || "";

  if (!email || !password) {
    return c.html(getLoginPage("Email and password are required."));
  }

  const ip = c.req.header("CF-Connecting-IP") || "unknown";
  const rl = await checkRateLimit(c.env.DB, email, ip);
  if (!rl.allowed) {
    return c.html(getLoginPage(rl.reason!));
  }

  const db = getDb(c.env.DB);
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (rows.length === 0 || !rows[0].passwordHash) {
    await recordAttempt(c.env.DB, email, ip, false);
    audit(c.env.AUDIT_DB, null, "login_failed", `email=${email}`, ip);
    return c.html(getLoginPage("Invalid email or password."));
  }

  const valid = await verifyPassword(password, rows[0].passwordHash);
  if (!valid) {
    await recordAttempt(c.env.DB, email, ip, false);
    audit(c.env.AUDIT_DB, rows[0].id, "login_failed", `email=${email}`, ip);
    return c.html(getLoginPage("Invalid email or password."));
  }

  await recordAttempt(c.env.DB, email, ip, true);
  audit(c.env.AUDIT_DB, rows[0].id, "login", `email=${email}`, ip);
  const sessionId = await createSession(db, rows[0].id);
  c.header("Set-Cookie", getSessionCookie(sessionId));
  return c.redirect("/");
});

app.post("/api/auth/logout", async (c) => {
  const cookie = c.req.header("Cookie") ?? null;
  const sessionId = parseSessionCookie(cookie);
  if (sessionId) {
    const db = getDb(c.env.DB);
    const user = await validateSession(db, sessionId);
    if (user) {
      const ip = c.req.header("CF-Connecting-IP") || "unknown";
      audit(c.env.AUDIT_DB, user.id, "logout", undefined, ip);
    }
    await deleteSession(db, sessionId);
  }
  c.header("Set-Cookie", clearSessionCookie());
  return c.redirect("/login");
});

// --- Protected pages ---
app.get("/setup", sessionAuth, async (c) => {
  const auth = c.get("auth");
  const id = c.env.MAC_BRIDGE.idFromName(`user-${auth.userId}`);
  const stub = c.env.MAC_BRIDGE.get(id);
  let connected = false;
  try {
    const resp = await stub.fetch(new Request(`http://do/rpc?userId=${auth.userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method: "get_status", params: {} }),
    }));
    const data = await resp.json() as { result?: string };
    connected = data.result !== undefined;
  } catch {}
  return c.html(getSetupPage(auth.daemonToken, auth.userName, connected));
});

app.get("/api/remote-url", sessionAuth, async (c) => {
  const auth = c.get("auth");
  const id = c.env.MAC_BRIDGE.idFromName(`user-${auth.userId}`);
  const stub = c.env.MAC_BRIDGE.get(id);
  const resp = await stub.fetch(new Request(`http://do/remote-url?userId=${auth.userId}`));
  return c.json(await resp.json());
});

app.put("/api/remote-url", sessionAuth, async (c) => {
  const auth = c.get("auth");
  const body = await c.req.json();
  const id = c.env.MAC_BRIDGE.idFromName(`user-${auth.userId}`);
  const stub = c.env.MAC_BRIDGE.get(id);
  await stub.fetch(new Request(`http://do/remote-url?userId=${auth.userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }));
  return c.json({ ok: true });
});

app.get("/", sessionAuth, (c) => {
  const auth = c.get("auth");
  return c.html(getChatPage(auth.plan, auth.foundingMember));
});

app.get("/upgrade", sessionAuth, async (c) => {
  const auth = c.get("auth");
  let slotsRemaining = 0;
  try {
    const row = await c.env.DB.prepare(
      "SELECT (SELECT CAST(value AS INTEGER) FROM founding_config WHERE key = 'max_slots') - (SELECT COUNT(*) FROM users WHERE founding_member = 1) AS remaining",
    ).first<{ remaining: number }>();
    slotsRemaining = Math.max(0, row?.remaining ?? 0);
  } catch {}
  return c.html(getUpgradePage(auth.plan, auth.foundingMember, slotsRemaining));
});

app.get("/live", sessionAuth, requirePro, (c) => {
  return c.html(getLivePage(), 200, {
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
  });
});

app.get("/agents", sessionAuth, requirePro, (c) => {
  return c.html(getAgentsPage());
});

app.get("/novnc.js", (c) => {
  return c.body(novncBundle, 200, {
    "Content-Type": "application/javascript",
    "Cache-Control": "public, max-age=86400",
  });
});

app.get("/chat-app.js", (c) => {
  return c.body(chatAppJs, 200, {
    "Content-Type": "application/javascript",
    "Cache-Control": "no-cache",
  });
});

app.get("/reset", (c) =>
  c.html(
    `<!DOCTYPE html><html><body><script>localStorage.clear();location.href='/login';</script></body></html>`,
  ),
);

app.get("/manifest.json", (c) =>
  c.json(
    {
      name: "JARVIS",
      short_name: "JARVIS",
      start_url: "/",
      display: "standalone",
      background_color: "#030712",
      theme_color: "#030712",
      icons: [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
    },
    200,
    { "Cache-Control": "public, max-age=86400" },
  ),
);

app.get("/icon-192.png", (c) =>
  c.body(icon192, 200, { "Content-Type": "image/png", "Cache-Control": "public, max-age=604800" }),
);

app.get("/icon-512.png", (c) =>
  c.body(icon512, 200, { "Content-Type": "image/png", "Cache-Control": "public, max-age=604800" }),
);

app.get("/sw.js", (c) =>
  c.body(
    `self.addEventListener('push', function(e) {
  var data = e.data ? e.data.json() : {};
  var title = data.title || 'JARVIS';
  var options = { body: data.body || '', icon: '/icon-192.png', badge: '/icon-192.png', tag: data.tag || 'jarvis', data: { url: data.url || '/' } };
  e.waitUntil(self.registration.showNotification(title, options));
});
self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list) {
    for (var i = 0; i < list.length; i++) { if (list[i].url.includes(url) && 'focus' in list[i]) return list[i].focus(); }
    return clients.openWindow(url);
  }));
});`,
    200,
    {
      "Content-Type": "application/javascript",
      "Cache-Control": "no-cache",
      "Service-Worker-Allowed": "/",
    },
  ),
);

// --- Protected API ---
const VOICE_MAP: Record<string, string> = {
  draco: "612b878b113047d9a770c069c8b4fdfe",
  athena: "a7eefc70f4e44264bcc7b1e0e26de233",
  electra: "2a55040b23c84ba8b6e28b7d7d0b1d90",
  orpheus: "e58e7f0c30284e1ca8b1a0e8e8b4c3f4",
  apollo: "4a19be80c44c4dc8aeab2e7be0b3e8a6",
  hermes: "b88ef8b8ff384e5eb0e5b4d90e36f67e",
  jupiter: "65aaec0c7f0845dcb1e94eb40f45e8a1",
  luna: "c6aba5b10aca42fc9c4db88d63e85295",
  helena: "e60aad6f1f5d47e99e61e02b9a27e7e6",
  thalia: "6cc0c50dc8654e09b0e25a0f13784a6e",
  hyperion: "d9f0d6c2ff3041efbde86e31d1da4b99",
  theia: "ff1afea1f9984e86b9e6efbb9ce50b36",
  amalthea: "3f2e55d2d0aa4c7e82e6e91dc5f5defe",
  mars: "1c5e37c8c6e04c5d9a04c7be37db56a4",
  neptune: "44e2e5ce3de3455aa29d2a79cdca3a49",
  orion: "24dfd15ad0d54e8c8f2f73cba08b47d5",
  zeus: "e5b9e06d40534e82b0c5a0a8d6e3ef92",
  aurora: "6cd18ae0d8ae48019c3c0e8d5de47e7d",
  hera: "6bf8a7e530f04b0f8c95a1d7c0c0e4a5",
  iris: "bb2b7cd490a647c0aa466b900d8f0e11",
  juno: "93a7e0e6380342eab2a08b9a4e4c6d1a",
};

app.post("/api/tts", sessionAuthApi, async (c) => {
  const { text, voice } = await c.req.json<{ text: string; voice?: string }>();
  if (!text || text.length > 2000) {
    return c.json({ error: "text required (max 2000 chars)" }, 400);
  }
  const referenceId = (voice && VOICE_MAP[voice]) || VOICE_MAP.draco;
  try {
    const resp = await fetch("https://api.fish.audio/v1/tts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${c.env.FISH_AUDIO_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reference_id: referenceId,
        text,
        format: "mp3",
      }),
    });
    if (!resp.ok) {
      const err = await resp.text();
      return c.json({ error: err || "Fish Audio error" }, 503);
    }
    return c.body(resp.body as ReadableStream, 200, {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "TTS unavailable";
    return c.json({ error: msg }, 503);
  }
});

app.all("/mcp", tokenOrSessionAuth, async (c) => {
  const auth = c.get("auth");
  const server = createMcpServer(c.env, auth.userId, auth.plan, auth.foundingMember);
  const handler = createMcpHandler(server);
  return handler(c.req.raw, c.env, c.executionCtx);
});

// --- User info APIs ---
app.get("/api/auth/me", sessionAuthApi, (c) => {
  const auth = c.get("auth");
  return c.json({ id: auth.userId, name: auth.userName, email: auth.email, plan: auth.plan, foundingMember: auth.foundingMember });
});

app.get("/api/auth/daemon-token", sessionAuthApi, (c) => {
  const auth = c.get("auth");
  return c.json({ daemonToken: auth.daemonToken });
});

// --- Push notification APIs ---
app.get("/api/push/vapid-key", sessionAuthApi, (c) => {
  return c.json({ publicKey: c.env.VAPID_PUBLIC_KEY });
});

app.post("/api/push/subscribe", sessionAuthApi, async (c) => {
  const auth = c.get("auth");
  const { endpoint, keys } = await c.req.json<{
    endpoint: string;
    keys: { p256dh: string; auth: string };
  }>();
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return c.json({ error: "invalid subscription" }, 400);
  }
  const scopedDb = new UserScopedDb(getDb(c.env.DB), auth.userId, c.env.ENCRYPTION_KEY);
  await scopedDb.addPushSubscription(endpoint, keys.p256dh, keys.auth);
  audit(c.env.AUDIT_DB, auth.userId, "push_subscribe", undefined, c.req.header("CF-Connecting-IP") || "unknown");
  return c.json({ ok: true });
});

app.post("/api/push/unsubscribe", sessionAuthApi, async (c) => {
  const auth = c.get("auth");
  const { endpoint } = await c.req.json<{ endpoint: string }>();
  if (!endpoint) return c.json({ error: "endpoint required" }, 400);
  const scopedDb = new UserScopedDb(getDb(c.env.DB), auth.userId, c.env.ENCRYPTION_KEY);
  await scopedDb.removePushSubscription(endpoint);
  audit(c.env.AUDIT_DB, auth.userId, "push_unsubscribe", undefined, c.req.header("CF-Connecting-IP") || "unknown");
  return c.json({ ok: true });
});

app.post("/api/push/test", sessionAuthApi, async (c) => {
  const auth = c.get("auth");
  const result = await sendPushToUser(c.env, auth.userId, {
    title: "JARVIS",
    body: "Push notifications are working, sir.",
    url: "/",
  });
  return c.json(result);
});

// --- Plan management (Square webhook stub + admin) ---
app.post("/api/webhooks/square", async (c) => {
  return c.json({ error: "not_implemented" }, 501);
});

app.route("/", proactive);

app.get("/api/account/plan", sessionAuthApi, (c) => {
  const auth = c.get("auth");
  return c.json({ plan: auth.plan, foundingMember: auth.foundingMember });
});

// --- WebSocket routing ---
const worker = {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/ws") {
      const daemonToken = request.headers.get("Sec-WebSocket-Protocol");
      if (!daemonToken) {
        return new Response("unauthorized", { status: 401 });
      }
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("expected websocket", { status: 426 });
      }
      const db = getDb(env.DB);
      const rows = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.daemonToken, daemonToken))
        .limit(1);
      if (rows.length === 0) {
        return new Response("unauthorized", { status: 401 });
      }
      const userId = rows[0].id;
      const doId = env.MAC_BRIDGE.idFromName(`user-${userId}`);
      const stub = env.MAC_BRIDGE.get(doId);
      return stub.fetch(
        new Request(`http://do/daemon?userId=${userId}`, { headers: request.headers }),
      );
    }

    if (url.pathname === "/ws/chat") {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("expected websocket", { status: 426 });
      }
      const cookie = request.headers.get("Cookie");
      const db = getDb(env.DB);
      const user = await getAuthFromCookie(cookie, db);
      if (!user) {
        return new Response("unauthorized", { status: 401 });
      }
      const id = env.MAC_BRIDGE.idFromName(`user-${user.id}`);
      const stub = env.MAC_BRIDGE.get(id);
      return stub.fetch(
        new Request(`http://do/chat?userId=${user.id}`, { headers: request.headers }),
      );
    }

    if (url.pathname === "/ws/agents") {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("expected websocket", { status: 426 });
      }
      const cookie = request.headers.get("Cookie");
      const db = getDb(env.DB);
      const user = await getAuthFromCookie(cookie, db);
      if (!user) {
        return new Response("unauthorized", { status: 401 });
      }
      const id = env.MAC_BRIDGE.idFromName(`user-${user.id}`);
      const stub = env.MAC_BRIDGE.get(id);
      return stub.fetch(
        new Request(`http://do/agents?userId=${user.id}`, { headers: request.headers }),
      );
    }

    if (url.pathname === "/ws/vnc" || url.pathname === "/ws/vnc-tunnel") {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("expected websocket", { status: 426 });
      }
      const cookie = request.headers.get("Cookie");
      const db = getDb(env.DB);
      const user = await getAuthFromCookie(cookie, db);
      if (!user) {
        return new Response("unauthorized", { status: 401 });
      }
      const doPath = url.pathname === "/ws/vnc" ? "/vnc" : "/vnc-tunnel";
      const doId = env.MAC_BRIDGE.idFromName(`user-${user.id}`);
      const stub = env.MAC_BRIDGE.get(doId);
      return stub.fetch(
        new Request(`http://do${doPath}?userId=${user.id}`, { headers: request.headers }),
      );
    }

    return app.fetch(request, env, ctx);
  },
};

export default worker;
export { MacBridge } from "./ace/durable-object";
