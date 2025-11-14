import type { Express } from "express";
import bcrypt from "bcrypt"; // only needed if hashing locally
import { ZodError } from "zod";
import { loginSchema, registerSchema } from "../shared/schema.js";

const API_BASE = "https://sales-inventory-management.onrender.com";

export function registerRoutes(app: Express) {
  /* -------------------- AUTHENTICATION -------------------- */

  // LOGIN
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);

      // Call deployed API
      const response = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });

      const data = await response.json();
      res.status(response.status).json(data);
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

      const response = await fetch(`${API_BASE}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanData),
        credentials: "include",
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err: any) {
      if (err instanceof ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: err.errors });
      }
      console.error("Register error:", err);
      res.status(400).json({ message: "Invalid request" });
    }
  });

  // LOGOUT
  app.post("/api/logout", async (req, res) => {
    try {
      const response = await fetch(`${API_BASE}/api/logout`, {
        method: "POST",
        headers: { cookie: req.headers.cookie || "" },
        credentials: "include",
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err) {
      console.error("Logout error:", err);
      res.status(500).json({ message: "Logout failed" });
    }
  });

  /* -------------------- ADMIN ROUTES -------------------- */

  app.post("/api/admin/reset-password", async (req, res) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie: req.headers.cookie || "" },
        body: JSON.stringify(req.body),
        credentials: "include",
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err) {
      console.error("Admin reset error:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/admin/accounts", async (req, res) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/accounts`, {
        headers: { cookie: req.headers.cookie || "" },
        credentials: "include",
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err) {
      console.error("Admin accounts error:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  /* -------------------- PRODUCT ROUTES -------------------- */

  app.get("/api/products", async (_req, res) => {
    try {
      const response = await fetch(`${API_BASE}/api/products`);
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err) {
      console.error("Fetch products error:", err);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const response = await fetch(`${API_BASE}/api/products/${req.params.id}`);
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err) {
      console.error("Fetch product error:", err);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const response = await fetch(`${API_BASE}/api/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err) {
      console.error("Add product error:", err);
      res.status(500).json({ message: "Failed to add product" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const response = await fetch(`${API_BASE}/api/products/${req.params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err) {
      console.error("Update product error:", err);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const response = await fetch(`${API_BASE}/api/products/${req.params.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err) {
      console.error("Delete product error:", err);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // SALES ROUTES
  app.post("/api/sales", async (req, res) => {
    try {
      const response = await fetch(`${API_BASE}/api/sales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err) {
      console.error("Sale error:", err);
      res.status(500).json({ message: "Failed to complete sale" });
    }
  });

  app.get("/api/sales", async (_req, res) => {
    try {
      const response = await fetch(`${API_BASE}/api/sales`);
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err) {
      console.error("Fetch sales error:", err);
      res.status(500).json({ message: "Failed to fetch sales" });
    }
  });

  // REPORT
  app.get("/api/reports/:period", async (req, res) => {
    try {
      const response = await fetch(`${API_BASE}/api/reports/${req.params.period}`);
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err) {
      console.error("Fetch report error:", err);
      res.status(500).json({ message: "Failed to generate report" });
    }
  });
}
