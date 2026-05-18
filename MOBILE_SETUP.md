# JARVIS Mobile Setup — Claude App MCP Servers

Add both servers to your Claude mobile app's MCP server settings.
One chat session, both tool sets available.

## Server 1: JARVIS Cloud (universal tools)

- **URL**: `https://jarvis.avery-keller.net/mcp`
- **Auth header**: `Authorization: Bearer <token-from-SETUP-step-5>`

### Tools available

- `get_user_profile` — your full profile
- `remember_about_user` / `forget_fact_about_user`
- `remember_person` / `forget_person`
- `get_weather`

## Server 2: JARVIS Mac Lite (GUI tools, Tailscale-only)

- **URL**: `http://<tailscale-ip>:7825/mcp/sse`
- **Auth header**: `Authorization: Bearer <token>`

Get your Tailscale IP and token:

```bash
tailscale ip -4
cat ~/.config/jarvis-mac-lite/token
```

### Tools available

- `get_screenshot` — capture your Mac display

## Claude App Configuration

In the Claude mobile app:

1. Go to Settings > MCP Servers
2. Add each server with the URL and auth header above
3. Both servers' tools appear in the same chat

## Requirements

- JARVIS Cloud: deployed on Cloudflare Workers (see SETUP.md)
- JARVIS Mac Lite: Mac on + Tailscale connected
- Phone: internet for cloud, same Tailscale network for mac-lite
