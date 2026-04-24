(function () {
  const SESSION_KEY = "lexbridge-session-v1";

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

  function safeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  async function loadData() {
    try {
      const response = await fetch("/api/load");
      if (!response.ok) throw new Error("Failed to load state.");
      const payload = await response.json();
      return {
        users: safeArray(payload.users),
        cases: safeArray(payload.cases),
        appointments: safeArray(payload.appointments),
        schedules: safeArray(payload.schedules),
        documents: safeArray(payload.documents),
        notifications: safeArray(payload.notifications),
        transactions: safeArray(payload.transactions)
      };
    } catch (_err) {
      return seedDemoData();
    }
  }

  window.appState = {
    data: seedDemoData(),
    currentUserId: localStorage.getItem(SESSION_KEY) || null
  };

  window.getCurrentUser = function getCurrentUser() {
    return window.appState.data.users.find((user) => user.id === window.appState.currentUserId) || null;
  };

  window.saveData = async function saveData() {
    await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(window.appState.data)
    });
  };

  window.addNotification = function addNotification(userId, title, message) {
    window.appState.data.notifications.unshift({
      id: `N-${Date.now()}`,
      userId,
      title,
      message,
      createdAt: new Date().toISOString(),
      isRead: false
    });
  };

  window.showToast = function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(window.__assistantToastTimer);
    window.__assistantToastTimer = window.setTimeout(() => {
      toast.classList.remove("show");
    }, 2500);
  };

  window.closeModal = function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove("active");
  };

  // Placeholder, then assistant.js extends this with dashboard rendering.
  window.renderAll = function renderAll() {};

  (async function bootAssistantDashboard() {
    window.appState.data = await loadData();
    const user = window.getCurrentUser();
    if (!user || String(user.role || "").toLowerCase() !== "assistant") {
      localStorage.removeItem(SESSION_KEY);
      window.location.replace("/login");
      return;
    }
    window.renderAll();
  })();
})();
