# Jarvis Cloud

Cloud backend for a personal AI assistant. Cloudflare Workers + Durable Objects + D1, written in TypeScript with Hono.

This is the cloud half of a paired system. A Mac daemon ([jarvis-daemon](https://github.com/averymkeller83-hub/jarvis-daemon)) maintains a persistent WebSocket connection to a Durable Object here, and phone or web clients connect to the same backend to send commands, view a live screen, and receive push notifications. The assistant runs an agentic Claude session on the Mac while this worker handles auth, routing, persistence, voice synthesis, push delivery, and the audit trail.

Deployed at `avery-keller.net`.

## What's in here

- **Auth and multi-tenancy.** PBKDF2 password hashing, UUID session cookies (HttpOnly + Secure + SameSite=Strict), per-email and per-IP rate limiting with lockout, plan-gated routes (free / Pro / founding member), and a bearer-token path for native daemons.
- **MacBridge Durable Object.** WebSocket relay between Mac daemons and clients. Tagged sockets (daemon, client, agent-client, vnc-daemon, vnc-client) with offline message persistence and replay on reconnect.
- **MCP server.** Memory tools (profile, facts, people), weather, and `ace` task control. Streamable HTTP transport mounted at `/mcp`.
- **Web Push.** VAPID JWT (ES256) signing and RFC 8291 payload encryption for closed-tab notifications.
- **Audit log.** A separate D1 database for security events, with sensitive payloads encrypted at rest using per-user HKDF-derived keys.
- **Proactive agent.** Scheduled discovery jobs that scan for things the user might want to know about, score them, and push suggestions when relevant.
- **Chat UI and live screen view.** Single-file HTML/CSS/JS pages served directly from the worker, no separate frontend deploy.
- **Risk-tier guardrails.** Task instructions classified as low / medium / high / blocked, with high-risk tasks requiring client confirmation before the daemon executes.

## Stack

- TypeScript (strict) on Cloudflare Workers
- Hono for routing
- D1 (serverless SQLite) via Drizzle ORM
- Durable Objects for WebSocket state and per-user real-time data
- MCP TypeScript SDK with Streamable HTTP
- Zod for input validation
- Fish Audio for TTS, Open-Meteo for weather

## Local dev

```bash
npm install
echo 'JARVIS_CLOUD_AUTH_TOKEN=dev-token' > .dev.vars
npx wrangler d1 migrations apply jarvis-memory --local
npm run dev
# Server runs on http://localhost:8787
# Health: curl http://localhost:8787/health
```

## Deploy

See [SETUP.md](SETUP.md) for step-by-step Cloudflare deployment. You'll need:

- A Cloudflare account with Workers, D1, and Durable Objects enabled
- Two D1 databases (`jarvis-memory` and `jarvis-audit`) with their IDs filled into `wrangler.toml`
- Secrets set via `wrangler secret put` (encryption key, VAPID keys, TTS API key)

```bash
npx wrangler deploy
npx wrangler tail              # stream live logs
```

## Project structure

```
src/
├── ace/         MacBridge Durable Object, guardrails, action templates
├── admin/       Admin dashboard routes and middleware
├── agents/      Multi-agent orchestration surface
├── auth/        Password hashing, sessions, rate limiting, headers, plan gating
├── chat/        Chat UI page and live screen view
├── crypto/      Per-user AES-GCM encryption with HKDF
├── db/          Drizzle schema, client, and UserScopedDb wrapper
├── legal/       Privacy policy, terms, upgrade page
├── proactive/   Scheduled discovery jobs and notification scoring
├── push/        Web Push (VAPID + RFC 8291)
├── setup/       Install script and onboarding page
├── tools/       MCP tools (memory, weather, ace)
├── audit.ts     Audit log writes
├── auth.ts      Middleware exports
├── index.ts     Hono app, route mounting
├── mcp.ts       MCP server factory
└── logger.ts    Structured JSON logger
```

## Status

Running in production with real users. This repository is a public snapshot; active development continues in private.

## License

MIT. See [LICENSE](LICENSE).
