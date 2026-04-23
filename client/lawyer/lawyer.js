const API_BASE = window.location.origin;
const DEMO_MODE_FALLBACK = true;
const LEGACY_DATA_KEY = "lexbridge-data-v1";

const STORAGE_KEYS = {
  token: "lawyer_token",
  lawyerId: "lawyer_id",
  lawyerName: "lawyer_name"
};

const state = {
  token: null,
  lawyerId: null,
  lawyerName: "",
  profile: null,
  cases: [],
  documents: [],
  schedule: [],
  notifications: [],
  activePanel: "profile",
  currentMonth: new Date(),
  selectedEventId: null,
  appointments: [],
  demoMode: false
};

const mockDb = {
  meta: { caseSeq: 1003, docSeq: 1003, eventSeq: 2003, notifSeq: 3003 },
  users: [
    {
      lawyerId: "L-1001",
      name: "Ayesha Rahman",
      email: "lawyer@example.com",
      password: "password123",
      phone: "+8801700000000",
      barId: "BAR-77821",
      specialization: "Corporate & Civil Litigation",
      token: "demo-token-lawyer-1001"
    }
  ],
  cases: [
    {
      caseId: "C-1001",
      lawyerId: "L-1001",
      title: "Breach of Contract - Zenith Ltd",
      clientName: "Zenith Ltd",
      status: "Open",
      priority: "High",
      caseType: "Corporate",
      lastUpdated: isoFromOffset(-1),
      description: "Vendor failed to deliver according to contract clauses 3 and 6.",
      opposingCounsel: "Mahmud & Co.",
      importantDates: [isoFromOffset(0), isoFromOffset(7)],
      lastNote: ""
    },
    {
      caseId: "C-1002",
      lawyerId: "L-1001",
      title: "Property Title Dispute",
      clientName: "Sarah Akter",
      status: "In Progress",
      priority: "Medium",
      caseType: "Property",
      lastUpdated: isoFromOffset(-2),
      description: "Dispute regarding land transfer deed and ownership history.",
      opposingCounsel: "Hossain Legal Chambers",
      importantDates: [isoFromOffset(1), isoFromOffset(12)],
      lastNote: ""
    },
    {
      caseId: "C-1003",
      lawyerId: "L-1001",
      title: "Labor Arbitration",
      clientName: "Northline Textiles",
      status: "Pending",
      priority: "Low",
      caseType: "Labor",
      lastUpdated: isoFromOffset(-4),
      description: "Arbitration over employee compensation and severance package.",
      opposingCounsel: "People First Advocates",
      importantDates: [isoFromOffset(2)],
      lastNote: ""
    }
  ],
  documents: [
    {
      docId: "D-1001",
      lawyerId: "L-1001",
      title: "Contract Annexure A",
      caseId: "C-1001",
      uploadDate: isoFromOffset(-10),
      fileType: "PDF",
      description: "Annexure outlining service scope and payment schedule."
    },
    {
      docId: "D-1002",
      lawyerId: "L-1001",
      title: "Title Registry Copy",
      caseId: "C-1002",
      uploadDate: isoFromOffset(-6),
      fileType: "PDF",
      description: "Certified copy from local land registry office."
    },
    {
      docId: "D-1003",
      lawyerId: "L-1001",
      title: "Witness Statement - HR",
      caseId: "C-1003",
      uploadDate: isoFromOffset(-3),
      fileType: "DOCX",
      description: "Recorded statement from HR representative."
    }
  ],
  schedule: [
    {
      eventId: "E-2001",
      lawyerId: "L-1001",
      title: "Court Hearing - Zenith Ltd",
      date: isoFromOffset(0),
      time: "10:30",
      type: "Hearing"
    },
    {
      eventId: "E-2002",
      lawyerId: "L-1001",
      title: "Client Meeting - Sarah Akter",
      date: isoFromOffset(1),
      time: "14:00",
      type: "Meeting"
    },
    {
      eventId: "E-2003",
      lawyerId: "L-1001",
      title: "Document Submission Deadline",
      date: isoFromOffset(5),
      time: "16:00",
      type: "Deadline"
    }
  ],
  notifications: [
    {
      notifId: "N-3001",
      lawyerId: "L-1001",
      message: "New hearing scheduled for case C-1001.",
      createdAt: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
      isRead: false
    },
    {
      notifId: "N-3002",
      lawyerId: "L-1001",
      message: "Document D-1002 was added to case C-1002.",
      createdAt: new Date(Date.now() - 3600 * 1000 * 28).toISOString(),
      isRead: false
    },
    {
      notifId: "N-3003",
      lawyerId: "L-1001",
      message: "Reminder: Client meeting tomorrow at 14:00.",
      createdAt: new Date(Date.now() - 3600 * 1000 * 40).toISOString(),
      isRead: true
    }
  ]
};

const ui = {};
let loadingCounter = 0;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

function init() {
  cacheElements();
  bindEvents();
  restoreSession();
}

function cacheElements() {
  ui.loginView = document.getElementById("loginView");
  ui.dashboardView = document.getElementById("dashboardView");
  ui.loginForm = document.getElementById("loginForm");
  ui.loginEmail = document.getElementById("loginEmail");
  ui.loginPassword = document.getElementById("loginPassword");
  ui.logoutBtn = document.getElementById("logoutBtn");
  ui.userChip = document.getElementById("userChip");

  ui.sidebar = document.getElementById("sidebar");
  ui.sidebarToggle = document.getElementById("sidebarToggle");
  ui.navItems = Array.from(document.querySelectorAll(".nav-item"));
  ui.panels = Array.from(document.querySelectorAll(".panel"));

  ui.notifArea = document.getElementById("notifArea");
  ui.notifBell = document.getElementById("notifBell");
  ui.notifBadge = document.getElementById("notifBadge");
  ui.notifDropdown = document.getElementById("notifDropdown");
  ui.notifDropdownList = document.getElementById("notifDropdownList");
  ui.openNotifPanelBtn = document.getElementById("openNotifPanelBtn");
  ui.notificationsPanelList = document.getElementById("notificationsPanelList");
  ui.markAllNotifBtn = document.getElementById("markAllNotifBtn");

  ui.flashContainer = document.getElementById("flashContainer");
  ui.globalSpinner = document.getElementById("globalSpinner");
  ui.overviewStats = document.getElementById("overviewStats");

  ui.profileView = document.getElementById("profileView");
  ui.profileForm = document.getElementById("profileForm");
  ui.profileName = document.getElementById("profileName");
  ui.profileEmail = document.getElementById("profileEmail");
  ui.profilePhone = document.getElementById("profilePhone");
  ui.editProfileBtn = document.getElementById("editProfileBtn");
  ui.cancelProfileEditBtn = document.getElementById("cancelProfileEditBtn");
  ui.deleteProfileBtn = document.getElementById("deleteProfileBtn");

  ui.caseSearch = document.getElementById("caseSearch");
  ui.casePriorityFilter = document.getElementById("casePriorityFilter");
  ui.caseTypeFilter = document.getElementById("caseTypeFilter");
  ui.casesTableBody = document.getElementById("casesTableBody");
  ui.toggleCaseFormBtn = document.getElementById("toggleCaseFormBtn");
  ui.caseCreateForm = document.getElementById("caseCreateForm");
  ui.newCaseTitle = document.getElementById("newCaseTitle");
  ui.newCaseClientName = document.getElementById("newCaseClientName");
  ui.newCaseStatus = document.getElementById("newCaseStatus");
  ui.newCasePriority = document.getElementById("newCasePriority");
  ui.newCaseType = document.getElementById("newCaseType");
  ui.newCaseImportantDate = document.getElementById("newCaseImportantDate");
  ui.newCaseOpposingCounsel = document.getElementById("newCaseOpposingCounsel");
  ui.newCaseDescription = document.getElementById("newCaseDescription");

  ui.caseModal = document.getElementById("caseModal");
  ui.caseDetailBody = document.getElementById("caseDetailBody");
  ui.caseUpdateForm = document.getElementById("caseUpdateForm");
  ui.caseEditTitle = document.getElementById("caseEditTitle");
  ui.caseEditClientName = document.getElementById("caseEditClientName");
  ui.caseStatusSelect = document.getElementById("caseStatusSelect");
  ui.caseEditPriority = document.getElementById("caseEditPriority");
  ui.caseEditType = document.getElementById("caseEditType");
  ui.caseEditImportantDate = document.getElementById("caseEditImportantDate");
  ui.caseEditOpposingCounsel = document.getElementById("caseEditOpposingCounsel");
  ui.caseEditDescription = document.getElementById("caseEditDescription");
  ui.caseNotes = document.getElementById("caseNotes");

  ui.toggleDocFormBtn = document.getElementById("toggleDocFormBtn");
  ui.documentCreateForm = document.getElementById("documentCreateForm");
  ui.docTitle = document.getElementById("docTitle");
  ui.docCaseSelect = document.getElementById("docCaseSelect");
  ui.docDescription = document.getElementById("docDescription");
  ui.docSearchInput = document.getElementById("docSearchInput");
  ui.docFromDate = document.getElementById("docFromDate");
  ui.docToDate = document.getElementById("docToDate");
  ui.docsTableBody = document.getElementById("docsTableBody");

  ui.documentModal = document.getElementById("documentModal");
  ui.documentEditForm = document.getElementById("documentEditForm");
  ui.editDocId = document.getElementById("editDocId");
  ui.editDocTitle = document.getElementById("editDocTitle");
  ui.editDocCaseSelect = document.getElementById("editDocCaseSelect");
  ui.editDocDescription = document.getElementById("editDocDescription");

  ui.eventCreateForm = document.getElementById("eventCreateForm");
  ui.eventTitle = document.getElementById("eventTitle");
  ui.eventDate = document.getElementById("eventDate");
  ui.eventTime = document.getElementById("eventTime");
  ui.eventType = document.getElementById("eventType");
  ui.prevMonthBtn = document.getElementById("prevMonthBtn");
  ui.nextMonthBtn = document.getElementById("nextMonthBtn");
  ui.calendarMonthLabel = document.getElementById("calendarMonthLabel");
  ui.calendarGrid = document.getElementById("calendarGrid");
  ui.remindersList = document.getElementById("remindersList");

  ui.eventModal = document.getElementById("eventModal");
  ui.eventEditForm = document.getElementById("eventEditForm");
  ui.editEventId = document.getElementById("editEventId");
  ui.editEventTitle = document.getElementById("editEventTitle");
  ui.editEventDate = document.getElementById("editEventDate");
  ui.editEventTime = document.getElementById("editEventTime");

  ui.caseRequestsBox = document.getElementById("caseRequestsBox");
  ui.proposedApptsTableBody = document.getElementById("proposedApptsTableBody");
}

