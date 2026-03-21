// src/controllers/mealController.js

const { PrismaClient } = require("@prisma/client");
const { getPersonalizedMeals } = require("../services/recommendationService");

const prisma = new PrismaClient();

const mealInclude = {
  nutrition: true,
  mealTags: { include: { tag: true } },
  chef: { include: { user: { select: { name: true, country: true } } } },
};

const getAllMeals = async (req, res) => {
  try {
    const { category, country, tag, minCalories, maxCalories, search, page = 1, limit = 20 } = req.query;

    const where = { isAvailable: true, isApproved: true };

    if (category) where.category = { equals: category, mode: "insensitive" };
    if (country) where.country = { equals: country, mode: "insensitive" };
    if (search) where.name = { contains: search, mode: "insensitive" };

    if (tag) {
      where.mealTags = { some: { tag: { name: { contains: tag, mode: "insensitive" } } } };
    }

    if (minCalories || maxCalories) {
      where.nutrition = {
        calories: {
          ...(minCalories && { gte: parseInt(minCalories) }),
          ...(maxCalories && { lte: parseInt(maxCalories) }),
        },
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [meals, total] = await Promise.all([
      prisma.meal.findMany({ where, include: mealInclude, skip, take: parseInt(limit), orderBy: { createdAt: "desc" } }),
      prisma.meal.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: meals,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    console.error("Get meals error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getMealById = async (req, res) => {
  try {
    const meal = await prisma.meal.findUnique({
      where: { id: req.params.id },
      include: mealInclude,
    });

    if (!meal) return res.status(404).json({ success: false, message: "Meal not found" });
    return res.status(200).json({ success: true, data: meal });
  } catch (error) {
    console.error("Get meal error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const createMeal = async (req, res) => {
  try {
    const { name, description, price, imageUrl, category, country, nutrition, tagIds } = req.body;

    if (!name || !price || !category || !country) {
      return res.status(400).json({ success: false, message: "Name, price, category, and country are required" });
    }

    let chefId = null;
    if (req.user.role === "CHEF") {
      const chef = await prisma.chef.findUnique({ where: { userId: req.user.id } });
      if (!chef || chef.status !== "APPROVED") {
        return res.status(403).json({ success: false, message: "Chef profile not approved" });
      }
      chefId = chef.id;
    }

    const meal = await prisma.meal.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        imageUrl,
        category,
        country,
        chefId,
        isApproved: req.user.role === "ADMIN",
        nutrition: nutrition ? { create: nutrition } : undefined,
        mealTags: tagIds?.length ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined,
      },
      include: mealInclude,
    });

    return res.status(201).json({ success: true, message: "Meal created", data: meal });
  } catch (error) {
    console.error("Create meal error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const updateMeal = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, imageUrl, category, country, isAvailable, isApproved, nutrition, tagIds } = req.body;

    const meal = await prisma.meal.findUnique({ where: { id } });
    if (!meal) return res.status(404).json({ success: false, message: "Meal not found" });

    // Chefs can only update their own meals
    if (req.user.role === "CHEF") {
      const chef = await prisma.chef.findUnique({ where: { userId: req.user.id } });
      if (meal.chefId !== chef?.id) {
        return res.status(403).json({ success: false, message: "Not authorized to update this meal" });
      }
    }

    const updated = await prisma.meal.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price && { price: parseFloat(price) }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(category && { category }),
        ...(country && { country }),
        ...(isAvailable !== undefined && { isAvailable }),
        ...(req.user.role === "ADMIN" && isApproved !== undefined && { isApproved }),
        ...(nutrition && {
          nutrition: {
            upsert: { create: nutrition, update: nutrition },
          },
        }),
        ...(tagIds && {
          mealTags: {
            deleteMany: {},
            create: tagIds.map((tagId) => ({ tagId })),
          },
        }),
      },
      include: mealInclude,
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Update meal error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const deleteMeal = async (req, res) => {
  try {
    await prisma.meal.delete({ where: { id: req.params.id } });
    return res.status(200).json({ success: true, message: "Meal deleted" });
  } catch (error) {
    console.error("Delete meal error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getPersonalized = async (req, res) => {
  try {
    const healthProfile = await prisma.healthProfile.findUnique({ where: { userId: req.user.id } });

    const meals = await prisma.meal.findMany({
      where: { isAvailable: true, isApproved: true },
      include: mealInclude,
    });

    const result = getPersonalizedMeals(meals, healthProfile);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Personalized meals error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await prisma.meal.findMany({
      where: { isApproved: true, isAvailable: true },
      select: { category: true },
      distinct: ["category"],
    });
    return res.status(200).json({ success: true, data: categories.map((c) => c.category) });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getCountries = async (req, res) => {
  try {
    const countries = await prisma.meal.findMany({
      where: { isApproved: true, isAvailable: true },
      select: { country: true },
      distinct: ["country"],
    });
    return res.status(200).json({ success: true, data: countries.map((c) => c.country) });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = { getAllMeals, getMealById, createMeal, updateMeal, deleteMeal, getPersonalized, getCategories, getCountries };
