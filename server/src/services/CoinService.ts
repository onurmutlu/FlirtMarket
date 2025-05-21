import { db } from '../db';
import { transactions, users } from '@shared/schema';
import { eq, sql, and, gte } from 'drizzle-orm';
import { desc } from 'drizzle-orm';

export class CoinService {
  // Kullanıcının son 30 günlük harcama istatistiklerini getir
  static async getUserSpendingStats(userId: number) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await db
      .select({
        totalSpent: sql<number>`sum(case when type = 'spend' then abs(amount) else 0 end)`,
        totalPurchased: sql<number>`sum(case when type = 'purchase' then amount else 0 end)`,
        transactionCount: sql<number>`count(*)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          gte(transactions.createdAt, thirtyDaysAgo)
        )
      );

    return result[0];
  }

  // Bonus coin hesaplama
  static async calculateBonus(userId: number, purchaseAmount: number): Promise<number> {
    const stats = await this.getUserSpendingStats(userId);
    
    // Temel bonus oranı (her 100 coin için 5 bonus)
    let bonusRate = 0.05;
    
    // Son 30 günlük harcama bazlı bonus
    if (stats.totalSpent > 1000) bonusRate += 0.02;
    if (stats.totalSpent > 5000) bonusRate += 0.03;
    if (stats.totalSpent > 10000) bonusRate += 0.05;
    
    // İşlem sayısı bazlı bonus
    if (stats.transactionCount > 10) bonusRate += 0.02;
    if (stats.transactionCount > 50) bonusRate += 0.03;
    
    // Satın alma miktarı bazlı ekstra bonus
    if (purchaseAmount >= 1000) bonusRate += 0.05;
    if (purchaseAmount >= 5000) bonusRate += 0.10;
    
    return Math.floor(purchaseAmount * bonusRate);
  }

  // Coin satın alma işlemi
  static async purchaseCoins(userId: number, amount: number): Promise<boolean> {
    try {
      const bonusAmount = await this.calculateBonus(userId, amount);
      const totalAmount = amount + bonusAmount;

      await db.transaction(async (tx) => {
        // Kullanıcı bakiyesini güncelle
        await tx
          .update(users)
          .set({ 
            coins: sql`${users.coins} + ${totalAmount}`,
            lastPurchaseAt: sql`CURRENT_TIMESTAMP`,
            totalPurchased: sql`COALESCE(total_purchased, 0) + ${amount}`,
            purchaseCount: sql`COALESCE(purchase_count, 0) + 1`
          })
          .where(eq(users.id, userId));

        // Ana satın alma işlem kaydı
        await tx.insert(transactions).values({
          userId,
          type: 'purchase',
          amount,
          description: `${amount} coin satın alındı`
        });

        // Bonus coin işlem kaydı
        if (bonusAmount > 0) {
          await tx.insert(transactions).values({
            userId,
            type: 'earn',
            amount: bonusAmount,
            description: `Satın alma bonusu: ${bonusAmount} coin`
          });
        }
      });
      return true;
    } catch (error) {
      console.error('Coin satın alma hatası:', error);
      return false;
    }
  }

  // Coin transfer işlemi (mesaj gönderme, bahşiş vb için)
  static async transferCoins(
    fromUserId: number,
    toUserId: number,
    amount: number,
    description: string
  ): Promise<boolean> {
    try {
      await db.transaction(async (tx) => {
        // Gönderen kullanıcının yeterli bakiyesi var mı kontrol et
        const sender = await tx
          .select({ coins: users.coins })
          .from(users)
          .where(eq(users.id, fromUserId))
          .then((res) => res[0]);

        if (!sender || sender.coins < amount) {
          throw new Error('Yetersiz bakiye');
        }

        // Gönderen kullanıcının bakiyesini düşür
        await tx
          .update(users)
          .set({ coins: sql`${users.coins} - ${amount}` })
          .where(eq(users.id, fromUserId));

        // Alıcı kullanıcının bakiyesini artır
        await tx
          .update(users)
          .set({ coins: sql`${users.coins} + ${amount}` })
          .where(eq(users.id, toUserId));

        // Gönderen için işlem kaydı
        await tx.insert(transactions).values({
          userId: fromUserId,
          type: 'spend',
          amount: -amount,
          description,
          relatedUserId: toUserId
        });

        // Alıcı için işlem kaydı
        await tx.insert(transactions).values({
          userId: toUserId,
          type: 'earn',
          amount,
          description,
          relatedUserId: fromUserId
        });
      });
      return true;
    } catch (error) {
      console.error('Coin transfer hatası:', error);
      return false;
    }
  }

  // Referans ödülü verme
  static async giveReferralReward(
    referrerId: number,
    referredId: number,
    rewardAmount: number = 50
  ): Promise<boolean> {
    try {
      await db.transaction(async (tx) => {
        // Referans veren kullanıcının bakiyesini artır
        await tx
          .update(users)
          .set({ coins: sql`${users.coins} + ${rewardAmount}` })
          .where(eq(users.id, referrerId));

        // İşlem kaydı oluştur
        await tx.insert(transactions).values({
          userId: referrerId,
          type: 'referral',
          amount: rewardAmount,
          description: 'Referans ödülü',
          relatedUserId: referredId
        });
      });
      return true;
    } catch (error) {
      console.error('Referans ödülü hatası:', error);
      return false;
    }
  }

  // Kullanıcı bakiyesi kontrol
  static async checkBalance(userId: number): Promise<number> {
    try {
      const user = await db
        .select({ coins: users.coins })
        .from(users)
        .where(eq(users.id, userId))
        .then((res) => res[0]);

      return user?.coins || 0;
    } catch (error) {
      console.error('Bakiye kontrol hatası:', error);
      return 0;
    }
  }

  // Kullanıcının işlem geçmişini getir
  static async getTransactionHistory(userId: number): Promise<any[]> {
    try {
      const history = await db
        .select({
          id: transactions.id,
          type: transactions.type,
          amount: transactions.amount,
          description: transactions.description,
          createdAt: transactions.createdAt,
          relatedUser: {
            id: users.id,
            firstName: users.firstName,
            username: users.username
          }
        })
        .from(transactions)
        .leftJoin(users, eq(transactions.relatedUserId, users.id))
        .where(eq(transactions.userId, userId))
        .orderBy(desc(transactions.createdAt));

      return history;
    } catch (error) {
      console.error('İşlem geçmişi hatası:', error);
      return [];
    }
  }
}