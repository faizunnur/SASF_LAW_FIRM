const STORAGE_KEY = "lexbridge-data-v1";
const SESSION_KEY = "lexbridge-session-v1";

const appState = {
  data: null,
  currentUserId: null,
  activeSection: "dashboard"
};

// UI Elements
const els = {
  navItems: document.querySelectorAll(".nav-item"),
  sections: document.querySelectorAll(".module-section"),
  pageTitle: document.getElementById("pageTitle"),
  pageSubtitle: document.getElementById("pageSubtitle"),
  userBanner: document.getElementById("userBanner"),
  logoutBtn: document.getElementById("logoutBtn"),
  toast: document.getElementById("toast"),
  
  // Stats
  statTotalCases: document.getElementById("statTotalCases"),
  statPendingAppts: document.getElementById("statPendingAppts"),
  statTotalDocs: document.getElementById("statTotalDocs"),
  
  // Lists/Tables
  recentActivityList: document.getElementById("recentActivityList"),
  caseTableBody: document.getElementById("caseTableBody"),
  documentTableBody: document.getElementById("documentTableBody"),
  appointmentTableBody: document.getElementById("appointmentTableBody"),
  searchTableBody: document.getElementById("searchTableBody"),
  
  // Modals
  caseModal: document.getElementById("caseModal"),
  docModal: document.getElementById("docModal"),
  caseForm: document.getElementById("caseForm"),
  docForm: document.getElementById("docForm"),
  lawyerSelect: document.getElementById("lawyerSelect"),
  
  // Search
  globalSearchInput: document.getElementById("globalSearchInput"),
  filterCaseType: document.getElementById("filterCaseType"),
  filterPriority: document.getElementById("filterPriority")
};

// --- Data Core ---

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
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    appState.data = JSON.parse(saved);
  } else {
    appState.data = seedDemoData();
  }
  
  appState.currentUserId = localStorage.getItem(SESSION_KEY);
  if (!appState.currentUserId) {
    window.location.href = "login.html";
    return;
  }
  
  const user = getCurrentUser();
  if (!user || user.role !== "assistant") {
    window.location.href = "index.html";
    return;
  }
  
  renderAll();
}

async function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState.data));
  // Optional: Sync with backend if available
  try {
    await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(appState.data)
    });
  } catch (e) {
    console.warn("Cloud sync failed, data saved locally.");
  }
}

function getCurrentUser() {
  return appState.data.users.find(u => u.id === appState.currentUserId);
}

function showToast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.add("show");
  setTimeout(() => els.toast.classList.remove("show"), 3000);
}

// --- Logic Helpers ---

function addNotification(userId, title, message) {
  appState.data.notifications.unshift({
    id: `N-${Date.now()}`,
    userId,
    title,
    message,
    date: new Date().toISOString().split("T")[0]
  });
}

function generateId(prefix) {
  return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
}

// --- Rendering ---

function renderUserBanner() {
  const user = getCurrentUser();
  if (user) {
    els.userBanner.innerHTML = `
      <div style="text-align: right;">
        <span style="display: block; font-weight: 600; color: #1e293b;">${user.name}</span>
        <span class="badge badge-orange">${user.role.toUpperCase()}</span>
      </div>
    `;
    els.pageSubtitle.textContent = `Welcome back, Assistant ${user.name.split(" ")[0]}`;
  }
}

function renderStats() {
  els.statTotalCases.textContent = appState.data.cases?.length || 0;
  els.statPendingAppts.textContent = appState.data.appointments?.filter(a => a.status === "Pending").length || 0;
  els.statTotalDocs.textContent = appState.data.documents?.length || 0;
}

function renderRecentActivity() {
  const activities = appState.data.notifications.slice(0, 5);
  els.recentActivityList.innerHTML = activities.length > 0
    ? activities.map(a => `
        <div class="entry-card" style="margin-bottom:10px;">
          <div class="entry-row">
            <strong>${a.title}</strong>
            <span class="meta">${a.date}</span>
          </div>
          <p>${a.message}</p>
        </div>
      `).join("")
    : '<div class="empty-state">No recent activities found.</div>';
}

