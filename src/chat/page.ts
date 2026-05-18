export function getChatPage(plan: string = "free", foundingMember: boolean = false): string {
  const isPro = plan === "pro" || foundingMember;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="theme-color" content="#030712">
  <link rel="manifest" href="/manifest.json">
  <link rel="apple-touch-icon" href="/icon-192.png">
  <title>JARVIS</title>
  <style>
    :root {
      --bg: #030712;
      --surface: #0f172a;
      --surface-2: #1e293b;
      --border: rgba(56, 189, 248, 0.1);
      --border-bright: rgba(56, 189, 248, 0.25);
      --primary: #38bdf8;
      --primary-dim: #0c4a6e;
      --primary-glow: rgba(56, 189, 248, 0.15);
      --user-accent: #f59e0b;
      --user-glow: rgba(245, 158, 11, 0.12);
      --text: #f1f5f9;
      --text-dim: #cbd5e1;
      --muted: #64748b;
      --danger: #f87171;
      --success: #34d399;
      --font: -apple-system, 'SF Pro Display', system-ui, sans-serif;
      --mono: 'SF Mono', ui-monospace, monospace;
      --safe-top: env(safe-area-inset-top, 0px);
      --safe-bottom: env(safe-area-inset-bottom, 0px);
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    html, body {
      height: 100%;
      font-family: var(--font);
      background: var(--bg);
      color: var(--text);
      -webkit-font-smoothing: antialiased;
      -webkit-tap-highlight-color: transparent;
      overflow: hidden;
    }

    body {
      background-image: radial-gradient(circle at 1px 1px, rgba(56, 189, 248, 0.025) 1px, transparent 0);
      background-size: 32px 32px;
    }

    body::before {
      content: '';
      position: fixed;
      top: 0; left: 0; right: 0;
      height: 300px;
      background: radial-gradient(ellipse at top center, rgba(56, 189, 248, 0.04), transparent 70%);
      pointer-events: none;
      z-index: 0;
    }

    #app {
      position: relative;
      width: 100%;
      height: 100dvh;
      z-index: 1;
    }

    .screen {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      transition: opacity 0.5s ease;
    }

    .hidden { display: none !important; }
    .fade-out { opacity: 0; pointer-events: none; }

    /* ── Boot Screen ── */
    #boot {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 32px;
    }

    .reactor {
      position: relative;
      width: 80px;
      height: 80px;
    }

    .reactor-ring {
      position: absolute;
      border-radius: 50%;
      border: 1.5px solid var(--primary);
      opacity: 0;
      animation: ring-expand 1s ease-out forwards;
    }

    .reactor-ring:nth-child(1) { inset: 0; animation-delay: 0.1s; }
    .reactor-ring:nth-child(2) { inset: 12px; animation-delay: 0.25s; border-style: dashed; }
    .reactor-ring:nth-child(3) { inset: 24px; animation-delay: 0.4s; }

    .reactor-core {
      position: absolute;
      inset: 30px;
      border-radius: 50%;
      background: var(--primary);
      box-shadow: 0 0 20px var(--primary), 0 0 40px var(--primary-glow);
      opacity: 0;
      animation: core-on 0.4s ease-out 0.5s forwards, core-pulse 2s ease-in-out 0.9s infinite;
    }

    .boot-title {
      font-size: 28px;
      font-weight: 300;
      letter-spacing: 0.5em;
      text-indent: 0.5em;
      color: var(--primary);
      opacity: 0;
      animation: text-reveal 0.8s ease-out 0.7s forwards;
      text-shadow: 0 0 30px var(--primary-glow);
    }

    .boot-sub {
      font-family: var(--mono);
      font-size: 11px;
      color: var(--muted);
      letter-spacing: 0.15em;
      opacity: 0;
      animation: fade-up 0.5s ease-out 1.2s forwards;
    }


    /* auth styles removed — session-based auth via cookie */

    /* ── Chat Screen ── */
    #chat { display: flex; flex-direction: column; }

    .chat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 20px;
      padding-top: calc(12px + var(--safe-top));
      background: rgba(3, 7, 18, 0.85);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--border);
      z-index: 10;
      min-height: 56px;
    }

    .header-left { display: flex; align-items: center; gap: 10px; }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--muted);
      transition: background 0.3s, box-shadow 0.3s;
    }

    .status-dot.online {
      background: var(--success);
      box-shadow: 0 0 8px rgba(52, 211, 153, 0.5);
      animation: dot-pulse 2s ease-in-out infinite;
    }

    .status-dot.partial {
      background: var(--user-accent);
      box-shadow: 0 0 8px var(--user-glow);
      animation: dot-pulse 2s ease-in-out infinite;
    }

    .status-dot.error { background: var(--danger); }

    .header-title {
      font-size: 16px;
      font-weight: 500;
      letter-spacing: 0.15em;
      color: var(--text);
    }

    .header-status {
      font-family: var(--mono);
      font-size: 10px;
      color: var(--muted);
      letter-spacing: 0.1em;
    }

    .live-btn {
      font-family: var(--mono);
      font-size: 10px;
      letter-spacing: 0.08em;
      color: var(--primary);
      background: var(--primary-glow);
      border: 1px solid var(--border-bright);
      border-radius: 6px;
      padding: 4px 10px;
      cursor: pointer;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 5px;
      transition: all 0.15s;
    }

    .live-btn:active { transform: scale(0.95); }

    .live-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--primary);
      animation: dot-pulse 2s ease-in-out infinite;
    }

    .settings-btn {
      font-family: var(--mono);
      font-size: 14px;
      color: var(--muted);
      background: none;
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 3px 8px;
      cursor: pointer;
    }

    .settings-dropdown {
      display: none;
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 6px;
      background: var(--surface);
      border: 1px solid var(--border-bright);
      border-radius: 10px;
      padding: 12px 16px;
      min-width: 220px;
      z-index: 50;
      box-shadow: 0 8px 30px rgba(0,0,0,0.5);
    }
    .settings-dropdown.open { display: block; }

    .settings-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .settings-label {
      font-family: var(--mono);
      font-size: 11px;
      color: var(--text);
      letter-spacing: 0.04em;
    }
    .settings-sublabel {
      font-family: var(--mono);
      font-size: 9px;
      color: var(--muted);
      margin-top: 2px;
    }

    .toggle {
      position: relative;
      width: 40px;
      height: 22px;
      flex-shrink: 0;
    }
    .toggle input { opacity: 0; width: 0; height: 0; }
    .toggle-track {
      position: absolute;
      inset: 0;
      background: var(--surface-2, #1e293b);
      border: 1px solid var(--border);
      border-radius: 11px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .toggle-track::after {
      content: '';
      position: absolute;
      top: 2px;
      left: 2px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: var(--muted);
      transition: transform 0.2s, background 0.2s;
    }
    .toggle input:checked + .toggle-track {
      background: var(--primary-glow);
      border-color: var(--border-bright);
    }
    .toggle input:checked + .toggle-track::after {
      transform: translateX(18px);
      background: var(--primary);
    }

    /* ── Messages ── */
    .messages {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 16px 0;
      scroll-behavior: smooth;
      -webkit-overflow-scrolling: touch;
    }

    .messages::-webkit-scrollbar { width: 3px; }
    .messages::-webkit-scrollbar-track { background: transparent; }
    .messages::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

    .suggestion-card{background:var(--surface);border:1px solid rgba(56,189,248,0.2);border-radius:12px;padding:16px;margin:8px 0;max-width:420px}
    .suggestion-card h4{font-size:14px;color:var(--primary);margin-bottom:4px}
    .suggestion-card p{font-size:12px;color:var(--dim);line-height:1.5;margin-bottom:10px}
    .suggestion-card .safety{font-family:var(--mono);font-size:11px;margin-bottom:10px}
    .suggestion-card .safety.good{color:var(--success)}
    .suggestion-card .safety.warn{color:#f59e0b}
    .suggestion-card .actions{display:flex;gap:8px}
    .suggestion-card .btn-approve{padding:6px 14px;border-radius:6px;border:1px solid var(--success);background:rgba(52,211,153,0.1);color:var(--success);font-size:12px;cursor:pointer}
    .suggestion-card .btn-approve:hover{background:rgba(52,211,153,0.2)}
    .suggestion-card .btn-reject{padding:6px 14px;border-radius:6px;border:1px solid var(--border);background:transparent;color:var(--muted);font-size:12px;cursor:pointer}
    .suggestion-card .btn-reject:hover{color:var(--dim);border-color:var(--border-b)}

    .msg {
      display: flex;
      gap: 10px;
      padding: 8px 16px;
      animation: msg-in 0.35s ease-out;
    }

    .msg + .msg { margin-top: 6px; }
    .msg-jarvis { justify-content: flex-start; }
    .msg-user { justify-content: flex-end; }
    .msg-user > div { max-width: 82%; text-align: right; }

    .msg-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 600;
      flex-shrink: 0;
      margin-top: 2px;
      background: var(--primary-glow);
      color: var(--primary);
      border: 1px solid rgba(56, 189, 248, 0.25);
    }

    .msg-bubble {
      max-width: 82%;
      padding: 11px 15px;
      font-size: 15px;
      line-height: 1.6;
    }

    .msg-jarvis .msg-bubble {
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.8));
      border: 1px solid var(--border-bright);
      border-radius: 4px 18px 18px 18px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(56, 189, 248, 0.05);
    }

    .msg-user .msg-bubble {
      max-width: 100%;
      text-align: left;
      display: inline-block;
      background: rgba(56, 189, 248, 0.08);
      border: 1px solid rgba(56, 189, 248, 0.12);
      border-radius: 18px 4px 18px 18px;
      color: var(--text-dim);
    }

    .msg-time {
      font-size: 10px;
      color: var(--muted);
      margin-top: 4px;
      font-family: var(--mono);
    }

    .msg-footer { display: flex; align-items: center; gap: 8px; margin-top: 4px; }

    .msg-jarvis .msg-time { text-align: left; }
    .msg-user .msg-time { text-align: right; }

    .tts-btn {
      background: none; border: 1px solid var(--border); border-radius: 6px;
      color: var(--muted); font-size: 11px; padding: 2px 8px; cursor: pointer;
      font-family: var(--mono); display: flex; align-items: center; gap: 4px;
      transition: color 0.2s, border-color 0.2s;
    }
    .tts-btn:active { transform: scale(0.95); }
    .tts-btn.playing { color: var(--primary); border-color: var(--border-bright); }
    .tts-btn.pulse {
      color: var(--primary); border-color: var(--primary);
      animation: btn-pulse 1.5s ease-in-out infinite;
      box-shadow: 0 0 8px var(--primary-glow);
    }
    .tts-btn svg { width: 12px; height: 12px; }
    @keyframes btn-pulse {
      0%, 100% { box-shadow: 0 0 8px var(--primary-glow); transform: scale(1); }
      50% { box-shadow: 0 0 16px rgba(56, 189, 248, 0.4); transform: scale(1.1); }
    }

    .msg-bubble code {
      font-family: var(--mono);
      font-size: 13px;
      background: rgba(56, 189, 248, 0.08);
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid var(--border);
    }

    .msg-bubble pre {
      margin: 8px 0;
      padding: 10px 12px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow-x: auto;
      font-family: var(--mono);
      font-size: 13px;
      line-height: 1.5;
    }

    .msg-bubble pre code { background: none; border: none; padding: 0; }
    .msg-bubble a { color: var(--primary); text-decoration: none; }
    .msg-bubble strong { color: var(--text); }
    .msg-bubble p { margin: 0; }
    .msg-bubble p + p { margin-top: 8px; }
    .msg-bubble ul, .msg-bubble ol { margin: 6px 0; padding-left: 20px; }
    .msg-bubble li { margin: 2px 0; }
    .msg-bubble li::marker { color: var(--primary); }

    /* ── Thinking ── */
    .thinking-label {
      font-size: 10px;
      color: var(--muted);
      font-family: var(--mono);
      margin-top: 4px;
      letter-spacing: 0.04em;
    }

    .thinking-wave {
      display: flex;
      align-items: center;
      gap: 3px;
      padding: 6px 4px;
    }

    .thinking-wave span {
      width: 3px;
      height: 8px;
      background: var(--primary);
      border-radius: 2px;
      animation: wave-bounce 1.2s ease-in-out infinite;
    }

    .thinking-wave span:nth-child(2) { animation-delay: 0.1s; }
    .thinking-wave span:nth-child(3) { animation-delay: 0.2s; }
    .thinking-wave span:nth-child(4) { animation-delay: 0.3s; }
    .thinking-wave span:nth-child(5) { animation-delay: 0.4s; }

    /* ── Input Bar ── */
    .input-bar {
      display: flex;
      align-items: flex-end;
      gap: 10px;
      padding: 12px 16px;
      padding-bottom: calc(12px + var(--safe-bottom));
      background: rgba(3, 7, 18, 0.9);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-top: 1px solid var(--border);
    }

    .msg-input {
      flex: 1;
      padding: 12px 16px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 20px;
      color: var(--text);
      font-family: var(--font);
      font-size: 16px;
      outline: none;
      resize: none;
      max-height: 120px;
      line-height: 1.4;
      transition: border-color 0.2s;
    }

    .msg-input:focus { border-color: var(--border-bright); }
    .msg-input::placeholder { color: var(--muted); }

    .send-btn {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: 1px solid var(--border-bright);
      background: linear-gradient(135deg, var(--primary-dim), rgba(56, 189, 248, 0.15));
      color: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      flex-shrink: 0;
      transition: all 0.15s;
    }

    .send-btn:hover, .send-btn:active {
      background: linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(56, 189, 248, 0.35));
      box-shadow: 0 0 16px var(--primary-glow);
      transform: scale(1.05);
    }

    .send-btn:active { transform: scale(0.95); }
    .send-btn svg { width: 18px; height: 18px; }

    .attach-btn {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: 1px solid var(--border);
      background: transparent;
      color: var(--muted);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      flex-shrink: 0;
      transition: all 0.15s;
    }
    .attach-btn:hover, .attach-btn:active {
      color: var(--primary);
      border-color: var(--border-bright);
    }
    .attach-btn svg { width: 20px; height: 20px; }

    .attach-preview {
      display: none;
      padding: 8px 16px 0;
      background: rgba(3, 7, 18, 0.9);
    }
    .attach-preview.active { display: flex; gap: 8px; flex-wrap: wrap; }
    .attach-thumb {
      position: relative;
      width: 64px;
      height: 64px;
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid var(--border-bright);
    }
    .attach-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .attach-thumb .remove-attach {
      position: absolute;
      top: 2px;
      right: 2px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: rgba(0,0,0,0.7);
      border: none;
      color: var(--danger);
      font-size: 14px;
      line-height: 20px;
      text-align: center;
      cursor: pointer;
    }
    .attach-file-thumb {
      width: 64px;
      height: 64px;
      border-radius: 10px;
      border: 1px solid var(--border-bright);
      background: var(--surface);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .attach-file-thumb .file-icon { font-size: 20px; color: var(--primary); }
    .attach-file-thumb .file-name {
      font-size: 8px;
      color: var(--muted);
      max-width: 56px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-top: 2px;
    }
    .attach-file-thumb .remove-attach {
      position: absolute;
      top: 2px;
      right: 2px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: rgba(0,0,0,0.7);
      border: none;
      color: var(--danger);
      font-size: 14px;
      line-height: 20px;
      text-align: center;
      cursor: pointer;
    }

    .msg-image {
      max-width: 280px;
      border-radius: 10px;
      margin-top: 6px;
      cursor: pointer;
    }
    .msg-image:hover { opacity: 0.9; }
    .msg-file-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 8px;
      margin-top: 6px;
      font-size: 12px;
      color: var(--text-dim);
    }
    .msg-file-badge .file-icon { font-size: 16px; }

    /* ── System Messages ── */
    .msg-system {
      text-align: center;
      padding: 8px 16px;
      animation: msg-in 0.35s ease-out;
    }

    .msg-system span {
      font-family: var(--mono);
      font-size: 11px;
      color: var(--muted);
      background: var(--surface);
      padding: 4px 12px;
      border-radius: 10px;
      border: 1px solid var(--border);
      display: inline-block;
    }

    /* ── Keyframes ── */
    @keyframes ring-expand {
      0% { transform: scale(0.3); opacity: 0; }
      60% { opacity: 0.8; }
      100% { transform: scale(1); opacity: 0.5; }
    }

    @keyframes core-on {
      0% { opacity: 0; transform: scale(0); }
      100% { opacity: 1; transform: scale(1); }
    }

    @keyframes core-pulse {
      0%, 100% { opacity: 0.8; box-shadow: 0 0 15px var(--primary-glow); }
      50% { opacity: 1; box-shadow: 0 0 25px var(--primary), 0 0 40px var(--primary-glow); }
    }

    @keyframes text-reveal {
      0% { opacity: 0; letter-spacing: 1em; text-indent: 1em; }
      100% { opacity: 1; letter-spacing: 0.5em; text-indent: 0.5em; }
    }

    @keyframes fade-up {
      0% { opacity: 0; transform: translateY(8px); }
      100% { opacity: 1; transform: translateY(0); }
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    @keyframes dot-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    @keyframes msg-in {
      0% { opacity: 0; transform: translateY(12px); }
      100% { opacity: 1; transform: translateY(0); }
    }

    @keyframes wave-bounce {
      0%, 60%, 100% { transform: scaleY(0.5); opacity: 0.3; }
      30% { transform: scaleY(1.8); opacity: 1; }
    }

    .jarvis-wrap {
      position: fixed;
      bottom: calc(80px + var(--safe-bottom));
      right: 16px;
      z-index: 20;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }
    .jarvis-orb {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: var(--bg);
      border: 1.5px solid rgba(56, 189, 248, 0.35);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s;
      box-shadow: 0 0 20px rgba(56, 189, 248, 0.3), 0 0 60px rgba(56, 189, 248, 0.1);
      -webkit-tap-highlight-color: transparent;
      user-select: none;
      position: relative;
    }
    .jarvis-orb:active { transform: scale(0.9); }
    .orb-reactor { position: absolute; inset: 5px; }
    .orb-ring { position: absolute; border-radius: 50%; border: 1px solid rgba(56, 189, 248, 0.4); }
    .orb-ring:nth-child(1) { inset: 0; }
    .orb-ring:nth-child(2) { inset: 5px; border-style: dashed; border-color: rgba(56, 189, 248, 0.25); }
    .orb-ring:nth-child(3) { inset: 10px; }
    .orb-core {
      position: absolute; inset: 14px; border-radius: 50%;
      background: var(--primary);
      box-shadow: 0 0 8px var(--primary), 0 0 20px var(--primary-glow);
      animation: core-glow 2s ease-in-out infinite;
    }
    @keyframes core-glow {
      0%, 100% { opacity: 0.8; box-shadow: 0 0 8px var(--primary), 0 0 20px var(--primary-glow); }
      50% { opacity: 1; box-shadow: 0 0 12px var(--primary), 0 0 30px rgba(56, 189, 248, 0.4); }
    }
    .orb-label {
      font-family: var(--mono); font-size: 9px; letter-spacing: 0.12em;
      color: var(--muted); opacity: 0; transition: opacity 0.2s, color 0.2s;
      text-align: center; pointer-events: none;
    }
    .orb-label.show { opacity: 1; }
    .orb-label.listening { color: var(--success); }
    .orb-label.thinking { color: #fbbf24; }
    .orb-label.speaking { color: var(--primary); }
    .jarvis-orb.listening {
      animation: orb-pulse 1.5s ease-in-out infinite;
      border-color: var(--success);
      box-shadow: 0 0 25px rgba(52, 211, 153, 0.5), 0 0 80px rgba(52, 211, 153, 0.15);
    }
    .jarvis-orb.thinking {
      animation: orb-spin 1.2s linear infinite;
      border-color: #fbbf24;
      box-shadow: 0 0 25px rgba(251, 191, 36, 0.4), 0 0 80px rgba(251, 191, 36, 0.1);
    }
    .jarvis-orb.speaking {
      animation: orb-speak 0.6s ease-in-out infinite;
      border-color: var(--primary);
      box-shadow: 0 0 30px rgba(56, 189, 248, 0.6), 0 0 80px rgba(56, 189, 248, 0.2);
    }
    @keyframes orb-pulse {
      0%, 100% { box-shadow: 0 0 25px rgba(52, 211, 153, 0.5), 0 0 80px rgba(52, 211, 153, 0.15); transform: scale(1); }
      50% { box-shadow: 0 0 40px rgba(52, 211, 153, 0.7), 0 0 100px rgba(52, 211, 153, 0.25); transform: scale(1.08); }
    }
    @keyframes orb-spin {
      0% { border-color: #fbbf24; } 33% { border-color: var(--primary); }
      66% { border-color: #a78bfa; } 100% { border-color: #fbbf24; }
    }
    @keyframes orb-speak {
      0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); }
    }
    .jarvis-toast {
      position: fixed; top: calc(60px + var(--safe-top)); left: 16px; right: 16px;
      background: rgba(15, 23, 42, 0.95); border: 1px solid var(--border-bright);
      border-radius: 12px; padding: 12px 16px; font-size: 14px; line-height: 1.5;
      color: var(--text); z-index: 25; backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
      transform: translateY(-20px); opacity: 0; transition: transform 0.3s, opacity 0.3s;
      pointer-events: none; max-height: 40vh; overflow-y: auto; white-space: pre-wrap; word-wrap: break-word;
    }
    .jarvis-toast.show { transform: translateY(0); opacity: 1; pointer-events: auto; }
    .jarvis-toast .toast-label { font-family: var(--mono); font-size: 10px; color: var(--primary); letter-spacing: 0.1em; margin-bottom: 4px; }
    .jarvis-toast .toast-text { color: var(--text); }
    .jarvis-toast .toast-user { font-size: 12px; color: var(--muted); font-style: italic; margin-bottom: 6px; }
  </style>
</head>
<body>
  <div id="app">
    <div id="boot" class="screen">
      <div class="reactor">
        <div class="reactor-ring"></div>
        <div class="reactor-ring"></div>
        <div class="reactor-ring"></div>
        <div class="reactor-core"></div>
      </div>
      <div class="boot-title">JARVIS</div>
      <div class="boot-sub">PERSONAL AI SYSTEM v4.0</div>
    </div>
    <div id="chat" class="screen hidden">
      <header class="chat-header">
        <div class="header-left">
          <div class="status-dot" id="status-dot"></div>
          <span class="header-title">JARVIS</span>
          <span id="usage-badge" style="font-size:10px;color:rgba(255,255,255,0.4);margin-left:8px;font-family:monospace;display:none;"></span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;position:relative;">
          ${isPro ? '<a id="remote-btn" class="live-btn" style="border-color:rgba(52,211,153,0.3);color:#34d399;cursor:pointer;">REMOTE</a><a href="/live" class="live-btn"><span class="live-dot"></span>LIVE</a><a href="/agents" class="live-btn" style="border-color:rgba(56,189,248,0.2);color:#38bdf8;">AGENTS</a>' : ""}
          <a href="https://vox.avery-keller.net" target="_blank" class="live-btn" style="border-color:rgba(168,85,247,0.3);color:#a855f7;background:rgba(168,85,247,0.1);">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            VOX
          </a>
          <button class="settings-btn" id="settings-btn" aria-label="Settings">&#9881;</button>
          <div class="settings-dropdown" id="settings-dropdown">
            <div class="settings-row">
              <div>
                <div class="settings-label">REMOTE CONTROL</div>
                <div class="settings-sublabel">Allow touch input on live view</div>
              </div>
              <label class="toggle">
                <input type="checkbox" id="control-toggle">
                <span class="toggle-track"></span>
              </label>
            </div>
            <div class="settings-row">
              <div>
                <div class="settings-label">NOTIFICATIONS</div>
                <div class="settings-sublabel">Push alerts &amp; reminders</div>
              </div>
              <label class="toggle">
                <input type="checkbox" id="push-toggle">
                <span class="toggle-track"></span>
              </label>
            </div>
            <div class="settings-row">
              <div>
                <div class="settings-label">HEY JARVIS</div>
                <div class="settings-sublabel">Wake word — hands-free activation</div>
              </div>
              <label class="toggle">
                <input type="checkbox" id="wakeword-toggle">
                <span class="toggle-track"></span>
              </label>
            </div>
            <div style="border-top:1px solid var(--border);margin-top:10px;padding-top:10px;">
              <div class="settings-row" style="margin-bottom:10px;">
                <div>
                  <div class="settings-label">VOICE</div>
                  <div class="settings-sublabel">TTS speaker for JARVIS${isPro ? "" : " (Pro unlocks 40+ voices)"}</div>
                </div>
                <select id="voice-select" style="background:var(--surface-2);border:1px solid var(--border);border-radius:6px;color:var(--text);font-family:var(--mono);font-size:11px;padding:4px 6px;outline:none;"${isPro ? "" : " disabled"}>
                  <option value="draco">Draco (M)</option>
                  ${isPro ? `<optgroup label="British">
                    <option value="athena">Athena (F)</option>
                    <option value="electra">Electra (F)</option>
                  </optgroup>
                  <optgroup label="American">
                    <option value="orpheus">Orpheus (M)</option>
                    <option value="apollo">Apollo (M)</option>
                    <option value="hermes">Hermes (M)</option>
                    <option value="jupiter">Jupiter (M)</option>
                    <option value="luna">Luna (F)</option>
                    <option value="helena">Helena (F)</option>
                    <option value="thalia">Thalia (F)</option>
                  </optgroup>
                  <optgroup label="Australian">
                    <option value="hyperion">Hyperion (M)</option>
                    <option value="theia">Theia (F)</option>
                  </optgroup>
                  <optgroup label="Other">
                    <option value="amalthea">Amalthea (F)</option>
                    <option value="mars">Mars (M)</option>
                    <option value="neptune">Neptune (M)</option>
                    <option value="orion">Orion (M)</option>
                    <option value="zeus">Zeus (M)</option>
                    <option value="aurora">Aurora (F)</option>
                    <option value="hera">Hera (F)</option>
                    <option value="iris">Iris (F)</option>
                    <option value="juno">Juno (F)</option>
                  </optgroup>` : ""}
                </select>
              </div>
              ${foundingMember ? '<a href="/upgrade" style="display:block;width:100%;padding:10px;margin-bottom:10px;background:linear-gradient(135deg,rgba(245,158,11,0.1),rgba(249,115,22,0.1));border:1px solid rgba(245,158,11,0.3);border-radius:8px;color:#f59e0b;font-family:var(--mono);font-size:11px;letter-spacing:0.08em;text-align:center;text-decoration:none;">FOUNDING MEMBER</a>' : !isPro ? '<a href="/upgrade" style="display:block;width:100%;padding:10px;margin-bottom:10px;background:linear-gradient(135deg,rgba(56,189,248,0.1),rgba(129,140,248,0.1));border:1px solid rgba(56,189,248,0.25);border-radius:8px;color:var(--primary);font-family:var(--mono);font-size:11px;letter-spacing:0.08em;text-align:center;text-decoration:none;">UPGRADE TO PRO</a>' : ""}
              <a href="/setup" style="display:block;width:100%;padding:10px;margin-bottom:10px;background:rgba(52,211,153,0.08);border:1px solid rgba(52,211,153,0.2);border-radius:8px;color:var(--success);font-family:var(--mono);font-size:11px;letter-spacing:0.08em;text-align:center;text-decoration:none;">MAC SETUP</a>
              <button id="clear-chat-btn" style="width:100%;padding:8px;background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.25);border-radius:8px;color:var(--danger);font-family:var(--mono);font-size:11px;letter-spacing:0.08em;cursor:pointer;">CLEAR CHAT</button>
              <button id="logout-btn" style="width:100%;padding:8px;margin-top:8px;background:rgba(248,113,113,0.05);border:1px solid rgba(248,113,113,0.15);border-radius:8px;color:var(--danger);font-family:var(--mono);font-size:11px;letter-spacing:0.08em;cursor:pointer;">SIGN OUT</button>
            </div>
          </div>
          <span class="header-status" id="header-status">CONNECTING</span>
        </div>
      </header>
      <div class="messages" id="messages"></div>
      <div class="attach-preview" id="attach-preview"></div>
      <div class="input-bar">
        <input type="file" id="file-input" accept="image/*,.pdf,.txt,.csv,.json,.md,.py,.ts,.js,.html,.css" multiple style="display:none">
        <button class="attach-btn" id="attach-btn" aria-label="Attach file">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"></path>
          </svg>
        </button>
        <textarea class="msg-input" id="msg-input" placeholder="Message JARVIS..." rows="1" autocomplete="off"></textarea>
        <button class="send-btn" id="send-btn" aria-label="Send message">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="19" x2="12" y2="5"></line>
            <polyline points="5 12 12 5 19 12"></polyline>
          </svg>
        </button>
      </div>
    </div>
  </div>

  <div class="jarvis-wrap" id="jarvis-wrap" style="display:none;">
    <div class="jarvis-orb" id="jarvis-orb"><div class="orb-reactor"><div class="orb-ring"></div><div class="orb-ring"></div><div class="orb-ring"></div><div class="orb-core"></div></div></div>
    <div class="orb-label" id="orb-label"></div>
  </div>

  <audio id="tts-player" playsinline webkit-playsinline preload="auto"></audio>

  <div class="jarvis-toast" id="jarvis-toast">
    <div class="toast-user" id="toast-user"></div>
    <div class="toast-label">JARVIS</div>
    <div class="toast-text" id="toast-text"></div>
  </div>

  <script>window.__JARVIS = { isPro: ${isPro}, foundingMember: ${foundingMember} };</script>
  <script src="/chat-app.js"></script>
</body>
</html>`;
}
