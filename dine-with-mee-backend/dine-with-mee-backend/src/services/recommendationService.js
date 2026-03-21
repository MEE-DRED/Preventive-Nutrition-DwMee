// src/services/recommendationService.js

/**
 * Health Filter Engine for Dine With Mee
 * Filters and ranks meals based on user health profile
 */

const THRESHOLDS = {
  DIABETES: {
    maxSugar: 10,    // grams
    maxCarbs: 50,    // grams
  },
  HYPERTENSION: {
    maxSodium: 400,  // mg
  },
  PREGNANCY: {
    // Foods to generally avoid for pregnant users
    avoidCategories: [],
    minProtein: 15,  // grams - encourage high protein
  },
};

/**
 * Score a meal for recommendation quality
 * Higher score = more recommended
 */
const scoreMeal = (meal, healthProfile) => {
  const { nutrition } = meal;
  if (!nutrition) return 0;

  let score = 100;

  // Bonus for high protein
  if (parseFloat(nutrition.protein) >= 20) score += 15;

  // Bonus for high fiber
  if (parseFloat(nutrition.fiber) >= 5) score += 10;

  // Penalty for high fat
  if (parseFloat(nutrition.fat) > 25) score -= 10;

  // Bonus for low sodium
  if (parseFloat(nutrition.sodium) < 300) score += 10;

  // Bonus for low sugar
  if (parseFloat(nutrition.sugar) < 5) score += 10;

  // Health-specific scoring
  if (healthProfile) {
    if (healthProfile.condition === "DIABETES") {
      // Extra reward for diabetes-friendly meals
      if (parseFloat(nutrition.sugar) < 5) score += 20;
      if (parseFloat(nutrition.carbs) < 30) score += 15;
    }

    if (healthProfile.condition === "HYPERTENSION") {
      if (parseFloat(nutrition.sodium) < 200) score += 25;
    }

    if (healthProfile.condition === "PREGNANCY" || healthProfile.isPregnant) {
      if (parseFloat(nutrition.protein) >= 20) score += 20;
      if (parseFloat(nutrition.fiber) >= 5) score += 10;
    }

    // Match tags in health profile
    const mealTagNames = meal.mealTags?.map((mt) => mt.tag.name.toLowerCase()) || [];
    if (healthProfile.condition === "DIABETES" && mealTagNames.includes("diabetes-friendly")) score += 30;
    if (healthProfile.condition === "HYPERTENSION" && mealTagNames.includes("low sodium")) score += 30;
    if (healthProfile.isPregnant && mealTagNames.includes("pregnancy-safe")) score += 30;
  }

  return score;
};

/**
 * Check if a meal is SAFE for a health condition
 * Returns { safe: boolean, reason: string }
 */
const isMealSafe = (meal, healthProfile) => {
  if (!healthProfile || healthProfile.condition === "NONE") {
    return { safe: true, reason: null };
  }

  const { nutrition } = meal;
  if (!nutrition) return { safe: true, reason: null };

  const condition = healthProfile.condition;

  if (condition === "DIABETES") {
    const sugar = parseFloat(nutrition.sugar);
    const carbs = parseFloat(nutrition.carbs);

    if (sugar > (healthProfile.maxSugar || THRESHOLDS.DIABETES.maxSugar)) {
      return { safe: false, reason: `Too high in sugar (${sugar}g) for diabetes management` };
    }
    if (carbs > (healthProfile.maxCarbs || THRESHOLDS.DIABETES.maxCarbs)) {
      return { safe: false, reason: `Too high in carbs (${carbs}g) for diabetes management` };
    }
  }

  if (condition === "HYPERTENSION") {
    const sodium = parseFloat(nutrition.sodium);
    if (sodium > (healthProfile.maxSodium || THRESHOLDS.HYPERTENSION.maxSodium)) {
      return { safe: false, reason: `Too high in sodium (${sodium}mg) for hypertension` };
    }
  }

  // Custom calorie limit
  if (healthProfile.maxCalories && nutrition.calories > healthProfile.maxCalories) {
    return { safe: false, reason: `Exceeds your calorie limit (${nutrition.calories} kcal)` };
  }

  return { safe: true, reason: null };
};

/**
 * Main function: filters + ranks meals based on health profile
 */
const getPersonalizedMeals = (meals, healthProfile) => {
  if (!healthProfile || healthProfile.condition === "NONE") {
    // No condition — return all meals sorted by score
    const scored = meals.map((meal) => ({
      ...meal,
      recommendationScore: scoreMeal(meal, null),
      safetyStatus: { safe: true, reason: null },
    }));
    scored.sort((a, b) => b.recommendationScore - a.recommendationScore);
    return {
      hasHealthProfile: false,
      condition: "NONE",
      safeMeals: scored,
      filteredOutMeals: [],
      summary: "Showing all available meals sorted by nutritional quality",
    };
  }

  const safeMeals = [];
  const filteredOutMeals = [];

  for (const meal of meals) {
    const safetyStatus = isMealSafe(meal, healthProfile);
    const recommendationScore = scoreMeal(meal, healthProfile);

    const mealWithMeta = { ...meal, recommendationScore, safetyStatus };

    if (safetyStatus.safe) {
      safeMeals.push(mealWithMeta);
    } else {
      filteredOutMeals.push(mealWithMeta);
    }
  }

  // Sort safe meals by recommendation score
  safeMeals.sort((a, b) => b.recommendationScore - a.recommendationScore);

  const conditionLabels = {
    DIABETES: "diabetes management",
    HYPERTENSION: "hypertension (blood pressure) management",
    PREGNANCY: "maternal health & pregnancy",
  };

  return {
    hasHealthProfile: true,
    condition: healthProfile.condition,
    isPregnant: healthProfile.isPregnant,
    trimester: healthProfile.trimester,
    safeMeals,
    filteredOutMeals: filteredOutMeals.map((m) => ({
      id: m.id,
      name: m.name,
      reason: m.safetyStatus.reason,
    })),
    summary: `Personalized for ${conditionLabels[healthProfile.condition] || "your health"}. ${safeMeals.length} safe meals found, ${filteredOutMeals.length} meals filtered out.`,
  };
};

module.exports = { getPersonalizedMeals, isMealSafe, scoreMeal };
