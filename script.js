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
  
  // Ensure the specific admin exists even if data was previously saved
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
    { label: "Total Users", value: appState.data.users.length },
    { label: "Active Sessions", value: appState.currentUserId ? 1 : 0 }
  ];
  elements.statsGrid.innerHTML = stats.map((item) => `<article class="mini-card"><h3>${item.value}</h3><p>${item.label}</p></article>`).join("");
}

function renderUserBanner() {
  const user = getCurrentUser();
  if (!user) {
    elements.userBanner.innerHTML = `<div><p class="section-kicker">Current Session</p><h3>No active user</h3><p>Login or create a new account to explore the role-based dashboard.</p></div><span class="role-badge">Guest</span>`;
    return;
  }
  elements.userBanner.innerHTML = `<div><p class="section-kicker">Current Session</p><h3>${user.name}</h3><p>${user.email} • ${titleCase(user.role)} • Occupation: ${user.department}</p></div><span class="role-badge">${titleCase(user.role)}</span>`;
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
  
  const buttonsHtml = modules
    .filter((module) => visibleModuleIds.includes(module.id))
    .map((module) => `<button data-module-target="${module.id}" type="button"><strong>${module.title}</strong><span>${module.text}</span></button>`)
    .join("");

  elements.moduleList.innerHTML = buttonsHtml;
  
  // Also populate the compact admin nav if user is admin
  if (user?.role === "admin") {
    elements.adminNav.innerHTML = modules
      .filter((module) => visibleModuleIds.includes(module.id))
      .map((module) => `<button data-module-target="${module.id}" type="button">${module.title}</button>`)
      .join("");
    elements.adminNav.classList.remove("hidden");
  } else {
    elements.adminNav.classList.add("hidden");
  }

  // Default to User Management for Admin on first load/login if not set
  if (!appState.activeModuleId) {
    appState.activeModuleId = user?.role === "admin" ? "userManagementSection" : (visibleModuleIds[0] || "profileSection");
  }
  
  // Ensure the stored module is actually visible to the user's current role
  if (!visibleModuleIds.includes(appState.activeModuleId)) {
    appState.activeModuleId = visibleModuleIds[0] || "profileSection";
  }

  setActiveModule(appState.activeModuleId);
}

