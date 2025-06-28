import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, insertAccountSchema, insertUserSchema, insertCategorySchema, insertProductSchema, checkoutSchema, selectUserSchema } from "@shared/schema";
import { getDailySummary, formatDailySummaryMessage, sendTelegramMessage } from "./telegram";
import { z } from "zod";

// Middleware to check authentication
async function requireAuth(req: Request, res: Response, next: Function) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  
  if (!token) {
    return res.status(401).json({ message: "Token requis" });
  }

  const session = await storage.getSession(token);
  if (!session) {
    return res.status(401).json({ message: "Session invalide" });
  }

  const account = await storage.getAccount(session.accountId);
  if (!account) {
    return res.status(401).json({ message: "Compte introuvable" });
  }

  // Récupérer l'utilisateur sélectionné si disponible
  let selectedUser = null;
  if (session.selectedUserId) {
    selectedUser = await storage.getUser(session.selectedUserId);
  }

  (req as any).session = session;
  (req as any).account = account;
  (req as any).selectedUser = selectedUser;
  next();
}

async function requireMaster(req: Request, res: Response, next: Function) {
  if (!(req as any).account?.isMaster) {
    return res.status(403).json({ message: "Accès réservé au compte master" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const account = await storage.getAccountByEmail(email);
      if (!account || account.password !== password) {
        return res.status(401).json({ message: "Email ou mot de passe incorrect" });
      }

      if (!account.isActive) {
        return res.status(401).json({ message: "Compte désactivé" });
      }

      // Supprimer toutes les sessions existantes pour ce compte (session unique)
      await storage.deleteAccountSessions(account.id);

      const session = await storage.createSession(account.id);
      res.json({ 
        token: session.token,
        account: {
          id: account.id,
          email: account.email,
          isDemo: account.isDemo,
          isMaster: account.isMaster
        }
      });
    } catch (error) {
      res.status(400).json({ message: "Données invalides" });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const account = (req as any).account;
      const session = (req as any).session;
      
      // Get users for this account
      const users = await storage.getUsersByAccount(account.id);
      
      res.json({
        account: {
          id: account.id,
          email: account.email,
          isDemo: account.isDemo,
          isMaster: account.isMaster
        },
        users,
        selectedUserId: session.selectedUserId
      });
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/auth/select-user", requireAuth, async (req, res) => {
    try {
      const { userId } = selectUserSchema.parse(req.body);
      const session = (req as any).session;
      
      const updatedSession = await storage.selectUser(session.token, userId);
      if (!updatedSession) {
        return res.status(400).json({ message: "Utilisateur invalide" });
      }

      const selectedUser = await storage.getUser(userId);
      res.json({ selectedUser });
    } catch (error) {
      res.status(400).json({ message: "Données invalides" });
    }
  });

  app.post("/api/auth/logout", requireAuth, async (req, res) => {
    try {
      const session = (req as any).session;
      await storage.deleteSession(session.token);
      res.json({ message: "Déconnexion réussie" });
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Master account management routes
  app.get("/api/master/accounts", requireAuth, requireMaster, async (req, res) => {
    try {
      const accounts = await storage.getAllAccounts();
      // Don't return passwords
      const safeAccounts = accounts.map(({ password, ...account }) => account);
      res.json(safeAccounts);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/master/accounts", requireAuth, requireMaster, async (req, res) => {
    try {
      const { employees, ...accountData } = req.body;
      
      // Créer le compte
      const accountDataParsed = insertAccountSchema.parse(accountData);
      const account = await storage.createAccount(accountDataParsed);
      
      // Créer les employés si fournis
      if (employees && Array.isArray(employees)) {
        for (const employee of employees) {
          const employeeData = insertUserSchema.parse({
            ...employee,
            accountId: account.id
          });
          await storage.createUser(employeeData);
        }
      }
      
      const { password, ...safeAccount } = account;
      res.json(safeAccount);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.put("/api/master/accounts/:id", requireAuth, requireMaster, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const accountData = insertAccountSchema.partial().parse(req.body);
      const account = await storage.updateAccount(id, accountData);
      
      if (!account) {
        return res.status(404).json({ message: "Compte introuvable" });
      }

      const { password, ...safeAccount } = account;
      res.json(safeAccount);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/master/accounts/:id/toggle", requireAuth, requireMaster, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const account = await storage.toggleAccountStatus(id);
      
      if (!account) {
        return res.status(404).json({ message: "Compte introuvable" });
      }

      const { password, ...safeAccount } = account;
      res.json(safeAccount);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.delete("/api/master/accounts/:id", requireAuth, requireMaster, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAccount(id);
      
      if (!success) {
        return res.status(400).json({ message: "Impossible de supprimer ce compte" });
      }

      res.json({ message: "Compte supprimé" });
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // User (employee) management routes
  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      const account = (req as any).account;
      const users = await storage.getUsersByAccount(account.id);
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/users", requireAuth, async (req, res) => {
    try {
      const account = (req as any).account;
      const userData = insertUserSchema.parse({
        ...req.body,
        accountId: account.id
      });
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.put("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(id, userData);
      
      if (!user) {
        return res.status(404).json({ message: "Utilisateur introuvable" });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/users/:id/toggle", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.toggleUserStatus(id);
      
      if (!user) {
        return res.status(404).json({ message: "Utilisateur introuvable" });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.delete("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteUser(id);
      
      if (!success) {
        return res.status(400).json({ message: "Impossible de supprimer cet utilisateur" });
      }

      res.json({ message: "Utilisateur supprimé" });
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Analytics route for master
  app.get("/api/master/analytics", requireAuth, requireMaster, async (req, res) => {
    try {
      const accounts = await storage.getAllAccounts();
      const users = await storage.getAllUsers();
      const transactions = await storage.getTransactions();

      const summary = {
        totalUsers: accounts.length,
        activeUsers: accounts.filter(a => a.isActive).length,
        totalTransactions: transactions.length,
        totalRevenue: transactions.reduce((sum, t) => sum + parseFloat(t.total), 0),
        totalProducts: (await storage.getProducts()).length,
        totalCategories: (await storage.getCategories()).length,
      };

      // Group transactions by day
      const transactionsByDay = transactions.reduce((acc: any, transaction) => {
        const date = transaction.createdAt ? transaction.createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { date, count: 0, revenue: 0 };
        }
        acc[date].count += 1;
        acc[date].revenue += parseFloat(transaction.total);
        return acc;
      }, {});

      const recentUsers = accounts
        .filter(a => !a.isMaster)
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 10)
        .map(({ password, ...account }) => account);

      res.json({
        summary,
        transactionsByDay: Object.values(transactionsByDay),
        recentUsers,
      });
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Master user (employee) management routes
  app.get("/api/master/users", requireAuth, requireMaster, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/master/users", requireAuth, requireMaster, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.put("/api/master/users/:id", requireAuth, requireMaster, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(id, userData);
      
      if (!user) {
        return res.status(404).json({ message: "Utilisateur introuvable" });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/master/users/:id/toggle", requireAuth, requireMaster, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.toggleUserStatus(id);
      
      if (!user) {
        return res.status(404).json({ message: "Utilisateur introuvable" });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.delete("/api/master/users/:id", requireAuth, requireMaster, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteUser(id);
      
      if (!success) {
        return res.status(400).json({ message: "Impossible de supprimer cet utilisateur" });
      }

      res.json({ message: "Utilisateur supprimé" });
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Category routes
  app.get("/api/categories", requireAuth, async (req, res) => {
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
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.put("/api/categories/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const categoryData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(id, categoryData);
      
      if (!category) {
        return res.status(404).json({ message: "Catégorie introuvable" });
      }

      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.delete("/api/categories/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCategory(id);
      
      if (!success) {
        return res.status(400).json({ message: "Impossible de supprimer cette catégorie" });
      }

      res.json({ message: "Catégorie supprimée" });
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Product routes
  app.get("/api/products", requireAuth, async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
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
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.put("/api/products/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const productData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(id, productData);
      
      if (!product) {
        return res.status(404).json({ message: "Produit introuvable" });
      }

      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.delete("/api/products/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteProduct(id);
      
      if (!success) {
        return res.status(400).json({ message: "Impossible de supprimer ce produit" });
      }

      res.json({ message: "Produit supprimé" });
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Transaction routes
  app.get("/api/transactions", requireAuth, async (req, res) => {
    try {
      const session = (req as any).session;
      const transactions = await storage.getTransactions(session.selectedUserId || undefined);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/transactions/checkout", requireAuth, async (req, res) => {
    try {
      const session = (req as any).session;
      const account = (req as any).account;
      
      if (!session.selectedUserId) {
        return res.status(400).json({ message: "Veuillez sélectionner un utilisateur" });
      }

      const { items, paymentMethod } = checkoutSchema.parse(req.body);
      
      // Calculate total
      let total = 0;
      for (const item of items) {
        const product = await storage.getProduct(item.productId);
        if (!product) {
          return res.status(400).json({ message: `Produit ${item.productId} introuvable` });
        }
        total += parseFloat(product.price) * item.quantity;
      }

      // Create transaction
      const transaction = await storage.createTransaction({
        accountId: account.id,
        userId: session.selectedUserId,
        paymentMethod,
        total: total.toFixed(2),
      });

      // Create transaction items
      for (const item of items) {
        const product = await storage.getProduct(item.productId);
        if (product) {
          await storage.createTransactionItem({
            transactionId: transaction.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: product.price,
            totalPrice: (parseFloat(product.price) * item.quantity).toFixed(2),
          });
        }
      }

      res.json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/transactions/:id/items", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const items = await storage.getTransactionItems(id);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Daily summary and telegram route
  app.post("/api/daily-summary", requireAuth, async (req, res) => {
    try {
      const session = (req as any).session;
      const account = (req as any).account;
      
      if (!session.selectedUserId) {
        return res.status(400).json({ message: "Veuillez sélectionner un utilisateur" });
      }

      const selectedUser = await storage.getUser(session.selectedUserId);
      if (!selectedUser) {
        return res.status(400).json({ message: "Utilisateur introuvable" });
      }

      const summary = await getDailySummary(session.selectedUserId);
      const userName = `${selectedUser.firstName} ${selectedUser.lastName}`;
      const message = formatDailySummaryMessage(summary, userName);

      if (account.telegramChatId && account.telegramBotToken) {
        const sent = await sendTelegramMessage(account.telegramChatId, account.telegramBotToken, message);
        if (sent) {
          res.json({ message: "Rapport envoyé avec succès", summary });
        } else {
          res.status(500).json({ message: "Erreur lors de l'envoi du rapport" });
        }
      } else {
        res.status(400).json({ message: "Configuration Telegram manquante" });
      }
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Route pour clôturer la caisse
  app.post("/api/close-register", requireAuth, async (req, res) => {
    try {
      const account = (req as any).account;
      const selectedUser = (req as any).selectedUser;
      
      // Vérifier qu'un utilisateur est sélectionné
      if (!selectedUser) {
        return res.status(400).json({ 
          message: "Aucun employé sélectionné. Veuillez vous reconnecter." 
        });
      }
      
      // Vérifier que l'account a les informations Telegram
      if (!account.telegramChatId || !account.telegramBotToken) {
        return res.status(400).json({ 
          message: "Configuration Telegram manquante. Contactez votre administrateur." 
        });
      }

      // Générer le rapport journalier avec l'ID de l'utilisateur sélectionné
      const { getDailySummary, formatDailySummaryMessage, sendTelegramMessage } = await import("./telegram");
      const dailySummary = await getDailySummary(selectedUser.id);
      const userName = `${selectedUser.firstName} ${selectedUser.lastName}`;
      const message = formatDailySummaryMessage(dailySummary, userName);

      // Envoyer la notification Telegram
      const success = await sendTelegramMessage(account.telegramChatId, account.telegramBotToken, message);
      
      if (!success) {
        return res.status(500).json({ 
          message: "Erreur lors de l'envoi de la notification Telegram" 
        });
      }

      // Supprimer la session pour déconnecter l'utilisateur
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (token) {
        await storage.deleteSession(token);
      }

      res.json({ 
        message: "Caisse clôturée avec succès", 
        summary: dailySummary 
      });
    } catch (error) {
      console.error("Erreur lors de la clôture de caisse:", error);
      res.status(500).json({ message: "Erreur lors de la clôture de caisse" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}