function bindEvents() {
  ui.loginForm.addEventListener("submit", handleLogin);
  ui.logoutBtn.addEventListener("click", logout);

  ui.sidebarToggle.addEventListener("click", () => {
    ui.sidebar.classList.toggle("open");
  });

  ui.navItems.forEach((item) => {
    item.addEventListener("click", () => setActivePanel(item.dataset.panel));
  });

  ui.notifBell.addEventListener("click", (e) => {
    e.stopPropagation();
    ui.notifDropdown.classList.toggle("hidden");
    renderNotificationDropdown();
  });

  ui.openNotifPanelBtn.addEventListener("click", () => {
    ui.notifDropdown.classList.add("hidden");
    setActivePanel("notifications");
  });

  ui.markAllNotifBtn.addEventListener("click", markAllNotificationsRead);

  ui.editProfileBtn.addEventListener("click", openProfileEditor);
  ui.cancelProfileEditBtn.addEventListener("click", closeProfileEditor);
  ui.profileForm.addEventListener("submit", saveProfile);
  ui.deleteProfileBtn.addEventListener("click", deleteProfile);

  ui.caseSearch.addEventListener("input", renderCases);
  ui.casePriorityFilter.addEventListener("change", renderCases);
  ui.caseTypeFilter.addEventListener("change", renderCases);
  ui.toggleCaseFormBtn.addEventListener("click", () => {
    ui.caseCreateForm.classList.toggle("hidden");
  });
  ui.caseCreateForm.addEventListener("submit", createCase);

  ui.casesTableBody.addEventListener("click", (e) => {
    const viewBtn = e.target.closest("button[data-action='view-case']");
    if (viewBtn) {
      openCaseModal(viewBtn.dataset.id);
      return;
    }

    const deleteBtn = e.target.closest("button[data-action='delete-case']");
    if (deleteBtn) {
      removeCase(deleteBtn.dataset.id);
    }
  });

  ui.caseUpdateForm.addEventListener("submit", updateCase);

  ui.toggleDocFormBtn.addEventListener("click", () => {
    ui.documentCreateForm.classList.toggle("hidden");
  });

  ui.documentCreateForm.addEventListener("submit", createDocument);
  ui.docSearchInput.addEventListener("input", renderDocuments);
  ui.docFromDate.addEventListener("change", renderDocuments);
  ui.docToDate.addEventListener("change", renderDocuments);

  ui.docsTableBody.addEventListener("click", (e) => {
    const editBtn = e.target.closest("button[data-action='edit-doc']");
    if (editBtn) {
      openDocumentModal(editBtn.dataset.id);
      return;
    }
    const deleteBtn = e.target.closest("button[data-action='delete-doc']");
    if (deleteBtn) {
      removeDocument(deleteBtn.dataset.id);
    }
  });

  ui.documentEditForm.addEventListener("submit", saveDocumentEdit);

  ui.eventCreateForm.addEventListener("submit", createEvent);
  ui.prevMonthBtn.addEventListener("click", () => {
    state.currentMonth = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() - 1, 1);
    renderCalendar();
  });
  ui.nextMonthBtn.addEventListener("click", () => {
    state.currentMonth = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1, 1);
    renderCalendar();
  });

  ui.calendarGrid.addEventListener("click", (e) => {
    const eventChip = e.target.closest("button.event-chip");
    if (!eventChip) return;
    openEventModal(eventChip.dataset.id);
  });

  ui.eventEditForm.addEventListener("submit", saveEventEdit);

  ui.notifDropdownList.addEventListener("click", (e) => {
    const markBtn = e.target.closest("button[data-action='mark-read']");
    if (!markBtn) return;
    markNotificationRead(markBtn.dataset.id);
  });

  ui.notificationsPanelList.addEventListener("click", (e) => {
    const markBtn = e.target.closest("button[data-action='mark-read']");
    if (!markBtn) return;
    markNotificationRead(markBtn.dataset.id);
  });

  document.querySelectorAll("[data-close]").forEach((btn) => {
    btn.addEventListener("click", () => closeModal(btn.dataset.close));
  });

  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal(modal.id);
    });
  });

  document.addEventListener("click", (e) => {
    if (!ui.notifArea.contains(e.target)) {
      ui.notifDropdown.classList.add("hidden");
    }
  });

  ui.proposedApptsTableBody.addEventListener("click", (e) => {
    const acceptBtn = e.target.closest("button[data-action='accept-appt']");
    if (acceptBtn) {
      acceptAppointment(acceptBtn.dataset.id);
    }
  });
}

function restoreSession() {
  const token = localStorage.getItem(STORAGE_KEYS.token);
  const lawyerId = localStorage.getItem(STORAGE_KEYS.lawyerId);
  const lawyerName = localStorage.getItem(STORAGE_KEYS.lawyerName);

  if (token && lawyerId) {
    state.token = token;
    state.lawyerId = lawyerId;
    state.lawyerName = lawyerName || "Lawyer";
    enterDashboard();
    loadDashboardData();
  } else {
    showLogin();
  }
}

async function handleLogin(e) {
  e.preventDefault();

  const email = ui.loginEmail.value.trim();
  const password = ui.loginPassword.value.trim();

  if (!email || !password) {
    showFlash("Please enter both email and password.", "warning");
    return;
  }

  try {
    const result = await withLoading(() =>
      apiRequest("/api/auth/login", {
        method: "POST",
        auth: false,
        body: { email, password }
      })
    );

    state.token = result.token;
    state.lawyerId = result.lawyerId;
    state.lawyerName = result.name || "Lawyer";

    localStorage.setItem(STORAGE_KEYS.token, state.token);
    localStorage.setItem(STORAGE_KEYS.lawyerId, state.lawyerId);
    localStorage.setItem(STORAGE_KEYS.lawyerName, state.lawyerName);

    enterDashboard();
    await loadDashboardData();
    showFlash(`Welcome, ${escapeHtml(state.lawyerName)}.`, "success");
  } catch (error) {
    showFlash(error.message || "Login failed.", "error");
  }
}

