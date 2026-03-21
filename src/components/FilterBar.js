// src/components/FilterBar.js
// ─────────────────────────────────────────────────────────────
// Meal filter bar — renders category / country / search filters
// and calls back with the selected filter state
// ─────────────────────────────────────────────────────────────

import { fetchCategories, fetchCountries } from "../api/meals.js";

/**
 * initFilterBar(container, onFilter)
 * Renders the filter bar inside `container`.
 * Calls `onFilter(filters)` whenever any filter changes.
 *
 * @param {HTMLElement} container
 * @param {function} onFilter  — receives { category, country, search, tag }
 */
export async function initFilterBar(container, onFilter) {
  if (!container) return;

  let categories = [];
  let countries = [];

  try {
    [categories, countries] = await Promise.all([fetchCategories(), fetchCountries()]);
  } catch {
    // Non-fatal — render bar without dynamic options
  }

  container.innerHTML = `
    <div class="dwm-filter-bar" style="
      display:flex;flex-wrap:wrap;gap:0.75rem;
      align-items:center;
      padding:1rem 0;
      border-bottom:1px solid rgba(255,255,255,0.08);
      margin-bottom:1.5rem;
    ">
      <!-- Search -->
      <div style="flex:1;min-width:200px;position:relative;">
        <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:0.9rem;">🔍</span>
        <input
          id="dwm-search"
          type="text"
          placeholder="Search meals…"
          style="
            width:100%;padding:0.55rem 0.75rem 0.55rem 2.2rem;
            background:rgba(255,255,255,0.06);
            border:1px solid rgba(255,255,255,0.12);
            border-radius:8px;color:#fff;font-size:0.875rem;
            outline:none;box-sizing:border-box;
          "
        />
      </div>

      <!-- Category -->
      <select id="dwm-category" style="${selectStyle()}">
        <option value="">All Categories</option>
        ${categories.map((c) => `<option value="${c}">${capitalize(c)}</option>`).join("")}
      </select>

      <!-- Country -->
      <select id="dwm-country" style="${selectStyle()}">
        <option value="">All Countries</option>
        ${countries.map((c) => `<option value="${c}">${c}</option>`).join("")}
      </select>

      <!-- Health Tag -->
      <select id="dwm-tag" style="${selectStyle()}">
        <option value="">All Tags</option>
        <option value="Diabetes-Friendly">Diabetes-Friendly</option>
        <option value="Low Sodium">Low Sodium</option>
        <option value="High Protein">High Protein</option>
        <option value="Pregnancy-Safe">Pregnancy-Safe</option>
        <option value="Low Carb">Low Carb</option>
        <option value="Gluten-Free">Gluten-Free</option>
      </select>

      <!-- Calorie range -->
      <div style="display:flex;gap:0.4rem;align-items:center;">
        <input
          id="dwm-min-cal"
          type="number"
          placeholder="Min kcal"
          min="0"
          style="${inputStyle()};width:90px;"
        />
        <span style="color:rgba(255,255,255,0.4);font-size:0.8rem;">–</span>
        <input
          id="dwm-max-cal"
          type="number"
          placeholder="Max kcal"
          min="0"
          style="${inputStyle()};width:90px;"
        />
      </div>

      <!-- Clear -->
      <button id="dwm-clear-filters" style="
        background:none;border:1px solid rgba(255,255,255,0.15);
        color:rgba(255,255,255,0.5);padding:0.5rem 0.9rem;
        border-radius:8px;font-size:0.8rem;cursor:pointer;
        transition:all 0.2s;
      " onmouseenter="this.style.color='#fff'" onmouseleave="this.style.color='rgba(255,255,255,0.5)'">
        ✕ Clear
      </button>
    </div>
  `;

  // ── Bind events ──────────────────────────────────────────

  const getFilters = () => ({
    search: document.getElementById("dwm-search")?.value.trim() || "",
    category: document.getElementById("dwm-category")?.value || "",
    country: document.getElementById("dwm-country")?.value || "",
    tag: document.getElementById("dwm-tag")?.value || "",
    minCalories: document.getElementById("dwm-min-cal")?.value || "",
    maxCalories: document.getElementById("dwm-max-cal")?.value || "",
  });

  let searchDebounce;
  document.getElementById("dwm-search")?.addEventListener("input", () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => onFilter(getFilters()), 400);
  });

  ["dwm-category", "dwm-country", "dwm-tag"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", () => onFilter(getFilters()));
  });

  let calDebounce;
  ["dwm-min-cal", "dwm-max-cal"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", () => {
      clearTimeout(calDebounce);
      calDebounce = setTimeout(() => onFilter(getFilters()), 600);
    });
  });

  document.getElementById("dwm-clear-filters")?.addEventListener("click", () => {
    ["dwm-search", "dwm-min-cal", "dwm-max-cal"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    ["dwm-category", "dwm-country", "dwm-tag"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.selectedIndex = 0;
    });
    onFilter({});
  });
}

// ── Helpers ──────────────────────────────────────────────────

const selectStyle = () => `
  padding:0.55rem 0.75rem;
  background:rgba(255,255,255,0.06);
  border:1px solid rgba(255,255,255,0.12);
  border-radius:8px;color:#fff;font-size:0.875rem;
  outline:none;cursor:pointer;
  appearance:none;-webkit-appearance:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='rgba(255,255,255,0.4)' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat:no-repeat;
  background-position:right 10px center;
  padding-right:2rem;
`;

const inputStyle = () => `
  padding:0.55rem 0.75rem;
  background:rgba(255,255,255,0.06);
  border:1px solid rgba(255,255,255,0.12);
  border-radius:8px;color:#fff;font-size:0.875rem;
  outline:none;
`;

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
