const STORAGE_KEY = "lexbridge-data-v1";
const SESSION_KEY = "lexbridge-session-v1";
const LAWYER_TOKEN_KEY = "lawyer_token";
const LAWYER_ID_KEY = "lawyer_id";
const LAWYER_NAME_KEY = "lawyer_name";

const modules = [
  { id: "profileSection", title: "Profile", text: "View and manage user profile information." },
  { id: "notificationSection", title: "Inbox", text: "Messages and alerts regarding your cases." },
  { id: "appointmentSection", title: "Book Appointment", text: "Schedule a consultation with our legal team." },
  { id: "clientCaseSection", title: "Case Status", text: "Track your active cases and manage documents." },
  { id: "userManagementSection", title: "User Management", text: "Assign roles, update permissions, and manage all users." },
  { id: "reportSection", title: "Report Generation", text: "Generate detailed system, transaction, and activity summaries." }
];

const roleModules = {
  guest: [],
  client: ["profileSection", "notificationSection", "appointmentSection", "clientCaseSection"],
  lawyer: ["profileSection", "notificationSection"],
  assistant: ["profileSection", "notificationSection"],
  admin: ["profileSection", "notificationSection", "userManagementSection", "reportSection"]
};

const appState = {
  data: null,
  currentUserId: null,
  activeModuleId: null,
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
  statsGrid: document.getElementById("statsGrid"),
  backendStatusBox: document.getElementById("backendStatusBox"),
  userBanner: document.getElementById("userBanner"),
  moduleList: document.getElementById("moduleList"),
  adminNav: document.getElementById("adminNav"),
  dashboardTitle: document.getElementById("dashboardTitle"),
  profileForm: document.getElementById("profileForm"),
  deleteProfileBtn: document.getElementById("deleteProfileBtn"),
  notificationList: document.getElementById("notificationList"),
  deleteSelectedNotificationsBtn: document.getElementById("deleteSelectedNotifications"),
  scrollToTopBtn: document.getElementById("scrollToTopBtn"),
  userManagementForm: document.getElementById("userManagementForm"),
  userTableBody: document.getElementById("userTableBody"),
  reportOutputBox: document.getElementById("reportOutputBox"),
  reportOutputText: document.getElementById("reportOutputText"),
  reportTitle: document.getElementById("reportTitle"),
  genDetailsReportBtn: document.getElementById("genDetailsReportBtn"),
  genTransReportBtn: document.getElementById("genTransReportBtn"),
  reportRangeSelect: document.getElementById("reportRangeSelect"),
  toast: document.getElementById("toast"),
  sessionSummary: document.getElementById("sessionSummary"),
  clientStatusBadge: document.getElementById("clientStatusBadge")
};

function seedDemoData() {
  return {
    users: [
      { id: "u-admin", name: "Md. Asif Iqbal", email: "asif@gmail.com", password: "asif123", role: "admin", phone: "01887372093", department: "Admin", verified: true, status: "active" },
      { id: "u-lawyer", name: "Barrister Nadia Rahman", email: "lawyer@lexbridge.com", password: "123456", role: "lawyer", phone: "+880 1700-222222", department: "Corporate Law", verified: true, status: "active" },
      { id: "u-assistant", name: "Imran Hossain", email: "assistant@lexbridge.com", password: "123456", role: "assistant", phone: "+880 1700-333333", department: "Case Operations", verified: true, status: "active" },
      { id: "u-client", name: "Sadia Karim", email: "client@lexbridge.com", password: "123456", role: "client", phone: "+880 1700-444444", department: "Client", verified: true, status: "active" }
    ],
    cases: [
      { id: "C-1024", title: "Property Dispute Review", client: "Sadia Karim", clientId: "u-client", lawyerId: "u-lawyer", assistantId: "u-assistant", type: "Civil", priority: "High", status: "In Progress", hearingDate: "2026-04-18", notes: "Evidence checklist updated and hearing prepared." },
      { id: "C-1025", title: "Startup Incorporation", client: "Sadia Karim", clientId: "u-client", lawyerId: "u-lawyer", assistantId: "u-assistant", type: "Corporate", priority: "Medium", status: "Review", hearingDate: "2026-04-22", notes: "Draft legal structure prepared for approval." },
      { id: "C-1026", title: "Family Law #201", client: "Sadia Karim", clientId: "u-client", lawyerId: "u-lawyer", assistantId: "u-assistant", type: "Family", priority: "Low", status: "In Progress" }
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
    ],
    transactions: [
      { id: "TX-781", client: "Sadia Karim", amount: 250, status: "Confirmed", date: "2026-04-01" },
      { id: "TX-782", client: "Barrister Nadia", amount: 1200, status: "Confirmed", date: "2026-04-05" },
      { id: "TX-783", client: "Imran Hossain", amount: 800, status: "Pending", date: "2026-04-10" }
    ]
  };
}

