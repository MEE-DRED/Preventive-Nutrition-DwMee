// src/api/user.js
// ─────────────────────────────────────────────────────────────
// User & Health Profile API calls
// ─────────────────────────────────────────────────────────────

import api from "./apiClient.js";

/**
 * fetchProfile()
 * Returns the logged-in user's full profile.
 */
export async function fetchProfile() {
  const response = await api.get("/users/profile");
  return response.data;
}

/**
 * updateProfile(data)
 * Updates name, phone, country.
 */
export async function updateProfile(data) {
  const response = await api.put("/users/profile", data);
  return response.data;
}

/**
 * fetchHealthProfile()
 * Returns the user's health profile.
 */
export async function fetchHealthProfile() {
  const response = await api.get("/users/health-profile");
  return response.data;
}

/**
 * saveHealthProfile(data)
 * Creates or updates the user's health profile.
 * @param {{
 *   condition: 'DIABETES'|'HYPERTENSION'|'PREGNANCY'|'NONE',
 *   allergies?: string[],
 *   maxCalories?: number,
 *   isPregnant?: boolean,
 *   trimester?: number
 * }} data
 */
export async function saveHealthProfile(data) {
  const response = await api.put("/users/health-profile", data);
  return response.data;
}

/**
 * changePassword(data)
 */
export async function changePassword(data) {
  const response = await api.put("/users/password", data);
  return response.data;
}
