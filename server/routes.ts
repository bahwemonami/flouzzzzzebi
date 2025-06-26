import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, insertUserSchema, insertCategorySchema, insertProductSchema, checkoutSchema } from "@shared/schema";
import { z } from "zod";

// Middleware to check authentication
async function requireAuth(req: Request, res: Response, next: Function) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  
  if (!token) {
    return res.status(401).json({ message: "Token requis" });
  }

  const user = await storage.getUserBySessionToken(token);
  if (!user) {
    return res.status(401).json({ message: "Session invalide" });
  }

  (req as any).user = user;
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Identifiants invalides" });
      }

      const session = await storage.createSession(user.id);
      
      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isDemo: user.isDemo,
        },
        token: session.token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/auth/demo", async (req, res) => {
    try {
      const user = await storage.getUserByEmail("demo@flouz.com");
      if (!user) {
        return res.status(500).json({ message: "Compte démo non disponible" });
      }

      const session = await storage.createSession(user.id);
      
      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isDemo: user.isDemo,
        },
        token: session.token,
      });
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Cet e-mail est déjà utilisé" });
      }

      const user = await storage.createUser(userData);
      const session = await storage.createSession(user.id);
      
      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isDemo: user.isDemo,
        },
        token: session.token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/auth/logout", requireAuth, async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (token) {
        await storage.deleteSession(token);
      }
      res.json({ message: "Déconnecté avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    const user = (req as any).user;
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isDemo: user.isDemo,
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
