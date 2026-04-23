const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const express = require("express");
const { checkDatabase, getSqlClient, setupDatabase } = require("./db");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const rootDir = path.join(__dirname, "..");
const clientDir = path.join(rootDir, "client");

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Initialize DB on start
setupDatabase().then(() => console.log("Database schema verified.")).catch(e => console.error("DB Init Error:", e));

async function getLatestState() {
  const sql = getSqlClient();
  const [row] = await sql`SELECT data FROM system_state WHERE id = 'latest'`;
  return row?.data || { users: [], cases: [], appointments: [], schedules: [], documents: [], notifications: [], transactions: [] };
}

async function saveLatestState(data) {
  const sql = getSqlClient();
  await sql`
    INSERT INTO system_state (id, data)
    VALUES ('latest', ${JSON.stringify(data)})
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
  `;
}

function ensureCollections(data) {
  return {
    users: Array.isArray(data.users) ? data.users : [],
    cases: Array.isArray(data.cases) ? data.cases : [],
    appointments: Array.isArray(data.appointments) ? data.appointments : [],
    schedules: Array.isArray(data.schedules) ? data.schedules : [],
    documents: Array.isArray(data.documents) ? data.documents : [],
    notifications: Array.isArray(data.notifications) ? data.notifications : [],
    transactions: Array.isArray(data.transactions) ? data.transactions : []
  };
}

