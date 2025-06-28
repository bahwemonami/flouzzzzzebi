import { users, sessions, categories, products, transactions, transactionItems, type User, type InsertUser, type Session, type Category, type InsertCategory, type Product, type InsertProduct, type Transaction, type InsertTransaction, type TransactionItem, type InsertTransactionItem } from "@shared/schema";
import { nanoid } from "nanoid";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  toggleUserStatus(id: number): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Session operations
  createSession(userId: number): Promise<Session>;
  getSession(token: string): Promise<Session | undefined>;
  getUserBySessionToken(token: string): Promise<User | undefined>;
  deleteSession(token: string): Promise<void>;

  // Category operations
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  
  // Product operations
  getProducts(): Promise<Product[]>;
  getProductsByCategory(categoryId: number): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  
  // Transaction operations
  getTransactions(userId?: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  createTransactionItem(item: InsertTransactionItem): Promise<TransactionItem>;
  getTransactionItems(transactionId: number): Promise<TransactionItem[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private sessions: Map<string, Session>;
  private categories: Map<number, Category>;
  private products: Map<number, Product>;
  private transactions: Map<number, Transaction>;
  private transactionItems: Map<number, TransactionItem>;
  private currentUserId: number;
  private currentSessionId: number;
  private currentCategoryId: number;
  private currentProductId: number;
  private currentTransactionId: number;
  private currentTransactionItemId: number;

  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.categories = new Map();
    this.products = new Map();
    this.transactions = new Map();
    this.transactionItems = new Map();
    this.currentUserId = 1;
    this.currentSessionId = 1;
    this.currentCategoryId = 1;
    this.currentProductId = 1;
    this.currentTransactionId = 1;
    this.currentTransactionItemId = 1;
    
    // Create demo data
    this.createDemoUser();
    this.createDemoData();
  }

  private async createDemoUser() {
    const demoUser: User = {
      id: this.currentUserId++,
      email: "demo@flouz.com",
      password: "demo123",
      firstName: "Demo",
      lastName: "User",
      isDemo: true,
      isMaster: false,
      isActive: true,
      telegramChatId: null,
      telegramBotToken: null,
      createdAt: new Date(),
    };
    this.users.set(demoUser.id, demoUser);

    // Créer le compte master
    const masterUser: User = {
      id: this.currentUserId++,
      email: "flouz@mail.com",
      password: "rootsesmort",
      firstName: "Admin",
      lastName: "Master",
      isDemo: false,
      isMaster: true,
      isActive: true,
      telegramChatId: null,
      telegramBotToken: null,
      createdAt: new Date(),
    };
    this.users.set(masterUser.id, masterUser);
  }

  private async createDemoData() {
    // Create demo categories
    const categories = [
      { name: "Boissons", color: "#2F80ED" },
      { name: "Snacks", color: "#56CCF2" },
      { name: "Plats", color: "#27AE60" },
      { name: "Desserts", color: "#F2994A" },
    ];

    for (const categoryData of categories) {
      const category: Category = {
        id: this.currentCategoryId++,
        ...categoryData,
        createdAt: new Date(),
      };
      this.categories.set(category.id, category);
    }

    // Create demo products
    const products = [
      { name: "Coca-Cola", price: "2.50", categoryId: 1, stock: 50 },
      { name: "Eau minérale", price: "1.20", categoryId: 1, stock: 30 },
      { name: "Café", price: "1.80", categoryId: 1, stock: 100 },
      { name: "Chips", price: "3.50", categoryId: 2, stock: 25 },
      { name: "Sandwich jambon", price: "4.50", categoryId: 3, stock: 15 },
      { name: "Salade César", price: "7.90", categoryId: 3, stock: 10 },
      { name: "Muffin chocolat", price: "2.80", categoryId: 4, stock: 20 },
      { name: "Tarte aux pommes", price: "3.20", categoryId: 4, stock: 12 },
    ];

    for (const productData of products) {
      const product: Product = {
        id: this.currentProductId++,
        ...productData,
        barcode: null,
        image: null,
        isActive: true,
        createdAt: new Date(),
      };
      this.products.set(product.id, product);
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      id,
      email: insertUser.email,
      password: insertUser.password,
      firstName: insertUser.firstName ?? null,
      lastName: insertUser.lastName ?? null,
      isDemo: insertUser.isDemo ?? false,
      isMaster: insertUser.isMaster ?? false,
      isActive: insertUser.isActive ?? true,
      telegramChatId: insertUser.telegramChatId ?? null,
      telegramBotToken: insertUser.telegramBotToken ?? null,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updated: User = {
      ...user,
      ...userData,
    };
    this.users.set(id, updated);
    return updated;
  }

  async toggleUserStatus(id: number): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updated: User = {
      ...user,
      isActive: !user.isActive,
    };
    this.users.set(id, updated);
    return updated;
  }

  async deleteUser(id: number): Promise<boolean> {
    // Ne pas supprimer le compte master
    const user = this.users.get(id);
    if (user?.isMaster) return false;
    
    // Supprimer toutes les sessions de cet utilisateur
    const sessionsToDelete: string[] = [];
    this.sessions.forEach((session, token) => {
      if (session.userId === id) {
        sessionsToDelete.push(token);
      }
    });
    sessionsToDelete.forEach(token => this.sessions.delete(token));
    
    return this.users.delete(id);
  }

  async createSession(userId: number): Promise<Session> {
    const session: Session = {
      id: this.currentSessionId++,
      userId,
      token: nanoid(32),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: new Date(),
    };
    this.sessions.set(session.token, session);
    return session;
  }

  async getSession(token: string): Promise<Session | undefined> {
    const session = this.sessions.get(token);
    if (session && session.expiresAt > new Date()) {
      return session;
    }
    if (session) {
      this.sessions.delete(token);
    }
    return undefined;
  }

  async getUserBySessionToken(token: string): Promise<User | undefined> {
    const session = await this.getSession(token);
    if (session) {
      return this.getUser(session.userId);
    }
    return undefined;
  }

  async deleteSession(token: string): Promise<void> {
    this.sessions.delete(token);
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async createCategory(categoryData: InsertCategory): Promise<Category> {
    const category: Category = {
      id: this.currentCategoryId++,
      name: categoryData.name,
      color: categoryData.color ?? "#2F80ED",
      createdAt: new Date(),
    };
    this.categories.set(category.id, category);
    return category;
  }

  async updateCategory(id: number, categoryData: Partial<InsertCategory>): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category) return undefined;
    
    const updated: Category = {
      ...category,
      ...categoryData,
    };
    this.categories.set(id, updated);
    return updated;
  }

  async deleteCategory(id: number): Promise<boolean> {
    return this.categories.delete(id);
  }

  // Product operations
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.categoryId === categoryId
    );
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(productData: InsertProduct): Promise<Product> {
    const product: Product = {
      id: this.currentProductId++,
      name: productData.name,
      price: productData.price,
      categoryId: productData.categoryId ?? null,
      barcode: productData.barcode ?? null,
      image: productData.image ?? null,
      stock: productData.stock ?? 0,
      isActive: productData.isActive ?? true,
      createdAt: new Date(),
    };
    this.products.set(product.id, product);
    return product;
  }

  async updateProduct(id: number, productData: Partial<InsertProduct>): Promise<Product | undefined> {
    const existing = this.products.get(id);
    if (!existing) return undefined;
    
    const updated: Product = {
      ...existing,
      ...productData,
    };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }

  // Transaction operations
  async getTransactions(userId?: number): Promise<Transaction[]> {
    const transactions = Array.from(this.transactions.values());
    return userId ? transactions.filter(t => t.userId === userId) : transactions;
  }

  async createTransaction(transactionData: InsertTransaction): Promise<Transaction> {
    const transaction: Transaction = {
      id: this.currentTransactionId++,
      ...transactionData,
      createdAt: new Date(),
    };
    this.transactions.set(transaction.id, transaction);
    return transaction;
  }

  async createTransactionItem(itemData: InsertTransactionItem): Promise<TransactionItem> {
    const item: TransactionItem = {
      id: this.currentTransactionItemId++,
      ...itemData,
    };
    this.transactionItems.set(item.id, item);
    return item;
  }

  async getTransactionItems(transactionId: number): Promise<TransactionItem[]> {
    return Array.from(this.transactionItems.values()).filter(
      (item) => item.transactionId === transactionId
    );
  }
}

export const storage = new MemStorage();