function enterDashboard() {
  ui.loginView.classList.add("hidden");
  ui.dashboardView.classList.remove("hidden");
  ui.userChip.textContent = state.lawyerName || "Lawyer";
}

function showLogin() {
  ui.dashboardView.classList.add("hidden");
  ui.loginView.classList.remove("hidden");
}

function logout() {
  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.lawyerId);
  localStorage.removeItem(STORAGE_KEYS.lawyerName);

  state.token = null;
  state.lawyerId = null;
  state.lawyerName = "";
  state.profile = null;
  state.cases = [];
  state.documents = [];
  state.schedule = [];
  state.notifications = [];
  state.selectedCaseId = null;
  state.selectedDocId = null;
  state.selectedEventId = null;

  ui.loginForm.reset();
  showLogin();
  showFlash("Logged out successfully.", "info");
}

async function loadDashboardData() {
  try {
    await withLoading(async () => {
      await loadProfile();

      const canonicalLawyerId = state.profile && state.profile.lawyerId ? String(state.profile.lawyerId) : "";
      if (canonicalLawyerId && canonicalLawyerId !== String(state.lawyerId || "")) {
        state.lawyerId = canonicalLawyerId;
        localStorage.setItem(STORAGE_KEYS.lawyerId, canonicalLawyerId);
      }

      await Promise.all([loadCases(), loadDocuments(), loadSchedule(), loadNotifications(), loadAppointments()]);
    });

    renderProfile();
    renderCases();
    renderProposedAppointments();
    renderDocuments();
    renderCalendar();
    renderReminders();
    renderNotificationBadge();
    renderNotificationDropdown();
    renderNotificationsPanel();
    renderCaseTypeOptions();
    renderCaseOptionsForDocs();
    renderOverviewStats();
  } catch (error) {
    showFlash(error.message || "Failed to load dashboard data.", "error");
  }
}

async function loadProfile() {
  const data = await apiRequest(`/api/lawyer/profile?lawyerId=${encodeURIComponent(state.lawyerId)}`);
  state.profile = data || null;
}

async function loadCases() {
  const data = await apiRequest(`/api/cases?lawyerId=${encodeURIComponent(state.lawyerId)}`);
  state.cases = Array.isArray(data) ? data.map(normalizeCase) : [];
  state.cases.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
}

async function loadDocuments() {
  const data = await apiRequest(`/api/documents?lawyerId=${encodeURIComponent(state.lawyerId)}`);
  state.documents = Array.isArray(data) ? data.map(normalizeDocument) : [];
  state.documents.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
}

async function loadSchedule() {
  const data = await apiRequest(`/api/schedule?lawyerId=${encodeURIComponent(state.lawyerId)}`);
  state.schedule = Array.isArray(data) ? data : [];
  state.schedule.sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
}

async function loadNotifications() {
  const data = await apiRequest(`/api/notifications?lawyerId=${encodeURIComponent(state.lawyerId)}`);
  state.notifications = Array.isArray(data) ? data : [];
  state.notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function loadAppointments() {
  const data = await apiRequest(`/api/appointments?lawyerId=${encodeURIComponent(state.lawyerId)}`);
  state.appointments = Array.isArray(data) ? data : [];
}

function renderProposedAppointments() {
  const proposals = state.appointments.filter(a => a.status === "Proposed");
  
  if (proposals.length > 0) {
    ui.caseRequestsBox.classList.remove("hidden");
    ui.proposedApptsTableBody.innerHTML = proposals.map(p => `
      <tr>
        <td>${p.assistantName || "Assigned Assistant"}</td>
        <td>${p.clientName || "Client"}</td>
        <td><span class="tag status-open">${p.type}</span></td>
        <td>${p.date}</td>
        <td>
          <button class="btn" data-action="accept-appt" data-id="${p.id}">Accept & Open Case</button>
        </td>
      </tr>
    `).join("");
  } else {
    ui.caseRequestsBox.classList.add("hidden");
  }
}

async function acceptAppointment(id) {
  const appt = state.appointments.find(a => a.id === id);
  if (!appt) return;

  try {
    // 1. Mark appointment as Confirmed
    appt.status = "Confirmed";
    appt.payment = "Paid";

    // 2. Create the actual Case object
    const newCase = {
      caseId: `C-${Date.now()}`,
      lawyerId: state.lawyerId,
      assistantId: appt.assistantId,
      title: `${appt.type} Matter - ${appt.clientName || 'Client'}`,
      clientName: appt.clientName || 'Client',
      clientId: appt.clientId,
      status: "In Progress",
      priority: "Medium",
      caseType: appt.type,
      lastUpdated: new Date().toISOString(),
      description: `Case opened from confirmed ${appt.type} consultation proposal.`
    };

    // Save to global data (via api)
    const fullDataRes = await fetch("/api/load");
    const fullData = await fullDataRes.json();
    
    // Update appointment in full data
    const fullAppt = fullData.appointments.find(a => a.id === id);
    if (fullAppt) {
      fullAppt.status = "Confirmed";
      fullAppt.payment = "Paid";
    }
    
    // Add new case
    fullData.cases.push(newCase);
    
    // Add notification to client
    fullData.notifications.unshift({
      id: `N-${Date.now()}`,
      userId: appt.clientId,
      title: "Case Accepted",
      message: `Your ${appt.type} case has been accepted and assigned to Lawyer ${state.lawyerName}.`,
      date: new Date().toISOString().split("T")[0]
    });

    await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fullData)
    });

    showFlash("Case accepted and opened successfully.", "success");
    await loadDashboardData();
  } catch (error) {
    showFlash("Failed to accept case.", "error");
  }
}

function setActivePanel(panelName) {
  state.activePanel = panelName;
  ui.navItems.forEach((item) => item.classList.toggle("active", item.dataset.panel === panelName));
  ui.panels.forEach((panel) => panel.classList.toggle("hidden", panel.id !== `panel-${panelName}`));
  ui.sidebar.classList.remove("open");
}

function renderProfile() {
  if (!state.profile) {
    ui.profileView.innerHTML = `<p class="empty">No profile data available.</p>`;
    return;
  }

  const p = state.profile;
  ui.profileView.innerHTML = `
    <div class="profile-grid">
      <div class="profile-item"><small>Lawyer ID</small><strong>${escapeHtml(p.lawyerId || "-")}</strong></div>
      <div class="profile-item"><small>Name</small><strong>${escapeHtml(p.name || "-")}</strong></div>
      <div class="profile-item"><small>Email</small><strong>${escapeHtml(p.email || "-")}</strong></div>
      <div class="profile-item"><small>Phone</small><strong>${escapeHtml(p.phone || "-")}</strong></div>
      <div class="profile-item"><small>Bar ID</small><strong>${escapeHtml(p.barId || "-")}</strong></div>
      <div class="profile-item"><small>Specialization</small><strong>${escapeHtml(p.specialization || "-")}</strong></div>
    </div>
  `;
}

