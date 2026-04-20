require("dotenv").config();
const path = require("path");
const express = require("express");
const { checkDatabase, getSqlClient, setupDatabase } = require("./db");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const rootDir = __dirname;

app.use(express.json());
app.use(express.static(rootDir));

// Initialize DB on start
setupDatabase().then(() => console.log("Database schema verified.")).catch(e => console.error("DB Init Error:", e));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, runtime: "node", service: "sasf-law-firm", timestamp: new Date().toISOString() });
});

app.get("/api/db-check", async (_req, res) => {
  try {
    const result = await checkDatabase();
    res.json({ ok: true, provider: "neon", database: result.database_name, serverTime: result.server_time });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get("/api/load", async (_req, res) => {
  try {
    const sql = getSqlClient();
    const [row] = await sql`SELECT data FROM system_state WHERE id = 'latest'`;
    res.json(row ? row.data : null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/save", async (req, res) => {
  try {
    const sql = getSqlClient();
    const data = JSON.stringify(req.body);
    await sql`
      INSERT INTO system_state (id, data) 
      VALUES ('latest', ${data})
      ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
    `;
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/assistant", (_req, res) => {
  res.sendFile(path.join(rootDir, "assistant-gate.html"));
});

app.get("/admin", (_req, res) => {
  res.sendFile(path.join(rootDir, "admin-gate.html"));
});

app.use((_req, res) => {
  res.sendFile(path.join(rootDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`SASF Law Firm server running at http://localhost:${PORT}`);
});
