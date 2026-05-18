export function getAgentsPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#030712">
  <title>JARVIS — Agent OS</title>
  <style>
    :root {
      --bg: #030712;
      --surface: #0f172a;
      --surface-2: #1e293b;
      --surface-3: #334155;
      --border: rgba(56, 189, 248, 0.1);
      --border-bright: rgba(56, 189, 248, 0.25);
      --primary: #38bdf8;
      --primary-dim: #0c4a6e;
      --green: #34d399;
      --green-glow: rgba(52, 211, 153, 0.15);
      --amber: #f59e0b;
      --amber-dim: rgba(245, 158, 11, 0.15);
      --red: #f87171;
      --red-dim: rgba(248, 113, 113, 0.15);
      --purple: #a78bfa;
      --text: #f1f5f9;
      --text-dim: #cbd5e1;
      --muted: #64748b;
      --font: -apple-system, 'SF Pro Display', system-ui, sans-serif;
      --mono: 'SF Mono', ui-monospace, monospace;
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      height: 100%; font-family: var(--font); background: var(--bg); color: var(--text);
      -webkit-font-smoothing: antialiased; overflow: hidden;
    }
    body {
      background-image: radial-gradient(circle at 1px 1px, rgba(56, 189, 248, 0.025) 1px, transparent 0);
      background-size: 24px 24px;
    }
    .layout { display: flex; flex-direction: column; height: 100vh; }

    /* Header */
    .header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 16px; border-bottom: 1px solid var(--border);
      background: var(--surface); flex-shrink: 0;
    }
    .header-left { display: flex; align-items: center; gap: 10px; }
    .header-title { font-size: 13px; font-weight: 700; letter-spacing: 3px; color: var(--primary); }
    .header-sub { font-size: 10px; color: var(--muted); letter-spacing: 1px; }
    .status-dot {
      width: 8px; height: 8px; border-radius: 50%; background: var(--muted);
      box-shadow: 0 0 6px var(--muted); transition: all 0.3s;
    }
    .status-dot.online { background: var(--green); box-shadow: 0 0 8px var(--green); }
    .header-stats { display: flex; gap: 16px; }
    .stat { text-align: center; }
    .stat-value { font-size: 16px; font-weight: 700; font-family: var(--mono); color: var(--primary); }
    .stat-label { font-size: 8px; color: var(--muted); letter-spacing: 1px; text-transform: uppercase; }
    .header-actions { display: flex; align-items: center; gap: 8px; }
    .nav-link, .icon-btn {
      font-size: 11px; color: var(--muted); text-decoration: none;
      padding: 4px 10px; border: 1px solid var(--border); border-radius: 4px;
      transition: all 0.2s; background: none; cursor: pointer;
    }
    .nav-link:hover, .icon-btn:hover { color: var(--primary); border-color: var(--border-bright); }
    .icon-btn.muted { color: var(--red); border-color: rgba(248,113,113,0.3); }

    /* Main layout */
    .main { display: flex; flex: 1; overflow: hidden; }

    /* Agents panel */
    .agents-panel { flex: 1; padding: 12px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; }
    .agents-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 10px;
    }

    /* Agent card */
    .agent-card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 10px; padding: 12px; position: relative;
      transition: all 0.3s ease; animation: cardIn 0.4s ease; cursor: pointer;
    }
    .agent-card:hover { border-color: var(--border-bright); }
    .agent-card.subagent { border-left: 3px solid var(--amber); }
    .agent-card.completed { opacity: 0.35; cursor: default; }
    .agent-card.completed .pulse-dot { background: var(--muted) !important; animation: none !important; box-shadow: none !important; }
    @keyframes cardIn {
      from { opacity: 0; transform: translateY(10px) scale(0.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .card-color-bar { position: absolute; top: 0; left: 0; right: 0; height: 2px; border-radius: 10px 10px 0 0; }

    .card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; }
    .card-title-area { flex: 1; min-width: 0; }
    .card-title-row { display: flex; align-items: center; gap: 6px; }
    .pulse-dot {
      width: 7px; height: 7px; border-radius: 50%; background: var(--green);
      animation: pulse 2s infinite; flex-shrink: 0;
    }
    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 4px var(--green); }
      50% { box-shadow: 0 0 10px var(--green), 0 0 20px var(--green-glow); }
    }
    .card-label { font-size: 11px; font-weight: 700; letter-spacing: 1px; }
    .card-pid { font-family: var(--mono); font-size: 10px; color: var(--muted); }
    .card-desc {
      font-size: 10px; color: var(--text-dim); overflow: hidden;
      text-overflow: ellipsis; white-space: nowrap; padding-left: 13px; margin-top: 1px;
    }
    .parent-link {
      font-size: 9px; color: var(--amber); font-family: var(--mono);
      padding: 1px 0 2px 13px;
    }
    .card-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
    .card-model {
      font-size: 8px; background: var(--primary-dim); color: var(--primary);
      padding: 2px 6px; border-radius: 3px; font-family: var(--mono);
    }
    .kill-btn {
      width: 22px; height: 22px; border-radius: 4px; border: 1px solid var(--border);
      background: transparent; color: var(--muted); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; transition: all 0.2s;
    }
    .kill-btn:hover { background: var(--red-dim); color: var(--red); border-color: var(--red); }

    /* Current action */
    .card-action {
      font-size: 10px; font-family: var(--mono); color: var(--amber);
      padding: 4px 8px; margin-bottom: 6px; background: var(--amber-dim);
      border-radius: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      display: none;
    }
    .card-action.visible { display: block; }

    /* Stats row */
    .card-stats { display: flex; gap: 4px; margin-bottom: 6px; }
    .card-stat {
      flex: 1; background: var(--surface-2); border-radius: 4px; padding: 4px 2px; text-align: center;
    }
    .card-stat-val { font-size: 11px; font-weight: 700; font-family: var(--mono); color: var(--text); }
    .card-stat-lbl { font-size: 7px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; }

    /* Activity log */
    .card-activity {
      font-size: 9px; color: var(--text-dim); font-family: var(--mono);
      background: var(--surface-2); border-radius: 4px; padding: 4px 6px;
      max-height: 72px; overflow-y: auto;
    }
    .card-activity div { padding: 1px 0; border-bottom: 1px solid rgba(255,255,255,0.02); display: flex; align-items: center; gap: 3px; }
    .card-activity .t-icon { flex-shrink: 0; font-size: 10px; }
    .card-activity .tool { color: var(--amber); }
    .card-activity .agent-spawn { color: var(--green); }
    .card-activity .text-ev { color: var(--text-dim); }
    .card-activity .complete-ev { color: var(--primary); }

    /* Completed section */
    .completed-section { margin-top: 4px; }
    .completed-toggle {
      background: none; border: 1px solid var(--border); color: var(--muted);
      font-size: 10px; font-family: var(--mono); padding: 3px 10px;
      border-radius: 4px; cursor: pointer; transition: all 0.2s;
    }
    .completed-toggle:hover { color: var(--primary); border-color: var(--border-bright); }
    .completed-grid { display: none; margin-top: 8px; }
    .completed-grid.open { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 10px; }
    .section-label { display: flex; align-items: center; gap: 8px; }
    .section-label::after { content: ''; flex: 1; height: 1px; background: var(--border); }

    /* Spawn response */
    .spawn-response {
      display: none; padding: 8px 16px; border-top: 1px solid var(--border);
      background: var(--surface-2); flex-shrink: 0; max-height: 120px; overflow-y: auto;
    }
    .spawn-response.visible { display: block; }
    .spawn-response-text {
      font-size: 12px; color: var(--text-dim); font-family: var(--font);
      line-height: 1.5; white-space: pre-wrap; word-break: break-word;
    }
    .spawn-response-close {
      float: right; background: none; border: none; color: var(--muted);
      cursor: pointer; font-size: 14px; padding: 0 4px;
    }
    .spawn-response-close:hover { color: var(--text); }

    /* Spawn bar */
    .spawn-bar {
      display: flex; gap: 8px; padding: 10px 16px; border-top: 1px solid var(--border);
      background: var(--surface); flex-shrink: 0;
    }
    .spawn-input {
      flex: 1; background: var(--surface-2); border: 1px solid var(--border);
      border-radius: 8px; padding: 8px 12px; color: var(--text);
      font-size: 13px; font-family: var(--font); outline: none;
    }
    .spawn-input:focus { border-color: var(--primary); }
    .spawn-input::placeholder { color: var(--muted); }
    .spawn-btn {
      background: var(--primary-dim); border: 1px solid var(--primary);
      color: var(--primary); padding: 8px 16px; border-radius: 8px;
      font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;
      white-space: nowrap;
    }
    .spawn-btn:hover { background: var(--primary); color: var(--bg); }
    .spawn-btn:disabled { opacity: 0.4; cursor: default; }

    /* Feed panel */
    .feed-panel {
      width: 340px; border-left: 1px solid var(--border);
      background: var(--surface); display: flex; flex-direction: column;
    }
    .feed-header {
      padding: 10px 14px; font-size: 10px; font-weight: 600; letter-spacing: 1px;
      color: var(--primary); border-bottom: 1px solid var(--border);
      text-transform: uppercase;
    }
    .feed-list { flex: 1; overflow-y: auto; padding: 6px; }
    .feed-item {
      padding: 5px 8px; border-radius: 5px; margin-bottom: 2px;
      font-size: 10px; animation: feedIn 0.3s ease;
      border-left: 3px solid transparent;
    }
    .feed-item:hover { background: var(--surface-2); }
    @keyframes feedIn {
      from { opacity: 0; transform: translateX(16px); }
      to { opacity: 1; transform: translateX(0); }
    }
    .feed-item.tool_use { border-left-color: var(--amber); }
    .feed-item.agent_spawn { border-left-color: var(--green); }
    .feed-item.agent_complete { border-left-color: var(--primary); }
    .feed-item.text { border-left-color: var(--muted); }
    .feed-item.error { border-left-color: var(--red); }
    .feed-time { font-family: var(--mono); color: var(--muted); font-size: 9px; }
    .feed-session { font-family: var(--mono); color: var(--primary); font-size: 9px; }
    .feed-body { color: var(--text-dim); margin-top: 1px; word-break: break-word; display: flex; align-items: baseline; gap: 3px; }

    /* Detail modal */
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 100;
      display: none; align-items: center; justify-content: center; padding: 20px;
      backdrop-filter: blur(4px);
    }
    .modal-overlay.open { display: flex; }
    .modal {
      background: var(--surface); border: 1px solid var(--border-bright);
      border-radius: 12px; width: 100%; max-width: 600px; max-height: 80vh;
      display: flex; flex-direction: column; overflow: hidden;
    }
    .modal-header {
      padding: 14px 16px; border-bottom: 1px solid var(--border);
      display: flex; justify-content: space-between; align-items: center;
    }
    .modal-title { font-size: 13px; font-weight: 700; }
    .modal-close {
      background: none; border: none; color: var(--muted); cursor: pointer;
      font-size: 18px; padding: 0 4px;
    }
    .modal-close:hover { color: var(--text); }
    .modal-body {
      flex: 1; overflow-y: auto; padding: 12px 16px;
      font-size: 11px; font-family: var(--mono); color: var(--text-dim);
    }
    .modal-body .m-event { padding: 6px 0; border-bottom: 1px solid var(--border); }
    .modal-body .m-tool { color: var(--amber); font-weight: 600; }
    .modal-body .m-text { color: var(--text-dim); }
    .modal-body .m-spawn { color: var(--green); font-weight: 600; }
    .modal-body .m-complete { color: var(--primary); }
    .modal-body .m-time { color: var(--muted); font-size: 9px; }

    /* Empty state */
    .empty-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      height: 50vh; color: var(--muted); gap: 10px;
    }
    .empty-icon { font-size: 40px; opacity: 0.3; }
    .empty-text { font-size: 13px; }
    .empty-sub { font-size: 11px; color: var(--surface-3); }

    ::-webkit-scrollbar { width: 3px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--surface-3); border-radius: 2px; }

    @media (max-width: 900px) {
      .main { flex-direction: column; }
      .feed-panel { width: 100%; height: 35vh; border-left: none; border-top: 1px solid var(--border); }
      .agents-grid, .completed-grid.open { grid-template-columns: 1fr; }
      .header-stats { gap: 10px; }
      .stat-value { font-size: 13px; }
    }
  </style>
