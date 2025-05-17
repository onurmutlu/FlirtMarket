import { 
  User, InsertUser,
  Conversation, InsertConversation,
  Message, InsertMessage,
  Transaction, InsertTransaction
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUserById(id: number): Promise<User | undefined>;
  getUserByTelegramId(telegramId: string): Promise<User | undefined>;
  getUsersByType(type: string): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  
  // Conversation operations
  getConversation(regularUserId: number, performerId: number): Promise<Conversation | undefined>;
  getConversationById(id: number): Promise<Conversation | undefined>;
  getConversationsForUser(userId: number, isPerformer: boolean): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  
  // Message operations
  getMessagesForConversation(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessagesAsRead(conversationId: number, userId: number): Promise<void>;
  
  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionsForUser(userId: number): Promise<Transaction[]>;
  
  // Performer operations
  getPerformers(limit?: number, offset?: number): Promise<User[]>;
  searchPerformers(query: string): Promise<User[]>;
  
  // Referral operations
  getUserByReferralCode(referralCode: string): Promise<User | undefined>;
  processReferralBonus(referringUserId: number, newUserId: number): Promise<Transaction | undefined>;
  
  // Coin operations
  addCoins(userId: number, amount: number, reason: string, relatedUserId?: number): Promise<User>;
  spendCoins(userId: number, amount: number, reason: string, relatedUserId?: number): Promise<User | undefined>;
}

// Import and use the database storage implementation
import { DatabaseStorage } from './dbStorage';
export const storage = new DatabaseStorage();
