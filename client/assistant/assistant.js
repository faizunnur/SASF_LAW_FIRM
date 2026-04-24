/**
 * Assistant Dashboard Controller - Amber System
 */

let els = {};
let currentMonth = new Date();

(function () {
  const checkInit = setInterval(() => {
    if (typeof appState !== 'undefined' && typeof renderAll !== 'undefined') {
      clearInterval(checkInit);
      initAssistant();
    }
  }, 100);

  function initAssistant() {
    cacheElements();
    bindEvents();
    
    // Extend global renderAll
    const originalRenderAll = renderAll;
    window.renderAll = function () {
      originalRenderAll();
      renderAssistantModules();
    };
    
    renderAssistantModules();
  }

  function cacheElements() {
    els = {
      navItems: document.querySelectorAll(".nav-item"),
      panels: document.querySelectorAll(".panel"),
      panelTitle: document.getElementById("panelTitle"),
      panelSubtitle: document.getElementById("panelSubtitle"),
      userNameChip: document.getElementById("userNameChip"),
      userCategoryBadge: document.getElementById("userCategoryBadge"),
      unassignedTableBody: document.getElementById("unassignedTableBody"),
      activeApptsTableBody: document.getElementById("activeApptsTableBody"),
      casesTableBody: document.getElementById("casesTableBody"),
      caseDataGrid: document.getElementById("caseDataGrid"),
      docUploadForm: document.getElementById("docUploadForm"),
      docUploadCaseId: document.getElementById("docUploadCaseId"),
      docUploadTitle: document.getElementById("docUploadTitle"),
      docUploadCategory: document.getElementById("docUploadCategory"),
      docUploadFile: document.getElementById("docUploadFile"),
      calendarGrid: document.getElementById("calendarGrid"),
      calendarMonthLabel: document.getElementById("calendarMonthLabel"),
      lawyerNameLabel: document.getElementById("lawyerNameLabel"),
      logoutBtn: document.getElementById("logoutBtn"),
      topSearchInput: document.getElementById("topSearchInput")
    };
  }

  function bindEvents() {
    els.navItems.forEach(item => {
      item.addEventListener("click", () => switchPanel(item.dataset.panel));
    });

    els.logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("lexbridge-session-v1");
      localStorage.removeItem("sasf-react-session-v1");
      localStorage.removeItem("lawyer_token");
      localStorage.removeItem("lawyer_id");
      localStorage.removeItem("lawyer_name");
      window.location.href = "/login";
    });

    document.getElementById("prevMonthBtn").addEventListener("click", () => changeMonth(-1));
    document.getElementById("nextMonthBtn").addEventListener("click", () => changeMonth(1));

    document.getElementById("caseEditForm").addEventListener("submit", handleCaseUpdate);
    if (els.docUploadForm) els.docUploadForm.addEventListener("submit", handleDocumentUpload);

    els.topSearchInput.addEventListener("input", (e) => {
      renderAssistantModules(e.target.value.toLowerCase());
    });
  }

  function switchPanel(id) {
    els.navItems.forEach(item => item.classList.toggle("active", item.dataset.panel === id));
    els.panels.forEach(p => p.classList.toggle("hidden", p.id !== `panel-${id}`));
    
    const meta = {
      requests: ["Incoming Requests", "Intake pool for new client bookings."],
      appointments: ["Appointment Handling", "Manage and confirm your active client queue."],
      cases: ["Case Controller", "Update status and track progress of your active matters."],
      documents: ["Document Controller", "Access and edit detailed case information."],
      schedule: ["Lawyer Schedule", "Visual synchronization with your assigned lawyer."]
    };

    els.panelTitle.textContent = meta[id][0];
    els.panelSubtitle.textContent = meta[id][1];
  }

  function renderAssistantModules(searchQuery = "") {
    const user = getCurrentUser();
    if (!user) return;

    els.userNameChip.textContent = user.name;
    els.userCategoryBadge.textContent = user.department;

    renderRequests(user, searchQuery);
    renderActiveAppointments(user, searchQuery);
    renderCaseController(user, searchQuery);
    renderDocumentController(user, searchQuery);
    renderLawyerCalendar(user);
  }

  // 1. Initial Page: Requests
  function renderRequests(user, q) {
    const pool = appState.data.appointments.filter(a => 
      (
        (String(a.assistantId || "") === String(user.id) && String(a.status || "") === "Awaiting Assistant Review") ||
        (!a.assistantId && String(a.type || "").trim().toLowerCase() === String(user.department || "").trim().toLowerCase())
      ) &&
      (!q || (appState.data.users.find(u => u.id === a.clientId)?.name || "").toLowerCase().includes(q))
    );

    els.unassignedTableBody.innerHTML = pool.length > 0 ? pool.map(a => `
      <tr>
        <td><strong>${a.date}</strong></td>
        <td>${appState.data.users.find(u => u.id === a.clientId)?.name || "Client"}</td>
        <td><span class="badge badge-blue">${a.type}</span></td>
        <td>${a.time}</td>
        <td>
          <button class="primary-btn-sm" onclick="claimRequest('${a.id}')" style="background:#f59e0b;">Select for Handling</button>
        </td>
      </tr>
    `).join("") : '<tr><td colspan="5" style="text-align:center; padding:20px;">No new requests in your specialty.</td></tr>';
  }

  // 2. Appointment Handling
  function renderActiveAppointments(user, q) {
    const mine = appState.data.appointments.filter(a => 
      a.assistantId === user.id && 
      a.status === "Pending" &&
      (!q || (appState.data.users.find(u => u.id === a.clientId)?.name || "").toLowerCase().includes(q))
    );

    els.activeApptsTableBody.innerHTML = mine.length > 0 ? mine.map(a => `
      <tr>
        <td><strong>${a.date}</strong><br><small>${a.time}</small></td>
        <td>${appState.data.users.find(u => u.id === a.clientId)?.name || "Client"}</td>
        <td>${a.type}</td>
        <td>
          <button class="primary-btn-sm" style="background:#64748b;" onclick="showToast('Communication portal opened for ${a.id}')">
            <i class="fa-solid fa-comments"></i> Chat
          </button>
        </td>
        <td><span class="badge badge-orange">${a.payment || "Pending"}</span></td>
        <td>
          <button class="primary-btn-sm" onclick="takeCase('${a.id}')">Approve & Forward</button>
        </td>
      </tr>
    `).join("") : '<tr><td colspan="6" style="text-align:center; padding:20px;">No appointments currently being handled.</td></tr>';
  }

  // 3. Case Controller
  function renderCaseController(user, q) {
    const cases = appState.data.cases.filter(c => 
      c.assistantId === user.id &&
      (!q || c.title.toLowerCase().includes(q) || c.client.toLowerCase().includes(q))
    );

    els.casesTableBody.innerHTML = cases.length > 0 ? cases.map(c => `
      <tr>
        <td>#${c.id}</td>
        <td><strong>${c.title}</strong></td>
        <td>${c.client}</td>
        <td><span class="badge badge-blue">${c.priority}</span></td>
        <td>
          <select class="status-select" onchange="updateCaseStatus('${c.id}', this.value)" style="padding:4px; border-radius:4px; font-size:12px;">
            <option value="Pending" ${c.status === "Pending" ? "selected" : ""}>Pending</option>
            <option value="In Progress" ${c.status === "In Progress" ? "selected" : ""}>In Progress</option>
            <option value="On Hold" ${c.status === "On Hold" ? "selected" : ""}>On Hold</option>
            <option value="Closed" ${c.status === "Closed" ? "selected" : ""}>Closed</option>
          </select>
        </td>
        <td>${c.hearingDate || "N/A"}</td>
        <td>
          <button class="primary-btn-sm" style="background:#64748b;" onclick="openCaseEdit('${c.id}')">Edit</button>
        </td>
      </tr>
    `).join("") : '<tr><td colspan="7" style="text-align:center; padding:20px;">No active cases found.</td></tr>';
  }

  // 4. Document Controller
  function renderDocumentController(user, q) {
    const cases = appState.data.cases.filter(c =>
      c.assistantId === user.id &&
      (!q || c.title.toLowerCase().includes(q) || c.client.toLowerCase().includes(q))
    );

    const docs = Array.isArray(appState.data.documents) ? appState.data.documents : [];

    if (els.docUploadCaseId) {
      const currentSelection = els.docUploadCaseId.value;
      const caseOptions = cases
        .map(c => {
          const caseId = c.caseId || c.id || "";
          return `<option value="${caseId}">${c.title} (${caseId})</option>`;
        })
        .join("");
      els.docUploadCaseId.innerHTML = `<option value="">Select case</option>${caseOptions}`;
      if (cases.some(c => String(c.caseId || c.id || "") === String(currentSelection))) {
        els.docUploadCaseId.value = currentSelection;
      }
    }

    els.caseDataGrid.innerHTML = cases.length > 0 ? cases.map(c => {
      const resolvedClientName =
        appState.data.users.find(u => String(u.id || "") === String(c.clientId || ""))?.name ||
        c.clientName ||
        c.client ||
        "Client";
      return `
      <div class="stat-card">
        <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:15px;">
          <div class="sidebar-brand-mark" style="width:32px; height:32px; font-size:14px;">#</div>
          <span class="badge badge-gray">${c.type}</span>
        </div>
        <h4 style="margin-bottom:5px;">${c.title}</h4>
        <p style="font-size:12px; color:#64748b;">Client: ${resolvedClientName}</p>
        <div style="margin-top:10px; display:grid; gap:6px;">
          ${docs
            .filter(d => String(d.caseId || "") === String(c.caseId || c.id))
            .slice(0, 4)
            .map(d => `
              <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; border:1px solid #e2e8f0; border-radius:8px; padding:6px 8px; background:#f8fafc;">
                <span style="font-size:12px; color:#334155; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${d.title || d.name || "Document"}</span>
                ${d.fileUrl ? `<a href="${d.fileUrl}" target="_blank" rel="noopener noreferrer" style="font-size:11px; color:#b45309; text-decoration:underline;">View</a>` : ""}
              </div>
            `).join("") || `<p style="font-size:11px; color:#94a3b8;">No uploaded documents yet.</p>`}
        </div>
        <div style="margin-top:15px; font-size:11px; color:#94a3b8;">
          <i class="fa-solid fa-folder-open"></i> Documents linked to this case
        </div>
      </div>
    `;
    }).join("") : '<p style="grid-column:1/-1; text-align:center; color:#94a3b8;">No cases available to view.</p>';
  }

  // 5. Lawyer Schedule (Calendar)
  function renderLawyerCalendar(user) {
    const lawyer = appState.data.users.find(u => u.id === user.lawyerId);
    if (!lawyer) {
      els.lawyerNameLabel.textContent = "No primary lawyer assigned.";
      return;
    }
    els.lawyerNameLabel.textContent = `${lawyer.name}'s Availability`;

    const schedules = appState.data.schedules.filter(s => s.lawyerId === lawyer.id);
    const month = currentMonth.getMonth();
    const year = currentMonth.getFullYear();

    els.calendarMonthLabel.textContent = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentMonth);

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let html = '';
    // Paddings
    for (let i = 0; i < firstDay; i++) html += '<div class="calendar-day empty"></div>';
    
    // Days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const hasEvent = schedules.some(s => s.date === dateStr);
      const isToday = dateStr === new Date().toISOString().split('T')[0];
      
      html += `
        <div class="calendar-day ${hasEvent ? 'busy' : ''} ${isToday ? 'today' : ''}">
          <span class="day-num">${d}</span>
          ${hasEvent ? '<div class="busy-dot"></div>' : ''}
        </div>
      `;
    }

    els.calendarGrid.innerHTML = html;
  }

  function changeMonth(offset) {
    currentMonth.setMonth(currentMonth.getMonth() + offset);
    renderLawyerCalendar(getCurrentUser());
  }

  async function uploadDocumentFile(file) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/upload-file", { method: "POST", body: formData });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.message || "File upload failed.");
    }
    return payload.fileUrl || "";
  }

  async function handleDocumentUpload(e) {
    e.preventDefault();
    const selectedCaseId = els.docUploadCaseId?.value || "";
    const title = (els.docUploadTitle?.value || "").trim();
    const fileType = els.docUploadCategory?.value || "General";
    const selectedFile = els.docUploadFile?.files?.[0] || null;

    if (!selectedCaseId || !title || !selectedFile) {
      showToast("Case, title, and file are required.");
      return;
    }

    const targetCase = appState.data.cases.find(
      c => String(c.caseId || c.id || "") === String(selectedCaseId)
    );
    if (!targetCase) {
      showToast("Selected case is invalid.");
      return;
    }

    try {
      const fileUrl = await uploadDocumentFile(selectedFile);
      const docId = `D-${Date.now()}`;
      appState.data.documents = Array.isArray(appState.data.documents) ? appState.data.documents : [];
      appState.data.documents.unshift({
        id: docId,
        docId,
        caseId: selectedCaseId,
        title,
        name: title,
        fileType,
        category: fileType,
        fileUrl,
        assistantId: getCurrentUser()?.id || "",
        lawyerId: targetCase.lawyerId || "",
        clientId: targetCase.clientId || "",
        uploadDate: new Date().toISOString().slice(0, 10),
        description: `${fileType} uploaded by assistant.`
      });
      await saveData();
      els.docUploadForm.reset();
      renderAll();
      showToast("Document submitted successfully.");
    } catch (error) {
      showToast(error.message || "Unable to submit document.");
    }
  }

  // EXPOSED HELPERS

  window.claimRequest = async function(id) {
    const appt = appState.data.appointments.find(a => a.id === id);
    if (!appt) return;
    appt.assistantId = appState.currentUserId;
    appt.status = "Pending";
    await saveData();
    renderAll();
    showToast("Request claimed! It is now in your handling queue.");
  };

  window.takeCase = async function(id) {
    const appt = appState.data.appointments.find(a => a.id === id);
    if (!appt) return;

    const assistant = getCurrentUser();
    const lawyerId = assistant?.lawyerId || appt.lawyerId || "";
    if (!lawyerId) {
      showToast("No lawyer linked to your profile. Contact admin.");
      return;
    }

    appt.assistantId = appState.currentUserId;
    appt.lawyerId = lawyerId;
    appt.assistantName = assistant?.name || "Assistant";
    appt.status = "Proposed";
    appt.payment = appt.payment || "Pending";

    // Create or update a case record so it appears in Case Controller immediately.
    const existingCase = appState.data.cases.find(
      (c) => String(c.sourceAppointmentId || "") === String(appt.id)
    );
    const client = appState.data.users.find((u) => String(u.id || "") === String(appt.clientId || ""));
    if (existingCase) {
      existingCase.assistantId = appState.currentUserId;
      existingCase.lawyerId = lawyerId;
      existingCase.clientId = appt.clientId || "";
      existingCase.client = client?.name || existingCase.client || "Client";
      existingCase.type = appt.type || existingCase.type || "General";
      existingCase.caseType = appt.type || existingCase.caseType || "General";
      existingCase.hearingDate = appt.date || existingCase.hearingDate || "";
      existingCase.lastUpdated = new Date().toISOString();
      existingCase.status = existingCase.status || "Pending Lawyer Review";
    } else {
      const newCaseId = `C-${Date.now()}`;
      appState.data.cases.push({
        id: newCaseId,
        caseId: newCaseId,
        sourceAppointmentId: appt.id,
        title: `${appt.type || "General"} Legal Matter`,
        client: client?.name || "Client",
        clientName: client?.name || "Client",
        clientId: appt.clientId || "",
        assistantId: appState.currentUserId,
        lawyerId: lawyerId,
        type: appt.type || "General",
        caseType: appt.type || "General",
        priority: "Medium",
        status: "Pending Lawyer Review",
        hearingDate: appt.date || "",
        notes: "Case opened from assistant appointment approval.",
        lastUpdated: new Date().toISOString()
      });
    }

    addNotification(lawyerId, "Appointment Proposed", `Assistant ${assistant?.name || "Assistant"} approved a ${appt.type} request for ${appt.date} at ${appt.time}.`);
    addNotification(appt.clientId, "Request Approved by Assistant", `Your ${appt.type} request was approved and sent to the assigned lawyer.`);
    await saveData();
    renderAll();
    showToast("Approved, forwarded to lawyer, and moved into Case Controller.");
  };

  window.updateCaseStatus = async function(id, status) {
    const c = appState.data.cases.find(x => x.id === id);
    if (c) {
      c.status = status;
      await saveData();
      showToast(`Status updated to ${status}`);
    }
  };

  window.openCaseEdit = function(id) {
    const c = appState.data.cases.find(x => x.id === id);
    if (!c) return;
    document.getElementById("editCaseId").value = c.id;
    document.getElementById("editTitle").value = c.title;
    document.getElementById("editType").value = c.type;
    document.getElementById("editPriority").value = c.priority;
    document.getElementById("editNotes").value = c.notes || "";
    document.getElementById("caseDetailModal").classList.add("active");
  };

  async function handleCaseUpdate(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const id = fd.get("id");
    const c = appState.data.cases.find(x => x.id === id);
    if (c) {
      c.title = fd.get("title");
      c.priority = fd.get("priority");
      c.notes = fd.get("notes");
      await saveData();
      renderAll();
      closeModal("caseDetailModal");
      showToast("Case data updated.");
    }
  }

})();
