-- Cached MCP servers discovered from registries
CREATE TABLE IF NOT EXISTS mcp_registry_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,           -- 'github', 'npm', 'clawhub'
  name TEXT NOT NULL,
  repo_url TEXT NOT NULL,
  description TEXT,
  stars INTEGER DEFAULT 0,
  last_commit TEXT,               -- ISO date of last commit
  readme_summary TEXT,            -- AI-generated summary
  categories TEXT,                -- JSON array of categories
  safety_score INTEGER,           -- 0-100, null if not scanned
  safety_report TEXT,             -- JSON safety audit result
  scanned_at INTEGER,             -- unix timestamp
  fetched_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(source, repo_url)
);

CREATE INDEX IF NOT EXISTS idx_mcp_cache_source ON mcp_registry_cache(source);
CREATE INDEX IF NOT EXISTS idx_mcp_cache_safety ON mcp_registry_cache(safety_score);

-- Per-user MCP suggestions
CREATE TABLE IF NOT EXISTS mcp_suggestions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  mcp_id INTEGER NOT NULL REFERENCES mcp_registry_cache(id),
  relevance_score REAL NOT NULL,  -- 0.0-1.0
  reason TEXT NOT NULL,           -- why this was suggested
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'installed'
  presented_at INTEGER,           -- when shown to user
  decided_at INTEGER,             -- when user approved/rejected
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_mcp_suggestions_user ON mcp_suggestions(user_id, status);

-- Proactive job configuration (cloud-side scheduler)
CREATE TABLE IF NOT EXISTS proactive_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_type TEXT NOT NULL,         -- 'mcp_discovery', 'safety_scan', 'update_check', 'suggest'
  interval_hours INTEGER NOT NULL DEFAULT 24,
  last_run_at INTEGER,
  enabled INTEGER NOT NULL DEFAULT 1,
  config TEXT,                    -- JSON config per job type
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Seed default jobs
INSERT INTO proactive_jobs (job_type, interval_hours, config) VALUES
  ('update_check', 12, '{"check_cli":true,"check_daemon":true}'),
  ('mcp_discovery', 24, '{"sources":["github","npm"],"max_results":50}'),
  ('safety_scan', 6, '{"batch_size":10}'),
  ('suggest', 24, '{"max_suggestions_per_user":3}');
