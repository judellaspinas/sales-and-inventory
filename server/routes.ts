import type { Express } from "express";
import bcrypt from "bcrypt";
import { ZodError } from "zod";
import { storage } from "./storage.js"; // keep .js for ESM
import { loginSchema, registerSchema } from "../shared/schema.js";

// Register routes for an Express app
export function registerRoutes(app: Express) {
  /* -------------------- AUTHENTICATION -------------------- */

  // LOGIN
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(username);
      if (!user) return res.status(401).json({ message: "Invalid credentials" });

      if (user.cooldownUntil && user.cooldownUntil > new Date()) {
        const remaining = Math.ceil((user.cooldownUntil.getTime() - Date.now()) / 1000);
        return res.status(429).json({
          message: "Account temporarily locked. Try again later.",
          remainingSeconds: remaining,
        });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        await storage.incrementLoginAttempts(username);

        if ((user.loginAttempts || 0) >= 2) {
          const cooldownUntil = new Date(Date.now() + 5 * 60 * 1000);
          await storage.setCooldown(username, cooldownUntil);
          return res.status(429).json({
            message: "Too many failed attempts. Account locked for 5 minutes.",
            cooldownUntil,
          });
        }

        return res.status(401).json({ message: "Invalid credentials" });
      }

      await storage.resetLoginAttempts(username);
      const session = await storage.createSession(user.id);

      res.cookie("sessionId", session.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,
      });

      const { password: _, ...safeUser } = user;
      res.json({ user: safeUser, session });
    } catch (err) {
      console.error("Login error:", err);
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // REGISTER
  app.post("/api/register", async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);
      const { confirmPassword, ...cleanData } = userData;
      const user = await storage.registerUser(cleanData);
      const { password: _, ...safeUser } = user;
      res.status(201).json({ user: safeUser });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      if (error.message === "Username already exists") {
        return res.status(409).json({ message: error.message });
      }
      console.error("Register error:", error);
      res.status(400).json({ message: "Invalid request" });
    }
  });

  // LOGOUT
  app.post("/api/logout", async (req, res) => {
    const sessionId = req.cookies.sessionId;
    if (sessionId) await storage.deleteSession(sessionId);
    res.clearCookie("sessionId");
    res.json({ message: "Logged out successfully" });
  });

  /* -------------------- PRODUCT ROUTES -------------------- */

  app.get("/api/products", async (_req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (err) {
      console.error("Fetch products error:", err);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product =
        (await storage.getProductByManualId(req.params.id)) ||
        (await storage.getProduct(req.params.id));
      if (!product) return res.status(404).json({ message: "Product not found" });
      res.json(product);
    } catch (err) {
      console.error("Fetch product error:", err);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      if (!req.body.id) return res.status(400).json({ message: "Product ID required" });
      const existing = await storage.getProductByManualId?.(req.body.id);
      if (existing) return res.status(409).json({ message: "Product ID already exists" });
      const product = await storage.createProduct(req.body);
      res.status(201).json(product);
    } catch (err) {
      console.error("Add product error:", err);
      res.status(500).json({ message: "Failed to add product" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const updated = await storage.updateProduct(req.params.id, req.body);
      if (!updated) return res.status(404).json({ message: "Product not found" });
      res.json(updated);
    } catch (err) {
      console.error("Update product error:", err);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const success = await storage.deleteProduct(req.params.id);
      if (!success) return res.status(404).json({ message: "Product not found" });
      res.json({ message: "Product deleted" });
    } catch (err) {
      console.error("Delete product error:", err);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });
}
