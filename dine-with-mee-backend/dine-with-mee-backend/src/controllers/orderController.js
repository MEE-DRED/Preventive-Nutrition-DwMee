// src/controllers/orderController.js

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const createOrder = async (req, res) => {
  try {
    const { items, notes, address } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Order must contain at least one item" });
    }

    // Validate all meals exist and are available
    const mealIds = items.map((i) => i.mealId);
    const meals = await prisma.meal.findMany({
      where: { id: { in: mealIds }, isAvailable: true, isApproved: true },
    });

    if (meals.length !== mealIds.length) {
      return res.status(400).json({ success: false, message: "One or more meals are unavailable" });
    }

    // Build a lookup for prices
    const mealPriceMap = {};
    meals.forEach((m) => (mealPriceMap[m.id] = parseFloat(m.price)));

    // Calculate total price
    let totalPrice = 0;
    const orderItems = items.map(({ mealId, quantity }) => {
      const qty = parseInt(quantity) || 1;
      const unitPrice = mealPriceMap[mealId];
      totalPrice += unitPrice * qty;
      return { mealId, quantity: qty, unitPrice };
    });

    const order = await prisma.order.create({
      data: {
        userId: req.user.id,
        totalPrice,
        notes: notes || null,
        address: address || null,
        items: { create: orderItems },
      },
      include: {
        items: {
          include: {
            meal: { select: { name: true, imageUrl: true, category: true } },
          },
        },
      },
    });

    return res.status(201).json({ success: true, message: "Order placed successfully", data: order });
  } catch (error) {
    console.error("Create order error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getUserOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const where = { userId: req.user.id };
    if (status) where.status = status.toUpperCase();

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: { include: { meal: { select: { name: true, imageUrl: true } } } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.order.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: orders,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    console.error("Get user orders error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        items: {
          include: {
            meal: { select: { name: true, imageUrl: true, category: true, country: true } },
          },
        },
        user: { select: { name: true, email: true, phone: true } },
      },
    });

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // Customers can only view their own orders
    if (req.user.role === "CUSTOMER" && order.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error("Get order error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["PENDING", "CONFIRMED", "PREPARING", "DELIVERED", "CANCELLED"];

    if (!validStatuses.includes(status?.toUpperCase())) {
      return res.status(400).json({ success: false, message: `Invalid status. Valid: ${validStatuses.join(", ")}` });
    }

    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // Customers can only cancel their own pending orders
    if (req.user.role === "CUSTOMER") {
      if (order.userId !== req.user.id) {
        return res.status(403).json({ success: false, message: "Not authorized" });
      }
      if (status.toUpperCase() !== "CANCELLED") {
        return res.status(403).json({ success: false, message: "Customers can only cancel orders" });
      }
    }

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: status.toUpperCase() },
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Update order status error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status.toUpperCase();

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { name: true, email: true } },
          items: { include: { meal: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.order.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: orders,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    console.error("Get all orders error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = { createOrder, getUserOrders, getOrderById, updateOrderStatus, getAllOrders };
