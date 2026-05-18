# Jarvis Cloud — Cloudflare Worker

## Stack
- Runtime: Cloudflare Workers
- Framework: Hono
- Language: TypeScript
- Storage: Durable Objects (MacBridge), D1 (jarvis-memory, jarvis-audit)
- Deploy: `npx wrangler deploy`
- If wrangler MODULE_NOT_FOUND: `rm -rf node_modules && npm install --legacy-peer-deps`

## Architecture
- `src/index.ts` — Hono routes (auth, TTS, push, MCP, chat page serving)
- `src/ace/durable-object.ts` — MacBridge Durable Object: WebSocket relay between clients and daemon
- `src/ace/guardrails.ts` — Risk tier classification (low/medium/high/blocked) for task instructions
- `src/ace/templates.ts` — Fuzzy template matching for action learning (Jaccard similarity)
- `src/chat/page.ts` — Chat UI (single-file HTML/CSS/JS returned as string)
- `src/chat/live.ts` — Live screen view page
- `src/push/` — Web Push (VAPID) notification system
- `src/proactive/` — Scheduled jobs (discovery, updates, suggestions)

## Key patterns
- Durable Object tags WebSockets: "daemon", "client", "agent-client", "vnc-client", "vnc-daemon"
- Offline messages persist in DO storage when no clients connected, replay on reconnect
- Usage aggregated daily in DO storage keyed by `usage:YYYY-MM-DD`
- Templates stored as `tpl:keyword:keyword` with `{keywords, actions, instruction}` format
- High-risk tasks require client confirmation via `confirm_task` message type

## Environment variables (in wrangler.toml / secrets)
- FISH_AUDIO_API_KEY — TTS voice synthesis
- ENCRYPTION_KEY — audit log encryption
- VAPID keys — push notifications
