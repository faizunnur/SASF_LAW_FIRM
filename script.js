const STORAGE_KEY = "lexbridge-data-v1";
const SESSION_KEY = "lexbridge-session-v1";

const modules = [
  { id: "profileSection", title: "Profile", text: "View and manage user profile information." },
  { id: "caseSection", title: "Cases", text: "Create, update, assign, search, and filter case records." },
  { id: "appointmentSection", title: "Appointments", text: "Request, confirm, pay for, and cancel appointments." },
  { id: "scheduleSection", title: "Schedules", text: "Track appointments, hearing dates, and meetings." },
  { id: "documentSection", title: "Documents", text: "Upload and review case-related documents." },
  { id: "notificationSection", title: "Notifications", text: "Stay updated with system alerts and reminders." },
  { id: "reportSection", title: "Reports", text: "Assign roles and generate overview reports." }
];

const roleModules = {
  guest: ["profileSection", "caseSection", "appointmentSection", "scheduleSection", "documentSection", "notificationSection", "reportSection"],
  client: ["profileSection", "caseSection", "appointmentSection", "documentSection", "notificationSection"],
  lawyer: ["profileSection", "caseSection", "scheduleSection", "documentSection", "notificationSection"],
  assistant: ["profileSection", "caseSection", "appointmentSection", "scheduleSection", "notificationSection"],
  admin: ["profileSection", "caseSection", "appointmentSection", "scheduleSection", "documentSection", "notificationSection", "reportSection"]
};

const appState = {
  data: null,
  currentUserId: null,
  editingCaseId: null,
  editingAppointmentId: null,
  editingScheduleId: null,
  editingDocumentId: null,
  backendStatus: {
    server: "Checking...",
    database: "Waiting for server response..."
  }
};

const elements = {
  authTabs: document.querySelectorAll("[data-auth-tab]"),
  authViews: {
    login: document.getElementById("loginView"),
    register: document.getElementById("registerView"),
    recover: document.getElementById("recoverView")
  },
  loginForm: document.getElementById("loginForm"),
  registerForm: document.getElementById("registerForm"),
  recoverForm: document.getElementById("recoverForm"),
  logoutBtn: document.getElementById("logoutBtn"),
  loadDemoBtn: document.getElementById("loadDemoBtn"),
  statsGrid: document.getElementById("statsGrid"),
  backendStatusBox: document.getElementById("backendStatusBox"),
  userBanner: document.getElementById("userBanner"),
  moduleList: document.getElementById("moduleList"),
  dashboardTitle: document.getElementById("dashboardTitle"),
  profileForm: document.getElementById("profileForm"),
  deleteProfileBtn: document.getElementById("deleteProfileBtn"),
  caseForm: document.getElementById("caseForm"),
  caseTableBody: document.getElementById("caseTableBody"),
  appointmentForm: document.getElementById("appointmentForm"),
  appointmentList: document.getElementById("appointmentList"),
  scheduleForm: document.getElementById("scheduleForm"),
  scheduleList: document.getElementById("scheduleList"),
  documentForm: document.getElementById("documentForm"),
  documentList: document.getElementById("documentList"),
  notificationList: document.getElementById("notificationList"),
  reportForm: document.getElementById("reportForm"),
  reportBox: document.getElementById("reportBox"),
  globalSearchInput: document.getElementById("globalSearchInput"),
  caseFilterSelect: document.getElementById("caseFilterSelect"),
  toast: document.getElementById("toast")
};

