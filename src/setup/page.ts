export function getSetupPage(daemonToken: string, userName: string, connected: boolean): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <meta name="theme-color" content="#030712">
  <link rel="apple-touch-icon" href="/icon-192.png">
  <title>JARVIS — Setup</title>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html,body{font-family:-apple-system,'SF Pro Display',system-ui,sans-serif;background:#030712;color:#e2e8f0;min-height:100dvh;-webkit-font-smoothing:antialiased}
    :root{--bg:#030712;--surface:#0f172a;--surface-2:#1e293b;--border:rgba(56,189,248,0.1);--border-b:rgba(56,189,248,0.25);--primary:#38bdf8;--primary-glow:rgba(56,189,248,0.15);--text:#f1f5f9;--dim:#94a3b8;--muted:#64748b;--danger:#f87171;--success:#34d399;--warn:#f59e0b;--mono:'SF Mono',ui-monospace,monospace}
    .page{max-width:600px;margin:0 auto;padding:40px 20px 80px}
    .back{display:inline-block;margin-bottom:24px;color:var(--muted);font-size:13px;text-decoration:none}
    .back:hover{color:var(--dim)}
    h1{font-size:28px;font-weight:700;margin-bottom:6px;background:linear-gradient(135deg,#38bdf8,#818cf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    .subtitle{color:var(--dim);font-size:14px;margin-bottom:32px;line-height:1.5}
    .status-card{border-radius:12px;padding:16px 20px;margin-bottom:24px;display:flex;align-items:center;gap:12px}
    .status-card.online{background:rgba(52,211,153,0.08);border:1px solid rgba(52,211,153,0.25)}
    .status-card.offline{background:rgba(248,113,113,0.06);border:1px solid rgba(248,113,113,0.2)}
    .status-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}
    .status-card.online .status-dot{background:var(--success);box-shadow:0 0 8px rgba(52,211,153,0.5)}
    .status-card.offline .status-dot{background:var(--danger)}
    .status-text{font-size:14px;color:var(--text)}
    .status-sub{font-size:12px;color:var(--muted);margin-top:2px}
    .step{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:16px}
    .step-num{font-family:var(--mono);font-size:11px;letter-spacing:0.1em;color:var(--primary);margin-bottom:8px}
    .step h3{font-size:15px;font-weight:600;color:var(--text);margin-bottom:8px}
    .step p{font-size:13px;color:var(--dim);line-height:1.6;margin-bottom:12px}
    .code-block{background:rgba(0,0,0,0.4);border:1px solid var(--border);border-radius:8px;padding:12px 14px;font-family:var(--mono);font-size:12px;color:var(--primary);line-height:1.6;overflow-x:auto;position:relative;word-break:break-all;white-space:pre-wrap}
    .copy-btn{position:absolute;top:8px;right:8px;font-family:var(--mono);font-size:10px;padding:3px 8px;border-radius:4px;border:1px solid var(--border);background:var(--surface);color:var(--muted);cursor:pointer}
    .copy-btn:hover{color:var(--text);border-color:var(--border-b)}
    .token-box{display:flex;align-items:center;gap:8px}
    .token-value{flex:1;background:rgba(0,0,0,0.4);border:1px solid var(--border);border-radius:8px;padding:10px 14px;font-family:var(--mono);font-size:13px;color:var(--warn);letter-spacing:0.02em;overflow:hidden;text-overflow:ellipsis}
    .token-value.masked{color:var(--muted)}
    .reveal-btn,.copy-token-btn{font-family:var(--mono);font-size:10px;padding:6px 10px;border-radius:6px;border:1px solid var(--border);background:var(--surface);color:var(--muted);cursor:pointer;white-space:nowrap}
    .reveal-btn:hover,.copy-token-btn:hover{color:var(--text);border-color:var(--border-b)}
    .warn-box{background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.2);border-radius:8px;padding:12px 16px;font-size:12px;color:var(--warn);line-height:1.5;margin-top:8px}
    .optional-section{border-top:1px solid var(--border);margin-top:32px;padding-top:24px}
    .optional-section h2{font-size:16px;font-weight:600;color:var(--dim);margin-bottom:16px}
  </style>
</head>
<body>
<div class="page">
  <a href="/" class="back">&larr; Back to JARVIS</a>
  <h1>Setup Your Mac</h1>
  <p class="subtitle">Connect JARVIS to your Mac so it can manage files, run code, and control your screen.</p>

  <div class="status-card ${connected ? "online" : "offline"}">
    <div class="status-dot"></div>
    <div>
      <div class="status-text">${connected ? "Daemon Connected" : "Daemon Not Connected"}</div>
      <div class="status-sub">${connected ? "Your Mac is linked and ready." : "Follow the steps below to connect."}</div>
    </div>
  </div>

  <div class="step">
    <div class="step-num">STEP 1</div>
    <h3>Install Claude Code</h3>
    <p>JARVIS runs through Claude Code on your Mac. Install it if you don't have it:</p>
    <div class="code-block" id="step1-code">npm install -g @anthropic-ai/claude-code<button class="copy-btn" onclick="copyCode('step1-code')">COPY</button></div>
    <p style="margin-top:8px;font-size:12px;color:var(--muted)">Requires Node.js 18+. You'll need an active Claude Pro, Max, Team, or Enterprise subscription.</p>
  </div>

  <div class="step">
    <div class="step-num">STEP 2</div>
    <h3>Your Daemon Token</h3>
    <p>This token links your Mac to your JARVIS account. Keep it secret.</p>
    <div class="token-box">
      <div class="token-value masked" id="token-display">&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;</div>
      <button class="reveal-btn" id="reveal-btn" onclick="toggleToken()">SHOW</button>
      <button class="copy-token-btn" onclick="copyToken()">COPY</button>
    </div>
    <div class="warn-box">Never share this token. Anyone with it can connect a daemon to your account.</div>
  </div>

  <div class="step">
    <div class="step-num">STEP 3</div>
    <h3>Install JARVIS Daemon</h3>
    <p>Run this in Terminal to install and start the JARVIS daemon on your Mac:</p>
    <div class="code-block" id="step3-code">curl -fsSL https://avery-keller.net/install.sh | bash -s -- --token YOUR_TOKEN<button class="copy-btn" onclick="copyInstall()">COPY</button></div>
    <p style="margin-top:8px;font-size:12px;color:var(--muted)">This installs to ~/jarvis, creates a LaunchAgent, and starts the daemon. Takes about 2 minutes.</p>
  </div>

  <div class="step">
    <div class="step-num">STEP 4</div>
    <h3>Verify Connection</h3>
    <p>After the installer finishes, refresh this page. The status above should show "Daemon Connected."</p>
    <button class="reveal-btn" style="margin-top:4px" onclick="location.reload()">REFRESH</button>
  </div>

  <div class="optional-section">
    <h2>Optional: Bring Your Own API Key</h2>
    <div class="step" style="margin-bottom:0">
      <p>By default, JARVIS uses Claude Code with your Claude subscription. If you'd prefer to use a Claude API key directly, you can set it in your daemon config at <code style="font-family:var(--mono);font-size:12px;background:rgba(56,189,248,0.08);padding:2px 6px;border-radius:4px;color:var(--primary)">~/jarvis/config/jarvis.toml</code></p>
    </div>
  </div>
</div>
<script>
(function(){
  var token='${daemonToken}';
  var revealed=false;
  var tokenEl=document.getElementById('token-display');
  var revealBtn=document.getElementById('reveal-btn');

  window.toggleToken=function(){
    revealed=!revealed;
    if(revealed){
      tokenEl.textContent=token;
      tokenEl.classList.remove('masked');
      revealBtn.textContent='HIDE';
    }else{
      tokenEl.textContent='\\u2022'.repeat(24);
      tokenEl.classList.add('masked');
      revealBtn.textContent='SHOW';
    }
  };

  window.copyToken=function(){
    navigator.clipboard.writeText(token).then(function(){
      var btn=document.querySelector('.copy-token-btn');
      btn.textContent='COPIED';
      setTimeout(function(){btn.textContent='COPY'},1500);
    });
  };

  window.copyCode=function(id){
    var el=document.getElementById(id);
    var text=el.textContent.replace('COPY','').trim();
    navigator.clipboard.writeText(text).then(function(){
      var btn=el.querySelector('.copy-btn');
      btn.textContent='COPIED';
      setTimeout(function(){btn.textContent='COPY'},1500);
    });
  };

  window.copyInstall=function(){
    var cmd='curl -fsSL https://avery-keller.net/install.sh | bash -s -- --token '+token;
    navigator.clipboard.writeText(cmd).then(function(){
      var btn=document.getElementById('step3-code').querySelector('.copy-btn');
      btn.textContent='COPIED';
      setTimeout(function(){btn.textContent='COPY'},1500);
    });
  };
})();
</script>
</body>
</html>`;
}
