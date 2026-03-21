// src/utils/auth.js
// ─────────────────────────────────────────────────────────────
// Auth session utilities for Dine With Mee
// Manages JWT + user object in localStorage
// ─────────────────────────────────────────────────────────────

const TOKEN_KEY = "dwm_token";
const USER_KEY = "dwm_user";

/**
 * saveToken(token)
 * Persists the JWT to localStorage.
 */
export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * getToken()
 * Retrieves the JWT. Returns null if not present.
 */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * saveUser(user)
 * Persists the user object (non-sensitive fields only).
 */
export function saveUser(user) {
  const safe = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    country: user.country || null,
  };
  localStorage.setItem(USER_KEY, JSON.stringify(safe));
}

/**
 * getUser()
 * Returns the saved user object, or null.
 */
export function getUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * isLoggedIn()
 * Returns true if a token exists.
 */
export function isLoggedIn() {
  const token = getToken();
  if (!token) return false;

  // Basic JWT expiry check (decode payload without verifying signature)
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      clearSession(); // Token expired — clean up
      return false;
    }
    return true;
  } catch {
    return !!token; // Fallback: trust presence of token
  }
}

/**
 * getRole()
 * Returns the user's role string, or null.
 */
export function getRole() {
  const user = getUser();
  return user?.role || null;
}

/**
 * isAdmin()
 */
export function isAdmin() {
  return getRole() === "ADMIN";
}

/**
 * isChef()
 */
export function isChef() {
  return getRole() === "CHEF";
}

/**
 * clearSession()
 * Removes all auth data from localStorage.
 */
export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * logout()
 * Clears session and reloads page to unauthenticated state.
 */
export function logout() {
  clearSession();
  window.dispatchEvent(new CustomEvent("dwm:logout"));
  // Redirect to home or login
  window.location.href = "/";
}

/**
 * requireAuth(redirectTo)
 * Guards a page — redirects to login if not authenticated.
 * Call at the top of any protected page script.
 */
export function requireAuth(redirectTo = "/login.html") {
  if (!isLoggedIn()) {
    window.location.href = redirectTo;
    return false;
  }
  return true;
}

/**
 * redirectIfLoggedIn(redirectTo)
 * Redirects already-authenticated users away from login/register pages.
 */
export function redirectIfLoggedIn(redirectTo = "/index.html") {
  if (isLoggedIn()) {
    window.location.href = redirectTo;
    return true;
  }
  return false;
}
