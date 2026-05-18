export function getUpgradePage(plan: string, foundingMember: boolean = false, slotsRemaining: number = 0): string {
  const isPro = plan === "pro" || foundingMember;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <meta name="theme-color" content="#030712">
  <link rel="apple-touch-icon" href="/icon-192.png">
  <title>JARVIS — ${isPro ? "Your Plan" : "Upgrade to Pro"}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      font-family: -apple-system, 'SF Pro Display', system-ui, sans-serif;
      background: #030712; color: #e2e8f0;
      min-height: 100dvh;
      -webkit-font-smoothing: antialiased;
    }
    .page {
      max-width: 480px; margin: 0 auto; padding: 40px 20px 80px;
    }
    .back {
      display: inline-block; margin-bottom: 24px;
      color: #64748b; font-size: 13px; text-decoration: none;
    }
    .back:hover { color: #94a3b8; }
    h1 {
      font-size: 32px; font-weight: 700; margin-bottom: 8px;
      background: linear-gradient(135deg, #38bdf8, #818cf8);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .subtitle { color: #94a3b8; font-size: 15px; margin-bottom: 32px; }
    .plan-card {
      border: 1px solid rgba(56, 189, 248, 0.15);
      border-radius: 16px; padding: 24px;
      margin-bottom: 16px; position: relative;
      transition: border-color 0.2s;
    }
    .plan-card.free { background: #0f172a; }
    .plan-card.pro {
      background: linear-gradient(135deg, rgba(56, 189, 248, 0.06), rgba(129, 140, 248, 0.06));
      border-color: rgba(56, 189, 248, 0.3);
    }
    .plan-badge {
      display: inline-block; font-size: 11px; font-weight: 600;
      letter-spacing: 1.5px; text-transform: uppercase; padding: 4px 10px;
      border-radius: 6px; margin-bottom: 12px;
    }
    .plan-card.free .plan-badge { background: rgba(100, 116, 139, 0.2); color: #94a3b8; }
    .plan-card.pro .plan-badge {
      background: linear-gradient(135deg, #38bdf8, #818cf8);
      color: #fff;
    }
    .plan-name { font-size: 20px; font-weight: 600; color: #f1f5f9; }
    .plan-price {
      font-size: 36px; font-weight: 700; color: #f1f5f9; margin: 8px 0 4px;
    }
    .plan-price span { font-size: 16px; font-weight: 400; color: #64748b; }
    .plan-desc { color: #94a3b8; font-size: 13px; margin-bottom: 16px; }
    .features { list-style: none; padding: 0; }
    .features li {
      font-size: 14px; color: #cbd5e1; padding: 6px 0;
      display: flex; align-items: center; gap: 10px;
    }
    .features li::before {
      content: '\\2713'; color: #34d399; font-weight: 700;
      font-size: 14px; flex-shrink: 0;
    }
    .features li.locked::before { content: '\\2717'; color: #64748b; }
    .features li.locked { color: #64748b; }
    .upgrade-btn {
      display: block; width: 100%; padding: 14px; margin-top: 20px;
      background: linear-gradient(135deg, #38bdf8, #818cf8);
      border: none; border-radius: 10px; color: #fff;
      font-size: 16px; font-weight: 600; letter-spacing: 0.5px;
      cursor: pointer; transition: opacity 0.2s;
      text-align: center; text-decoration: none;
    }
    .upgrade-btn:hover { opacity: 0.9; }
    .upgrade-btn:disabled { opacity: 0.4; cursor: default; }
    .founding-badge {
      display: inline-block; font-size: 11px; font-weight: 600;
      letter-spacing: 1.5px; text-transform: uppercase; padding: 4px 10px;
      border-radius: 6px; margin-bottom: 12px; margin-left: 8px;
      background: linear-gradient(135deg, #f59e0b, #f97316);
      color: #fff;
    }
    .founding-banner {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(249, 115, 22, 0.08));
      border: 1px solid rgba(245, 158, 11, 0.3);
      border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;
      text-align: center;
    }
    .founding-banner h3 {
      font-size: 16px; font-weight: 600; color: #f59e0b; margin-bottom: 6px;
    }
    .founding-banner p {
      font-size: 13px; color: #94a3b8; line-height: 1.5;
    }
    .founding-banner .slots {
      font-size: 24px; font-weight: 700; color: #f59e0b; margin: 8px 0;
    }
    .current-label {
      display: block; width: 100%; padding: 14px; margin-top: 20px;
      background: rgba(52, 211, 153, 0.1); border: 1px solid rgba(52, 211, 153, 0.3);
      border-radius: 10px; color: #34d399;
      font-size: 14px; font-weight: 600; letter-spacing: 0.5px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="page">
    <a href="/" class="back">&larr; Back to JARVIS</a>
    <h1>JARVIS Pro</h1>
    <p class="subtitle">Unlock the full power of your AI assistant.</p>

    ${foundingMember ? `
    <div class="founding-banner">
      <h3>FOUNDING MEMBER</h3>
      <p>You're one of JARVIS's earliest supporters. Full Pro access is yours — free, forever. Thank you for believing in the project.</p>
    </div>` : slotsRemaining > 0 ? `
    <div class="founding-banner">
      <h3>FOUNDING MEMBER PROGRAM</h3>
      <div class="slots">${slotsRemaining} / 100</div>
      <p>slots remaining — Sign up now and get full Pro access <strong>free forever</strong>. Just post about JARVIS on social media to keep your spot.</p>
    </div>` : ""}

    <div class="plan-card free">
      <div class="plan-badge">FREE</div>
      <div class="plan-name">JARVIS Basic</div>
      <div class="plan-price">$0 <span>/month</span></div>
      <div class="plan-desc">Your personal AI assistant — scheduling, reminders, and memory.</div>
      <ul class="features">
        <li>Chat with JARVIS</li>
        <li>Scheduling &amp; reminders</li>
        <li>Memory — JARVIS learns about you</li>
        <li>Push notifications</li>
        <li>JARVIS voice (Draco)</li>
        <li>Bring your own Claude API key</li>
        <li class="locked">Write code &amp; debug</li>
        <li class="locked">Read &amp; write files on your Mac</li>
        <li class="locked">Computer control (Ace)</li>
        <li class="locked">Live screen view &amp; VNC</li>
        <li class="locked">40+ premium voices</li>
      </ul>
      ${plan === "free" ? '<div class="current-label">CURRENT PLAN</div>' : ""}
    </div>

    <div class="plan-card pro">
      <div class="plan-badge">PRO</div>
      <div class="plan-name">JARVIS Pro</div>
      <div class="plan-price">$9.99 <span>/month</span></div>
      <div class="plan-desc">Full JARVIS experience. AI that sees your screen and takes action.</div>
      <ul class="features">
        <li>Everything in Basic</li>
        <li>Write, debug, and refactor code in any language</li>
        <li>Read &amp; write files directly on your Mac</li>
        <li>Computer control — JARVIS sees your screen and takes action</li>
        <li>Live screen view &amp; VNC remote access</li>
        <li>40+ premium TTS voices</li>
        <li>All MCP tools &amp; integrations</li>
        <li>Priority support</li>
      </ul>
      ${
        foundingMember
          ? '<div class="current-label">FOUNDING MEMBER — PRO ACCESS</div>'
          : isPro
            ? '<div class="current-label">CURRENT PLAN</div>'
            : '<button class="upgrade-btn" id="upgrade-btn">UPGRADE TO PRO</button>'
      }
    </div>
  </div>
  <script>
    var btn = document.getElementById('upgrade-btn');
    if (btn) {
      btn.addEventListener('click', function() {
        btn.textContent = 'COMING SOON';
        btn.disabled = true;
      });
    }
  </script>
</body>
</html>`;
}
