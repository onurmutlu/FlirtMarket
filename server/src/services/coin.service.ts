import { db } from '../db';
import { eq, sql } from 'drizzle-orm';
import { users, transactions } from '@shared/schema';
import { coinPackages, type CoinPackage } from '@shared/monetization-schema';
import { PromotionService } from './promotion.service';

export class CoinService {
  private promotionService: PromotionService;

  constructor() {
    this.promotionService = new PromotionService();
  }

  /**
   * Get available coin packages with dynamic pricing
   */
  async getCoinPackages(userId: number): Promise<CoinPackage[]> {
    try {
      // Check if this is the user's first purchase
      const isFirstPurchase = await this.isFirstPurchase(userId);
      
      // Get base packages
      let packages = await db
        .select()
        .from(coinPackages)
        .where(eq(coinPackages.isActive, true));
      
      // Apply dynamic pricing based on user behavior, time, etc.
      packages = await this.applyDynamicPricing(packages, {
        userId,
        isFirstPurchase,
        isWeekend: this.isWeekend()
      });
      
      return packages;
    } catch (error) {
      console.error('Error getting coin packages:', error);
      throw new Error('Failed to get coin packages');
    }
  }
  
  /**
   * Process coin purchase
   */
  async purchaseCoins(userId: number, packageId: number, paymentMethod: string): Promise<any> {
    try {
      return await db.transaction(async (tx) => {
        // Get the package
        const pkg = await tx
          .select()
          .from(coinPackages)
          .where(eq(coinPackages.id, packageId))
          .limit(1);
        
        if (!pkg.length) throw new Error("Package not found");
        
        const coinPackage = pkg[0];
        const isFirstPurchase = await this.isFirstPurchase(userId);
        
        // Calculate bonus
        let bonusMultiplier = 1 + (coinPackage.bonusPercentage / 100);
        if (isFirstPurchase) bonusMultiplier += 0.5; // 50% extra for first purchase
        
        const totalCoins = Math.floor(coinPackage.amount * bonusMultiplier);
        
        // In a real implementation, you would integrate with a payment provider here
        // For now, we'll simulate a successful payment
        const paymentResult = { success: true };
        
        if (!paymentResult.success) throw new Error("Payment failed");
        
        // Add coins to user account
        await tx
          .update(users)
          .set({ coins: sql`${users.coins} + ${totalCoins}` })
          .where(eq(users.id, userId));
        
        // Create transaction record
        const [transaction] = await tx
          .insert(transactions)
          .values({
            userId,
            type: 'purchase',
            amount: totalCoins,
            description: `Purchase of ${coinPackage.name} coin package${isFirstPurchase ? ' with first-time bonus' : ''}`
          })
          .returning();
        
        // Process any affiliate commissions
        // This would be implemented in a separate service
        
        return {
          transaction,
          totalCoins,
          isFirstPurchase
        };
      });
    } catch (error) {
      console.error('Error purchasing coins:', error);
      throw new Error('Failed to process coin purchase');
    }
  }
  
  /**
   * Check if this is the user's first purchase
   */
  async isFirstPurchase(userId: number): Promise<boolean> {
    try {
      const previousPurchases = await db
        .select()
        .from(transactions)
        .where(
          eq(transactions.userId, userId),
          eq(transactions.type, 'purchase')
        )
        .limit(1);
      
      return previousPurchases.length === 0;
    } catch (error) {
      console.error('Error checking first purchase:', error);
      return false;
    }
  }
  
  /**
   * Apply dynamic pricing based on various factors
   */
  private async applyDynamicPricing(packages: CoinPackage[], options: {
    userId: number;
    isFirstPurchase: boolean;
    isWeekend: boolean;
  }): Promise<CoinPackage[]> {
    try {
      // Get active promotions for the user
      const activePromotions = await this.promotionService.getUserPromotions(options.userId);
      
      // Apply promotions to packages
      return packages.map(pkg => {
        let bonusPercentage = pkg.bonusPercentage;
        
        // Apply first purchase bonus indicator
        if (options.isFirstPurchase) {
          bonusPercentage += 50; // Show +50% for first purchase
        }
        
        // Apply weekend bonus
        if (options.isWeekend) {
          bonusPercentage += 10; // +10% on weekends
        }
        
        // Apply any active promotions
        if (activePromotions.length > 0) {
          // Use the highest discount
          const highestDiscount = Math.max(...activePromotions.map(p => p.discountPercentage));
          bonusPercentage += highestDiscount;
        }
        
        return {
          ...pkg,
          bonusPercentage
        };
      });
    } catch (error) {
      console.error('Error applying dynamic pricing:', error);
      return packages; // Return original packages on error
    }
  }
  
  /**
   * Check if today is a weekend
   */
  private isWeekend(): boolean {
    const day = new Date().getDay();
    return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
  }
}

export default new CoinService();
