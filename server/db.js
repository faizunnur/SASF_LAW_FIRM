const { neon } = require("@neondatabase/serverless");

function getSqlClient() {
  const { DATABASE_URL } = process.env;
  if (!DATABASE_URL) throw new Error("DATABASE_URL is not set in .env");
  return neon(DATABASE_URL);
}

async function checkDatabase() {
  const sql = getSqlClient();
  const [result] = await sql`
    SELECT current_database() AS database_name, current_schema() AS schema_name, now() AS server_time
  `;
  return result;
}

async function setupDatabase() {
  const sql = getSqlClient();

  // Schema version tracking — runs migration once, never again
  await sql`CREATE TABLE IF NOT EXISTS schema_version (version INT PRIMARY KEY)`;
  const [ver] = await sql`SELECT version FROM schema_version ORDER BY version DESC LIMIT 1`;
  const currentVersion = ver ? Number(ver.version) : 0;

  if (currentVersion < 2) {
    console.log("Running database migration to v2 (normalized tables, no system_state)...");

    // Drop everything including legacy system_state
    await sql`DROP TABLE IF EXISTS audit_log CASCADE`;
    await sql`DROP TABLE IF EXISTS transactions CASCADE`;
    await sql`DROP TABLE IF EXISTS documents CASCADE`;
    await sql`DROP TABLE IF EXISTS schedules CASCADE`;
    await sql`DROP TABLE IF EXISTS notifications CASCADE`;
    await sql`DROP TABLE IF EXISTS appointments CASCADE`;
    await sql`DROP TABLE IF EXISTS cases CASCADE`;
    await sql`DROP TABLE IF EXISTS users CASCADE`;
    await sql`DROP TABLE IF EXISTS system_state CASCADE`;

    await sql`
      CREATE TABLE users (
        id          TEXT PRIMARY KEY,
        name        TEXT NOT NULL DEFAULT '',
        email       TEXT NOT NULL DEFAULT '',
        password    TEXT NOT NULL DEFAULT '',
        role        TEXT NOT NULL DEFAULT 'client',
        phone       TEXT NOT NULL DEFAULT '',
        department  TEXT NOT NULL DEFAULT '',
        level       TEXT NOT NULL DEFAULT '',
        image_url   TEXT NOT NULL DEFAULT '',
        verified    BOOLEAN NOT NULL DEFAULT FALSE,
        status      TEXT NOT NULL DEFAULT 'active',
        lawyer_id   TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE cases (
        case_id          TEXT PRIMARY KEY,
        title            TEXT NOT NULL DEFAULT '',
        client_id        TEXT,
        client_name      TEXT NOT NULL DEFAULT '',
        lawyer_id        TEXT,
        assistant_id     TEXT,
        case_type        TEXT NOT NULL DEFAULT '',
        status           TEXT NOT NULL DEFAULT 'Open',
        priority         TEXT NOT NULL DEFAULT 'Medium',
        hearing_date     TEXT NOT NULL DEFAULT '',
        description      TEXT NOT NULL DEFAULT '',
        notes            TEXT NOT NULL DEFAULT '',
        progress_note    TEXT NOT NULL DEFAULT '',
        last_note        TEXT NOT NULL DEFAULT '',
        opposing_counsel TEXT NOT NULL DEFAULT '',
        important_dates  JSONB NOT NULL DEFAULT '[]',
        last_updated     TEXT NOT NULL DEFAULT '',
        created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE appointments (
        id           TEXT PRIMARY KEY,
        client_id    TEXT,
        lawyer_id    TEXT,
        assistant_id TEXT,
        appt_date    TEXT NOT NULL DEFAULT '',
        appt_time    TEXT NOT NULL DEFAULT '',
        case_type    TEXT NOT NULL DEFAULT '',
        status       TEXT NOT NULL DEFAULT 'Pending',
        payment      TEXT NOT NULL DEFAULT 'Pending',
        notes        TEXT NOT NULL DEFAULT '',
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE notifications (
        id          TEXT PRIMARY KEY,
        user_id     TEXT,
        lawyer_id   TEXT,
        title       TEXT NOT NULL DEFAULT '',
        message     TEXT NOT NULL DEFAULT '',
        notif_date  TEXT NOT NULL DEFAULT '',
        is_read     BOOLEAN NOT NULL DEFAULT FALSE,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE schedules (
        event_id   TEXT PRIMARY KEY,
        lawyer_id  TEXT,
        title      TEXT NOT NULL DEFAULT '',
        event_date TEXT NOT NULL DEFAULT '',
        event_time TEXT NOT NULL DEFAULT '',
        type       TEXT NOT NULL DEFAULT 'Meeting',
        category   TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE documents (
        doc_id      TEXT PRIMARY KEY,
        case_id     TEXT,
        owner_id    TEXT,
        client_id   TEXT,
        lawyer_id   TEXT,
        title       TEXT NOT NULL DEFAULT '',
        category    TEXT NOT NULL DEFAULT 'Other',
        description TEXT NOT NULL DEFAULT '',
        updated_on  TEXT NOT NULL DEFAULT '',
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE transactions (
        transaction_id TEXT PRIMARY KEY,
        client_id      TEXT,
        client_name    TEXT NOT NULL DEFAULT '',
        amount         NUMERIC(12,2) NOT NULL DEFAULT 0,
        status         TEXT NOT NULL DEFAULT 'Pending',
        tx_date        TEXT NOT NULL DEFAULT '',
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`INSERT INTO schema_version VALUES (2) ON CONFLICT (version) DO NOTHING`;
    console.log("Migration to v2 complete.");
  }
}

module.exports = { checkDatabase, getSqlClient, setupDatabase };
