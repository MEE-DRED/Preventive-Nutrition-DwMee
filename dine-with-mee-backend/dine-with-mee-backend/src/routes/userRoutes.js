// src/routes/userRoutes.js

const express = require("express");
const router = express.Router();
const {
  getProfile,
  updateProfile,
  changePassword,
  upsertHealthProfile,
  getHealthProfile,
  updateChefProfile,
  getAllUsers,
  updateChefStatus,
} = require("../controllers/userController");
const { authenticate } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

// All routes require authentication
router.use(authenticate);

// GET /api/users/profile
router.get("/profile", getProfile);

// PUT /api/users/profile
router.put("/profile", updateProfile);

// PUT /api/users/password
router.put("/password", changePassword);

// GET /api/users/health-profile
router.get("/health-profile", getHealthProfile);

// PUT /api/users/health-profile
router.put("/health-profile", upsertHealthProfile);

// PUT /api/users/chef-profile - chef only
router.put("/chef-profile", authorize("CHEF"), updateChefProfile);

// Admin routes
// GET /api/users - admin only
router.get("/", authorize("ADMIN"), getAllUsers);

// PATCH /api/users/chefs/:chefId/status - admin only
router.patch("/chefs/:chefId/status", authorize("ADMIN"), updateChefStatus);

module.exports = router;
