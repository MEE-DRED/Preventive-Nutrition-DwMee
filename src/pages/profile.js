// src/pages/profile.js
// ─────────────────────────────────────────────────────────────
// User profile & health profile page integration
//
// DROP-IN USAGE — add to your profile.html:
//   <div id="profile-form-container"></div>
//   <div id="health-profile-container"></div>
//   <div id="order-history-container"></div>
//   <script type="module" src="src/pages/profile.js"></script>
// ─────────────────────────────────────────────────────────────

import { fetchProfile, updateProfile, saveHealthProfile, fetchHealthProfile } from "../api/user.js";
import { fetchUserOrders } from "../api/orders.js";
import { requireAuth, getUser, saveUser } from "../utils/auth.js";
import { initNavbar } from "../components/Navbar.js";
import { setButtonLoading } from "../utils/spinner.js";
import toast from "../utils/toast.js";

document.addEventListener("DOMContentLoaded", async () => {
  if (!requireAuth("/login.html?returnTo=/profile.html")) return;

  initNavbar();

  await Promise.all([
    renderProfileForm(),
    renderHealthProfileForm(),
    renderOrderHistory(),
  ]);
});

// ── Profile form ─────────────────────────────────────────────

async function renderProfileForm() {
  const container = document.getElementById("profile-form-container") ||
                    document.querySelector(".profile-form-container");
  if (!container) return;

  let user;
  try {
    user = await fetchProfile();
    saveUser(user); // keep localStorage in sync
  } catch {
    user = getUser(); // fallback to cached
  }

  container.innerHTML = `
    <form id="dwm-profile-form" style="display:flex;flex-direction:column;gap:1rem;">
      <div style="${_fieldGroupStyle()}">
        <label style="${_labelStyle()}">Full Name</label>
        <input id="p-name" type="text" value="${user?.name || ""}" style="${_inputStyle()}" />
      </div>
      <div style="${_fieldGroupStyle()}">
        <label style="${_labelStyle()}">Email</label>
        <input type="email" value="${user?.email || ""}" disabled style="${_inputStyle()};opacity:0.5;" />
      </div>
      <div style="${_fieldGroupStyle()}">
        <label style="${_labelStyle()}">Phone</label>
        <input id="p-phone" type="tel" value="${user?.phone || ""}" style="${_inputStyle()}" />
      </div>
      <div style="${_fieldGroupStyle()}">
        <label style="${_labelStyle()}">Country</label>
        <input id="p-country" type="text" value="${user?.country || ""}" style="${_inputStyle()}" />
      </div>
      <div style="display:flex;justify-content:flex-end;">
        <button type="submit" id="save-profile-btn" style="${_primaryBtnStyle()}">
          Save Profile
        </button>
      </div>
    </form>
  `;

  document.getElementById("dwm-profile-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("save-profile-btn");
    setButtonLoading(btn, true, "Saving…");
    try {
      await updateProfile({
        name: document.getElementById("p-name").value.trim(),
        phone: document.getElementById("p-phone").value.trim(),
        country: document.getElementById("p-country").value.trim(),
      });
      toast.success("Profile updated successfully.");
    } catch (err) {
      toast.fromError(err);
    } finally {
      setButtonLoading(btn, false);
    }
  });
}

// ── Health profile form ──────────────────────────────────────

