// src/api/apiClient.js
// ─────────────────────────────────────────────────────────────
// Base API client for Dine With Mee
// Handles: base URL, JWT injection, error normalisation, retries
// ─────────────────────────────────────────────────────────────

function resolveBaseUrl() {
  if (typeof window === "undefined") {
    return "http://localhost:5000/api";
  }

  const fromWindow = window.__DWM_API_BASE_URL__;
  if (typeof fromWindow === "string" && fromWindow.trim()) {
    return fromWindow.trim().replace(/\/$/, "");
  }

  const fromMeta = document
    .querySelector('meta[name="dwm-api-base-url"]')
    ?.getAttribute("content");
  if (typeof fromMeta === "string" && fromMeta.trim()) {
    return fromMeta.trim().replace(/\/$/, "");
  }

  const fromStorage = localStorage.getItem("dwm_api_base_url");
  if (typeof fromStorage === "string" && fromStorage.trim()) {
    return fromStorage.trim().replace(/\/$/, "");
  }

  const host = window.location.hostname.toLowerCase();
  const isLocal = host === "localhost" || host === "127.0.0.1";

  return isLocal ? "http://localhost:5000/api" : "/api";
}

const BASE_URL = resolveBaseUrl();

// ── Token helpers (imported inline to avoid circular deps) ──

const _getToken = () => localStorage.getItem("dwm_token");

// ── Core request function ────────────────────────────────────

/**
 * apiRequest(path, options)
 * Wraps fetch with:
 *   - Base URL prepending
 *   - Auto JWT header injection
 *   - JSON body serialisation
 *   - Normalised error objects
 *   - 401 auto-logout
 */
async function apiRequest(path, options = {}) {
  const token = _getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === "object") {
    config.body = JSON.stringify(config.body);
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, config);
  } catch (networkError) {
    // Network failure (no internet, CORS blocked, server down)
    throw {
      type: "NETWORK_ERROR",
      message: "Cannot reach the server. Please check your connection.",
      original: networkError,
    };
  }

  let data;
  try {
    data = await response.json();
  } catch {
    data = { success: false, message: "Server returned an invalid response." };
  }

  // Auto-logout on 401
  if (response.status === 401) {
    localStorage.removeItem("dwm_token");
    localStorage.removeItem("dwm_user");
    window.dispatchEvent(new CustomEvent("dwm:logout"));
  }

  if (!response.ok) {
    throw {
      type: "API_ERROR",
      status: response.status,
      message: data?.message || "Something went wrong. Please try again.",
      data,
    };
  }

  return data;
}

// ── Convenience methods ──────────────────────────────────────

const api = {
  get: (path, options = {}) =>
    apiRequest(path, { method: "GET", ...options }),

  post: (path, body, options = {}) =>
    apiRequest(path, { method: "POST", body, ...options }),

  put: (path, body, options = {}) =>
    apiRequest(path, { method: "PUT", body, ...options }),

  patch: (path, body, options = {}) =>
    apiRequest(path, { method: "PATCH", body, ...options }),

  delete: (path, options = {}) =>
    apiRequest(path, { method: "DELETE", ...options }),
};

export default api;
export { BASE_URL };
