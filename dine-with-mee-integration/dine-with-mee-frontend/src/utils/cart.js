// src/utils/cart.js
// ─────────────────────────────────────────────────────────────
// Cart management for Dine With Mee
// Persists to localStorage, emits events for UI reactivity
// ─────────────────────────────────────────────────────────────

const CART_KEY = "dwm_cart";

/**
 * getCart()
 * Returns the full cart array.
 * Each item: { mealId, name, price, imageUrl, quantity, category, country }
 */
export function getCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * saveCart(cart)
 * Internal — saves cart array and emits update event.
 */
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(
    new CustomEvent("dwm:cartUpdate", {
      detail: { cart, count: getCartCount(cart), total: getCartTotal(cart) },
    })
  );
}

/**
 * addToCart(meal, quantity = 1)
 * Adds a meal to cart, or increments quantity if already present.
 *
 * @param {{
 *   id: string,
 *   name: string,
 *   price: number | string,
 *   imageUrl?: string,
 *   category?: string,
 *   country?: string
 * }} meal
 * @param {number} quantity
 */
export function addToCart(meal, quantity = 1) {
  const cart = getCart();
  const existingIndex = cart.findIndex((item) => item.mealId === meal.id);

  if (existingIndex > -1) {
    cart[existingIndex].quantity += quantity;
  } else {
    cart.push({
      mealId: meal.id,
      name: meal.name,
      price: parseFloat(meal.price),
      imageUrl: meal.imageUrl || null,
      category: meal.category || null,
      country: meal.country || null,
      quantity,
    });
  }

  saveCart(cart);
  return cart;
}

/**
 * removeFromCart(mealId)
 * Removes a meal entirely from the cart.
 */
export function removeFromCart(mealId) {
  const cart = getCart().filter((item) => item.mealId !== mealId);
  saveCart(cart);
  return cart;
}

/**
 * updateQuantity(mealId, quantity)
 * Sets a specific quantity for a cart item.
 * If quantity <= 0, the item is removed.
 */
export function updateQuantity(mealId, quantity) {
  if (quantity <= 0) {
    return removeFromCart(mealId);
  }

  const cart = getCart().map((item) =>
    item.mealId === mealId ? { ...item, quantity } : item
  );
  saveCart(cart);
  return cart;
}

/**
 * incrementQuantity(mealId)
 */
export function incrementQuantity(mealId) {
  const item = getCart().find((i) => i.mealId === mealId);
  if (item) updateQuantity(mealId, item.quantity + 1);
}

/**
 * decrementQuantity(mealId)
 */
export function decrementQuantity(mealId) {
  const item = getCart().find((i) => i.mealId === mealId);
  if (item) updateQuantity(mealId, item.quantity - 1);
}

/**
 * clearCart()
 * Empties the cart completely.
 */
export function clearCart() {
  saveCart([]);
}

/**
 * getCartCount(cart?)
 * Returns total number of items (sum of quantities).
 */
export function getCartCount(cart = null) {
  return (cart || getCart()).reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * getCartTotal(cart?)
 * Returns the total price of all items.
 */
export function getCartTotal(cart = null) {
  return (cart || getCart()).reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
}

/**
 * getCartTotalFormatted(cart?)
 * Returns formatted price string e.g. "$12.50"
 */
export function getCartTotalFormatted(cart = null) {
  return `$${getCartTotal(cart).toFixed(2)}`;
}

/**
 * isInCart(mealId)
 * Returns true if the meal is already in the cart.
 */
export function isInCart(mealId) {
  return getCart().some((item) => item.mealId === mealId);
}

/**
 * getCartItemCount(mealId)
 * Returns quantity of a specific meal in cart, or 0.
 */
export function getCartItemCount(mealId) {
  const item = getCart().find((i) => i.mealId === mealId);
  return item ? item.quantity : 0;
}

/**
 * buildOrderPayload()
 * Returns cart in the format the backend expects.
 * @returns {Array<{ mealId: string, quantity: number }>}
 */
export function buildOrderPayload() {
  return getCart().map(({ mealId, quantity }) => ({ mealId, quantity }));
}