async function loadData() {
  try {
    const res = await fetch("/api/load");
    const cloudData = await res.json();

    if (cloudData) {
      appState.data = cloudData;
    } else {
      const saved = localStorage.getItem(STORAGE_KEY);
      appState.data = saved ? JSON.parse(saved) : seedDemoData();
    }
  } catch (e) {
    console.warn("Using local fallback:", e);
    const saved = localStorage.getItem(STORAGE_KEY);
    appState.data = saved ? JSON.parse(saved) : seedDemoData();
  }

  if (appState.data && appState.data.users) {
    const adminIndex = appState.data.users.findIndex(u => u.email === "asif@gmail.com");
    const adminUser = {
      id: "u-admin-asif",
      name: "Md. Asif Iqbal",
      email: "asif@gmail.com",
      password: "asif123",
      role: "admin",
      phone: "01887372093",
      department: "Admin",
      verified: true,
      status: "active"
    };

    if (adminIndex === -1) {
      appState.data.users.push(adminUser);
      console.log("Admin account created.");
    } else {
      appState.data.users[adminIndex] = { ...appState.data.users[adminIndex], ...adminUser };
      console.log("Admin account verified and enforced.");
    }
    await saveData(); // Always sync cloud to ensure credentials match
  }


  appState.currentUserId = localStorage.getItem(SESSION_KEY) || null;

  // URL Cleanup: Enforce strict path-based visibility
  const user = getCurrentUser();
  const path = window.location.pathname;

  if (!user && path !== "/" && !path.includes(".html")) {
    window.history.replaceState(null, "", "/");
  }

  renderAll();
}

async function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState.data));
  try {
    await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(appState.data)
    });
  } catch (e) {
    console.error("Cloud save failed:", e);
  }
}
function saveSession() { appState.currentUserId ? localStorage.setItem(SESSION_KEY, appState.currentUserId) : localStorage.removeItem(SESSION_KEY); }
function getCurrentUser() { return appState.data.users.find((user) => user.id === appState.currentUserId) || null; }
function titleCase(value) { return value.charAt(0).toUpperCase() + value.slice(1); }

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => elements.toast.classList.remove("show"), 2800);
}

function clearLawyerDashboardSession() {
  localStorage.removeItem(LAWYER_TOKEN_KEY);
  localStorage.removeItem(LAWYER_ID_KEY);
  localStorage.removeItem(LAWYER_NAME_KEY);
}

function setLawyerDashboardSession(user) {
  localStorage.setItem(LAWYER_TOKEN_KEY, `legacy-token-${user.id}`);
  localStorage.setItem(LAWYER_ID_KEY, user.id);
  localStorage.setItem(LAWYER_NAME_KEY, user.name);
}

function switchAuthTab(tabName) {
  if (elements.authTabs.length) {
    elements.authTabs.forEach((button) => button.classList.toggle("active", button.dataset.authTab === tabName));
  }
  Object.entries(elements.authViews).forEach(([name, section]) => {
    if (section) section.classList.toggle("active", name === tabName);
  });
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
  const stats = [{ label: "Total Users", value: appState.data.users.length }, { label: "Active Sessions", value: appState.currentUserId ? 1 : 0 }];
  elements.statsGrid.innerHTML = stats.map((item) => `<article class="mini-card"><h3>${item.value}</h3><p>${item.label}</p></article>`).join("");
}

function renderUserBanner() {
  const user = getCurrentUser();
  if (!user) {
    elements.userBanner.innerHTML = `<div><p class="section-kicker">Current Session</p><h3>No active user</h3><p>Login or create a new account.</p></div><span class="role-badge">Guest</span>`;
    return;
  }
  elements.userBanner.innerHTML = `<div><p class="section-kicker">Current Session</p><h3>${user.name}</h3><p>${user.email} - ${titleCase(user.role)} - ${user.department}</p></div><span class="role-badge" data-role="${user.role}">${titleCase(user.role)}</span>`;
}

