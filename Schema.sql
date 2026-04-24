-- ============================================================
-- SASF LAW FIRM – Complete Database Schema
-- Provider : Neon PostgreSQL (serverless)
-- Encoding : UTF-8
-- ============================================================
-- NOTE: The live application stores all state in the
--       system_state table as a JSONB blob (see bottom of
--       this file).  The normalized tables below are the
--       canonical relational model and can be used as a
--       migration target or for analytics queries.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- EXTENSIONS
-- ────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()

-- ────────────────────────────────────────────────────────────
-- ENUMS
-- ────────────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM (
  'admin',
  'lawyer',
  'assistant',
  'client'
);

CREATE TYPE user_status AS ENUM (
  'active',
  'blocked'
);

CREATE TYPE case_status AS ENUM (
  'Open',
  'In Progress',
  'Pending',
  'Pending Lawyer Review',
  'Review',
  'Accepted by Assistant',
  'On Hold',
  'Closed'
);

CREATE TYPE case_priority AS ENUM (
  'Low',
  'Medium',
  'High'
);

CREATE TYPE appointment_status AS ENUM (
  'Awaiting Assistant Review',
  'Awaiting Lawyer Review',
  'Handling',
  'Confirmed',
  'Accepted by Assistant',
  'Pending',
  'Cancelled'
);

CREATE TYPE payment_status AS ENUM (
  'Pending',
  'Paid',
  'Refunded'
);

CREATE TYPE document_category AS ENUM (
  'Evidence',
  'Identity',
  'Contract',
  'Notice',
  'Other'
);

CREATE TYPE schedule_type AS ENUM (
  'Meeting',
  'Hearing',
  'Deadline',
  'Consultation',
  'Internal',
  'Other'
);

CREATE TYPE transaction_type AS ENUM (
  'payment',
  'refund',
  'adjustment'
);

-- ────────────────────────────────────────────────────────────
-- PRACTICE AREAS  (lookup / reference table)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS practice_areas (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  description TEXT
);

INSERT INTO practice_areas (name) VALUES
  ('Criminal Law'),
  ('Civil Law'),
  ('Family Law'),
  ('Corporate / Business Law'),
  ('Property / Real Estate Law'),
  ('Labor & Employment Law'),
  ('Intellectual Property (IP) Law'),
  ('Tax Law'),
  ('Immigration Law'),
  ('Cyber Law / IT Law'),
  ('Environmental Law'),
  ('Constitutional / Administrative Law')