function renderOverviewStats() {
  if (!ui.overviewStats) return;

  const totalCases = state.cases.length;
  const openCases = state.cases.filter((c) => String(c.status).toLowerCase() !== "closed").length;
  const docs = state.documents.length;
  const unread = state.notifications.filter((n) => !n.isRead).length;
  const nextEvent = state.schedule
    .filter((ev) => new Date(`${normalizeDate(ev.date)}T${ev.time || "00:00"}`) >= new Date())
    .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`))[0];

  ui.overviewStats.innerHTML = `
    <article class="overview-card">
      <small>Total Cases</small>
      <strong>${totalCases}</strong>
      <span>${openCases} active matters</span>
    </article>
    <article class="overview-card">
      <small>Documents</small>
      <strong>${docs}</strong>
      <span>All case files</span>
    </article>
    <article class="overview-card">
      <small>Unread Alerts</small>
      <strong>${unread}</strong>
      <span>Needs attention</span>
    </article>
    <article class="overview-card">
      <small>Next Event</small>
      <strong>${nextEvent ? escapeHtml(nextEvent.time) : "-"}</strong>
      <span>${nextEvent ? `${formatDate(nextEvent.date)} - ${escapeHtml(truncate(nextEvent.title, 22))}` : "No upcoming schedule"}</span>
    </article>
  `;
}

function openProfileEditor() {
  if (!state.profile) return;
  ui.profileName.value = state.profile.name || "";
  ui.profileEmail.value = state.profile.email || "";
  ui.profilePhone.value = state.profile.phone || "";
  ui.profileForm.classList.remove("hidden");
}

function closeProfileEditor() {
  ui.profileForm.classList.add("hidden");
}

async function saveProfile(e) {
  e.preventDefault();
  if (!state.profile) return;

  const payload = {
    lawyerId: state.profile.lawyerId,
    name: ui.profileName.value.trim(),
    email: ui.profileEmail.value.trim(),
    phone: ui.profilePhone.value.trim()
  };

  if (!payload.name || !payload.email || !payload.phone) {
    showFlash("All profile fields are required.", "warning");
    return;
  }

  try {
    await withLoading(() =>
      apiRequest("/api/lawyer/profile", {
        method: "PUT",
        body: payload
      })
    );
    await loadProfile();
    renderProfile();
    closeProfileEditor();
    showFlash("Profile updated successfully.", "success");
  } catch (error) {
    showFlash(error.message || "Failed to update profile.", "error");
  }
}

async function deleteProfile() {
  if (!state.profile) return;
  const sure = confirm("Delete profile permanently? This will log you out.");
  if (!sure) return;

  try {
    await withLoading(() =>
      apiRequest(`/api/lawyer/profile?lawyerId=${encodeURIComponent(state.profile.lawyerId)}`, {
        method: "DELETE"
      })
    );
    logout();
  } catch (error) {
    showFlash(error.message || "Failed to delete profile.", "error");
  }
}

function normalizeCase(c) {
  const caseId = c.caseId || c.id || c.caseID || "";
  const lastUpdated = c.lastUpdated || c.updatedOn || c.uploadDate || c.date || "";
  return {
    ...c,
    caseId,
    lastUpdated,
    title: c.title || "Untitled Case",
    clientName: c.clientName || c.client || "Unknown Client",
    status: c.status || "Open",
    priority: c.priority || "Medium",
    caseType: c.caseType || c.type || "General",
    importantDates: Array.isArray(c.importantDates) ? c.importantDates.map((d) => normalizeDate(d)).filter(Boolean) : []
  };
}

function normalizeDocument(doc) {
  return {
    ...doc,
    fileType: doc.fileType || "FILE"
  };
}

function renderCaseTypeOptions() {
  const selected = ui.caseTypeFilter.value;
  const types = [...new Set(state.cases.map((c) => c.caseType || "General"))].sort();
  ui.caseTypeFilter.innerHTML = `<option value="">All Types</option>${types
    .map((t) => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`)
    .join("")}`;
  if (types.includes(selected)) ui.caseTypeFilter.value = selected;
}

function getFilteredCases() {
  const q = ui.caseSearch.value.trim().toLowerCase();
  const priority = ui.casePriorityFilter.value.trim().toLowerCase();
  const type = ui.caseTypeFilter.value;

  return state.cases.filter((c) => {
    const matchesSearch =
      !q ||
      String(c.caseId).toLowerCase().includes(q) ||
      String(c.title).toLowerCase().includes(q) ||
      String(c.clientName).toLowerCase().includes(q) ||
      String(c.status).toLowerCase().includes(q) ||
      String(c.caseType).toLowerCase().includes(q);

    const matchesPriority = !priority || String(c.priority).toLowerCase() === priority;
    const matchesType = !type || String(c.caseType) === type;

    return matchesSearch && matchesPriority && matchesType;
  });
}

function renderCases() {
  const list = getFilteredCases();

  if (!list.length) {
    ui.casesTableBody.innerHTML = `<tr><td colspan="8"><p class="empty">No cases found for current filters.</p></td></tr>`;
    return;
  }

  ui.casesTableBody.innerHTML = list
    .map(
      (c) => `
      <tr>
        <td>${escapeHtml(c.caseId || "-")}</td>
        <td>${escapeHtml(c.title)}</td>
        <td>${escapeHtml(c.clientName)}</td>
        <td><span class="tag status-${slug(c.status)}">${escapeHtml(c.status)}</span></td>
        <td><span class="tag priority-${slug(c.priority)}">${escapeHtml(c.priority)}</span></td>
        <td>${escapeHtml(c.caseType || "General")}</td>
        <td>${c.lastUpdated ? formatDate(c.lastUpdated) : "-"}</td>
        <td>
          <div class="action-inline">
            <button class="btn btn-secondary" data-action="view-case" data-id="${escapeHtml(c.caseId || c.id || "")}">View</button>
            <button class="btn btn-danger" data-action="delete-case" data-id="${escapeHtml(c.caseId || c.id || "")}">Delete</button>
          </div>
        </td>
      </tr>
    `
    )
    .join("");
}

async function createCase(e) {
  e.preventDefault();

  const importantDate = ui.newCaseImportantDate.value;
  const payload = {
    lawyerId: state.lawyerId,
    title: ui.newCaseTitle.value.trim(),
    clientName: ui.newCaseClientName.value.trim(),
    status: ui.newCaseStatus.value,
    priority: ui.newCasePriority.value,
    caseType: ui.newCaseType.value.trim(),
    description: ui.newCaseDescription.value.trim(),
    opposingCounsel: ui.newCaseOpposingCounsel.value.trim(),
    importantDates: importantDate ? [importantDate] : []
  };

  if (!payload.title || !payload.clientName || !payload.caseType || !payload.description) {
    showFlash("Please complete all required case fields.", "warning");
    return;
  }

  try {
    const result = await withLoading(() =>
      apiRequest("/api/cases", {
        method: "POST",
        body: payload
      })
    );

    state.cases.unshift(
      normalizeCase({
        caseId: result.caseId || `C-${Date.now()}`,
        lawyerId: state.lawyerId,
        title: payload.title,
        clientName: payload.clientName,
        status: payload.status,
        priority: payload.priority,
        caseType: payload.caseType,
        lastUpdated: toISODate(new Date()),
        description: payload.description,
        opposingCounsel: payload.opposingCounsel || "Not specified",
        importantDates: payload.importantDates,
        lastNote: ""
      })
    );

    state.cases.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
    ui.caseCreateForm.reset();
    ui.caseCreateForm.classList.add("hidden");
    renderCases();
    renderCaseTypeOptions();
    renderCaseOptionsForDocs();
    renderOverviewStats();
    showFlash("Case created successfully.", "success");
  } catch (error) {
    showFlash(error.message || "Failed to create case.", "error");
  }
}

function openCaseModal(caseId) {
  const selected = state.cases.find((c) => String(c.caseId || c.id || "") === String(caseId));
  if (!selected) return;

  state.selectedCaseId = selected.caseId || selected.id || "";

  ui.caseDetailBody.innerHTML = `
    <div class="detail-row"><strong>Case ID:</strong> ${escapeHtml(selected.caseId)}</div>
    <div class="detail-row"><strong>Title:</strong> ${escapeHtml(selected.title)}</div>
    <div class="detail-row"><strong>Client:</strong> ${escapeHtml(selected.clientName)}</div>
    <div class="detail-row"><strong>Status:</strong> ${escapeHtml(selected.status)}</div>
    <div class="detail-row"><strong>Priority:</strong> ${escapeHtml(selected.priority)}</div>
    <div class="detail-row"><strong>Type:</strong> ${escapeHtml(selected.caseType || "General")}</div>
    <div class="detail-row"><strong>Opposing Counsel:</strong> ${escapeHtml(selected.opposingCounsel || "-")}</div>
    <div class="detail-row"><strong>Description:</strong> ${escapeHtml(selected.description || "-")}</div>
    <div class="detail-row"><strong>Important Dates:</strong>
      ${
        selected.importantDates.length
          ? selected.importantDates.map((d) => `<span class="inline-pill">${formatDate(d)}</span>`).join("")
          : " None"
      }
    </div>
  `;

  setSelectValueCaseInsensitive(ui.caseStatusSelect, selected.status, "Open", true);

  ui.caseEditTitle.value = selected.title || "";
  ui.caseEditClientName.value = selected.clientName || "";
  setSelectValueCaseInsensitive(ui.caseEditPriority, selected.priority, "Medium", false);
  ui.caseEditType.value = selected.caseType || "General";
  ui.caseEditOpposingCounsel.value = selected.opposingCounsel || "";
  ui.caseEditDescription.value = selected.description || "";
  ui.caseEditImportantDate.value = selected.importantDates?.[0] ? normalizeDate(selected.importantDates[0]) : "";
  ui.caseNotes.value = selected.lastNote || "";
  openModal("caseModal");
}

async function updateCase(e) {
  e.preventDefault();
  const caseId = state.selectedCaseId;
  if (!caseId) return;

  const caseObj = state.cases.find((c) => String(c.caseId || c.id || "") === String(caseId));
  if (!caseObj) return;

  const newStatus = ui.caseStatusSelect.value;
  const notes = ui.caseNotes.value.trim();
  const updatedTitle = ui.caseEditTitle.value.trim();
  const updatedClientName = ui.caseEditClientName.value.trim();
  const updatedPriority = ui.caseEditPriority.value;
  const updatedCaseType = ui.caseEditType.value.trim();
  const updatedOpposingCounsel = ui.caseEditOpposingCounsel.value.trim();
  const updatedDescription = ui.caseEditDescription.value.trim();
  const updatedImportantDate = ui.caseEditImportantDate.value;
  const updatedImportantDates = updatedImportantDate ? [updatedImportantDate] : [];

  if (!updatedTitle || !updatedClientName || !updatedCaseType) {
    showFlash("Title, client name and case type are required.", "warning");
    return;
  }

  const hasFieldChanges =
    newStatus !== caseObj.status ||
    updatedTitle !== String(caseObj.title || "") ||
    updatedClientName !== String(caseObj.clientName || "") ||
    updatedPriority !== String(caseObj.priority || "") ||
    updatedCaseType !== String(caseObj.caseType || "") ||
    updatedOpposingCounsel !== String(caseObj.opposingCounsel || "") ||
    updatedDescription !== String(caseObj.description || "") ||
    JSON.stringify(updatedImportantDates) !== JSON.stringify(caseObj.importantDates || []);

  if (!hasFieldChanges && !notes) {
    showFlash("No changes to update.", "info");
    return;
  }

  try {
    const updatedFields = {
      status: newStatus,
      title: updatedTitle,
      clientName: updatedClientName,
      priority: updatedPriority,
      caseType: updatedCaseType,
      opposingCounsel: updatedOpposingCounsel,
      description: updatedDescription,
      importantDates: updatedImportantDates,
      lastUpdated: new Date().toISOString()
    };

    await withLoading(async () => {
      if (newStatus !== caseObj.status) {
        await apiRequest("/api/cases/status", {
          method: "PUT",
          body: { caseId, newStatus }
        });
      }

      await apiRequest("/api/cases/update", {
        method: "PUT",
        body: {
          caseId,
          notes,
          updatedFields
        }
      });
    });

    await loadCases();
    renderCases();
    renderCaseTypeOptions();
    renderCaseOptionsForDocs();
    renderOverviewStats();
    closeModal("caseModal");
    showFlash("Case updated successfully.", "success");
  } catch (error) {
    showFlash(error.message || "Failed to update case.", "error");
  }
}

async function removeCase(caseId) {
  if (!caseId) {
    showFlash("This case record is missing an ID and cannot be deleted.", "error");
    return;
  }

  const sure = confirm(`Delete case ${caseId}?`);
  if (!sure) return;

  try {
    await withLoading(() =>
      apiRequest(`/api/cases?caseId=${encodeURIComponent(caseId)}`, {
        method: "DELETE"
      })
    );

    state.cases = state.cases.filter((c) => String(c.caseId || c.id || "") !== String(caseId));
    state.documents = state.documents.filter((d) => String(d.caseId) !== String(caseId));
    renderCases();
    renderDocuments();
    renderCaseTypeOptions();
    renderCaseOptionsForDocs();
    renderOverviewStats();
    if (String(state.selectedCaseId || "") === String(caseId)) {
      closeModal("caseModal");
      state.selectedCaseId = null;
    }
    showFlash("Case deleted successfully.", "success");
  } catch (error) {
    showFlash(error.message || "Failed to delete case.", "error");
  }
}

function renderCaseOptionsForDocs() {
  const options = state.cases
    .map((c) => {
      const id = c.caseId || c.id || "";
      return `<option value="${escapeHtml(id)}">${escapeHtml(id)} - ${escapeHtml(c.title)}</option>`;
    })
    .join("");

  ui.docCaseSelect.innerHTML = options || `<option value="">No cases available</option>`;
  ui.editDocCaseSelect.innerHTML = options || `<option value="">No cases available</option>`;
}

function getFilteredDocuments() {
  const q = ui.docSearchInput.value.trim().toLowerCase();
  const from = ui.docFromDate.value ? new Date(`${ui.docFromDate.value}T00:00:00`) : null;
  const to = ui.docToDate.value ? new Date(`${ui.docToDate.value}T23:59:59`) : null;

  return state.documents.filter((doc) => {
    const matchesSearch =
      !q ||
      String(doc.title).toLowerCase().includes(q) ||
      String(doc.docId).toLowerCase().includes(q) ||
      String(doc.caseId).toLowerCase().includes(q);

    const uploadDate = new Date(doc.uploadDate);
    const matchesFrom = !from || uploadDate >= from;
    const matchesTo = !to || uploadDate <= to;

    return matchesSearch && matchesFrom && matchesTo;
  });
}

function renderDocuments() {
  const docs = getFilteredDocuments();

  if (!docs.length) {
    ui.docsTableBody.innerHTML = `<tr><td colspan="7"><p class="empty">No documents found for current filters.</p></td></tr>`;
    return;
  }

  ui.docsTableBody.innerHTML = docs
    .map(
      (doc) => `
      <tr>
        <td>${escapeHtml(doc.docId)}</td>
        <td>${escapeHtml(doc.title)}</td>
        <td>${escapeHtml(doc.caseId)}</td>
        <td>${escapeHtml(doc.fileType || "-")}</td>
        <td>${formatDate(doc.uploadDate)}</td>
        <td>${escapeHtml(truncate(doc.description, 62))}</td>
        <td>
          <button class="btn btn-secondary" data-action="edit-doc" data-id="${escapeHtml(doc.docId)}">View/Edit</button>
          <button class="btn btn-danger" data-action="delete-doc" data-id="${escapeHtml(doc.docId)}">Delete</button>
        </td>
      </tr>
    `
    )
    .join("");
}

async function createDocument(e) {
  e.preventDefault();

  const payload = {
    title: ui.docTitle.value.trim(),
    caseId: ui.docCaseSelect.value,
    description: ui.docDescription.value.trim(),
    lawyerId: state.lawyerId
  };

  if (!payload.title || !payload.caseId || !payload.description) {
    showFlash("Please complete all document fields.", "warning");
    return;
  }

  try {
    const result = await withLoading(() =>
      apiRequest("/api/documents", {
        method: "POST",
        body: payload
      })
    );

    const newDoc = {
      docId: result.docId || `D-${Date.now()}`,
      title: payload.title,
      caseId: payload.caseId,
      description: payload.description,
      lawyerId: state.lawyerId,
      uploadDate: toISODate(new Date()),
      fileType: "PDF"
    };

    state.documents.unshift(newDoc);
    renderDocuments();
    renderOverviewStats();
    ui.documentCreateForm.reset();
    ui.documentCreateForm.classList.add("hidden");
    showFlash("Document created successfully.", "success");
  } catch (error) {
    showFlash(error.message || "Failed to create document.", "error");
  }
}

function openDocumentModal(docId) {
  const doc = state.documents.find((d) => String(d.docId) === String(docId));
  if (!doc) return;

  state.selectedDocId = doc.docId;
  ui.editDocId.value = doc.docId;
  ui.editDocTitle.value = doc.title || "";
  ui.editDocCaseSelect.value = doc.caseId || "";
  ui.editDocDescription.value = doc.description || "";

  openModal("documentModal");
}

async function saveDocumentEdit(e) {
  e.preventDefault();
  const docId = ui.editDocId.value;

  const payload = {
    docId,
    title: ui.editDocTitle.value.trim(),
    description: ui.editDocDescription.value.trim(),
    caseId: ui.editDocCaseSelect.value
  };

  if (!payload.docId || !payload.title || !payload.description || !payload.caseId) {
    showFlash("All document fields are required.", "warning");
    return;
  }

  try {
    await withLoading(() =>
      apiRequest("/api/documents", {
        method: "PUT",
        body: payload
      })
    );

    const target = state.documents.find((d) => d.docId === payload.docId);
    if (target) {
      target.title = payload.title;
      target.description = payload.description;
      target.caseId = payload.caseId;
    }

    renderDocuments();
    renderOverviewStats();
    closeModal("documentModal");
    showFlash("Document updated successfully.", "success");
  } catch (error) {
    showFlash(error.message || "Failed to update document.", "error");
  }
}

async function removeDocument(docId) {
  const sure = confirm(`Delete document ${docId}?`);
  if (!sure) return;

  try {
    await withLoading(() =>
      apiRequest(`/api/documents?docId=${encodeURIComponent(docId)}`, {
        method: "DELETE"
      })
    );

    state.documents = state.documents.filter((d) => d.docId !== docId);
    renderDocuments();
    renderOverviewStats();
    showFlash("Document deleted successfully.", "success");
  } catch (error) {
    showFlash(error.message || "Failed to delete document.", "error");
  }
}

function renderCalendar() {
  const year = state.currentMonth.getFullYear();
  const month = state.currentMonth.getMonth();
  ui.calendarMonthLabel.textContent = new Date(year, month, 1).toLocaleString(undefined, {
    month: "long",
    year: "numeric"
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const todayIso = toISODate(new Date());

  let html = "";
  let dayCounter = 1;

  for (let i = 0; i < totalCells; i++) {
    if (i < firstDay || dayCounter > daysInMonth) {
      html += `<div class="calendar-cell empty-cell"></div>`;
      continue;
    }

    const dayIso = `${year}-${pad(month + 1)}-${pad(dayCounter)}`;
    const events = state.schedule.filter((ev) => normalizeDate(ev.date) === dayIso);

    html += `
      <div class="calendar-cell ${dayIso === todayIso ? "today" : ""}">
        <div class="calendar-day">${dayCounter}</div>
        <div class="calendar-events">
          ${events
            .map(
              (ev) =>
                `<button type="button" class="event-chip" data-id="${escapeHtml(ev.eventId)}">${escapeHtml(
                  ev.time
                )} - ${escapeHtml(truncate(ev.title, 24))}</button>`
            )
            .join("")}
        </div>
      </div>
    `;
    dayCounter += 1;
  }

  ui.calendarGrid.innerHTML = html;
}

function renderReminders() {
  const today = toISODate(new Date());
  const tomorrow = toISODate(addDays(new Date(), 1));

  const reminders = state.schedule
    .filter((ev) => {
      const d = normalizeDate(ev.date);
      return d === today || d === tomorrow;
    })
    .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));

  if (!reminders.length) {
    ui.remindersList.innerHTML = `<li class="empty">No reminders for today or tomorrow.</li>`;
    return;
  }

  ui.remindersList.innerHTML = reminders
    .map((ev) => {
      const dayTag = normalizeDate(ev.date) === today ? "Today" : "Tomorrow";
      return `
        <li>
          <strong>${escapeHtml(ev.title)}</strong>
          <span class="reminder-day">${dayTag}</span>
          <div class="reminder-time">${formatDate(ev.date)} at ${escapeHtml(ev.time)} (${escapeHtml(ev.type || "Event")})</div>
        </li>
      `;
    })
    .join("");
}

async function createEvent(e) {
  e.preventDefault();

  const payload = {
    lawyerId: state.lawyerId,
    title: ui.eventTitle.value.trim(),
    date: ui.eventDate.value,
    time: ui.eventTime.value,
    type: ui.eventType.value
  };

  if (!payload.title || !payload.date || !payload.time || !payload.type) {
    showFlash("Please complete all event fields.", "warning");
    return;
  }

  try {
    const result = await withLoading(() =>
      apiRequest("/api/schedule", {
        method: "POST",
        body: payload
      })
    );

    state.schedule.push({
      eventId: result.eventId || `E-${Date.now()}`,
      title: payload.title,
      date: payload.date,
      time: payload.time,
      type: payload.type,
      lawyerId: state.lawyerId
    });

    state.schedule.sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));

    ui.eventCreateForm.reset();
    renderCalendar();
    renderReminders();
    renderOverviewStats();
    showFlash("Event created successfully.", "success");
  } catch (error) {
    showFlash(error.message || "Failed to create event.", "error");
  }
}

