import { db } from '../db';
import { eq, and, sql, gte } from 'drizzle-orm';
import { users, transactions } from '@shared/schema';
import { 
  lootboxes, lootboxRewards, lootboxOpenings, boosts, userTasks,
  type Lootbox, type LootboxReward, type LootboxOpening 
} from '@shared/monetization-schema';
import { TelegramService } from './telegram.service';

interface FormattedReward {
  id: number;
  type: string;
  amount: number;
  description: string;
  imageUrl?: string;
}

export class LootboxService {
  private telegramService: TelegramService;

  constructor() {
    this.telegramService = new TelegramService();
  }

  /**
   * Get all available lootboxes
   */
  async getAvailableLootboxes(): Promise<Lootbox[]> {
    try {
      return await db
        .select()
        .from(lootboxes)
        .where(eq(lootboxes.isActive, true))
        .orderBy(sql`${lootboxes.price} ASC`);
    } catch (error) {
      console.error('Error getting available lootboxes:', error);
      throw new Error('Failed to get available lootboxes');
    }
  }
  
  /**
   * Open a lootbox and get a random reward
   */
  async openLootbox(userId: number, lootboxId: number): Promise<FormattedReward> {
    try {
      return await db.transaction(async (tx) => {
        // Get lootbox details
        const lootbox = await tx
          .select()
          .from(lootboxes)
          .where(
            and(
              eq(lootboxes.id, lootboxId),
              eq(lootboxes.isActive, true)
            )
          )
          .limit(1);
        
        if (!lootbox.length) throw new Error("Lootbox not found");
        
        // Check if user has enough coins (if not free)
        if (lootbox[0].price > 0) {
          const user = await tx
            .select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);
          
          if (!user.length || user[0].coins < lootbox[0].price) {
            throw new Error("Insufficient coins");
          }
          
          // Deduct coins
          await tx
            .update(users)
            .set({ coins: sql`${users.coins} - ${lootbox[0].price}` })
            .where(eq(users.id, userId));
          
          // Create transaction record
          await tx
            .insert(transactions)
            .values({
              userId,
              type: 'spend',
              amount: -lootbox[0].price,
              description: `"${lootbox[0].name}" sürpriz kutusunu açtı`
            });
        }
        
        // Get possible rewards for this lootbox
        const possibleRewards = await tx
          .select()
          .from(lootboxRewards)
          .where(eq(lootboxRewards.lootboxId, lootboxId));
        
        if (!possibleRewards.length) throw new Error("No rewards available for this lootbox");
        
        // Select a random reward based on probability
        const reward = this.selectRandomReward(possibleRewards);
        
        // Process the reward
        await this.processReward(tx, userId, reward);
        
        // Create lootbox opening record
        const [opening] = await tx
          .insert(lootboxOpenings)
          .values({
            userId,
            lootboxId,
            rewardId: reward.id
          })
          .returning();
        
        // Format reward for response
        const formattedReward = await this.formatReward(reward);
        
        // Notify user
        const user = await tx
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);
        
        if (user.length && user[0].telegramId) {
          this.telegramService.sendNotification(
            user[0].telegramId,
            `🎉 "${lootbox[0].name}" sürpriz kutusunu açtın ve ${formattedReward.description} kazandın!`
          );
        }
        
        return formattedReward;
      });
    } catch (error) {
      console.error('Error opening lootbox:', error);
      throw new Error('Failed to open lootbox');
    }
  }
  
  /**
   * Select a random reward based on probability
   */
  private selectRandomReward(rewards: LootboxReward[]): LootboxReward {
    // Calculate total probability
    const totalProbability = rewards.reduce((sum, reward) => sum + reward.probability, 0);
    
    // Generate random number
    const random = Math.floor(Math.random() * totalProbability);
    
    // Select reward based on probability
    let cumulativeProbability = 0;
    for (const reward of rewards) {
      cumulativeProbability += reward.probability;
      if (random < cumulativeProbability) {
        return reward;
      }
    }
    
    // Fallback to first reward (should never happen)
    return rewards[0];
  }
  
  /**
   * Process the reward
   */
  private async processReward(tx: any, userId: number, reward: LootboxReward): Promise<void> {
    switch (reward.rewardType) {
      case 'coins':
        // Add coins to user
        await tx
          .update(users)
          .set({ coins: sql`${users.coins} + ${reward.rewardAmount}` })
          .where(eq(users.id, userId));
        
        // Create transaction record
        await tx
          .insert(transactions)
          .values({
            userId,
            type: 'earn',
            amount: reward.rewardAmount,
            description: `Sürpriz kutu ödülü: ${reward.rewardAmount} coin`
          });
        break;
        
      case 'boost':
        // Add boost to user
        if (reward.rewardAmount) {
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + reward.rewardAmount);
          
          await tx
            .insert(boosts)
            .values({
              userId,
              type: 'profile',
              expiresAt
            });
        }
        break;
        
      case 'task_progress':
        // Boost progress on a specific task
        if (reward.rewardId && reward.rewardAmount) {
          const userTask = await tx
            .select()
            .from(userTasks)
            .where(
              and(
                eq(userTasks.userId, userId),
                eq(userTasks.taskId, reward.rewardId)
              )
            )
            .limit(1);
          
          if (userTask.length) {
            // Update existing task progress
            await tx
              .update(userTasks)
              .set({ 
                progress: sql`${userTasks.progress} + ${reward.rewardAmount}`,
                updatedAt: new Date()
              })
              .where(
                and(
                  eq(userTasks.userId, userId),
                  eq(userTasks.taskId, reward.rewardId)
                )
              );
          } else {
            // Create new task progress
            await tx
              .insert(userTasks)
              .values({
                userId,
                taskId: reward.rewardId,
                progress: reward.rewardAmount,
                completed: false,
                rewardClaimed: false
              });
          }
        }
        break;
        
      case 'message_discount':
        // This would be implemented with a separate discount system
        // For now, we'll just log it
        console.log(`User ${userId} received a message discount: ${reward.rewardAmount}%`);
        break;
    }
  }
  
  /**
   * Format reward for response
   */
  private async formatReward(reward: LootboxReward): Promise<FormattedReward> {
    let description = '';
    
    switch (reward.rewardType) {
      case 'coins':
        description = `${reward.rewardAmount} coin`;
        break;
      case 'boost':
        description = `${reward.rewardAmount} saatlik profil öne çıkarma`;
        break;
      case 'task_progress':
        if (reward.rewardId) {
          const task = await db
            .select()
            .from(userTasks)
            .where(eq(userTasks.id, reward.rewardId))
            .limit(1);
          
          description = task.length 
            ? `"${task[0].title}" görevinde ${reward.rewardAmount} ilerleme`
            : `Görev ilerlemesi`;
        } else {
          description = `Görev ilerlemesi`;
        }
        break;
      case 'message_discount':
        description = `Sonraki mesajında %${reward.rewardAmount} indirim`;
        break;
      default:
        description = `${reward.rewardType} ödülü`;
    }
    
    return {
      id: reward.id,
      type: reward.rewardType,
      amount: reward.rewardAmount || 0,
      description,
      imageUrl: '' // This could be added later
    };
  }
  
  /**
   * Check if user can open free daily lootbox
   */
  async canOpenFreeLootbox(userId: number): Promise<boolean> {
    try {
      // Check if user has already opened a free lootbox today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const freeLootbox = await db
        .select()
        .from(lootboxes)
        .where(
          and(
            eq(lootboxes.price, 0),
            eq(lootboxes.isActive, true)
          )
        )
        .limit(1);
      
      if (!freeLootbox.length) return false;
      
      const recentOpenings = await db
        .select()
        .from(lootboxOpenings)
        .where(
          and(
            eq(lootboxOpenings.userId, userId),
            eq(lootboxOpenings.lootboxId, freeLootbox[0].id),
            gte(lootboxOpenings.createdAt, today)
          )
        );
      
      return recentOpenings.length === 0;
    } catch (error) {
      console.error('Error checking free lootbox availability:', error);
      return false;
    }
  }
  
  /**
   * Create a new lootbox
   */
  async createLootbox(lootboxData: Omit<Lootbox, 'id' | 'createdAt'>): Promise<Lootbox> {
    try {
      const [lootbox] = await db
        .insert(lootboxes)
        .values(lootboxData)
        .returning();
      
      return lootbox;
    } catch (error) {
      console.error('Error creating lootbox:', error);
      throw new Error('Failed to create lootbox');
    }
  }
  
  /**
   * Add a reward to a lootbox
   */
  async addLootboxReward(rewardData: Omit<LootboxReward, 'id' | 'createdAt'>): Promise<LootboxReward> {
    try {
      const [reward] = await db
        .insert(lootboxRewards)
        .values(rewardData)
        .returning();
      
      return reward;
    } catch (error) {
      console.error('Error adding lootbox reward:', error);
      throw new Error('Failed to add lootbox reward');
    }
  }
  
  /**
   * Initialize default lootboxes
   */
  async initializeDefaultLootboxes(): Promise<void> {
    try {
      // Check if lootboxes already exist
      const existingLootboxes = await db
        .select({ count: sql`COUNT(*)` })
        .from(lootboxes);
      
      if (Number(existingLootboxes[0].count) > 0) return;
      
      // Create free daily lootbox
      const dailyLootbox = await this.createLootbox({
        name: 'Günlük Sürpriz Kutu',
        description: 'Her gün ücretsiz açabileceğin sürpriz kutu',
        price: 0,
        imageUrl: '/images/lootboxes/daily.png',
        isActive: true
      });
      
      // Create premium lootboxes
      const basicLootbox = await this.createLootbox({
        name: 'Temel Sürpriz Kutu',
        description: 'Küçük ödüller içeren sürpriz kutu',
        price: 50,
        imageUrl: '/images/lootboxes/basic.png',
        isActive: true
      });
      
      const premiumLootbox = await this.createLootbox({
        name: 'Premium Sürpriz Kutu',
        description: 'Daha değerli ödüller içeren sürpriz kutu',
        price: 100,
        imageUrl: '/images/lootboxes/premium.png',
        isActive: true
      });
      
      const vipLootbox = await this.createLootbox({
        name: 'VIP Sürpriz Kutu',
        description: 'En değerli ödüller içeren sürpriz kutu',
        price: 200,
        imageUrl: '/images/lootboxes/vip.png',
        isActive: true
      });
      
      // Add rewards to daily lootbox
      await this.addLootboxReward({
        lootboxId: dailyLootbox.id,
        rewardType: 'coins',
        rewardAmount: 5,
        probability: 50
      });
      
      await this.addLootboxReward({
        lootboxId: dailyLootbox.id,
        rewardType: 'coins',
        rewardAmount: 10,
        probability: 30
      });
      
      await this.addLootboxReward({
        lootboxId: dailyLootbox.id,
        rewardType: 'coins',
        rewardAmount: 20,
        probability: 15
      });
      
      await this.addLootboxReward({
        lootboxId: dailyLootbox.id,
        rewardType: 'boost',
        rewardAmount: 1, // 1 hour boost
        probability: 5
      });
      
      // Add rewards to basic lootbox
      await this.addLootboxReward({
        lootboxId: basicLootbox.id,
        rewardType: 'coins',
        rewardAmount: 20,
        probability: 40
      });
      
      await this.addLootboxReward({
        lootboxId: basicLootbox.id,
        rewardType: 'coins',
        rewardAmount: 50,
        probability: 30
      });
      
      await this.addLootboxReward({
        lootboxId: basicLootbox.id,
        rewardType: 'boost',
        rewardAmount: 3, // 3 hour boost
        probability: 20
      });
      
      await this.addLootboxReward({
        lootboxId: basicLootbox.id,
        rewardType: 'message_discount',
        rewardAmount: 50, // 50% discount
        probability: 10
      });
      
      // Add rewards to premium lootbox
      await this.addLootboxReward({
        lootboxId: premiumLootbox.id,
        rewardType: 'coins',
        rewardAmount: 50,
        probability: 30
      });
      
      await this.addLootboxReward({
        lootboxId: premiumLootbox.id,
        rewardType: 'coins',
        rewardAmount: 100,
        probability: 40
      });
      
      await this.addLootboxReward({
        lootboxId: premiumLootbox.id,
        rewardType: 'boost',
        rewardAmount: 6, // 6 hour boost
        probability: 20
      });
      
      await this.addLootboxReward({
        lootboxId: premiumLootbox.id,
        rewardType: 'coins',
        rewardAmount: 200,
        probability: 10
      });
      
      // Add rewards to VIP lootbox
      await this.addLootboxReward({
        lootboxId: vipLootbox.id,
        rewardType: 'coins',
        rewardAmount: 100,
        probability: 30
      });
      
      await this.addLootboxReward({
        lootboxId: vipLootbox.id,
        rewardType: 'coins',
        rewardAmount: 200,
        probability: 40
      });
      
      await this.addLootboxReward({
        lootboxId: vipLootbox.id,
        rewardType: 'boost',
        rewardAmount: 24, // 24 hour boost
        probability: 20
      });
      
      await this.addLootboxReward({
        lootboxId: vipLootbox.id,
        rewardType: 'coins',
        rewardAmount: 500,
        probability: 10
      });
      
      console.log('Default lootboxes initialized');
    } catch (error) {
      console.error('Error initializing default lootboxes:', error);
    }
  }
}

export default new LootboxService();
