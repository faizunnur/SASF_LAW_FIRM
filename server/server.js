const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const express = require("express");
const cors = require("cors");
const { checkDatabase, getSqlClient, setupDatabase } = require("./db");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const allowedOrigins = String(process.env.CORS_ORIGIN || "")
  .split(",").map((o) => o.trim()).filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  }
}));

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

setupDatabase()
  .then(() => console.log("Database ready: users, cases, appointments, notifications, schedules, documents, transactions."))
  .catch((e) => console.error("DB Init Error:", e.message));

// ── Mappers: DB row → App JSON ───────────────────────────────────────────────

function dbUserToApp(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    password: row.password,
    role: row.role,
    phone: row.phone || "",
    department: row.department || "",
    level: row.level || "",
    image_url: row.image_url || "",
    verified: Boolean(row.verified),
    status: row.status || "active",
    lawyerId: row.lawyer_id || ""
  };
}

function dbCaseToApp(row) {
  return {
    id: row.case_id,
    caseId: row.case_id,
    title: row.title,
    clientId: row.client_id || "",
    client: row.client_name || "",
    clientName: row.client_name || "",
    lawyerId: row.lawyer_id || "",
    assistantId: row.assistant_id || "",
    type: row.case_type || "",
    caseType: row.case_type || "",
    status: row.status,
    priority: row.priority,
    hearingDate: row.hearing_date || "",
    description: row.description || "",
    notes: row.notes || "",
    progressNote: row.progress_note || "",
    lastNote: row.last_note || "",
    opposingCounsel: row.opposing_counsel || "",
    importantDates: Array.isArray(row.important_dates) ? row.important_dates : [],
    lastUpdated: row.last_updated || ""
  };
}

function dbApptToApp(row) {
  return {
    id: row.id,
    appointmentId: row.id,
    clientId: row.client_id || "",
    lawyerId: row.lawyer_id || "",
    assistantId: row.assistant_id || "",
    date: row.appt_date || "",
    time: row.appt_time || "",
    type: row.case_type || "",
    status: row.status,
    payment: row.payment,
    notes: row.notes || ""
  };
}

function dbScheduleToApp(row) {
  return {
    id: row.event_id,
    eventId: row.event_id,
    lawyerId: row.lawyer_id || "",
    title: row.title,
    date: row.event_date || "",
    time: row.event_time || "",
    type: row.type || "Meeting",
    category: row.category || ""
  };
}

function dbDocToApp(row) {
  return {
    id: row.doc_id,
    docId: row.doc_id,
    caseId: row.case_id || "",
    ownerId: row.owner_id || "",
    clientId: row.client_id || "",
    lawyerId: row.lawyer_id || "",
    name: row.title,
    title: row.title,
    category: row.category || "Other",
    description: row.description || "",
    updatedOn: row.updated_on || ""
  };
}

function dbNotifToApp(row) {
  return {
    id: row.id,
    notifId: row.id,
    userId: row.user_id || "",
    lawyerId: row.lawyer_id || "",
    title: row.title,
    message: row.message,
    date: row.notif_date || "",
    createdAt: row.created_at,
    read: Boolean(row.is_read),
    isRead: Boolean(row.is_read)
  };
}

function dbTxToApp(row) {
  return {
    id: row.transaction_id,
    clientId: row.client_id || "",
    client: row.client_name || "",
    clientName: row.client_name || "",
    amount: Number(row.amount) || 0,
    status: row.status,
    date: row.tx_date || ""
  };
}

// ── Health & DB check ────────────────────────────────────────────────────────

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

// ── Load full state ──────────────────────────────────────────────────────────