function openEventModal(eventId) {
  const ev = state.schedule.find((item) => String(item.eventId) === String(eventId));
  if (!ev) return;

  state.selectedEventId = ev.eventId;
  ui.editEventId.value = ev.eventId;
  ui.editEventTitle.value = ev.title || "";
  ui.editEventDate.value = normalizeDate(ev.date);
  ui.editEventTime.value = ev.time || "";

  openModal("eventModal");
}

async function saveEventEdit(e) {
  e.preventDefault();

  const payload = {
    eventId: ui.editEventId.value,
    title: ui.editEventTitle.value.trim(),
    date: ui.editEventDate.value,
    time: ui.editEventTime.value
  };

  if (!payload.eventId || !payload.title || !payload.date || !payload.time) {
    showFlash("Please complete all event fields.", "warning");
    return;
  }

  try {
    await withLoading(() =>
      apiRequest("/api/schedule", {
        method: "PUT",
        body: payload
      })
    );

    const target = state.schedule.find((ev) => ev.eventId === payload.eventId);
    if (target) {
      target.title = payload.title;
      target.date = payload.date;
      target.time = payload.time;
    }

    state.schedule.sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));

    closeModal("eventModal");
    renderCalendar();
    renderReminders();
    renderOverviewStats();
    showFlash("Event rescheduled successfully.", "success");
  } catch (error) {
    showFlash(error.message || "Failed to update event.", "error");
  }
}

