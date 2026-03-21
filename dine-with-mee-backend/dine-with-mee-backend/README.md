# 🌍 Dine With Mee — Backend API

> Uber Eats + MyFitnessPal + Teladoc for Africa  
> A nutrition-driven African food marketplace for NCDs, maternal health & smart meal recommendations.

---

## 📁 Project Structure

```
dine-with-mee-backend/
├── prisma/
│   ├── schema.prisma        # All DB models & relations
│   └── seed.js              # Sample African meals + users
│
├── src/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── mealController.js
│   │   ├── orderController.js
│   │   └── userController.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── mealRoutes.js
│   │   ├── orderRoutes.js
│   │   └── userRoutes.js
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js    # JWT verification
│   │   └── roleMiddleware.js    # Role-based access
│   │
│   ├── services/
│   │   └── recommendationService.js  # Health filter engine
│   │
│   ├── utils/
│   │   └── jwt.js
│   │
│   └── app.js
│
├── server.js
├── package.json
└── .env.example
```

---

## ⚡ Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment
```bash
cp .env.example .env
# Edit .env with your PostgreSQL credentials
```

### 3. Set up the database
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (for development)
npm run db:push

# OR run migrations (for production)
npm run db:migrate
```

### 4. Seed sample data
```bash
npm run db:seed
```
This seeds:
- ✅ Admin user (`admin@dinewithmee.com` / `Admin@123`)
- ✅ Chef user (`mama.put@dinewithmee.com` / `Chef@123`)
- ✅ 7 African meals (Jollof Rice, Egusi Soup, Agatogo, Ugali, Thieboudienne, Matoke, Grilled Tilapia)
- ✅ Health tags (Diabetes-Friendly, Low Sodium, Pregnancy-Safe, etc.)

### 5. Start the server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server runs at: `http://localhost:5000`

---

## 🔗 API Endpoints

### Auth — `/api/auth`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/register` | Public | Register a new user |
| POST | `/login` | Public | Login & get JWT |
| GET | `/me` | Auth | Get current user |

### Meals — `/api/meals`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Public | List all meals (filterable) |
| GET | `/:id` | Public | Get single meal |
| GET | `/personalized` | Auth | Health-filtered meals |
| GET | `/categories` | Public | All meal categories |
| GET | `/countries` | Public | All meal countries |
| POST | `/` | Chef/Admin | Create a meal |
| PUT | `/:id` | Chef/Admin | Update a meal |
| DELETE | `/:id` | Admin | Delete a meal |

**Query params for `GET /api/meals`:**
- `category` — e.g. `rice`, `soups`, `stews`
- `country` — e.g. `Nigeria`, `Rwanda`, `Kenya`
- `tag` — e.g. `Diabetes-Friendly`
- `minCalories` / `maxCalories`
- `search` — name search
- `page` / `limit`

### Orders — `/api/orders`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/` | Auth | Place an order |
| GET | `/user` | Auth | My orders |
| GET | `/` | Admin/Chef | All orders |
| GET | `/:id` | Auth | Order details |
| PATCH | `/:id/status` | Auth | Update status |

### Users — `/api/users`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/profile` | Auth | Get my profile |
| PUT | `/profile` | Auth | Update profile |
| PUT | `/password` | Auth | Change password |
| GET | `/health-profile` | Auth | Get health profile |
| PUT | `/health-profile` | Auth | Set health profile |
| PUT | `/chef-profile` | Chef | Update chef bio/specialty |
| GET | `/` | Admin | List all users |
| PATCH | `/chefs/:chefId/status` | Admin | Approve/reject chef |

---

## 🧠 Health Filter Engine

`GET /api/meals/personalized` returns meals filtered by the user's health condition:

| Condition | Filter Applied |
|-----------|---------------|
| `DIABETES` | Removes meals with sugar > 10g or carbs > 50g |
| `HYPERTENSION` | Removes meals with sodium > 400mg |
| `PREGNANCY` | Prioritizes high-protein, high-fiber, pregnancy-safe meals |
| `NONE` | All meals, sorted by nutritional quality score |

Response includes:
- `safeMeals[]` — filtered & ranked meals
- `filteredOutMeals[]` — removed meals with reason
- `summary` — human-readable explanation

---

## 🔐 Roles

| Role | Permissions |
|------|------------|
| `CUSTOMER` | Browse meals, place orders, manage health profile |
| `CHEF` | All customer rights + create/update own meals |
| `ADMIN` | All rights + approve chefs, delete meals, view all orders |

---

## 🗄️ Database Models

- **User** — core auth entity with roles
- **HealthProfile** — condition, allergies, thresholds
- **Chef** — linked to User, approval workflow
- **Meal** — with nutrition + tags
- **Nutrition** — calories, protein, carbs, fat, fiber, sugar, sodium
- **Tag** — health labels (many-to-many with Meal)
- **Order** — with calculated total price
- **OrderItem** — individual line items per order

---

## 🌍 Sample African Meals Included

| Meal | Country | Special Tags |
|------|---------|-------------|
| Jollof Rice | Nigeria | Low Sodium |
| Egusi Soup | Nigeria | High Protein, Diabetes-Friendly |
| Agatogo | Rwanda | Low Sodium, Pregnancy-Safe |
| Ugali + Sukuma Wiki | Kenya | Diabetes-Friendly, Low Sodium, Pregnancy-Safe |
| Thieboudienne | Senegal | High Protein |
| Matoke | Uganda | Low Sodium, Pregnancy-Safe, Low Carb |
| Grilled Tilapia | Ghana | High Protein, Diabetes-Friendly, Low Carb |

---

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Auth**: JWT + bcryptjs
- **Security**: Helmet, CORS

---

## 📦 Useful Commands

```bash
npm run db:studio     # Open Prisma Studio (visual DB browser)
npm run db:reset      # Reset DB + re-run migrations
npm run db:seed       # Re-seed sample data
```
