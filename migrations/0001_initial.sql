CREATE TABLE IF NOT EXISTS users (
  telegram_user_id TEXT PRIMARY KEY,
  language TEXT NOT NULL DEFAULT 'vi',
  difficulty TEXT NOT NULL DEFAULT 'beginner',
  duration TEXT NOT NULL DEFAULT 'medium',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  telegram_user_id TEXT NOT NULL,
  topic TEXT,
  difficulty TEXT NOT NULL DEFAULT 'beginner',
  status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'completed')),
  current_stage TEXT NOT NULL,
  proposed_stage TEXT,
  hint_level INTEGER NOT NULL DEFAULT 0,
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  FOREIGN KEY (telegram_user_id) REFERENCES users(telegram_user_id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_status
  ON sessions (telegram_user_id, status, updated_at);

CREATE TABLE IF NOT EXISTS turns (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  telegram_user_id TEXT NOT NULL,
  stage TEXT NOT NULL,
  user_message TEXT NOT NULL,
  bot_response TEXT NOT NULL,
  coach_payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

CREATE INDEX IF NOT EXISTS idx_turns_session_created
  ON turns (session_id, created_at);

CREATE TABLE IF NOT EXISTS progress (
  id TEXT PRIMARY KEY,
  telegram_user_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  criterion TEXT NOT NULL,
  signal TEXT NOT NULL CHECK (signal IN ('strength', 'practice')),
  note TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

CREATE INDEX IF NOT EXISTS idx_progress_user_criterion
  ON progress (telegram_user_id, criterion, created_at);

CREATE TABLE IF NOT EXISTS processed_updates (
  update_id INTEGER PRIMARY KEY,
  processed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