function renderNotificationBadge() {
  const unread = state.notifications.filter((n) => !n.isRead).length;
  if (!unread) {
    ui.notifBadge.classList.add("hidden");
  } else {
    ui.notifBadge.textContent = String(unread);
    ui.notifBadge.classList.remove("hidden");
  }
}

function notificationItemHtml(n) {
  return `
    <li class="notif-item ${n.isRead ? "" : "unread"}">
      <div class="notif-message">${escapeHtml(n.message)}</div>
      <div class="notif-meta">
        <span>${formatDateTime(n.createdAt)}</span>
        ${
          n.isRead
            ? `<span>Read</span>`
            : `<button class="text-btn" data-action="mark-read" data-id="${escapeHtml(n.notifId)}">Mark Read</button>`
        }
      </div>
    </li>
  `;
}

function renderNotificationDropdown() {
  if (!state.notifications.length) {
    ui.notifDropdownList.innerHTML = `<li class="empty">No notifications.</li>`;
    return;
  }

  ui.notifDropdownList.innerHTML = state.notifications.slice(0, 6).map(notificationItemHtml).join("");
}

function renderNotificationsPanel() {
  if (!state.notifications.length) {
    ui.notificationsPanelList.innerHTML = `<li class="empty">No notifications found.</li>`;
    return;
  }

  ui.notificationsPanelList.innerHTML = state.notifications.map(notificationItemHtml).join("");
}

async function markNotificationRead(notifId) {
  try {
    await withLoading(() =>
      apiRequest("/api/notifications/read", {
        method: "PATCH",
        body: { notifId }
      })
    );

    const target = state.notifications.find((n) => n.notifId === notifId);
    if (target) target.isRead = true;

    renderNotificationBadge();
    renderNotificationDropdown();
    renderNotificationsPanel();
    renderOverviewStats();
  } catch (error) {
    showFlash(error.message || "Failed to mark notification as read.", "error");
  }
}

async function markAllNotificationsRead() {
  const unread = state.notifications.filter((n) => !n.isRead);
  if (!unread.length) {
    showFlash("No unread notifications.", "info");
    return;
  }

  try {
    await withLoading(async () => {
      await Promise.all(
        unread.map((n) =>
          apiRequest("/api/notifications/read", {
            method: "PATCH",
            body: { notifId: n.notifId }
          })
        )
      );
    });

    unread.forEach((n) => {
      n.isRead = true;
    });

    renderNotificationBadge();
    renderNotificationDropdown();
    renderNotificationsPanel();
    renderOverviewStats();
    showFlash("All notifications marked as read.", "success");
  } catch (error) {
    showFlash(error.message || "Failed to mark all notifications.", "error");
  }
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove("hidden");
  document.body.classList.add("no-scroll");
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add("hidden");

  const openModals = Array.from(document.querySelectorAll(".modal")).some((m) => !m.classList.contains("hidden"));
  if (!openModals) document.body.classList.remove("no-scroll");
}

