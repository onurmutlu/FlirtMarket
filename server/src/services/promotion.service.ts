import { db } from '../db';
import { eq, and, or, isNull, lte, gte, sql } from 'drizzle-orm';
import { users, USER_TYPES } from '@shared/schema';
import { promotions, type Promotion } from '@shared/monetization-schema';
import { TelegramService } from './telegram.service';

export class PromotionService {
  private telegramService: TelegramService;

  constructor() {
    this.telegramService = new TelegramService();
  }

  /**
   * Create a time-limited promotion
   */
  async createPromotion(type: string, discountPercentage: number, durationHours: number, targetUserIds?: number[]): Promise<Promotion> {
    try {
      const startTime = new Date();
      const endTime = new Date();
      endTime.setHours(endTime.getHours() + durationHours);
      
      const [promotion] = await db
        .insert(promotions)
        .values({
          type,
          discountPercentage,
          startTime,
          endTime,
          targetUserIds: targetUserIds ? targetUserIds : null,
          isActive: true
        })
        .returning();
      
      // If targeting specific users, send them notifications
      if (targetUserIds && targetUserIds.length) {
        for (const userId of targetUserIds) {
          const user = await db
            .select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);
          
          if (user.length && user[0].telegramId) {
            this.telegramService.sendNotification(
              user[0].telegramId,
              `🔥 Özel teklif! ${discountPercentage}% ekstra coin bonusu sadece ${durationHours} saat geçerli!`
            );
          }
        }
      } else {
        // Broadcast to all users (in a real implementation, this would be batched)
        this.broadcastPromotion(
          `🔥 Sınırlı süre teklifi! Tüm coin paketlerinde ${discountPercentage}% ekstra bonus ${durationHours} saat boyunca geçerli!`
        );
      }
      
      return promotion;
    } catch (error) {
      console.error('Error creating promotion:', error);
      throw new Error('Failed to create promotion');
    }
  }
  
  /**
   * Get active promotions for a user
   */
  async getUserPromotions(userId: number): Promise<Promotion[]> {
    try {
      const now = new Date();
      
      // Get global promotions
      const globalPromotions = await db
        .select()
        .from(promotions)
        .where(
          and(
            isNull(promotions.targetUserIds),
            eq(promotions.isActive, true),
            lte(promotions.startTime, now),
            gte(promotions.endTime, now)
          )
        );
      
      // Get user-specific promotions
      const userPromotions = await db
        .select()
        .from(promotions)
        .where(
          and(
            sql`${promotions.targetUserIds} @> '[${userId}]'::jsonb`,
            eq(promotions.isActive, true),
            lte(promotions.startTime, now),
            gte(promotions.endTime, now)
          )
        );
      
      return [...globalPromotions, ...userPromotions];
    } catch (error) {
      console.error('Error getting user promotions:', error);
      return [];
    }
  }
  
  /**
   * Generate personalized FOMO notifications
   */
  async generateFomoNotifications(): Promise<void> {
    try {
      // Get users who haven't purchased in the last 7 days
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      
      const inactiveUsers = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.type, USER_TYPES.REGULAR),
            lte(users.lastActive, lastWeek)
          )
        )
        .limit(100); // Process in batches
      
      // Generate personalized offers for these users
      for (const user of inactiveUsers) {
        // Create a personalized discount
        const discountPercentage = 10 + Math.floor(Math.random() * 15); // 10-25% discount
        await this.createPromotion('purchase', discountPercentage, 24, [user.id]);
      }
      
      // Notify users about new performers
      const lastDay = new Date();
      lastDay.setDate(lastDay.getDate() - 1);
      
      const newPerformers = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.type, USER_TYPES.PERFORMER),
            gte(users.createdAt, lastDay)
          )
        );
      
      if (newPerformers.length > 0) {
        const count = newPerformers.length;
        this.broadcastPromotion(`✨ Bugün ${count} yeni performer katıldı! Hemen profillerini incele!`);
      }
    } catch (error) {
      console.error('Error generating FOMO notifications:', error);
    }
  }
  
  /**
   * Broadcast a promotion to all users
   */
  private async broadcastPromotion(message: string): Promise<void> {
    try {
      // In a real implementation, this would be batched and possibly queued
      const users = await db
        .select()
        .from(users)
        .where(eq(users.type, USER_TYPES.REGULAR))
        .limit(1000); // Process in batches
      
      for (const user of users) {
        if (user.telegramId) {
          this.telegramService.sendNotification(user.telegramId, message);
        }
      }
    } catch (error) {
      console.error('Error broadcasting promotion:', error);
    }
  }
  
  /**
   * Create a flash sale (limited time offer)
   */
  async createFlashSale(discountPercentage: number, durationHours: number): Promise<Promotion> {
    try {
      return await this.createPromotion('flash_sale', discountPercentage, durationHours);
    } catch (error) {
      console.error('Error creating flash sale:', error);
      throw new Error('Failed to create flash sale');
    }
  }
  
  /**
   * Create a special event promotion (e.g., holidays)
   */
  async createSpecialEventPromotion(eventName: string, discountPercentage: number, durationHours: number): Promise<Promotion> {
    try {
      const promotion = await this.createPromotion('special_event', discountPercentage, durationHours);
      
      // Broadcast special event message
      this.broadcastPromotion(
        `🎉 ${eventName} özel teklifi! Tüm coin paketlerinde ${discountPercentage}% ekstra bonus ${durationHours} saat boyunca geçerli!`
      );
      
      return promotion;
    } catch (error) {
      console.error('Error creating special event promotion:', error);
      throw new Error('Failed to create special event promotion');
    }
  }
}

export default new PromotionService();
