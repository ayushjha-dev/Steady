// SQLite (Turso/libSQL) schema. Applied automatically on server boot in
// src/lib/server/db.ts. Single source of truth for the new backend.

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user_id ON sessions(user_id);
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  start_date TEXT NOT NULL DEFAULT '',
  daily_target_minutes INTEGER NOT NULL DEFAULT 210,
  plan_loaded INTEGER NOT NULL DEFAULT 0,
  selected_subjects TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS subjects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '',
  is_main INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS sections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS topics (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  section_id TEXT NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started',
  notes TEXT NOT NULL DEFAULT '',
  resources TEXT NOT NULL DEFAULT '[]',
  sort_order INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT
);
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  subject_id TEXT REFERENCES subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  est_minutes INTEGER NOT NULL DEFAULT 30,
  done INTEGER NOT NULL DEFAULT 0,
  done_at TEXT,
  carried_over INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS tasks_user_date ON tasks(user_id, date);
CREATE TABLE IF NOT EXISTS practice_sets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  kind TEXT NOT NULL,
  topic_id TEXT REFERENCES topics(id) ON DELETE CASCADE,
  questions TEXT NOT NULL DEFAULT '[]',
  metadata TEXT,
  generated_at TEXT NOT NULL,
  UNIQUE(user_id, date, kind)
);
CREATE INDEX IF NOT EXISTS practice_sets_user_date ON practice_sets(user_id, date);
CREATE TABLE IF NOT EXISTS practice_attempts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  practice_set_id TEXT NOT NULL REFERENCES practice_sets(id) ON DELETE CASCADE,
  question_index INTEGER NOT NULL,
  selected_index INTEGER NOT NULL,
  is_correct INTEGER NOT NULL DEFAULT 0,
  time_taken_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS practice_attempts_set ON practice_attempts(practice_set_id);
CREATE INDEX IF NOT EXISTS practice_attempts_user ON practice_attempts(user_id);
CREATE TABLE IF NOT EXISTS practice_days (
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  total INTEGER NOT NULL DEFAULT 0,
  solved INTEGER NOT NULL DEFAULT 0,
  completed INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, date)
);
CREATE INDEX IF NOT EXISTS practice_days_user_date ON practice_days(user_id, date);
CREATE TABLE IF NOT EXISTS topic_notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  ai_generated INTEGER NOT NULL DEFAULT 1,
  generated_at TEXT,
  last_edited_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(user_id, topic_id)
);
CREATE INDEX IF NOT EXISTS topic_notes_user_id ON topic_notes(user_id);
CREATE INDEX IF NOT EXISTS topic_notes_topic_id ON topic_notes(topic_id);
CREATE TABLE IF NOT EXISTS topic_note_versions (
  id TEXT PRIMARY KEY,
  note_id TEXT NOT NULL REFERENCES topic_notes(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  change_summary TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS topic_note_versions_note_id ON topic_note_versions(note_id);
CREATE TABLE IF NOT EXISTS mock_tests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  test_type TEXT NOT NULL DEFAULT 'subject',
  questions TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 120,
  total_marks INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'not_started',
  started_at TEXT,
  completed_at TEXT,
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  score INTEGER,
  percentage REAL,
  correct_count INTEGER NOT NULL DEFAULT 0,
  incorrect_count INTEGER NOT NULL DEFAULT 0,
  unattempted_count INTEGER NOT NULL DEFAULT 0,
  answers TEXT,
  subject_breakdown TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS mock_tests_user_id ON mock_tests(user_id);
CREATE INDEX IF NOT EXISTS mock_tests_status ON mock_tests(status);
`;