async function renderHealthProfileForm() {
  const container = document.getElementById("health-profile-container") ||
                    document.querySelector(".health-profile-container");
  if (!container) return;

  let profile = null;
  try {
    profile = await fetchHealthProfile();
  } catch {
    // No health profile yet — that's fine
  }

  const c = profile?.condition || "NONE";
  const isPreg = profile?.isPregnant || false;

  container.innerHTML = `
    <form id="dwm-health-form" style="display:flex;flex-direction:column;gap:1.25rem;">

      <div style="${_fieldGroupStyle()}">
        <label style="${_labelStyle()}">Health Condition</label>
        <select id="h-condition" style="${_inputStyle()};cursor:pointer;">
          <option value="NONE"     ${c === "NONE"          ? "selected" : ""}>No specific condition</option>
          <option value="DIABETES" ${c === "DIABETES"      ? "selected" : ""}>🩸 Diabetes</option>
          <option value="HYPERTENSION" ${c === "HYPERTENSION" ? "selected" : ""}>❤️ Hypertension (High Blood Pressure)</option>
          <option value="PREGNANCY"   ${c === "PREGNANCY"  ? "selected" : ""}>🤰 Pregnancy</option>
        </select>
        <small style="color:rgba(255,255,255,0.4);font-size:0.78rem;margin-top:0.3rem;display:block;">
          We use this to filter and recommend safe meals for you.
        </small>
      </div>

      <div id="pregnancy-section" style="${_fieldGroupStyle()};${!isPreg ? "display:none;" : ""}">
        <label style="${_labelStyle()}">Pregnancy Trimester</label>
        <select id="h-trimester" style="${_inputStyle()};cursor:pointer;">
          <option value="">Select trimester</option>
          <option value="1" ${profile?.trimester === 1 ? "selected" : ""}>1st Trimester</option>
          <option value="2" ${profile?.trimester === 2 ? "selected" : ""}>2nd Trimester</option>
          <option value="3" ${profile?.trimester === 3 ? "selected" : ""}>3rd Trimester</option>
        </select>
      </div>

      <div style="${_fieldGroupStyle()}">
        <label style="${_labelStyle()}">Max Daily Calories</label>
        <input id="h-calories" type="number" min="500" max="5000"
          value="${profile?.maxCalories || ""}"
          placeholder="e.g. 1800"
          style="${_inputStyle()}" />
        <small style="color:rgba(255,255,255,0.4);font-size:0.78rem;margin-top:0.3rem;display:block;">
          Leave blank for no limit
        </small>
      </div>

      <div style="${_fieldGroupStyle()}">
        <label style="${_labelStyle()}">Food Allergies</label>
        <input id="h-allergies" type="text"
          value="${(profile?.allergies || []).join(", ")}"
          placeholder="e.g. peanuts, shellfish, dairy"
          style="${_inputStyle()}" />
        <small style="color:rgba(255,255,255,0.4);font-size:0.78rem;margin-top:0.3rem;display:block;">
          Separate with commas
        </small>
      </div>

      <!-- Health info panel -->
      <div id="health-info-panel" style="
        background:rgba(200,168,75,0.08);border:1px solid rgba(200,168,75,0.2);
        border-radius:10px;padding:1rem;font-size:0.82rem;
        color:rgba(255,255,255,0.65);line-height:1.6;
        ${c === "NONE" ? "display:none;" : ""}
      ">
        ${_conditionInfo(c)}
      </div>

      <div style="display:flex;justify-content:flex-end;">
        <button type="submit" id="save-health-btn" style="${_primaryBtnStyle()}">
          Save Health Profile
        </button>
      </div>
    </form>
  `;

  // Show/hide pregnancy section and info panel
  document.getElementById("h-condition").addEventListener("change", function () {
    const val = this.value;
    const pregSection = document.getElementById("pregnancy-section");
    const infoPanel = document.getElementById("health-info-panel");

    pregSection.style.display = val === "PREGNANCY" ? "" : "none";
    infoPanel.style.display = val === "NONE" ? "none" : "";
    infoPanel.innerHTML = _conditionInfo(val);
  });

  document.getElementById("dwm-health-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("save-health-btn");
    setButtonLoading(btn, true, "Saving…");

    const condition = document.getElementById("h-condition").value;
    const caloriesVal = document.getElementById("h-calories").value;
    const allergiesRaw = document.getElementById("h-allergies").value;
    const trimesterVal = document.getElementById("h-trimester")?.value;

    try {
      await saveHealthProfile({
        condition,
        maxCalories: caloriesVal ? parseInt(caloriesVal) : null,
        allergies: allergiesRaw
          ? allergiesRaw.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        isPregnant: condition === "PREGNANCY",
        trimester: trimesterVal ? parseInt(trimesterVal) : null,
      });
      toast.success("Health profile saved! Your meal recommendations have been updated. 🥗");
    } catch (err) {
      toast.fromError(err);
    } finally {
      setButtonLoading(btn, false);
    }
  });
}

// ── Order history ─────────────────────────────────────────────