ON CONFLICT (name) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- USERS  (admins, lawyers, assistants, clients)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id           TEXT        PRIMARY KEY,          -- e.g. "u-law-1a", "u-1234567890"
  name         TEXT        NOT NULL,
  email        TEXT        NOT NULL UNIQUE,
  password     TEXT        NOT NULL,             -- hashed in production
  role         user_role   NOT NULL DEFAULT 'client',
  bar_id       TEXT,                             -- lawyer bar council id
  specialization TEXT,                           -- lawyer practice specialization
  department   TEXT,                             -- practice area or desk name
  level        TEXT,                             -- job title / seniority
  image_url    TEXT,
  phone        TEXT,
  verified     BOOLEAN     NOT NULL DEFAULT FALSE,
  status       user_status NOT NULL DEFAULT 'active',
  -- For assistants: references the lawyer they work under
  lawyer_id    TEXT        REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_role       ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_lawyer_id  ON users(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_users_email      ON users(email);

-- ────────────────────────────────────────────────────────────
-- CASES
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cases (
  case_id          TEXT         PRIMARY KEY,          -- e.g. "C-1234567890"
  title            TEXT         NOT NULL,
  client_id        TEXT         REFERENCES users(id) ON DELETE SET NULL,
  client_name      TEXT,                              -- denormalized snapshot
  lawyer_id        TEXT         REFERENCES users(id) ON DELETE SET NULL,
  assistant_id     TEXT         REFERENCES users(id) ON DELETE SET NULL,
  case_type        TEXT,                              -- practice area
  status           case_status  NOT NULL DEFAULT 'Open',
  priority         case_priority NOT NULL DEFAULT 'Medium',
  hearing_date     DATE,
  description      TEXT,
  opposing_counsel TEXT,
  notes            TEXT,
  progress_note    TEXT,
  last_note        TEXT,
  important_dates  JSONB        NOT NULL DEFAULT '[]',  -- array of {label, date}
  last_updated     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cases_client_id   ON cases(client_id);
CREATE INDEX IF NOT EXISTS idx_cases_lawyer_id   ON cases(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_cases_assistant_id ON cases(assistant_id);
CREATE INDEX IF NOT EXISTS idx_cases_status      ON cases(status);

-- ────────────────────────────────────────────────────────────
-- APPOINTMENTS
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS appointments (
  id              TEXT               PRIMARY KEY,      -- e.g. "A-1234567890"
  client_id       TEXT               REFERENCES users(id) ON DELETE CASCADE,
  lawyer_id       TEXT               REFERENCES users(id) ON DELETE SET NULL,
  assistant_id    TEXT               REFERENCES users(id) ON DELETE SET NULL,
  appointment_date DATE              NOT NULL,
  appointment_time TIME              NOT NULL,
  case_type       TEXT,
  status          appointment_status NOT NULL DEFAULT 'Awaiting Assistant Review',
  payment         payment_status     NOT NULL DEFAULT 'Pending',
  notes           TEXT,
  created_at      TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_client_id    ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_lawyer_id    ON appointments(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_assistant_id ON appointments(assistant_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status       ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date         ON appointments(appointment_date);

-- ────────────────────────────────────────────────────────────
-- SCHEDULES  (lawyer calendar events)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS schedules (
  event_id     TEXT           PRIMARY KEY,    -- e.g. "E-1234567890"
  lawyer_id    TEXT           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        TEXT           NOT NULL,
  event_date   DATE           NOT NULL,
  event_time   TIME,
  type         schedule_type  NOT NULL DEFAULT 'Meeting',
  category     TEXT,
  created_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schedules_lawyer_id  ON schedules(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_schedules_event_date ON schedules(event_date);

-- ────────────────────────────────────────────────────────────
-- DOCUMENTS
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS documents (
  doc_id       TEXT              PRIMARY KEY,  -- e.g. "D-1234567890"
  case_id      TEXT              REFERENCES cases(case_id) ON DELETE CASCADE,
  owner_id     TEXT              REFERENCES users(id) ON DELETE SET NULL,  -- uploader
  client_id    TEXT              REFERENCES users(id) ON DELETE SET NULL,
  lawyer_id    TEXT              REFERENCES users(id) ON DELETE SET NULL,
  title        TEXT              NOT NULL,
  category     document_category NOT NULL DEFAULT 'Other',
  description  TEXT,
  upload_date  DATE              NOT NULL DEFAULT CURRENT_DATE,
  updated_on   DATE,
  file_path    TEXT,            -- server-side storage path (if file upload added)
  created_at   TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_case_id   ON documents(case_id);
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_lawyer_id ON documents(lawyer_id);

-- ────────────────────────────────────────────────────────────
-- NOTIFICATIONS  (inbox messages for any user role)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id           TEXT        PRIMARY KEY,        -- e.g. "N-1234567890"
  user_id      TEXT        REFERENCES users(id) ON DELETE CASCADE,
  lawyer_id    TEXT        REFERENCES users(id) ON DELETE CASCADE,  -- legacy alt key
  title        TEXT        NOT NULL,
  message      TEXT        NOT NULL,
  notif_date   DATE        NOT NULL DEFAULT CURRENT_DATE,
  is_read      BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partial index: fast lookup of unread notifications per user
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_unread
  ON notifications(user_id)
  WHERE is_read = FALSE;

CREATE INDEX IF NOT EXISTS idx_notifications_created_at
  ON notifications(created_at DESC);

-- ────────────────────────────────────────────────────────────
-- TRANSACTIONS  (billing / payment records)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS transactions (
  transaction_id TEXT             PRIMARY KEY,  -- e.g. "T-1234567890"
  client_id      TEXT             REFERENCES users(id) ON DELETE SET NULL,
  case_id        TEXT             REFERENCES cases(case_id) ON DELETE SET NULL,
  amount         NUMERIC(12, 2)   NOT NULL CHECK (amount >= 0),
  currency       CHAR(3)          NOT NULL DEFAULT 'BDT',
  type           transaction_type NOT NULL DEFAULT 'payment',
  status         payment_status   NOT NULL DEFAULT 'Pending',
  note           TEXT,
  created_at     TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_client_id ON transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_transactions_case_id   ON transactions(case_id);

-- ────────────────────────────────────────────────────────────
-- AUDIT LOG  (optional – track all write operations)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_log (
  log_id      BIGSERIAL   PRIMARY KEY,
  actor_id    TEXT        REFERENCES users(id) ON DELETE SET NULL,
  action      TEXT        NOT NULL,            -- e.g. "CREATE_CASE", "CANCEL_APPOINTMENT"
  entity_type TEXT        NOT NULL,            -- e.g. "cases", "appointments"
  entity_id   TEXT,                            -- the affected record id
  payload     JSONB,                           -- before / after snapshot
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_actor_id    ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_type ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at  ON audit_log(created_at DESC);

-- ────────────────────────────────────────────────────────────
-- UPDATED_AT TRIGGER  (auto-maintain updated_at columns)
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ────────────────────────────────────────────────────────────
-- VIEWS  (convenience read views)
-- ────────────────────────────────────────────────────────────

-- All open/active cases with staff names resolved
CREATE OR REPLACE VIEW v_active_cases AS
SELECT
  c.case_id,
  c.title,
  c.status,
  c.priority,
  c.case_type,
  c.hearing_date,
  c.last_updated,
  cl.name   AS client_name,
  cl.email  AS client_email,
  lw.name   AS lawyer_name,
  lw.email  AS lawyer_email,
  ast.name  AS assistant_name
FROM cases c
LEFT JOIN users cl  ON cl.id  = c.client_id
LEFT JOIN users lw  ON lw.id  = c.lawyer_id
LEFT JOIN users ast ON ast.id = c.assistant_id
WHERE c.status <> 'Closed';

-- Pending appointment requests for assistant / lawyer dashboards
CREATE OR REPLACE VIEW v_pending_appointments AS
SELECT
  a.id            AS appointment_id,
  a.appointment_date,
  a.appointment_time,
  a.case_type,
  a.status,
  a.payment,
  cl.name         AS client_name,
  cl.email        AS client_email,
  lw.name         AS lawyer_name,
  ast.name        AS assistant_name
FROM appointments a
LEFT JOIN users cl  ON cl.id  = a.client_id
LEFT JOIN users lw  ON lw.id  = a.lawyer_id
LEFT JOIN users ast ON ast.id = a.assistant_id
WHERE a.status IN (
  'Awaiting Assistant Review',
  'Awaiting Lawyer Review',
  'Handling',
  'Pending'
);

-- Unread notifications count per user
CREATE OR REPLACE VIEW v_unread_notification_counts AS
SELECT
  user_id,
  COUNT(*) AS unread_count
FROM notifications
WHERE is_read = FALSE
  AND user_id IS NOT NULL
GROUP BY user_id;

-- ────────────────────────────────────────────────────────────
-- SYSTEM_STATE  (current live JSONB store used by the app)
-- This single-row table holds the entire application state
-- as a JSONB object while the app runs on the JSONB model.
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS system_state (
  id    TEXT  PRIMARY KEY,        -- always 'latest'
  data  JSONB NOT NULL            -- { users, cases, appointments,
                                  --   schedules, documents,
                                  --   notifications, transactions }
);

-- Seed an empty state row so /api/load never 404s
INSERT INTO system_state (id, data)
VALUES (
  'latest',
  '{
    "users":         [],
    "cases":         [],
    "appointments":  [],
    "schedules":     [],
    "documents":     [],
    "notifications": [],
    "transactions":  []
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Quick credential setup/reset (run manually when needed)
-- Creates the user if missing; otherwise updates password.
INSERT INTO users (id, name, email, password, role, verified, status)
VALUES ('u-asif', 'Asif', 'asif@gmail.com', 'asif123', 'client', TRUE, 'active')
ON CONFLICT (email) DO UPDATE
SET
  password = EXCLUDED.password,
  updated_at = NOW();
