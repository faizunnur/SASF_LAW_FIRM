const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

export async function apiRequest(path, options = {}) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath;
  const response = await fetch(url, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const text = await response.text();
  const data = text ? safeJsonParse(text) : {};

  if (!response.ok) {
    throw new Error(data.message || data.error || `Request failed (${response.status}).`);
  }

  return data;
}

export async function uploadFile(formData) {
  const response = await fetch("/api/upload-file", { method: "POST", body: formData });
  const text = await response.text();
  const data = text ? safeJsonParse(text) : {};
  if (!response.ok) throw new Error(data.message || `Upload failed (${response.status}).`);
  return data;
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}
