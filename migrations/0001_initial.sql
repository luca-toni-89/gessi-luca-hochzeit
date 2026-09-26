-- Run against the wedding D1 database after it is created.
CREATE TABLE IF NOT EXISTS rsvps (
  id TEXT PRIMARY KEY,
  contact_name TEXT NOT NULL,
  contact_email TEXT,
  attending INTEGER NOT NULL CHECK (attending IN (0, 1)),
  language TEXT NOT NULL CHECK (language IN ('de', 'it')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS guests (
  id TEXT PRIMARY KEY,
  rsvp_id TEXT NOT NULL REFERENCES rsvps(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  dietary_requirements TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS guests_rsvp_id_idx ON guests(rsvp_id);

CREATE TABLE IF NOT EXISTS photo_uploads (
  id TEXT PRIMARY KEY,
  object_key TEXT NOT NULL UNIQUE,
  original_filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
);
