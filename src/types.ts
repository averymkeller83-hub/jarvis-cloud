export interface Env {
  DB: D1Database;
  AUDIT_DB: D1Database;
  ENCRYPTION_KEY: string;
  OPENAI_API_KEY: string;
  AI: Ai;
  MAC_BRIDGE: DurableObjectNamespace;
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  VAPID_SUBJECT: string;
  FISH_AUDIO_API_KEY: string;
}

export interface AuthContext {
  userId: number;
  userName: string;
  email: string;
  daemonToken: string;
  plan: string;
  foundingMember: boolean;
}
