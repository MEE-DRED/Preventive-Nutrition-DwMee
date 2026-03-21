// server.js

require("dotenv").config();
const app = require("./src/app");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║     🌍 Dine With Mee Backend          ║
  ║     Server running on port ${PORT}      ║
  ║     Environment: ${(process.env.NODE_ENV || "development").padEnd(12)}║
  ╚═══════════════════════════════════════╝
  `);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
  process.exit(1);
});