function seedDemoData() {
  return {
    users: [
      { id: "u-admin", name: "Ariana Khan", email: "admin@lexbridge.com", password: "123456", role: "admin", phone: "+880 1700-111111", department: "Administration", verified: true },
      { id: "u-lawyer", name: "Barrister Nadia Rahman", email: "lawyer@lexbridge.com", password: "123456", role: "lawyer", phone: "+880 1700-222222", department: "Corporate Law", verified: true },
      { id: "u-assistant", name: "Imran Hossain", email: "assistant@lexbridge.com", password: "123456", role: "assistant", phone: "+880 1700-333333", department: "Case Operations", verified: true },
      { id: "u-client", name: "Sadia Karim", email: "client@lexbridge.com", password: "123456", role: "client", phone: "+880 1700-444444", department: "Client", verified: true }
    ],
    cases: [
      { id: "C-1024", title: "Property Dispute Review", clientId: "u-client", lawyerId: "u-lawyer", assistantId: "u-assistant", type: "Civil", priority: "High", status: "In Progress", hearingDate: "2026-04-18", notes: "Evidence checklist updated and hearing prepared." },
      { id: "C-1025", title: "Startup Incorporation", clientId: "u-client", lawyerId: "u-lawyer", assistantId: "u-assistant", type: "Corporate", priority: "Medium", status: "Review", hearingDate: "2026-04-22", notes: "Draft legal structure prepared for approval." }
    ],
    appointments: [
      { id: "A-501", clientId: "u-client", lawyerId: "u-lawyer", assistantId: "u-assistant", date: "2026-04-12", time: "11:00", type: "Consultation", status: "Confirmed", payment: "Paid" }
    ],
    schedules: [
      { id: "S-81", lawyerId: "u-lawyer", title: "Court Hearing: Property Dispute Review", date: "2026-04-18", time: "09:30", category: "Court Date", reminder: "Enabled" },
      { id: "S-82", lawyerId: "u-lawyer", title: "Client Consultation", date: "2026-04-12", time: "11:00", category: "Appointment", reminder: "Enabled" }
    ],
    documents: [
      { id: "D-900", caseId: "C-1024", ownerId: "u-lawyer", clientId: "u-client", name: "Land Ownership Evidence.pdf", category: "Evidence", updatedOn: "2026-04-02", access: "Client View" }
    ],
    notifications: [
      { id: "N-1", userId: "u-client", title: "Payment Confirmation Notification", message: "Your appointment payment was confirmed successfully.", date: "2026-04-03" },
      { id: "N-2", userId: "u-lawyer", title: "Hearing Date Notification", message: "Property dispute hearing scheduled for 18 April 2026.", date: "2026-04-03" },
      { id: "N-3", userId: "u-assistant", title: "Take Appointment Notification", message: "A client requested a new consultation appointment.", date: "2026-04-03" },
      { id: "N-4", userId: "u-admin", title: "Profile Verifying Notification", message: "A new account requires verification review.", date: "2026-04-03" }
    ]
  };
}

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  appState.data = saved ? JSON.parse(saved) : seedDemoData();
  if (!saved) saveData();
  appState.currentUserId = localStorage.getItem(SESSION_KEY) || null;
}

function saveData() { localStorage.setItem(STORAGE_KEY, JSON.stringify(appState.data)); }
function saveSession() { appState.currentUserId ? localStorage.setItem(SESSION_KEY, appState.currentUserId) : localStorage.removeItem(SESSION_KEY); }
function getCurrentUser() { return appState.data.users.find((user) => user.id === appState.currentUserId) || null; }
function getUserName(id) { return appState.data.users.find((entry) => entry.id === id)?.name || "Unassigned"; }
function titleCase(value) { return value.charAt(0).toUpperCase() + value.slice(1); }
function createId(prefix) { return `${prefix}-${Math.floor(Math.random() * 900 + 100)}`; }

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => elements.toast.classList.remove("show"), 2800);
}

function switchAuthTab(tabName) {
  elements.authTabs.forEach((button) => button.classList.toggle("active", button.dataset.authTab === tabName));
  Object.entries(elements.authViews).forEach(([name, section]) => section.classList.toggle("active", name === tabName));
}

function addNotification(userId, title, message) {
  appState.data.notifications.unshift({
    id: `N-${Date.now()}`,
    userId,
    title,
    message,
    date: new Date().toISOString().slice(0, 10)
  });
}

function renderStats() {
  const stats = [
    { label: "Users", value: appState.data.users.length },
    { label: "Cases", value: appState.data.cases.length },
    { label: "Appointments", value: appState.data.appointments.length },
    { label: "Documents", value: appState.data.documents.length }
  ];
  elements.statsGrid.innerHTML = stats.map((item) => `<article class="mini-card"><h3>${item.value}</h3><p>${item.label}</p></article>`).join("");
}

function renderUserBanner() {
  const user = getCurrentUser();
  if (!user) {
    elements.userBanner.innerHTML = `<div><p class="section-kicker">Current Session</p><h3>No active user</h3><p>Login or create a new account to explore the role-based dashboard.</p></div><span class="role-badge">Guest</span>`;
    return;
  }
  elements.userBanner.innerHTML = `<div><p class="section-kicker">Current Session</p><h3>${user.name}</h3><p>${user.email} • ${titleCase(user.role)} • ${user.department}</p></div><span class="role-badge">${titleCase(user.role)}</span>`;
}

function renderBackendStatus() {
  elements.backendStatusBox.innerHTML = `
    <h4>Backend Status</h4>
    <p>${appState.backendStatus.server}</p>
    <p>${appState.backendStatus.database}</p>
  `;
}

