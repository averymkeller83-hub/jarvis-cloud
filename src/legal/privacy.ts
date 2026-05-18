const LEGAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    font-family: -apple-system, 'SF Pro Display', system-ui, sans-serif;
    background: #030712; color: #e2e8f0;
    -webkit-font-smoothing: antialiased;
  }
  .legal {
    max-width: 720px; margin: 0 auto; padding: 40px 20px 80px;
    line-height: 1.7;
  }
  .legal a { color: #38bdf8; text-decoration: none; }
  .legal a:hover { text-decoration: underline; }
  .legal h1 {
    font-size: 28px; font-weight: 700; margin-bottom: 8px;
    background: linear-gradient(135deg, #38bdf8, #818cf8);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .legal .updated { color: #64748b; font-size: 13px; margin-bottom: 32px; }
  .legal h2 { font-size: 18px; font-weight: 600; color: #f1f5f9; margin: 32px 0 12px; }
  .legal h3 { font-size: 15px; font-weight: 600; color: #e2e8f0; margin: 20px 0 8px; }
  .legal p, .legal li { font-size: 15px; color: #cbd5e1; margin-bottom: 12px; }
  .legal ul { padding-left: 24px; }
  .legal li { margin-bottom: 8px; }
  .legal .back { display: inline-block; margin-bottom: 24px; color: #64748b; font-size: 13px; }
  .legal table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  .legal th, .legal td { text-align: left; padding: 10px 12px; border-bottom: 1px solid rgba(56, 189, 248, 0.1); font-size: 14px; }
  .legal th { color: #94a3b8; font-weight: 500; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
`;

export function getPrivacyPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#030712">
  <title>Privacy Policy — JARVIS</title>
  <style>${LEGAL_CSS}</style>
</head>
<body>
  <div class="legal">
    <a href="/signup" class="back">&larr; Back to Sign Up</a>
    <h1>Privacy Policy</h1>
    <p class="updated">Last updated: April 21, 2026</p>

    <p>This Privacy Policy describes how JARVIS ("Service"), operated by Avery Keller ("we," "us," or "our"), collects, uses, and protects your personal information. By using the Service, you consent to the practices described below.</p>

    <h2>1. Information We Collect</h2>

    <h3>Account Information</h3>
    <p>When you create an account, we collect:</p>
    <ul>
      <li>Your name</li>
      <li>Email address</li>
      <li>Password (stored as a one-way cryptographic hash — we cannot read your password)</li>
    </ul>

    <h3>Usage Data</h3>
    <p>When you use the Service, we may collect:</p>
    <ul>
      <li>Chat messages and instructions you send to JARVIS</li>
      <li>Screenshots of your Device taken during AI task execution</li>
      <li>Task history (instructions, results, timestamps)</li>
      <li>Session information (login times, IP addresses for security purposes)</li>
      <li>Push notification subscription data (device tokens)</li>
    </ul>

    <h3>Device Information</h3>
    <p>When your daemon connects, we receive:</p>
    <ul>
      <li>Connection status and heartbeat data</li>
      <li>Screen content during active AI sessions</li>
    </ul>

    <h3>Personal Context (Memory)</h3>
    <p>JARVIS learns about you to provide better assistance. This may include:</p>
    <ul>
      <li>Preferences, interests, and routines you share</li>
      <li>Names and relationships of people you mention</li>
      <li>Facts you tell JARVIS to remember</li>
    </ul>

    <h2>2. How We Use Your Information</h2>
    <table>
      <tr><th>Purpose</th><th>Data Used</th></tr>
      <tr><td>Provide the Service</td><td>Account info, chat messages, device data</td></tr>
      <tr><td>Execute AI tasks on your Device</td><td>Instructions, screenshots</td></tr>
      <tr><td>Personalize responses</td><td>Memory and context data</td></tr>
      <tr><td>Send notifications</td><td>Push subscription tokens</td></tr>
      <tr><td>Protect your account</td><td>IP addresses, login attempts</td></tr>
      <tr><td>Improve the Service</td><td>Aggregated usage patterns (not individual data)</td></tr>
    </table>

    <h2>3. How We Protect Your Information</h2>
    <ul>
      <li><strong>Encryption in transit:</strong> All data is transmitted over HTTPS/WSS (TLS 1.2+).</li>
      <li><strong>Password security:</strong> Passwords are hashed using PBKDF2 with 100,000 iterations and random salts. We never store or can recover your plaintext password.</li>
      <li><strong>Session security:</strong> Sessions use cryptographically random tokens with HttpOnly, Secure, and SameSite=Strict cookies.</li>
      <li><strong>Rate limiting:</strong> Brute-force login attempts are blocked and accounts are temporarily locked after repeated failures.</li>
      <li><strong>Per-user isolation:</strong> Each user's data and daemon connection are isolated from other users.</li>
      <li><strong>Infrastructure:</strong> The Service runs on Cloudflare's global network with enterprise-grade physical and network security.</li>
    </ul>

    <h2>4. Data Sharing</h2>
    <p>We do not sell your personal information. We may share data with:</p>
    <ul>
      <li><strong>Anthropic:</strong> Chat messages and screenshots are sent to Anthropic's Claude API to power AI responses. Anthropic's data usage is governed by their <a href="https://www.anthropic.com/policies" target="_blank">policies</a>.</li>
      <li><strong>Cloudflare:</strong> Infrastructure provider. Data is processed on Cloudflare's network per their <a href="https://www.cloudflare.com/privacypolicy/" target="_blank">privacy policy</a>.</li>
      <li><strong>Law enforcement:</strong> We may disclose information if required by law, subpoena, or court order.</li>
    </ul>

    <h2>5. Screenshots and Device Data</h2>
    <p>When JARVIS performs tasks on your Device, screenshots are captured and sent through our servers to the AI model. These screenshots may contain sensitive information visible on your screen. We recommend:</p>
    <ul>
      <li>Closing sensitive applications before initiating AI tasks.</li>
      <li>Not having passwords, financial data, or private communications visible on screen during task execution.</li>
      <li>Using the Service in a controlled environment.</li>
    </ul>
    <p>Screenshots are processed in real-time and are not permanently stored on our servers beyond the duration of the active session.</p>

    <h2>6. Data Retention</h2>
    <ul>
      <li><strong>Account data:</strong> Retained while your account is active.</li>
      <li><strong>Chat history:</strong> Stored locally in your browser. Server-side message processing is transient.</li>
      <li><strong>Memory data:</strong> Retained until you request deletion or delete your account.</li>
      <li><strong>Login attempts:</strong> Automatically purged after 24 hours.</li>
      <li><strong>Sessions:</strong> Automatically expire and are purged after 24 hours.</li>
    </ul>

    <h2>7. Your Rights</h2>
    <p>You have the right to:</p>
    <ul>
      <li><strong>Access</strong> — Request a copy of your personal data.</li>
      <li><strong>Correct</strong> — Update inaccurate personal information.</li>
      <li><strong>Delete</strong> — Request deletion of your account and associated data.</li>
      <li><strong>Export</strong> — Request your data in a portable format.</li>
    </ul>
    <p>To exercise these rights, contact us at <a href="mailto:privacy@avery-keller.net">privacy@avery-keller.net</a>.</p>

    <h2>8. Children's Privacy</h2>
    <p>The Service is not intended for users under 18 years of age. We do not knowingly collect personal information from children. If we learn that we have collected data from a child under 18, we will delete that information promptly.</p>

    <h2>9. Changes to This Policy</h2>
    <p>We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on this page with a new "Last updated" date. Continued use of the Service after changes constitutes acceptance.</p>

    <h2>10. Contact</h2>
    <p>For questions about this Privacy Policy or your personal data, contact us at <a href="mailto:privacy@avery-keller.net">privacy@avery-keller.net</a>.</p>
  </div>
</body>
</html>`;
}
