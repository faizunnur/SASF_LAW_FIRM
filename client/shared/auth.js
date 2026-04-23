const STORAGE_KEY = "sasf-law-firm-v2";
const SESSION_KEY = "lexbridge-session-v1";
const LAWYER_TOKEN_KEY = "lawyer_token";
const LAWYER_ID_KEY = "lawyer_id";
const LAWYER_NAME_KEY = "lawyer_name";

function seedDemoData() {
  return {
    users: [
      { id: "u-admin", name: "Md. Asif Iqbal", email: "asif@gmail.com", password: "asif123", role: "admin", phone: "01887372093", department: "Admin", verified: true, status: "active" },
      { id: "u-law-1a", name: "Adv. Rafiqul Islam", email: "rafiq@sasf.com", password: "123", role: "lawyer", phone: "01711000001", department: "Criminal Law", verified: true, status: "active" },
      { id: "u-law-1b", name: "Adv. Sumaiya Akter", email: "sumaiya@sasf.com", password: "123", role: "lawyer", phone: "01711000002", department: "Criminal Law", verified: true, status: "active" },
      { id: "u-law-2a", name: "Adv. Tariqul Hasan", email: "tariq@sasf.com", password: "123", role: "lawyer", phone: "01711000003", department: "Civil Law", verified: true, status: "active" },
      { id: "u-law-2b", name: "Adv. Fatema Zohra", email: "fatema@sasf.com", password: "123", role: "lawyer", phone: "01711000004", department: "Civil Law", verified: true, status: "active" },
      { id: "u-law-3a", name: "Adv. Nusrat Jahan", email: "nusrat@sasf.com", password: "123", role: "lawyer", phone: "01711000005", department: "Family Law", verified: true, status: "active" },
      { id: "u-law-3b", name: "Adv. Ariful Islam", email: "arif@sasf.com", password: "123", role: "lawyer", phone: "01711000006", department: "Family Law", verified: true, status: "active" },
      { id: "u-law-4a", name: "Adv. Mahbub Alam", email: "mahbub@sasf.com", password: "123", role: "lawyer", phone: "01711000007", department: "Corporate / Business Law", verified: true, status: "active" },
      { id: "u-law-4b", name: "Adv. Farhana Yasmin", email: "farhana@sasf.com", password: "123", role: "lawyer", phone: "01711000008", department: "Corporate / Business Law", verified: true, status: "active" },
      { id: "u-law-5a", name: "Adv. Zahirul Haque", email: "zahir@sasf.com", password: "123", role: "lawyer", phone: "01711000009", department: "Property / Real Estate Law", verified: true, status: "active" },
      { id: "u-law-5b", name: "Adv. Rokeya Begum", email: "rokeya@sasf.com", password: "123", role: "lawyer", phone: "01711000010", department: "Property / Real Estate Law", verified: true, status: "active" },
      { id: "u-law-6a", name: "Adv. Nazmul Huda", email: "nazmul@sasf.com", password: "123", role: "lawyer", phone: "01711000011", department: "Labor & Employment Law", verified: true, status: "active" },
      { id: "u-law-6b", name: "Adv. Sharmin Akter", email: "sharmin@sasf.com", password: "123", role: "lawyer", phone: "01711000012", department: "Labor & Employment Law", verified: true, status: "active" },
      { id: "u-law-7a", name: "Adv. Kamrul Hasan", email: "kamrul@sasf.com", password: "123", role: "lawyer", phone: "01711000013", department: "Intellectual Property (IP) Law", verified: true, status: "active" },
      { id: "u-law-7b", name: "Adv. Tasnim Sultana", email: "tasnim@sasf.com", password: "123", role: "lawyer", phone: "01711000014", department: "Intellectual Property (IP) Law", verified: true, status: "active" },
      { id: "u-law-8a", name: "Adv. Azizul Hakim", email: "aziz@sasf.com", password: "123", role: "lawyer", phone: "01711000015", department: "Tax Law", verified: true, status: "active" },
      { id: "u-law-8b", name: "Adv. Sabina Yasmin", email: "sabina@sasf.com", password: "123", role: "lawyer", phone: "01711000016", department: "Tax Law", verified: true, status: "active" },
      { id: "u-law-9a", name: "Adv. Mokhlesur Rahman", email: "mokhles@sasf.com", password: "123", role: "lawyer", phone: "01711000017", department: "Immigration Law", verified: true, status: "active" },
      { id: "u-law-9b", name: "Adv. Tanjina Akhter", email: "tanjina@sasf.com", password: "123", role: "lawyer", phone: "01711000018", department: "Immigration Law", verified: true, status: "active" },
      { id: "u-law-10a", name: "Adv. Shafiul Alam", email: "shafiul@sasf.com", password: "123", role: "lawyer", phone: "01711000019", department: "Cyber Law / IT Law", verified: true, status: "active" },
      { id: "u-law-10b", name: "Adv. Rezowana Islam", email: "rezowana@sasf.com", password: "123", role: "lawyer", phone: "01711000020", department: "Cyber Law / IT Law", verified: true, status: "active" },
      { id: "u-law-11a", name: "Adv. Anisur Rahman", email: "anis@sasf.com", password: "123", role: "lawyer", phone: "01711000021", department: "Environmental Law", verified: true, status: "active" },
      { id: "u-law-11b", name: "Adv. Meherun Nesa", email: "meherun@sasf.com", password: "123", role: "lawyer", phone: "01711000022", department: "Environmental Law", verified: true, status: "active" },
      { id: "u-law-12a", name: "Adv. Golam Mostafa", email: "golam@sasf.com", password: "123", role: "lawyer", phone: "01711000023", department: "Constitutional / Administrative Law", verified: true, status: "active" },
      { id: "u-law-12b", name: "Adv. Sayeda Khanom", email: "sayeda@sasf.com", password: "123", role: "lawyer", phone: "01711000024", department: "Constitutional / Administrative Law", verified: true, status: "active" },
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
  let data = saved ? JSON.parse(saved) : seedDemoData();

  // Force re-seed if this is a fresh v2 load or if lawyers are missing
  const lawyerCount = data.users.filter(u => u.role === "lawyer").length;
  if (!saved || lawyerCount < 20) {
    console.log("Updating local database with new lawyer roster...");
    data = seedDemoData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  // Ensure the specific admin exists
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

function safeLower(value) {
  return String(value || "").trim().toLowerCase();
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

async function wireForgotPasswordPage() {
  const form = document.getElementById("forgotPasswordForm");
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
    const confirmPassword = String(formData.get("confirmPassword")).trim();

    if (!email || !password || !confirmPassword) {
      showMessage(feedback, "All fields are required.", "error");
      return;
    }

    if (password !== confirmPassword) {
      showMessage(feedback, "Passwords do not match.", "error");
      return;
    }

    const user = (Array.isArray(data.users) ? data.users : []).find((item) => safeLower(item?.email) === email);
    if (!user) {
      showMessage(feedback, "No account found with that email.", "error");
      return;
    }

    user.password = password;
    await syncToCloud(data);
    showMessage(feedback, "Password updated. You can sign in now.", "success");

    window.setTimeout(() => {
      window.location.href = "/login";
    }, 800);
  });
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
    const user = (Array.isArray(data.users) ? data.users : []).find(
      (item) => safeLower(item?.email) === email && String(item?.password || "") === password
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
        clearLawyerDashboardSession();
        window.location.href = "/assistant/dashboard";
      } else if (user.role === "lawyer") {
        setLawyerDashboardSession(user);
        window.location.href = "/lawyer";
      } else if (user.role === "admin") {
        clearLawyerDashboardSession();
        window.location.href = "/admin-dashboard"; // Dedicated path for admin that triggers index.html fallback
      } else {
        clearLawyerDashboardSession();
        window.location.href = "/client/case-status"; // Points directly to the client dashboard
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

    if ((Array.isArray(data.users) ? data.users : []).some((item) => safeLower(item?.email) === email)) {
      showMessage(feedback, "This email is already registered.", "error");
      return;
    }

    const requestedRole = String(formData.get("role") || "client").trim().toLowerCase();
    const normalizedRole = ["client", "lawyer", "assistant"].includes(requestedRole) ? requestedRole : "client";

    const user = {
      id: `u-${Date.now()}`,
      name: String(formData.get("name")).trim(),
      email,
      password: String(formData.get("password")).trim(),
      role: normalizedRole,
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
      const isGate = window.location.pathname.includes("assistant-gate.html") || window.location.pathname === "/assistant";
      if (isGate && typeof switchGateTab === "function") {
        switchGateTab("gate-login");
        form.reset();
        feedback.textContent = "";
      } else {
        window.location.href = "/login";
      }
    }, 800);
  });
}

async function wireAssistantGate() {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  if (!loginForm && !signupForm) return;

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = await syncFromCloud();
      const formData = new FormData(loginForm);
      const identifier = String(formData.get("identifier")).trim().toLowerCase();
      const password = String(formData.get("password")).trim();

      const user = (Array.isArray(data.users) ? data.users : []).find(u => 
        (safeLower(u?.email) === identifier || safeLower(u?.name) === identifier) && 
        String(u?.password || "") === password && 
        u.role === "assistant"
      );

      if (!user) {
        alert("Invalid assistant credentials.");
        return;
      }

      localStorage.setItem(SESSION_KEY, user.id);
      clearLawyerDashboardSession();
      window.location.href = "/assistant/dashboard";
    });
  }

  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = await syncFromCloud();
      const formData = new FormData(signupForm);
      
      const email = String(formData.get("email")).trim().toLowerCase();
      if ((Array.isArray(data.users) ? data.users : []).some(u => safeLower(u?.email) === email)) {
        alert("Email already exists.");
        return;
      }

      const user = {
        id: `u-${Date.now()}`,
        name: String(formData.get("name")).trim(),
        email: email,
        password: String(formData.get("password")).trim(),
        role: "assistant",
        phone: String(formData.get("phone")).trim(),
        department: String(formData.get("department")).trim(),
        lawyerId: String(formData.get("lawyerId")).trim(),
        verified: false,
        status: "active"
      };

      data.users.push(user);
      addNotification(data, "u-admin", "New Assistant Registered", `${user.name} joined as an assistant.`);
      await syncToCloud(data);

      alert("Registration successful! You can now login.");
      signupForm.reset();
      if (typeof switchTab === "function") switchTab("login");
    });
  }
}

wireLoginPage();
wireRegisterPage();
wireAssistantGate();
wireForgotPasswordPage();
