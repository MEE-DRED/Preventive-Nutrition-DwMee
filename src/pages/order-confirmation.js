// src/pages/order-confirmation.js
// ─────────────────────────────────────────────────────────────
// Order confirmation page integration
//
// DROP-IN USAGE — add to your order-confirmation.html:
//   <div id="confirmation-container"></div>
//   <script type="module" src="src/pages/order-confirmation.js"></script>
// ─────────────────────────────────────────────────────────────

import { fetchOrderById } from "../api/orders.js";
import { requireAuth } from "../utils/auth.js";
import { initNavbar } from "../components/Navbar.js";
import toast from "../utils/toast.js";

document.addEventListener("DOMContentLoaded", async () => {
  if (!requireAuth("/login.html")) return;
  initNavbar();

  const orderId = new URLSearchParams(window.location.search).get("orderId");
  const container =
    document.getElementById("confirmation-container") ||
    document.querySelector(".confirmation-container") ||
    document.querySelector("main");

  if (!orderId) {
    if (container) {
      container.innerHTML = _errorHTML("No order ID found. Please check your order history.");
    }
    return;
  }

  if (container) {
    container.innerHTML = `<div style="text-align:center;padding:4rem;color:rgba(255,255,255,0.5);">
      <div style="
        width:48px;height:48px;margin:0 auto 1rem;
        border:4px solid rgba(200,168,75,0.25);
        border-top-color:#c8a84b;border-radius:50%;
        animation:dwm-spin 0.8s linear infinite;
      "></div>
      Loading your order…
      <style>@keyframes dwm-spin { to { transform: rotate(360deg); } }</style>
    </div>`;
  }

  try {
    const order = await fetchOrderById(orderId);
    renderConfirmation(container, order);
  } catch (err) {
    if (container) container.innerHTML = _errorHTML("Could not load order details.");
    toast.fromError(err);
  }
});

// ── Render confirmation ───────────────────────────────────────

function renderConfirmation(container, order) {
  if (!container) return;

  const statusConfig = {
    PENDING:   { icon: "⏳", label: "Pending",   color: "#c8a84b" },
    CONFIRMED: { icon: "✅", label: "Confirmed",  color: "#60a5fa" },
    PREPARING: { icon: "👨‍🍳", label: "Preparing", color: "#fb923c" },
    DELIVERED: { icon: "🎉", label: "Delivered",  color: "#4ade80" },
    CANCELLED: { icon: "❌", label: "Cancelled",  color: "#f87171" },
  };
  const status = statusConfig[order.status] || statusConfig.PENDING;

  container.innerHTML = `
    <div style="max-width:560px;margin:0 auto;padding:2rem 1rem;text-align:center;">

      <!-- Success animation -->
      <div style="
        width:80px;height:80px;margin:0 auto 1.5rem;
        background:rgba(200,168,75,0.15);
        border:2px solid rgba(200,168,75,0.4);
        border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        font-size:2rem;
      ">${status.icon}</div>

      <h1 style="color:#fff;font-size:1.6rem;margin:0 0 0.5rem;">
        Order ${order.status === "CANCELLED" ? "Cancelled" : "Placed!"}
      </h1>
      <p style="color:rgba(255,255,255,0.6);font-size:0.9rem;margin:0 0 2rem;">
        Order #${order.id.slice(0, 8).toUpperCase()} ·
        ${new Date(order.createdAt).toLocaleDateString("en-GB", {
          day: "2-digit", month: "long", year: "numeric"
        })}
      </p>

      <!-- Status badge -->
      <div style="
        display:inline-block;
        background:rgba(255,255,255,0.06);
        border:1px solid rgba(255,255,255,0.1);
        border-radius:30px;padding:0.4rem 1.25rem;
        color:${status.color};font-weight:700;
        font-size:0.85rem;margin-bottom:2rem;
      ">
        ${status.icon} ${status.label}
      </div>

      <!-- Order items -->
      <div style="
        background:rgba(255,255,255,0.04);
        border:1px solid rgba(255,255,255,0.08);
        border-radius:14px;text-align:left;
        overflow:hidden;margin-bottom:1.5rem;
      ">
        <div style="padding:1rem 1.25rem;border-bottom:1px solid rgba(255,255,255,0.06);">
          <h3 style="margin:0;color:#fff;font-size:0.95rem;font-weight:700;">Items Ordered</h3>
        </div>
        ${order.items?.map((item) => `
          <div style="
            display:flex;justify-content:space-between;align-items:center;
            padding:0.75rem 1.25rem;
            border-bottom:1px solid rgba(255,255,255,0.04);
          ">
            <div>
              <span style="color:#fff;font-size:0.9rem;font-weight:600;">
                ${item.meal?.name || "Meal"}
              </span>
              <span style="color:rgba(255,255,255,0.4);font-size:0.8rem;margin-left:0.5rem;">
                ×${item.quantity}
              </span>
            </div>
            <span style="color:#c8a84b;font-weight:700;">
              $${(parseFloat(item.unitPrice) * item.quantity).toFixed(2)}
            </span>
          </div>
        `).join("")}
        <div style="
          display:flex;justify-content:space-between;
          padding:1rem 1.25rem;
          font-size:1rem;font-weight:700;
        ">
          <span style="color:#fff;">Total</span>
          <span style="color:#c8a84b;">$${parseFloat(order.totalPrice).toFixed(2)}</span>
        </div>
      </div>

      ${order.address ? `
      <div style="
        background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);
        border-radius:10px;padding:0.875rem 1.25rem;
        text-align:left;margin-bottom:1.5rem;
        font-size:0.85rem;color:rgba(255,255,255,0.6);
      ">
        📍 Delivering to: <strong style="color:#fff;">${order.address}</strong>
      </div>` : ""}

      <!-- CTAs -->
      <div style="display:flex;gap:0.75rem;justify-content:center;flex-wrap:wrap;">
        <a href="/meals.html" style="
          padding:0.65rem 1.5rem;
          background:#1a5c3a;color:#fff;
          border-radius:8px;text-decoration:none;
          font-size:0.875rem;font-weight:700;
          transition:opacity 0.2s;
        ">Continue Shopping</a>
        <a href="/profile.html" style="
          padding:0.65rem 1.5rem;
          background:rgba(255,255,255,0.06);
          border:1px solid rgba(255,255,255,0.12);
          color:#fff;border-radius:8px;text-decoration:none;
          font-size:0.875rem;font-weight:600;
        ">View Order History</a>
      </div>
    </div>
  `;
}

function _errorHTML(message) {
  return `
    <div style="text-align:center;padding:4rem 1rem;color:rgba(255,255,255,0.5);">
      <div style="font-size:3rem;margin-bottom:1rem;">⚠️</div>
      <p style="font-size:1rem;margin:0 0 1.5rem;">${message}</p>
      <a href="/profile.html" style="
        display:inline-block;background:#1a5c3a;color:#fff;
        padding:0.6rem 1.5rem;border-radius:8px;text-decoration:none;font-weight:600;
      ">View Orders</a>
    </div>`;
}
