import { db } from '../db';
import { eq, and, desc, sql, gte, lt } from 'drizzle-orm';
import { users, transactions, USER_TYPES } from '@shared/schema';
import { subscriptions, type Subscription } from '@shared/monetization-schema';
import { TelegramService } from './telegram.service';

interface ExclusiveContent {
  id: number;
  performerId: number;
  title: string;
  description: string;
  mediaUrl?: string;
  type: 'image' | 'video' | 'text';
  createdAt: Date;
}

export class SubscriptionService {
  private telegramService: TelegramService;

  constructor() {
    this.telegramService = new TelegramService();
  }

  /**
   * Subscribe to a performer's VIP content
   */
  async subscribe(subscriberId: number, performerId: number, durationDays: number): Promise<Subscription> {
    try {
      return await db.transaction(async (tx) => {
        // Verify both users exist and performer is actually a performer
        const performer = await tx
          .select()
          .from(users)
          .where(eq(users.id, performerId))
          .limit(1);
        
        if (!performer.length || performer[0].type !== USER_TYPES.PERFORMER) {
          throw new Error("Performer not found");
        }
        
        const subscriber = await tx
          .select()
          .from(users)
          .where(eq(users.id, subscriberId))
          .limit(1);
        
        if (!subscriber.length) throw new Error("Subscriber not found");
        
        // Calculate subscription price (could be dynamic based on performer's settings)
        const subscriptionPrice = await this.getSubscriptionPrice(performerId, durationDays);
        
        // Check if user has enough coins
        if (subscriber[0].coins < subscriptionPrice) {
          throw new Error("Insufficient coins");
        }
        
        // Calculate dates
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + durationDays);
        
        // Check if there's an existing active subscription
        const existingSubscription = await tx
          .select()
          .from(subscriptions)
          .where(
            and(
              eq(subscriptions.performerId, performerId),
              eq(subscriptions.subscriberId, subscriberId),
              eq(subscriptions.status, 'active'),
              gte(subscriptions.endDate, startDate)
            )
          )
          .limit(1);
        
        // If there's an existing subscription, extend it
        if (existingSubscription.length) {
          const newEndDate = new Date(existingSubscription[0].endDate);
          newEndDate.setDate(newEndDate.getDate() + durationDays);
          
          const [updatedSubscription] = await tx
            .update(subscriptions)
            .set({ 
              endDate: newEndDate,
              price: existingSubscription[0].price + subscriptionPrice
            })
            .where(eq(subscriptions.id, existingSubscription[0].id))
            .returning();
          
          // Process payment
          await this.processSubscriptionPayment(
            tx, subscriberId, performerId, subscriptionPrice, 
            `Subscription extension to ${performer[0].firstName}'s VIP club for ${durationDays} more days`
          );
          
          return updatedSubscription;
        }
        
        // Create new subscription
        const [newSubscription] = await tx
          .insert(subscriptions)
          .values({
            performerId,
            subscriberId,
            startDate,
            endDate,
            price: subscriptionPrice,
            status: 'active'
          })
          .returning();
        
        // Process payment
        await this.processSubscriptionPayment(
          tx, subscriberId, performerId, subscriptionPrice, 
          `Subscription to ${performer[0].firstName}'s VIP club for ${durationDays} days`
        );
        
        // Notify both users
        if (subscriber[0].telegramId) {
          this.telegramService.sendNotification(
            subscriber[0].telegramId,
            `🌟 ${performer[0].firstName}'in VIP kulübüne ${durationDays} günlüğüne abone oldun!`
          );
        }
        
        if (performer[0].telegramId) {
          this.telegramService.sendNotification(
            performer[0].telegramId,
            `💰 ${subscriber[0].firstName} senin VIP kulübüne abone oldu!`
          );
        }
        
        return newSubscription;
      });
    } catch (error) {
      console.error('Error subscribing to performer:', error);
      throw new Error('Failed to process subscription');
    }
  }
  
  /**
   * Process subscription payment
   */
  private async processSubscriptionPayment(
    tx: any, 
    subscriberId: number, 
    performerId: number, 
    amount: number, 
    description: string
  ): Promise<void> {
    // Deduct coins from subscriber
    await tx
      .update(users)
      .set({ coins: sql`${users.coins} - ${amount}` })
      .where(eq(users.id, subscriberId));
    
    // Add coins to performer (minus platform fee)
    const platformFeePercentage = 20; // 20% platform fee
    const performerEarnings = Math.floor(amount * (1 - platformFeePercentage / 100));
    
    await tx
      .update(users)
      .set({ coins: sql`${users.coins} + ${performerEarnings}` })
      .where(eq(users.id, performerId));
    
    // Create transaction records
    await tx
      .insert(transactions)
      .values({
        userId: subscriberId,
        type: 'spend',
        amount: -amount,
        description,
        relatedUserId: performerId
      });
    
    await tx
      .insert(transactions)
      .values({
        userId: performerId,
        type: 'earn',
        amount: performerEarnings,
        description: `Subscription earnings from a user`,
        relatedUserId: subscriberId
      });
  }
  
  /**
   * Get subscription price based on performer settings and duration
   */
  async getSubscriptionPrice(performerId: number, durationDays: number): Promise<number> {
    try {
      // In a real implementation, this would be based on performer settings
      // For now, we'll use a simple calculation
      const basePrice = 100; // 100 coins per day
      return basePrice * durationDays;
    } catch (error) {
      console.error('Error getting subscription price:', error);
      throw new Error('Failed to calculate subscription price');
    }
  }
  
  /**
   * Get active subscription for a user and performer
   */
  async getActiveSubscription(subscriberId: number, performerId: number): Promise<Subscription | null> {
    try {
      const now = new Date();
      
      const activeSubscription = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.subscriberId, subscriberId),
            eq(subscriptions.performerId, performerId),
            eq(subscriptions.status, 'active'),
            gte(subscriptions.endDate, now)
          )
        )
        .limit(1);
      
      return activeSubscription.length ? activeSubscription[0] : null;
    } catch (error) {
      console.error('Error getting active subscription:', error);
      return null;
    }
  }
  
  /**
   * Get all active subscriptions for a subscriber
   */
  async getUserSubscriptions(subscriberId: number): Promise<Subscription[]> {
    try {
      const now = new Date();
      
      return await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.subscriberId, subscriberId),
            eq(subscriptions.status, 'active'),
            gte(subscriptions.endDate, now)
          )
        );
    } catch (error) {
      console.error('Error getting user subscriptions:', error);
      return [];
    }
  }
  
  /**
   * Get all subscribers for a performer
   */
  async getPerformerSubscribers(performerId: number): Promise<number> {
    try {
      const now = new Date();
      
      const result = await db
        .select({ count: sql`COUNT(*)` })
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.performerId, performerId),
            eq(subscriptions.status, 'active'),
            gte(subscriptions.endDate, now)
          )
        );
      
      return Number(result[0].count);
    } catch (error) {
      console.error('Error getting performer subscribers:', error);
      return 0;
    }
  }
  
  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: number, userId: number): Promise<boolean> {
    try {
      // Verify the subscription belongs to the user
      const subscription = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.id, subscriptionId),
            eq(subscriptions.subscriberId, userId),
            eq(subscriptions.status, 'active')
          )
        )
        .limit(1);
      
      if (!subscription.length) throw new Error("Subscription not found");
      
      // Update subscription status
      await db
        .update(subscriptions)
        .set({ status: 'cancelled' })
        .where(eq(subscriptions.id, subscriptionId));
      
      return true;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return false;
    }
  }
  
  /**
   * Process expired subscriptions
   */
  async processExpiredSubscriptions(): Promise<void> {
    try {
      const now = new Date();
      
      // Find expired but still active subscriptions
      const expiredSubscriptions = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.status, 'active'),
            lt(subscriptions.endDate, now)
          )
        );
      
      // Update them to expired
      for (const subscription of expiredSubscriptions) {
        await db
          .update(subscriptions)
          .set({ status: 'expired' })
          .where(eq(subscriptions.id, subscription.id));
        
        // Notify subscriber
        const subscriber = await db
          .select()
          .from(users)
          .where(eq(users.id, subscription.subscriberId))
          .limit(1);
        
        if (subscriber.length && subscriber[0].telegramId) {
          this.telegramService.sendNotification(
            subscriber[0].telegramId,
            `⏰ VIP aboneliğin sona erdi. Yenilemek için profili ziyaret et!`
          );
        }
      }
    } catch (error) {
      console.error('Error processing expired subscriptions:', error);
    }
  }
}

export default new SubscriptionService();
