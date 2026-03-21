// src/pages/register.js
// ─────────────────────────────────────────────────────────────
// Register page integration for Dine With Mee
//
// DROP-IN USAGE — add to your register.html:
//   <form id="register-form">
//     <input id="register-name"     type="text"     />
//     <input id="register-email"    type="email"    />
//     <input id="register-password" type="password" />
//     <input id="register-confirm"  type="password" />
//     <select id="register-country"></select>
//     <button type="submit" id="register-btn">Create Account</button>
//     <div id="register-error"></div>
//   </form>
//   <script type="module" src="src/pages/register.js"></script>
// ─────────────────────────────────────────────────────────────

import { registerUser } from "../api/auth.js";
import { redirectIfLoggedIn } from "../utils/auth.js";
import { initNavbar } from "../components/Navbar.js";
import { setButtonLoading } from "../utils/spinner.js";
import toast from "../utils/toast.js";

// African countries for the dropdown
const AFRICAN_COUNTRIES = [
  "Nigeria", "Ghana", "Kenya", "Rwanda", "Uganda", "Tanzania",
  "Ethiopia", "South Africa", "Senegal", "Ivory Coast", "Cameroon",
  "Zimbabwe", "Zambia", "Mozambique", "Angola", "Mali", "Burkina Faso",
  "Niger", "Chad", "Sudan", "Egypt", "Morocco", "Tunisia", "Algeria",
  "Libya", "Mauritania", "Gambia", "Guinea", "Sierra Leone", "Liberia",
  "Togo", "Benin", "Congo (DRC)", "Congo (Brazzaville)", "Gabon",
  "Equatorial Guinea", "Central African Republic", "South Sudan",
  "Somalia", "Djibouti", "Eritrea", "Burundi", "Malawi", "Lesotho",
  "Swaziland", "Botswana", "Namibia", "Madagascar", "Comoros",
  "Seychelles", "Cape Verde",
];

document.addEventListener("DOMContentLoaded", () => {
  redirectIfLoggedIn("/index.html");
  initNavbar();
  _populateCountryDropdown();
  _bindForm();
  _bindPasswordToggle();
  _bindStrengthMeter();
});

// ── Country dropdown ─────────────────────────────────────────

function _populateCountryDropdown() {
  const select =
    document.getElementById("register-country") ||
    document.querySelector('select[name="country"]');
  if (!select) return;

  select.innerHTML =
    `<option value="">Select your country</option>` +
    AFRICAN_COUNTRIES.map((c) => `<option value="${c}">${c}</option>`).join("");
}

// ── Form binding ─────────────────────────────────────────────

function _bindForm() {
  const form =
    document.getElementById("register-form") ||
    document.getElementById("signup-form") ||
    document.getElementById("registerForm") ||
    document.querySelector("form.register-form") ||
    document.querySelector("form[data-type='register']");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    await handleRegister(form);
  });
}

async function handleRegister(form) {
  const get = (ids) => {
    for (const id of ids) {
      const el = form.querySelector(id);
      if (el) return el;
    }
    return null;
  };

  const nameEl     = get(["#register-name",     '[name="name"]']);
  const firstNameEl = get(["#first-name", '[name="firstName"]']);
  const lastNameEl = get(["#last-name", '[name="lastName"]']);
  const emailEl    = get(["#register-email", "#signup-email", '[name="email"]',    '[type="email"]']);
  const passwordEl = get(["#register-password", "#signup-password", '[name="password"]', '[type="password"]']);
  const confirmEl  = get(["#register-confirm",  '[name="confirmPassword"]', "#confirm-password"]);
  const countryEl  = get(["#register-country",  "#signup-country", '[name="country"]']);
  const phoneEl    = get(["#register-phone", "#signup-phone",    '[name="phone"]']);
  const submitBtn  = get(["#register-btn",      '[type="submit"]',   "button"]);
  const errorEl    = document.getElementById("register-error") ||
                     form.querySelector(".error-msg");

  const compositeName = [firstNameEl?.value?.trim(), lastNameEl?.value?.trim()]
    .filter(Boolean)
    .join(" ");
  const name     = nameEl?.value?.trim() || compositeName;
  const email    = emailEl?.value?.trim();
  const password = passwordEl?.value;
  const confirm  = confirmEl?.value;
  const country  = countryEl?.value || "";
  const phone    = phoneEl?.value?.trim() || "";

  if (errorEl) errorEl.textContent = "";

  // Validation
  if (!name || !email || !password) {
    _showError(errorEl, "Please fill in all required fields.");
    return;
  }
  if (name.length < 2) {
    _showError(errorEl, "Name must be at least 2 characters.");
    return;
  }
  if (password.length < 6) {
    _showError(errorEl, "Password must be at least 6 characters.");
    return;
  }
  if (confirmEl && password !== confirm) {
    _showError(errorEl, "Passwords do not match.");
    passwordEl.style.borderColor = "#ff6b6b";
    confirmEl.style.borderColor = "#ff6b6b";
    return;
  }

  setButtonLoading(submitBtn, true, "Creating account…");

  try {
    const { user } = await registerUser({ name, email, password, country, phone });

    toast.success(`Welcome to Dine With Mee, ${user.name?.split(" ")[0]}! 🌍`, {
      duration: 3000,
    });

    setTimeout(() => {
      window.location.href = "/index.html";
    }, 1000);
  } catch (err) {
    setButtonLoading(submitBtn, false);
    const message =
      err.status === 409
        ? "An account with this email already exists. Try logging in."
        : err.message || "Registration failed. Please try again.";
    _showError(errorEl, message);
    toast.fromError({ message });
  }
}

// ── Password visibility toggle ───────────────────────────────

function _bindPasswordToggle() {
  document.querySelectorAll("[data-toggle-password], .toggle-password").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.target || "register-password";
      const input = document.getElementById(targetId);
      if (!input) return;
      input.type = input.type === "password" ? "text" : "password";
      btn.textContent = input.type === "password" ? "👁️" : "🙈";
    });
  });
}

// ── Password strength meter ──────────────────────────────────

function _bindStrengthMeter() {
  const passwordEl =
    document.getElementById("register-password") ||
    document.querySelector('[name="password"]');
  const meter =
    document.getElementById("password-strength") ||
    document.querySelector(".password-strength");

  if (!passwordEl || !meter) return;

  passwordEl.addEventListener("input", () => {
    const val = passwordEl.value;
    const score = _scorePassword(val);
    const labels = ["", "Weak", "Fair", "Good", "Strong"];
    const colors = ["", "#ff4444", "#ff8800", "#c8a84b", "#22c55e"];

    meter.textContent = val.length ? `Strength: ${labels[score]}` : "";
    meter.style.color = colors[score];
  });
}

function _scorePassword(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
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
