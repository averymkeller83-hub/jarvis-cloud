# JARVIS Cloud — Deployment Guide

All steps run from the `jarvis-cloud` repo root.

## Prerequisites

- Node.js 18+
- A Cloudflare account (free tier works)
- Domain `avery-keller.net` on Cloudflare DNS

## Step 1: Install Wrangler

```bash
npm install -g wrangler
```

## Step 2: Login to Cloudflare

```bash
wrangler login
```

Opens a browser to authorize. Follow the prompts.

## Step 3: Create D1 Database

```bash
wrangler d1 create jarvis-memory
```

Copy the `database_id` from the output and paste it into `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "jarvis-memory"
database_id = "YOUR_ID_HERE"    # <-- paste here
```

## Step 4: Run Migrations

```bash
# Remote (production)
wrangler d1 migrations apply jarvis-memory --remote
```

## Step 5: Set Auth Token

Generate a random 32-character token and save it somewhere safe:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

Then set it as a Workers secret:

```bash
wrangler secret put JARVIS_CLOUD_AUTH_TOKEN
# Paste the token when prompted
```

Save this token — you'll need it for mobile Claude app config.

## Step 6: Seed Memory

```bash
npx tsx scripts/seed.ts > /tmp/seed.sql
wrangler d1 execute jarvis-memory --remote --file=/tmp/seed.sql
```

## Step 7: Deploy

```bash
wrangler deploy
```

## Step 8: Custom Domain

1. Go to Cloudflare Dashboard → Workers & Pages → jarvis-cloud
2. Click **Settings** → **Domains & Routes**
3. Click **Add** → **Custom Domain**
4. Enter `jarvis.avery-keller.net`
5. Cloudflare handles DNS + TLS automatically (no grey/orange cloud decision needed — Workers custom domains are different from proxied DNS records)

## Step 9: Verify

```bash
# Health check
curl https://jarvis.avery-keller.net/health

# MCP endpoint (should return 401 without auth)
curl -s -o /dev/null -w "%{http_code}" -X POST https://jarvis.avery-keller.net/mcp

# MCP with auth (should return server info)
curl -X POST https://jarvis.avery-keller.net/mcp \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}'
```
