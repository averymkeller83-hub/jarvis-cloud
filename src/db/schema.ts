import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().default(""),
  email: text("email").unique(),
  passwordHash: text("password_hash"),
  daemonToken: text("daemon_token").unique(),
  lockedUntil: integer("locked_until"),
  termsAcceptedAt: integer("terms_accepted_at"),
  plan: text("plan").notNull().default("free"),
  planExpiresAt: integer("plan_expires_at"),
  foundingMember: integer("founding_member").notNull().default(0),
  isAdmin: integer("is_admin").notNull().default(0),
  timezone: text("timezone").default("America/Indianapolis"),
  prefs: text("prefs").default("{}"),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
});

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    expiresAt: integer("expires_at").notNull(),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
  },
  (table) => [
    index("idx_sessions_user").on(table.userId),
    index("idx_sessions_expires").on(table.expiresAt),
  ],
);

export const facts = sqliteTable(
  "facts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    fact: text("fact").notNull(),
    source: text("source").default("mcp"),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
  },
  (table) => [index("idx_facts_user_created").on(table.userId, table.createdAt)],
);

export const pushSubscriptions = sqliteTable(
  "push_subscriptions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
  },
  (table) => [
    index("idx_push_subs_user").on(table.userId),
  ],
);

export const people = sqliteTable("people", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  name: text("name").notNull(),
  relationship: text("relationship").default(""),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`),
});

export const mcpRegistryCache = sqliteTable("mcp_registry_cache", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  source: text("source").notNull(),
  name: text("name").notNull(),
  repoUrl: text("repo_url").notNull(),
  description: text("description"),
  stars: integer("stars").default(0),
  lastCommit: text("last_commit"),
  readmeSummary: text("readme_summary"),
  categories: text("categories"),
  safetyScore: integer("safety_score"),
  safetyReport: text("safety_report"),
  scannedAt: integer("scanned_at"),
  fetchedAt: integer("fetched_at").notNull().default(sql`(unixepoch())`),
});

export const mcpSuggestions = sqliteTable("mcp_suggestions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  mcpId: integer("mcp_id").notNull(),
  relevanceScore: real("relevance_score").notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("pending"),
  presentedAt: integer("presented_at"),
  decidedAt: integer("decided_at"),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
});

export const proactiveJobs = sqliteTable("proactive_jobs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  jobType: text("job_type").notNull(),
  intervalHours: integer("interval_hours").notNull().default(24),
  lastRunAt: integer("last_run_at"),
  enabled: integer("enabled").notNull().default(1),
  config: text("config"),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
});