function renderBackendStatus() {
  elements.backendStatusBox.innerHTML = `<h4>Backend Status</h4><p>${appState.backendStatus.server}</p><p>${appState.backendStatus.database}</p>`;
}

async function fetchBackendStatus() {
  try {
    const res = await fetch("/api/health");
    if (res.ok) {
      const data = await res.json();
      appState.backendStatus.server = `Server: Online (${data.runtime})`;
      const dbRes = await fetch("/api/db-check");
      if (dbRes.ok) appState.backendStatus.database = "Database: Connected to Neon PG";
      else appState.backendStatus.database = "Database: Connection failed";
    }
  } catch (e) {
    appState.backendStatus.server = "Server: Offline";
    appState.backendStatus.database = "Database: N/A";
  }
  renderBackendStatus();
}

function renderModules() {
  const user = getCurrentUser();
  const visibleIds = roleModules[user?.role || "guest"];

  if (elements.moduleList) {
    elements.moduleList.innerHTML = modules
      .filter(m => visibleIds.includes(m.id))
      .map(m => `
        <button class="module-card" data-module-target="${m.id}" type="button">
          <div class="module-icon">${m.title.charAt(0)}</div>
          <div class="module-info">
            <strong>${m.title}</strong>
            <span>${m.text}</span>
          </div>
        </button>`).join("");
  }

  const userNavLinks = document.getElementById("userNavLinks");
  if (userNavLinks) {
    if (user) {
      userNavLinks.innerHTML = modules
        .filter(m => visibleIds.includes(m.id))
        .map(m => `<a href="#" class="nav-link" data-module-target="${m.id}">${m.title}</a>`).join("");
    } else {
      userNavLinks.innerHTML = "";
    }
  }

  if (elements.adminNav) {
    if (user?.role === "admin") {
      elements.adminNav.innerHTML = modules.filter(m => visibleIds.includes(m.id)).map(m => `<button data-module-target="${m.id}" type="button">${m.title}</button>`).join("");
      elements.adminNav.classList.remove("hidden");
    } else {
      elements.adminNav.classList.add("hidden");
    }
  }
  if (!appState.activeModuleId) {
    if (user?.role === "admin") appState.activeModuleId = "userManagementSection";
    else if (user?.role === "client") appState.activeModuleId = "appointmentSection";
    else appState.activeModuleId = visibleIds[0] || "profileSection";
  }
  if (!visibleIds.includes(appState.activeModuleId)) appState.activeModuleId = visibleIds[0] || "profileSection";
  setActiveModule(appState.activeModuleId);
}

function renderSessionSummary() {
  if (!elements.sessionSummary) return;
  const user = getCurrentUser();

  if (!user) {
    elements.sessionSummary.textContent = "";
    elements.sessionSummary.classList.add("hidden");
    return;
  }

  const portalLabel = {
    client: "Client Workspace",
    assistant: "Assistant Workspace",
    lawyer: "Lawyer Workspace",
    admin: "Admin Workspace"
  }[user.role] || "User Workspace";

  elements.sessionSummary.innerHTML = `
    <span class="session-pill">${titleCase(user.role)}</span>
    <div>
      <strong>${portalLabel}</strong>
      <span>${user.name}</span>
    </div>
  `;
  elements.sessionSummary.classList.remove("hidden");
}

function renderClientStatusBadge() {
  if (!elements.clientStatusBadge) return;
  const user = getCurrentUser();

  if (!user || user.role !== "client") {
    elements.clientStatusBadge.textContent = "";
    elements.clientStatusBadge.classList.add("hidden");
    return;
  }

  const appointments = (appState.data.appointments || []).filter((appt) => appt.clientId === user.id);
  const pendingCount = appointments.filter((appt) => appt.status === "Pending").length;
  const confirmedCount = appointments.filter((appt) => appt.status === "Confirmed").length;

  elements.clientStatusBadge.textContent = pendingCount
    ? `${pendingCount} booking pending assistant review`
    : confirmedCount
      ? `${confirmedCount} confirmed appointment${confirmedCount > 1 ? "s" : ""}`
      : "Ready to request a consultation";

  elements.clientStatusBadge.classList.remove("hidden");
}

