// src/pages/cart.js
// ─────────────────────────────────────────────────────────────
// Cart page integration for Dine With Mee
//
// DROP-IN USAGE — add to your cart.html:
//   <div id="cart-items-container"></div>
//   <div id="cart-summary"></div>
//   <button id="checkout-btn">Checkout</button>
//   <script type="module" src="src/pages/cart.js"></script>
// ─────────────────────────────────────────────────────────────

import {
  getCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  getCartTotal,
  getCartTotalFormatted,
  getCartCount,
  buildOrderPayload,
} from "../utils/cart.js";
import { createOrder } from "../api/orders.js";
import { isLoggedIn } from "../utils/auth.js";
import { initNavbar } from "../components/Navbar.js";
import { setButtonLoading } from "../utils/spinner.js";
import toast from "../utils/toast.js";

document.addEventListener("DOMContentLoaded", () => {
  initNavbar();
  renderCart();
  _bindCheckout();

  // Re-render on cart updates (e.g. from other tabs)
  window.addEventListener("dwm:cartUpdate", renderCart);
});

// ── Render ───────────────────────────────────────────────────

function renderCart() {
  const container =
    document.getElementById("cart-items-container") ||
    document.querySelector(".cart-items") ||
    document.querySelector(".cart-container");

  const summaryEl =
    document.getElementById("cart-summary") ||
    document.querySelector(".cart-summary");

  const cart = getCart();

  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = _emptyCartHTML();
    if (summaryEl) summaryEl.style.display = "none";
    _updateCheckoutBtn(false);
    return;
  }

  container.innerHTML = cart.map((item) => _cartItemHTML(item)).join("");
  _bindCartActions(container);

  if (summaryEl) {
    summaryEl.style.display = "";
    _renderSummary(summaryEl, cart);
  }

  _updateCheckoutBtn(true);
}

// ── Cart item HTML ───────────────────────────────────────────

function _cartItemHTML(item) {
  const imgSrc =
    item.imageUrl && item.imageUrl.startsWith("http")
      ? item.imageUrl
      : `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=70`;

  return `
    <div class="dwm-cart-item" data-meal-id="${item.mealId}" style="
      display:flex;gap:1rem;align-items:center;
      padding:1rem;border-radius:12px;
      background:rgba(255,255,255,0.04);
      border:1px solid rgba(255,255,255,0.08);
      margin-bottom:0.75rem;
    ">
      <!-- Image -->
      <img
        src="${imgSrc}"
        alt="${item.name}"
        style="width:80px;height:80px;object-fit:cover;border-radius:8px;flex-shrink:0;"
        onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=70'"
      />

      <!-- Details -->
      <div style="flex:1;min-width:0;">
        <h4 style="margin:0 0 0.2rem;color:#fff;font-size:0.95rem;font-weight:700;
          white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
          ${item.name}
        </h4>
        <div style="font-size:0.8rem;color:rgba(255,255,255,0.5);margin-bottom:0.5rem;">
          ${item.category ? item.category + " · " : ""}${item.country || ""}
        </div>
        <div style="color:#c8a84b;font-weight:700;font-size:0.95rem;">
          $${(item.price * item.quantity).toFixed(2)}
          <span style="color:rgba(255,255,255,0.4);font-weight:400;font-size:0.8rem;">
            ($${parseFloat(item.price).toFixed(2)} each)
          </span>
        </div>
      </div>

      <!-- Quantity controls -->
      <div style="display:flex;align-items:center;gap:0.4rem;flex-shrink:0;">
        <button
          class="dwm-qty-btn dwm-decrement"
          data-meal-id="${item.mealId}"
          style="${_qtyBtnStyle()}"
          aria-label="Decrease"
        >−</button>
        <span class="dwm-qty-value" style="
          min-width:2rem;text-align:center;
          color:#fff;font-weight:700;font-size:1rem;
        ">${item.quantity}</span>
        <button
          class="dwm-qty-btn dwm-increment"
          data-meal-id="${item.mealId}"
          style="${_qtyBtnStyle()}"
          aria-label="Increase"
        >+</button>
      </div>

      <!-- Remove -->
      <button
        class="dwm-remove-btn"
        data-meal-id="${item.mealId}"
        aria-label="Remove ${item.name}"
        style="
          background:none;border:none;
          color:rgba(255,100,100,0.6);
          font-size:1.2rem;cursor:pointer;
          padding:0.25rem;flex-shrink:0;
          transition:color 0.2s;
        "
        onmouseenter="this.style.color='#ff6b6b'"
        onmouseleave="this.style.color='rgba(255,100,100,0.6)'"
      >🗑</button>
    </div>
  `;
}

// ── Summary HTML ─────────────────────────────────────────────

