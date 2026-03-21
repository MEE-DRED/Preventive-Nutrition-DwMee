// src/api/orders.js
// ─────────────────────────────────────────────────────────────
// Order API calls for Dine With Mee
// Endpoints: /orders  /orders/user  /orders/:id
// ─────────────────────────────────────────────────────────────

import api from "./apiClient.js";

/**
 * createOrder(cartItems, meta)
 * Submits a new order from the current cart.
 *
 * @param {Array<{ mealId: string, quantity: number }>} cartItems
 * @param {{ notes?: string, address?: string }} meta
 * @returns {Order}
 */
export async function createOrder(cartItems, meta = {}) {
  if (!cartItems || cartItems.length === 0) {
    throw { type: "VALIDATION_ERROR", message: "Your cart is empty. Add meals before checking out." };
  }

  const payload = {
    items: cartItems.map(({ mealId, quantity }) => ({ mealId, quantity })),
    notes: meta.notes || null,
    address: meta.address || null,
  };

  const response = await api.post("/orders", payload);
  return response.data;
}

/**
 * fetchUserOrders(filters)
 * Returns the currently logged-in user's order history.
 * @param {{ status?: string, page?: number, limit?: number }} filters
 * @returns {{ data: Order[], pagination }}
 */
export async function fetchUserOrders(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.append("status", filters.status);
  if (filters.page) params.append("page", filters.page);
  if (filters.limit) params.append("limit", filters.limit);

  const query = params.toString() ? `?${params.toString()}` : "";
  const response = await api.get(`/orders/user${query}`);
  return response;
}

/**
 * fetchOrderById(id)
 * Returns detail for a single order.
 * @param {string} id
 * @returns {Order}
 */
export async function fetchOrderById(id) {
  const response = await api.get(`/orders/${id}`);
  return response.data;
}

/**
 * cancelOrder(id)
 * Cancels a pending order (customer action).
 * @param {string} id
 * @returns {Order}
 */
export async function cancelOrder(id) {
  const response = await api.patch(`/orders/${id}/status`, { status: "CANCELLED" });
  return response.data;
}