function setActiveModule(moduleId) {
  appState.activeModuleId = moduleId;
  const user = getCurrentUser();
  // Update both sidebar and admin nav buttons
  const allNavButtons = [...document.querySelectorAll(".module-list button"), ...document.querySelectorAll(".admin-nav-bar button")];
  allNavButtons.forEach((button) => button.classList.toggle("active", button.dataset.moduleTarget === moduleId));
  
  const visibleModuleIds = roleModules[user?.role || "guest"];
  modules.forEach((module) => {
    const section = document.getElementById(module.id);
    if (section) {
      const isVisible = visibleModuleIds.includes(module.id) && module.id === moduleId;
      section.classList.toggle("hidden", !isVisible);
    }
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
    <label><span>Occupation</span><input type="text" name="department" value="${user.department}" ${readOnly}></label>
    ${user.role === "client" ? "" : '<button class="primary-btn" type="submit">Update Profile</button>'}
  `;
  elements.deleteProfileBtn.innerHTML = "Delete Profile 🗑️";
}

function renderNotifications() {
  const user = getCurrentUser();
  if (!user) {
    elements.notificationList.innerHTML = `<div class="empty-state">Notifications appear after login.</div>`;
    return;
  }
  const items = user.role === "admin" ? appState.data.notifications : appState.data.notifications.filter((item) => item.userId === user.id);
  elements.notificationList.innerHTML = items.length ? items.map((item) => `
    <article class="entry-card notification-card">
      <div class="notif-grid">
        <div class="notif-check">
          <input type="checkbox" class="notif-checkbox" data-notif-id="${item.id}">
        </div>
        <div class="notif-content">
          <h4>${item.title}</h4>
          <p>${item.message}</p>
          <div class="meta">${item.date}</div>
        </div>
        <div class="notif-actions">
          <button class="table-btn danger-action" data-delete-notif="${item.id}" type="button" title="Delete Notification">🗑️</button>
        </div>
      </div>
    </article>
  `).join("") : `<div class="empty-state">No notifications available.</div>`;
}

function renderUserManagementForm() {
  const user = getCurrentUser();
  if (!user || user.role !== "admin") {
    elements.userManagementForm.innerHTML = `<div class="empty-state">Only administrators can manage system users.</div>`;
    return;
  }

  const selectableUsers = appState.data.users.filter((item) => item.role !== "admin");
  elements.userManagementForm.innerHTML = `
    <div class="form-grid-two">
      <div class="form-grid">
        <label><span>1. Search User</span><input type="text" id="userSearchInput" placeholder="Name or email..."></label>
        <label><span>2. Select User</span><select name="userId" id="userSelect" required>${selectableUsers.map((item) => `<option value="${item.id}" data-search="${item.name.toLowerCase()} ${item.email.toLowerCase()}">${item.name} (${titleCase(item.role)})</option>`).join("")}</select></label>
      </div>
      <div class="form-grid">
        <label><span>3. Assign/Update Role</span><select name="role" required>${["client", "lawyer", "assistant"].map((item) => `<option value="${item}">${titleCase(item)}</option>`).join("")}</select></label>
        <div style="display: flex; align-items: flex-end; height: 100%;">
          <button class="primary-btn full-width" type="submit" style="width: 100%;">Confirm Role Change</button>
        </div>
      </div>
    </div>
  `;
  
  // Handled inside bindEvents for search logic
}

function renderUserTable() {
  const user = getCurrentUser();
  if (!user || user.role !== "admin") {
    elements.userTableBody.innerHTML = `<tr><td colspan="7"><div class="empty-state">Login as admin to view user registry.</div></td></tr>`;
    return;
  }

  elements.userTableBody.innerHTML = appState.data.users.map((item) => `
    <tr>
      <td>${item.id}</td>
      <td>${item.name}</td>
      <td>${item.email}</td>
      <td><span class="role-badge" data-role="${item.role}">${titleCase(item.role)}</span></td>
      <td>${item.phone}</td>
      <td><span class="status-tag" data-status="${item.status || "active"}">${titleCase(item.status || "active")}</span></td>
      <td>
        ${item.role !== "admin" ? `
          <button class="table-btn ${item.status === "blocked" ? "success-action" : "danger-action"}" data-toggle-status="${item.id}" type="button">${item.status === "blocked" ? "Enable" : "Disable"}</button>
        ` : "<em>System Owner</em>"}
      </td>
    </tr>
  `).join("");
}

function generateReport() {
  const totalUsers = appState.data.users.length;
  const activeUsers = appState.data.users.filter(u => u.status !== "blocked").length;
  const summary = `System Overview: ${totalUsers} total users registered (${activeUsers} active).`;
  elements.reportOutputText.textContent = summary;
  showToast("System overview report generated.");
}

function renderAll() {
  renderStats();
  renderBackendStatus();
  renderUserBanner();
  renderModules();
  renderProfileForm();
  renderNotifications();
  renderUserManagementForm();
  renderUserTable();
  const user = getCurrentUser();

  const isAdmin = user && user.role === "admin";
  
  // Transform UI into a clean Portal view for Admin
  document.getElementById("authSection").classList.toggle("hidden", isAdmin);
  document.getElementById("summarySection").classList.toggle("hidden", isAdmin);
  document.getElementById("moduleSection").classList.toggle("hidden", isAdmin);
  
  // Hide landing hero and main navbar for Admin
  document.querySelector(".main-navbar").classList.toggle("hidden", isAdmin);
  document.querySelector(".hero-grid").classList.toggle("hidden", isAdmin);
  
  // Show Logout only when logged in
  if (elements.logoutBtn) {
    elements.logoutBtn.classList.toggle("hidden", !user);
  }

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
    if (user.status === "blocked") return showToast("Your account has been deactivated by the administrator.");
    // Removed restriction to allow Admin login
    // if (user.role !== "client") return showToast("Only client accounts can log in right now.");
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
      role: "client",
      phone: formData.get("phone").trim(),
      department: formData.get("department").trim(),
      verified: false,
      status: "active"
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

  elements.adminNav.addEventListener("click", (event) => {
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
    saveData();
    saveSession();
    renderAll();
    showToast("Profile deleted.");
  });

  elements.userManagementForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const user = getCurrentUser();
    if (!user || user.role !== "admin") return;
    const formData = new FormData(event.currentTarget);
    const targetUser = appState.data.users.find((item) => item.id === formData.get("userId"));
    if (targetUser) {
      const oldRole = targetUser.role;
      targetUser.role = formData.get("role");
      showToast(`User ${targetUser.name} updated from ${titleCase(oldRole)} to ${titleCase(targetUser.role)}.`);
      addNotification(targetUser.id, "Role Update Notification", `Your system role has been updated to ${titleCase(targetUser.role)}.`);
    }
    saveData();
    renderAll();
  });

  elements.userTableBody.addEventListener("click", (event) => {
    const statusBtn = event.target.closest("[data-toggle-status]");
    if (statusBtn) {
      const targetUser = appState.data.users.find(u => u.id === statusBtn.dataset.toggleStatus);
      if (targetUser) {
        targetUser.status = targetUser.status === "blocked" ? "active" : "blocked";
        showToast(`Access for ${targetUser.name} is now ${targetUser.status === "blocked" ? "Restricted" : "Enabled"}.`);
        if (targetUser.status === "blocked") {
           addNotification(targetUser.id, "Account Restricted", "Your access to the platform has been restricted by an administrator.");
        }
      }
      saveData();
      renderAll();
    }
  });

  elements.generateReportBtn.addEventListener("click", generateReport);

  elements.adminNav.addEventListener("click", (event) => {
    const button = event.target.closest("[data-module-target]");
    if (button) setActiveModule(button.dataset.moduleTarget);
  });

  // Notification Individual Delete
  elements.notificationList.addEventListener("click", (event) => {
    const delBtn = event.target.closest("[data-delete-notif]");
    if (delBtn) {
      const id = delBtn.dataset.deleteNotif;
      appState.data.notifications = appState.data.notifications.filter(n => n.id !== id);
      saveData();
      renderNotifications();
      showToast("Notification deleted.");
    }
  });

  // Bulk Notification Delete
  elements.deleteSelectedNotificationsBtn.addEventListener("click", () => {
    const selectedCheckboxes = document.querySelectorAll(".notif-checkbox:checked");
    if (!selectedCheckboxes.length) return showToast("Select notifications to delete.");
    
    const idsToDelete = Array.from(selectedCheckboxes).map(cb => cb.dataset.notifId);
    appState.data.notifications = appState.data.notifications.filter(n => !idsToDelete.includes(n.id));
    saveData();
    renderNotifications();
    showToast(`${idsToDelete.length} notifications deleted.`);
  });

  // User Search in Management
  elements.userManagementForm.addEventListener("input", (event) => {
    if (event.target.id === "userSearchInput") {
      const q = event.target.value.toLowerCase();
      const options = document.querySelectorAll("#userSelect option");
      options.forEach(opt => {
        const matches = opt.dataset.search.includes(q);
        opt.style.display = matches ? "block" : "none";
        if (matches && !document.querySelector("#userSelect").value) {
           document.querySelector("#userSelect").value = opt.value;
        }
      });
    }
  });

  // Scroll to top logic
  window.onscroll = () => {
    if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
      elements.scrollToTopBtn.classList.remove("hidden");
    } else {
      elements.scrollToTopBtn.classList.add("hidden");
    }
  };

  elements.scrollToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  if (elements.logoutBtn) {
    elements.logoutBtn.addEventListener("click", () => {
      appState.currentUserId = null;
      appState.activeModuleId = null;
      saveSession();
      renderAll();
      showToast("Signed out successfully.");
    });
  }
}

loadData();
bindEvents();
renderAll();
fetchBackendStatus();
