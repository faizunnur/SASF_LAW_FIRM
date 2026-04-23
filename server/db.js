const { neon } = require("@neondatabase/serverless");

function getSqlClient() {
  const { DATABASE_URL } = process.env;
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is not set in .env");
  }
  return neon(DATABASE_URL);
}

async function checkDatabase() {
  const sql = getSqlClient();
  const [result] = await sql`
    SELECT
      current_database() AS database_name,
      current_schema()   AS schema_name,
      now()              AS server_time
  `;
  return result;
}

async function setupDatabase() {
  const sql = getSqlClient();

  // ── 1. Core JSONB store (used by the React app for all reads/writes) ──────
  await sql`
    CREATE TABLE IF NOT EXISTS system_state (
      id   TEXT  PRIMARY KEY,
      data JSONB NOT NULL
    )
  `;

  // Seed an empty initial state so /api/load never fails on a blank database
  await sql`
    INSERT INTO system_state (id, data)
    VALUES (
      'latest',
      '{"users":[],"cases":[],"appointments":[],"schedules":[],"documents":[],"notifications":[],"transactions":[]}'::jsonb
    )
    ON CONFLICT (id) DO NOTHING
  `;

  // ── 2. Normalized users table ─────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT        PRIMARY KEY,
      name          TEXT        NOT NULL,
      email         TEXT        NOT NULL UNIQUE,
      password_hash TEXT        NOT NULL,
      role          TEXT        NOT NULL DEFAULT 'client'
                    CHECK (role IN ('admin','lawyer','assistant','client')),
      phone         TEXT,
      department    TEXT,
      level         TEXT,
      image_url     TEXT,
      verified      BOOLEAN     NOT NULL DEFAULT FALSE,
      status        TEXT        NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','blocked')),
      lawyer_id     TEXT        REFERENCES users(id) ON DELETE SET NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // ── 3. Cases ──────────────────────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS cases (
      case_id        TEXT        PRIMARY KEY,
      title          TEXT        NOT NULL,
      client_id      TEXT        REFERENCES users(id) ON DELETE SET NULL,
      client_name    TEXT,
      lawyer_id      TEXT        REFERENCES users(id) ON DELETE SET NULL,
      assistant_id   TEXT        REFERENCES users(id) ON DELETE SET NULL,
      case_type      TEXT,
      status         TEXT        NOT NULL DEFAULT 'Open',
      priority       TEXT        NOT NULL DEFAULT 'Medium',
      hearing_date   DATE,
      description    TEXT,
      notes          TEXT,
      progress_note  TEXT,
      last_note      TEXT,
      important_dates JSONB      NOT NULL DEFAULT '[]',
      last_updated   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // ── 4. Appointments ───────────────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS appointments (
      id               TEXT        PRIMARY KEY,
      client_id        TEXT        REFERENCES users(id) ON DELETE CASCADE,
      lawyer_id        TEXT        REFERENCES users(id) ON DELETE SET NULL,
      assistant_id     TEXT        REFERENCES users(id) ON DELETE SET NULL,
      appointment_date DATE        NOT NULL,
      appointment_time TIME        NOT NULL,
      case_type        TEXT,
      status           TEXT        NOT NULL DEFAULT 'Awaiting Assistant Review',
      payment          TEXT        NOT NULL DEFAULT 'Pending',
      notes            TEXT,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // ── 5. Notifications (inbox messages for any user role) ───────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS notifications (
      id          TEXT        PRIMARY KEY,
      user_id     TEXT        REFERENCES users(id) ON DELETE CASCADE,
      lawyer_id   TEXT        REFERENCES users(id) ON DELETE CASCADE,
      title       TEXT        NOT NULL,
      message     TEXT        NOT NULL,
      notif_date  DATE        NOT NULL DEFAULT CURRENT_DATE,
      is_read     BOOLEAN     NOT NULL DEFAULT FALSE,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // ── 6. Schedules (lawyer calendar events) ────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS schedules (
      event_id    TEXT        PRIMARY KEY,
      lawyer_id   TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title       TEXT        NOT NULL,
      event_date  DATE        NOT NULL,
      event_time  TIME,
      type        TEXT        NOT NULL DEFAULT 'Meeting',
      category    TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // ── 7. Documents ──────────────────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS documents (
      doc_id      TEXT        PRIMARY KEY,
      case_id     TEXT        REFERENCES cases(case_id) ON DELETE CASCADE,
      owner_id    TEXT        REFERENCES users(id) ON DELETE SET NULL,
      client_id   TEXT        REFERENCES users(id) ON DELETE SET NULL,
      lawyer_id   TEXT        REFERENCES users(id) ON DELETE SET NULL,
      title       TEXT        NOT NULL,
      category    TEXT        NOT NULL DEFAULT 'Other',
      description TEXT,
      upload_date DATE        NOT NULL DEFAULT CURRENT_DATE,
      updated_on  DATE,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // ── 8. Transactions (billing / payment records) ───────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS transactions (
      transaction_id TEXT           PRIMARY KEY,
      client_id      TEXT           REFERENCES users(id) ON DELETE SET NULL,
      case_id        TEXT           REFERENCES cases(case_id) ON DELETE SET NULL,
      amount         NUMERIC(12,2)  NOT NULL CHECK (amount >= 0),
      currency       CHAR(3)        NOT NULL DEFAULT 'BDT',
      type           TEXT           NOT NULL DEFAULT 'payment',
      status         TEXT           NOT NULL DEFAULT 'Pending',
      note           TEXT,
      created_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW()
    )
  `;

  // ── 9. Audit log (optional; tracks all write operations) ─────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS audit_log (
      log_id      BIGSERIAL   PRIMARY KEY,
      actor_id    TEXT        REFERENCES users(id) ON DELETE SET NULL,
      action      TEXT        NOT NULL,
      entity_type TEXT        NOT NULL,
      entity_id   TEXT,
      payload     JSONB,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

module.exports = {
  checkDatabase,
  getSqlClient,
  setupDatabase
};
