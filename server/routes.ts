import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import { storage } from "./storage.js";

export function registerRoutes() {
  const router = express.Router();

  /* ============================================================
      GET CURRENT USER SESSION (/api/me)
  ============================================================ */
  router.get("/me", async (req: Request, res: Response) => {
    try {
      const sessionId = req.cookies.sessionId;
      if (!sessionId) return res.status(401).json({ error: "Not logged in" });

      const session = await storage.getSession(sessionId);
      if (!session) return res.status(401).json({ error: "Invalid session" });

      const user = await storage.getUser(session.userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      res.json({
        id: user.id,
        username: user.username,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  });

  /* ============================================================
      USER REGISTRATION (/api/register)
  ============================================================ */
  router.post("/register", async (req: Request, res: Response) => {
    try {
      const { username, password, firstName, lastName, email, phone } = req.body;

      if (!username || !password)
        return res.status(400).json({ error: "Username & password required" });

      const user = await storage.registerUser({
        username,
        password,
        firstName,
        lastName,
        email,
        phone,
        role: "Admin",
      });

      res.json({ message: "Registration successful", user });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  /* ============================================================
      LOGIN + COOLDOWN + SESSION CREATION (/api/login)
  ============================================================ */
  router.post("/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      const user = await storage.getUserByUsername(username);
      if (!user) return res.status(400).json({ error: "Invalid username or password" });

      // Check cooldown
      if (user.cooldownUntil && new Date(user.cooldownUntil) > new Date()) {
        return res.status(429).json({
          error: "Too many failed attempts",
          cooldownUntil: user.cooldownUntil,
        });
      }

      // Compare password
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        await storage.incrementLoginAttempts(username);

        // Apply cooldowns
        const newUser = await storage.getUserByUsername(username);
        if (newUser!.loginAttempts >= 5) {
          const until = new Date(Date.now() + 5 * 60 * 1000);
          await storage.setCooldown(username, until);
        } else if (newUser!.loginAttempts >= 3) {
          const until = new Date(Date.now() + 60 * 1000);
          await storage.setCooldown(username, until);
        }

        return res.status(400).json({ error: "Invalid username or password" });
      }

      // Success → reset attempts
      await storage.resetLoginAttempts(username);

      // Create session
      const session = await storage.createSession(user.id);

      res.cookie("sessionId", session.id, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
      });

      res.json({ message: "Login successful" });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  });

  /* ============================================================
      LOGOUT (/api/logout)
  ============================================================ */
  router.post("/logout", async (req: Request, res: Response) => {
    try {
      const sessionId = req.cookies.sessionId;
      if (sessionId) await storage.deleteSession(sessionId);

      res.clearCookie("sessionId", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
      });

      res.json({ message: "Logged out" });
    } catch {
      res.status(500).json({ error: "Server error" });
    }
  });

  /* ============================================================
      GET ALL PRODUCTS (/api/products)
  ============================================================ */
  router.get("/products", async (_req: Request, res: Response) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch {
      res.status(500).json({ error: "Failed to load products" });
    }
  });

  /* ============================================================
      CREATE PRODUCT (/api/products)
  ============================================================ */
  router.post("/products", async (req: Request, res: Response) => {
    try {
      const product = await storage.createProduct(req.body);
      res.json(product);
    } catch {
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  /* ============================================================
      UPDATE PRODUCT
  ============================================================ */
  router.put("/products/:id", async (req: Request, res: Response) => {
    try {
      const updated = await storage.updateProduct(req.params.id, req.body);
      res.json(updated);
    } catch {
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  /* ============================================================
      DELETE PRODUCT
  ============================================================ */
  router.delete("/products/:id", async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteProduct(req.params.id);
      res.json({ success });
    } catch {
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  /* ============================================================
      SALES REPORTS (/api/reports/daily or /weekly)
  ============================================================ */
  router.get("/reports/:period", async (req: Request, res: Response) => {
    try {
      const period = req.params.period === "weekly" ? "weekly" : "daily";
      const report = await storage.getSalesReport(period);
      res.json(report);
    } catch {
      res.status(500).json({ error: "Failed to get report" });
    }
  });

  return router;
}
