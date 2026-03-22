// src/routes/orderRoutes.js

const express = require("express");
const router = express.Router();
const {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  getAllOrders,
} = require("../controllers/orderController");
const { authenticate } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

// All order routes require authentication
router.use(authenticate);

// POST /api/orders - any authenticated user
router.post("/", createOrder);

// GET /api/orders/user - customer's own orders
router.get("/user", getUserOrders);

// GET /api/orders - admin/chef only
router.get("/", authorize("ADMIN", "CHEF"), getAllOrders);

// GET /api/orders/:id
router.get("/:id", getOrderById);

// PATCH /api/orders/:id/status
router.patch("/:id/status", updateOrderStatus);

module.exports = router;