app.get("/api/load", async (_req, res) => {
  try {
    const sql = getSqlClient();
    const [users, cases, appointments, schedules, documents, notifications, transactions] = await Promise.all([
      sql`SELECT * FROM users ORDER BY created_at ASC`,
      sql`SELECT * FROM cases ORDER BY created_at DESC`,
      sql`SELECT * FROM appointments ORDER BY created_at DESC`,
      sql`SELECT * FROM schedules ORDER BY created_at DESC`,
      sql`SELECT * FROM documents ORDER BY created_at DESC`,
      sql`SELECT * FROM notifications ORDER BY created_at DESC`,
      sql`SELECT * FROM transactions ORDER BY created_at DESC`
    ]);
    res.json({
      users: users.map(dbUserToApp),
      cases: cases.map(dbCaseToApp),
      appointments: appointments.map(dbApptToApp),
      schedules: schedules.map(dbScheduleToApp),
      documents: documents.map(dbDocToApp),
      notifications: notifications.map(dbNotifToApp),
      transactions: transactions.map(dbTxToApp)
    });
  } catch (error) {
    console.warn("Load error:", error.message);
    res.json({ users: [], cases: [], appointments: [], schedules: [], documents: [], notifications: [], transactions: [] });
  }
});

// ── Save full state (full replace) ──────────────────────────────────────────

