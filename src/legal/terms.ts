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
  .legal p, .legal li { font-size: 15px; color: #cbd5e1; margin-bottom: 12px; }
  .legal ul { padding-left: 24px; }
  .legal li { margin-bottom: 8px; }
  .legal .back { display: inline-block; margin-bottom: 24px; color: #64748b; font-size: 13px; }
`;

export function getTermsPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#030712">
  <title>Terms of Service — JARVIS</title>
  <style>${LEGAL_CSS}</style>
</head>
<body>
  <div class="legal">
    <a href="/signup" class="back">&larr; Back to Sign Up</a>
    <h1>Terms of Service</h1>
    <p class="updated">Last updated: April 21, 2026</p>

    <p>These Terms of Service ("Terms") govern your access to and use of JARVIS ("Service"), operated by Avery Keller ("we," "us," or "our"). By creating an account or using the Service, you agree to be bound by these Terms. If you do not agree, do not use the Service.</p>

    <h2>1. Description of Service</h2>
    <p>JARVIS is an AI-powered assistant that can, among other things, remotely control your personal computer ("Device") through screen viewing, mouse clicks, keyboard input, and application interaction. The Service uses third-party artificial intelligence models to interpret your instructions and execute actions on your Device.</p>

    <h2>2. Eligibility</h2>
    <p>You must be at least 18 years old and capable of forming a binding contract to use this Service. By creating an account, you represent that you meet these requirements.</p>

    <h2>3. Account Responsibilities</h2>
    <ul>
      <li>You are responsible for maintaining the confidentiality of your account credentials and daemon token.</li>
      <li>You are responsible for all activity that occurs under your account.</li>
      <li>You must notify us immediately of any unauthorized use of your account.</li>
      <li>You must only connect Devices that you own or have explicit authorization to control.</li>
    </ul>

    <h2>4. AI and Remote Control Disclaimer</h2>
    <p><strong>THIS IS CRITICAL:</strong> The Service uses artificial intelligence to interpret instructions and perform actions on your Device. AI systems can and do make mistakes. By using this Service, you acknowledge and accept that:</p>
    <ul>
      <li>AI-driven actions may not always produce the intended results.</li>
      <li>The AI may misinterpret instructions and perform unintended actions on your Device, including but not limited to: opening applications, clicking on unintended targets, typing incorrect text, modifying files, or interacting with websites and services.</li>
      <li>You are solely responsible for monitoring actions performed by the Service on your Device.</li>
      <li>We strongly recommend keeping backups of important data and not granting the Service access to sensitive systems, financial accounts, or critical infrastructure without active supervision.</li>
      <li>The Service includes safety guardrails, but no automated safety system is perfect.</li>
    </ul>

    <h2>5. Acceptable Use</h2>
    <p>You agree not to use the Service to:</p>
    <ul>
      <li>Violate any applicable law or regulation.</li>
      <li>Access or control any Device without proper authorization.</li>
      <li>Engage in any activity that could harm, disable, or impair the Service or other users.</li>
      <li>Attempt to gain unauthorized access to any systems or data.</li>
      <li>Use the Service for any illegal, fraudulent, or malicious purpose.</li>
      <li>Reverse engineer, decompile, or attempt to extract the source code of the Service.</li>
      <li>Resell, sublicense, or redistribute access to the Service without written permission.</li>
    </ul>

    <h2>6. Data and Privacy</h2>
    <p>Your use of the Service is also governed by our <a href="/privacy">Privacy Policy</a>, which describes how we collect, use, and protect your information. By using the Service, you consent to our data practices as described in the Privacy Policy.</p>

    <h2>7. Limitation of Liability</h2>
    <p><strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW:</strong></p>
    <ul>
      <li>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</li>
      <li>WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE, OR THAT ANY DEFECTS WILL BE CORRECTED.</li>
      <li>IN NO EVENT SHALL WE BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF DATA, LOSS OF PROFITS, DAMAGE TO DEVICES OR SOFTWARE, OR BUSINESS INTERRUPTION, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE.</li>
      <li>OUR TOTAL AGGREGATE LIABILITY FOR ALL CLAIMS RELATED TO THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR FIFTY DOLLARS ($50), WHICHEVER IS GREATER.</li>
      <li>WE ARE NOT LIABLE FOR ANY ACTIONS PERFORMED BY THE AI ON YOUR DEVICE, INCLUDING DATA LOSS, FILE MODIFICATION, UNINTENDED PURCHASES, OR ANY OTHER CONSEQUENCE OF AI-DRIVEN COMPUTER CONTROL.</li>
    </ul>

    <h2>8. Indemnification</h2>
    <p>You agree to indemnify, defend, and hold harmless Avery Keller, and any affiliates, officers, agents, or contractors, from and against any claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising out of or in any way connected with: (a) your use of the Service; (b) your violation of these Terms; (c) actions performed by the Service on your Device at your direction; or (d) your violation of any rights of a third party.</p>

    <h2>9. Service Availability and Modification</h2>
    <ul>
      <li>We may modify, suspend, or discontinue the Service (or any part of it) at any time without notice.</li>
      <li>We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance of the updated Terms.</li>
      <li>We reserve the right to terminate or suspend your account at our sole discretion, with or without cause.</li>
    </ul>

    <h2>10. Third-Party Services</h2>
    <p>The Service relies on third-party providers including but not limited to Anthropic (AI models), Cloudflare (infrastructure), and Apple (device APIs). We are not responsible for the availability, accuracy, or conduct of any third-party service. Your use of third-party services is subject to their respective terms and policies.</p>

    <h2>11. Governing Law and Disputes</h2>
    <p>These Terms are governed by and construed in accordance with the laws of the State of Indiana, United States, without regard to conflict of law principles. Any disputes arising under these Terms shall be resolved exclusively in the state or federal courts located in Indiana. You waive any objection to jurisdiction or venue in such courts.</p>

    <h2>12. Severability</h2>
    <p>If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full force and effect.</p>

    <h2>13. Entire Agreement</h2>
    <p>These Terms, together with the Privacy Policy, constitute the entire agreement between you and us regarding the Service and supersede all prior agreements.</p>

    <h2>14. Contact</h2>
    <p>For questions about these Terms, contact us at <a href="mailto:legal@avery-keller.net">legal@avery-keller.net</a>.</p>
  </div>
</body>
</html>`;
}
