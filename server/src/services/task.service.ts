import { db } from '../db';
import { eq, and, or, desc, sql } from 'drizzle-orm';
import { users, transactions, USER_TYPES } from '@shared/schema';
import { tasks, userTasks, boosts, type Task, type UserTask } from '@shared/monetization-schema';
import { TelegramService } from './telegram.service';

interface TaskProgress {
  task: Task;
  progress: number;
  completed: boolean;
  rewardClaimed: boolean;
}

export class TaskService {
  private telegramService: TelegramService;

  constructor() {
    this.telegramService = new TelegramService();
  }

  /**
   * Get all available tasks for a user
   */
  async getUserTasks(userId: number): Promise<TaskProgress[]> {
    try {
      // Get user type
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      if (!user.length) throw new Error("User not found");
      
      const userType = user[0].type === USER_TYPES.PERFORMER ? 'performer' : 'regular';
      
      // Get all active tasks for this user type
      const activeTasks = await db
        .select()
        .from(tasks)
        .where(
          and(
            eq(tasks.isActive, true),
            or(
              eq(tasks.userType, userType),
              eq(tasks.userType, 'all')
            )
          )
        );
      
      // Get user's progress on these tasks
      const result: TaskProgress[] = [];
      
      for (const task of activeTasks) {
        const userTask = await db
          .select()
          .from(userTasks)
          .where(
            and(
              eq(userTasks.userId, userId),
              eq(userTasks.taskId, task.id)
            )
          )
          .limit(1);
        
        result.push({
          task,
          progress: userTask.length ? userTask[0].progress : 0,
          completed: userTask.length ? userTask[0].completed : false,
          rewardClaimed: userTask.length ? userTask[0].rewardClaimed : false
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error getting user tasks:', error);
      throw new Error('Failed to get user tasks');
    }
  }
  
  /**
   * Track progress for a specific action type
   */
  async trackTaskProgress(userId: number, actionType: string, count: number = 1): Promise<void> {
    try {
      // Get user type
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      if (!user.length) return;
      
      const userType = user[0].type === USER_TYPES.PERFORMER ? 'performer' : 'regular';
      
      // Get all relevant tasks for this action type
      const relevantTasks = await db
        .select()
        .from(tasks)
        .where(
          and(
            eq(tasks.targetType, actionType),
            or(
              eq(tasks.userType, userType),
              eq(tasks.userType, 'all')
            ),
            eq(tasks.isActive, true)
          )
        );
      
      if (!relevantTasks.length) return;
      
      // Update progress for each relevant task
      for (const task of relevantTasks) {
        // Get user's current progress on this task
        const userTask = await db
          .select()
          .from(userTasks)
          .where(
            and(
              eq(userTasks.userId, userId),
              eq(userTasks.taskId, task.id)
            )
          )
          .limit(1);
        
        if (userTask.length) {
          // Task already exists, update progress
          if (!userTask[0].completed) {
            const newProgress = userTask[0].progress + count;
            const completed = newProgress >= task.targetCount;
            
            await db
              .update(userTasks)
              .set({ 
                progress: newProgress,
                completed,
                updatedAt: new Date()
              })
              .where(
                and(
                  eq(userTasks.userId, userId),
                  eq(userTasks.taskId, task.id)
                )
              );
            
            // If task is newly completed, notify user
            if (completed && !userTask[0].completed) {
              this.notifyTaskCompletion(userId, task);
            }
          }
        } else {
          // Create new user task record
          const newProgress = count;
          const completed = newProgress >= task.targetCount;
          
          await db
            .insert(userTasks)
            .values({
              userId,
              taskId: task.id,
              progress: newProgress,
              completed,
              rewardClaimed: false
            });
          
          // If completed immediately, notify user
          if (completed) {
            this.notifyTaskCompletion(userId, task);
          }
        }
      }
    } catch (error) {
      console.error('Error tracking task progress:', error);
    }
  }
  
  /**
   * Claim a task reward
   */
  async claimTaskReward(userId: number, userTaskId: number): Promise<boolean> {
    try {
      return await db.transaction(async (tx) => {
        // Get user task with task details
        const userTaskResult = await tx
          .select({
            userTask: userTasks,
            task: tasks
          })
          .from(userTasks)
          .innerJoin(tasks, eq(userTasks.taskId, tasks.id))
          .where(
            and(
              eq(userTasks.id, userTaskId),
              eq(userTasks.userId, userId),
              eq(userTasks.completed, true),
              eq(userTasks.rewardClaimed, false)
            )
          )
          .limit(1);
        
        if (!userTaskResult.length) throw new Error("Task reward not available");
        
        const { userTask, task } = userTaskResult[0];
        
        // Mark reward as claimed
        await tx
          .update(userTasks)
          .set({ rewardClaimed: true })
          .where(eq(userTasks.id, userTaskId));
        
        // Award the reward based on type
        if (task.rewardType === 'coins') {
          await tx
            .update(users)
            .set({ coins: sql`${users.coins} + ${task.rewardAmount}` })
            .where(eq(users.id, userId));
          
          // Create transaction record
          await tx
            .insert(transactions)
            .values({
              userId,
              type: 'earn',
              amount: task.rewardAmount,
              description: `Görev ödülü: ${task.title}`
            });
        } else if (task.rewardType === 'boost') {
          // Calculate expiration time
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + task.rewardAmount); // Reward amount is hours for boosts
          
          // Create boost record
          await tx
            .insert(boosts)
            .values({
              userId,
              type: 'profile', // Default to profile boost
              expiresAt
            });
        }
        
        // Notify user
        const user = await tx
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);
        
        if (user.length && user[0].telegramId) {
          this.telegramService.sendNotification(
            user[0].telegramId,
            `🎁 "${task.title}" görevini tamamladığın için ödülünü aldın!`
          );
        }
        
        return true;
      });
    } catch (error) {
      console.error('Error claiming task reward:', error);
      return false;
    }
  }
  
  /**
   * Create a new task
   */
  async createTask(taskData: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
    try {
      const [task] = await db
        .insert(tasks)
        .values(taskData)
        .returning();
      
      return task;
    } catch (error) {
      console.error('Error creating task:', error);
      throw new Error('Failed to create task');
    }
  }
  
  /**
   * Notify user about task completion
   */
  private async notifyTaskCompletion(userId: number, task: Task): Promise<void> {
    try {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      if (user.length && user[0].telegramId) {
        this.telegramService.sendNotification(
          user[0].telegramId,
          `🏆 "${task.title}" görevini tamamladın! ${task.rewardAmount} ${this.getRewardTypeText(task.rewardType)} ödülünü almak için görevler sayfasını ziyaret et!`
        );
      }
    } catch (error) {
      console.error('Error notifying task completion:', error);
    }
  }
  
  /**
   * Get human-readable reward type text
   */
  private getRewardTypeText(rewardType: string): string {
    switch (rewardType) {
      case 'coins':
        return 'coin';
      case 'boost':
        return 'saatlik profil öne çıkarma';
      default:
        return rewardType;
    }
  }
  
  /**
   * Initialize default tasks
   */
  async initializeDefaultTasks(): Promise<void> {
    try {
      // Check if tasks already exist
      const existingTasks = await db
        .select({ count: sql`COUNT(*)` })
        .from(tasks);
      
      if (Number(existingTasks[0].count) > 0) return;
      
      // Create default tasks for regular users
      const regularUserTasks = [
        {
          title: 'İlk Mesajını Gönder',
          description: 'Bir performera ilk mesajını gönder',
          type: 'achievement',
          targetType: 'send_message',
          targetCount: 1,
          rewardType: 'coins',
          rewardAmount: 10,
          userType: 'regular',
          isActive: true
        },
        {
          title: 'Günlük Mesajlaşma',
          description: 'Bugün 3 mesaj gönder',
          type: 'daily',
          targetType: 'send_message',
          targetCount: 3,
          rewardType: 'coins',
          rewardAmount: 5,
          userType: 'regular',
          isActive: true
        },
        {
          title: 'Bir Arkadaşını Davet Et',
          description: 'Referans kodunla bir arkadaşını platforma davet et',
          type: 'achievement',
          targetType: 'referral',
          targetCount: 1,
          rewardType: 'coins',
          rewardAmount: 20,
          userType: 'regular',
          isActive: true
        },
        {
          title: 'İlk Hediyeni Gönder',
          description: 'Bir performera hediye gönder',
          type: 'achievement',
          targetType: 'send_gift',
          targetCount: 1,
          rewardType: 'coins',
          rewardAmount: 15,
          userType: 'regular',
          isActive: true
        }
      ];
      
      // Create default tasks for performers
      const performerTasks = [
        {
          title: 'Hızlı Yanıt Ver',
          description: '10 mesaja 30 dakika içinde yanıt ver',
          type: 'achievement',
          targetType: 'quick_reply',
          targetCount: 10,
          rewardType: 'boost',
          rewardAmount: 24, // 24 hours of profile boost
          userType: 'performer',
          isActive: true
        },
        {
          title: 'Aktif Performer',
          description: 'Bugün 5 mesaja yanıt ver',
          type: 'daily',
          targetType: 'reply_message',
          targetCount: 5,
          rewardType: 'coins',
          rewardAmount: 10,
          userType: 'performer',
          isActive: true
        },
        {
          title: 'Popüler Performer',
          description: '10 farklı kullanıcıdan mesaj al',
          type: 'achievement',
          targetType: 'unique_chats',
          targetCount: 10,
          rewardType: 'boost',
          rewardAmount: 48, // 48 hours of profile boost
          userType: 'performer',
          isActive: true
        }
      ];
      
      // Insert all tasks
      for (const taskData of [...regularUserTasks, ...performerTasks]) {
        await this.createTask(taskData);
      }
      
      console.log('Default tasks initialized');
    } catch (error) {
      console.error('Error initializing default tasks:', error);
    }
  }
}

export default new TaskService();
