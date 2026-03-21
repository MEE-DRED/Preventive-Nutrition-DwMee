// middleware/mockData.js
// ─────────────────────────────────────────────────────────────
// Mock data middleware for frontend integration testing
// Enables testing without PostgreSQL database setup
// ─────────────────────────────────────────────────────────────

const mockUsers = {
  "test@example.com": {
    id: "user-1",
    email: "test@example.com",
    fullName: "Test User",
    role: "CUSTOMER",
    healthProfile: {
      condition: "NONE",
      maxCalories: 2500,
      allergies: [],
    },
  },
};

const mockMeals = [
  {
    id: "meal-1",
    name: "Grilled Chicken with Vegetables",
    description: "Healthy grilled chicken breast with seasonal vegetables",
    price: 12.99,
    category: "HEALTHY",
    region: "West Africa",
    cuisine: "Nigerian",
    dietaryRestrictions: ["GLUTEN_FREE"],
    healthConditions: ["DIABETES"],
    nutrition: {
      calories: 450,
      protein: 35.5,
      carbs: 28.0,
      fat: 12.5,
      fiber: 4.2,
      sugar: 2.1,
      sodium: 380.0,
    },
    imageUrl: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6",
    chef: { name: "Chef Adeyemi", region: "Lagos" },
  },
  {
    id: "meal-2",
    name: "Jollof Rice with Fish",
    description: "Traditional West African jollof rice with grilled fish",
    price: 14.99,
    category: "TRADITIONAL",
    region: "West Africa",
    cuisine: "Ghanaian",
    dietaryRestrictions: [],
    healthConditions: [],
    nutrition: {
      calories: 650,
      protein: 28.0,
      carbs: 72.5,
      fat: 18.0,
      fiber: 2.8,
      sugar: 1.5,
      sodium: 520.0,
    },
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
    chef: { name: "Chef Comfort", region: "Accra" },
  },
  {
    id: "meal-3",
    name: "Kale & Quinoa Bowl",
    description: "Superfood bowl with kale, quinoa, and fresh vegetables",
    price: 11.99,
    category: "HEALTHY",
    region: "West Africa",
    cuisine: "Contemporary",
    dietaryRestrictions: ["VEGAN"],
    healthConditions: ["HYPERTENSION"],
    nutrition: {
      calories: 380,
      protein: 14.5,
      carbs: 48.0,
      fat: 15.8,
      fiber: 6.2,
      sugar: 1.2,
      sodium: 220.0,
    },
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
    chef: { name: "Chef Zainab", region: "Dakar" },
  },
];

module.exports = {
  mockUsers,
  mockMeals,
};
