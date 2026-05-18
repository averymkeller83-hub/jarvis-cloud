# JARVIS Cloud

Cloud-hosted MCP server for JARVIS on Cloudflare Workers + D1. Reachable from any device via `jarvis.avery-keller.net`.

## Phase 1 Tools

- `get_user_profile` — full profile with facts, people, preferences
- `remember_about_user` / `forget_fact_about_user` — add/remove facts
- `remember_person` / `forget_person` — add/remove people
- `get_weather` — current weather via Open-Meteo (no API key needed)

## Stack

- TypeScript (strict) on Cloudflare Workers
- Hono web framework
- MCP TypeScript SDK with Streamable HTTP transport
- D1 (serverless SQLite) via Drizzle ORM
- Zod input validation

## Local Dev

```bash
npm install
npx wrangler d1 migrations apply jarvis-memory --local
npm run dev
# Server runs on http://localhost:8787
# Health: curl http://localhost:8787/health
```

## Deploy

See [SETUP.md](SETUP.md) for step-by-step Cloudflare deployment.

## Logs

```bash
npx wrangler tail              # stream live logs
npx wrangler tail --format json # structured JSON output
```
