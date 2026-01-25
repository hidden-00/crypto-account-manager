// Load environment variables from .env
import "dotenv/config";

import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import { restoreUserFromCookie } from "./middleware/auth";
import authRoutes from "./routes/authRoutes";
import pageRoutes from "./routes/pageRoutes";
import apiRoutes from "./routes/apiRoutes";
import crudRoutes from "./routes/crudRoutes";
import helloRouter from "./routes/hello";
import { connectMongoDB } from "./db/mongodb";
import { seedDatabase } from "./db/seed";

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

// Setup EJS view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));
app.use(express.static(path.join(__dirname, "../public")));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Restore user từ cookie - run trước all routes
app.use(restoreUserFromCookie);

// Routes
app.use(authRoutes); // /login, /logout
app.use(pageRoutes); // /, /dashboard
app.use(apiRoutes); // /api/*
app.use(crudRoutes); // /api/accounts/*, /api/daily-stats/*
app.use("/", helloRouter); // /hello route

// Start server with MongoDB connection
async function startServer() {
  try {
    // Connect to MongoDB before starting server
    await connectMongoDB();
    
    // Seed initial data if needed
    await seedDatabase();
  } catch (error) {
    console.error("Failed to connect to MongoDB. Running with mock data...");
  }

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log(`\n📝 Test accounts:`);
    console.log(`  john@example.com / password123`);
    console.log(`  jane@example.com / password456`);
    console.log(`  bob@example.com  / password789`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
