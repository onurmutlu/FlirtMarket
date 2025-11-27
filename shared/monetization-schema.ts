import { pgTable, varchar, serial, timestamp, text, jsonb, boolean, integer } from 'drizzle-orm/pg-core';
import { relations } from "drizzle-orm";
import { users, transactions } from "./schema";

// Coin packages
export const coinPackages = pgTable("coin_packages", {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  amount: integer('amount').notNull(),
  price: integer('price').notNull(), // in smallest currency unit (kuruş)
  bonusPercentage: integer('bonus_percentage').default(0),
  isVip: boolean('is_vip').default(false),
  isActive: boolean('is_active').default(true),
  validUntil: timestamp('valid_until'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Boosts for visibility
export const boosts = pgTable("boosts", {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  type: varchar('type').notNull(), // 'message', 'profile', etc.
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Subscriptions for performer VIP content
export const subscriptions = pgTable("subscriptions", {
  id: serial('id').primaryKey(),
  performerId: integer('performer_id').notNull(),
  subscriberId: integer('subscriber_id').notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  price: integer('price').notNull(), // in coins
  status: varchar('status').notNull(), // 'active', 'expired', 'cancelled'
  createdAt: timestamp('created_at').defaultNow(),
});

// Virtual gifts
export const gifts = pgTable("gifts", {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  description: text('description'),
  price: integer('price').notNull(), // in coins
  imageUrl: varchar('image_url'),
  animationUrl: varchar('animation_url'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Gift transactions
export const giftTransactions = pgTable("gift_transactions", {
  id: serial('id').primaryKey(),
  giftId: integer('gift_id').notNull(),
  senderId: integer('sender_id').notNull(),
  recipientId: integer('recipient_id').notNull(),
  messageId: integer('message_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Tasks and achievements
export const tasks = pgTable("tasks", {
  id: serial('id').primaryKey(),
  title: varchar('title').notNull(),
  description: text('description').notNull(),
  type: varchar('type').notNull(), // 'daily', 'weekly', 'achievement'
  targetType: varchar('target_type').notNull(), // 'messages', 'referrals', etc.
  targetCount: integer('target_count').notNull(),
  rewardType: varchar('reward_type').notNull(), // 'coins', 'boost', etc.
  rewardAmount: integer('reward_amount').notNull(),
  userType: varchar('user_type').notNull(), // 'regular', 'performer', 'all'
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// User task progress
export const userTasks = pgTable("user_tasks", {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  taskId: integer('task_id').notNull(),
  progress: integer('progress').default(0),
  completed: boolean('completed').default(false),
  rewardClaimed: boolean('reward_claimed').default(false),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Lootboxes (surprise boxes)
export const lootboxes = pgTable("lootboxes", {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  description: text('description'),
  price: integer('price').notNull(), // in coins, 0 for free boxes
  imageUrl: varchar('image_url'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Lootbox rewards
export const lootboxRewards = pgTable("lootbox_rewards", {
  id: serial('id').primaryKey(),
  lootboxId: integer('lootbox_id').notNull(),
  rewardType: varchar('reward_type').notNull(), // 'coins', 'gift', 'boost', etc.
  rewardId: integer('reward_id'), // ID of the specific reward if applicable
  rewardAmount: integer('reward_amount'), // Amount if applicable
  probability: integer('probability').notNull(), // 1-100
  createdAt: timestamp('created_at').defaultNow(),
});

// Lootbox openings
export const lootboxOpenings = pgTable("lootbox_openings", {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  lootboxId: integer('lootbox_id').notNull(),
  rewardId: integer('reward_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Affiliate program
export const affiliates = pgTable("affiliates", {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  code: varchar('code').notNull().unique(),
  commissionRate: integer('commission_rate').default(10), // percentage
  totalEarned: integer('total_earned').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Affiliate referrals
export const affiliateReferrals = pgTable("affiliate_referrals", {
  id: serial('id').primaryKey(),
  affiliateId: integer('affiliate_id').notNull(),
  referredUserId: integer('referred_user_id').notNull(),
  status: varchar('status').notNull(), // 'pending', 'active', 'expired'
  createdAt: timestamp('created_at').defaultNow(),
});

// Cashout requests
export const cashouts = pgTable("cashouts", {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  amount: integer('amount').notNull(), // in coins
  feeAmount: integer('fee_amount').notNull(),
  netAmount: integer('net_amount').notNull(),
  method: varchar('method').notNull(), // 'bank', 'paypal', etc.
  status: varchar('status').notNull(), // 'pending', 'approved', 'rejected'
  paymentDetails: jsonb('payment_details'),
  processedAt: timestamp('processed_at'),
  adminNotes: text('admin_notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Marketplace items
export const marketplaceItems = pgTable("marketplace_items", {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  description: text('description'),
  price: integer('price').notNull(), // in coins
  type: varchar('type').notNull(), // 'digital', 'physical', 'voucher'
  imageUrl: varchar('image_url'),
  stock: integer('stock').default(-1), // -1 for unlimited
  isVip: boolean('is_vip').default(false),
  isActive: boolean('is_active').default(true),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Marketplace purchases
export const marketplacePurchases = pgTable("marketplace_purchases", {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  itemId: integer('item_id').notNull(),
  price: integer('price').notNull(),
  status: varchar('status').notNull(), // 'pending', 'delivered', 'cancelled'
  createdAt: timestamp('created_at').defaultNow(),
});

// Special promotions
export const promotions = pgTable("promotions", {
  id: serial('id').primaryKey(),
  type: varchar('type').notNull(), // 'purchase', 'subscription', etc.
  discountPercentage: integer('discount_percentage').notNull(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  targetUserIds: jsonb('target_user_ids').$type<number[]>(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Type definitions
export type CoinPackage = typeof coinPackages.$inferSelect;
export type Boost = typeof boosts.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Gift = typeof gifts.$inferSelect;
export type GiftTransaction = typeof giftTransactions.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type UserTask = typeof userTasks.$inferSelect;
export type Lootbox = typeof lootboxes.$inferSelect;
export type LootboxReward = typeof lootboxRewards.$inferSelect;
export type LootboxOpening = typeof lootboxOpenings.$inferSelect;
export type Affiliate = typeof affiliates.$inferSelect;
export type AffiliateReferral = typeof affiliateReferrals.$inferSelect;
export type Cashout = typeof cashouts.$inferSelect;
export type MarketplaceItem = typeof marketplaceItems.$inferSelect;
export type MarketplacePurchase = typeof marketplacePurchases.$inferSelect;
export type Promotion = typeof promotions.$inferSelect;

// Relations
export const boostsRelations = relations(boosts, ({ one }) => ({
  user: one(users, {
    fields: [boosts.userId],
    references: [users.id]
  })
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  performer: one(users, {
    fields: [subscriptions.performerId],
    references: [users.id],
    relationName: 'performerSubscriptions'
  }),
  subscriber: one(users, {
    fields: [subscriptions.subscriberId],
    references: [users.id],
    relationName: 'subscribedTo'
  })
}));

export const giftTransactionsRelations = relations(giftTransactions, ({ one }) => ({
  gift: one(gifts, {
    fields: [giftTransactions.giftId],
    references: [gifts.id]
  }),
  sender: one(users, {
    fields: [giftTransactions.senderId],
    references: [users.id],
    relationName: 'sentGifts'
  }),
  recipient: one(users, {
    fields: [giftTransactions.recipientId],
    references: [users.id],
    relationName: 'receivedGifts'
  })
}));

export const userTasksRelations = relations(userTasks, ({ one }) => ({
  user: one(users, {
    fields: [userTasks.userId],
    references: [users.id]
  }),
  task: one(tasks, {
    fields: [userTasks.taskId],
    references: [tasks.id]
  })
}));

export const lootboxRewardsRelations = relations(lootboxRewards, ({ one }) => ({
  lootbox: one(lootboxes, {
    fields: [lootboxRewards.lootboxId],
    references: [lootboxes.id]
  })
}));

export const lootboxOpeningsRelations = relations(lootboxOpenings, ({ one }) => ({
  user: one(users, {
    fields: [lootboxOpenings.userId],
    references: [users.id]
  }),
  lootbox: one(lootboxes, {
    fields: [lootboxOpenings.lootboxId],
    references: [lootboxes.id]
  }),
  reward: one(lootboxRewards, {
    fields: [lootboxOpenings.rewardId],
    references: [lootboxRewards.id]
  })
}));

export const affiliatesRelations = relations(affiliates, ({ one, many }) => ({
  user: one(users, {
    fields: [affiliates.userId],
    references: [users.id]
  }),
  referrals: many(affiliateReferrals)
}));

export const affiliateReferralsRelations = relations(affiliateReferrals, ({ one }) => ({
  affiliate: one(affiliates, {
    fields: [affiliateReferrals.affiliateId],
    references: [affiliates.id]
  }),
  referredUser: one(users, {
    fields: [affiliateReferrals.referredUserId],
    references: [users.id]
  })
}));

export const cashoutsRelations = relations(cashouts, ({ one }) => ({
  user: one(users, {
    fields: [cashouts.userId],
    references: [users.id]
  })
}));

export const marketplacePurchasesRelations = relations(marketplacePurchases, ({ one }) => ({
  user: one(users, {
    fields: [marketplacePurchases.userId],
    references: [users.id]
  }),
  item: one(marketplaceItems, {
    fields: [marketplacePurchases.itemId],
    references: [marketplaceItems.id]
  })
}));
