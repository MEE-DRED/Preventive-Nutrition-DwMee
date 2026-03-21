// src/components/Navbar.js
// ─────────────────────────────────────────────────────────────
// Navbar integration layer
// Handles: auth state display, cart count badge, logout
// Drop-in: call initNavbar() after DOM is ready
// ─────────────────────────────────────────────────────────────

import { isLoggedIn, getUser, logout } from "../utils/auth.js";
import { getCartCount } from "../utils/cart.js";

/**
 * initNavbar()
 * Call this on every page to wire up the nav.
 * Looks for elements by data attributes or common class names.
 */
export function initNavbar() {
  _updateAuthUI();
  _updateCartBadge();
  _bindLogoutButtons();
  _listenForEvents();
}

// ── Auth UI ──────────────────────────────────────────────────

function _updateAuthUI() {
  const user = getUser();
  const loggedIn = isLoggedIn();

  // Elements to SHOW when logged in
  document.querySelectorAll(
    "[data-show-auth], .dwm-show-auth, .nav-authenticated"
  ).forEach((el) => {
    el.style.display = loggedIn ? "" : "none";
  });

  // Elements to SHOW when logged OUT
  document.querySelectorAll(
    "[data-hide-auth], .dwm-hide-auth, .nav-unauthenticated"
  ).forEach((el) => {
    el.style.display = loggedIn ? "none" : "";
  });

  // Inject username
  document.querySelectorAll(
    "[data-user-name], .dwm-user-name"
  ).forEach((el) => {
    if (loggedIn && user) {
      el.textContent = user.name?.split(" ")[0] ?? "Account";
    }
  });

  // Update login/register links if user is logged in
  if (loggedIn) {
    document.querySelectorAll('a[href*="login"], a[href*="register"]').forEach((a) => {
      // Only hide if it's truly a standalone auth link (not part of dropdown)
      if (a.classList.contains("dwm-auth-link")) {
        a.style.display = "none";
      }
    });
  }
}

// ── Cart badge ───────────────────────────────────────────────

export function updateCartBadge() {
  _updateCartBadge();
}

function _updateCartBadge() {
  const count = getCartCount();
  document.querySelectorAll(
    "[data-cart-count], .dwm-cart-count, .cart-count, .cart-badge"
  ).forEach((el) => {
    el.textContent = count;
    el.style.display = count > 0 ? "inline-flex" : "none";
  });

  // Also update any icon-based cart indicators
  document.querySelectorAll("[data-cart-icon]").forEach((el) => {
    el.setAttribute("aria-label", `Cart (${count} items)`);
  });
}

// ── Logout buttons ───────────────────────────────────────────

function _bindLogoutButtons() {
  document.querySelectorAll(
    "[data-logout], .dwm-logout-btn, #logoutBtn, .logout-btn"
  ).forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });
  });
}

// ── Event listeners ──────────────────────────────────────────

function _listenForEvents() {
  window.addEventListener("dwm:login", () => {
    _updateAuthUI();
    _updateCartBadge();
  });

  window.addEventListener("dwm:logout", () => {
    _updateAuthUI();
    _updateCartBadge();
  });

  window.addEventListener("dwm:cartUpdate", () => {
    _updateCartBadge();
  });
}