function setActiveModule(id) {
  appState.activeModuleId = id;
  const user = getCurrentUser();
  const visibleIds = roleModules[user?.role || "guest"];
  document.querySelectorAll("[data-module-target]").forEach(b => b.classList.toggle("active", b.dataset.moduleTarget === id));
  modules.forEach(m => {
    const sec = document.getElementById(m.id);
    if (sec) sec.classList.toggle("hidden", !(visibleIds.includes(m.id) && m.id === id));
  });
}

function renderProfileForm() {
  const user = getCurrentUser();
  if (!user) {
    elements.profileForm.innerHTML = `<div class="empty-state">Login to view profile.</div>`;
    return;
  }

  const initials = user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const ro = user.role === "client" ? "readonly" : "";

  elements.profileForm.innerHTML = `
    <div class="profile-redesign-container">
      <div class="profile-summary-side">
        <div class="profile-avatar-large">${initials}</div>
        <h3>${user.name}</h3>
        <span class="role-badge" data-role="${user.role}">${titleCase(user.role)}</span>
        <p class="profile-email-sub">${user.email}</p>
        <div class="profile-meta-badges">
          <div class="meta-badge">Status: <span>Active</span></div>
          <div class="meta-badge">Verified: <span>${user.verified ? "Yes" : "No"}</span></div>
        </div>
      </div>
      <div class="profile-details-side">
        <div class="form-grid">
          <label><span>Full Name</span><input type="text" name="name" value="${user.name}" ${ro}></label>
          <label><span>Email Address</span><input type="email" name="email" value="${user.email}" ${ro}></label>
          <label><span>Phone Number</span><input type="text" name="phone" value="${user.phone}" ${ro}></label>
          <label><span>Official Occupation</span><input type="text" name="department" value="${user.department}" ${ro}></label>
        </div>
        <div class="profile-actions-row">
          ${user.role === "client" ? "" : '<button class="primary-btn prof-btn-update" type="submit">Save Changes</button>'}
          <button class="table-btn danger-action prof-btn-delete" id="deleteProfileBtn" type="button">Delete Account</button>
        </div>
      </div>
    </div>
  `;
}

function renderNotifications() {
  const user = getCurrentUser();
  if (!user) {
    elements.notificationList.innerHTML = `<div class="empty-state">Notifications appear after login.</div>`;
    return;
  }
  const items = user.role === "admin" ? appState.data.notifications : appState.data.notifications.filter(n => n.userId === user.id);
  elements.notificationList.innerHTML = items.length ? items.map(n => `
    <article class="entry-card notification-card">
      <div class="notif-grid">
        <div class="notif-check"><input type="checkbox" class="notif-checkbox" data-notif-id="${n.id}"></div>
        <div class="notif-content"><h4>${n.title}</h4><p>${n.message}</p><div class="meta">${n.date}</div></div>
        <div class="notif-actions"><button class="table-btn danger-action" data-delete-notif="${n.id}" type="button">Delete</button></div>
      </div>
    </article>`).join("") : `<div class="empty-state">No notifications.</div>`;
}

function renderUserManagementForm() {
  const user = getCurrentUser();
  if (!user || user.role !== "admin") return;
  const selectables = appState.data.users.filter(u => u.role !== "admin");
  elements.userManagementForm.innerHTML = `
    <div class="form-grid-two">
      <div class="form-grid">
        <label><span>Find and Select User</span>
          <div class="combobox-wrapper">
            <input type="text" id="userComboboxInput" placeholder="Name or email..." class="combobox-input" autocomplete="off">
            <input type="hidden" name="userId" id="selectedUserId">
            <div id="comboboxResults" class="combobox-results hidden">
              ${selectables.map(u => `<div class="combobox-item" data-id="${u.id}" data-search="${u.name.toLowerCase()} ${u.email.toLowerCase()}"><strong>${u.name}</strong> - ${titleCase(u.role)}</div>`).join("")}
            </div>
          </div>
        </label>
      </div>
      <div class="form-grid">
        <label><span>Assign/Update Role</span>
          <select name="role" required>
            <option value="">Select new role...</option>
            <option value="client">Client</option>
            <option value="lawyer">Lawyer</option>
            <option value="assistant">Assistant</option>
          </select>
        </label>
        <button class="primary-btn full-width" type="submit">Confirm Role Change</button>
      </div>
    </div>`;
}

