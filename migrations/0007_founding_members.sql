ALTER TABLE users ADD COLUMN founding_member INTEGER NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS founding_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
INSERT OR IGNORE INTO founding_config (key, value) VALUES ('max_slots', '100');
INSERT OR IGNORE INTO founding_config (key, value) VALUES ('enabled', 'true');
