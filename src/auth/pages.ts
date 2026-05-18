const SHARED_STYLES = `
    :root {
      --bg: #0a0e1a;
      --surface: #111827;
      --border: rgba(56, 189, 248, 0.15);
      --primary: #38bdf8;
      --primary-glow: rgba(56, 189, 248, 0.3);
      --text: #e2e8f0;
      --text-dim: #94a3b8;
      --error: #f87171;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
      min-height: 100dvh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 32px;
      width: 100%;
      max-width: 380px;
      margin: 16px;
    }
    .logo {
      text-align: center;
      margin-bottom: 24px;
    }
    .logo h1 {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 4px;
      background: linear-gradient(135deg, var(--primary), #818cf8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .logo p {
      color: var(--text-dim);
      font-size: 13px;
      margin-top: 4px;
    }
    .field {
      margin-bottom: 16px;
    }
    .field label {
      display: block;
      font-size: 12px;
      color: var(--text-dim);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 6px;
    }
    .field input {
      width: 100%;
      padding: 12px 14px;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--text);
      font-size: 15px;
      outline: none;
      transition: border-color 0.2s;
    }
    .field input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 2px var(--primary-glow);
    }
    .btn {
      width: 100%;
      padding: 12px;
      background: linear-gradient(135deg, var(--primary), #818cf8);
      border: none;
      border-radius: 8px;
      color: #fff;
      font-size: 15px;
      font-weight: 600;
      letter-spacing: 1px;
      cursor: pointer;
      margin-top: 8px;
      transition: opacity 0.2s;
    }
    .btn:hover { opacity: 0.9; }
    .btn:disabled { opacity: 0.5; cursor: default; }
    .error-msg {
      color: var(--error);
      font-size: 13px;
      text-align: center;
      margin-top: 12px;
      min-height: 18px;
    }
    .link {
      text-align: center;
      margin-top: 16px;
      font-size: 13px;
      color: var(--text-dim);
    }
    .link a {
      color: var(--primary);
      text-decoration: none;
    }
    .link a:hover { text-decoration: underline; }
    .terms-check {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin: 16px 0 4px;
      font-size: 13px;
      color: var(--text-dim);
      line-height: 1.5;
    }
    .terms-check input[type="checkbox"] {
      margin-top: 3px;
      accent-color: var(--primary);
      flex-shrink: 0;
    }
    .terms-check a { color: var(--primary); text-decoration: none; }
    .terms-check a:hover { text-decoration: underline; }
`;

export function getLoginPage(error?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="apple-touch-icon" href="/icon-192.png">
  <title>JARVIS — Login</title>
  <style>${SHARED_STYLES}</style>
</head>
<body>
  <div class="card">
    <div class="logo">
      <h1>JARVIS</h1>
      <p>Sign in to your assistant</p>
    </div>
    <form method="POST" action="/api/auth/login">
      <div class="field">
        <label>Email</label>
        <input type="email" name="email" required autocomplete="email" autofocus>
      </div>
      <div class="field">
        <label>Password</label>
        <input type="password" name="password" required autocomplete="current-password">
      </div>
      <button type="submit" class="btn">SIGN IN</button>
    </form>
    <div class="error-msg">${error || ""}</div>
    <div class="link">No account? <a href="/signup">Create one</a></div>
  </div>
</body>
</html>`;
}

export function getSignupPage(error?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="apple-touch-icon" href="/icon-192.png">
  <title>JARVIS — Sign Up</title>
  <style>${SHARED_STYLES}</style>
</head>
<body>
  <div class="card">
    <div class="logo">
      <h1>JARVIS</h1>
      <p>Create your account</p>
    </div>
    <form method="POST" action="/api/auth/signup">
      <div class="field">
        <label>Name</label>
        <input type="text" name="name" required autocomplete="name" autofocus>
      </div>
      <div class="field">
        <label>Email</label>
        <input type="email" name="email" required autocomplete="email">
      </div>
      <div class="field">
        <label>Password</label>
        <input type="password" name="password" required autocomplete="new-password" minlength="8">
      </div>
      <label class="terms-check">
        <input type="checkbox" name="terms" value="1" required>
        <span>I agree to the <a href="/terms" target="_blank">Terms of Service</a> and <a href="/privacy" target="_blank">Privacy Policy</a></span>
      </label>
      <button type="submit" class="btn">CREATE ACCOUNT</button>
    </form>
    <div class="error-msg">${error || ""}</div>
    <div class="link">Already have an account? <a href="/login">Sign in</a></div>
  </div>
</body>
</html>`;
}
