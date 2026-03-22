// prisma/seed.js

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  // Seed Tags
  const tags = await Promise.all([
    prisma.tag.upsert({ where: { name: "Diabetes-Friendly" }, update: {}, create: { name: "Diabetes-Friendly" } }),
    prisma.tag.upsert({ where: { name: "Low Sodium" }, update: {}, create: { name: "Low Sodium" } }),
    prisma.tag.upsert({ where: { name: "High Protein" }, update: {}, create: { name: "High Protein" } }),
    prisma.tag.upsert({ where: { name: "Pregnancy-Safe" }, update: {}, create: { name: "Pregnancy-Safe" } }),
    prisma.tag.upsert({ where: { name: "Low Carb" }, update: {}, create: { name: "Low Carb" } }),
    prisma.tag.upsert({ where: { name: "Gluten-Free" }, update: {}, create: { name: "Gluten-Free" } }),
    prisma.tag.upsert({ where: { name: "Vegan" }, update: {}, create: { name: "Vegan" } }),
  ]);

  const [diabeticTag, lowSodiumTag, highProteinTag, pregnancyTag, lowCarbTag] = tags;

  // Seed Admin User
  const hashedPassword = await bcrypt.hash("Admin@123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@dinewithmee.com" },
    update: {},
    create: {
      name: "Dine With Mee Admin",
      email: "admin@dinewithmee.com",
      password: hashedPassword,
      role: "ADMIN",
      country: "Nigeria",
    },
  });

  // Seed Chef
  const chefPassword = await bcrypt.hash("Chef@123", 12);
  const chefUser = await prisma.user.upsert({
    where: { email: "mama.put@dinewithmee.com" },
    update: {},
    create: {
      name: "Mama Put",
      email: "mama.put@dinewithmee.com",
      password: chefPassword,
      role: "CHEF",
      country: "Nigeria",
      chef: {
        create: {
          bio: "Expert in traditional West African cuisine with 20+ years experience",
          specialty: "West African Soups & Rice Dishes",
          country: "Nigeria",
          status: "APPROVED",
        },
      },
    },
    include: { chef: true },
  });

  const chef = chefUser.chef;

  // Seed Meals
  const meals = [
    {
      name: "Jollof Rice",
      description: "Classic West African one-pot tomato rice, slow-cooked with aromatic spices and peppers.",
      price: 5.5,
      category: "rice",
      country: "Nigeria",
      imageUrl: "https://images.unsplash.com/photo-jollof-rice",
      isApproved: true,
      nutrition: {
        calories: 350,
        protein: 8.5,
        carbs: 65.0,
        fat: 7.0,
        fiber: 3.5,
        sugar: 4.2,
        sodium: 480.0,
      },
      tagIds: [lowSodiumTag.id],
    },
    {
      name: "Egusi Soup",
      description: "Rich Nigerian melon seed soup with leafy greens, palm oil, and assorted proteins.",
      price: 7.0,
      category: "soups",
      country: "Nigeria",
      imageUrl: "https://images.unsplash.com/photo-egusi-soup",
      isApproved: true,
      nutrition: {
        calories: 420,
        protein: 22.0,
        carbs: 18.0,
        fat: 30.0,
        fiber: 6.0,
        sugar: 2.1,
        sodium: 390.0,
      },
      tagIds: [highProteinTag.id, diabeticTag.id],
    },
    {
      name: "Agatogo",
      description: "Traditional Rwandan meal of plantains and beans slow-cooked in a rich tomato sauce.",
      price: 4.5,
      category: "stews",
      country: "Rwanda",
      imageUrl: "https://images.unsplash.com/photo-agatogo",
      isApproved: true,
      nutrition: {
        calories: 310,
        protein: 12.0,
        carbs: 55.0,
        fat: 5.5,
        fiber: 9.0,
        sugar: 8.5,
        sodium: 250.0,
      },
      tagIds: [lowSodiumTag.id, pregnancyTag.id],
    },
    {
      name: "Ugali with Sukuma Wiki",
      description: "East African staple maize porridge served with stir-fried collard greens.",
      price: 3.5,
      category: "staples",
      country: "Kenya",
      imageUrl: "https://images.unsplash.com/photo-ugali",
      isApproved: true,
      nutrition: {
        calories: 280,
        protein: 7.0,
        carbs: 58.0,
        fat: 2.5,
        fiber: 5.5,
        sugar: 1.2,
        sodium: 180.0,
      },
      tagIds: [diabeticTag.id, lowSodiumTag.id, pregnancyTag.id],
    },
    {
      name: "Thieboudienne",
      description: "Senegalese national dish of fish and rice with tomato sauce and mixed vegetables.",
      price: 8.0,
      category: "rice",
      country: "Senegal",
      imageUrl: "https://images.unsplash.com/photo-thieboudienne",
      isApproved: true,
      nutrition: {
        calories: 480,
        protein: 32.0,
        carbs: 55.0,
        fat: 12.0,
        fiber: 4.0,
        sugar: 3.8,
        sodium: 620.0,
      },
      tagIds: [highProteinTag.id],
    },
    {
      name: "Matoke",
      description: "Ugandan steamed green banana stew, a beloved comfort food across East Africa.",
      price: 4.0,
      category: "stews",
      country: "Uganda",
      imageUrl: "https://images.unsplash.com/photo-matoke",
      isApproved: true,
      nutrition: {
        calories: 220,
        protein: 3.5,
        carbs: 52.0,
        fat: 1.0,
        fiber: 4.5,
        sugar: 6.0,
        sodium: 120.0,
      },
      tagIds: [lowSodiumTag.id, pregnancyTag.id, lowCarbTag.id],
    },
    {
      name: "Grilled Tilapia with Pepper Sauce",
      description: "Freshly grilled Nile tilapia with a spiced tomato and pepper dipping sauce.",
      price: 9.5,
      category: "grills",
      country: "Ghana",
      imageUrl: "https://images.unsplash.com/photo-tilapia",
      isApproved: true,
      nutrition: {
        calories: 290,
        protein: 38.0,
        carbs: 8.0,
        fat: 11.0,
        fiber: 1.5,
        sugar: 3.0,
        sodium: 310.0,
      },
      tagIds: [highProteinTag.id, diabeticTag.id, lowCarbTag.id],
    },
  ];

  for (const mealData of meals) {
    const { nutrition, tagIds, ...mealFields } = mealData;
    const meal = await prisma.meal.create({
      data: {
        ...mealFields,
        chefId: chef.id,
        nutrition: { create: nutrition },
        mealTags: {
          create: tagIds.map((tagId) => ({ tagId })),
        },
      },
    });
    console.log(`✅ Created meal: ${meal.name}`);
  }

  console.log("🌍 Seed complete — Dine With Mee is ready!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
