#!/bin/bash
set -euo pipefail

BASE="${1:-https://avery-keller.net}"
TOKEN="${JARVIS_CLOUD_AUTH_TOKEN:-}"
PASS=0
FAIL=0
SKIP=0

ok()   { PASS=$((PASS + 1)); printf "  \033[32mPASS\033[0m %s\n" "$1"; }
fail() { FAIL=$((FAIL + 1)); printf "  \033[31mFAIL\033[0m %s\n" "$1"; }
skip() { SKIP=$((SKIP + 1)); printf "  \033[33mSKIP\033[0m %s\n" "$1"; }

check_status() {
  local url="$1" expected="$2" label="$3"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
  if [ "$code" = "$expected" ]; then ok "$label ($code)"; else fail "$label: expected $expected, got $code"; fi
}

check_content_type() {
  local url="$1" expected="$2" label="$3"
  local ct
  ct=$(curl -sI "$url" 2>/dev/null | grep -i "^content-type:" | tr -d '\r' | head -1)
  if echo "$ct" | grep -qi "$expected"; then ok "$label"; else fail "$label: $ct"; fi
}

echo "=== JARVIS Cloud Post-Deploy Health Check ==="
echo "Target: $BASE"
echo ""

# --- Section 1: Public endpoints ---
echo "[1/7] Public endpoints"
check_status "$BASE/health" "200" "GET /health"
HEALTH=$(curl -sf "$BASE/health" 2>/dev/null || echo "{}")
if echo "$HEALTH" | grep -q '"ok"'; then ok "/health body has ok"; else fail "/health body: $HEALTH"; fi

check_status "$BASE/login" "200" "GET /login"
check_status "$BASE/signup" "200" "GET /signup"
check_status "$BASE/terms" "200" "GET /terms"
check_status "$BASE/privacy" "200" "GET /privacy"
check_status "$BASE/install.sh" "200" "GET /install.sh"

# --- Section 2: Static assets ---
echo ""
echo "[2/7] Static assets"
check_content_type "$BASE/chat-app.js" "javascript" "GET /chat-app.js"
check_content_type "$BASE/novnc.js" "javascript" "GET /novnc.js"
check_content_type "$BASE/sw.js" "javascript" "GET /sw.js"
check_content_type "$BASE/icon-192.png" "image/png" "GET /icon-192.png"
check_content_type "$BASE/icon-512.png" "image/png" "GET /icon-512.png"
check_content_type "$BASE/manifest.json" "json" "GET /manifest.json"

MANIFEST=$(curl -sf "$BASE/manifest.json" 2>/dev/null || echo "{}")
if echo "$MANIFEST" | grep -q '"JARVIS"'; then ok "manifest has app name"; else fail "manifest missing JARVIS name"; fi

# --- Section 3: Auth protection ---
echo ""
echo "[3/7] Auth protection"
check_status "$BASE/api/auth/me" "401" "GET /api/auth/me rejects unauthed"

SETUP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/setup" 2>/dev/null || echo "000")
if [ "$SETUP_CODE" = "302" ] || [ "$SETUP_CODE" = "401" ]; then ok "GET /setup protected ($SETUP_CODE)"; else fail "/setup: expected 302/401, got $SETUP_CODE"; fi

ROOT_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/" 2>/dev/null || echo "000")
if [ "$ROOT_CODE" = "302" ] || [ "$ROOT_CODE" = "200" ]; then ok "GET / returns $ROOT_CODE"; else fail "/: unexpected $ROOT_CODE"; fi

MCP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/mcp" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' 2>/dev/null || echo "000")
if [ "$MCP_CODE" = "401" ]; then ok "POST /mcp rejects missing auth"; else fail "POST /mcp: expected 401, got $MCP_CODE"; fi

# --- Sections 4-7: MCP tests (require JARVIS_CLOUD_AUTH_TOKEN) ---
if [ -z "$TOKEN" ]; then
  echo ""
  echo "[4-7] MCP tests — SKIPPED (set JARVIS_CLOUD_AUTH_TOKEN to run)"
  skip "MCP initialize"
  skip "Tool listing"
  skip "get_weather"
  skip "Memory round-trip (remember)"
  skip "Memory round-trip (forget)"
else

echo ""
echo "[4/7] MCP initialize"
INIT=$(curl -sf --max-time 10 -X POST "$BASE/mcp" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"smoke-test","version":"1.0.0"}}}' 2>/dev/null || echo "CURL_FAIL")
if echo "$INIT" | grep -q "jarvis-cloud"; then ok "init returns server info"; else fail "init: ${INIT:0:200}"; fi

# --- Section 5: Tool list ---
echo ""
echo "[5/7] Tool listing"
TOOLS=$(curl -sf --max-time 10 -X POST "$BASE/mcp" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' 2>/dev/null || echo "CURL_FAIL")
if echo "$TOOLS" | grep -q "get_user_profile"; then ok "lists tools"; else fail "tools: ${TOOLS:0:200}"; fi

# --- Section 6: Weather tool ---
echo ""
echo "[6/7] get_weather"
WEATHER=$(curl -sf --max-time 15 -X POST "$BASE/mcp" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"get_weather","arguments":{"location":"Bloomington, IN"}}}' 2>/dev/null || echo "CURL_FAIL")
if echo "$WEATHER" | grep -qi "weather\|temperature\|bloomington"; then ok "weather returns data"; else fail "weather: ${WEATHER:0:200}"; fi

# --- Section 7: Memory round-trip ---
echo ""
echo "[7/7] Memory round-trip"
REMEMBER=$(curl -sf --max-time 10 -X POST "$BASE/mcp" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"remember_about_user","arguments":{"fact":"smoke test canary 12345"}}}' 2>/dev/null || echo "CURL_FAIL")
if echo "$REMEMBER" | grep -qi "noted\|already"; then ok "remember_about_user"; else fail "remember: ${REMEMBER:0:200}"; fi

FORGET=$(curl -sf --max-time 10 -X POST "$BASE/mcp" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"forget_fact_about_user","arguments":{"fact_snippet":"canary 12345"}}}' 2>/dev/null || echo "CURL_FAIL")
if echo "$FORGET" | grep -qi "forgot\|no fact"; then ok "forget round-trip"; else fail "forget: ${FORGET:0:200}"; fi

fi

# --- Summary ---
echo ""
echo "================================"
printf "Results: \033[32m%d passed\033[0m, \033[31m%d failed\033[0m, \033[33m%d skipped\033[0m\n" "$PASS" "$FAIL" "$SKIP"
[ "$FAIL" -eq 0 ] && echo "All checks passed." || (echo "Some checks failed." && exit 1)
