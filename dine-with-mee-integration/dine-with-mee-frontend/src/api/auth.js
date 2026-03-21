// src/api/auth.js
// ─────────────────────────────────────────────────────────────
// Authentication API calls for Dine With Mee
// Endpoints: /auth/register  /auth/login  /auth/me
// ─────────────────────────────────────────────────────────────

import api from "./apiClient.js";
import { saveToken, saveUser, clearSession } from "../utils/auth.js";

/**
 * registerUser(data)
 * Registers a new user account.
 * @param {{ name, email, password, role?, phone?, country? }} data
 * @returns {{ user, token }}
 */
export async function registerUser(data) {
  const { name, email, password } = data;

  // Client-side validation
  if (!name || !email || !password) {
    throw { type: "VALIDATION_ERROR", message: "Name, email, and password are required." };
  }
  if (password.length < 6) {
    throw { type: "VALIDATION_ERROR", message: "Password must be at least 6 characters." };
  }
  if (!isValidEmail(email)) {
    throw { type: "VALIDATION_ERROR", message: "Please enter a valid email address." };
  }

  const response = await api.post("/auth/register", data);

  // Auto-save session after registration
  if (response.data?.token) {
    saveToken(response.data.token);
    saveUser(response.data.user);
  }

  return response.data;
}

/**
 * loginUser(data)
 * Authenticates a user and saves the session.
 * @param {{ email, password }} data
 * @returns {{ user, token }}
 */
export async function loginUser(data) {
  const { email, password } = data;

  if (!email || !password) {
    throw { type: "VALIDATION_ERROR", message: "Email and password are required." };
  }
  if (!isValidEmail(email)) {
    throw { type: "VALIDATION_ERROR", message: "Please enter a valid email address." };
  }

  const response = await api.post("/auth/login", { email, password });

  if (response.data?.token) {
    saveToken(response.data.token);
    saveUser(response.data.user);
    window.dispatchEvent(new CustomEvent("dwm:login", { detail: response.data.user }));
  }

  return response.data;
}

/**
 * fetchCurrentUser()
 * Gets the currently authenticated user's profile.
 * @returns {User}
 */
export async function fetchCurrentUser() {
  const response = await api.get("/auth/me");
  return response.data;
}

/**
 * logoutUser()
 * Clears local session and emits logout event.
 */
export function logoutUser() {
  clearSession();
  window.dispatchEvent(new CustomEvent("dwm:logout"));
}

// ── Internal helpers ─────────────────────────────────────────

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
