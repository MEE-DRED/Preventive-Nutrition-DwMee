// src/routes/mealRoutes.js

const express = require("express");
const router = express.Router();
const {
  getAllMeals,
  getMealById,
  createMeal,
  updateMeal,
  deleteMeal,
  getPersonalized,
  getCategories,
  getCountries,
} = require("../controllers/mealController");
const { authenticate } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

// GET /api/meals - public
router.get("/", getAllMeals);

// GET /api/meals/personalized - auth required
router.get("/personalized", authenticate, getPersonalized);

// GET /api/meals/categories - public
router.get("/categories", getCategories);

// GET /api/meals/countries - public
router.get("/countries", getCountries);

// GET /api/meals/:id - public
router.get("/:id", getMealById);

// POST /api/meals - chef or admin only
router.post("/", authenticate, authorize("CHEF", "ADMIN"), createMeal);

// PUT /api/meals/:id - chef or admin
router.put("/:id", authenticate, authorize("CHEF", "ADMIN"), updateMeal);

// DELETE /api/meals/:id - admin only
router.delete("/:id", authenticate, authorize("ADMIN"), deleteMeal);

module.exports = router;