</head>
<body>
  <div class="layout">
    <div class="header">
      <div class="header-left">
        <div>
          <div class="header-title">AGENT OS</div>
          <div class="header-sub">MISSION CONTROL</div>
        </div>
        <div class="status-dot" id="status-dot"></div>
      </div>
      <div class="header-stats" id="header-stats">
        <div class="stat"><div class="stat-value" id="stat-agents">0</div><div class="stat-label">Active</div></div>
        <div class="stat"><div class="stat-value" id="stat-cost">$0.00</div><div class="stat-label">Cost</div></div>
        <div class="stat"><div class="stat-value" id="stat-tokens">0</div><div class="stat-label">Tokens</div></div>
        <div class="stat"><div class="stat-value" id="stat-events">0</div><div class="stat-label">Events</div></div>
      </div>
      <div class="header-actions">
        <button class="icon-btn" id="sound-toggle" title="Toggle sounds">&#x1f50a;</button>
        <a href="/" class="nav-link">CHAT</a>
        <a href="/live" class="nav-link">LIVE</a>
      </div>
    </div>
    <div class="main">
      <div class="agents-panel" id="agents-panel">
        <div id="active-section">
          <div class="agents-grid" id="agents-grid">
            <div class="empty-state" id="empty-state">
              <div class="empty-icon">&#9671;</div>
              <div class="empty-text">No agents detected</div>
              <div class="empty-sub">Waiting for daemon connection...</div>
            </div>
          </div>
        </div>
        <div class="completed-section" id="completed-section" style="display:none;">
          <div class="section-label">
            <button class="completed-toggle" id="completed-toggle">&#9654; Completed <span id="completed-count">0</span></button>
          </div>
          <div class="completed-grid" id="completed-grid"></div>
        </div>
      </div>
      <div class="feed-panel">
        <div class="feed-header">Live Activity Feed</div>
        <div class="feed-list" id="feed-list"></div>
      </div>
    </div>
    <div class="spawn-response" id="spawn-response">
      <button class="spawn-response-close" id="spawn-response-close">&#x2715;</button>
      <div class="spawn-response-text" id="spawn-response-text"></div>
    </div>
    <div class="spawn-bar">
      <input type="text" class="spawn-input" id="spawn-input" placeholder="Ask JARVIS or describe a task to spawn..." />
      <button class="spawn-btn" id="spawn-btn">SEND</button>
    </div>
  </div>

  <div class="modal-overlay" id="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title" id="modal-title">Agent Details</div>
        <button class="modal-close" id="modal-close">&#x2715;</button>
      </div>
      <div class="modal-body" id="modal-body"></div>
    </div>
  </div>

  <script>
    (function() {
      var $ = function(id) { return document.getElementById(id); };
      var agentsGrid = $('agents-grid');
      var feedList = $('feed-list');
      var emptyState = $('empty-state');
      var statusDot = $('status-dot');
      var statAgents = $('stat-agents');
      var statCost = $('stat-cost');
      var statTokens = $('stat-tokens');
      var statEvents = $('stat-events');
      var completedSection = $('completed-section');
      var completedGrid = $('completed-grid');
      var completedToggle = $('completed-toggle');
      var completedCountEl = $('completed-count');
      var spawnInput = $('spawn-input');
      var spawnBtn = $('spawn-btn');
      var spawnResponse = $('spawn-response');
      var spawnResponseText = $('spawn-response-text');
      var spawnResponseClose = $('spawn-response-close');
      var soundToggle = $('sound-toggle');
      var modalOverlay = $('modal-overlay');
      var modalTitle = $('modal-title');
      var modalBody = $('modal-body');
      var modalClose = $('modal-close');

      var agents = {};
      var completedAgents = [];
      var agentDescs = {};
      var agentCosts = {};
      var agentToks = {};
      var agentEvents = {};
      var agentActions = {};
      var totalCost = 0;
      var totalTokens = 0;
      var eventCount = 0;
      var ws = null;
      var audioCtx = null;
      var soundOn = true;
      var completedOpen = false;
      var durationTimer = null;

      var AGENT_COLORS = ['#38bdf8','#34d399','#f59e0b','#a78bfa','#f87171','#fb923c','#2dd4bf','#e879f9','#facc15','#67e8f9'];

      var TOOL_ICONS = {
        Read:'\\ud83d\\udcc4',Edit:'\\u270f\\ufe0f',Write:'\\ud83d\\udcdd',Bash:'\\u26a1',
        Grep:'\\ud83d\\udd0d',Glob:'\\ud83d\\udcc2',Agent:'\\ud83e\\udd16',WebFetch:'\\ud83c\\udf10',
        WebSearch:'\\ud83c\\udf10',TodoWrite:'\\u2611\\ufe0f',NotebookEdit:'\\ud83d\\udcd3',
        Skill:'\\ud83c\\udfaf',ToolSearch:'\\ud83d\\udd27'
      };
      function tIcon(n) { return TOOL_ICONS[n] || '\\u25b8'; }
      function agentColor(pid) { return AGENT_COLORS[pid % AGENT_COLORS.length]; }

      function cleanText(s) {
        return (s||'').replace(/<[^>]+>/g,'').replace(/\\\`\\\`\\\`[\\s\\S]*?\\\`\\\`\\\`/g,'').replace(/\\\`\\\`\\\`\\w*/g,'').replace(/\\\`\\\`\\\`/g,'').trim();
      }

      function playSound(type) {
        if (!soundOn) return;
        try {
          if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          var osc = audioCtx.createOscillator();
          var g = audioCtx.createGain();
          osc.connect(g); g.connect(audioCtx.destination); g.gain.value = 0.06;
          var t = audioCtx.currentTime;
          if (type === 'spawn') {
            osc.frequency.setValueAtTime(600,t); osc.frequency.linearRampToValueAtTime(900,t+0.12);
            g.gain.linearRampToValueAtTime(0,t+0.18); osc.start(); osc.stop(t+0.18);
          } else if (type === 'complete') {
            osc.frequency.setValueAtTime(800,t); osc.frequency.linearRampToValueAtTime(1200,t+0.08);
            g.gain.linearRampToValueAtTime(0,t+0.25); osc.start(); osc.stop(t+0.25);
          } else if (type === 'error') {
            osc.frequency.setValueAtTime(300,t); osc.frequency.linearRampToValueAtTime(150,t+0.15);
            g.gain.linearRampToValueAtTime(0,t+0.2); osc.start(); osc.stop(t+0.2);
          }
        } catch(e){}
      }

      soundToggle.onclick = function() {
        soundOn = !soundOn;
        soundToggle.textContent = soundOn ? '\\ud83d\\udd0a' : '\\ud83d\\udd07';
        soundToggle.classList.toggle('muted', !soundOn);
      };

      completedToggle.onclick = function() {
        completedOpen = !completedOpen;
        completedGrid.classList.toggle('open', completedOpen);
        completedToggle.innerHTML = (completedOpen ? '&#9660;' : '&#9654;') + ' Completed <span id="completed-count">' + completedAgents.length + '</span>';
        completedCountEl = $('completed-count');
      };

      modalClose.onclick = function() { modalOverlay.classList.remove('open'); };
      modalOverlay.onclick = function(e) { if (e.target === modalOverlay) modalOverlay.classList.remove('open'); };

      function openModal(pid) {
        var a = agents[pid];
        var sid = a ? a.sessionId : null;
        modalTitle.textContent = (a ? (a.isSubagent ? 'SUBAGENT' : 'AGENT') : 'AGENT') + ' PID ' + pid;
        modalBody.innerHTML = '';
        var evts = sid ? (agentEvents[sid] || []) : [];
        if (evts.length === 0) {
          modalBody.textContent = 'No events recorded for this session.';
          modalOverlay.classList.add('open');
          return;
        }
        for (var i = 0; i < evts.length; i++) {
          var ev = evts[i];
          var div = document.createElement('div');
          div.className = 'm-event';
          var time = document.createElement('span');
          time.className = 'm-time';
          time.textContent = new Date(ev.timestamp).toLocaleTimeString() + ' ';
          div.appendChild(time);
          if (ev.type === 'tool_use') {
            var ts = document.createElement('span');
            ts.className = 'm-tool';
            ts.textContent = tIcon(ev.tool) + ' ' + ev.tool;
            div.appendChild(ts);
            var detail = '';
            if (ev.toolInput) {
              if (ev.toolInput.command) detail = ' $ ' + String(ev.toolInput.command).substring(0,200);
              else if (ev.toolInput.file_path) detail = ' ' + String(ev.toolInput.file_path);
              else if (ev.toolInput.pattern) detail = ' /' + String(ev.toolInput.pattern) + '/';
              else if (ev.toolInput.description) detail = ' ' + String(ev.toolInput.description);
            }
            if (detail) div.appendChild(document.createTextNode(detail));
          } else if (ev.type === 'agent_spawn') {
            var sp = document.createElement('span');
            sp.className = 'm-spawn';
            sp.textContent = '\\ud83e\\udd16 Spawned: ' + (ev.subagentDesc || 'subagent');
            div.appendChild(sp);
          } else if (ev.type === 'text') {
            var tx = document.createElement('span');
            tx.className = 'm-text';
            tx.textContent = cleanText(ev.text).substring(0, 300);
            div.appendChild(tx);
          } else if (ev.type === 'agent_complete') {
            var cp = document.createElement('span');
            cp.className = 'm-complete';
            cp.textContent = '\\u2713 Complete -- $' + (ev.costUsd||0).toFixed(4) + ' -- ' + formatNum(((ev.tokens||{}).input||0)+((ev.tokens||{}).output||0)) + ' tokens';
            div.appendChild(cp);
          }
          modalBody.appendChild(div);
        }
        modalBody.scrollTop = modalBody.scrollHeight;
        modalOverlay.classList.add('open');
      }

      spawnResponseClose.onclick = function() {
        spawnResponse.classList.remove('visible');
        spawnResponseText.textContent = '';
      };

      function handleChatStream(msg) {
        spawnResponse.classList.add('visible');
        spawnResponseText.textContent += msg.delta || '';
        spawnResponse.scrollTop = spawnResponse.scrollHeight;
      }

      function handleChatDone(msg) {
        if (msg.message) {
          spawnResponse.classList.add('visible');
          spawnResponseText.textContent += msg.message;
        }
        spawnBtn.disabled = false;
        spawnBtn.textContent = 'SEND';
      }

      spawnBtn.onclick = function() {
        var msg = spawnInput.value.trim();
        if (!msg) return;
        spawnBtn.disabled = true; spawnBtn.textContent = 'THINKING...';
        spawnResponseText.textContent = '';
        spawnResponse.classList.remove('visible');
        if (ws && ws.readyState === 1) {
          ws.send(JSON.stringify({ type: 'spawn_agent', instruction: msg }));
        }
        spawnInput.value = '';
      };
      spawnInput.onkeydown = function(e) { if (e.key === 'Enter') spawnBtn.onclick(); };

      function connect() {
        var proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
        ws = new WebSocket(proto + '//' + location.host + '/ws/agents');
        ws.onopen = function() {
          statusDot.classList.add('online');
          if (emptyState) { var sub = emptyState.querySelector('.empty-sub'); if (sub) sub.textContent = 'Waiting for agents...'; }
        };
        ws.onmessage = function(e) {
          try {
            var msg = JSON.parse(e.data);
            if (msg.type === 'agent_snapshot') handleSnapshot(msg.snapshot);
            else if (msg.type === 'agent_event') handleEvent(msg.event);
            else if (msg.type === 'chat_stream') handleChatStream(msg);
            else if (msg.type === 'chat_done' || msg.type === 'chat_response') handleChatDone(msg);
          } catch(err) {}
        };
        ws.onclose = function() { statusDot.classList.remove('online'); setTimeout(connect, 3000); };
        ws.onerror = function() { ws.close(); };
      }

      function handleSnapshot(snap) {
        var pids = {};
        for (var i = 0; i < snap.agents.length; i++) {
          var a = snap.agents[i];
          pids[a.pid] = true;
          if (!agents[a.pid]) { agents[a.pid] = a; addAgentCard(a); playSound('spawn'); }
          else { agents[a.pid] = a; updateAgentCard(a); }
        }
        for (var pid in agents) {
          if (!pids[pid]) { moveToCompleted(pid); delete agents[pid]; playSound('complete'); }
        }
        updateStats();
      }

      function handleEvent(ev) {
        eventCount++;
        var sid = ev.sessionId;
        if (!agentEvents[sid]) agentEvents[sid] = [];
        agentEvents[sid].push(ev);
        if (agentEvents[sid].length > 200) agentEvents[sid].shift();

        if (ev.type === 'agent_complete') {
          totalCost += ev.costUsd || 0;
          agentCosts[sid] = (agentCosts[sid]||0) + (ev.costUsd||0);
          if (ev.tokens) {
            var t = (ev.tokens.input||0) + (ev.tokens.output||0);
            totalTokens += t;
            agentToks[sid] = (agentToks[sid]||0) + t;
          }
        }
        if (ev.type === 'agent_spawn' && ev.subagentDesc) agentDescs[sid] = ev.subagentDesc;
        if (ev.type === 'text' && !agentDescs[sid]) {
          var c = cleanText(ev.text);
          if (c.length > 10) agentDescs[sid] = c.substring(0, 80);
        }
        if (ev.type === 'tool_use') {
          var actionText = tIcon(ev.tool) + ' ' + ev.tool;
          if (ev.toolInput) {
            if (ev.toolInput.command) actionText += ': ' + String(ev.toolInput.command).substring(0,60);
            else if (ev.toolInput.file_path) actionText += ': ' + String(ev.toolInput.file_path).split('/').pop();
            else if (ev.toolInput.pattern) actionText += ': /' + String(ev.toolInput.pattern).substring(0,40) + '/';
          }
          agentActions[sid] = actionText;
        }

        addFeedItem(ev);
        updateCardFromEvent(ev);
        updateStats();
      }

      function addAgentCard(a) {
        if (emptyState && emptyState.parentNode) { emptyState.parentNode.removeChild(emptyState); emptyState = null; }
        var card = document.createElement('div');
        card.className = 'agent-card' + (a.isSubagent ? ' subagent' : '');
        card.id = 'agent-' + a.pid;
        card.onclick = function(e) { if (!e.target.closest('.kill-btn')) openModal(a.pid); };

        var colorBar = document.createElement('div');
        colorBar.className = 'card-color-bar';
        colorBar.style.background = agentColor(a.pid);
        card.appendChild(colorBar);

        var top = document.createElement('div');
        top.className = 'card-top';
        var titleArea = document.createElement('div');
        titleArea.className = 'card-title-area';
        var titleRow = document.createElement('div');
        titleRow.className = 'card-title-row';
        var dot = document.createElement('div');
        dot.className = 'pulse-dot';
        titleRow.appendChild(dot);
        var lbl = document.createElement('span');
        lbl.className = 'card-label';
        lbl.textContent = a.isSubagent ? 'SUBAGENT' : 'AGENT';
        titleRow.appendChild(lbl);
        var pid = document.createElement('span');
        pid.className = 'card-pid';
        pid.textContent = 'PID ' + a.pid;
        titleRow.appendChild(pid);
        titleArea.appendChild(titleRow);
        var desc = document.createElement('div');
        desc.className = 'card-desc';
        desc.id = 'desc-' + a.pid;
        desc.textContent = agentDescs[a.sessionId] || (a.isSubagent ? 'Subagent' : 'Main session');
        titleArea.appendChild(desc);
        if (a.isSubagent && a.parentPid) {
          var pl = document.createElement('div');
          pl.className = 'parent-link';
          pl.textContent = '\\u2514 child of PID ' + a.parentPid;
          titleArea.appendChild(pl);
        }
        top.appendChild(titleArea);

        var right = document.createElement('div');
        right.className = 'card-right';
        var badge = document.createElement('div');
        badge.className = 'card-model';
        badge.textContent = a.model || 'default';
        right.appendChild(badge);
        var kill = document.createElement('button');
        kill.className = 'kill-btn';
        kill.title = 'Kill';
        kill.textContent = '\\u2715';
        kill.onclick = function(e) {
          e.stopPropagation();
          if (confirm('Kill PID ' + a.pid + '?')) {
            fetch('/api/chat', { method:'POST', headers:{'Content-Type':'application/json'},
              body: JSON.stringify({message:'kill -9 ' + a.pid}) });
            playSound('error');
          }
        };
        right.appendChild(kill);
        top.appendChild(right);
        card.appendChild(top);

        var action = document.createElement('div');
        action.className = 'card-action';
        action.id = 'action-' + a.pid;
        card.appendChild(action);

        var stats = document.createElement('div');
        stats.className = 'card-stats';
        stats.appendChild(mkStat(a.cpu.toFixed(1)+'%','CPU','cpu-'+a.pid));
        stats.appendChild(mkStat(a.mem.toFixed(1)+'%','MEM','mem-'+a.pid));
        stats.appendChild(mkStat(a.cpuTime,'TIME','time-'+a.pid));
        stats.appendChild(mkStat('0:00','ELAPSED','elapsed-'+a.pid));
        stats.appendChild(mkStat('$0.00','COST','cost-'+a.pid));
        stats.appendChild(mkStat('0','TOKENS','tok-'+a.pid));
        card.appendChild(stats);

        var act = document.createElement('div');
        act.className = 'card-activity';
        act.id = 'activity-' + a.pid;
        card.appendChild(act);

        agentsGrid.appendChild(card);
      }

      function mkStat(val, lbl, id) {
        var w = document.createElement('div');
        w.className = 'card-stat';
        var v = document.createElement('div');
        v.className = 'card-stat-val'; v.id = id; v.textContent = val;
        var l = document.createElement('div');
        l.className = 'card-stat-lbl'; l.textContent = lbl;
        w.appendChild(v); w.appendChild(l);
        return w;
      }

      function updateAgentCard(a) {
        var el;
        el = $('cpu-'+a.pid); if(el) el.textContent = a.cpu.toFixed(1)+'%';
        el = $('mem-'+a.pid); if(el) el.textContent = a.mem.toFixed(1)+'%';
        el = $('time-'+a.pid); if(el) el.textContent = a.cpuTime;
        el = $('desc-'+a.pid);
        if (el && a.sessionId && agentDescs[a.sessionId]) el.textContent = agentDescs[a.sessionId];
        if (a.sessionId) {
          el = $('cost-'+a.pid); if(el) el.textContent = '$'+(agentCosts[a.sessionId]||0).toFixed(2);
          el = $('tok-'+a.pid); if(el) el.textContent = formatNum(agentToks[a.sessionId]||0);
          var actEl = $('action-'+a.pid);
          if (actEl && agentActions[a.sessionId]) {
            actEl.textContent = agentActions[a.sessionId];
            actEl.classList.add('visible');
          }
        }
      }

      function updateCardFromEvent(ev) {
        for (var pid in agents) {
          var a = agents[pid];
          if (a.sessionId === ev.sessionId) {
            var actEl = $('activity-'+pid);
            if (!actEl) break;
            var div = document.createElement('div');
            var ic = document.createElement('span');
            ic.className = 't-icon';
            if (ev.type === 'tool_use') {
              div.className = 'tool';
              ic.textContent = tIcon(ev.tool);
              div.appendChild(ic);
              var d = '';
              if (ev.toolInput) {
                if (ev.toolInput.command) d = String(ev.toolInput.command).substring(0,50);
                else if (ev.toolInput.file_path) d = String(ev.toolInput.file_path).split('/').pop();
                else if (ev.toolInput.pattern) d = '/'+String(ev.toolInput.pattern).substring(0,30)+'/';
              }
              div.appendChild(document.createTextNode(' '+ev.tool+(d?' '+d:'')));
            } else if (ev.type === 'agent_spawn') {
              div.className = 'agent-spawn';
              ic.textContent = '\\ud83e\\udd16';
              div.appendChild(ic);
              div.appendChild(document.createTextNode(' '+(ev.subagentDesc||'subagent')));
            } else if (ev.type === 'text') {
              div.className = 'text-ev';
              var txt = cleanText(ev.text);
              div.textContent = txt.length > 60 ? txt.substring(0,60)+'...' : (txt||'...');
            } else if (ev.type === 'agent_complete') {
              div.className = 'complete-ev';
              ic.textContent = '\\u2713';
              div.appendChild(ic);
              div.appendChild(document.createTextNode(' $'+(ev.costUsd||0).toFixed(4)));
            }
            actEl.appendChild(div);
            actEl.scrollTop = actEl.scrollHeight;
            var actBar = $('action-'+pid);
            if (actBar && ev.type === 'tool_use') {
              actBar.textContent = agentActions[ev.sessionId] || '';
              actBar.classList.add('visible');
            }
            var costEl = $('cost-'+pid);
            if (costEl) costEl.textContent = '$'+(agentCosts[ev.sessionId]||0).toFixed(2);
            var tokEl = $('tok-'+pid);
            if (tokEl) tokEl.textContent = formatNum(agentToks[ev.sessionId]||0);
            break;
          }
        }
      }

      function moveToCompleted(pid) {
        var card = $('agent-'+pid);
        if (!card) return;
        card.classList.add('completed');
        card.onclick = null;
        var kb = card.querySelector('.kill-btn');
        if (kb) kb.style.display = 'none';
        var ab = $('action-'+pid);
        if (ab) { ab.textContent = 'Completed'; ab.classList.add('visible'); ab.style.background = 'var(--primary-dim)'; ab.style.color = 'var(--primary)'; }
        card.parentNode.removeChild(card);
        completedGrid.appendChild(card);
        completedAgents.push(pid);
        completedSection.style.display = 'block';
        completedCountEl.textContent = completedAgents.length;
        if (Object.keys(agents).length <= 1) showEmpty();
      }

      function showEmpty() {
        if (emptyState) return;
        emptyState = document.createElement('div');
        emptyState.className = 'empty-state'; emptyState.id = 'empty-state';
        emptyState.innerHTML = '<div class="empty-icon">&#9671;</div><div class="empty-text">No active agents</div><div class="empty-sub">Spawn one below or wait...</div>';
        agentsGrid.appendChild(emptyState);
      }

      function addFeedItem(ev) {
        var item = document.createElement('div');
        item.className = 'feed-item ' + ev.type;
        var meta = document.createElement('div');
        var ts = document.createElement('span');
        ts.className = 'feed-time';
        ts.textContent = new Date(ev.timestamp).toLocaleTimeString();
        var ss = document.createElement('span');
        ss.className = 'feed-session';
        ss.textContent = ' '+(ev.sessionId ? ev.sessionId.substring(0,8) : '--');
        meta.appendChild(ts); meta.appendChild(ss);
        item.appendChild(meta);
        var body = document.createElement('div');
        body.className = 'feed-body';
        if (ev.type === 'tool_use') {
          body.appendChild(document.createTextNode(tIcon(ev.tool)+' '));
          var tn = document.createElement('span');
          tn.style.color = 'var(--amber)'; tn.style.fontWeight = '600';
          tn.textContent = ev.tool;
          body.appendChild(tn);
          if (ev.toolInput) {
            var dt = '';
            if (ev.toolInput.command) dt = ' $ '+String(ev.toolInput.command).substring(0,80);
            else if (ev.toolInput.file_path) dt = ' '+String(ev.toolInput.file_path).split('/').pop();
            else if (ev.toolInput.pattern) dt = ' /'+String(ev.toolInput.pattern).substring(0,40)+'/';
            else if (ev.toolInput.description) dt = ' '+String(ev.toolInput.description).substring(0,50);
            if (dt) body.appendChild(document.createTextNode(dt));
          }
        } else if (ev.type === 'agent_spawn') {
          var sp = document.createElement('span');
          sp.style.color = 'var(--green)'; sp.style.fontWeight = '600';
          sp.textContent = '\\ud83e\\udd16 Spawned';
          body.appendChild(sp);
          body.appendChild(document.createTextNode(' '+(ev.subagentDesc||'')));
        } else if (ev.type === 'agent_complete') {
          var cp = document.createElement('span');
          cp.style.color = 'var(--primary)';
          cp.textContent = '\\u2713 Done';
          body.appendChild(cp);
          body.appendChild(document.createTextNode(' $'+(ev.costUsd||0).toFixed(4)+' '+formatNum(((ev.tokens||{}).input||0)+((ev.tokens||{}).output||0))+' tok'));
        } else if (ev.type === 'text') {
          var raw = cleanText(ev.text);
          body.textContent = raw.length > 100 ? raw.substring(0,100)+'...' : (raw||'...');
        } else if (ev.type === 'error') {
          var er = document.createElement('span');
          er.style.color = 'var(--red)'; er.textContent = 'Error ';
          body.appendChild(er);
          body.appendChild(document.createTextNode(ev.text||''));
          playSound('error');
        }
        item.appendChild(body);
        feedList.insertBefore(item, feedList.firstChild);
        while (feedList.children.length > 300) feedList.removeChild(feedList.lastChild);
      }

      function updateStats() {
        statAgents.textContent = Object.keys(agents).length;
        statCost.textContent = '$'+totalCost.toFixed(2);
        statTokens.textContent = formatNum(totalTokens);
        statEvents.textContent = formatNum(eventCount);
      }

      function formatNum(n) {
        if (n >= 1000000) return (n/1000000).toFixed(1)+'M';
        if (n >= 1000) return (n/1000).toFixed(1)+'K';
        return ''+n;
      }

      durationTimer = setInterval(function() {
        for (var pid in agents) {
          var el = $('elapsed-'+pid);
          if (!el) continue;
          var a = agents[pid];
          var started = a.startedAt;
          if (!started) continue;
          var now = new Date();
          var parts = started.split(':');
          var startDate = new Date();
          if (parts.length >= 2) {
            var h = parseInt(parts[0]); var m = parseInt(parts[1]);
            startDate.setHours(h, m, 0, 0);
            if (startDate > now) startDate.setDate(startDate.getDate() - 1);
            var diff = Math.floor((now - startDate) / 1000);
            if (diff < 0) diff = 0;
            var mins = Math.floor(diff / 60);
            var secs = diff % 60;
            if (mins >= 60) {
              var hrs = Math.floor(mins / 60);
              mins = mins % 60;
              el.textContent = hrs + ':' + (mins<10?'0':'') + mins + ':' + (secs<10?'0':'') + secs;
            } else {
              el.textContent = mins + ':' + (secs<10?'0':'') + secs;
            }
          }
        }
      }, 1000);

      connect();
    })();
  </script>
</body>
</html>`;
}
