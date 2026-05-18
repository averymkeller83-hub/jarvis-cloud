export function getLivePage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="theme-color" content="#030712">
  <title>JARVIS — Remote Desktop</title>
  <style>
    :root {
      --bg: #030712;
      --surface: #0f172a;
      --border: rgba(56, 189, 248, 0.1);
      --border-bright: rgba(56, 189, 248, 0.25);
      --primary: #38bdf8;
      --primary-glow: rgba(56, 189, 248, 0.15);
      --text: #f1f5f9;
      --muted: #64748b;
      --success: #34d399;
      --danger: #f87171;
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
      overflow: hidden;
    }

    #app {
      display: flex;
      flex-direction: column;
      height: 100dvh;
    }

    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      padding-top: calc(10px + var(--safe-top));
      background: rgba(3, 7, 18, 0.9);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--border);
      z-index: 10;
      gap: 12px;
    }

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .back-btn {
      background: none;
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--primary);
      padding: 6px 10px;
      font-size: 13px;
      cursor: pointer;
      text-decoration: none;
      font-family: var(--mono);
    }

    .toolbar-title {
      font-size: 14px;
      font-weight: 500;
      letter-spacing: 0.1em;
    }

    .status-badge {
      font-family: var(--mono);
      font-size: 10px;
      padding: 3px 8px;
      border-radius: 6px;
      border: 1px solid var(--border);
      letter-spacing: 0.05em;
    }

    .status-badge.live {
      color: var(--success);
      border-color: rgba(52, 211, 153, 0.3);
      background: rgba(52, 211, 153, 0.08);
    }

    .status-badge.error {
      color: var(--danger);
      border-color: rgba(248, 113, 113, 0.3);
      background: rgba(248, 113, 113, 0.08);
    }

    .status-badge.connecting {
      color: var(--primary);
      border-color: var(--border-bright);
    }

    .screen-area {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      background: #000;
      position: relative;
    }

    #vnc-container {
      width: 100%;
      height: 100%;
    }

    #vnc-container canvas {
      width: 100% !important;
      height: 100% !important;
      object-fit: contain;
    }

    .overlay {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.85);
      z-index: 5;
      gap: 16px;
      padding: 24px;
    }

    .overlay.hidden { display: none; }

    .overlay-icon {
      font-size: 48px;
      opacity: 0.4;
    }

    .overlay-title {
      font-family: var(--mono);
      font-size: 14px;
      letter-spacing: 0.1em;
      color: var(--text);
    }

    .overlay-text {
      font-family: var(--mono);
      font-size: 11px;
      color: var(--muted);
      text-align: center;
      line-height: 1.6;
      max-width: 320px;
    }

    .password-form {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .password-input {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--text);
      padding: 10px 14px;
      font-family: var(--mono);
      font-size: 13px;
      outline: none;
      width: 200px;
    }

    .password-input:focus {
      border-color: var(--border-bright);
    }

    .connect-btn {
      background: var(--primary-glow);
      border: 1px solid var(--border-bright);
      border-radius: 8px;
      color: var(--primary);
      padding: 10px 16px;
      font-family: var(--mono);
      font-size: 12px;
      cursor: pointer;
      letter-spacing: 0.05em;
    }

    .controls {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 12px 16px;
      padding-bottom: calc(12px + var(--safe-bottom));
      background: rgba(3, 7, 18, 0.9);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-top: 1px solid var(--border);
    }

    .ctrl-btn {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      color: var(--text);
      padding: 10px 16px;
      font-family: var(--mono);
      font-size: 12px;
      cursor: pointer;
      transition: all 0.15s;
      letter-spacing: 0.05em;
    }

    .ctrl-btn:active { transform: scale(0.95); }

    .ctrl-btn.active {
      border-color: var(--border-bright);
      color: var(--primary);
      background: var(--primary-glow);
    }

    .ctrl-btn:disabled {
      opacity: 0.4;
      cursor: default;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .connecting .status-badge { animation: pulse 1.5s infinite; }

    @media (orientation: landscape) {
      .toolbar { display: none; }
      .controls { display: none; }
      .jarvis-wrap { bottom: 12px; right: 12px; }
      .jarvis-orb { width: 42px; height: 42px; font-size: 17px; }
      .jarvis-toast { top: 10px; left: 10px; right: 10px; font-size: 13px; padding: 8px 12px; }
      #app { height: 100dvh; }
      .screen-area { border-radius: 0; }
    }

    .jarvis-wrap {
      position: fixed;
      bottom: calc(70px + var(--safe-bottom));
      right: 16px;
      z-index: 20;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }
    .jarvis-orb {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: var(--bg);
      border: 1.5px solid rgba(56, 189, 248, 0.35);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transform: scale(0);
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s;
      box-shadow: 0 0 20px rgba(56, 189, 248, 0.3), 0 0 60px rgba(56, 189, 248, 0.1);
      -webkit-tap-highlight-color: transparent;
      user-select: none;
      position: relative;
    }
    .orb-reactor {
      position: absolute;
      inset: 6px;
    }
    .orb-ring {
      position: absolute;
      border-radius: 50%;
      border: 1px solid rgba(56, 189, 248, 0.4);
    }
    .orb-ring:nth-child(1) { inset: 0; }
    .orb-ring:nth-child(2) { inset: 6px; border-style: dashed; border-color: rgba(56, 189, 248, 0.25); }
    .orb-ring:nth-child(3) { inset: 12px; }
    .orb-core {
      position: absolute;
      inset: 16px;
      border-radius: 50%;
      background: var(--primary);
      box-shadow: 0 0 8px var(--primary), 0 0 20px var(--primary-glow);
      animation: core-glow 2s ease-in-out infinite;
    }
    @keyframes core-glow {
      0%, 100% { opacity: 0.8; box-shadow: 0 0 8px var(--primary), 0 0 20px var(--primary-glow); }
      50% { opacity: 1; box-shadow: 0 0 12px var(--primary), 0 0 30px rgba(56, 189, 248, 0.4); }
    }
    .jarvis-orb.booted {
      opacity: 1;
      transform: scale(1);
    }
    .jarvis-orb:active { transform: scale(0.9); }
    .orb-label {
      font-family: var(--mono);
      font-size: 9px;
      letter-spacing: 0.12em;
      color: var(--muted);
      opacity: 0;
      transition: opacity 0.2s, color 0.2s;
      text-align: center;
      pointer-events: none;
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
      0% { border-color: #fbbf24; }
      33% { border-color: var(--primary); }
      66% { border-color: #a78bfa; }
      100% { border-color: #fbbf24; }
    }
    @keyframes orb-speak {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    @keyframes orb-boot {
      0% { opacity: 0; transform: scale(0); box-shadow: 0 0 0 rgba(56, 189, 248, 0); }
      50% { opacity: 1; transform: scale(1.3); box-shadow: 0 0 60px rgba(56, 189, 248, 0.8); }
      100% { opacity: 1; transform: scale(1); box-shadow: 0 0 20px rgba(56, 189, 248, 0.3), 0 0 60px rgba(56, 189, 248, 0.1); }
    }
    .jarvis-orb.boot-anim {
      animation: orb-boot 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }

    .jarvis-toast {
      position: fixed;
      top: calc(60px + var(--safe-top));
      left: 16px;
      right: 16px;
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid var(--border-bright);
      border-radius: 12px;
      padding: 12px 16px;
      font-size: 14px;
      line-height: 1.5;
      color: var(--text);
      z-index: 25;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      transform: translateY(-20px);
      opacity: 0;
      transition: transform 0.3s, opacity 0.3s;
      pointer-events: none;
      max-height: 40vh;
      overflow-y: auto;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .jarvis-toast.show {
      transform: translateY(0);
      opacity: 1;
      pointer-events: auto;
    }
    .jarvis-toast .toast-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    .jarvis-toast .toast-label {
      font-family: var(--mono);
      font-size: 10px;
      color: var(--primary);
      letter-spacing: 0.1em;
    }
    .toast-speak-btn {
      background: var(--primary-glow);
      border: 1px solid var(--border-bright);
      border-radius: 6px;
      color: var(--primary);
      font-size: 16px;
      padding: 2px 8px;
      cursor: pointer;
      line-height: 1;
    }
    .toast-speak-btn:active { transform: scale(0.9); }
    .jarvis-toast .toast-text {
      color: var(--text);
    }
    .jarvis-toast .toast-user {
      font-size: 12px;
      color: var(--muted);
      font-style: italic;
      margin-bottom: 6px;
    }

  </style>
</head>
<body>
  <div id="app">
    <div class="toolbar">
      <div class="toolbar-left">
        <a href="/" class="back-btn">CHAT</a>
        <span class="toolbar-title">REMOTE DESKTOP</span>
      </div>
      <span class="status-badge" id="status">READY</span>
    </div>

    <div class="screen-area">
      <div id="vnc-container"></div>

      <div class="overlay" id="connect-overlay">
        <div class="overlay-icon">&#9654;</div>
        <div class="overlay-title">CONNECT TO MAC</div>
        <div class="overlay-text">
          Enter your macOS username and password.<br>
          Screen Sharing must be enabled on your Mac.
        </div>
        <div class="password-form" style="flex-direction:column;">
          <input type="text" class="password-input" id="vnc-username" placeholder="macOS Username" autocomplete="off">
          <input type="password" class="password-input" id="vnc-password" placeholder="macOS Password" autocomplete="off">
          <button class="connect-btn" id="connect-btn">CONNECT</button>
        </div>
        <a href="/" style="font-family:var(--mono);font-size:11px;color:var(--muted);letter-spacing:0.08em;margin-top:12px;text-decoration:none;border-bottom:1px solid var(--border);padding-bottom:2px;">BACK TO CHAT</a>
      </div>

      <textarea id="kb-input" autocapitalize="off" autocomplete="off" autocorrect="off" spellcheck="false" style="position:absolute;bottom:0;left:0;width:100%;height:44px;opacity:0.01;z-index:4;font-size:16px;pointer-events:none;resize:none;"></textarea>

      <div class="overlay hidden" id="error-overlay">
        <div class="overlay-icon">&#9888;</div>
        <div class="overlay-title" id="error-title">CONNECTION LOST</div>
        <div class="overlay-text" id="error-text"></div>
        <button class="connect-btn" id="reconnect-btn">RECONNECT</button>
      </div>
    </div>

    <div class="controls">
      <button class="ctrl-btn" id="keyboard-btn" disabled>KEYBOARD</button>
      <button class="ctrl-btn" id="viewonly-btn">VIEW ONLY</button>
      <button class="ctrl-btn" id="disconnect-btn" disabled>DISCONNECT</button>
    </div>
  </div>

  <div class="jarvis-wrap">
    <div class="jarvis-orb" id="jarvis-orb"><div class="orb-reactor"><div class="orb-ring"></div><div class="orb-ring"></div><div class="orb-ring"></div><div class="orb-core"></div></div></div>
    <div class="orb-label" id="orb-label"></div>
  </div>

  <audio id="tts-player" playsinline webkit-playsinline preload="auto"></audio>

  <div class="jarvis-toast" id="jarvis-toast">
    <div class="toast-user" id="toast-user"></div>
    <div class="toast-header">
      <div class="toast-label">JARVIS</div>
      <button class="toast-speak-btn" id="toast-speak-btn">&#128264;</button>
    </div>
    <div class="toast-text" id="toast-text"></div>
  </div>

  <script src="/novnc.js?v=6"></script>
  <script>
    var RFB = null;
    if (typeof noVNC !== 'undefined') {
      RFB = noVNC.default || noVNC;
    }
    if (typeof RFB !== 'function') {
      document.getElementById('error-title').textContent = 'LOAD FAILED';
      document.getElementById('error-text').textContent = 'VNC library failed to load. Clear cache and reload.';
      document.getElementById('error-overlay').classList.remove('hidden');
      document.getElementById('connect-overlay').classList.add('hidden');
    }

    // Auth handled by session cookie — no token needed

    var rfb = null;
    var viewOnly = localStorage.getItem('jarvis_vnc_control') !== 'true';

    var connectOverlay = document.getElementById('connect-overlay');
    var errorOverlay = document.getElementById('error-overlay');
    var statusBadge = document.getElementById('status');
    var usernameInput = document.getElementById('vnc-username');
    var passwordInput = document.getElementById('vnc-password');
    var connectBtn = document.getElementById('connect-btn');
    var reconnectBtn = document.getElementById('reconnect-btn');
    var keyboardBtn = document.getElementById('keyboard-btn');
    var viewonlyBtn = document.getElementById('viewonly-btn');
    var disconnectBtn = document.getElementById('disconnect-btn');

    var savedUser = sessionStorage.getItem('jarvis_vnc_user') || '';
    var savedPassword = sessionStorage.getItem('jarvis_vnc_pw') || '';
    if (savedUser) usernameInput.value = savedUser;
    if (savedPassword) passwordInput.value = savedPassword;

    function setStatus(text, cls) {
      statusBadge.textContent = text;
      statusBadge.className = 'status-badge' + (cls ? ' ' + cls : '');
    }

    function clearContainer(el) {
      while (el.firstChild) {
        el.removeChild(el.firstChild);
      }
    }

    function doConnect() {
      var user = usernameInput.value;
      var pw = passwordInput.value;
      if (!user) {
        usernameInput.focus();
        return;
      }
      if (!pw) {
        passwordInput.focus();
        return;
      }
      sessionStorage.setItem('jarvis_vnc_user', user);
      sessionStorage.setItem('jarvis_vnc_pw', pw);

      if (!RFB) {
        showError('VNC library not loaded', 'Refresh the page and try again.');
        return;
      }

      connectOverlay.classList.add('hidden');
      errorOverlay.classList.add('hidden');
      setStatus('CONNECTING', 'connecting');
      document.getElementById('app').classList.add('connecting');

      var proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
      var url = proto + '//' + location.host + '/ws/vnc';

      var container = document.getElementById('vnc-container');
      clearContainer(container);

      try {
        rfb = new RFB(container, url, {
          credentials: { username: user, password: pw },
        });
      } catch (e) {
        document.getElementById('app').classList.remove('connecting');
        setStatus('ERROR', 'error');
        showError('Failed to initialize VNC', String(e));
        return;
      }

      rfb.viewOnly = viewOnly;
      rfb.scaleViewport = true;
      rfb.resizeSession = false;
      rfb.clipViewport = true;
      rfb.background = '#000000';

      rfb.addEventListener('connect', function() {
        document.getElementById('app').classList.remove('connecting');
        setStatus('LIVE', 'live');
        keyboardBtn.disabled = false;
        disconnectBtn.disabled = false;
      });

      rfb.addEventListener('disconnect', function(ev) {
        document.getElementById('app').classList.remove('connecting');
        keyboardBtn.disabled = true;
        disconnectBtn.disabled = true;
        rfb = null;
        if (ev.detail.clean) {
          setStatus('DISCONNECTED', '');
          connectOverlay.classList.remove('hidden');
        } else {
          setStatus('LOST', 'error');
          showError('Connection lost', 'The VNC tunnel was closed unexpectedly.');
        }
      });

      rfb.addEventListener('securityfailure', function(ev) {
        document.getElementById('app').classList.remove('connecting');
        setStatus('AUTH FAIL', 'error');
        showError('Authentication failed', (ev.detail && ev.detail.reason) || 'Wrong password or unsupported security type.');
      });

      rfb.addEventListener('credentialsrequired', function() {
        setStatus('AUTHENTICATING', 'connecting');
        rfb.sendCredentials({ username: user, password: pw });
      });

      rfb.addEventListener('desktopname', function(ev) {
        document.title = 'JARVIS — ' + ev.detail.name;
      });

    }

    function showError(title, text) {
      document.getElementById('error-title').textContent = title;
      document.getElementById('error-text').textContent = text;
      errorOverlay.classList.remove('hidden');
    }

    connectBtn.addEventListener('click', doConnect);
    passwordInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') doConnect();
    });
    reconnectBtn.addEventListener('click', doConnect);

    disconnectBtn.addEventListener('click', function() {
      if (rfb) {
        rfb.disconnect();
        rfb = null;
      }
      setStatus('DISCONNECTED', '');
      connectOverlay.classList.remove('hidden');
      keyboardBtn.disabled = true;
      disconnectBtn.disabled = true;
    });

    if (viewOnly) viewonlyBtn.classList.add('active');
    viewonlyBtn.addEventListener('click', function() {
      viewOnly = !viewOnly;
      localStorage.setItem('jarvis_vnc_control', viewOnly ? 'false' : 'true');
      viewonlyBtn.classList.toggle('active', viewOnly);
      if (rfb) rfb.viewOnly = viewOnly;
    });

    var kbInput = document.getElementById('kb-input');
    var kbActive = false;

    keyboardBtn.addEventListener('click', function() {
      if (!rfb) return;
      if (viewOnly) {
        viewOnly = false;
        rfb.viewOnly = false;
        viewonlyBtn.classList.remove('active');
      }
      if (kbActive) {
        kbInput.blur();
        kbInput.style.pointerEvents = 'none';
        kbActive = false;
        keyboardBtn.classList.remove('active');
      } else {
        kbInput.style.pointerEvents = 'auto';
        kbInput.focus();
        kbActive = true;
        keyboardBtn.classList.add('active');
      }
    });

    kbInput.addEventListener('blur', function() {
      kbActive = false;
      kbInput.style.pointerEvents = 'none';
      keyboardBtn.classList.remove('active');
    });

    var KEY_MAP = {
      'Enter': 0xFF0D, 'Backspace': 0xFF08, 'Tab': 0xFF09, 'Escape': 0xFF1B,
      'ArrowLeft': 0xFF51, 'ArrowUp': 0xFF52, 'ArrowRight': 0xFF53, 'ArrowDown': 0xFF54,
      'Delete': 0xFFFF, 'Home': 0xFF50, 'End': 0xFF57,
      'Shift': 0xFFE1, 'Control': 0xFFE3, 'Alt': 0xFFE9, 'Meta': 0xFFEB,
    };

    kbInput.addEventListener('keydown', function(e) {
      if (!rfb) return;
      e.preventDefault();
      var keysym = KEY_MAP[e.key];
      if (keysym) {
        rfb.sendKey(keysym, null, true);
      } else if (e.key.length === 1) {
        rfb.sendKey(e.key.charCodeAt(0), null, true);
      }
    });

    kbInput.addEventListener('keyup', function(e) {
      if (!rfb) return;
      e.preventDefault();
      var keysym = KEY_MAP[e.key];
      if (keysym) {
        rfb.sendKey(keysym, null, false);
      } else if (e.key.length === 1) {
        rfb.sendKey(e.key.charCodeAt(0), null, false);
      }
    });

    kbInput.addEventListener('input', function() {
      if (!rfb) return;
      var val = kbInput.value;
      if (val.length > 0) {
        var ch = val.charCodeAt(val.length - 1);
        rfb.sendKey(ch, null, true);
        rfb.sendKey(ch, null, false);
      }
      kbInput.value = '';
    });

    // --- Chat Persistence ---
    var CHAT_STORE_KEY = 'jarvis_chat_history';
    function saveChatMsg(role, text) {
      try {
        var history = JSON.parse(localStorage.getItem(CHAT_STORE_KEY) || '[]');
        history.push({ role: role, text: text, ts: Date.now() });
        if (history.length > 200) history = history.slice(-200);
        localStorage.setItem(CHAT_STORE_KEY, JSON.stringify(history));
      } catch(e) {}
    }

    // --- JARVIS Voice Orb ---
    var orb = document.getElementById('jarvis-orb');
    var toast = document.getElementById('jarvis-toast');
    var toastText = document.getElementById('toast-text');
    var toastUser = document.getElementById('toast-user');
    var jarvisWs = null;
    var jarvisStreamBuf = {};
    var jarvisState = 'idle';
    var recognition = null;
    var toastTimer = null;
    var currentMsgId = null;

    setTimeout(function() {
      orb.classList.add('boot-anim');
      orb.classList.add('booted');
    }, 500);

    function jarvisConnect() {
      if (jarvisWs) { try { jarvisWs.close(); } catch(e) {} }
      var proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
      var wsUrl = proto + '//' + location.host + '/ws/chat';
      try {
        jarvisWs = new WebSocket(wsUrl);
      } catch(e) { return; }
      jarvisWs.onopen = function() {};
      jarvisWs.onmessage = function(evt) {
        try { jarvisHandleMsg(JSON.parse(evt.data)); } catch(e) {}
      };
      jarvisWs.onclose = function() {
        jarvisWs = null;
        setTimeout(jarvisConnect, 3000);
      };
      jarvisWs.onerror = function() {};
    }
    jarvisConnect();

    function jarvisHandleMsg(msg) {
      switch (msg.type) {
        case 'welcome': break;
        case 'chat_response':
          setOrbState('speaking');
          showToast(msg.message);
          saveChatMsg('jarvis', msg.message);
          jarvisSpeak(msg.message);
          break;
        case 'chat_stream':
          setOrbState('speaking');
          jarvisStreamBuf[msg.id] = (jarvisStreamBuf[msg.id] || '') + msg.delta;
          showToast(jarvisStreamBuf[msg.id]);
          break;
        case 'chat_done':
          var finalText = jarvisStreamBuf[msg.id] || '';
          delete jarvisStreamBuf[msg.id];
          if (finalText) {
            saveChatMsg('jarvis', finalText);
            jarvisSpeak(finalText);
          }
          break;
        case 'error':
          setOrbState('idle');
          showToast(msg.message || 'Something went wrong.');
          break;
      }
    }

    var orbLabel = document.getElementById('orb-label');
    function setOrbState(state) {
      jarvisState = state;
      orb.classList.remove('listening', 'thinking', 'speaking');
      orbLabel.classList.remove('show', 'listening', 'thinking', 'speaking');
      if (state !== 'idle') {
        orb.classList.add(state);
        orbLabel.classList.add('show', state);
        orbLabel.textContent = state.toUpperCase();
      } else {
        orbLabel.textContent = '';
      }
    }

    function showToast(text) {
      toastText.textContent = text;
      lastResponseText = text;
      toast.classList.add('show');
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(function() {
        toast.classList.remove('show');
        setOrbState('idle');
      }, 8000);
    }

    function hideToast() {
      toast.classList.remove('show');
      if (toastTimer) { clearTimeout(toastTimer); toastTimer = null; }
    }

    var ttsPlayer = document.getElementById('tts-player');
    function getVoice() { return localStorage.getItem('jarvis_tts_voice') || 'draco'; }
    var ttsObjUrl = null;
    var lastResponseText = '';

    document.getElementById('toast-speak-btn').addEventListener('click', function(e) {
      e.stopPropagation();
      if (!lastResponseText) return;
      var clean = lastResponseText.replace(/\x60\x60\x60[\\s\\S]*?\x60\x60\x60/g, '').replace(/[#*_~\x60>]/g, '').trim();
      if (!clean) return;
      if (clean.length > 500) clean = clean.substring(0, 500) + '...';
      setOrbState('speaking');
      fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ text: clean, voice: getVoice() }),
      }).then(function(r) { return r.blob(); })
      .then(function(blob) {
        if (ttsObjUrl) URL.revokeObjectURL(ttsObjUrl);
        ttsObjUrl = URL.createObjectURL(blob);
        ttsPlayer.src = ttsObjUrl;
        ttsPlayer.onended = function() { setOrbState('idle'); };
        ttsPlayer.play().catch(function() { setOrbState('idle'); });
      }).catch(function() { setOrbState('idle'); });
    });

    function jarvisSpeak(text) {
      var clean = text.replace(/\x60\x60\x60[\\s\\S]*?\x60\x60\x60/g, '').replace(/[#*_~\x60>]/g, '').trim();
      if (!clean) { setOrbState('idle'); return; }
      if (clean.length > 500) clean = clean.substring(0, 500) + '...';
      setOrbState('speaking');
      fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ text: clean, voice: getVoice() }),
      }).then(function(r) {
        if (!r.ok) throw new Error('TTS failed');
        return r.blob();
      }).then(function(blob) {
        if (ttsObjUrl) URL.revokeObjectURL(ttsObjUrl);
        ttsObjUrl = URL.createObjectURL(blob);
        ttsPlayer.onended = function() { setOrbState('idle'); };
        ttsPlayer.onerror = function() { setOrbState('idle'); };
        ttsPlayer.src = ttsObjUrl;
        ttsPlayer.play().catch(function() { setOrbState('idle'); });
      }).catch(function() { setOrbState('idle'); });
    }
    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    var SILENT_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

    orb.addEventListener('click', function() {
      if (jarvisState === 'listening') {
        if (recognition) recognition.stop();
        return;
      }
      if (jarvisState === 'speaking') {
        ttsPlayer.pause();
        setOrbState('idle');
        hideToast();
        return;
      }

      if (!SpeechRecognition) {
        showToast('Speech recognition not supported in this browser.');
        return;
      }

      hideToast();
      setOrbState('listening');

      recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;
      var gotResult = false;
      var silenceTimer = null;

      recognition.onresult = function(event) {
        var result = event.results[event.results.length - 1];
        if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer = null; }
        if (!result.isFinal) {
          toastUser.textContent = '"' + result[0].transcript + '..."';
          silenceTimer = setTimeout(function() {
            if (recognition) { try { recognition.stop(); } catch(e){} }
          }, 3000);
          return;
        }
        gotResult = true;
        if (recTimeout) { clearTimeout(recTimeout); recTimeout = null; }
        var transcript = result[0].transcript;
        ttsPlayer.src = SILENT_WAV;
        ttsPlayer.play().then(function() { ttsPlayer.pause(); }).catch(function(){});
        toastUser.textContent = '"' + transcript + '"';
        setOrbState('thinking');
        showToast('On it, sir.');
        saveChatMsg('user', transcript);
        if (!jarvisWs || jarvisWs.readyState !== WebSocket.OPEN) {
          showToast('Not connected to JARVIS.');
          setOrbState('idle');
          return;
        }
        currentMsgId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        jarvisWs.send(JSON.stringify({ type: 'chat', id: currentMsgId, message: transcript }));
      };

      recognition.onerror = function(event) {
        if (event.error === 'no-speech') {
          showToast('No speech detected. Tap to try again.');
        } else if (event.error === 'not-allowed') {
          showToast('Microphone access denied. Enable in Settings.');
        } else if (event.error === 'aborted') { /* ignore — we triggered this */ }
        else {
          showToast('Voice error: ' + event.error);
        }
        if (!gotResult) setOrbState('idle');
      };

      recognition.onend = function() {
        if (!gotResult && jarvisState === 'listening') setOrbState('idle');
        if (recTimeout) { clearTimeout(recTimeout); recTimeout = null; }
        if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer = null; }
      };

      recognition.start();
      var recTimeout = setTimeout(function() {
        if (recognition && !gotResult) { try { recognition.stop(); } catch(e){} }
      }, 30000);
    });

    toast.addEventListener('click', function() {
      hideToast();
      setOrbState('idle');
      ttsPlayer.pause();
    });
  </script>
</body>
</html>`;
}
