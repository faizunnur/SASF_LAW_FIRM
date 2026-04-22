require("dotenv").config();
const path = require("path");
const express = require("express");
const { checkDatabase, getSqlClient, setupDatabase } = require("./db");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const rootDir = path.join(__dirname, "..");
const clientDir = path.join(rootDir, "client");

app.use(express.json());
app.use(express.static("client"));
app.use("/uploads", express.static("server/uploads"));
app.use("/assets", express.static("client/assets"));
// Serve shared assets and role-specific assets as static roots
app.use(express.static(path.join(clientDir, "shared")));
app.use(express.static(path.join(clientDir, "admin")));
app.use(express.static(path.join(clientDir, "assistant")));
app.use(express.static(path.join(clientDir, "lawyer")));
app.use(express.static(path.join(clientDir, "client")));

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

const DEFAULT_LAWYERS = [
  { id: "u-law-1a", name: "Adv. Rafiqul Islam", role: "lawyer", department: "Criminal Law" },
  { id: "u-law-1b", name: "Adv. Sumaiya Akter", role: "lawyer", department: "Criminal Law" },
  { id: "u-law-2a", name: "Adv. Tariqul Hasan", role: "lawyer", department: "Civil Law" },
  { id: "u-law-2b", name: "Adv. Fatema Zohra", role: "lawyer", department: "Civil Law" },
  { id: "u-law-3a", name: "Adv. Nusrat Jahan", role: "lawyer", department: "Family Law" },
  { id: "u-law-3b", name: "Adv. Ariful Islam", role: "lawyer", department: "Family Law" },
  { id: "u-law-4a", name: "Adv. Mahbub Alam", role: "lawyer", department: "Corporate / Business Law" },
  { id: "u-law-4b", name: "Adv. Farhana Yasmin", role: "lawyer", department: "Corporate / Business Law" },
  { id: "u-law-5a", name: "Adv. Zahirul Haque", role: "lawyer", department: "Property / Real Estate Law" },
  { id: "u-law-5b", name: "Adv. Rokeya Begum", role: "lawyer", department: "Property / Real Estate Law" },
  { id: "u-law-6a", name: "Adv. Nazmul Huda", role: "lawyer", department: "Labor & Employment Law" },
  { id: "u-law-6b", name: "Adv. Sharmin Akter", role: "lawyer", department: "Labor & Employment Law" },
  { id: "u-law-7a", name: "Adv. Kamrul Hasan", role: "lawyer", department: "Intellectual Property (IP) Law" },
  { id: "u-law-7b", name: "Adv. Tasnim Sultana", role: "lawyer", department: "Intellectual Property (IP) Law" },
  { id: "u-law-8a", name: "Adv. Azizul Hakim", role: "lawyer", department: "Tax Law" },
  { id: "u-law-8b", name: "Adv. Sabina Yasmin", role: "lawyer", department: "Tax Law" },
  { id: "u-law-9a", name: "Adv. Mokhlesur Rahman", role: "lawyer", department: "Immigration Law" },
  { id: "u-law-9b", name: "Adv. Tanjina Akhter", role: "lawyer", department: "Immigration Law" },
  { id: "u-law-10a", name: "Adv. Shafiul Alam", role: "lawyer", department: "Cyber Law / IT Law" },
  { id: "u-law-10b", name: "Adv. Rezowana Islam", role: "lawyer", department: "Cyber Law / IT Law" },
  { id: "u-law-11a", name: "Adv. Anisur Rahman", role: "lawyer", department: "Environmental Law" },
  { id: "u-law-11b", name: "Adv. Meherun Nesa", role: "lawyer", department: "Environmental Law" },
  { id: "u-law-12a", name: "Adv. Golam Mostafa", role: "lawyer", department: "Constitutional / Administrative Law" },
  { id: "u-law-12b", name: "Adv. Sayeda Khanom", role: "lawyer", department: "Constitutional / Administrative Law" }
];

