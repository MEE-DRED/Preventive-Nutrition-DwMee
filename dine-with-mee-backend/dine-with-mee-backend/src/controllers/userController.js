// src/controllers/userController.js

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        country: true,
        createdAt: true,
        healthProfile: true,
        chef: { select: { id: true, bio: true, specialty: true, country: true, status: true } },
      },
    });
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, phone, country } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(country !== undefined && { country }),
      },
      select: { id: true, name: true, email: true, role: true, phone: true, country: true },
    });

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Current and new passwords are required" });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const isValid = await bcrypt.compare(currentPassword, user.password);

    if (!isValid) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });

    return res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const upsertHealthProfile = async (req, res) => {
  try {
    const { condition, allergies, maxCalories, maxSodium, maxSugar, isPregnant, trimester } = req.body;

    const validConditions = ["DIABETES", "HYPERTENSION", "PREGNANCY", "NONE"];
    const healthCondition = validConditions.includes(condition?.toUpperCase()) ? condition.toUpperCase() : "NONE";

    const healthProfile = await prisma.healthProfile.upsert({
      where: { userId: req.user.id },
      create: {
        userId: req.user.id,
        condition: healthCondition,
        allergies: allergies || [],
        maxCalories: maxCalories ? parseInt(maxCalories) : null,
        maxSodium: maxSodium ? parseInt(maxSodium) : null,
        maxSugar: maxSugar ? parseInt(maxSugar) : null,
        isPregnant: isPregnant || false,
        trimester: trimester ? parseInt(trimester) : null,
      },
      update: {
        condition: healthCondition,
        allergies: allergies || [],
        maxCalories: maxCalories ? parseInt(maxCalories) : null,
        maxSodium: maxSodium ? parseInt(maxSodium) : null,
        maxSugar: maxSugar ? parseInt(maxSugar) : null,
        isPregnant: isPregnant || false,
        trimester: trimester ? parseInt(trimester) : null,
      },
    });

    return res.status(200).json({ success: true, data: healthProfile });
  } catch (error) {
    console.error("Health profile error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getHealthProfile = async (req, res) => {
  try {
    const profile = await prisma.healthProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return res.status(404).json({ success: false, message: "Health profile not found" });
    return res.status(200).json({ success: true, data: profile });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const updateChefProfile = async (req, res) => {
  try {
    const { bio, specialty, country } = req.body;

    const chef = await prisma.chef.update({
      where: { userId: req.user.id },
      data: {
        ...(bio !== undefined && { bio }),
        ...(specialty !== undefined && { specialty }),
        ...(country !== undefined && { country }),
      },
    });

    return res.status(200).json({ success: true, data: chef });
  } catch (error) {
    console.error("Update chef error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Admin: get all users
const getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const where = {};
    if (role) where.role = role.toUpperCase();

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, name: true, email: true, role: true, country: true, createdAt: true },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: users,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Admin: approve/reject chef
const updateChefStatus = async (req, res) => {
  try {
    const { chefId } = req.params;
    const { status } = req.body;

    const validStatuses = ["APPROVED", "REJECTED", "PENDING"];
    if (!validStatuses.includes(status?.toUpperCase())) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const chef = await prisma.chef.update({
      where: { id: chefId },
      data: { status: status.toUpperCase() },
      include: { user: { select: { name: true, email: true } } },
    });

    return res.status(200).json({ success: true, data: chef });
  } catch (error) {
    console.error("Update chef status error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  upsertHealthProfile,
  getHealthProfile,
  updateChefProfile,
  getAllUsers,
  updateChefStatus,
};
