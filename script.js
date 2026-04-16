const STORAGE_KEY = "lexbridge-data-v1";
const SESSION_KEY = "lexbridge-session-v1";

const modules = [
  { id: "profileSection", title: "Profile", text: "View and manage user profile information." },
  { id: "notificationSection", title: "Notifications", text: "Stay updated with system alerts and reminders." },
  { id: "userManagementSection", title: "User Management", text: "Assign roles, update permissions, and manage all users." }
];

const roleModules = {
  guest: ["profileSection", "notificationSection", "userManagementSection"],
  client: ["profileSection", "notificationSection"],
  lawyer: ["profileSection", "notificationSection"],
  assistant: ["profileSection", "notificationSection"],
  admin: ["profileSection", "notificationSection", "userManagementSection"]
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
  loadDemoBtn: document.getElementById("loadDemoBtn"),
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
  reportOutputText: document.getElementById("reportOutputText"),
  generateReportBtn: document.getElementById("generateReportBtn"),
  toast: document.getElementById("toast")
};

function seedDemoData() {
  return {
    users: [
      { id: "u-admin", name: "Md. Asif Iqbal", email: "asif@gmail.com", password: "asif123", role: "admin", phone: "01887372093", department: "Admin", verified: true, status: "active" },
      { id: "u-lawyer", name: "Barrister Nadia Rahman", email: "lawyer@lexbridge.com", password: "123456", role: "lawyer", phone: "+880 1700-222222", department: "Corporate Law", verified: true, status: "active" },
      { id: "u-assistant", name: "Imran Hossain", email: "assistant@lexbridge.com", password: "123456", role: "assistant", phone: "+880 1700-333333", department: "Case Operations", verified: true, status: "active" },
      { id: "u-client", name: "Sadia Karim", email: "client@lexbridge.com", password: "123456", role: "client", phone: "+880 1700-444444", department: "Client", verified: true, status: "active" }
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
  
  if (appState.data && appState.data.users) {
    const adminExists = appState.data.users.some(u => u.email === "asif@gmail.com");
    if (!adminExists) {
      appState.data.users.push({ 
        id: "u-admin-asif", 
        name: "Md. Asif Iqbal", 
        email: "asif@gmail.com", 
        password: "asif123", 
        role: "admin", 
        phone: "01887372093", 
        department: "Admin", 
        verified: true,
        status: "active"
      });
      saveData();
    }
  }

  if (!saved) saveData();
  appState.currentUserId = localStorage.getItem(SESSION_KEY) || null;
}

function saveData() { localStorage.setItem(STORAGE_KEY, JSON.stringify(appState.data)); }
function saveSession() { appState.currentUserId ? localStorage.setItem(SESSION_KEY, appState.currentUserId) : localStorage.removeItem(SESSION_KEY); }
function getCurrentUser() { return appState.data.users.find((user) => user.id === appState.currentUserId) || null; }
function titleCase(value) { return value.charAt(0).toUpperCase() + value.slice(1); }

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
  const stats = [ { label: "Total Users", value: appState.data.users.length }, { label: "Active Sessions", value: appState.currentUserId ? 1 : 0 } ];
  elements.statsGrid.innerHTML = stats.map((item) => `<article class="mini-card"><h3>${item.value}</h3><p>${item.label}</p></article>`).join("");
}

function renderUserBanner() {
  const user = getCurrentUser();
  if (!user) {
    elements.userBanner.innerHTML = `<div><p class="section-kicker">Current Session</p><h3>No active user</h3><p>Login or create a new account.</p></div><span class="role-badge">Guest</span>`;
    return;
  }
  elements.userBanner.innerHTML = `<div><p class="section-kicker">Current Session</p><h3>${user.name}</h3><p>${user.email} • ${titleCase(user.role)} • ${user.department}</p></div><span class="role-badge">${titleCase(user.role)}</span>`;
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
  elements.moduleList.innerHTML = modules.filter(m => visibleIds.includes(m.id)).map(m => `<button data-module-target="${m.id}" type="button"><strong>${m.title}</strong><span>${m.text}</span></button>`).join("");
  if (user?.role === "admin") {
    elements.adminNav.innerHTML = modules.filter(m => visibleIds.includes(m.id)).map(m => `<button data-module-target="${m.id}" type="button">${m.title}</button>`).join("");
    elements.adminNav.classList.remove("hidden");
  } else {
    elements.adminNav.classList.add("hidden");
  }
  if (!appState.activeModuleId) appState.activeModuleId = user?.role === "admin" ? "userManagementSection" : (visibleIds[0] || "profileSection");
  if (!visibleIds.includes(appState.activeModuleId)) appState.activeModuleId = visibleIds[0] || "profileSection";
  setActiveModule(appState.activeModuleId);
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
          <button class="table-btn danger-action prof-btn-delete" id="deleteProfileBtn" type="button">Delete Account 🗑️</button>
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
        <div class="notif-actions"><button class="table-btn danger-action" data-delete-notif="${n.id}" type="button">🗑️</button></div>
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
              ${selectables.map(u => `<div class="combobox-item" data-id="${u.id}" data-search="${u.name.toLowerCase()} ${u.email.toLowerCase()}"><strong>${u.name}</strong> • ${titleCase(u.role)}</div>`).join("")}
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

function renderAll() {
  renderStats(); renderBackendStatus(); renderUserBanner(); renderModules(); renderProfileForm(); renderNotifications(); renderUserManagementForm(); renderUserTable();
  const user = getCurrentUser();
  const isAdmin = user && user.role === "admin";
  document.getElementById("authSection").classList.toggle("hidden", isAdmin);
  document.getElementById("summarySection").classList.toggle("hidden", isAdmin);
  document.getElementById("moduleSection").classList.toggle("hidden", isAdmin);
  document.querySelector(".main-navbar").classList.toggle("hidden", isAdmin);
  document.querySelector(".hero-grid").classList.toggle("hidden", isAdmin);
  if (elements.logoutBtn) elements.logoutBtn.classList.toggle("hidden", !user);
  elements.dashboardTitle.textContent = user ? `${titleCase(user.role)} Dashboard` : "Law Firm Portal";
}

function bindEvents() {
  elements.authTabs.forEach(b => b.addEventListener("click", () => switchAuthTab(b.dataset.authTab)));
  elements.loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const u = appState.data.users.find(i => i.email.toLowerCase() === fd.get("email").trim().toLowerCase() && i.password === fd.get("password").trim());
    if (!u) return showToast("Invalid credentials.");
    if (u.status === "blocked") return showToast("Account restricted.");
    appState.currentUserId = u.id; saveSession(); renderAll(); showToast(`Welcome, ${u.name}.`);
  });

  elements.registerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = fd.get("email").trim().toLowerCase();
    if (appState.data.users.some(i => i.email.toLowerCase() === email)) return showToast("Email exists.");
    const u = { id: `u-${Date.now()}`, name: fd.get("name"), email, password: fd.get("password"), role: "client", phone: fd.get("phone"), department: fd.get("department"), verified: false, status: "active" };
    appState.data.users.push(u); addNotification("u-admin", "New Registration", `${u.name} joined.`);
    saveData(); switchAuthTab("login"); e.currentTarget.reset(); renderAll(); showToast("Registered. Please login.");
  });

  if (elements.logoutBtn) {
    elements.logoutBtn.addEventListener("click", () => {
      appState.currentUserId = null; appState.activeModuleId = null; saveSession(); renderAll(); showToast("Signed out.");
    });
  }

  elements.moduleList.addEventListener("click", (e) => {
    const b = e.target.closest("[data-module-target]");
    if (b) setActiveModule(b.dataset.moduleTarget);
  });

  elements.adminNav.addEventListener("click", (e) => {
    const b = e.target.closest("[data-module-target]");
    if (b) setActiveModule(b.dataset.moduleTarget);
  });

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

  elements.userManagementForm.addEventListener("input", (e) => {
    if (e.target.id === "userComboboxInput") {
      const q = e.target.value.toLowerCase();
      const res = document.getElementById("comboboxResults");
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
      input.value = item.textContent.split(" • ")[0];
      document.getElementById("selectedUserId").value = item.dataset.id;
      document.getElementById("comboboxResults").classList.add("hidden");
      input.classList.add("selection-made");
    }
  });

  elements.userManagementForm.addEventListener("change", (e) => {
    if (e.target.name === "role") e.target.classList.toggle("selection-made", e.target.value !== "");
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".combobox-wrapper")) document.getElementById("comboboxResults")?.classList.add("hidden");
  });

  elements.userManagementForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const userId = document.getElementById("selectedUserId").value;
    const newRole = new FormData(e.currentTarget).get("role");
    if (!userId || !newRole) return showToast("Select user and role.");
    const target = appState.data.users.find(u => u.id === userId);
    if (target) { target.role = newRole; addNotification(target.id, "Role Update", `You are now a ${newRole}.`); }
    saveData(); renderAll(); showToast("User role updated.");
  });

  elements.userTableBody.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-toggle-status]");
    if (btn) {
      const u = appState.data.users.find(i => i.id === btn.dataset.toggleStatus);
      if (u) { u.status = u.status === "blocked" ? "active" : "blocked"; saveData(); renderAll(); showToast(`User ${u.status}.`); }
    }
  });

  elements.notificationList.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-delete-notif]");
    if (btn) {
      appState.data.notifications = appState.data.notifications.filter(n => n.id !== btn.dataset.deleteNotif);
      saveData(); renderNotifications(); showToast("Deleted.");
    }
  });

  elements.deleteSelectedNotificationsBtn.addEventListener("click", () => {
    const ids = Array.from(document.querySelectorAll(".notif-checkbox:checked")).map(cb => cb.dataset.notifId);
    if (!ids.length) return showToast("No items selected.");
    appState.data.notifications = appState.data.notifications.filter(n => !ids.includes(n.id));
    saveData(); renderNotifications(); showToast("Selected items deleted.");
  });

  window.onscroll = () => { if (window.scrollY > 300) elements.scrollToTopBtn.classList.remove("hidden"); else elements.scrollToTopBtn.classList.add("hidden"); };
  elements.scrollToTopBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  elements.generateReportBtn.addEventListener("click", () => {
    elements.reportOutputText.textContent = `Report: ${appState.data.users.length} users registered.`;
    showToast("Report ready.");
  });
}

loadData(); bindEvents(); renderAll(); fetchBackendStatus();