async function apiRequest(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const body = options.body;
  const auth = options.auth !== false;

  const headers = { "Content-Type": "application/json" };
  if (auth && state.token) headers.Authorization = `Bearer ${state.token}`;

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
  } catch (networkError) {
    if (DEMO_MODE_FALLBACK) {
      enableDemoMode();
      return mockApi(path, { method, body });
    }
    throw networkError;
  }

  let data = {};
  if (response.status !== 204) {
    const type = response.headers.get("content-type") || "";
    if (type.includes("application/json")) {
      data = await response.json();
    }
  }

  if (!response.ok) {
    throw new Error((data && data.message) || `Request failed (${response.status}).`);
  }

  return data;
}

function enableDemoMode() {
  if (state.demoMode) return;
  state.demoMode = true;
  showFlash("API unreachable. Running in demo mode with mock data.", "warning", 5000);
}

function mockApi(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const body = options.body || {};
  const [pathname, query = ""] = path.split("?");
  const params = new URLSearchParams(query);

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const route = `${method} ${pathname}`;

        switch (route) {
          case "POST /api/auth/login": {
            const user = mockDb.users.find((u) => u.email === body.email && u.password === body.password);
            if (user) {
              resolve({ lawyerId: user.lawyerId, name: user.name, token: user.token });
              return;
            }
            const legacyLawyer = findLegacyLawyerByCredentials(body.email, body.password);
            if (!legacyLawyer) throw new Error("Invalid credentials. Try lawyer@example.com / password123");
            ensureLegacyLawyerHydrated(legacyLawyer.id);
            resolve({
              lawyerId: legacyLawyer.id,
              name: legacyLawyer.name,
              token: `legacy-token-${legacyLawyer.id}`
            });
            return;
          }

          case "GET /api/lawyer/profile": {
            const lawyerId = params.get("lawyerId");
            ensureLegacyLawyerHydrated(lawyerId);
            const user = mockDb.users.find((u) => u.lawyerId === lawyerId);
            if (user) {
              resolve({
                lawyerId: user.lawyerId,
                name: user.name,
                email: user.email,
                phone: user.phone,
                barId: user.barId,
                specialization: user.specialization
              });
              return;
            }
            const legacyProfile = getLegacyLawyerProfileById(lawyerId);
            if (!legacyProfile) throw new Error("Lawyer not found.");
            resolve(legacyProfile);
            return;
          }

          case "PUT /api/lawyer/profile": {
            const user = mockDb.users.find((u) => u.lawyerId === body.lawyerId);
            if (!user) throw new Error("Lawyer not found.");
            user.name = body.name;
            user.email = body.email;
            user.phone = body.phone;
            resolve({ success: true, message: "Profile updated." });
            return;
          }

          case "DELETE /api/lawyer/profile": {
            const lawyerId = params.get("lawyerId");
            const idx = mockDb.users.findIndex((u) => u.lawyerId === lawyerId);
            if (idx === -1) throw new Error("Lawyer not found.");
            mockDb.users.splice(idx, 1);
            mockDb.cases = mockDb.cases.filter((c) => c.lawyerId !== lawyerId);
            mockDb.documents = mockDb.documents.filter((d) => d.lawyerId !== lawyerId);
            mockDb.schedule = mockDb.schedule.filter((s) => s.lawyerId !== lawyerId);
            mockDb.notifications = mockDb.notifications.filter((n) => n.lawyerId !== lawyerId);
            resolve({ success: true });
            return;
          }

          case "GET /api/cases": {
            const lawyerId = params.get("lawyerId");
            ensureLegacyLawyerHydrated(lawyerId);
            resolve(clone(mockDb.cases.filter((c) => c.lawyerId === lawyerId)));
            return;
          }

          case "POST /api/cases": {
            const caseId = `C-${++mockDb.meta.caseSeq}`;
            const newCase = {
              caseId,
              lawyerId: body.lawyerId,
              title: body.title,
              clientName: body.clientName,
              status: body.status || "Open",
              priority: body.priority || "Medium",
              caseType: body.caseType || "General",
              lastUpdated: toISODate(new Date()),
              description: body.description || "No description provided.",
              opposingCounsel: body.opposingCounsel || "Not specified",
              importantDates: Array.isArray(body.importantDates) ? body.importantDates : [],
              lastNote: ""
            };
            mockDb.cases.unshift(newCase);
            pushMockNotification(body.lawyerId, `Case ${caseId} created successfully.`);
            resolve({ caseId, success: true });
            return;
          }

          case "DELETE /api/cases": {
            const caseId = params.get("caseId");
            const idx = mockDb.cases.findIndex((x) => String(x.caseId) === String(caseId));
            if (idx === -1) throw new Error("Case not found.");
            const deleted = mockDb.cases[idx];
            mockDb.cases.splice(idx, 1);
            mockDb.documents = mockDb.documents.filter((d) => String(d.caseId) !== String(caseId));
            pushMockNotification(deleted.lawyerId, `Case ${caseId} deleted.`);
            resolve({ success: true });
            return;
          }

          case "PUT /api/cases/status": {
            const c = mockDb.cases.find((x) => x.caseId === body.caseId);
            if (!c) throw new Error("Case not found.");
            c.status = body.newStatus;
            c.lastUpdated = toISODate(new Date());
            pushMockNotification(c.lawyerId, `Case ${c.caseId} status changed to ${body.newStatus}.`);
            resolve({ success: true });
            return;
          }

          case "PUT /api/cases/update": {
            const c = mockDb.cases.find((x) => x.caseId === body.caseId);
            if (!c) throw new Error("Case not found.");
            c.lastNote = body.notes || c.lastNote || "";
            c.lastUpdated = toISODate(new Date());
            if (body.updatedFields && typeof body.updatedFields === "object") {
              Object.assign(c, body.updatedFields);
              c.lastUpdated = toISODate(new Date());
            }
            pushMockNotification(c.lawyerId, `Case ${c.caseId} was updated with new notes.`);
            resolve({ success: true });
            return;
          }

          case "GET /api/documents": {
            const lawyerId = params.get("lawyerId");
            ensureLegacyLawyerHydrated(lawyerId);
            resolve(clone(mockDb.documents.filter((d) => d.lawyerId === lawyerId)));
            return;
          }

          case "POST /api/documents": {
            const docId = `D-${++mockDb.meta.docSeq}`;
            const newDoc = {
              docId,
              title: body.title,
              caseId: body.caseId,
              description: body.description,
              lawyerId: body.lawyerId,
              uploadDate: toISODate(new Date()),
              fileType: "PDF"
            };
            mockDb.documents.push(newDoc);
            pushMockNotification(body.lawyerId, `New document ${docId} added to case ${body.caseId}.`);
            resolve({ docId, success: true });
            return;
          }

          case "PUT /api/documents": {
            const doc = mockDb.documents.find((d) => d.docId === body.docId);
            if (!doc) throw new Error("Document not found.");
            doc.title = body.title;
            doc.description = body.description;
            doc.caseId = body.caseId;
            resolve({ success: true });
            return;
          }

          case "DELETE /api/documents": {
            const docId = params.get("docId");
            const idx = mockDb.documents.findIndex((d) => d.docId === docId);
            if (idx === -1) throw new Error("Document not found.");
            mockDb.documents.splice(idx, 1);
            resolve({ success: true });
            return;
          }

          case "GET /api/schedule": {
            const lawyerId = params.get("lawyerId");
            ensureLegacyLawyerHydrated(lawyerId);
            resolve(clone(mockDb.schedule.filter((s) => s.lawyerId === lawyerId)));
            return;
          }

          case "POST /api/schedule": {
            const eventId = `E-${++mockDb.meta.eventSeq}`;
            const event = {
              eventId,
              lawyerId: body.lawyerId,
              title: body.title,
              date: body.date,
              time: body.time,
              type: body.type
            };
            mockDb.schedule.push(event);
            pushMockNotification(body.lawyerId, `New schedule event created: ${body.title}.`);
            resolve({ eventId });
            return;
          }

          case "PUT /api/schedule": {
            const ev = mockDb.schedule.find((s) => s.eventId === body.eventId);
            if (!ev) throw new Error("Event not found.");
            ev.title = body.title;
            ev.date = body.date;
            ev.time = body.time;
            pushMockNotification(ev.lawyerId, `Event ${ev.eventId} has been rescheduled.`);
            resolve({ success: true });
            return;
          }

          case "GET /api/notifications": {
            const lawyerId = params.get("lawyerId");
            ensureLegacyLawyerHydrated(lawyerId);
            const list = mockDb.notifications.filter((n) => n.lawyerId === lawyerId);
            list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            resolve(clone(list));
            return;
          }

          case "PATCH /api/notifications/read": {
            const notif = mockDb.notifications.find((n) => n.notifId === body.notifId);
            if (!notif) throw new Error("Notification not found.");
            notif.isRead = true;
            resolve({ success: true });
            return;
          }

          default:
            throw new Error(`Mock route missing: ${route}`);
        }
      } catch (err) {
        reject(err);
      }
    }, 350);
  });
}