function renderUserTable() {
  const user = getCurrentUser();
  if (!user || user.role !== "admin") return;
  elements.userTableBody.innerHTML = appState.data.users.map(u => `
    <tr>
      <td>${u.id}</td><td>${u.name}</td><td>${u.email}</td><td><span class="role-badge" data-role="${u.role}">${titleCase(u.role)}</span></td><td>${u.phone}</td>
      <td><span class="status-tag" data-status="${u.status || "active"}">${titleCase(u.status || "active")}</span></td>
      <td>${u.role !== "admin" ? `<button class="table-btn ${u.status === "blocked" ? "success-action" : "danger-action"}" data-toggle-status="${u.id}">${u.status === "blocked" ? "Enable" : "Disable"}</button>` : "Owner"}</td>
    </tr>`).join("");
}

function generateDetailsReport() {
  const range = elements.reportRangeSelect.value;
  const users = appState.data.users;
  const cases = appState.data.cases || [];

  const activeCount = users.filter(u => u.status !== "blocked").length;
  const blockedCount = users.length - activeCount;

  const openCases = cases.filter(c => c.status === "open").length;
  const closedCases = cases.filter(c => c.status === "closed").length;

  elements.reportTitle.textContent = `Details Report - ${titleCase(range)}`;
  elements.reportOutputBox.classList.remove("hidden");
  elements.reportOutputText.innerHTML = `
    <div class="report-block">
      <h5>User Activity Summary</h5>
      <p>Total Registered Users: <strong>${users.length}</strong></p>
      <p>Active Accounts: <span class="text-success" style="color: #059669; font-weight:700;">${activeCount}</span></p>
      <p>Restricted Accounts: <span class="text-danger" style="color: #dc2626; font-weight:700;">${blockedCount}</span></p>
    </div>
    <div class="report-block">
      <h5>Case Activity Summary</h5>
      <p>Total Cases Tracked: <strong>${cases.length}</strong></p>
      <p>Newly Opened / Active: <strong>${openCases}</strong></p>
      <p>Closed / Resolved: <strong>${closedCases}</strong></p>
    </div>
    <p class="report-meta">Generated by Admin on ${new Date().toLocaleString()}</p>
  `;
  showToast("Details report generated.");
}

function generateTransactionReport() {
  const range = elements.reportRangeSelect.value;
  const txs = appState.data.transactions || [];

  const totalRevenue = txs.reduce((sum, tx) => tx.status === "Confirmed" ? sum + tx.amount : sum, 0);
  const pendingRev = txs.reduce((sum, tx) => tx.status === "Pending" ? sum + tx.amount : sum, 0);

  elements.reportTitle.textContent = `Transaction Report - ${titleCase(range)}`;
  elements.reportOutputBox.classList.remove("hidden");

  let tableRows = txs.map(tx => `
    <tr>
      <td>${tx.id}</td>
      <td>${tx.client}</td>
      <td>$${tx.amount.toLocaleString()}</td>
      <td style="color: ${tx.status === "Confirmed" ? "#059669" : "#d97706"}; font-weight: 600;">${tx.status}</td>
    </tr>
  `).join("");

  elements.reportOutputText.innerHTML = `
    <div class="report-block">
      <h5>Financial Overview</h5>
      <p>Confirmed Revenue: <strong style="color: #059669; font-size: 1.25rem;">$${totalRevenue.toLocaleString()}</strong></p>
      <p>Pending Collections: <strong>$${pendingRev.toLocaleString()}</strong></p>
    </div>
    <div class="report-table-wrap">
      <table class="report-table">
        <thead><tr><th>ID</th><th>Client</th><th>Amount</th><th>Status</th></tr></thead>
        <tbody>
          ${tableRows || "<tr><td colspan='4'>No transactions found for this period.</td></tr>"}
        </tbody>
      </table>
    </div>
    <p class="report-meta">Financial data is synchronized with the Neon database.</p>
  `;
  showToast("Transaction report generated.");
}

