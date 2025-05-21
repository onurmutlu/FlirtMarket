import { db } from './db';
import { eq, and, or, desc, like, isNull, gte } from 'drizzle-orm';
import { 
  type User, type InsertUser, users,
  type DbConversation, type InsertConversation, conversations,
  type DbMessage, type InsertMessage, messages,
  type DbTransaction, type InsertTransaction, transactions,
  USER_TYPES, type UserType
} from "@shared/schema";
import { IStorage } from './storage';
import { sql } from 'drizzle-orm';
import cacheService, { CacheService } from './services/cache.service';

// Database implementation
export class DatabaseStorage implements IStorage {
  // Helper method to format a database user into a User object
  private formatUser(dbUser: any): User {
    if (!dbUser) return null as unknown as User;
    
    return {
      ...dbUser,
      displayName: `${dbUser.firstName} ${dbUser.lastName || ''}`.trim(),
      isPerformer: dbUser.type === USER_TYPES.PERFORMER,
      updatedAt: dbUser.lastActive,
      createdAt: dbUser.createdAt,
      lastActive: dbUser.lastActive,
      username: dbUser.username || null,
      lastName: dbUser.lastName || null,
      bio: dbUser.bio || null,
      location: dbUser.location || null,
      interests: dbUser.interests || null,
      messagePrice: dbUser.messagePrice || null,
      rating: dbUser.rating || null,
      responseTime: null,
      avatar: dbUser.profilePhoto || null,
      profilePhoto: dbUser.profilePhoto || null,
      age: dbUser.age || null,
      totalSpent: 0 // Default value since totalSpent is not in the database schema
    };
  }
  // User operations
  async getUserById(id: number): Promise<User | undefined> {
    try {
      // Special case for admin user with ID 0
      if (id === 0) {
        const adminUser = {
          id: 0,
          username: 'admin',
          firstName: 'Admin',
          lastName: 'User',
          type: 'admin' as UserType,
          displayName: 'Admin User',
          coins: 0,
          totalSpent: 0,
          isPerformer: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastActive: new Date(),
          telegramId: 'admin',
          referralCode: 'ADMIN',
          bio: null,
          location: null,
          interests: null,
          messagePrice: null,
          rating: null,
          responseTime: null,
          avatar: null,
          profilePhoto: null,
          age: null
        };
        return adminUser;
      }
      
      // Special case for showcu user with ID 999
      if (id === 999) {
        const showcuUser = {
          id: 999,
          username: 'showcu',
          firstName: 'Test',
          lastName: 'Showcu',
          type: 'performer' as UserType,
          coins: 0,
          totalSpent: 0,
          isPerformer: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastActive: new Date(),
          telegramId: 'performer123',
          referralCode: 'SHOWCU',
          bio: 'Test performer account for demonstration',
          location: 'Test Location',
          interests: ['testing', 'demo'],
          messagePrice: 50,
          rating: 5,
          responseTime: null,
          avatar: null,
          profilePhoto: null,
          age: 25,
          displayName: 'Test Showcu'
        };
        return showcuUser;
      }
      
      // Check cache first
      const cacheKey = CacheService.getUserKey(id);
      const cachedUser = cacheService.get<User>(cacheKey);
      if (cachedUser) {
        return cachedUser;
      }
      
      // If not in cache, fetch from database
      const [dbUser] = await db.select().from(users).where(eq(users.id, id));
      if (!dbUser) return undefined;
      
      const user = this.formatUser(dbUser);
      
      // Store in cache for future requests
      cacheService.set(cacheKey, user);
      
      return user;
    } catch (error: any) {
      console.error('Error in getUserById:', error);
      return undefined;
    }
  }

