# BUILD REPORT — JARVIS Cloud (Cloudflare Workers + D1)

**Branch**: `cloudflare-workers-build`
**Date**: 2026-04-18
**Status**: Built and locally verified. NOT deployed.

---

## 1. File Inventory

| File | Lines | Purpose |
|------|------:|---------|
| `src/index.ts` | 21 | Hono app, /health + /mcp routes, auth middleware |
| `src/mcp.ts` | 22 | McpServer factory, tool registration |
| `src/tools/memory.ts` | 218 | 5 memory tools (profile, remember, forget) |
| `src/tools/weather.ts` | 100 | get_weather via Open-Meteo |
| `src/db/schema.ts` | 35 | Drizzle table defs (users, facts, people) |
| `src/db/client.ts` | 8 | D1 → Drizzle wrapper |
| `src/auth.ts` | 10 | Bearer token middleware for Hono |
| `src/logger.ts` | 15 | JSON-lines structured logger |
| `src/types.ts` | 4 | Env interface (D1 + auth token) |
| `migrations/0001_initial.sql` | 29 | Schema + indexes |
| `scripts/seed.ts` | 49 | Generates SQL from user_profile.json |
| `scripts/smoke_test.sh` | 73 | 7-check verification script |
| `wrangler.toml` | 10 | Workers config + D1 binding |
| `package.json` | 26 | Deps and scripts |
| `tsconfig.json` | 18 | Strict TypeScript config |

**Total TypeScript**: 616 lines
**Total source (all)**: 638 lines

## 2. Deviations from Brief

| Brief said | Actual | Rationale |
|------------|--------|-----------|
| `@modelcontextprotocol/sdk` only | Added `agents` package (v0.10.2) | Provides `createMcpHandler()` which handles Streamable HTTP transport natively on Workers — avoids manual fetch-to-node bridging |
| SSE transport | Streamable HTTP (via `createMcpHandler`) | Streamable HTTP is the successor to SSE in the MCP spec. `createMcpHandler` serves both SSE (GET) and Streamable HTTP (POST) at `/mcp`. Claude app should support this. |
| `drizzle-kit` in dev deps | Omitted | Not needed — migration SQL written by hand. Can add later for schema diffing. |
| seed.ts runs `wrangler d1 execute` directly | Outputs SQL to stdout | Security hook flagged `execSync`. Seed now pipes to wrangler: `npx tsx scripts/seed.ts > /tmp/seed.sql && wrangler d1 execute ...` |

## 3. Local Verification Output

```
=== JARVIS Cloud Smoke Test ===
Target: http://localhost:8787

[1/6] Health check
  PASS: health returns ok
[2/6] Auth rejection
  PASS: rejects missing auth (401)
[3/6] MCP initialize
  PASS: init returns server info
[4/6] Tool listing
  PASS: lists tools
[5/6] get_weather
  PASS: weather returns data
[6/6] Memory round-trip
  PASS: remember_about_user
  PASS: forget round-trip

Results: 7 passed, 0 failed
All checks passed.
```

TypeScript: zero type errors (`tsc --noEmit` clean).

## 4. Manual Steps for Avery Tomorrow

```bash
cd ~/Desktop/projects/jarvis-cloud
git checkout cloudflare-workers-build

# 1. Install wrangler (if not already)
npm install -g wrangler

# 2. Login
wrangler login

# 3. Create D1 database
wrangler d1 create jarvis-memory
# Copy database_id, paste into wrangler.toml

# 4. Apply migration
wrangler d1 migrations apply jarvis-memory --remote

# 5. Set auth token
wrangler secret put JARVIS_CLOUD_AUTH_TOKEN
# Paste a random 32-char token (save it!)

# 6. Seed memory
npx tsx scripts/seed.ts > /tmp/seed.sql
wrangler d1 execute jarvis-memory --remote --file=/tmp/seed.sql

# 7. Deploy
wrangler deploy

# 8. Custom domain
# Dashboard → Workers → jarvis-cloud → Settings → Domains → Add jarvis.avery-keller.net

# 9. Verify
curl https://jarvis.avery-keller.net/health
```

## 5. Known Gaps / Phase 2 Candidates

- **No session state**: Server is fully stateless (new McpServer per request). Fine for Phase 1 tools but limits future multi-step workflows.
- **Single user**: All queries hardcode `user_id = 1`. Multi-user would need auth context → user mapping.
- **No KV or R2**: Not needed for Phase 1. KV could cache weather responses; R2 could store file attachments.
- **No CI/CD**: Manual `wrangler deploy`. GitHub Actions workflow would be trivial to add.
- **Seed script is one-shot**: Doesn't handle incremental updates to user_profile.json. Re-running duplicates facts (uses `INSERT OR IGNORE` so it's safe, just doesn't update).
- **Expression index on D1**: `lower(name)` unique index — verified working locally, should work on remote D1 but worth confirming.
- **MCP transport compatibility**: Using Streamable HTTP via `createMcpHandler`. If Claude mobile app expects legacy SSE at `/mcp/sse`, the endpoint path may need adjustment. The `/mcp` path serves both protocols.