function renderAll() {
  renderStats();
  renderBackendStatus();
  renderUserBanner();
  renderModules();
  renderSessionSummary();
  renderClientStatusBadge();
  renderProfileForm();
  renderNotifications();
  renderUserManagementForm();
  renderUserTable();

  const user = getCurrentUser();
  const isAdmin = user && user.role === "admin";

  // Visibility paths
  const path = window.location.pathname;
  const isLandingPage = path === "/" || path.includes("index.html");
  const showDashboard = user && !isLandingPage;

  // Visibility Logic
  document.getElementById("authSection").classList.toggle("hidden", showDashboard);
  document.querySelector(".hero-grid").classList.toggle("hidden", showDashboard);
  document.getElementById("dashboardSection").classList.toggle("hidden", !showDashboard);

  // System Overview is admin-only, and only inside the dashboard
  const summarySec = document.getElementById("summarySection");
  const navOverview = document.getElementById("navOverview");
  if (summarySec) summarySec.classList.toggle("hidden", !isAdmin || !showDashboard);
  if (navOverview) navOverview.classList.toggle("hidden", !isAdmin || !showDashboard);

  const modSec = document.getElementById("moduleSection");
  if (modSec) modSec.classList.toggle("hidden", true); // Defunct

  // Hide the old login/register links if user exists
  const authNavLinks = document.getElementById("authNavLinks");
  if (authNavLinks) authNavLinks.classList.toggle("hidden", !!user);

  if (elements.logoutBtn) elements.logoutBtn.classList.toggle("hidden", !user);
  if (elements.dashboardTitle) {
    elements.dashboardTitle.textContent = user ? `Welcome back, ${user.name.split(" ")[0]}!` : "Law Firm Portal";
  }
}