function renderCases() {
  els.caseTableBody.innerHTML = appState.data.cases.map(c => `
    <tr>
      <td><strong>${c.id}</strong></td>
      <td>${c.title}</td>
      <td>${c.client}</td>
      <td>${appState.data.users.find(u => u.id === c.lawyerId)?.name || "Unassigned"}</td>
      <td><span class="badge ${getStatusBadgeClass(c.status)}">${c.status}</span></td>
      <td>
        <div class="action-btns">
          <button class="icon-btn edit-case" data-id="${c.id}" title="Edit">✏️</button>
          <button class="icon-btn delete-case" data-id="${c.id}" title="Delete">🗑️</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function renderDocuments() {
  els.documentTableBody.innerHTML = appState.data.documents.map(d => `
    <tr>
      <td>${d.id}</td>
      <td><strong>${d.name}</strong></td>
      <td><span class="badge badge-gray">${d.category}</span></td>
      <td>${d.updatedOn || "N/A"}</td>
      <td>
        <div class="action-btns">
          <button class="icon-btn edit-doc" data-id="${d.id}">✏️</button>
          <button class="icon-btn delete-doc" data-id="${d.id}">🗑️</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function renderAppointments() {
  els.appointmentTableBody.innerHTML = appState.data.appointments.map(a => `
    <tr>
      <td><strong>${a.date}</strong><br><small>${a.time}</small></td>
      <td>${appState.data.users.find(u => u.id === a.clientId)?.name || "Client"}</td>
      <td>${a.type}</td>
      <td><span class="badge ${a.payment === "Paid" ? "badge-green" : "badge-orange"}">${a.payment || "Pending"}</span></td>
      <td>
        <div class="action-btns">
          ${a.status === "Pending" ? `<button class="primary-btn-sm confirm-appt" data-id="${a.id}">Verify & Confirm</button>` : `<span class="badge badge-green">Confirmed</span>`}
        </div>
      </td>
    </tr>
  `).join("");
}

function renderSearch() {
  const query = els.globalSearchInput.value.toLowerCase();
  const typeFilter = els.filterCaseType.value;
  const priorityFilter = els.filterPriority.value;
  
  const results = appState.data.cases.filter(c => {
    const matchesQuery = c.id.toLowerCase().includes(query) || 
                         c.title.toLowerCase().includes(query) || 
                         c.client.toLowerCase().includes(query);
    const matchesType = !typeFilter || c.type === typeFilter;
    const matchesPriority = !priorityFilter || c.priority === priorityFilter;
    
    return matchesQuery && matchesType && matchesPriority;
  });
  
  els.searchTableBody.innerHTML = results.map(c => `
    <tr>
      <td>${c.id}</td>
      <td><strong>${c.title}</strong></td>
      <td>${c.client}</td>
      <td>${appState.data.users.find(u => u.id === c.lawyerId)?.name || "Unassigned"}</td>
      <td><span class="badge ${getPriorityBadgeClass(c.priority)}">${c.priority}</span></td>
      <td><span class="badge ${getStatusBadgeClass(c.status)}">${c.status}</span></td>
    </tr>
  `).join("");
  
  if (results.length === 0) {
    els.searchTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px; color:#64748b;">No cases matching your search criteria.</td></tr>';
  }
}

function getStatusBadgeClass(status) {
  switch (status) {
    case "Closed": return "badge-gray";
    case "In Progress": return "badge-blue";
    case "Settled": return "badge-green";
    case "On Hold": return "badge-red";
    default: return "badge-orange";
  }
}

function getPriorityBadgeClass(priority) {
  switch (priority) {
    case "High": return "badge-red";
    case "Medium": return "badge-orange";
    case "Low": return "badge-blue";
    default: return "badge-gray";
  }
}

function renderAll() {
  renderUserBanner();
  renderStats();
  renderRecentActivity();
  renderCases();
  renderDocuments();
  renderAppointments();
  renderSearch();
  
  // Populate lawyer select
  const lawyers = appState.data.users.filter(u => u.role === "lawyer");
  els.lawyerSelect.innerHTML = lawyers.map(l => `<option value="${l.id}">${l.name} (${l.department})</option>`).join("");
}

// --- Event Listeners ---

function bindEvents() {
  // Navigation
  els.navItems.forEach(item => {
    item.addEventListener("click", () => {
      const section = item.dataset.section;
      els.navItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      
      els.sections.forEach(s => s.classList.remove("active"));
      document.getElementById(section).classList.add("active");
      
      els.pageTitle.textContent = item.querySelector(".nav-text").textContent + " Overview";
      appState.activeSection = section;
    });
  });

  // Logout
  els.logoutBtn.addEventListener("click", () => {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = "login.html";
  });

  // Modal Controls
  document.getElementById("openCreateCaseModal").addEventListener("click", () => {
    els.caseForm.reset();
    els.caseForm.elements.id.value = "";
    document.getElementById("caseModalTitle").textContent = "Create New Case";
    els.caseModal.classList.add("active");
  });

  document.getElementById("openCreateDocModal").addEventListener("click", () => {
    els.docForm.reset();
    els.docForm.elements.id.value = "";
    document.getElementById("docModalTitle").textContent = "Add Document";
    els.docModal.classList.add("active");
  });

  document.querySelectorAll(".close-modal").forEach(btn => {
    btn.addEventListener("click", () => {
      els.caseModal.classList.remove("active");
      els.docModal.classList.remove("active");
    });
  });

  // Case Form Submit
  els.caseForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(els.caseForm);
    const id = fd.get("id");
    const caseData = {
      title: fd.get("title"),
      client: fd.get("client"),
      lawyerId: fd.get("lawyerId"),
      type: fd.get("type"),
      priority: fd.get("priority"),
      status: fd.get("status"),
      hearingDate: fd.get("hearingDate"),
      notes: fd.get("notes")
    };

    if (id) {
      // Update
      const idx = appState.data.cases.findIndex(c => c.id === id);
      appState.data.cases[idx] = { ...appState.data.cases[idx], ...caseData };
      addNotification("u-all", "Case Updated", `Case ${id} status updated to ${caseData.status}`);
      showToast("Case updated successfully.");
    } else {
      // Create
      const newId = generateId("C");
      appState.data.cases.push({ id: newId, ...caseData });
      addNotification(caseData.lawyerId, "New Case Assigned", `Case ${newId} has been assigned to you.`);
      showToast(`Case ${newId} created and assigned.`);
    }

    saveData();
    renderAll();
    els.caseModal.classList.remove("active");
  });

  // Document Form Submit
  els.docForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(els.docForm);
    const id = fd.get("id");
    const docData = {
      name: fd.get("name"),
      category: fd.get("category"),
      caseId: fd.get("caseId"),
      updatedOn: new Date().toISOString().split("T")[0]
    };

    if (id) {
      const idx = appState.data.documents.findIndex(d => d.id === id);
      appState.data.documents[idx] = { ...appState.data.documents[idx], ...docData };
      showToast("Document updated.");
    } else {
      const newId = generateId("D");
      appState.data.documents.push({ id: newId, ...docData });
      addNotification("u-all", "Document Added", `New document ${docData.name} added to the repository.`);
      showToast("Document added.");
    }

    saveData();
    renderAll();
    els.docModal.classList.remove("active");
  });

  // Table Actions (Case)
  els.caseTableBody.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    
    const id = btn.dataset.id;
    if (btn.classList.contains("edit-case")) {
      const c = appState.data.cases.find(x => x.id === id);
      const f = els.caseForm.elements;
      f.id.value = c.id;
      f.title.value = c.title;
      f.client.value = c.client;
      f.lawyerId.value = c.lawyerId;
      f.type.value = c.type;
      f.priority.value = c.priority;
      f.status.value = c.status;
      f.hearingDate.value = c.hearingDate || "";
      f.notes.value = c.notes || "";
      document.getElementById("caseModalTitle").textContent = "Edit Case " + id;
      els.caseModal.classList.add("active");
    } else if (btn.classList.contains("delete-case")) {
      if (confirm(`Are you sure you want to delete case ${id}?`)) {
        appState.data.cases = appState.data.cases.filter(x => x.id !== id);
        saveData();
        renderAll();
        showToast("Case deleted.");
      }
    }
  });

  // Table Actions (Document)
  els.documentTableBody.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    
    const id = btn.dataset.id;
    if (btn.classList.contains("edit-doc")) {
      const d = appState.data.documents.find(x => x.id === id);
      const f = els.docForm.elements;
      f.id.value = d.id;
      f.name.value = d.name;
      f.category.value = d.category;
      f.caseId.value = d.caseId || "";
      document.getElementById("docModalTitle").textContent = "Edit Document " + id;
      els.docModal.classList.add("active");
    } else if (btn.classList.contains("delete-doc")) {
      if (confirm("Delete this document?")) {
        appState.data.documents = appState.data.documents.filter(x => x.id !== id);
        saveData();
        renderAll();
        showToast("Document removed.");
      }
    }
  });

  // Appointment Actions
  els.appointmentTableBody.addEventListener("click", (e) => {
    const btn = e.target.closest(".confirm-appt");
    if (btn) {
      const id = btn.dataset.id;
      const appt = appState.data.appointments.find(x => x.id === id);
      appt.payment = "Paid";
      appt.status = "Confirmed";
      
      addNotification(appt.clientId, "Appointment Confirmed", `Your appointment on ${appt.date} is confirmed.`);
      addNotification(appt.lawyerId, "Appointment Schedule Update", `New confirmed appointment for ${appt.date}.`);
      
      saveData();
      renderAll();
      showToast("Payment verified and appointment confirmed.");
    }
  });

  // Search & Filter
  els.globalSearchInput.addEventListener("input", renderSearch);
  els.filterCaseType.addEventListener("change", renderSearch);
  els.filterPriority.addEventListener("change", renderSearch);
}

// Init
loadData().then(() => {
  bindEvents();
});
