const STORAGE_KEY = "lexbridge-data-v1";
const SESSION_KEY = "lexbridge-session-v1";

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

function getStoredData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  const data = saved ? JSON.parse(saved) : seedDemoData();

  // Ensure the specific admin exists even if data was previously saved
  if (data && data.users) {
    const adminExists = data.users.some(u => u.email === "asif@gmail.com");
    if (!adminExists) {
      data.users.push({ 
        id: "u-admin-asif", 
        name: "Md. Asif Iqbal", 
        email: "asif@gmail.com", 
        password: "asif123", 
        role: "admin", 
        phone: "01887372093", 
        department: "Admin", 
        verified: true 
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }

  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
  return data;
}

function saveStoredData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function addNotification(data, userId, title, message) {
  data.notifications.unshift({
    id: `N-${Date.now()}`,
    userId,
    title,
    message,
    date: new Date().toISOString().slice(0, 10)
  });
}

function showMessage(element, message, type) {
  element.textContent = message;
  element.dataset.type = type;
}

async function syncFromCloud() {
  try {
    const res = await fetch("/api/load");
    const cloudData = await res.json();
    if (cloudData) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudData));
      return cloudData;
    }
  } catch (e) {
    console.warn("Cloud sync failed, using local data", e);
  }
  return getStoredData();
}

async function syncToCloud(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  try {
    await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
  } catch (e) {
    console.error("Cloud save failed:", e);
  }
}

function wireLoginPage() {
  const form = document.getElementById("loginPageForm");
  const feedback = document.getElementById("authFeedback");

  if (!form || !feedback) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const data = await syncFromCloud();
    const formData = new FormData(form);
    const email = String(formData.get("email")).trim().toLowerCase();
    const password = String(formData.get("password")).trim();
    const user = data.users.find(
      (item) => item.email.toLowerCase() === email && item.password === password
    );

    if (!user) {
      showMessage(feedback, "Invalid email or password.", "error");
      return;
    }

    if (user.status === "blocked") {
      showMessage(feedback, "This account has been restricted.", "error");
      return;
    }

    localStorage.setItem(SESSION_KEY, user.id);
    showMessage(feedback, `Welcome back, ${user.name}. Redirecting...`, "success");
    window.setTimeout(() => {
      if (user.role === "assistant") {
        window.location.href = "assistant.html";
      } else if (user.role === "admin") {
        window.location.href = "index.html#dashboardSection";
      } else {
        window.location.href = "index.html#summarySection";
      }
    }, 700);
  });
}

function wireRegisterPage() {
  const form = document.getElementById("registerPageForm");
  const feedback = document.getElementById("authFeedback");

  if (!form || !feedback) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const data = await syncFromCloud();
    const formData = new FormData(form);
    const email = String(formData.get("email")).trim().toLowerCase();

    if (data.users.some((item) => item.email.toLowerCase() === email)) {
      showMessage(feedback, "This email is already registered.", "error");
      return;
    }

    const user = {
      id: `u-${Date.now()}`,
      name: String(formData.get("name")).trim(),
      email,
      password: String(formData.get("password")).trim(),
      role: formData.get("role") || "client",
      phone: String(formData.get("phone")).trim(),
      department: String(formData.get("department")).trim(),
      verified: false,
      status: "active"
    };

    data.users.push(user);
    addNotification(data, "u-admin", "Profile Verifying Notification", `${user.name} registered and needs profile verification.`);
    
    await syncToCloud(data);

    showMessage(feedback, "Registration complete. Redirecting to login...", "success");
    window.setTimeout(() => {
      // If we're on the assistant gate, stay here but switch to login tab
      const isGate = window.location.pathname.includes("assistant-gate.html");
      if (isGate && typeof switchGateTab === "function") {
        switchGateTab("gate-login");
        form.reset();
        feedback.textContent = "";
      } else {
        window.location.href = "login.html";
      }
    }, 800);
  });
}

wireLoginPage();
wireRegisterPage();