function _renderSummary(el, cart) {
  const subtotal = getCartTotal(cart);
  const delivery = subtotal > 0 ? 2.5 : 0;
  const total = subtotal + delivery;
  const count = getCartCount(cart);

  el.innerHTML = `
    <div style="
      background:rgba(255,255,255,0.04);
      border:1px solid rgba(255,255,255,0.1);
      border-radius:14px;padding:1.25rem;
    ">
      <h3 style="margin:0 0 1rem;color:#fff;font-size:1rem;font-weight:700;">
        Order Summary
      </h3>
      <div style="display:flex;flex-direction:column;gap:0.5rem;font-size:0.9rem;">
        <div style="${_rowStyle()}">
          <span style="color:rgba(255,255,255,0.6);">Items (${count})</span>
          <span style="color:#fff;">$${subtotal.toFixed(2)}</span>
        </div>
        <div style="${_rowStyle()}">
          <span style="color:rgba(255,255,255,0.6);">Delivery</span>
          <span style="color:#fff;">$${delivery.toFixed(2)}</span>
        </div>
        <div style="height:1px;background:rgba(255,255,255,0.08);margin:0.5rem 0;"></div>
        <div style="${_rowStyle()};font-weight:700;font-size:1.05rem;">
          <span style="color:#fff;">Total</span>
          <span style="color:#c8a84b;">$${total.toFixed(2)}</span>
        </div>
      </div>

      <button id="checkout-btn" style="
        width:100%;margin-top:1.25rem;
        padding:0.75rem;
        background:linear-gradient(135deg, #1a5c3a, #0d3d26);
        color:#fff;border:none;border-radius:10px;
        font-size:0.95rem;font-weight:700;cursor:pointer;
        transition:opacity 0.2s;
      "
        onmouseenter="this.style.opacity='0.9'"
        onmouseleave="this.style.opacity='1'"
      >
        🛒 Checkout · $${total.toFixed(2)}
      </button>

      <button id="clear-cart-btn" style="
        width:100%;margin-top:0.5rem;padding:0.55rem;
        background:none;border:1px solid rgba(255,255,255,0.1);
        color:rgba(255,255,255,0.4);border-radius:8px;
        font-size:0.8rem;cursor:pointer;transition:all 0.2s;
      "
        onmouseenter="this.style.color='#fff';this.style.borderColor='rgba(255,255,255,0.3)'"
        onmouseleave="this.style.color='rgba(255,255,255,0.4)';this.style.borderColor='rgba(255,255,255,0.1)'"
      >
        Clear cart
      </button>
    </div>
  `;

  _bindCheckout();
  document.getElementById("clear-cart-btn")?.addEventListener("click", () => {
    if (confirm("Clear your entire cart?")) {
      clearCart();
      toast.info("Cart cleared.");
    }
  });
}

// ── Cart action bindings ─────────────────────────────────────

function _bindCartActions(container) {
  container.querySelectorAll(".dwm-increment").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.mealId;
      const cart = getCart();
      const item = cart.find((i) => i.mealId === id);
      if (item) updateQuantity(id, item.quantity + 1);
    });
  });

  container.querySelectorAll(".dwm-decrement").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.mealId;
      const cart = getCart();
      const item = cart.find((i) => i.mealId === id);
      if (item) updateQuantity(id, item.quantity - 1);
    });
  });

  container.querySelectorAll(".dwm-remove-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.mealId;
      const item = getCart().find((i) => i.mealId === id);
      removeFromCart(id);
      if (item) toast.info(`${item.name} removed from cart.`);
    });
  });
}

// ── Checkout ─────────────────────────────────────────────────

function _bindCheckout() {
  const btn =
    document.getElementById("checkout-btn") ||
    document.querySelector(".checkout-btn");
  if (!btn) return;

  btn.addEventListener("click", handleCheckout, { once: true });
}

async function handleCheckout() {
  const cart = getCart();

  if (cart.length === 0) {
    toast.warning("Your cart is empty. Add some meals first!");
    return;
  }

  if (!isLoggedIn()) {
    toast.info("Please log in to place an order.");
    setTimeout(() => {
      window.location.href = `/login.html?returnTo=${encodeURIComponent(window.location.pathname)}`;
    }, 1200);
    return;
  }

  // Collect delivery notes / address from page if present
  const address = document.getElementById("delivery-address")?.value?.trim() || "";
  const notes = document.getElementById("order-notes")?.value?.trim() || "";

  const btn = document.getElementById("checkout-btn");
  setButtonLoading(btn, true, "Placing order…");

  try {
    const order = await createOrder(buildOrderPayload(), { address, notes });

    // Success
    clearCart();
    toast.success("Order placed successfully! 🎉", { duration: 5000 });

    // Redirect to confirmation
    setTimeout(() => {
      window.location.href = `/order-confirmation.html?orderId=${order.id}`;
    }, 1500);
  } catch (err) {
    setButtonLoading(btn, false);
    toast.fromError(err);
    // Rebind since we used once:true
    btn?.addEventListener("click", handleCheckout, { once: true });
  }
}

// ── Helpers ──────────────────────────────────────────────────

function _updateCheckoutBtn(hasItems) {
  const btn = document.getElementById("checkout-btn");
  if (!btn) return;
  btn.disabled = !hasItems;
  btn.style.opacity = hasItems ? "1" : "0.5";
}

function _qtyBtnStyle() {
  return `
    width:28px;height:28px;
    border-radius:50%;border:1px solid rgba(255,255,255,0.2);
    background:rgba(255,255,255,0.06);
    color:#fff;font-size:1rem;cursor:pointer;
    display:flex;align-items:center;justify-content:center;
    transition:all 0.15s;line-height:1;padding:0;
  `;
}

function _rowStyle() {
  return "display:flex;justify-content:space-between;align-items:center;";
}

function _emptyCartHTML() {
  return `
    <div style="text-align:center;padding:4rem 1rem;color:rgba(255,255,255,0.5);">
      <div style="font-size:4rem;margin-bottom:1rem;">🛒</div>
      <h3 style="color:#fff;margin:0 0 0.5rem;font-size:1.25rem;">Your cart is empty</h3>
      <p style="font-size:0.9rem;margin:0 0 1.5rem;">
        Discover delicious African meals and add them to your cart.
      </p>
      <a href="/meals.html" style="
        display:inline-block;
        background:#1a5c3a;color:#fff;
        padding:0.7rem 1.75rem;border-radius:8px;
        text-decoration:none;font-weight:600;font-size:0.9rem;
      ">Browse Meals</a>
    </div>
  `;
}