function bindEvents() {
  if (elements.authTabs.length) {
    elements.authTabs.forEach((button) => {
      button.addEventListener("click", () => switchAuthTab(button.dataset.authTab));
    });
  }

  if (elements.loginForm) {
    elements.loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const email = fd.get("email").trim().toLowerCase();
      const pass = fd.get("password").trim();

      const u = appState.data.users.find(i => i.email.toLowerCase() === email && i.password === pass);
      if (!u) return showToast("Invalid email or password.");
      if (u.status === "blocked") return showToast("Account restricted.");

      if (u.role === "assistant") {
        clearLawyerDashboardSession();
        localStorage.setItem(SESSION_KEY, u.id);
        window.location.href = "assistant.html";
        return;
      }

      if (u.role === "lawyer") {
        setLawyerDashboardSession(u);
        localStorage.setItem(SESSION_KEY, u.id);
        window.location.href = "lawyer.html";
        return;
      }

      clearLawyerDashboardSession();
      appState.currentUserId = u.id;
      saveSession();
      renderAll();
      showToast(`Access Granted. Welcome back, ${u.name}.`);
    });
  }

  if (elements.registerForm) {
    elements.registerForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const email = fd.get("email").trim().toLowerCase();
      const requestedRole = String(fd.get("role") || "client").trim().toLowerCase();
      const normalizedRole = ["client", "lawyer"].includes(requestedRole) ? requestedRole : "client";
      if (appState.data.users.some(i => i.email.toLowerCase() === email)) return showToast("Email exists.");
      const u = { id: `u-${Date.now()}`, name: fd.get("name"), email, password: fd.get("password"), role: normalizedRole, phone: fd.get("phone"), department: fd.get("department"), verified: false, status: "active" };
      appState.data.users.push(u); addNotification("u-admin", "New Registration", `${u.name} joined.`);
      saveData(); switchAuthTab("login"); e.currentTarget.reset(); renderAll(); showToast("Registered. Please login.");
    });
  }

  if (elements.logoutBtn) {
    elements.logoutBtn.addEventListener("click", () => {
      clearLawyerDashboardSession();
      appState.currentUserId = null;
      appState.activeModuleId = null;
      saveSession();
      window.history.pushState(null, "", "/");
      renderAll();
      showToast("Signed out.");
    });
  }

  if (elements.moduleList) {
    elements.moduleList.addEventListener("click", (e) => {
      const b = e.target.closest("[data-module-target]");
      if (b) setActiveModule(b.dataset.moduleTarget);
    });
  }

  const unl = document.getElementById("userNavLinks");
  if (unl) {
    unl.addEventListener("click", (e) => {
      const b = e.target.closest("[data-module-target]");
      if (b) {
        e.preventDefault();
        setActiveModule(b.dataset.moduleTarget);
      }
    });
  }

  if (elements.adminNav) {
    elements.adminNav.addEventListener("click", (e) => {
      const b = e.target.closest("[data-module-target]");
      if (b) setActiveModule(b.dataset.moduleTarget);
    });
  }

  if (elements.profileForm) {
    elements.profileForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const u = getCurrentUser(); if (!u || u.role === "client") return;
      const fd = new FormData(e.currentTarget);
      u.name = fd.get("name"); u.email = fd.get("email"); u.phone = fd.get("phone"); u.department = fd.get("department");
      saveData(); renderAll(); showToast("Profile updated.");
    });

    elements.profileForm.addEventListener("click", (e) => {
      const delBtn = e.target.closest("#deleteProfileBtn");
      if (delBtn) {
        if (!confirm("Are you sure you want to permanently delete your account? This action cannot be undone.")) return;
        const u = getCurrentUser(); if (!u || u.role === "client") return;
        appState.data.users = appState.data.users.filter(i => i.id !== u.id);
        appState.currentUserId = null; saveData(); saveSession(); renderAll(); showToast("Account deleted.");
      }
    });
  }

  if (elements.userManagementForm) {
    elements.userManagementForm.addEventListener("input", (e) => {
      if (e.target.id === "userComboboxInput") {
        const q = e.target.value.toLowerCase();
        const res = document.getElementById("comboboxResults");
        if (!res) return;
        const items = res.querySelectorAll(".combobox-item");
        res.classList.remove("hidden");
        let m = 0; items.forEach(i => { const match = i.dataset.search.includes(q); i.classList.toggle("hidden", !match); if (match) m++; });
        if (m === 0) res.classList.add("hidden");
      }
    });

    elements.userManagementForm.addEventListener("click", (e) => {
      const item = e.target.closest(".combobox-item");
      if (item) {
        const input = document.getElementById("userComboboxInput");
        if (!input) return;
        const selectedUserIdInput = document.getElementById("selectedUserId");
        input.value = item.textContent.split(" - ")[0];
        if (selectedUserIdInput) selectedUserIdInput.value = item.dataset.id;
        document.getElementById("comboboxResults")?.classList.add("hidden");
        input.classList.add("selection-made");
      }
    });

    elements.userManagementForm.addEventListener("change", (e) => {
      if (e.target.name === "role") e.target.classList.toggle("selection-made", e.target.value !== "");
    });
  }

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".combobox-wrapper")) document.getElementById("comboboxResults")?.classList.add("hidden");
  });

  if (elements.userManagementForm) {
    elements.userManagementForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const selectedUserIdInput = document.getElementById("selectedUserId");
      const userId = selectedUserIdInput ? selectedUserIdInput.value : "";
      const newRole = new FormData(e.currentTarget).get("role");
      if (!userId || !newRole) return showToast("Select user and role.");
      const target = appState.data.users.find(u => u.id === userId);
      if (target) { target.role = newRole; addNotification(target.id, "Role Update", `You are now a ${newRole}.`); }
      saveData(); renderAll(); showToast("User role updated.");
    });
  }

  if (elements.userTableBody) {
    elements.userTableBody.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-toggle-status]");
      if (btn) {
        const u = appState.data.users.find(i => i.id === btn.dataset.toggleStatus);
        if (u) { u.status = u.status === "blocked" ? "active" : "blocked"; saveData(); renderAll(); showToast(`User ${u.status}.`); }
      }
    });
  }

  if (elements.notificationList) {
    elements.notificationList.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-delete-notif]");
      if (btn) {
        appState.data.notifications = appState.data.notifications.filter(n => n.id !== btn.dataset.deleteNotif);
        saveData(); renderNotifications(); showToast("Deleted.");
      }
    });
  }

  if (elements.deleteSelectedNotificationsBtn) {
    elements.deleteSelectedNotificationsBtn.addEventListener("click", () => {
      const ids = Array.from(document.querySelectorAll(".notif-checkbox:checked")).map(cb => cb.dataset.notifId);
      if (!ids.length) return showToast("No items selected.");
      appState.data.notifications = appState.data.notifications.filter(n => !ids.includes(n.id));
      saveData(); renderNotifications(); showToast("Selected items deleted.");
    });
  }

  if (elements.scrollToTopBtn) {
    window.onscroll = () => { if (window.scrollY > 300) elements.scrollToTopBtn.classList.remove("hidden"); else elements.scrollToTopBtn.classList.add("hidden"); };
    elements.scrollToTopBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }
  if (elements.genDetailsReportBtn) {
    elements.genDetailsReportBtn.addEventListener("click", generateDetailsReport);
  }
  if (elements.genTransReportBtn) {
    elements.genTransReportBtn.addEventListener("click", generateTransactionReport);
  }
}

loadData().then(() => {
  bindEvents();
  renderAll();
  fetchBackendStatus();
});
