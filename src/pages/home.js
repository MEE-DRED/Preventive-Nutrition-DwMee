// src/pages/home.js
// ─────────────────────────────────────────────────────────────
// Homepage integration for Dine With Mee
//
// DROP-IN USAGE — add to your index.html:
//   <div id="featured-meals-grid"></div>
//   <div id="personalized-section"></div>
//   <script type="module" src="src/pages/home.js"></script>
// ─────────────────────────────────────────────────────────────

import { fetchMeals, fetchPersonalizedMeals } from "../api/meals.js";
import { renderMealsGrid } from "../components/MealCard.js";
import { initNavbar } from "../components/Navbar.js";
import { isLoggedIn, getUser } from "../utils/auth.js";
import { showSkeleton, hideSkeleton } from "../utils/spinner.js";
import toast from "../utils/toast.js";

document.addEventListener("DOMContentLoaded", async () => {
  initNavbar();
  _greetUser();
  await Promise.all([
    loadFeaturedMeals(),
    loadPersonalizedSection(),
    loadCategoryHighlights(),
  ]);
});

// ── Featured meals ────────────────────────────────────────────

async function loadFeaturedMeals() {
  const grid =
    document.getElementById("featured-meals-grid") ||
    document.getElementById("featured-meals") ||
    document.querySelector(".featured-meals") ||
    document.querySelector(".home-meals-grid");

  if (!grid) return;

  showSkeleton(grid, 4);

  try {
    const response = await fetchMeals({ limit: 8, page: 1 });
    hideSkeleton(grid);
    renderMealsGrid(grid, response.data, "No meals available right now.");
  } catch (err) {
    hideSkeleton(grid);
    grid.innerHTML = `<p style="color:rgba(255,255,255,0.5);grid-column:1/-1;text-align:center;padding:2rem;">
      Unable to load meals. <a href="javascript:location.reload()" style="color:#c8a84b;">Retry</a>
    </p>`;
  }
}

// ── Personalized section ──────────────────────────────────────

async function loadPersonalizedSection() {
  const section =
    document.getElementById("personalized-section") ||
    document.querySelector(".personalized-section");

  if (!section || !isLoggedIn()) {
    if (section) section.style.display = "none";
    return;
  }

  section.style.display = "";

  const grid = section.querySelector("[data-personalized-grid], .personalized-grid");
  if (!grid) return;

  showSkeleton(grid, 4);

  try {
    const data = await fetchPersonalizedMeals();
    hideSkeleton(grid);

    if (data.hasHealthProfile && data.safeMeals.length > 0) {
      const badge = section.querySelector("[data-condition-badge], .condition-badge");
      if (badge) {
        badge.textContent = _conditionLabel(data.condition);
        badge.style.display = "inline-block";
      }
      renderMealsGrid(grid, data.safeMeals.slice(0, 4));
    } else if (!data.hasHealthProfile) {
      grid.innerHTML = `
        <div style="
          grid-column:1/-1;text-align:center;
          padding:2rem;
          background:rgba(200,168,75,0.08);
          border:1px dashed rgba(200,168,75,0.3);
          border-radius:12px;
        ">
          <p style="color:rgba(255,255,255,0.7);margin:0 0 0.75rem;font-size:0.9rem;">
            🧬 Set up your health profile to get personalized meal recommendations.
          </p>
          <a href="/profile.html" style="
            display:inline-block;background:#1a5c3a;color:#fff;
            padding:0.5rem 1.25rem;border-radius:8px;
            text-decoration:none;font-size:0.85rem;font-weight:600;
          ">Set up health profile →</a>
        </div>`;
    } else {
      grid.innerHTML = `<p style="color:rgba(255,255,255,0.5);grid-column:1/-1;text-align:center;">
        No personalized meals available right now.
      </p>`;
    }
  } catch {
    hideSkeleton(grid);
    section.style.display = "none";
  }
}

// ── Category highlights ───────────────────────────────────────

async function loadCategoryHighlights() {
  const container =
    document.getElementById("category-highlights") ||
    document.querySelector(".category-highlights");

  if (!container) return;

  const HIGHLIGHT_CATEGORIES = [
    { name: "rice",   label: "Rice Dishes",  emoji: "🍚" },
    { name: "soups",  label: "Soups",        emoji: "🍲" },
    { name: "stews",  label: "Stews",        emoji: "🥘" },
    { name: "grills", label: "Grills",       emoji: "🔥" },
  ];

  container.innerHTML = HIGHLIGHT_CATEGORIES.map((cat) => `
    <a href="/marketplace.html?category=${cat.name}" class="dwm-category-card" style="
      display:flex;flex-direction:column;align-items:center;
      justify-content:center;gap:0.5rem;
      padding:1.25rem 1rem;
      background:rgba(255,255,255,0.04);
      border:1px solid rgba(255,255,255,0.08);
      border-radius:12px;text-decoration:none;
      transition:all 0.2s;cursor:pointer;
    "
      onmouseenter="this.style.background='rgba(200,168,75,0.08)';this.style.borderColor='rgba(200,168,75,0.3)'"
      onmouseleave="this.style.background='rgba(255,255,255,0.04)';this.style.borderColor='rgba(255,255,255,0.08)'"
    >
      <span style="font-size:2rem;">${cat.emoji}</span>
      <span style="color:#fff;font-weight:600;font-size:0.875rem;">${cat.label}</span>
    </a>
  `).join("");

  // If landed with a category param, pre-filter
  const urlCategory = new URLSearchParams(window.location.search).get("category");
  if (urlCategory) {
    // Will be handled by meals.js on the meals page
  }
}

// ── Greet logged-in user ──────────────────────────────────────

function _greetUser() {
  const greetEl =
    document.getElementById("user-greeting") ||
    document.querySelector(".user-greeting");

  if (!greetEl || !isLoggedIn()) return;

  const user = getUser();
  const hour = new Date().getHours();
  const timeGreet =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  greetEl.textContent = `${timeGreet}, ${user?.name?.split(" ")[0] || "there"}! 👋`;
  greetEl.style.display = "block";
}

// ── Helpers ──────────────────────────────────────────────────

function _conditionLabel(condition) {
  const map = {
    DIABETES: "Diabetes-friendly",
    HYPERTENSION: "Heart-healthy",
    PREGNANCY: "Maternal health",
  };
  return map[condition] || "For you";
}