function attachDefaultStaff(data) {
  [...DEFAULT_LAWYERS, ...DEFAULT_ASSISTANTS].forEach((member) => {
    const existing = data.users.find((u) => u.id === member.id);
    if (!existing) {
      data.users.push({
        ...member,
        password: "123",
        phone: "01700000000",
        verified: true,
        status: "active"
      });
      return;
    }

    existing.role = existing.role || member.role;
    existing.department = existing.department || member.department;
    existing.level = existing.level || member.level;
    existing.image_url = existing.image_url || member.image_url;
    existing.email = existing.email || member.email;
    existing.password = existing.password || "123";
    existing.phone = existing.phone || "01700000000";
    if (typeof existing.verified !== "boolean") existing.verified = true;
    existing.status = existing.status || "active";
  });
  return data;
}

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
  { id: "u-law-1a", name: "Adv. Rafiqul Islam", role: "lawyer", department: "Criminal Law", level: "Senior Partner", email: "rafiqul@sasf.com", image_url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=900&q=80" },
  { id: "u-law-1b", name: "Adv. Sumaiya Akter", role: "lawyer", department: "Criminal Law", level: "Partner", email: "sumaiya@sasf.com", image_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=900&q=80" },
  { id: "u-law-2a", name: "Adv. Tariqul Hasan", role: "lawyer", department: "Civil Law", level: "Litigation Lead", email: "tariqul@sasf.com", image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=80" },
  { id: "u-law-2b", name: "Adv. Fatema Zohra", role: "lawyer", department: "Civil Law", level: "Senior Associate", email: "fatema@sasf.com", image_url: "https://images.unsplash.com/photo-1542206395-9feb3edaa68d?auto=format&fit=crop&w=900&q=80" },
  { id: "u-law-3a", name: "Adv. Nusrat Jahan", role: "lawyer", department: "Family Law", level: "Senior Associate", email: "nusrat@sasf.com", image_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=900&q=80" },
  { id: "u-law-3b", name: "Adv. Ariful Islam", role: "lawyer", department: "Family Law", level: "Associate", email: "ariful@sasf.com", image_url: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=900&q=80" },
  { id: "u-law-4a", name: "Adv. Mahbub Alam", role: "lawyer", department: "Corporate / Business Law", level: "Partner", email: "mahbub@sasf.com", image_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80" },
  { id: "u-law-4b", name: "Adv. Farhana Yasmin", role: "lawyer", department: "Corporate / Business Law", level: "Corporate Counsel", email: "farhana@sasf.com", image_url: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80" },
  { id: "u-law-5a", name: "Adv. Zahirul Haque", role: "lawyer", department: "Property / Real Estate Law", level: "Senior Partner", email: "zahirul@sasf.com", image_url: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=900&q=80" },
  { id: "u-law-5b", name: "Adv. Rokeya Begum", role: "lawyer", department: "Property / Real Estate Law", level: "Associate", email: "rokeya@sasf.com", image_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=80" },
  { id: "u-law-6a", name: "Adv. Nazmul Huda", role: "lawyer", department: "Labor & Employment Law", level: "Litigation Lead", email: "nazmul@sasf.com", image_url: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=900&q=80" },
  { id: "u-law-6b", name: "Adv. Sharmin Akter", role: "lawyer", department: "Labor & Employment Law", level: "Senior Associate", email: "sharmin@sasf.com", image_url: "https://images.unsplash.com/photo-1541823709867-1b206113eafd?auto=format&fit=crop&w=900&q=80" },
  { id: "u-law-7a", name: "Adv. Kamrul Hasan", role: "lawyer", department: "Intellectual Property (IP) Law", level: "Partner", email: "kamrul@sasf.com", image_url: "https://images.unsplash.com/photo-1615109398623-88346a601842?auto=format&fit=crop&w=900&q=80" },
  { id: "u-law-7b", name: "Adv. Tasnim Sultana", role: "lawyer", department: "Intellectual Property (IP) Law", level: "Associate", email: "tasnim@sasf.com", image_url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80" },
  { id: "u-law-8a", name: "Adv. Azizul Hakim", role: "lawyer", department: "Tax Law", level: "Tax Counsel", email: "azizul@sasf.com", image_url: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=900&q=80" },
  { id: "u-law-8b", name: "Adv. Sabina Yasmin", role: "lawyer", department: "Tax Law", level: "Associate", email: "sabina@sasf.com", image_url: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=900&q=80" },
  { id: "u-law-9a", name: "Adv. Mokhlesur Rahman", role: "lawyer", department: "Immigration Law", level: "Partner", email: "mokhlesur@sasf.com", image_url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=900&q=80" },
  { id: "u-law-9b", name: "Adv. Tanjina Akhter", role: "lawyer", department: "Immigration Law", level: "Senior Associate", email: "tanjina@sasf.com", image_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80" },
  { id: "u-law-10a", name: "Adv. Shafiul Alam", role: "lawyer", department: "Cyber Law / IT Law", level: "Cyber Counsel", email: "shafiul@sasf.com", image_url: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=900&q=80" },
  { id: "u-law-10b", name: "Adv. Rezowana Islam", role: "lawyer", department: "Cyber Law / IT Law", level: "Associate", email: "rezowana@sasf.com", image_url: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=80" },
  { id: "u-law-11a", name: "Adv. Anisur Rahman", role: "lawyer", department: "Environmental Law", level: "Senior Partner", email: "anisur@sasf.com", image_url: "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?auto=format&fit=crop&w=900&q=80" },
  { id: "u-law-11b", name: "Adv. Meherun Nesa", role: "lawyer", department: "Environmental Law", level: "Counsel", email: "meherun@sasf.com", image_url: "https://images.unsplash.com/photo-1573497019236-61f323342eb7?auto=format&fit=crop&w=900&q=80" },
  { id: "u-law-12a", name: "Adv. Golam Mostafa", role: "lawyer", department: "Constitutional / Administrative Law", level: "Senior Partner", email: "golam@sasf.com", image_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80" },
  { id: "u-law-12b", name: "Adv. Sayeda Khanom", role: "lawyer", department: "Constitutional / Administrative Law", level: "Associate", email: "sayeda@sasf.com", image_url: "https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&w=900&q=80" }
];

const DEFAULT_ASSISTANTS = [
  { id: "u-ast-1", name: "Imran Hossain", role: "assistant", department: "Criminal Law Desk", level: "Senior Case Assistant", email: "imran@sasf.com", image_url: "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=900&q=80", lawyerId: "u-law-1a" },
  { id: "u-ast-2", name: "Maliha Noor", role: "assistant", department: "Civil Law Desk", level: "Documentation Assistant", email: "maliha@sasf.com", image_url: "https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&w=900&q=80", lawyerId: "u-law-2a" },
  { id: "u-ast-3", name: "Rafi Islam", role: "assistant", department: "Family Law Desk", level: "Case Assistant", email: "rafi@sasf.com", image_url: "https://images.unsplash.com/photo-1576558656222-ba66febe3dec?auto=format&fit=crop&w=900&q=80", lawyerId: "u-law-3a" },
  { id: "u-ast-4", name: "Nabila Ahmed", role: "assistant", department: "Corporate Law Desk", level: "Operations Assistant", email: "nabila@sasf.com", image_url: "https://images.unsplash.com/photo-1525879000488-bff3b1c387cf?auto=format&fit=crop&w=900&q=80", lawyerId: "u-law-4a" },
  { id: "u-ast-5", name: "Sabbir Rahman", role: "assistant", department: "Property Law Desk", level: "Senior Documentation Assistant", email: "sabbir@sasf.com", image_url: "https://images.unsplash.com/photo-1615109398623-88346a601842?auto=format&fit=crop&w=900&q=80", lawyerId: "u-law-5a" },
  { id: "u-ast-6", name: "Tasnuba Karim", role: "assistant", department: "Labor Law Desk", level: "Intake Assistant", email: "tasnuba@sasf.com", image_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80", lawyerId: "u-law-6a" },
  { id: "u-ast-7", name: "Nahid Hasan", role: "assistant", department: "IP Law Desk", level: "Case Assistant", email: "nahid@sasf.com", image_url: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=900&q=80", lawyerId: "u-law-7a" },
  { id: "u-ast-8", name: "Sanjida Akter", role: "assistant", department: "Tax Law Desk", level: "Compliance Assistant", email: "sanjida@sasf.com", image_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=80", lawyerId: "u-law-8a" },
  { id: "u-ast-9", name: "Jahidul Islam", role: "assistant", department: "Immigration Desk", level: "Case Assistant", email: "jahidul@sasf.com", image_url: "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?auto=format&fit=crop&w=900&q=80", lawyerId: "u-law-9a" },
  { id: "u-ast-10", name: "Muna Chowdhury", role: "assistant", department: "Cyber Law Desk", level: "Research Assistant", email: "muna@sasf.com", image_url: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=900&q=80", lawyerId: "u-law-10a" },
  { id: "u-ast-11", name: "Rayhan Kabir", role: "assistant", department: "Environmental Desk", level: "Documentation Assistant", email: "rayhan@sasf.com", image_url: "https://images.unsplash.com/photo-1509395176047-4a66953fd231?auto=format&fit=crop&w=900&q=80", lawyerId: "u-law-11a" },
  { id: "u-ast-12", name: "Samia Rahman", role: "assistant", department: "Constitutional Desk", level: "Executive Assistant", email: "samia@sasf.com", image_url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80", lawyerId: "u-law-12a" }
];

app.get("/api/load", async (_req, res) => {
  try {
    let data = ensureCollections(await getLatestState());
    data = attachDefaultStaff(data);
    await saveLatestState(data);
    res.json(data);
  } catch (error) {
    console.warn("Database error, using fail-safe seed.", error);
    res.json({ users: [], cases: [], appointments: [], schedules: [], documents: [], notifications: [], transactions: [] });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const data = ensureCollections(await getLatestState());
    const role = String(req.query.role || "").trim().toLowerCase();
    const users = role ? data.users.filter((u) => String(u.role || "").toLowerCase() === role) : data.users;
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    const data = ensureCollections(await getLatestState());
    const body = req.body || {};
    const id = body.id || `u-${Date.now()}`;
    if (data.users.some((u) => String(u.id) === String(id))) {
      return res.status(409).json({ message: "User id already exists." });
    }
    data.users.push({
      id,
      name: body.name || "New User",
      email: body.email || `${id}@sasf.com`,
      password: body.password || "123",
      role: body.role || "assistant",
      department: body.department || "Operations",
      level: body.level || "Associate",
      image_url: body.image_url || "",
      phone: body.phone || "01700000000",
      verified: typeof body.verified === "boolean" ? body.verified : true,
      status: body.status || "active",
      lawyerId: body.lawyerId || ""
    });
    await saveLatestState(data);
    res.json({ ok: true, id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put("/api/users/:id", async (req, res) => {
  try {
    const data = ensureCollections(await getLatestState());
    const target = data.users.find((u) => String(u.id) === String(req.params.id));
    if (!target) return res.status(404).json({ message: "User not found." });
    const payload = req.body || {};
    const allowed = ["name", "email", "password", "role", "department", "level", "image_url", "phone", "verified", "status", "lawyerId"];
    allowed.forEach((key) => {
      if (payload[key] !== undefined) target[key] = payload[key];
    });
    await saveLatestState(data);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  try {
    const data = ensureCollections(await getLatestState());
    const userId = String(req.params.id);
    const user = data.users.find((u) => String(u.id) === userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    data.users = data.users.filter((u) => String(u.id) !== userId);
    data.cases = data.cases.filter((c) => String(c.lawyerId || "") !== userId && String(c.assistantId || "") !== userId && String(c.clientId || "") !== userId);
    data.appointments = data.appointments.filter((a) => String(a.lawyerId || "") !== userId && String(a.assistantId || "") !== userId && String(a.clientId || "") !== userId);
    data.schedules = data.schedules.filter((s) => String(s.lawyerId || "") !== userId);
    data.documents = data.documents.filter((d) => String(d.lawyerId || "") !== userId && String(d.ownerId || "") !== userId && String(d.clientId || "") !== userId);
    data.notifications = data.notifications.filter((n) => String(n.userId || "") !== userId && String(n.lawyerId || "") !== userId);

    await saveLatestState(data);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/save", async (req, res) => {
  try {
    await saveLatestState(ensureCollections(req.body || {}));
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Role-specific filtered APIs
app.get("/api/cases", async (req, res) => {
  try {
    const lawyerId = req.query.lawyerId;
    const data = ensureCollections(await getLatestState());
    const filtered = data.cases.filter(c => c.lawyerId === lawyerId);
    res.json(filtered);
  } catch (e) { res.status(500).json([]); }
});

app.post("/api/cases", async (req, res) => {
  try {
    const data = ensureCollections(await getLatestState());
    const caseId = `C-${Date.now()}`;
    data.cases.unshift({
      caseId,
      lawyerId: req.body.lawyerId,
      title: req.body.title,
      clientName: req.body.clientName,
      status: req.body.status || "Open",
      priority: req.body.priority || "Medium",
      caseType: req.body.caseType || "General",
      lastUpdated: new Date().toISOString(),
      description: req.body.description || "No description provided.",
      opposingCounsel: req.body.opposingCounsel || "Not specified",
      importantDates: Array.isArray(req.body.importantDates) ? req.body.importantDates : [],
      lastNote: ""
    });
    data.notifications.unshift({
      id: `N-${Date.now()}`,
      userId: req.body.lawyerId,
      title: "Case Created",
      message: `Case ${caseId} was created successfully.`,
      date: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      isRead: false
    });
    await saveLatestState(data);
    res.json({ ok: true, caseId });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.put("/api/cases/status", async (req, res) => {
  try {
    const data = ensureCollections(await getLatestState());
    const c = data.cases.find(item => String(item.caseId) === String(req.body.caseId));
    if (!c) return res.status(404).json({ message: "Case not found." });
    c.status = req.body.newStatus;
    c.lastUpdated = new Date().toISOString();
    data.notifications.unshift({
      id: `N-${Date.now()}`,
      userId: c.lawyerId,
      title: "Case Status Updated",
      message: `Case ${c.caseId} status changed to ${req.body.newStatus}.`,
      date: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      isRead: false
    });
    await saveLatestState(data);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.put("/api/cases/update", async (req, res) => {
  try {
    const data = ensureCollections(await getLatestState());
    const c = data.cases.find(item => String(item.caseId) === String(req.body.caseId));
    if (!c) return res.status(404).json({ message: "Case not found." });
    if (req.body.updatedFields && typeof req.body.updatedFields === "object") {
      Object.assign(c, req.body.updatedFields);
    }
    if (typeof req.body.notes === "string" && req.body.notes.trim()) {
      c.lastNote = req.body.notes.trim();
    }
    c.lastUpdated = new Date().toISOString();
    data.notifications.unshift({
      id: `N-${Date.now()}`,
      userId: c.lawyerId,
      title: "Case Updated",
      message: `Case ${c.caseId} was updated with new notes.`,
      date: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      isRead: false
    });
    await saveLatestState(data);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.delete("/api/cases", async (req, res) => {
  try {
    const data = ensureCollections(await getLatestState());
    const caseId = req.query.caseId;
    const idx = data.cases.findIndex(c => String(c.caseId) === String(caseId));
    if (idx === -1) return res.status(404).json({ message: "Case not found." });
    const deleted = data.cases[idx];
    data.cases.splice(idx, 1);
    data.documents = data.documents.filter(d => String(d.caseId) !== String(caseId));
    await saveLatestState(data);
    res.json({ ok: true, caseId: deleted.caseId });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get("/api/documents", async (req, res) => {
  try {
    const lawyerId = req.query.lawyerId;
    const data = ensureCollections(await getLatestState());
    const filtered = data.documents.filter(d => d.lawyerId === lawyerId || d.ownerId === lawyerId);
    res.json(filtered);
  } catch (e) { res.status(500).json([]); }
});

app.post("/api/documents", async (req, res) => {
  try {
    const data = ensureCollections(await getLatestState());
    const docId = `D-${Date.now()}`;
    data.documents.unshift({
      docId,
      title: req.body.title,
      caseId: req.body.caseId,
      description: req.body.description,
      lawyerId: req.body.lawyerId,
      uploadDate: new Date().toISOString().slice(0, 10),
      fileType: "PDF"
    });
    await saveLatestState(data);
    res.json({ ok: true, docId });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.put("/api/documents", async (req, res) => {
  try {
    const data = ensureCollections(await getLatestState());
    const doc = data.documents.find(d => String(d.docId) === String(req.body.docId));
    if (!doc) return res.status(404).json({ message: "Document not found." });
    doc.title = req.body.title;
    doc.description = req.body.description;
    doc.caseId = req.body.caseId;
    await saveLatestState(data);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.delete("/api/documents", async (req, res) => {
  try {
    const data = ensureCollections(await getLatestState());
    const docId = req.query.docId;
    const idx = data.documents.findIndex(d => String(d.docId) === String(docId));
    if (idx === -1) return res.status(404).json({ message: "Document not found." });
    data.documents.splice(idx, 1);
    await saveLatestState(data);
    res.json({ ok: true, docId });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get("/api/schedule", async (req, res) => {
  try {
    const lawyerId = req.query.lawyerId;
    const data = ensureCollections(await getLatestState());
    const filtered = data.schedules.filter(s => s.lawyerId === lawyerId);
    res.json(filtered);
  } catch (e) { res.status(500).json([]); }
});

app.post("/api/schedule", async (req, res) => {
  try {
    const data = ensureCollections(await getLatestState());
    const eventId = `E-${Date.now()}`;
    data.schedules.unshift({
      eventId,
      lawyerId: req.body.lawyerId,
      title: req.body.title,
      date: req.body.date,
      time: req.body.time,
      type: req.body.type
    });
    await saveLatestState(data);
    res.json({ ok: true, eventId });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.put("/api/schedule", async (req, res) => {
  try {
    const data = ensureCollections(await getLatestState());
    const ev = data.schedules.find(s => String(s.eventId) === String(req.body.eventId));
    if (!ev) return res.status(404).json({ message: "Event not found." });
    ev.title = req.body.title;
    ev.date = req.body.date;
    ev.time = req.body.time;
    await saveLatestState(data);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get("/api/notifications", async (req, res) => {
  try {
    const lawyerId = req.query.lawyerId;
    const data = ensureCollections(await getLatestState());
    const filtered = data.notifications.filter(n => n.userId === lawyerId || n.lawyerId === lawyerId);
    res.json(filtered);
  } catch (e) { res.status(500).json([]); }
});

app.patch("/api/notifications/read", async (req, res) => {
  try {
    const data = ensureCollections(await getLatestState());
    const notif = data.notifications.find(n => String(n.notifId || n.id) === String(req.body.notifId));
    if (!notif) return res.status(404).json({ message: "Notification not found." });
    notif.isRead = true;
    await saveLatestState(data);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get("/api/appointments", async (req, res) => {
  try {
    const lawyerId = req.query.lawyerId;
    const data = ensureCollections(await getLatestState());
    const filtered = data.appointments.filter(a => a.lawyerId === lawyerId);
    res.json(filtered);
  } catch (e) { res.status(500).json([]); }
});

app.get("/api/lawyer/profile", async (req, res) => {
  try {
    const lawyerId = req.query.lawyerId;
    const data = ensureCollections(await getLatestState());
    const user = data.users.find(u => u.id === lawyerId || u.lawyerId === lawyerId);
    res.json(user ? { ...user, lawyerId: user.id } : null);
  } catch (e) { res.status(500).json(null); }
});

app.put("/api/lawyer/profile", async (req, res) => {
  try {
    const data = ensureCollections(await getLatestState());
    const user = data.users.find(u => u.id === req.body.lawyerId || u.lawyerId === req.body.lawyerId);
    if (!user) return res.status(404).json({ message: "Lawyer not found." });
    user.name = req.body.name;
    user.email = req.body.email;
    user.phone = req.body.phone;
    await saveLatestState(data);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.delete("/api/lawyer/profile", async (req, res) => {
  try {
    const data = ensureCollections(await getLatestState());
    const lawyerId = req.query.lawyerId;
    const idx = data.users.findIndex(u => String(u.id) === String(lawyerId) || String(u.lawyerId) === String(lawyerId));
    if (idx === -1) return res.status(404).json({ message: "Lawyer not found." });
    const user = data.users[idx];
    data.users.splice(idx, 1);
    data.cases = data.cases.filter(c => String(c.lawyerId) !== String(user.id));
    data.documents = data.documents.filter(d => String(d.lawyerId) !== String(user.id) && String(d.ownerId) !== String(user.id));
    data.schedules = data.schedules.filter(s => String(s.lawyerId) !== String(user.id));
    data.notifications = data.notifications.filter(n => String(n.userId) !== String(user.id) && String(n.lawyerId) !== String(user.id));
    await saveLatestState(data);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password, role } = req.body;
  const sql = getSqlClient();
  const [row] = await sql`SELECT data FROM system_state WHERE id = 'latest'`;
  if (!row) return res.status(401).json({ message: "Invalid credentials" });
  const user = row.data.users.find(u => u.email === email && u.password === password);
  if (user) {
    if (role && String(user.role || "").toLowerCase() !== String(role || "").toLowerCase()) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    res.json({ token: "demo-token", userId: user.id, lawyerId: user.id, role: user.role, name: user.name });
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
});

app.get("/", (_req, res) => {
  res.status(200).json({
    ok: true,
    message: "Backend API is running. Frontend should be served by Vite on http://localhost:5173"
  });
});

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    message: `Route not found on API server: ${req.path}. Use frontend at http://localhost:5173`
  });
});



app.listen(PORT, () => {
  console.log(`SASF Law Firm server running at http://localhost:${PORT}`);
});
