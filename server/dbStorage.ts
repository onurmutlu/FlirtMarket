import { db } from './db';
import { eq, and, or, desc, like, isNull } from 'drizzle-orm';
import { 
  User, InsertUser, users,
  Conversation, InsertConversation, conversations,
  Message, InsertMessage, messages,
  Transaction, InsertTransaction, transactions
} from "@shared/schema";
import { IStorage } from './storage';

// Database implementation
export class DatabaseStorage implements IStorage {
  // User operations
  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId));
    return user;
  }

  async getUsersByType(type: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.type, type));
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Conversation operations
  async getConversation(regularUserId: number, performerId: number): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.regularUserId, regularUserId),
          eq(conversations.performerId, performerId)
        )
      );
    return conversation;
  }

  async getConversationById(id: number): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));
    return conversation;
  }

  async getConversationsForUser(userId: number, isPerformer: boolean): Promise<Conversation[]> {
    const field = isPerformer ? conversations.performerId : conversations.regularUserId;
    return await db
      .select()
      .from(conversations)
      .where(eq(field, userId))
      .orderBy(desc(conversations.lastMessageAt));
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [newConversation] = await db
      .insert(conversations)
      .values(conversation)
      .returning();
    return newConversation;
  }

  // Message operations
  async getMessagesForConversation(conversationId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    
    // Update conversation's lastMessageAt
    await db
      .update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, message.conversationId));
    
    return newMessage;
  }

  async markMessagesAsRead(conversationId: number, userId: number): Promise<void> {
    await db
      .update(messages)
      .set({ read: true })
      .where(
        and(
          eq(messages.conversationId, conversationId),
          eq(messages.recipientId, userId),
          eq(messages.read, false)
        )
      );
  }

  // Transaction operations
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(transactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async getTransactionsForUser(userId: number): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  // Performer operations
  async getPerformers(limit: number = 20, offset: number = 0): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.type, 'performer'))
      .orderBy(desc(users.rating))
      .limit(limit)
      .offset(offset);
  }

  async searchPerformers(query: string): Promise<User[]> {
    const searchPattern = `%${query}%`;
    return await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.type, 'performer'),
          or(
            like(users.firstName, searchPattern),
            like(users.lastName || '', searchPattern),
            like(users.bio || '', searchPattern),
            like(users.location || '', searchPattern)
          )
        )
      );
  }

  // Referral operations
  async getUserByReferralCode(referralCode: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.referralCode, referralCode));
    return user;
  }

  async processReferralBonus(referringUserId: number, newUserId: number): Promise<Transaction | undefined> {
    const referringUser = await this.getUserById(referringUserId);
    const newUser = await this.getUserById(newUserId);
    
    if (!referringUser || !newUser) return undefined;
    
    // Only performers can get referral bonuses
    if (referringUser.type !== 'performer') return undefined;
    
    // Bonus amount
    const bonusAmount = 50;
    
    // Create the transaction
    const transaction = await this.createTransaction({
      userId: referringUserId,
      type: "referral",
      amount: bonusAmount,
      description: `Referral bonus for inviting ${newUser.firstName}`,
      relatedUserId: newUserId
    });
    
    // Add coins to the referring user
    await this.updateUser(referringUserId, { 
      coins: (referringUser.coins || 0) + bonusAmount 
    });
    
    return transaction;
  }

  // Coin operations
  async addCoins(userId: number, amount: number, reason: string, relatedUserId?: number): Promise<User> {
    const user = await this.getUserById(userId);
    if (!user) throw new Error("User not found");
    
    // Update user's coin balance
    const updatedUser = await this.updateUser(userId, { 
      coins: (user.coins || 0) + amount 
    });
    
    if (!updatedUser) throw new Error("Failed to update user");
    
    // Create a transaction record
    await this.createTransaction({
      userId,
      type: reason === "referral" ? "referral" : "earn",
      amount,
      description: reason,
      relatedUserId
    });
    
    return updatedUser;
  }

  async spendCoins(userId: number, amount: number, reason: string, relatedUserId?: number): Promise<User | undefined> {
    const user = await this.getUserById(userId);
    if (!user) return undefined;
    
    // Check if user has enough coins
    if ((user.coins || 0) < amount) {
      return undefined;
    }
    
    // Update user's coin balance
    const updatedUser = await this.updateUser(userId, { 
      coins: user.coins - amount 
    });
    
    if (!updatedUser) return undefined;
    
    // Create a transaction record
    await this.createTransaction({
      userId,
      type: "spend",
      amount: -amount, // Negative for spending
      description: reason,
      relatedUserId
    });
    
    return updatedUser;
  }
}