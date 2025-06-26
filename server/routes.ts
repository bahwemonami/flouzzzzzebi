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

  // Category routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/categories", requireAuth, async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.put("/api/categories/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.updateCategory(id, categoryData);
      if (!category) {
        return res.status(404).json({ message: "Catégorie non trouvée" });
      }
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.delete("/api/categories/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCategory(id);
      if (!success) {
        return res.status(404).json({ message: "Catégorie non trouvée" });
      }
      res.json({ message: "Catégorie supprimée" });
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const { categoryId } = req.query;
      const products = categoryId 
        ? await storage.getProductsByCategory(Number(categoryId))
        : await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(Number(req.params.id));
      if (!product) {
        return res.status(404).json({ message: "Produit non trouvé" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/products", requireAuth, async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.put("/api/products/:id", requireAuth, async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.updateProduct(Number(req.params.id), productData);
      if (!product) {
        return res.status(404).json({ message: "Produit non trouvé" });
      }
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.delete("/api/products/:id", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteProduct(Number(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Produit non trouvé" });
      }
      res.json({ message: "Produit supprimé avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Transaction routes
  app.get("/api/transactions", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const transactions = await storage.getTransactions(userId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/checkout", requireAuth, async (req, res) => {
    try {
      const checkoutData = checkoutSchema.parse(req.body);
      const userId = (req as any).user.id;
      
      let total = 0;
      const validItems = [];

      // Validate items and calculate total
      for (const item of checkoutData.items) {
        const product = await storage.getProduct(item.productId);
        if (!product || !product.isActive) {
          return res.status(400).json({ 
            message: `Produit ${item.productId} non disponible` 
          });
        }
        
        if (product.stock !== null && product.stock < item.quantity) {
          return res.status(400).json({ 
            message: `Stock insuffisant pour ${product.name}` 
          });
        }

        const itemTotal = Number(product.price) * item.quantity;
        total += itemTotal;
        
        validItems.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: product.price,
          totalPrice: itemTotal.toFixed(2),
        });
      }

      // Create transaction
      const transaction = await storage.createTransaction({
        userId,
        total: total.toFixed(2),
        paymentMethod: checkoutData.paymentMethod,
      });

      // Create transaction items
      for (const item of validItems) {
        await storage.createTransactionItem({
          transactionId: transaction.id,
          ...item,
        });

        // Update stock
        const product = await storage.getProduct(item.productId);
        if (product && product.stock !== null) {
          await storage.updateProduct(item.productId, {
            stock: product.stock - item.quantity,
          });
        }
      }

      res.json({
        transaction,
        items: validItems,
        total: total.toFixed(2),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Checkout error:", error);
      res.status(500).json({ message: "Erreur lors de la transaction" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
