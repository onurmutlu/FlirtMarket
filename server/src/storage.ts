import { 
  type User, type InsertUser,
  type DbConversation, type InsertConversation,
  type DbMessage, type InsertMessage,
  type DbTransaction, type InsertTransaction,
  type UserType, type Message
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUserById(id: number): Promise<User | undefined>;
  getUserByTelegramId(telegramId: string): Promise<User | undefined>;
  getUsersByType(type: UserType): Promise<User[]>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(userData: any): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  
  // Conversation operations
  getConversation(regularUserId: number, performerId: number): Promise<DbConversation | undefined>;
  getConversationById(id: number): Promise<DbConversation | undefined>;
  getConversationsForUser(userId: number, isPerformer: boolean): Promise<DbConversation[]>;
  createConversation(conversation: any): Promise<DbConversation>;
  
  // Message operations
  getMessagesForConversation(conversationId: number): Promise<Message[]>;
  getMessagesForPerformer(performerId: number, days?: number): Promise<Message[]>;
  createMessage(message: any): Promise<Message>;
  markMessagesAsRead(conversationId: number, userId: number): Promise<void>;
  
  // Transaction operations
  createTransaction(transaction: any): Promise<DbTransaction>;
  getTransactionsForUser(userId: number): Promise<DbTransaction[]>;
  
  // Performer operations
  getPerformers(limit?: number, offset?: number): Promise<User[]>;
  searchPerformers(query: string): Promise<User[]>;
  getActiveChatsForPerformer(performerId: number): Promise<DbConversation[]>;
  
  // Referral operations
  getUserByReferralCode(referralCode: string): Promise<User | undefined>;
  processReferralBonus(referringUserId: number, newUserId: number): Promise<DbTransaction | undefined>;
  
  // Coin operations
  addCoins(userId: number, amount: number, reason: string, relatedUserId?: number): Promise<User>;
  spendCoins(userId: number, amount: number, reason: string, relatedUserId?: number): Promise<User | undefined>;
}

// Import and use the database storage implementation
import { DatabaseStorage } from './dbStorage';
export const storage = new DatabaseStorage();