async function fetchBackendStatus() {
  try {
    const healthResponse = await fetch("/api/health");

    if (!healthResponse.ok) {
      throw new Error("Node server is not responding.");
    }

    const health = await healthResponse.json();
    appState.backendStatus.server = `Server: ${health.runtime} API is online at ${new Date(health.timestamp).toLocaleString()}.`;

    try {
      const dbResponse = await fetch("/api/db-check");
      const dbData = await dbResponse.json();

      if (!dbResponse.ok) {
        throw new Error(dbData.error || "Neon connection failed.");
      }

      appState.backendStatus.database = `Database: connected to Neon database "${dbData.database}" (${dbData.schema}).`;
    } catch (error) {
      appState.backendStatus.database = `Database: ${error.message}`;
    }
  } catch (error) {
    appState.backendStatus.server = `Server: ${error.message}`;
    appState.backendStatus.database = "Database: waiting for the Node server.";
  }

  renderBackendStatus();
}

function renderModules() {
  const user = getCurrentUser();
  const visibleModuleIds = roleModules[user?.role || "guest"];
  elements.moduleList.innerHTML = modules
    .filter((module) => visibleModuleIds.includes(module.id))
    .map((module, index) => `<button class="${index === 0 ? "active" : ""}" data-module-target="${module.id}" type="button"><strong>${module.title}</strong><span>${module.text}</span></button>`)
    .join("");
  setActiveModule(visibleModuleIds[0] || "profileSection");
}

function setActiveModule(moduleId) {
  document.querySelectorAll(".module-list button").forEach((button) => button.classList.toggle("active", button.dataset.moduleTarget === moduleId));
  const user = getCurrentUser();
  const visibleModuleIds = roleModules[user?.role || "guest"];
  modules.forEach((module) => {
    const section = document.getElementById(module.id);
    if (section) section.classList.toggle("hidden", !(visibleModuleIds.includes(module.id) && module.id === moduleId));
  });
}

function renderProfileForm() {
  const user = getCurrentUser();
  if (!user) {
    elements.profileForm.innerHTML = `<div class="empty-state">Login to view profile information.</div>`;
    elements.deleteProfileBtn.disabled = true;
    return;
  }

  const readOnly = user.role === "client" ? "readonly" : "";
  elements.deleteProfileBtn.disabled = user.role === "client";
  elements.profileForm.innerHTML = `
    <label><span>Full Name</span><input type="text" name="name" value="${user.name}" ${readOnly}></label>
    <label><span>Email</span><input type="email" name="email" value="${user.email}" ${readOnly}></label>
    <label><span>Phone</span><input type="text" name="phone" value="${user.phone}" ${readOnly}></label>
    <label><span>Department</span><input type="text" name="department" value="${user.department}" ${readOnly}></label>
    ${user.role === "client" ? "" : '<button class="primary-btn" type="submit">Update Profile</button>'}
  `;
}

function filteredCasesForUser() {
  const user = getCurrentUser();
  const query = elements.globalSearchInput.value.trim().toLowerCase();
  const filter = elements.caseFilterSelect.value;
  let items = [...appState.data.cases];

  if (user?.role === "client") items = items.filter((item) => item.clientId === user.id);
  if (user?.role === "lawyer") items = items.filter((item) => item.lawyerId === user.id);
  if (user?.role === "assistant") items = items.filter((item) => item.assistantId === user.id || !item.assistantId);
  if (filter !== "all") items = items.filter((item) => item.priority === filter);
  if (query) {
    items = items.filter((item) => [item.id, item.title, item.type, item.status, item.priority, getUserName(item.clientId), getUserName(item.lawyerId)].join(" ").toLowerCase().includes(query));
  }
  return items;
}

