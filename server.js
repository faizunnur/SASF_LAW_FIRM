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

app.get("/", (_req, res) => {
  res.sendFile(path.join(rootDir, "index.html"));
});

app.get("/login", (_req, res) => {
  res.sendFile(path.join(rootDir, "login.html"));
});

app.get("/register", (_req, res) => {
  res.sendFile(path.join(rootDir, "register.html"));
});

app.get("/lawyer", (_req, res) => {
  res.sendFile(path.join(rootDir, "lawyer.html"));
});

app.get("/assistant", (_req, res) => {
  res.sendFile(path.join(rootDir, "assistant-gate.html"));
});

app.get("/assistant/dashboard", (_req, res) => {
  res.sendFile(path.join(rootDir, "assistant.html"));
});

app.get("/admin", (_req, res) => {
  res.sendFile(path.join(rootDir, "admin-gate.html"));
});

// Admin module routes — all serve index.html, JS handles which module to show
app.get("/admin/overview", (_req, res) => res.sendFile(path.join(rootDir, "index.html")));
app.get("/admin/profile", (_req, res) => res.sendFile(path.join(rootDir, "index.html")));
app.get("/admin/inbox", (_req, res) => res.sendFile(path.join(rootDir, "index.html")));
app.get("/admin/user-management", (_req, res) => res.sendFile(path.join(rootDir, "index.html")));
app.get("/admin/report-generation", (_req, res) => res.sendFile(path.join(rootDir, "index.html")));
app.get("/admin-dashboard", (_req, res) => res.sendFile(path.join(rootDir, "index.html")));

// Client module routes
app.get("/client/profile", (_req, res) => res.sendFile(path.join(rootDir, "index.html")));
app.get("/client/inbox", (_req, res) => res.sendFile(path.join(rootDir, "index.html")));
app.get("/client/book-appointment", (_req, res) => res.sendFile(path.join(rootDir, "index.html")));
app.get("/client/case-status", (_req, res) => res.sendFile(path.join(rootDir, "index.html")));

app.use((_req, res) => {
  res.sendFile(path.join(rootDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`SASF Law Firm server running at http://localhost:${PORT}`);
});