app.get("/api/load", async (_req, res) => {
  let data = { users: [], cases: [], appointments: [], schedules: [], notifications: [] };
  try {
    const sql = getSqlClient();
    const [row] = await sql`SELECT data FROM system_state WHERE id = 'latest'`;
    if (row) data = row.data;
  } catch (error) {
    console.warn("Database error, using fail-safe seed.");
  }
  
  // Inject default lawyers if they aren't in the data
  DEFAULT_LAWYERS.forEach(l => {
    if (!data.users.find(u => u.id === l.id)) {
      data.users.push({ ...l, password: "123", phone: "01700000000", verified: true, status: "active" });
    }
  });
  
  res.json(data);
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

// Role-specific filtered APIs
app.get("/api/cases", async (req, res) => {
  try {
    const lawyerId = req.query.lawyerId;
    const sql = getSqlClient();
    const [row] = await sql`SELECT data FROM system_state WHERE id = 'latest'`;
    if (!row) return res.json([]);
    const filtered = row.data.cases.filter(c => c.lawyerId === lawyerId);
    res.json(filtered);
  } catch (e) { res.status(500).json([]); }
});

app.get("/api/documents", async (req, res) => {
  try {
    const lawyerId = req.query.lawyerId;
    const sql = getSqlClient();
    const [row] = await sql`SELECT data FROM system_state WHERE id = 'latest'`;
    if (!row) return res.json([]);
    const filtered = row.data.documents.filter(d => d.lawyerId === lawyerId || d.ownerId === lawyerId);
    res.json(filtered);
  } catch (e) { res.status(500).json([]); }
});

app.get("/api/schedule", async (req, res) => {
  try {
    const lawyerId = req.query.lawyerId;
    const sql = getSqlClient();
    const [row] = await sql`SELECT data FROM system_state WHERE id = 'latest'`;
    if (!row) return res.json([]);
    const filtered = row.data.schedules.filter(s => s.lawyerId === lawyerId);
    res.json(filtered);
  } catch (e) { res.status(500).json([]); }
});

app.get("/api/notifications", async (req, res) => {
  try {
    const lawyerId = req.query.lawyerId;
    const sql = getSqlClient();
    const [row] = await sql`SELECT data FROM system_state WHERE id = 'latest'`;
    if (!row) return res.json([]);
    const filtered = row.data.notifications.filter(n => n.userId === lawyerId || n.lawyerId === lawyerId);
    res.json(filtered);
  } catch (e) { res.status(500).json([]); }
});

app.get("/api/appointments", async (req, res) => {
  try {
    const lawyerId = req.query.lawyerId;
    const sql = getSqlClient();
    const [row] = await sql`SELECT data FROM system_state WHERE id = 'latest'`;
    if (!row) return res.json([]);
    const filtered = row.data.appointments.filter(a => a.lawyerId === lawyerId);
    res.json(filtered);
  } catch (e) { res.status(500).json([]); }
});

app.get("/api/lawyer/profile", async (req, res) => {
  try {
    const lawyerId = req.query.lawyerId;
    const sql = getSqlClient();
    const [row] = await sql`SELECT data FROM system_state WHERE id = 'latest'`;
    if (!row) return res.json(null);
    const user = row.data.users.find(u => u.id === lawyerId || u.lawyerId === lawyerId);
    res.json(user ? { ...user, lawyerId: user.id } : null);
  } catch (e) { res.status(500).json(null); }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const sql = getSqlClient();
  const [row] = await sql`SELECT data FROM system_state WHERE id = 'latest'`;
  if (!row) return res.status(401).json({ message: "Invalid credentials" });
  const user = row.data.users.find(u => u.email === email && u.password === password);
  if (user) {
    res.json({ token: "demo-token", lawyerId: user.id, name: user.name });
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(clientDir, "client", "dashboard.html"));
});

app.get("/login", (_req, res) => {
  res.sendFile(path.join(clientDir, "shared", "login.html"));
});

app.get("/register", (_req, res) => {
  res.sendFile(path.join(clientDir, "shared", "register.html"));
});

app.get("/lawyer", (_req, res) => {
  res.sendFile(path.join(clientDir, "lawyer", "lawyer.html"));
});

app.get("/assistant", (_req, res) => {
  res.sendFile(path.join(clientDir, "assistant", "assistant-gate.html"));
});

app.get("/assistant/dashboard", (_req, res) => {
  res.sendFile(path.join(clientDir, "assistant", "assistant.html"));
});

app.get("/admin", (_req, res) => {
  res.sendFile(path.join(clientDir, "admin", "admin-gate.html"));
});

// Admin module routes
app.get("/admin/overview", (_req, res) => res.sendFile(path.join(clientDir, "admin", "dashboard.html")));
app.get("/admin/profile", (_req, res) => res.sendFile(path.join(clientDir, "admin", "dashboard.html")));
app.get("/admin/inbox", (_req, res) => res.sendFile(path.join(clientDir, "admin", "dashboard.html")));
app.get("/admin/user-management", (_req, res) => res.sendFile(path.join(clientDir, "admin", "dashboard.html")));
app.get("/admin/report-generation", (_req, res) => res.sendFile(path.join(clientDir, "admin", "dashboard.html")));
app.get("/admin-dashboard", (_req, res) => res.sendFile(path.join(clientDir, "admin", "dashboard.html")));

// Client module routes
app.get("/client/profile", (_req, res) => res.sendFile(path.join(clientDir, "client", "dashboard.html")));
app.get("/client/inbox", (_req, res) => res.sendFile(path.join(clientDir, "client", "dashboard.html")));
app.get("/client/book-appointment", (_req, res) => res.sendFile(path.join(clientDir, "client", "dashboard.html")));
app.get("/client/case-status", (_req, res) => res.sendFile(path.join(clientDir, "client", "dashboard.html")));

app.use((_req, res) => {
  res.sendFile(path.join(clientDir, "client", "dashboard.html"));
});



app.listen(PORT, () => {
  console.log(`SASF Law Firm server running at http://localhost:${PORT}`);
});