app.post("/api/save", async (req, res) => {
  try {
    const sql = getSqlClient();
    const data = req.body || {};
    const users        = Array.isArray(data.users)         ? data.users         : [];
    const cases        = Array.isArray(data.cases)         ? data.cases         : [];
    const appointments = Array.isArray(data.appointments)  ? data.appointments  : [];
    const schedules    = Array.isArray(data.schedules)     ? data.schedules     : [];
    const documents    = Array.isArray(data.documents)     ? data.documents     : [];
    const notifications= Array.isArray(data.notifications) ? data.notifications : [];
    const transactions = Array.isArray(data.transactions)  ? data.transactions  : [];

    // Clear all tables in safe order, then re-insert
    await sql`DELETE FROM transactions`;
    await sql`DELETE FROM documents`;
    await sql`DELETE FROM schedules`;
    await sql`DELETE FROM notifications`;
    await sql`DELETE FROM appointments`;
    await sql`DELETE FROM cases`;
    await sql`DELETE FROM users`;

    for (const u of users) {
      const id = String(u.id || "").trim();
      if (!id) continue;
      const role   = ["admin","lawyer","assistant","client"].includes(u.role) ? u.role : "client";
      const status = ["active","blocked"].includes(u.status) ? u.status : "active";
      await sql`
        INSERT INTO users (id, name, email, password, role, phone, department, level, image_url, verified, status, lawyer_id)
        VALUES (${id}, ${String(u.name || "")}, ${String(u.email || "").toLowerCase()},
                ${String(u.password || "")}, ${role}, ${String(u.phone || "")},
                ${String(u.department || "")}, ${String(u.level || "")}, ${String(u.image_url || "")},
                ${Boolean(u.verified)}, ${status}, ${u.lawyerId || null})
      `;
    }

    for (const c of cases) {
      const caseId = String(c.caseId || c.id || "").trim();
      if (!caseId) continue;
      const importantDates = JSON.stringify(Array.isArray(c.importantDates) ? c.importantDates : []);
      await sql`
        INSERT INTO cases (case_id, title, client_id, client_name, lawyer_id, assistant_id, case_type, status, priority, hearing_date, description, notes, progress_note, last_note, opposing_counsel, important_dates, last_updated)
        VALUES (${caseId}, ${String(c.title || "")}, ${c.clientId || null},
                ${String(c.client || c.clientName || "")}, ${c.lawyerId || null}, ${c.assistantId || null},
                ${String(c.type || c.caseType || "")}, ${String(c.status || "Open")},
                ${String(c.priority || "Medium")}, ${String(c.hearingDate || "")},
                ${String(c.description || "")}, ${String(c.notes || "")},
                ${String(c.progressNote || "")}, ${String(c.lastNote || "")},
                ${String(c.opposingCounsel || "")}, ${importantDates}::jsonb,
                ${String(c.lastUpdated || "")})
      `;
    }

    for (const a of appointments) {
      const id = String(a.id || a.appointmentId || "").trim();
      if (!id) continue;
      await sql`
        INSERT INTO appointments (id, client_id, lawyer_id, assistant_id, appt_date, appt_time, case_type, status, payment, notes)
        VALUES (${id}, ${a.clientId || null}, ${a.lawyerId || null}, ${a.assistantId || null},
                ${String(a.date || "")}, ${String(a.time || "")}, ${String(a.type || "")},
                ${String(a.status || "Pending")}, ${String(a.payment || "Pending")}, ${String(a.notes || "")})
      `;
    }

    for (const s of schedules) {
      const eventId = String(s.eventId || s.id || "").trim();
      if (!eventId) continue;
      await sql`
        INSERT INTO schedules (event_id, lawyer_id, title, event_date, event_time, type, category)
        VALUES (${eventId}, ${s.lawyerId || null}, ${String(s.title || "")},
                ${String(s.date || "")}, ${String(s.time || "")},
                ${String(s.type || "Meeting")}, ${String(s.category || "")})
      `;
    }

    for (const d of documents) {
      const docId = String(d.docId || d.id || "").trim();
      if (!docId) continue;
      await sql`
        INSERT INTO documents (doc_id, case_id, owner_id, client_id, lawyer_id, title, category, description, updated_on)
        VALUES (${docId}, ${d.caseId || null}, ${d.ownerId || null}, ${d.clientId || null},
                ${d.lawyerId || null}, ${String(d.name || d.title || "")},
                ${String(d.category || "Other")}, ${String(d.description || "")}, ${String(d.updatedOn || "")})
      `;
    }

    for (const n of notifications) {
      const id = String(n.id || n.notifId || "").trim();
      if (!id) continue;
      const notifDate = n.date || (n.createdAt ? String(n.createdAt).slice(0, 10) : "");
      await sql`
        INSERT INTO notifications (id, user_id, lawyer_id, title, message, notif_date, is_read)
        VALUES (${id}, ${n.userId || null}, ${n.lawyerId || null},
                ${String(n.title || "")}, ${String(n.message || "")},
                ${notifDate}, ${Boolean(n.read || n.isRead)})
      `;
    }

    for (const t of transactions) {
      const txId = String(t.id || t.transactionId || "").trim();
      if (!txId) continue;
      await sql`
        INSERT INTO transactions (transaction_id, client_id, client_name, amount, status, tx_date)
        VALUES (${txId}, ${t.clientId || null}, ${String(t.client || t.clientName || "")},
                ${Number(t.amount) || 0}, ${String(t.status || "Pending")}, ${String(t.date || "")})
      `;
    }

    res.json({ ok: true });
  } catch (error) {
    console.error("Save error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ── Users ────────────────────────────────────────────────────────────────────

app.get("/api/users", async (req, res) => {
  try {
    const sql = getSqlClient();
    const role = String(req.query.role || "").trim().toLowerCase();
    const rows = role
      ? await sql`SELECT * FROM users WHERE LOWER(role) = ${role} ORDER BY created_at`
      : await sql`SELECT * FROM users ORDER BY created_at`;
    res.json(rows.map(dbUserToApp));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    const sql = getSqlClient();
    const b = req.body || {};
    const id = b.id || `u-${Date.now()}`;
    const role = ["admin","lawyer","assistant","client"].includes(b.role) ? b.role : "assistant";
    await sql`
      INSERT INTO users (id, name, email, password, role, phone, department, level, image_url, verified, status, lawyer_id)
      VALUES (${id}, ${b.name || "New User"}, ${b.email || `${id}@sasf.com`},
              ${b.password || "123"}, ${role}, ${b.phone || ""},
              ${b.department || "Operations"}, ${b.level || "Associate"},
              ${b.image_url || ""}, ${b.verified !== false}, ${b.status || "active"}, ${b.lawyerId || null})
    `;
    res.json({ ok: true, id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put("/api/users/:id", async (req, res) => {
  try {
    const sql = getSqlClient();
    const [user] = await sql`SELECT * FROM users WHERE id = ${req.params.id}`;
    if (!user) return res.status(404).json({ message: "User not found." });
    const p = req.body || {};
    await sql`
      UPDATE users SET
        name       = ${p.name       !== undefined ? p.name       : user.name},
        email      = ${p.email      !== undefined ? p.email      : user.email},
        password   = ${p.password   !== undefined ? p.password   : user.password},
        role       = ${p.role       !== undefined ? p.role       : user.role},
        phone      = ${p.phone      !== undefined ? p.phone      : user.phone},
        department = ${p.department !== undefined ? p.department : user.department},
        level      = ${p.level      !== undefined ? p.level      : user.level},
        image_url  = ${p.image_url  !== undefined ? p.image_url  : user.image_url},
        verified   = ${p.verified   !== undefined ? Boolean(p.verified) : user.verified},
        status     = ${p.status     !== undefined ? p.status     : user.status},
        lawyer_id  = ${p.lawyerId   !== undefined ? (p.lawyerId || null) : user.lawyer_id}
      WHERE id = ${req.params.id}
    `;
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  try {
    const sql = getSqlClient();
    const uid = req.params.id;
    const [user] = await sql`SELECT id FROM users WHERE id = ${uid}`;
    if (!user) return res.status(404).json({ message: "User not found." });
    await sql`DELETE FROM transactions  WHERE client_id   = ${uid}`;
    await sql`DELETE FROM notifications WHERE user_id     = ${uid} OR lawyer_id = ${uid}`;
    await sql`DELETE FROM schedules     WHERE lawyer_id   = ${uid}`;
    await sql`DELETE FROM documents     WHERE owner_id    = ${uid} OR client_id  = ${uid} OR lawyer_id = ${uid}`;
    await sql`DELETE FROM appointments  WHERE client_id   = ${uid} OR lawyer_id  = ${uid} OR assistant_id = ${uid}`;
    await sql`DELETE FROM cases         WHERE client_id   = ${uid} OR lawyer_id  = ${uid} OR assistant_id = ${uid}`;
    await sql`DELETE FROM users WHERE id = ${uid}`;
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── Cases ────────────────────────────────────────────────────────────────────

app.get("/api/cases", async (req, res) => {
  try {
    const sql = getSqlClient();
    const lawyerId = req.query.lawyerId;
    const rows = lawyerId
      ? await sql`SELECT * FROM cases WHERE lawyer_id = ${lawyerId} ORDER BY created_at DESC`
      : await sql`SELECT * FROM cases ORDER BY created_at DESC`;
    res.json(rows.map(dbCaseToApp));
  } catch (e) { res.status(500).json([]); }
});

app.post("/api/cases", async (req, res) => {
  try {
    const sql = getSqlClient();
    const caseId = `C-${Date.now()}`;
    const b = req.body;
    const importantDates = JSON.stringify(Array.isArray(b.importantDates) ? b.importantDates : []);
    await sql`
      INSERT INTO cases (case_id, title, client_id, client_name, lawyer_id, case_type, status, priority, description, opposing_counsel, important_dates, last_note, last_updated)
      VALUES (${caseId}, ${b.title || ""}, ${b.clientId || null}, ${b.clientName || ""},
              ${b.lawyerId || null}, ${b.caseType || "General"}, ${b.status || "Open"},
              ${b.priority || "Medium"}, ${b.description || "No description provided."},
              ${b.opposingCounsel || "Not specified"}, ${importantDates}::jsonb,
              "", ${new Date().toISOString()})
    `;
    if (b.lawyerId) {
      await sql`
        INSERT INTO notifications (id, user_id, title, message, notif_date, is_read)
        VALUES (${`N-${Date.now()}`}, ${b.lawyerId}, 'Case Created',
                ${`Case ${caseId} was created successfully.`},
                ${new Date().toISOString().slice(0, 10)}, false)
      `;
    }
    res.json({ ok: true, caseId });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.put("/api/cases/status", async (req, res) => {
  try {
    const sql = getSqlClient();
    const { caseId, newStatus } = req.body;
    const [c] = await sql`SELECT * FROM cases WHERE case_id = ${caseId}`;
    if (!c) return res.status(404).json({ message: "Case not found." });
    await sql`UPDATE cases SET status = ${newStatus}, last_updated = ${new Date().toISOString()} WHERE case_id = ${caseId}`;
    if (c.lawyer_id) {
      await sql`
        INSERT INTO notifications (id, user_id, title, message, notif_date, is_read)
        VALUES (${`N-${Date.now()}`}, ${c.lawyer_id}, 'Case Status Updated',
                ${`Case ${caseId} status changed to ${newStatus}.`},
                ${new Date().toISOString().slice(0, 10)}, false)
      `;
    }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.put("/api/cases/update", async (req, res) => {
  try {
    const sql = getSqlClient();
    const { caseId, updatedFields, notes } = req.body;
    const [c] = await sql`SELECT * FROM cases WHERE case_id = ${caseId}`;
    if (!c) return res.status(404).json({ message: "Case not found." });
    const f = updatedFields || {};
    const importantDates = f.importantDates !== undefined
      ? JSON.stringify(f.importantDates)
      : JSON.stringify(Array.isArray(c.important_dates) ? c.important_dates : []);
    await sql`
      UPDATE cases SET
        title            = ${f.title            !== undefined ? f.title            : c.title},
        status           = ${f.status           !== undefined ? f.status           : c.status},
        priority         = ${f.priority         !== undefined ? f.priority         : c.priority},
        case_type        = ${f.caseType         !== undefined ? f.caseType         : c.case_type},
        description      = ${f.description      !== undefined ? f.description      : c.description},
        opposing_counsel = ${f.opposingCounsel  !== undefined ? f.opposingCounsel  : c.opposing_counsel},
        important_dates  = ${importantDates}::jsonb,
        last_note        = ${notes ? String(notes).trim() : c.last_note},
        last_updated     = ${new Date().toISOString()}
      WHERE case_id = ${caseId}
    `;
    if (c.lawyer_id) {
      await sql`
        INSERT INTO notifications (id, user_id, title, message, notif_date, is_read)
        VALUES (${`N-${Date.now()}`}, ${c.lawyer_id}, 'Case Updated',
                ${`Case ${caseId} was updated with new notes.`},
                ${new Date().toISOString().slice(0, 10)}, false)
      `;
    }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.delete("/api/cases", async (req, res) => {
  try {
    const sql = getSqlClient();
    const caseId = req.query.caseId;
    const [c] = await sql`SELECT case_id FROM cases WHERE case_id = ${caseId}`;
    if (!c) return res.status(404).json({ message: "Case not found." });
    await sql`DELETE FROM documents WHERE case_id = ${caseId}`;
    await sql`DELETE FROM cases WHERE case_id = ${caseId}`;
    res.json({ ok: true, caseId });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ── Documents ────────────────────────────────────────────────────────────────

app.get("/api/documents", async (req, res) => {
  try {
    const sql = getSqlClient();
    const lawyerId = req.query.lawyerId;
    const rows = lawyerId
      ? await sql`SELECT * FROM documents WHERE lawyer_id = ${lawyerId} OR owner_id = ${lawyerId} ORDER BY created_at DESC`
      : await sql`SELECT * FROM documents ORDER BY created_at DESC`;
    res.json(rows.map(dbDocToApp));
  } catch (e) { res.status(500).json([]); }
});

app.post("/api/documents", async (req, res) => {
  try {
    const sql = getSqlClient();
    const docId = `D-${Date.now()}`;
    const b = req.body;
    await sql`
      INSERT INTO documents (doc_id, case_id, owner_id, lawyer_id, title, category, description, updated_on)
      VALUES (${docId}, ${b.caseId || null}, ${b.lawyerId || null}, ${b.lawyerId || null},
              ${b.title || ""}, ${b.fileType || "PDF"}, ${b.description || ""},
              ${new Date().toISOString().slice(0, 10)})
    `;
    res.json({ ok: true, docId });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.put("/api/documents", async (req, res) => {
  try {
    const sql = getSqlClient();
    const b = req.body;
    const [doc] = await sql`SELECT * FROM documents WHERE doc_id = ${b.docId}`;
    if (!doc) return res.status(404).json({ message: "Document not found." });
    await sql`
      UPDATE documents SET
        title       = ${b.title       !== undefined ? b.title       : doc.title},
        description = ${b.description !== undefined ? b.description : doc.description},
        case_id     = ${b.caseId      !== undefined ? (b.caseId || null) : doc.case_id}
      WHERE doc_id = ${b.docId}
    `;
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.delete("/api/documents", async (req, res) => {
  try {
    const sql = getSqlClient();
    const docId = req.query.docId;
    const [doc] = await sql`SELECT doc_id FROM documents WHERE doc_id = ${docId}`;
    if (!doc) return res.status(404).json({ message: "Document not found." });
    await sql`DELETE FROM documents WHERE doc_id = ${docId}`;
    res.json({ ok: true, docId });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ── Schedules ────────────────────────────────────────────────────────────────

app.get("/api/schedule", async (req, res) => {
  try {
    const sql = getSqlClient();
    const lawyerId = req.query.lawyerId;
    const rows = lawyerId
      ? await sql`SELECT * FROM schedules WHERE lawyer_id = ${lawyerId} ORDER BY created_at DESC`
      : await sql`SELECT * FROM schedules ORDER BY created_at DESC`;
    res.json(rows.map(dbScheduleToApp));
  } catch (e) { res.status(500).json([]); }
});

app.post("/api/schedule", async (req, res) => {
  try {
    const sql = getSqlClient();
    const eventId = `E-${Date.now()}`;
    const b = req.body;
    await sql`
      INSERT INTO schedules (event_id, lawyer_id, title, event_date, event_time, type)
      VALUES (${eventId}, ${b.lawyerId || null}, ${b.title || ""},
              ${b.date || ""}, ${b.time || ""}, ${b.type || "Meeting"})
    `;
    res.json({ ok: true, eventId });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.put("/api/schedule", async (req, res) => {
  try {
    const sql = getSqlClient();
    const b = req.body;
    const [ev] = await sql`SELECT * FROM schedules WHERE event_id = ${b.eventId}`;
    if (!ev) return res.status(404).json({ message: "Event not found." });
    await sql`
      UPDATE schedules SET
        title      = ${b.title !== undefined ? b.title : ev.title},
        event_date = ${b.date  !== undefined ? b.date  : ev.event_date},
        event_time = ${b.time  !== undefined ? b.time  : ev.event_time}
      WHERE event_id = ${b.eventId}
    `;
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ── Notifications ────────────────────────────────────────────────────────────

app.get("/api/notifications", async (req, res) => {
  try {
    const sql = getSqlClient();
    const lawyerId = req.query.lawyerId;
    const rows = lawyerId
      ? await sql`SELECT * FROM notifications WHERE user_id = ${lawyerId} OR lawyer_id = ${lawyerId} ORDER BY created_at DESC`
      : await sql`SELECT * FROM notifications ORDER BY created_at DESC`;
    res.json(rows.map(dbNotifToApp));
  } catch (e) { res.status(500).json([]); }
});

app.patch("/api/notifications/read", async (req, res) => {
  try {
    const sql = getSqlClient();
    const notifId = String(req.body.notifId || "");
    const [notif] = await sql`SELECT id FROM notifications WHERE id = ${notifId}`;
    if (!notif) return res.status(404).json({ message: "Notification not found." });
    await sql`UPDATE notifications SET is_read = true WHERE id = ${notifId}`;
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ── Appointments ─────────────────────────────────────────────────────────────

app.get("/api/appointments", async (req, res) => {
  try {
    const sql = getSqlClient();
    const lawyerId = req.query.lawyerId;
    const rows = lawyerId
      ? await sql`SELECT * FROM appointments WHERE lawyer_id = ${lawyerId} ORDER BY created_at DESC`
      : await sql`SELECT * FROM appointments ORDER BY created_at DESC`;
    res.json(rows.map(dbApptToApp));
  } catch (e) { res.status(500).json([]); }
});

app.delete("/api/appointments", async (req, res) => {
  try {
    const sql = getSqlClient();
    const apptId = String(req.query.apptId || "");
    if (!apptId) return res.status(400).json({ message: "apptId is required." });
    const [appt] = await sql`SELECT * FROM appointments WHERE id = ${apptId}`;
    if (!appt) return res.status(404).json({ message: "Appointment not found." });
    const cancellable = ["Awaiting Assistant Review", "Awaiting Lawyer Review", "Pending"];
    if (!cancellable.includes(appt.status)) {
      return res.status(409).json({ message: "Appointment cannot be cancelled at this stage." });
    }
    await sql`DELETE FROM appointments WHERE id = ${apptId}`;
    res.json({ ok: true, apptId });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ── Lawyer profile ───────────────────────────────────────────────────────────

app.get("/api/lawyer/profile", async (req, res) => {
  try {
    const sql = getSqlClient();
    const lawyerId = req.query.lawyerId;
    const [user] = await sql`SELECT * FROM users WHERE id = ${lawyerId}`;
    res.json(user ? { ...dbUserToApp(user), lawyerId: user.id } : null);
  } catch (e) { res.status(500).json(null); }
});

app.put("/api/lawyer/profile", async (req, res) => {
  try {
    const sql = getSqlClient();
    const lawyerId = req.body.lawyerId;
    const [user] = await sql`SELECT * FROM users WHERE id = ${lawyerId}`;
    if (!user) return res.status(404).json({ message: "Lawyer not found." });
    await sql`
      UPDATE users SET
        name  = ${req.body.name  !== undefined ? req.body.name  : user.name},
        email = ${req.body.email !== undefined ? req.body.email : user.email},
        phone = ${req.body.phone !== undefined ? req.body.phone : user.phone}
      WHERE id = ${lawyerId}
    `;
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.delete("/api/lawyer/profile", async (req, res) => {
  try {
    const sql = getSqlClient();
    const lawyerId = req.query.lawyerId;
    const [user] = await sql`SELECT id FROM users WHERE id = ${lawyerId}`;
    if (!user) return res.status(404).json({ message: "Lawyer not found." });
    const uid = user.id;
    await sql`DELETE FROM notifications WHERE user_id = ${uid} OR lawyer_id = ${uid}`;
    await sql`DELETE FROM schedules     WHERE lawyer_id = ${uid}`;
    await sql`DELETE FROM documents     WHERE lawyer_id = ${uid} OR owner_id = ${uid}`;
    await sql`DELETE FROM cases         WHERE lawyer_id = ${uid}`;
    await sql`DELETE FROM users WHERE id = ${uid}`;
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ── Auth login ───────────────────────────────────────────────────────────────

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const sql = getSqlClient();
    const [user] = await sql`
      SELECT * FROM users
      WHERE LOWER(email) = ${String(email || "").toLowerCase()}
        AND password = ${String(password || "")}
    `;
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    if (role && String(user.role || "").toLowerCase() !== String(role || "").toLowerCase()) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    res.json({ token: "demo-token", userId: user.id, lawyerId: user.id, role: user.role, name: user.name });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── Root & 404 ───────────────────────────────────────────────────────────────

app.get("/", (_req, res) => {
  res.json({ ok: true, message: "SASF API running. Frontend served by Vite on http://localhost:5173" });
});

app.use((req, res) => {
  res.status(404).json({ ok: false, message: `Route not found: ${req.path}` });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`SASF Law Firm server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
