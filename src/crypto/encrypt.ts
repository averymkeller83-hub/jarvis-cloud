const ALGO = "AES-GCM";
const IV_LEN = 12;
const PREFIX = "enc:";

async function deriveUserKey(serverKey: string, userId: number): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const base = await crypto.subtle.importKey("raw", enc.encode(serverKey), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const derived = await crypto.subtle.sign("HMAC", base, enc.encode(`jarvis-user-${userId}`));
  return crypto.subtle.importKey("raw", derived, { name: ALGO }, false, ["encrypt", "decrypt"]);
}

export async function encrypt(plaintext: string, serverKey: string, userId: number): Promise<string> {
  const key = await deriveUserKey(serverKey, userId);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: ALGO, iv }, key, encoded);
  const combined = new Uint8Array(IV_LEN + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), IV_LEN);
  let binary = "";
  for (let i = 0; i < combined.length; i++) binary += String.fromCharCode(combined[i]);
  return PREFIX + btoa(binary);
}

export async function decrypt(stored: string, serverKey: string, userId: number): Promise<string> {
  if (!stored.startsWith(PREFIX)) return stored;
  const key = await deriveUserKey(serverKey, userId);
  const raw = Uint8Array.from(atob(stored.slice(PREFIX.length)), (c) => c.charCodeAt(0));
  const iv = raw.slice(0, IV_LEN);
  const ciphertext = raw.slice(IV_LEN);
  const plaintext = await crypto.subtle.decrypt({ name: ALGO, iv }, key, ciphertext);
  return new TextDecoder().decode(plaintext);
}

export function isEncrypted(value: string): boolean {
  return value.startsWith(PREFIX);
}