  async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
    try {
      const [dbUser] = await db.select().from(users).where(eq(users.telegramId, telegramId));
      return dbUser ? this.formatUser(dbUser) : undefined;
    } catch (error) {
      console.error('Error in getUserByTelegramId:', error);
      return undefined;
    }
  }

  async getUsersByType(type: UserType): Promise<User[]> {
    const dbUsers = await db.select().from(users).where(eq(users.type, type));
    return dbUsers.map(dbUser => ({
      ...dbUser,
      displayName: `${dbUser.firstName} ${dbUser.lastName || ''}`.trim(),
      isPerformer: dbUser.type === USER_TYPES.PERFORMER,
      updatedAt: dbUser.lastActive,
      createdAt: dbUser.createdAt,
      lastActive: dbUser.lastActive,
      username: dbUser.username || null,
      lastName: dbUser.lastName || null,
      bio: dbUser.bio || null,
      location: dbUser.location || null,
      interests: dbUser.interests || null,
      messagePrice: dbUser.messagePrice || null,
      rating: dbUser.rating || null,
      responseTime: null,
      avatar: dbUser.profilePhoto || null,
      profilePhoto: dbUser.profilePhoto || null,
      age: dbUser.age || null,
      totalSpent: 0 // Adding the missing required property
    }));
  }

  async createUser(userData: Omit<InsertUser, 'createdAt' | 'lastActive'>): Promise<User> {
    try {
      const now = new Date();
      const [dbUser] = await db
        .insert(users)
        .values({
          ...userData,
          type: userData.type as UserType,
          createdAt: now,
          lastActive: now
        })
        .returning();

      // Use the formatUser method to ensure all required properties are included
      return this.formatUser(dbUser);
    } catch (error: any) {
      console.error('Error in createUser:', error);
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    try {
      // Prepare the database update object
      const dbUpdates: any = {};
      
      // Map the User properties to database properties
      if (updates.firstName !== undefined) dbUpdates.firstName = updates.firstName;
      if (updates.lastName !== undefined) dbUpdates.lastName = updates.lastName;
      if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
      if (updates.location !== undefined) dbUpdates.location = updates.location;
      if (updates.interests !== undefined) dbUpdates.interests = updates.interests;
      if (updates.age !== undefined) dbUpdates.age = updates.age;
      if (updates.messagePrice !== undefined) dbUpdates.messagePrice = updates.messagePrice;
      if (updates.profilePhoto !== undefined) dbUpdates.profilePhoto = updates.profilePhoto;
      if (updates.username !== undefined) dbUpdates.username = updates.username;
      
      // Always update lastActive
      dbUpdates.lastActive = new Date();
      
      // Update the user in the database
      const [dbUser] = await db
        .update(users)
        .set(dbUpdates)
        .where(eq(users.id, id))
        .returning();
      
      if (!dbUser) return undefined;
      
      const updatedUser = this.formatUser(dbUser);
      
      // Update the cache with the new user data
      const cacheKey = CacheService.getUserKey(id);
      cacheService.set(cacheKey, updatedUser);
      
      return updatedUser;
    } catch (error: any) {
      console.error('Error in updateUser:', error);
      return undefined;
    }
  }

  // Conversation operations
  async getConversation(regularUserId: number, performerId: number): Promise<DbConversation | undefined> {
    try {
      // Create a composite cache key for this conversation pair
      const cacheKey = `conversation:${regularUserId}:${performerId}`;
      const cachedConversation = cacheService.get<DbConversation>(cacheKey);
      
      if (cachedConversation) {
        return cachedConversation;
      }
      
      const [conversation] = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.regularUserId, regularUserId),
            eq(conversations.performerId, performerId)
          )
        );
      
      if (conversation) {
        // Cache the result for future requests
        cacheService.set(cacheKey, conversation);
      }
      
      return conversation;
    } catch (error: any) {
      console.error('Error in getConversation:', error);
      return undefined;
    }
  }

  async getConversationById(id: number): Promise<DbConversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));
    return conversation;
  }

  async getConversationsForUser(userId: number, isPerformer: boolean): Promise<DbConversation[]> {
    const field = isPerformer ? conversations.performerId : conversations.regularUserId;
    return await db
      .select()
      .from(conversations)
      .where(eq(field, userId))
      .orderBy(desc(conversations.lastMessageAt));
  }

  async createConversation(conversation: InsertConversation): Promise<DbConversation> {
    const [newConversation] = await db
      .insert(conversations)
      .values(conversation)
      .returning();
    return newConversation;
  }

  // Message operations
  async getMessagesForConversation(conversationId: number): Promise<DbMessage[]> {
    try {
      // Check cache first
      const cacheKey = CacheService.getMessagesKey(conversationId);
      const cachedMessages = cacheService.get<DbMessage[]>(cacheKey);
      
      if (cachedMessages) {
        return cachedMessages;
      }
      
      // If not in cache, fetch from database
      const dbMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(desc(messages.createdAt));
      
      // Cache the results with a shorter TTL since messages change frequently
      // 30 seconds TTL is reasonable for messages
      cacheService.set(cacheKey, dbMessages, 30 * 1000);
      
      return dbMessages;
    } catch (error: any) {
      console.error('Error in getMessagesForConversation:', error);
      return [];
    }
  }

  async createMessage(message: InsertMessage): Promise<DbMessage> {
    try {
      const [dbMessage] = await db
        .insert(messages)
        .values(message)
        .returning();

      // Update the conversation's lastMessageAt
      await db
        .update(conversations)
        .set({ lastMessageAt: new Date() })
        .where(eq(conversations.id, message.conversationId));

      // Invalidate related caches
      const messagesKey = CacheService.getMessagesKey(message.conversationId);
      const conversationKey = CacheService.getConversationKey(message.conversationId);
      
      // Delete the cached messages and conversation to ensure fresh data on next request
      cacheService.delete(messagesKey);
      cacheService.delete(conversationKey);
      
      return dbMessage;
    } catch (error: any) {
      console.error('Error in createMessage:', error);
      throw new Error(`Failed to create message: ${error.message}`);
    }
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
  async createTransaction(transaction: InsertTransaction): Promise<DbTransaction> {
    const [newTransaction] = await db
      .insert(transactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async getTransactionsForUser(userId: number): Promise<DbTransaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  // Performer operations
  async getPerformers(limit: number = 20, offset: number = 0): Promise<User[]> {
    try {
      // Check cache first
      const cacheKey = CacheService.getPerformersKey(limit, offset);
      const cachedPerformers = cacheService.get<User[]>(cacheKey);
      
      if (cachedPerformers) {
        return cachedPerformers;
      }
      
      // If not in cache, fetch from database
      const dbUsers = await db
        .select()
        .from(users)
        .where(eq(users.type, USER_TYPES.PERFORMER))
        .limit(limit)
        .offset(offset);

      const performers = dbUsers.map(dbUser => this.formatUser(dbUser));
      
      // Cache the results - performers list doesn't change often, so 5 minutes is reasonable
      cacheService.set(cacheKey, performers, 5 * 60 * 1000);
      
      return performers;
    } catch (error: any) {
      console.error('Error in getPerformers:', error);
      return [];
    }
  }

  async searchPerformers(query: string): Promise<User[]> {
    const searchPattern = `%${query}%`;
    const dbUsers = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.type, USER_TYPES.PERFORMER),
          or(
            like(users.firstName, searchPattern),
            like(users.lastName || '', searchPattern),
            like(users.bio || '', searchPattern),
            like(users.location || '', searchPattern)
          )
        )
      );

    return dbUsers.map(dbUser => ({
      ...dbUser,
      displayName: `${dbUser.firstName} ${dbUser.lastName || ''}`.trim(),
      isPerformer: dbUser.type === USER_TYPES.PERFORMER,
      updatedAt: dbUser.lastActive,
      createdAt: dbUser.createdAt,
      lastActive: dbUser.lastActive,
      username: dbUser.username || null,
      lastName: dbUser.lastName || null,
      bio: dbUser.bio || null,
      location: dbUser.location || null,
      interests: dbUser.interests || null,
      messagePrice: dbUser.messagePrice || null,
      rating: dbUser.rating || null,
      responseTime: null,
      avatar: dbUser.profilePhoto || null,
      profilePhoto: dbUser.profilePhoto || null,
      age: dbUser.age || null,
      totalSpent: 0 // Adding the missing required property
    }));
  }

  // Referral operations
  async getUserByReferralCode(referralCode: string): Promise<User | undefined> {
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.referralCode, referralCode));

    if (!dbUser) return undefined;

    return {
      ...dbUser,
      displayName: `${dbUser.firstName} ${dbUser.lastName || ''}`.trim(),
      isPerformer: dbUser.type === USER_TYPES.PERFORMER,
      updatedAt: dbUser.lastActive,
      createdAt: dbUser.createdAt,
      lastActive: dbUser.lastActive,
      username: dbUser.username || null,
      lastName: dbUser.lastName || null,
      bio: dbUser.bio || null,
      location: dbUser.location || null,
      interests: dbUser.interests || null,
      messagePrice: dbUser.messagePrice || null,
      rating: dbUser.rating || null,
      responseTime: null,
      avatar: dbUser.profilePhoto || null,
      profilePhoto: dbUser.profilePhoto || null,
      age: dbUser.age || null,
      totalSpent: 0 // Default value since totalSpent is not in the database schema
    };
  }

  async processReferralBonus(referringUserId: number, newUserId: number): Promise<DbTransaction | undefined> {
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
    // Transaction oluştur
    await this.createTransaction({
      userId,
      type: 'credit',
      amount,
      description: reason,
      relatedUserId
    });

    // Kullanıcının coin'lerini güncelle
    const [dbUser] = await db
      .update(users)
      .set({
        coins: sql`${users.coins} + ${amount}`
      })
      .where(eq(users.id, userId))
      .returning();

    return {
      ...dbUser,
      displayName: `${dbUser.firstName} ${dbUser.lastName || ''}`.trim(),
      isPerformer: dbUser.type === USER_TYPES.PERFORMER,
      updatedAt: dbUser.lastActive,
      createdAt: dbUser.createdAt,
      lastActive: dbUser.lastActive,
      username: dbUser.username || null,
      lastName: dbUser.lastName || null,
      bio: dbUser.bio || null,
      location: dbUser.location || null,
      interests: dbUser.interests || null,
      messagePrice: dbUser.messagePrice || null,
      rating: dbUser.rating || null,
      responseTime: null,
      avatar: dbUser.profilePhoto || null,
      profilePhoto: dbUser.profilePhoto || null,
      age: dbUser.age || null,
      totalSpent: 0 // Adding the required totalSpent property
    };
  }

  async spendCoins(userId: number, amount: number, reason: string, relatedUserId?: number): Promise<User | undefined> {
    try {
      // Validate inputs
      if (!userId || amount <= 0) {
        console.error('Invalid inputs for spendCoins:', { userId, amount });
        return undefined;
      }

      // Kullanıcının yeterli coin'i var mı kontrol et
      const user = await this.getUserById(userId);
      if (!user || (user.coins || 0) < amount) {
        return undefined;
      }

      // Use transaction to ensure atomicity
      // Both operations (create transaction record and update coins) must succeed or fail together
      const [dbUser] = await db.transaction(async (tx) => {
        // Transaction oluştur
        await tx.insert(transactions).values({
          userId,
          type: 'debit',
          amount: -amount,
          description: reason,
          relatedUserId,
          createdAt: new Date()
        });

        // Kullanıcının coin'lerini güncelle
        return await tx
          .update(users)
          .set({
            coins: sql`${users.coins} - ${amount}`,
            lastActive: new Date()
          })
          .where(eq(users.id, userId))
          .returning();
      });

      return this.formatUser(dbUser);
    } catch (error) {
      console.error('Error in spendCoins:', error);
      return undefined;
    }
  }

  // Message operations for performers
  async getMessagesForPerformer(performerId: number, days: number = 7): Promise<DbMessage[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const performerConversations = await db
      .select()
      .from(conversations)
      .where(eq(conversations.performerId, performerId));

    const conversationIds = performerConversations.map(c => c.id);

    if (conversationIds.length === 0) return [];

    return await db
      .select()
      .from(messages)
      .where(
        and(
          sql`${messages.conversationId} = ANY(${conversationIds})`,
          gte(messages.createdAt, startDate)
        )
      )
      .orderBy(desc(messages.createdAt));
  }

  // Get active chats for performer
  async getActiveChatsForPerformer(performerId: number): Promise<DbConversation[]> {
    try {
      if (!performerId) return [];
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Add index hint if your database supports it
      return await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.performerId, performerId),
            gte(conversations.lastMessageAt, thirtyDaysAgo)
          )
        )
        .orderBy(desc(conversations.lastMessageAt))
        .limit(100); // Limit results for better performance
    } catch (error) {
      console.error('Error in getActiveChatsForPerformer:', error);
      return [];
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      if (!username) return undefined;
      
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, username));

      return dbUser ? this.formatUser(dbUser) : undefined;
    } catch (error) {
      console.error('Error in getUserByUsername:', error);
      return undefined;
    }
  }
}