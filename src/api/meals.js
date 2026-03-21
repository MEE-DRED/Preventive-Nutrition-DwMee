// src/api/meals.js
// ─────────────────────────────────────────────────────────────
// Meal API calls for Dine With Mee
// Endpoints: /meals  /meals/:id  /meals/personalized
//            /meals/categories  /meals/countries
// ─────────────────────────────────────────────────────────────

import api from "./apiClient.js";

/**
 * fetchMeals(filters)
 * Fetches all available meals with optional filters.
 *
 * @param {{
 *   category?: string,
 *   country?: string,
 *   tag?: string,
 *   search?: string,
 *   minCalories?: number,
 *   maxCalories?: number,
 *   page?: number,
 *   limit?: number
 * }} filters
 * @returns {{ data: Meal[], pagination }}
 */
export async function fetchMeals(filters = {}) {
  const params = new URLSearchParams();

  // Only append defined, non-empty filters
  const allowed = ["category", "country", "tag", "search", "minCalories", "maxCalories", "page", "limit"];
  for (const key of allowed) {
    if (filters[key] !== undefined && filters[key] !== "" && filters[key] !== null) {
      params.append(key, filters[key]);
    }
  }

  const query = params.toString() ? `?${params.toString()}` : "";
  const response = await api.get(`/meals${query}`);
  return response;
}

/**
 * fetchMealById(id)
 * Fetches a single meal with full nutrition + tag detail.
 * @param {string} id
 * @returns {Meal}
 */
export async function fetchMealById(id) {
  const response = await api.get(`/meals/${id}`);
  return response.data;
}

/**
 * fetchPersonalizedMeals()
 * Fetches meals filtered by the logged-in user's health profile.
 * Requires authentication.
 * @returns {{ safeMeals: Meal[], filteredOutMeals: [], summary: string }}
 */
export async function fetchPersonalizedMeals() {
  const response = await api.get("/meals/personalized");
  return response.data;
}

/**
 * fetchCategories()
 * Returns all available meal categories.
 * @returns {string[]}
 */
export async function fetchCategories() {
  const response = await api.get("/meals/categories");
  return response.data;
}

/**
 * fetchCountries()
 * Returns all countries represented in the meal catalogue.
 * @returns {string[]}
 */
export async function fetchCountries() {
  const response = await api.get("/meals/countries");
  return response.data;
}

/**
 * createMeal(mealData)
 * Creates a new meal. Chef/Admin only.
 * @param {object} mealData
 * @returns {Meal}
 */
export async function createMeal(mealData) {
  const response = await api.post("/meals", mealData);
  return response.data;
}

/**
 * updateMeal(id, mealData)
 * Updates an existing meal. Chef (own) / Admin.
 */
export async function updateMeal(id, mealData) {
  const response = await api.put(`/meals/${id}`, mealData);
  return response.data;
}
