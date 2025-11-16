import express from "express";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

import { registerRoutes } from "./routes.js"; // IMPORTANT: import only the function

dotenv.config();

const app = express();

// ---------------------------
// CORS CONFIG
// ---------------------------
const allowedOrigins = [
  "https://sales-and-inventory-zeta.vercel.app",
  "http://localhost:5173"
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Preflight
app.options("*", cors());

// ---------------------------
// Middleware
// ---------------------------
app.use(express.json());
app.use(cookieParser());

// ---------------------------
// Register Routes **correct way**
// ---------------------------
registerRoutes(app); // <-- FIXED

// ---------------------------
// MongoDB + Server
// ---------------------------
const PORT = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGO_URI!)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error("MongoDB Error:", err));