function getLegacyData() {
  try {
    const raw = localStorage.getItem(LEGACY_DATA_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data && Array.isArray(data.users) ? data : null;
  } catch (_error) {
    return null;
  }
}

function findLegacyLawyerByCredentials(email, password) {
  const data = getLegacyData();
  if (!data) return null;
  return (
    data.users.find(
      (u) =>
        String(u.role || "").toLowerCase() === "lawyer" &&
        String(u.email || "").toLowerCase() === String(email || "").toLowerCase() &&
        String(u.password || "") === String(password || "")
    ) || null
  );
}

function getLegacyLawyerProfileById(lawyerId) {
  const data = getLegacyData();
  if (!data) return null;

  const user =
    data.users.find(
      (u) =>
        String(u.role || "").toLowerCase() === "lawyer" &&
        String(u.id || "") === String(lawyerId || "")
    ) || null;

  if (!user) return null;

  return {
    lawyerId: user.id,
    name: user.name || "Lawyer",
    email: user.email || "",
    phone: user.phone || "",
    barId: `BAR-${String(user.id).replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase() || "000001"}`,
    specialization: user.department || "General Practice"
  };
}

function ensureLegacyLawyerHydrated(lawyerId) {
  const normalizedId = String(lawyerId || "").trim();
  if (!normalizedId) return;

  const data = getLegacyData();
  if (!data || !Array.isArray(data.users)) return;

  const legacyLawyer =
    data.users.find(
      (u) => String(u.role || "").toLowerCase() === "lawyer" && String(u.id || "") === normalizedId
    ) || null;

  if (!legacyLawyer) return;

  const existingUser = mockDb.users.find((u) => String(u.lawyerId) === normalizedId);
  const hydratedUser = {
    lawyerId: normalizedId,
    name: legacyLawyer.name || "Lawyer",
    email: legacyLawyer.email || `${normalizedId}@lawfirm.local`,
    password: legacyLawyer.password || "password123",
    phone: legacyLawyer.phone || "",
    barId: `BAR-${normalizedId.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase() || "000001"}`,
    specialization: legacyLawyer.department || "General Practice",
    token: `legacy-token-${normalizedId}`
  };

  if (existingUser) {
    Object.assign(existingUser, hydratedUser);
  } else {
    mockDb.users.push(hydratedUser);
  }

  const usersById = new Map((data.users || []).map((u) => [String(u.id || ""), u]));

  if (Array.isArray(data.cases)) {
    data.cases
      .filter((c) => String(c.lawyerId || "") === normalizedId)
      .forEach((c, idx) => {
        const caseId = String(c.caseId || c.id || `C-L${Date.now()}-${idx}`);
        if (mockDb.cases.some((x) => String(x.caseId) === caseId)) return;
        const clientFromUser = usersById.get(String(c.clientId || ""));
        const caseTitle = c.title || `Case ${caseId}`;
        const hearingDate = c.hearingDate ? normalizeDate(c.hearingDate) : "";
        mockDb.cases.push({
          caseId,
          lawyerId: normalizedId,
          title: caseTitle,
          clientName: c.clientName || c.client || clientFromUser?.name || "Unknown Client",
          status: c.status || "Open",
          priority: c.priority || "Medium",
          caseType: c.caseType || c.type || "General",
          lastUpdated: normalizeDate(c.lastUpdated || hearingDate || toISODate(new Date())),
          description: c.description || c.notes || "No description provided.",
          opposingCounsel: c.opposingCounsel || "Not specified",
          importantDates: Array.isArray(c.importantDates)
            ? c.importantDates.map((d) => normalizeDate(d)).filter(Boolean)
            : hearingDate
              ? [hearingDate]
              : [],
          lastNote: c.lastNote || ""
        });
      });
  }

  if (Array.isArray(data.documents)) {
    data.documents
      .filter((d) => String(d.lawyerId || d.ownerId || "") === normalizedId)
      .forEach((d, idx) => {
        const docId = String(d.docId || d.id || `D-L${Date.now()}-${idx}`);
        if (mockDb.documents.some((x) => String(x.docId) === docId)) return;
        mockDb.documents.push({
          docId,
          lawyerId: normalizedId,
          title: d.title || d.name || `Document ${docId}`,
          caseId: String(d.caseId || "N/A"),
          uploadDate: normalizeDate(d.uploadDate || d.updatedOn || toISODate(new Date())),
          fileType: d.fileType || d.category || "FILE",
          description: d.description || "No description provided."
        });
      });
  }

  const legacySchedule = Array.isArray(data.schedule) ? data.schedule : Array.isArray(data.schedules) ? data.schedules : [];
  legacySchedule
    .filter((s) => String(s.lawyerId || "") === normalizedId)
    .forEach((s, idx) => {
      const eventId = String(s.eventId || s.id || `E-L${Date.now()}-${idx}`);
      if (mockDb.schedule.some((x) => String(x.eventId) === eventId)) return;
      mockDb.schedule.push({
        eventId,
        lawyerId: normalizedId,
        title: s.title || `Event ${eventId}`,
        date: normalizeDate(s.date || toISODate(new Date())),
        time: s.time || "09:00",
        type: s.type || s.category || "Event"
      });
    });

  if (Array.isArray(data.notifications)) {
    data.notifications
      .filter((n) => String(n.lawyerId || n.userId || "") === normalizedId)
      .forEach((n, idx) => {
        const notifId = String(n.notifId || n.id || `N-L${Date.now()}-${idx}`);
        if (mockDb.notifications.some((x) => String(x.notifId) === notifId)) return;
        const msg = n.message || n.title || "New notification";
        mockDb.notifications.push({
          notifId,
          lawyerId: normalizedId,
          message: msg,
          createdAt: n.createdAt || n.date || new Date().toISOString(),
          isRead: Boolean(n.isRead)
        });
      });
  }
}

function pushMockNotification(lawyerId, message) {
  const notifId = `N-${++mockDb.meta.notifSeq}`;
  mockDb.notifications.unshift({
    notifId,
    lawyerId,
    message,
    createdAt: new Date().toISOString(),
    isRead: false
  });
}

function withLoading(work) {
  setLoading(true);
  return Promise.resolve()
    .then(work)
    .finally(() => setLoading(false));
}

function setLoading(isLoading) {
  loadingCounter += isLoading ? 1 : -1;
  if (loadingCounter < 0) loadingCounter = 0;
  ui.globalSpinner.classList.toggle("hidden", loadingCounter === 0);
}

function showFlash(message, type = "info", timeout = 3200) {
  const item = document.createElement("div");
  item.className = `flash flash-${type}`;
  item.textContent = message;
  ui.flashContainer.appendChild(item);

  setTimeout(() => {
    item.remove();
  }, timeout);
}

function formatDate(input) {
  if (!input) return "-";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return String(input);
  return d.toLocaleDateString();
}

function formatDateTime(input) {
  if (!input) return "-";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return String(input);
  return d.toLocaleString();
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function toISODate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function normalizeDate(dateInput) {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return String(dateInput).slice(0, 10);
  return toISODate(d);
}

function addDays(date, days) {
  const cloneDate = new Date(date);
  cloneDate.setDate(cloneDate.getDate() + days);
  return cloneDate;
}

function isoFromOffset(offsetDays) {
  return toISODate(addDays(new Date(), offsetDays));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function truncate(value, len) {
  const str = String(value ?? "");
  return str.length > len ? `${str.slice(0, len - 1)}...` : str;
}

function slug(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function setSelectValueCaseInsensitive(selectEl, value, fallback = "", addWhenMissing = false) {
  if (!selectEl) return;
  const requested = String(value || "").trim().toLowerCase();
  const optionMatch = Array.from(selectEl.options || []).find(
    (opt) => String(opt.value || "").trim().toLowerCase() === requested
  );

  if (optionMatch) {
    selectEl.value = optionMatch.value;
    return;
  }

  if (addWhenMissing && value) {
    const customOpt = new Option(String(value), String(value), true, true);
    selectEl.add(customOpt);
    return;
  }

  selectEl.value = fallback;
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