async function renderOrderHistory() {
  const container = document.getElementById("order-history-container") ||
                    document.querySelector(".order-history");
  if (!container) return;

  container.innerHTML = `<p style="color:rgba(255,255,255,0.5);font-size:0.875rem;">Loading orders…</p>`;

  try {
    const response = await fetchUserOrders({ limit: 10 });
    const orders = response.data;

    if (!orders || orders.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:2rem;color:rgba(255,255,255,0.4);">
          <div style="font-size:2rem;margin-bottom:0.5rem;">📦</div>
          <p>No orders yet. <a href="/meals.html" style="color:#c8a84b;">Browse meals →</a></p>
        </div>`;
      return;
    }

    container.innerHTML = orders.map((order) => `
      <div style="
        background:rgba(255,255,255,0.04);
        border:1px solid rgba(255,255,255,0.08);
        border-radius:12px;padding:1rem;margin-bottom:0.75rem;
      ">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">
          <span style="color:#fff;font-weight:700;font-size:0.9rem;">
            Order #${order.id.slice(0, 8).toUpperCase()}
          </span>
          <span style="${_statusBadgeStyle(order.status)}">${order.status}</span>
        </div>
        <div style="font-size:0.8rem;color:rgba(255,255,255,0.5);margin-bottom:0.5rem;">
          ${new Date(order.createdAt).toLocaleDateString("en-GB", {
            day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
          })}
        </div>
        <div style="font-size:0.85rem;color:rgba(255,255,255,0.7);">
          ${order.items?.map((i) => `${i.meal?.name} ×${i.quantity}`).join(", ")}
        </div>
        <div style="margin-top:0.5rem;color:#c8a84b;font-weight:700;font-size:0.95rem;">
          Total: $${parseFloat(order.totalPrice).toFixed(2)}
        </div>
      </div>
    `).join("");

  } catch (err) {
    container.innerHTML = `<p style="color:rgba(255,255,255,0.4);font-size:0.85rem;">Unable to load order history.</p>`;
  }
}

// ── Helpers ──────────────────────────────────────────────────

function _conditionInfo(condition) {
  const info = {
    DIABETES: `🩸 <strong style="color:#c8a84b;">Diabetes filter active.</strong> We'll hide meals high in sugar (>10g) and refined carbs (>50g), and highlight low-glycaemic African staples.`,
    HYPERTENSION: `❤️ <strong style="color:#c8a84b;">Hypertension filter active.</strong> We'll remove meals high in sodium (>400mg) and surface heart-healthy, low-salt dishes.`,
    PREGNANCY: `🤰 <strong style="color:#c8a84b;">Maternal health filter active.</strong> We'll prioritise meals high in protein, iron, and folate, and flag pregnancy-safe options.`,
  };
  return info[condition] || "";
}

function _statusBadgeStyle(status) {
  const colors = {
    PENDING:    "background:rgba(200,168,75,0.2);color:#c8a84b;",
    CONFIRMED:  "background:rgba(59,130,246,0.2);color:#60a5fa;",
    PREPARING:  "background:rgba(249,115,22,0.2);color:#fb923c;",
    DELIVERED:  "background:rgba(34,197,94,0.2);color:#4ade80;",
    CANCELLED:  "background:rgba(239,68,68,0.2);color:#f87171;",
  };
  return `
    font-size:0.72rem;font-weight:700;
    padding:3px 10px;border-radius:20px;
    ${colors[status] || "background:rgba(255,255,255,0.1);color:#fff;"}
  `;
}

const _fieldGroupStyle = () => "display:flex;flex-direction:column;gap:0.35rem;";
const _labelStyle = () => "color:rgba(255,255,255,0.75);font-size:0.85rem;font-weight:600;";
const _inputStyle = () => `
  padding:0.65rem 0.875rem;
  background:rgba(255,255,255,0.06);
  border:1px solid rgba(255,255,255,0.12);
  border-radius:8px;color:#fff;font-size:0.9rem;
  outline:none;width:100%;box-sizing:border-box;
  transition:border-color 0.2s;
`;
const _primaryBtnStyle = () => `
  padding:0.65rem 1.75rem;
  background:#1a5c3a;color:#fff;
  border:none;border-radius:8px;
  font-size:0.875rem;font-weight:700;
  cursor:pointer;transition:opacity 0.2s;
`;
