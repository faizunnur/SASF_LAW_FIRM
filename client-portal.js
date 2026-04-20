/**
 * Client Portal Extension for SASF Law Firm
 * Handles Appointment Booking, Case Tracking, and Document Management
 */

(function () {
  // Hook into the global appState and elements from script.js
  const checkInit = setInterval(() => {
    if (typeof appState !== 'undefined' && typeof renderAll !== 'undefined') {
      clearInterval(checkInit);
      initClientPortal();
    }
  }, 100);

  function initClientPortal() {
    console.log("Client Portal Module Initialized");

    // Extend the global renderAll to include client logic
    const originalRenderAll = renderAll;
    window.renderAll = function () {
      originalRenderAll();
      const user = getCurrentUser();
      if (user && user.role === 'client') {
        renderClientView();
      }
    };

    // Bind Client Events
    bindClientEvents();
  }

  function renderClientView() {
    const user = getCurrentUser();
    if (!user) return;

    // Fill booking form with user name
    const apptNameInput = document.getElementById("apptName");
    if (apptNameInput) apptNameInput.value = user.name;

    renderClientAppointments();
    renderClientCases();
  }

  function renderClientAppointments() {
    const container = document.getElementById("clientAppointmentList");
    if (!container) return;

    const user = getCurrentUser();
    const appts = appState.data.appointments.filter(a => a.clientId === user.id);

    if (appts.length === 0) {
      container.innerHTML = `<div class="empty-state">You haven't booked any appointments yet.</div>`;
      return;
    }

    container.innerHTML = appts.map(a => `
      <article class="entry-card">
        <div class="notif-grid" style="grid-template-columns: 1fr auto;">
          <div class="notif-content">
            <h4>${a.type} Consultation</h4>
            <p style="margin:4px 0;">Scheduled for <br><strong>${a.date} at ${a.time}</strong></p>
            <div class="meta" style="margin-top: 8px;">Status: <span class="status-tag" data-status="${a.status.toLowerCase()}">${a.status}</span></div>
          </div>
          <div class="notif-actions" style="margin-top: 10px;">
            ${a.status === 'Pending' ? `<button class="primary-btn-sm" style="background-color: var(--danger);" onclick="cancelAppointment('${a.id}')">Cancel</button>` : ''}
          </div>
        </div>
      </article>
    `).join("");
  }

  function renderClientCases() {
    const container = document.getElementById("clientCaseList");
    if (!container) return;

    const user = getCurrentUser();
    const cases = appState.data.cases.filter(c => c.clientId === user.id);

    if (cases.length === 0) {
      container.innerHTML = `<div class="empty-state">No active cases found. Once your appointment is confirmed, your case will appear here.</div>`;
      return;
    }

    container.innerHTML = cases.map(c => `
      <article class="entry-card case-card" onclick="selectCase('${c.id}')">
        <div class="notif-grid">
          <div class="notif-content">
            <h4>Case: ${c.title}</h4>
            <p>Type: <strong>${c.type}</strong> | Lawyer: ${getLawyerName(c.lawyerId)}</p>
            <div class="meta">Status: <span class="status-tag" data-status="${c.status.toLowerCase().replace(' ', '-')}">${c.status}</span></div>
          </div>
          <div class="notif-actions">
            <button class="primary-btn-sm">View Documents</button>
          </div>
        </div>
      </article>
    `).join("");
  }

  function getLawyerName(id) {
    const lawyer = appState.data.users.find(u => u.id === id);
    return lawyer ? lawyer.name : "Assigning...";
  }

  window.selectCase = function (caseId) {
    appState.selectedCaseId = caseId;
    const docSection = document.getElementById("documentManagement");
    docSection.classList.remove("hidden");
    renderClientDocuments(caseId);

    // Smooth scroll to documents
    docSection.scrollIntoView({ behavior: 'smooth' });
  };

  function renderClientDocuments(caseId) {
    const tbody = document.getElementById("clientDocTableBody");
    if (!tbody) return;

    const user = getCurrentUser();
    const docs = appState.data.documents.filter(d => d.caseId === caseId);

    if (docs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No documents uploaded for this case yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = docs.map(d => {
      const isOwner = d.ownerId === user.id;
      return `
        <tr>
          <td>${d.name}</td>
          <td>${d.category}</td>
          <td>${d.updatedOn}</td>
          <td><span class="status-tag" data-status="verified">Uploaded</span></td>
          <td>
            ${isOwner ? `
              <button class="table-btn primary-action" onclick="editDocument('${d.id}')">Rename</button>
              <button class="table-btn danger-action" onclick="deleteDocument('${d.id}')">Delete</button>
            ` : `<span class="meta">View Only</span>`}
          </td>
        </tr>
      `;
    }).join("");
  }

  function bindClientEvents() {
    const bookingForm = document.getElementById("appointmentBookingForm");
    if (bookingForm) {
      bookingForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const user = getCurrentUser();
        const type = document.getElementById("apptType").value;
        const date = document.getElementById("apptDate").value;
        const time = document.getElementById("apptTime").value;

        const newAppt = {
          id: `A-${Date.now()}`,
          clientId: user.id,
          lawyerId: "u-lawyer", // Default placeholder, will be assigned by assistant
          assistantId: "u-assistant",
          date: date,
          time: time,
          type: type,
          status: "Pending",
          payment: "Pending"
        };

        appState.data.appointments.push(newAppt);

        // Notify Assistant
        addNotification("u-assistant", "New Appointment Request", `${user.name} requested a ${type} consultation for ${date}.`);

        await saveData();
        showToast("Appointment request sent! Waiting for Assistant confirmation.");
        bookingForm.reset();
        renderAll();
      });
    }

    const uploadBtn = document.getElementById("uploadDocBtn");
    if (uploadBtn) {
      uploadBtn.addEventListener("click", () => {
        const name = prompt("Enter document name:");
        if (!name) return;
        const category = prompt("Enter category (e.g., Evidence, Identity, Contract):", "Evidence");

        const user = getCurrentUser();
        const newDoc = {
          id: `D-${Date.now()}`,
          caseId: appState.selectedCaseId,
          ownerId: user.id,
          clientId: user.id,
          name: name,
          category: category,
          updatedOn: new Date().toISOString().slice(0, 10),
          access: "Client View"
        };

        appState.data.documents.push(newDoc);
        saveData();
        renderClientDocuments(appState.selectedCaseId);
        showToast("Document added.");
      });
    }
  }

  window.cancelAppointment = async function (id) {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    appState.data.appointments = appState.data.appointments.filter(a => a.id !== id);
    await saveData();
    renderAll();
    showToast("Appointment cancelled.");
  };

  window.editDocument = async function (id) {
    const doc = appState.data.documents.find(d => d.id === id);
    if (!doc) return;
    const newName = prompt("Edit document name:", doc.name);
    if (newName && newName !== doc.name) {
      doc.name = newName;
      doc.updatedOn = new Date().toISOString().slice(0, 10);
      await saveData();
      renderClientDocuments(appState.selectedCaseId);
      showToast("Document updated.");
    }
  };

  window.deleteDocument = async function (id) {
    if (!confirm("Remove this document?")) return;
    appState.data.documents = appState.data.documents.filter(d => d.id !== id);
    await saveData();
    renderClientDocuments(appState.selectedCaseId);
    showToast("Document deleted.");
  };

})();
