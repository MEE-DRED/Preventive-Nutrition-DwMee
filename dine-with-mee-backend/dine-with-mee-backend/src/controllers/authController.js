// src/controllers/authController.js

const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { generateToken } = require("../utils/jwt");

const prisma = new PrismaClient();

const register = async (req, res) => {
  try {
    const { name, email, password, role, phone, country } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email, and password are required" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const validRoles = ["CUSTOMER", "CHEF", "ADMIN"];
    const userRole = validRoles.includes(role?.toUpperCase()) ? role.toUpperCase() : "CUSTOMER";

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: userRole,
        phone: phone || null,
        country: country || null,
      },
      select: { id: true, name: true, email: true, role: true, country: true, createdAt: true },
    });

    // If registering as chef, create a chef profile
    if (userRole === "CHEF") {
      await prisma.chef.create({
        data: {
          userId: user.id,
          status: "PENDING",
        },
      });
    }

    const token = generateToken({ id: user.id, role: user.role });

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      data: { user, token },
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken({ id: user.id, role: user.role });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: { id: user.id, name: user.name, email: user.email, role: user.role, country: user.country },
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const me = async (req, res) => {
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
        chef: { select: { id: true, status: true, specialty: true, country: true } },
      },
    });
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error("Me error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = { register, login, me };
