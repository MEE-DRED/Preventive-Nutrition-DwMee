// src/pages/login.js
// ─────────────────────────────────────────────────────────────
// Login page integration for Dine With Mee
//
// DROP-IN USAGE — add to your login.html:
//   <form id="login-form">
//     <input id="login-email" type="email" />
//     <input id="login-password" type="password" />
//     <button type="submit" id="login-btn">Login</button>
//     <div id="login-error"></div>
//   </form>
//   <script type="module" src="src/pages/login.js"></script>
// ─────────────────────────────────────────────────────────────

import { loginUser } from "../api/auth.js";
import { redirectIfLoggedIn } from "../utils/auth.js";
import { initNavbar } from "../components/Navbar.js";
import { setButtonLoading } from "../utils/spinner.js";
import toast from "../utils/toast.js";

document.addEventListener("DOMContentLoaded", () => {
  // If already logged in, redirect away
  redirectIfLoggedIn("/index.html");

  initNavbar();
  _bindForm();
  _bindPasswordToggle();
  _bindSocialButtons();
});

// ── Form binding ─────────────────────────────────────────────

function _bindForm() {
  // Support multiple common ID/class patterns from various HTML templates
  const form =
    document.getElementById("login-form") ||
    document.getElementById("loginForm") ||
    document.querySelector("form.login-form") ||
    document.querySelector("form[data-type='login']");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    await handleLogin(form);
  });
}

async function handleLogin(form) {
  const emailEl =
    form.querySelector("#login-email") ||
    form.querySelector('[name="email"]') ||
    form.querySelector('[type="email"]');

  const passwordEl =
    form.querySelector("#login-password") ||
    form.querySelector('[name="password"]') ||
    form.querySelector('[type="password"]');

  const submitBtn =
    form.querySelector("#login-btn") ||
    form.querySelector('[type="submit"]') ||
    form.querySelector("button");

  const errorEl =
    document.getElementById("login-error") ||
    form.querySelector(".error-msg") ||
    form.querySelector(".auth-error");

  const email = emailEl?.value?.trim();
  const password = passwordEl?.value;

  // Clear previous error
  if (errorEl) errorEl.textContent = "";

  // Client-side validation
  if (!email || !password) {
    _showError(errorEl, "Please fill in all fields.");
    return;
  }

  setButtonLoading(submitBtn, true, "Signing in…");

  try {
    const { user } = await loginUser({ email, password });

    toast.success(`Welcome back, ${user.name?.split(" ")[0]}! 🌍`);

    // Redirect — go to the page they came from, or home
    const returnTo = new URLSearchParams(window.location.search).get("returnTo");
    setTimeout(() => {
      window.location.href = returnTo || "/index.html";
    }, 800);
  } catch (err) {
    setButtonLoading(submitBtn, false);
    const message =
      err.status === 401
        ? "Incorrect email or password. Please try again."
        : err.message || "Login failed. Please try again.";
    _showError(errorEl, message);
    toast.fromError({ message });
  }
}

// ── Password visibility toggle ───────────────────────────────

function _bindPasswordToggle() {
  document.querySelectorAll("[data-toggle-password], .toggle-password, #togglePassword").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.target || "login-password";
      const input = document.getElementById(targetId) || document.querySelector('[type="password"]');
      if (!input) return;

      if (input.type === "password") {
        input.type = "text";
        btn.textContent = "🙈";
      } else {
        input.type = "password";
        btn.textContent = "👁️";
      }
    });
  });
}

// ── Social login placeholders ────────────────────────────────

function _bindSocialButtons() {
  document.querySelectorAll("[data-social-login], .social-login-btn, .btn-google").forEach((btn) => {
    btn.addEventListener("click", () => {
      toast.info("Social login coming soon! Please use email & password for now.");
    });
  });
}

// ── Helpers ──────────────────────────────────────────────────

function _showError(el, message) {
  if (!el) return;
  el.textContent = message;
  el.style.color = "#ff6b6b";
  el.style.fontSize = "0.85rem";
  el.style.marginTop = "0.5rem";
  el.style.display = "block";
}
