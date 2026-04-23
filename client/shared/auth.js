const STORAGE_KEY = "sasf-law-firm-v2";
const SESSION_KEY = "lexbridge-session-v1";
const LAWYER_TOKEN_KEY = "lawyer_token";
const LAWYER_ID_KEY = "lawyer_id";
const LAWYER_NAME_KEY = "lawyer_name";

function seedDemoData() {
  return {
    users: [],
    cases: [],
    appointments: [],
    schedules: [],
    documents: [],
    notifications: [],
    transactions: []
  };
}

function getStoredData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  const data = saved ? JSON.parse(saved) : seedDemoData();
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
