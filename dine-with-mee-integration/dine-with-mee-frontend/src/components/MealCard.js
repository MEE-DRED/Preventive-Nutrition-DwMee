// src/components/MealCard.js
// ─────────────────────────────────────────────────────────────
// Renders a single meal card HTML string.
// Works with the existing dark-green / white / gold theme.
// ─────────────────────────────────────────────────────────────

import { addToCart, isInCart, getCartItemCount } from "../utils/cart.js";
import toast from "../utils/toast.js";

/**
 * createMealCardHTML(meal)
 * Returns an HTML string for a meal card.
 * Injects health tags, nutrition badge, add-to-cart button.
 *
 * @param {object} meal  — full meal object from API
 * @returns {string}     — HTML string
 */
export function createMealCardHTML(meal) {
  const {
    id,
    name,
    description,
    price,
    imageUrl,
    country,
    category,
    nutrition,
    mealTags = [],
  } = meal;

  const priceFormatted = `$${parseFloat(price).toFixed(2)}`;
  const calories = nutrition?.calories ?? null;
  const alreadyInCart = isInCart(id);
  const qty = getCartItemCount(id);

  const tagBadges = mealTags
    .map(
      (mt) =>
        `<span class="dwm-tag" style="
          background:rgba(200,168,75,0.15);
          color:#c8a84b;
          border:1px solid rgba(200,168,75,0.3);
          font-size:0.7rem;
          padding:2px 8px;
          border-radius:20px;
          white-space:nowrap;
        ">${mt.tag?.name ?? mt}</span>`
    )
    .join("");

  const imgSrc = imageUrl && imageUrl.startsWith("http")
    ? imageUrl
    : `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80`;

  return `
    <div class="dwm-meal-card" data-meal-id="${id}" style="
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 14px;
      overflow: hidden;
      transition: transform 0.2s, box-shadow 0.2s;
      cursor: pointer;
      position: relative;
    " onmouseenter="this.style.transform='translateY(-4px)';this.style.boxShadow='0 12px 30px rgba(0,0,0,0.3)'"
       onmouseleave="this.style.transform='translateY(0)';this.style.boxShadow='none'">

      <!-- Image -->
      <div style="position:relative;overflow:hidden;">
        <img
          src="${imgSrc}"
          alt="${name}"
          loading="lazy"
          style="width:100%;height:200px;object-fit:cover;display:block;"
          onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80'"
        />
        <!-- Country badge -->
        <span style="
          position:absolute;top:10px;left:10px;
          background:rgba(10,35,20,0.85);
          color:#c8a84b;
          font-size:0.72rem;font-weight:600;
          padding:3px 10px;border-radius:20px;
          border:1px solid rgba(200,168,75,0.4);
        ">🌍 ${country}</span>

        <!-- Calorie badge -->
        ${calories ? `
        <span style="
          position:absolute;top:10px;right:10px;
          background:rgba(10,35,20,0.85);
          color:#fff;
          font-size:0.72rem;font-weight:600;
          padding:3px 10px;border-radius:20px;
        ">🔥 ${calories} kcal</span>` : ""}
      </div>

      <!-- Body -->
      <div style="padding:1rem;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:0.5rem;margin-bottom:0.4rem;">
          <h3 style="margin:0;font-size:1rem;font-weight:700;color:#fff;line-height:1.3;">${name}</h3>
          <span style="color:#c8a84b;font-weight:800;font-size:1.05rem;white-space:nowrap;">${priceFormatted}</span>
        </div>

        ${description ? `
        <p style="
          margin:0 0 0.6rem;
          font-size:0.8rem;
          color:rgba(255,255,255,0.6);
          line-height:1.5;
          display:-webkit-box;
          -webkit-line-clamp:2;
          -webkit-box-orient:vertical;
          overflow:hidden;
        ">${description}</p>` : ""}

        <!-- Tags -->
        ${tagBadges ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:0.8rem;">${tagBadges}</div>` : ""}

        <!-- Nutrition mini-row -->
        ${nutrition ? `
        <div style="
          display:flex;gap:1rem;
          font-size:0.72rem;color:rgba(255,255,255,0.5);
          margin-bottom:0.8rem;
        ">
          <span>🥩 ${parseFloat(nutrition.protein).toFixed(0)}g protein</span>
          <span>🍞 ${parseFloat(nutrition.carbs).toFixed(0)}g carbs</span>
          <span>🧂 ${parseFloat(nutrition.sodium).toFixed(0)}mg sodium</span>
        </div>` : ""}

        <!-- Add to Cart Button -->
        <button
          class="dwm-add-to-cart-btn"
          data-meal-id="${id}"
          data-meal-name="${name}"
          style="
            width:100%;padding:0.6rem;
            background:${alreadyInCart ? "rgba(200,168,75,0.2)" : "#1a5c3a"};
            color:${alreadyInCart ? "#c8a84b" : "#fff"};
            border:${alreadyInCart ? "1px solid #c8a84b" : "none"};
            border-radius:8px;font-size:0.875rem;font-weight:600;
            cursor:pointer;transition:all 0.2s;
          "
          onclick="event.stopPropagation(); window.__dwmAddToCart(this, ${JSON.stringify(meal).replace(/"/g, '&quot;')})"
        >
          ${alreadyInCart ? `✓ In Cart (${qty})` : "Add to Cart"}
        </button>
      </div>
    </div>
  `;
}

/**
 * renderMealsGrid(container, meals, emptyMessage?)
 * Renders a grid of meal cards into the given container element.
 */
export function renderMealsGrid(container, meals, emptyMessage = "No meals found.") {
  if (!container) return;

  if (!meals || meals.length === 0) {
    container.innerHTML = `
      <div style="
        grid-column:1/-1;text-align:center;
        padding:3rem 1rem;color:rgba(255,255,255,0.5);
      ">
        <div style="font-size:2.5rem;margin-bottom:0.75rem;">🍽️</div>
        <p style="font-size:1rem;">${emptyMessage}</p>
      </div>`;
    return;
  }

  container.innerHTML = meals.map(createMealCardHTML).join("");
  _bindGlobalAddToCart();
}

// ── Global add-to-cart handler (works with inline onclick) ───

function _bindGlobalAddToCart() {
  window.__dwmAddToCart = (button, meal) => {
    try {
      addToCart(meal);
      const qty = getCartItemCount(meal.id);
      button.style.background = "rgba(200,168,75,0.2)";
      button.style.color = "#c8a84b";
      button.style.border = "1px solid #c8a84b";
      button.textContent = `✓ In Cart (${qty})`;
      toast.success(`${meal.name} added to cart!`, { duration: 2500 });
    } catch (err) {
      toast.fromError(err);
    }
  };
}
