import { 
  User, InsertUser,
  Conversation, InsertConversation,
  Message, InsertMessage,
  Transaction, InsertTransaction, 
  USER_TYPES
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

// In-memory implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private conversations: Map<number, Conversation>;
  private messages: Map<number, Message>;
  private transactions: Map<number, Transaction>;
  private currentIds: {
    user: number;
    conversation: number;
    message: number;
    transaction: number;
  };

  constructor() {
    this.users = new Map();
    this.conversations = new Map();
    this.messages = new Map();
    this.transactions = new Map();
    this.currentIds = {
      user: 1,
      conversation: 1,
      message: 1,
      transaction: 1
    };
  }

  // User operations
  async getUserById(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.telegramId === telegramId
    );
  }

  async getUsersByType(type: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.type === type
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.currentIds.user++;
    const now = new Date();
    const newUser: User = { 
      ...user, 
      id, 
      createdAt: now,
      lastActive: now,
      interests: user.interests || [],
      rating: 0,
      responseRate: 0
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Conversation operations
  async getConversation(regularUserId: number, performerId: number): Promise<Conversation | undefined> {
    return Array.from(this.conversations.values()).find(
      (conv) => 
        conv.regularUserId === regularUserId && 
        conv.performerId === performerId
    );
  }

  async getConversationById(id: number): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async getConversationsForUser(userId: number, isPerformer: boolean): Promise<Conversation[]> {
    const field = isPerformer ? 'performerId' : 'regularUserId';
    return Array.from(this.conversations.values())
      .filter(conv => conv[field] === userId)
      .sort((a, b) => 
        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      );
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const id = this.currentIds.conversation++;
    const now = new Date();
    const newConversation: Conversation = { 
      ...conversation, 
      id, 
      createdAt: now,
      lastMessageAt: now 
    };
    this.conversations.set(id, newConversation);
    return newConversation;
  }

  // Message operations
  async getMessagesForConversation(conversationId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(msg => msg.conversationId === conversationId)
      .sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.currentIds.message++;
    const now = new Date();
    const newMessage: Message = { ...message, id, createdAt: now, read: false };
    this.messages.set(id, newMessage);
    
    // Update conversation's lastMessageAt
    const conversation = this.conversations.get(message.conversationId);
    if (conversation) {
      conversation.lastMessageAt = now;
      this.conversations.set(conversation.id, conversation);
    }
    
    return newMessage;
  }

  async markMessagesAsRead(conversationId: number, userId: number): Promise<void> {
    Array.from(this.messages.values())
      .filter(msg => msg.conversationId === conversationId && msg.recipientId === userId)
      .forEach(msg => {
        msg.read = true;
        this.messages.set(msg.id, msg);
      });
  }

  // Transaction operations
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentIds.transaction++;
    const now = new Date();
    const newTransaction: Transaction = { ...transaction, id, createdAt: now };
    this.transactions.set(id, newTransaction);
    return newTransaction;
  }

  async getTransactionsForUser(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(txn => txn.userId === userId)
      .sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  // Performer operations
  async getPerformers(limit: number = 20, offset: number = 0): Promise<User[]> {
    return Array.from(this.users.values())
      .filter(user => user.type === USER_TYPES.PERFORMER)
      .sort((a, b) => b.rating - a.rating)
      .slice(offset, offset + limit);
  }

  async searchPerformers(query: string): Promise<User[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.users.values())
      .filter(user => 
        user.type === USER_TYPES.PERFORMER && 
        (
          user.firstName.toLowerCase().includes(lowercaseQuery) ||
          (user.lastName && user.lastName.toLowerCase().includes(lowercaseQuery)) ||
          (user.bio && user.bio.toLowerCase().includes(lowercaseQuery)) ||
          (user.location && user.location.toLowerCase().includes(lowercaseQuery))
        )
      );
  }

  // Referral operations
  async getUserByReferralCode(referralCode: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.referralCode === referralCode
    );
  }

  async processReferralBonus(referringUserId: number, newUserId: number): Promise<Transaction | undefined> {
    const referringUser = await this.getUserById(referringUserId);
    const newUser = await this.getUserById(newUserId);
    
    if (!referringUser || !newUser) return undefined;
    
    // Only performers can get referral bonuses
    if (referringUser.type !== USER_TYPES.PERFORMER) return undefined;
    
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
    
    // Create a transaction record
    await this.createTransaction({
      userId,
      type: reason === "referral" ? "referral" : "earn",
      amount,
      description: reason,
      relatedUserId
    });
    
    return updatedUser!;
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

export const storage = new MemStorage();
