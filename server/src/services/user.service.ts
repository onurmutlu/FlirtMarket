import { db } from "../db";
import { users, transactions } from "@shared/schema";
import { eq } from "drizzle-orm";
import { USER_TYPES, type User } from "@shared/schema";
import { generateReferralCode } from "../utils/referral";
import bcrypt from "bcrypt";
import { storage } from '../storage';

export class UserService {
  private mapDbUserToUser(dbUser: any): User {
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
      age: dbUser.age || null
    };
  }

  async createUser(data: {
    telegramId: string;
    firstName: string;
    lastName?: string;
    username?: string;
    type: "regular" | "performer";
    referredBy?: string;
    passwordHash?: string;
    bio?: string;
    coins?: number;
    messagePrice?: number;
    interests?: string[];
    age?: number;
    location?: string;
  }): Promise<User> {
    const referralCode = generateReferralCode();
    
    let referrerId: number | undefined;
    if (data.referredBy) {
      const referrer = await this.getUserByReferralCode(data.referredBy);
      if (referrer) {
        referrerId = referrer.id;
        if (referrer.type === USER_TYPES.PERFORMER) {
          await this.addCoins(referrer.id, 50, "Referral bonus");
        }
      }
    }

    // Önce mevcut kullanıcıyı kontrol et
    if (data.username) {
      const existingUser = await this.getUserByUsername(data.username);
      if (existingUser) {
        // Kullanıcı varsa ve şifre güncellenmesi gerekiyorsa
        if (data.passwordHash && !existingUser.passwordHash) {
          await db.update(users)
            .set({ passwordHash: data.passwordHash })
            .where(eq(users.id, existingUser.id));
          return { ...existingUser, passwordHash: data.passwordHash };
        }
        return existingUser;
      }
    }

    // Yeni kullanıcı oluştur
    const [user] = await db.insert(users).values({
      telegramId: data.telegramId,
      firstName: data.firstName,
      lastName: data.lastName,
      username: data.username,
      type: data.type,
      coins: data.coins || (data.type === USER_TYPES.PERFORMER ? 100 : 50),
      referralCode,
      referredBy: referrerId,
      passwordHash: data.passwordHash,
      bio: data.bio,
      messagePrice: data.messagePrice,
      interests: data.interests as any,
      age: data.age,
      location: data.location,
      createdAt: new Date(),
      lastActive: new Date(),
    }).returning();

    return user;
  }

  async getUserById(id: number): Promise<User | null> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    
    return result[0] ? this.mapDbUserToUser(result[0]) : null;
  }

  async getUserByTelegramId(telegramId: string): Promise<User | null> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .limit(1);
    
    return result[0] || null;
  }

  async getUserByReferralCode(code: string): Promise<User | null> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.referralCode, code))
      .limit(1);
    
    return result[0] || null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    
    return result[0] ? this.mapDbUserToUser(result[0]) : null;
  }

  async addCoins(userId: number, amount: number, reason: string): Promise<void> {
    await db.transaction(async (tx) => {
      const [user] = await tx
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) throw new Error("User not found");

      await tx
        .update(users)
        .set({ coins: user.coins + amount })
        .where(eq(users.id, userId));

      // İşlem kaydı
      await tx.insert(transactions).values({
        userId,
        type: "earn",
        amount,
        description: reason,
        createdAt: new Date(),
      });
    });
  }

  async updateLastActive(userId: number): Promise<void> {
    await db
      .update(users)
      .set({ lastActive: new Date() })
      .where(eq(users.id, userId));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUserType(userId: number, type: "regular" | "performer"): Promise<void> {
    await db
      .update(users)
      .set({ type })
      .where(eq(users.id, userId));
  }

  async createTestUsers() {
    const testUsers = [
      {
        username: 'test',
        password: 'test123',
        firstName: 'Test',
        lastName: 'User',
        type: 'user' as const,
        coins: 1000,
        telegramId: 'test123',
      },
      {
        username: 'showcu',
        password: 'showcu123',
        firstName: 'Şovcu',
        lastName: 'Test',
        type: 'performer' as const,
        coins: 0,
        telegramId: 'performer123',
      },
      {
        username: 'admin',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User',
        type: 'admin' as const,
        coins: 0,
        telegramId: 'admin',
      },
      // Test kullanıcıları
      {
        username: 'user1',
        password: 'test123',
        firstName: 'Test',
        lastName: 'User 1',
        type: 'user' as const,
        coins: 500,
        telegramId: 'test_user1',
      },
      {
        username: 'user2',
        password: 'test123',
        firstName: 'Test',
        lastName: 'User 2',
        type: 'user' as const,
        coins: 750,
        telegramId: 'test_user2',
      },
      // Test şovcular
      {
        username: 'performer1',
        password: 'test123',
        firstName: 'Şovcu',
        lastName: 'Test 1',
        type: 'performer' as const,
        coins: 1000,
        telegramId: 'test_performer1',
        messagePrice: 50,
        bio: 'Test şovcu 1 bio',
      },
      {
        username: 'performer2',
        password: 'test123',
        firstName: 'Şovcu',
        lastName: 'Test 2',
        type: 'performer' as const,
        coins: 2000,
        telegramId: 'test_performer2',
        messagePrice: 75,
        bio: 'Test şovcu 2 bio',
      }
    ];

    for (const userData of testUsers) {
      const existingUser = await this.getUserByUsername(userData.username);
      if (!existingUser) {
        const passwordHash = await bcrypt.hash(userData.password, 10);
        await storage.createUser({
          ...userData,
          passwordHash,
          referralCode: generateReferralCode()
        });
      }
    }
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    if (!user.passwordHash) return false;
    return bcrypt.compare(password, user.passwordHash);
  }
} 