function renderCaseForm() {
  const user = getCurrentUser();
  const canEdit = user && ["assistant", "lawyer", "admin"].includes(user.role);
  const lawyers = appState.data.users.filter((item) => item.role === "lawyer");
  const clients = appState.data.users.filter((item) => item.role === "client");
  const assistants = appState.data.users.filter((item) => item.role === "assistant");
  if (!canEdit) {
    elements.caseForm.innerHTML = `<div class="empty-state">This role can only view available case information.</div>`;
    return;
  }

  const editing = appState.data.cases.find((item) => item.id === appState.editingCaseId);
  elements.caseForm.innerHTML = `
    <label><span>Case Title</span><input type="text" name="title" value="${editing?.title || ""}" placeholder="Enter case title" required></label>
    <label><span>Case Type</span><select name="type" required>${["Civil", "Corporate", "Criminal", "Family", "Property"].map((item) => `<option value="${item}" ${editing?.type === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>
    <label><span>Client</span><select name="clientId" required>${clients.map((item) => `<option value="${item.id}" ${editing?.clientId === item.id ? "selected" : ""}>${item.name}</option>`).join("")}</select></label>
    <label><span>Assigned Lawyer</span><select name="lawyerId" required>${lawyers.map((item) => `<option value="${item.id}" ${editing?.lawyerId === item.id ? "selected" : ""}>${item.name}</option>`).join("")}</select></label>
    <label><span>Assigned Assistant</span><select name="assistantId" required>${assistants.map((item) => `<option value="${item.id}" ${editing?.assistantId === item.id ? "selected" : ""}>${item.name}</option>`).join("")}</select></label>
    <label><span>Priority</span><select name="priority" required>${["High", "Medium", "Low"].map((item) => `<option value="${item}" ${editing?.priority === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>
    <label><span>Status</span><select name="status" required>${["New", "Review", "In Progress", "Closed"].map((item) => `<option value="${item}" ${editing?.status === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>
    <label><span>Hearing / Review Date</span><input type="date" name="hearingDate" value="${editing?.hearingDate || ""}" required></label>
    <label class="full-span"><span>Notes</span><textarea name="notes" rows="4" placeholder="Add case details and instructions" required>${editing?.notes || ""}</textarea></label>
    <button class="primary-btn" type="submit">${editing ? "Update Case" : "Create Case"}</button>
  `;
}

function renderCaseTable() {
  const user = getCurrentUser();
  const items = filteredCasesForUser();
  if (!items.length) {
    elements.caseTableBody.innerHTML = `<tr><td colspan="7"><div class="empty-state">No matching case records found.</div></td></tr>`;
    return;
  }

  elements.caseTableBody.innerHTML = items.map((item) => `
    <tr>
      <td>${item.id}</td>
      <td>${item.title}<div class="meta">${item.type} • Hearing ${item.hearingDate}</div></td>
      <td>${getUserName(item.clientId)}</td>
      <td>${getUserName(item.lawyerId)}</td>
      <td><span class="status-tag">${item.status}</span></td>
      <td><span class="priority-tag">${item.priority}</span></td>
      <td>${user && ["assistant", "lawyer", "admin"].includes(user.role) ? `<button class="table-btn" data-edit-case="${item.id}" type="button">Edit</button>` : ""}${user && ["assistant", "admin"].includes(user.role) ? ` <button class="table-btn" data-delete-case="${item.id}" type="button">Delete</button>` : ""}</td>
    </tr>
  `).join("");
}

function renderAppointmentForm() {
  const user = getCurrentUser();
  if (!user) {
    elements.appointmentForm.innerHTML = `<div class="empty-state">Login to manage appointments.</div>`;
    return;
  }

  const editing = appState.data.appointments.find((item) => item.id === appState.editingAppointmentId);
  const lawyers = appState.data.users.filter((item) => item.role === "lawyer");
  const assistants = appState.data.users.filter((item) => item.role === "assistant");
  const canManage = ["client", "assistant", "admin"].includes(user.role);
  if (!canManage) {
    elements.appointmentForm.innerHTML = `<div class="empty-state">This role can only view schedule-related updates elsewhere.</div>`;
    return;
  }

  elements.appointmentForm.innerHTML = `
    <label><span>Lawyer</span><select name="lawyerId" required>${lawyers.map((item) => `<option value="${item.id}" ${editing?.lawyerId === item.id ? "selected" : ""}>${item.name}</option>`).join("")}</select></label>
    <label><span>Assistant</span><select name="assistantId" required>${assistants.map((item) => `<option value="${item.id}" ${editing?.assistantId === item.id ? "selected" : ""}>${item.name}</option>`).join("")}</select></label>
    <label><span>Date</span><input type="date" name="date" value="${editing?.date || ""}" required></label>
    <label><span>Time</span><input type="time" name="time" value="${editing?.time || ""}" required></label>
    <label><span>Appointment Type</span><select name="type" required>${["Consultation", "Case Review", "Documentation", "Follow-up"].map((item) => `<option value="${item}" ${editing?.type === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>
    <label><span>Status</span><select name="status" required>${["Pending", "Confirmed", "Cancelled"].map((item) => `<option value="${item}" ${editing?.status === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>
    <label><span>Payment</span><select name="payment" required>${["Unpaid", "Paid"].map((item) => `<option value="${item}" ${editing?.payment === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>
    <button class="primary-btn" type="submit">${editing ? "Update Appointment" : "Request Appointment"}</button>
  `;
}

function renderAppointments() {
  const user = getCurrentUser();
  if (!user) {
    elements.appointmentList.innerHTML = `<div class="empty-state">No active appointment session.</div>`;
    return;
  }

  let items = [...appState.data.appointments];
  if (user.role === "client") items = items.filter((item) => item.clientId === user.id);
  if (user.role === "lawyer") items = items.filter((item) => item.lawyerId === user.id);
  if (user.role === "assistant") items = items.filter((item) => item.assistantId === user.id);

  elements.appointmentList.innerHTML = items.length ? items.map((item) => `
    <article class="entry-card">
      <div class="entry-row">
        <div><h4>${item.type}</h4><p>${item.date} at ${item.time}</p></div>
        <div class="tag-row"><span class="status-tag">${item.status}</span><span class="priority-tag">${item.payment}</span></div>
      </div>
      <p>Client: ${getUserName(item.clientId)}</p>
      <p>Lawyer: ${getUserName(item.lawyerId)} • Assistant: ${getUserName(item.assistantId)}</p>
      <div class="action-row">${["client", "assistant", "admin"].includes(user.role) ? `<button class="table-btn" data-edit-appointment="${item.id}" type="button">Edit</button> <button class="table-btn" data-cancel-appointment="${item.id}" type="button">Cancel</button>` : ""}</div>
    </article>
  `).join("") : `<div class="empty-state">No appointments available for this role.</div>`;
}

function renderScheduleForm() {
  const user = getCurrentUser();
  const canManage = user && ["lawyer", "assistant", "admin"].includes(user.role);
  if (!canManage) {
    elements.scheduleForm.innerHTML = `<div class="empty-state">Only lawyers, assistants, and admins can manage schedules.</div>`;
    return;
  }

  const editing = appState.data.schedules.find((item) => item.id === appState.editingScheduleId);
  const lawyers = appState.data.users.filter((item) => item.role === "lawyer");
  elements.scheduleForm.innerHTML = `
    <label><span>Lawyer</span><select name="lawyerId" required>${lawyers.map((item) => `<option value="${item.id}" ${editing?.lawyerId === item.id ? "selected" : ""}>${item.name}</option>`).join("")}</select></label>
    <label><span>Title</span><input type="text" name="title" value="${editing?.title || ""}" placeholder="Schedule title" required></label>
    <label><span>Date</span><input type="date" name="date" value="${editing?.date || ""}" required></label>
    <label><span>Time</span><input type="time" name="time" value="${editing?.time || ""}" required></label>
    <label><span>Category</span><select name="category" required>${["Appointment", "Court Date", "Internal Meeting", "Reminder"].map((item) => `<option value="${item}" ${editing?.category === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>
    <label><span>Reminder</span><select name="reminder" required>${["Enabled", "Disabled"].map((item) => `<option value="${item}" ${editing?.reminder === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>
    <button class="primary-btn" type="submit">${editing ? "Update Schedule" : "Add Schedule Item"}</button>
  `;
}

function renderSchedules() {
  const user = getCurrentUser();
  if (!user) {
    elements.scheduleList.innerHTML = `<div class="empty-state">Login to see schedule entries.</div>`;
    return;
  }

  let items = [...appState.data.schedules];
  if (user.role === "lawyer") items = items.filter((item) => item.lawyerId === user.id);

  elements.scheduleList.innerHTML = items.length ? items.map((item) => `
    <article class="entry-card">
      <div class="entry-row">
        <div><h4>${item.title}</h4><p>${item.date} at ${item.time}</p></div>
        <div class="tag-row"><span class="status-tag">${item.category}</span><span class="priority-tag">${item.reminder}</span></div>
      </div>
      <p>Lawyer: ${getUserName(item.lawyerId)}</p>
      <div class="action-row">${["lawyer", "assistant", "admin"].includes(user.role) ? `<button class="table-btn" data-edit-schedule="${item.id}" type="button">Edit</button> <button class="table-btn" data-delete-schedule="${item.id}" type="button">Delete</button>` : ""}</div>
    </article>
  `).join("") : `<div class="empty-state">No schedule entries found.</div>`;
}

function renderDocumentForm() {
  const user = getCurrentUser();
  const canManage = user && ["lawyer", "admin"].includes(user.role);
  if (!canManage) {
    elements.documentForm.innerHTML = `<div class="empty-state">This role can only view allowed documents.</div>`;
    return;
  }

  const editing = appState.data.documents.find((item) => item.id === appState.editingDocumentId);
  const cases = appState.data.cases;
  const clients = appState.data.users.filter((item) => item.role === "client");
  elements.documentForm.innerHTML = `
    <label><span>Document Name</span><input type="text" name="name" value="${editing?.name || ""}" placeholder="Document title" required></label>
    <label><span>Case</span><select name="caseId" required>${cases.map((item) => `<option value="${item.id}" ${editing?.caseId === item.id ? "selected" : ""}>${item.id} • ${item.title}</option>`).join("")}</select></label>
    <label><span>Client</span><select name="clientId" required>${clients.map((item) => `<option value="${item.id}" ${editing?.clientId === item.id ? "selected" : ""}>${item.name}</option>`).join("")}</select></label>
    <label><span>Category</span><select name="category" required>${["Evidence", "Agreement", "Petition", "Financial", "Notice"].map((item) => `<option value="${item}" ${editing?.category === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>
    <label><span>Updated On</span><input type="date" name="updatedOn" value="${editing?.updatedOn || ""}" required></label>
    <label><span>Access</span><select name="access" required>${["Internal Only", "Client View"].map((item) => `<option value="${item}" ${editing?.access === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>
    <button class="primary-btn" type="submit">${editing ? "Update Document" : "Add Document"}</button>
  `;
}

function renderDocuments() {
  const user = getCurrentUser();
  if (!user) {
    elements.documentList.innerHTML = `<div class="empty-state">Login to view document access.</div>`;
    return;
  }

  let items = [...appState.data.documents];
  if (user.role === "client") items = items.filter((item) => item.clientId === user.id && item.access === "Client View");
  if (user.role === "lawyer") items = items.filter((item) => item.ownerId === user.id || item.access === "Client View");

  elements.documentList.innerHTML = items.length ? items.map((item) => `
    <article class="entry-card">
      <div class="entry-row">
        <div><h4>${item.name}</h4><p>Case: ${item.caseId}</p></div>
        <div class="tag-row"><span class="status-tag">${item.category}</span><span class="priority-tag">${item.access}</span></div>
      </div>
      <p>Client: ${getUserName(item.clientId)} • Updated: ${item.updatedOn}</p>
      <div class="action-row">${["lawyer", "admin"].includes(user.role) ? `<button class="table-btn" data-edit-document="${item.id}" type="button">Edit</button> <button class="table-btn" data-delete-document="${item.id}" type="button">Delete</button>` : ""}</div>
    </article>
  `).join("") : `<div class="empty-state">No documents available for this role.</div>`;
}

function renderNotifications() {
  const user = getCurrentUser();
  if (!user) {
    elements.notificationList.innerHTML = `<div class="empty-state">Notifications appear after login.</div>`;
    return;
  }
  const items = user.role === "admin" ? appState.data.notifications : appState.data.notifications.filter((item) => item.userId === user.id);
  elements.notificationList.innerHTML = items.length ? items.map((item) => `<article class="entry-card"><h4>${item.title}</h4><p>${item.message}</p><p class="meta">${item.date}</p></article>`).join("") : `<div class="empty-state">No notifications available.</div>`;
}

function renderReportForm() {
  const user = getCurrentUser();
  if (!user || user.role !== "admin") {
    elements.reportForm.innerHTML = `<div class="empty-state">Only the admin can assign roles and generate reports.</div>`;
    elements.reportBox.innerHTML = `<h4>Report Output</h4><p>Login as admin to generate system reports and update user roles.</p>`;
    return;
  }

  const selectableUsers = appState.data.users.filter((item) => item.role !== "admin");
  elements.reportForm.innerHTML = `
    <label><span>User</span><select name="userId" required>${selectableUsers.map((item) => `<option value="${item.id}">${item.name}</option>`).join("")}</select></label>
    <label><span>Assign Role</span><select name="role" required>${["client", "lawyer", "assistant"].map((item) => `<option value="${item}">${titleCase(item)}</option>`).join("")}</select></label>
    <label><span>Report Type</span><select name="reportType" required>${["System Summary", "Case Summary", "Appointment Summary", "User Summary"].map((item) => `<option value="${item}">${item}</option>`).join("")}</select></label>
    <button class="primary-btn" type="submit">Apply & Generate</button>
  `;
  renderReportBox("System Summary");
}

function renderReportBox(type) {
  const reportMap = {
    "System Summary": `Total users: ${appState.data.users.length}, total cases: ${appState.data.cases.length}, total appointments: ${appState.data.appointments.length}, total documents: ${appState.data.documents.length}.`,
    "Case Summary": `${appState.data.cases.filter((item) => item.status === "In Progress").length} cases are in progress and ${appState.data.cases.filter((item) => item.priority === "High").length} cases are marked high priority.`,
    "Appointment Summary": `${appState.data.appointments.filter((item) => item.status === "Confirmed").length} appointments are confirmed and ${appState.data.appointments.filter((item) => item.payment === "Paid").length} payments are completed.`,
    "User Summary": `Roles in system: ${appState.data.users.map((item) => titleCase(item.role)).join(", ")}. Verified users: ${appState.data.users.filter((item) => item.verified).length}.`
  };
  elements.reportBox.innerHTML = `<h4>${type}</h4><p>${reportMap[type]}</p>`;
}

function renderAll() {
  renderStats();
  renderBackendStatus();
  renderUserBanner();
  renderModules();
  renderProfileForm();
  renderCaseForm();
  renderCaseTable();
  renderAppointmentForm();
  renderAppointments();
  renderScheduleForm();
  renderSchedules();
  renderDocumentForm();
  renderDocuments();
  renderNotifications();
  renderReportForm();
  const user = getCurrentUser();
  elements.dashboardTitle.textContent = user ? `${titleCase(user.role)} dashboard and project modules` : "All project features in one interface";
}

function bindEvents() {
  elements.authTabs.forEach((button) => button.addEventListener("click", () => switchAuthTab(button.dataset.authTab)));

  elements.loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email").trim().toLowerCase();
    const password = formData.get("password").trim();
    const user = appState.data.users.find((item) => item.email.toLowerCase() === email && item.password === password);
    if (!user) return showToast("Invalid email or password.");
    appState.currentUserId = user.id;
    saveSession();
    renderAll();
    showToast(`Welcome back, ${user.name}.`);
  });

  elements.registerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email").trim().toLowerCase();
    if (appState.data.users.some((item) => item.email.toLowerCase() === email)) return showToast("This email is already registered.");
    const user = {
      id: `u-${Date.now()}`,
      name: formData.get("name").trim(),
      email,
      password: formData.get("password").trim(),
      role: formData.get("role"),
      phone: formData.get("phone").trim(),
      department: formData.get("department").trim(),
      verified: false
    };
    appState.data.users.push(user);
    addNotification("u-admin", "Profile Verifying Notification", `${user.name} registered and needs profile verification.`);
    saveData();
    switchAuthTab("login");
    event.currentTarget.reset();
    renderAll();
    showToast("Registration complete. Please login.");
  });

  elements.recoverForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = new FormData(event.currentTarget).get("email").trim().toLowerCase();
    const user = appState.data.users.find((item) => item.email.toLowerCase() === email);
    if (!user) return showToast("No account found for this email.");
    event.currentTarget.reset();
    showToast(`Recovery notice sent to ${user.email}.`);
  });

  if (elements.logoutBtn) {
    elements.logoutBtn.addEventListener("click", () => {
      appState.currentUserId = null;
      saveSession();
      renderAll();
      showToast("Logged out successfully.");
    });
  }

  if (elements.loadDemoBtn) {
    elements.loadDemoBtn.addEventListener("click", () => {
      appState.data = seedDemoData();
      appState.currentUserId = null;
      appState.editingCaseId = null;
      appState.editingAppointmentId = null;
      appState.editingScheduleId = null;
      appState.editingDocumentId = null;
      saveData();
      saveSession();
      renderAll();
      showToast("System data reset.");
    });
  }

  elements.moduleList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-module-target]");
    if (button) setActiveModule(button.dataset.moduleTarget);
  });

  elements.profileForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const user = getCurrentUser();
    if (!user || user.role === "client") return;
    const formData = new FormData(event.currentTarget);
    user.name = formData.get("name").trim();
    user.email = formData.get("email").trim();
    user.phone = formData.get("phone").trim();
    user.department = formData.get("department").trim();
    saveData();
    renderAll();
    showToast("Profile updated.");
  });

  elements.deleteProfileBtn.addEventListener("click", () => {
    const user = getCurrentUser();
    if (!user || user.role === "client") return showToast("Client accounts are view-only.");
    appState.data.users = appState.data.users.filter((item) => item.id !== user.id);
    appState.data.notifications = appState.data.notifications.filter((item) => item.userId !== user.id);
    appState.currentUserId = null;
    saveData();
    saveSession();
    renderAll();
    showToast("Profile deleted.");
  });

  elements.caseForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!getCurrentUser()) return;
    const formData = new FormData(event.currentTarget);
    const payload = {
      id: appState.editingCaseId || createId("C"),
      title: formData.get("title").trim(),
      type: formData.get("type"),
      clientId: formData.get("clientId"),
      lawyerId: formData.get("lawyerId"),
      assistantId: formData.get("assistantId"),
      priority: formData.get("priority"),
      status: formData.get("status"),
      hearingDate: formData.get("hearingDate"),
      notes: formData.get("notes").trim()
    };
    if (appState.editingCaseId) {
      const index = appState.data.cases.findIndex((item) => item.id === appState.editingCaseId);
      appState.data.cases[index] = payload;
      showToast("Case updated.");
    } else {
      appState.data.cases.unshift(payload);
      addNotification(payload.clientId, "Case Status Notification", `Your case "${payload.title}" has been created.`);
      showToast("Case created.");
    }
    appState.editingCaseId = null;
    saveData();
    renderAll();
  });

  elements.caseTableBody.addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-edit-case]");
    const deleteButton = event.target.closest("[data-delete-case]");
    if (editButton) {
      appState.editingCaseId = editButton.dataset.editCase;
      renderCaseForm();
      showToast("Case loaded into the form.");
    }
    if (deleteButton) {
      appState.data.cases = appState.data.cases.filter((item) => item.id !== deleteButton.dataset.deleteCase);
      saveData();
      renderAll();
      showToast("Case deleted.");
    }
  });

  elements.appointmentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const user = getCurrentUser();
    if (!user) return;
    const formData = new FormData(event.currentTarget);
    const payload = {
      id: appState.editingAppointmentId || createId("A"),
      clientId: user.role === "client" ? user.id : appState.data.users.find((item) => item.role === "client")?.id || "",
      lawyerId: formData.get("lawyerId"),
      assistantId: formData.get("assistantId"),
      date: formData.get("date"),
      time: formData.get("time"),
      type: formData.get("type"),
      status: formData.get("status"),
      payment: formData.get("payment")
    };
    if (appState.editingAppointmentId) {
      const index = appState.data.appointments.findIndex((item) => item.id === appState.editingAppointmentId);
      appState.data.appointments[index] = payload;
      showToast("Appointment updated.");
    } else {
      appState.data.appointments.unshift(payload);
      addNotification(payload.clientId, "Take Appointment Notification", "Your appointment request has been submitted.");
      showToast("Appointment requested.");
    }
    appState.editingAppointmentId = null;
    saveData();
    renderAll();
  });

  elements.appointmentList.addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-edit-appointment]");
    const cancelButton = event.target.closest("[data-cancel-appointment]");
    if (editButton) {
      appState.editingAppointmentId = editButton.dataset.editAppointment;
      renderAppointmentForm();
      showToast("Appointment loaded into the form.");
    }
    if (cancelButton) {
      const appointment = appState.data.appointments.find((item) => item.id === cancelButton.dataset.cancelAppointment);
      if (appointment) appointment.status = "Cancelled";
      saveData();
      renderAll();
      showToast("Appointment cancelled.");
    }
  });

  elements.scheduleForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      id: appState.editingScheduleId || createId("S"),
      lawyerId: formData.get("lawyerId"),
      title: formData.get("title").trim(),
      date: formData.get("date"),
      time: formData.get("time"),
      category: formData.get("category"),
      reminder: formData.get("reminder")
    };
    if (appState.editingScheduleId) {
      const index = appState.data.schedules.findIndex((item) => item.id === appState.editingScheduleId);
      appState.data.schedules[index] = payload;
      showToast("Schedule updated.");
    } else {
      appState.data.schedules.unshift(payload);
      addNotification(payload.lawyerId, "Hearing Date Notification", `${payload.title} scheduled for ${payload.date}.`);
      showToast("Schedule item created.");
    }
    appState.editingScheduleId = null;
    saveData();
    renderAll();
  });

  elements.scheduleList.addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-edit-schedule]");
    const deleteButton = event.target.closest("[data-delete-schedule]");
    if (editButton) {
      appState.editingScheduleId = editButton.dataset.editSchedule;
      renderScheduleForm();
      showToast("Schedule loaded into the form.");
    }
    if (deleteButton) {
      appState.data.schedules = appState.data.schedules.filter((item) => item.id !== deleteButton.dataset.deleteSchedule);
      saveData();
      renderAll();
      showToast("Schedule entry deleted.");
    }
  });

  elements.documentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const user = getCurrentUser();
    if (!user) return;
    const formData = new FormData(event.currentTarget);
    const payload = {
      id: appState.editingDocumentId || createId("D"),
      caseId: formData.get("caseId"),
      ownerId: user.id,
      clientId: formData.get("clientId"),
      name: formData.get("name").trim(),
      category: formData.get("category"),
      updatedOn: formData.get("updatedOn"),
      access: formData.get("access")
    };
    if (appState.editingDocumentId) {
      const index = appState.data.documents.findIndex((item) => item.id === appState.editingDocumentId);
      appState.data.documents[index] = payload;
      showToast("Document updated.");
    } else {
      appState.data.documents.unshift(payload);
      addNotification(payload.clientId, "Document Update Notification", `${payload.name} was added to your case documents.`);
      showToast("Document added.");
    }
    appState.editingDocumentId = null;
    saveData();
    renderAll();
  });

  elements.documentList.addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-edit-document]");
    const deleteButton = event.target.closest("[data-delete-document]");
    if (editButton) {
      appState.editingDocumentId = editButton.dataset.editDocument;
      renderDocumentForm();
      showToast("Document loaded into the form.");
    }
    if (deleteButton) {
      appState.data.documents = appState.data.documents.filter((item) => item.id !== deleteButton.dataset.deleteDocument);
      saveData();
      renderAll();
      showToast("Document deleted.");
    }
  });

  elements.reportForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const user = getCurrentUser();
    if (!user || user.role !== "admin") return;
    const formData = new FormData(event.currentTarget);
    const targetUser = appState.data.users.find((item) => item.id === formData.get("userId"));
    if (targetUser) targetUser.role = formData.get("role");
    saveData();
    renderAll();
    renderReportBox(formData.get("reportType"));
    showToast("Role updated and report generated.");
  });

  elements.globalSearchInput.addEventListener("input", renderCaseTable);
  elements.caseFilterSelect.addEventListener("change", renderCaseTable);
}

loadData();
bindEvents();
renderAll();
fetchBackendStatus();
