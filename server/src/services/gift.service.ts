import { db } from '../db';
import { eq, and, desc, sql, gte } from 'drizzle-orm';
import { users, transactions, USER_TYPES } from '@shared/schema';
import { gifts, giftTransactions, type Gift, type GiftTransaction } from '@shared/monetization-schema';
import { TelegramService } from './telegram.service';

interface GiftLeaderboardEntry {
  userId: number;
  displayName: string;
  totalGifts: number;
  totalValue: number;
  profilePhoto?: string | null;
}

export class GiftService {
  private telegramService: TelegramService;

  constructor() {
    this.telegramService = new TelegramService();
  }

  /**
   * Get all available gifts
   */
  async getAvailableGifts(): Promise<Gift[]> {
    try {
      return await db
        .select()
        .from(gifts)
        .where(eq(gifts.isActive, true))
        .orderBy(sql`${gifts.price} ASC`);
    } catch (error) {
      console.error('Error getting available gifts:', error);
      throw new Error('Failed to get available gifts');
    }
  }
  
  /**
   * Send a gift from one user to another
   */
  async sendGift(senderId: number, recipientId: number, giftId: number, messageId?: number): Promise<GiftTransaction> {
    try {
      return await db.transaction(async (tx) => {
        // Get gift details
        const gift = await tx
          .select()
          .from(gifts)
          .where(eq(gifts.id, giftId))
          .limit(1);
        
        if (!gift.length) throw new Error("Gift not found");
        
        // Check if sender has enough coins
        const sender = await tx
          .select()
          .from(users)
          .where(eq(users.id, senderId))
          .limit(1);
        
        if (!sender.length || sender[0].coins < gift[0].price) {
          throw new Error("Insufficient coins");
        }
        
        // Verify recipient exists and is a performer
        const recipient = await tx
          .select()
          .from(users)
          .where(eq(users.id, recipientId))
          .limit(1);
        
        if (!recipient.length || recipient[0].type !== USER_TYPES.PERFORMER) {
          throw new Error("Invalid recipient");
        }
        
        // Deduct coins from sender
        await tx
          .update(users)
          .set({ coins: sql`${users.coins} - ${gift[0].price}` })
          .where(eq(users.id, senderId));
        
        // Add coins to recipient (minus platform fee)
        const platformFeePercentage = 20; // 20% platform fee
        const recipientEarnings = Math.floor(gift[0].price * (1 - platformFeePercentage / 100));
        
        await tx
          .update(users)
          .set({ coins: sql`${users.coins} + ${recipientEarnings}` })
          .where(eq(users.id, recipientId));
        
        // Create transaction records
        await tx
          .insert(transactions)
          .values({
            userId: senderId,
            type: 'spend',
            amount: -gift[0].price,
            description: `Sent "${gift[0].name}" gift to ${recipient[0].firstName}`,
            relatedUserId: recipientId
          });
        
        await tx
          .insert(transactions)
          .values({
            userId: recipientId,
            type: 'earn',
            amount: recipientEarnings,
            description: `Received "${gift[0].name}" gift from ${sender[0].firstName}`,
            relatedUserId: senderId
          });
        
        // Create gift transaction record
        const [giftTransaction] = await tx
          .insert(giftTransactions)
          .values({
            giftId,
            senderId,
            recipientId,
            messageId
          })
          .returning();
        
        // Notify recipient via Telegram
        if (recipient[0].telegramId) {
          this.telegramService.sendNotification(
            recipient[0].telegramId,
            `🎁 ${sender[0].firstName} sent you a "${gift[0].name}" gift worth ${gift[0].price} coins!`
          );
        }
        
        // Update gift leaderboard (could be implemented with Redis for better performance)
        await this.updateGiftLeaderboard(recipientId, gift[0].price);
        
        return giftTransaction;
      });
    } catch (error) {
      console.error('Error sending gift:', error);
      throw new Error('Failed to send gift');
    }
  }
  
  /**
   * Get gift leaderboard for a specific time period
   */
  async getGiftLeaderboard(period: 'daily' | 'weekly' | 'monthly' = 'weekly'): Promise<GiftLeaderboardEntry[]> {
    try {
      const startDate = new Date();
      
      if (period === 'daily') {
        startDate.setDate(startDate.getDate() - 1);
      } else if (period === 'weekly') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (period === 'monthly') {
        startDate.setMonth(startDate.getMonth() - 1);
      }
      
      // Get top gift recipients
      const leaderboard = await db
        .select({
          userId: giftTransactions.recipientId,
          totalGifts: sql`COUNT(*)`,
          totalValue: sql`SUM(${gifts.price})`
        })
        .from(giftTransactions)
        .innerJoin(gifts, eq(giftTransactions.giftId, gifts.id))
        .where(gte(giftTransactions.createdAt, startDate))
        .groupBy(giftTransactions.recipientId)
        .orderBy(sql`SUM(${gifts.price}) DESC`)
        .limit(10);
      
      // Get user details for each leaderboard entry
      const result: GiftLeaderboardEntry[] = [];
      
      for (const entry of leaderboard) {
        const user = await db
          .select()
          .from(users)
          .where(eq(users.id, entry.userId))
          .limit(1);
        
        if (user.length) {
          result.push({
            userId: entry.userId,
            displayName: `${user[0].firstName} ${user[0].lastName || ''}`.trim(),
            totalGifts: Number(entry.totalGifts),
            totalValue: Number(entry.totalValue),
            profilePhoto: user[0].profilePhoto
          });
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error getting gift leaderboard:', error);
      throw new Error('Failed to get gift leaderboard');
    }
  }
  
  /**
   * Update gift leaderboard (this could be implemented with Redis for better performance)
   */
  private async updateGiftLeaderboard(userId: number, giftValue: number): Promise<void> {
    try {
      // This is a placeholder for a more sophisticated leaderboard implementation
      // In a production environment, you might use Redis sorted sets for this
      console.log(`Updated gift leaderboard for user ${userId} with value ${giftValue}`);
    } catch (error) {
      console.error('Error updating gift leaderboard:', error);
    }
  }
}

export default new GiftService();
