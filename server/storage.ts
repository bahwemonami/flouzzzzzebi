import { users, sessions, type User, type InsertUser, type Session } from "@shared/schema";
import { nanoid } from "nanoid";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Session operations
  createSession(userId: number): Promise<Session>;
  getSession(token: string): Promise<Session | undefined>;
  getUserBySessionToken(token: string): Promise<User | undefined>;
  deleteSession(token: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private sessions: Map<string, Session>;
  private currentUserId: number;
  private currentSessionId: number;

  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.currentUserId = 1;
    this.currentSessionId = 1;
    
    // Create demo user
    this.createDemoUser();
  }

  private async createDemoUser() {
    const demoUser: User = {
      id: this.currentUserId++,
      email: "demo@flouz.com",
      password: "demo123",
      firstName: "Demo",
      lastName: "User",
      isDemo: true,
      createdAt: new Date(),
    };
    this.users.set(demoUser.id, demoUser);
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
      ...insertUser, 
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
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
}

export const storage = new MemStorage();
