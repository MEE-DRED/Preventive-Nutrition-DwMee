// src/pages/meals.js
// ─────────────────────────────────────────────────────────────
// Meals listing page integration for Dine With Mee
//
// DROP-IN USAGE — add to your meals.html:
//   <div id="meals-grid" class="meals-grid"></div>
//   <div id="filter-bar-container"></div>
//   <div id="personalized-banner"></div>
//   <script type="module" src="src/pages/meals.js"></script>
// ─────────────────────────────────────────────────────────────

import { fetchMeals, fetchPersonalizedMeals } from "../api/meals.js";
import { renderMealsGrid } from "../components/MealCard.js";
import { initFilterBar } from "../components/FilterBar.js";
import { initNavbar } from "../components/Navbar.js";
import { isLoggedIn } from "../utils/auth.js";
import { showSkeleton, hideSkeleton } from "../utils/spinner.js";
import toast from "../utils/toast.js";

// ── DOM refs ─────────────────────────────────────────────────
const grid = document.getElementById("meals-grid") ||
             document.getElementById("marketplace-meals") ||
             document.querySelector(".meals-grid") ||
             document.querySelector(".menu-grid");

const filterContainer = document.getElementById("filter-bar-container") ||
                        document.querySelector(".filter-container");

const personalizedBanner = document.getElementById("personalized-banner");
const resultsCount = document.getElementById("results-count") ||
                     document.getElementById("meal-count");

let currentFilters = {};
let isPersonalized = false;

// ── Init ─────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", async () => {
  initNavbar();
  await init();
});

async function init() {
  _prepareMarketplaceLayout();

  // Show personalized meals if user is logged in
  if (isLoggedIn()) {
    await loadPersonalized();
  } else {
    await loadMeals();
  }

  // Render filter bar
  if (filterContainer) {
    await initFilterBar(filterContainer, handleFilterChange);
  }

  // Bind toggle between personalized and all meals
  _bindPersonalizedToggle();
}

// ── Load all meals (with filters) ────────────────────────────

async function loadMeals(filters = {}) {
  if (!grid) return;
  isPersonalized = false;
  showSkeleton(grid, 8);

  try {
    const response = await fetchMeals(filters);
    hideSkeleton(grid);
    renderMealsGrid(grid, response.data);
    _updateResultsCount(response.data?.length, response.pagination?.total);
  } catch (err) {
    hideSkeleton(grid);
    grid.innerHTML = _errorHTML("Failed to load meals. Please try again.");
    toast.fromError(err);
  }
}

// ── Load personalized meals ───────────────────────────────────

async function loadPersonalized() {
  if (!grid) return;
  isPersonalized = true;
  showSkeleton(grid, 6);

  try {
    const data = await fetchPersonalizedMeals();
    hideSkeleton(grid);
    renderMealsGrid(
      grid,
      data.safeMeals,
      "No meals match your health profile right now."
    );

    // Show health banner
    if (personalizedBanner && data.hasHealthProfile) {
      personalizedBanner.style.display = "block";
      personalizedBanner.innerHTML = `
        <div style="
          background:rgba(200,168,75,0.1);
          border:1px solid rgba(200,168,75,0.3);
          border-radius:10px;padding:0.875rem 1.25rem;
          margin-bottom:1.5rem;
          display:flex;justify-content:space-between;align-items:center;
          flex-wrap:wrap;gap:0.5rem;
        ">
          <span style="color:#c8a84b;font-size:0.875rem;">
            🧬 <strong>Personalized for ${_conditionLabel(data.condition)}</strong>
            — ${data.summary}
          </span>
          <button id="dwm-show-all-btn" style="
            background:none;border:1px solid rgba(200,168,75,0.4);
            color:#c8a84b;padding:0.35rem 0.9rem;
            border-radius:20px;font-size:0.8rem;cursor:pointer;
          ">Show all meals</button>
        </div>`;

      document.getElementById("dwm-show-all-btn")?.addEventListener("click", () => {
        isPersonalized = false;
        personalizedBanner.style.display = "none";
        loadMeals(currentFilters);
      });
    }

    _updateResultsCount(data.safeMeals?.length);
  } catch (err) {
    // Fallback to all meals if personalized fails
    hideSkeleton(grid);
    await loadMeals(currentFilters);
  }
}

// ── Filter change handler ─────────────────────────────────────

async function handleFilterChange(filters) {
  currentFilters = filters;
  isPersonalized = false;
  if (personalizedBanner) personalizedBanner.style.display = "none";
  await loadMeals(filters);
}

// ── Helpers ──────────────────────────────────────────────────

function _prepareMarketplaceLayout() {
  if (!window.__DWM_INTEGRATION_MARKETPLACE__) return;

  ["#region-filter", ".meal-tools", ".meal-nutrition-filters", "#favorites-section", "#meal-pagination"].forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => {
      el.style.display = "none";
    });
  });
}

function _bindPersonalizedToggle() {
  const btn = document.getElementById("dwm-personalized-btn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    if (isLoggedIn()) {
      loadPersonalized();
    } else {
      toast.info("Please log in to see your personalized meal recommendations.");
      setTimeout(() => (window.location.href = "/login.html"), 1200);
    }
  });
}

function _updateResultsCount(shown, total) {
  if (!resultsCount) return;
  if (total && total !== shown) {
    resultsCount.textContent = `Showing ${shown} of ${total} meals`;
  } else {
    resultsCount.textContent = `${shown ?? 0} meal${shown !== 1 ? "s" : ""} found`;
  }
}

function _conditionLabel(condition) {
  const labels = {
    DIABETES: "diabetes management",
    HYPERTENSION: "blood pressure management",
    PREGNANCY: "maternal health",
    NONE: "your preferences",
  };
  return labels[condition] || "your health";
}

function _errorHTML(message) {
  return `
    <div style="
      grid-column:1/-1;text-align:center;
      padding:3rem 1rem;color:rgba(255,255,255,0.5);
    ">
      <div style="font-size:2.5rem;margin-bottom:0.75rem;">⚠️</div>
      <p style="font-size:1rem;">${message}</p>
      <button onclick="location.reload()" style="
        margin-top:1rem;background:#1a5c3a;color:#fff;border:none;
        padding:0.6rem 1.5rem;border-radius:8px;cursor:pointer;font-size:0.875rem;
      ">Retry</button>
    </div>`;
}
