import { pgTable, varchar, serial, timestamp, text, jsonb, boolean, integer } from 'drizzle-orm/pg-core';
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// User types: regular (male) and performer (female)
export const USER_TYPES = {
  REGULAR: "user",
  PERFORMER: "performer",
  ADMIN: "admin",
} as const;

// User type values as simple string array for schema
export const USER_TYPE_VALUES = ["user", "performer", "admin"] as const;

// User table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  telegramId: varchar('telegram_id').notNull(),
  firstName: varchar('first_name').notNull(),
  lastName: varchar('last_name'),
  username: varchar('username'),
  type: varchar('type', { length: 50 }).notNull().$type<UserType>(),
  coins: integer('coins').notNull().default(0),
  referralCode: varchar('referral_code').notNull(),
  referredBy: integer('referred_by'),
  profilePhoto: varchar('profile_photo'),
  bio: text('bio'),
  location: varchar('location'),
  age: integer('age'),
  interests: jsonb('interests').$type<string[]>(),
  messagePrice: integer('message_price'),
  rating: integer('rating').default(0),
  createdAt: timestamp('created_at').notNull(),
  lastActive: timestamp('last_active').notNull(),
  passwordHash: varchar('password_hash'),
});

// Insert schema
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Conversations table
export const conversations = pgTable("conversations", {
  id: serial('id').primaryKey(),
  regularUserId: integer('regular_user_id').notNull(),
  performerId: integer('performer_id').notNull(),
  lastMessageAt: timestamp('last_message_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  lastMessageAt: true,
});

// Messages table
export const messages = pgTable("messages", {
  id: serial('id').primaryKey(),
  conversationId: integer('conversation_id').notNull(),
  senderId: integer('sender_id').notNull(),
  recipientId: integer('recipient_id').notNull(),
  content: text('content').notNull(),
  cost: integer('cost'),
  read: boolean('read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  read: true,
});

// Transactions table for coin operations
export const transactions = pgTable("transactions", {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  type: varchar('type').notNull(),
  amount: integer('amount').notNull(),
  description: text('description'),
  relatedUserId: integer('related_user_id'), // For messages or referrals
  createdAt: timestamp('created_at').defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

// Define table relations
export const usersRelations = relations(users, ({ many }) => ({
  sentMessages: many(messages, { relationName: 'sender' }),
  receivedMessages: many(messages, { relationName: 'recipient' }),
  conversations: many(conversations),
  transactions: many(transactions)
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  regularUser: one(users, {
    fields: [conversations.regularUserId],
    references: [users.id]
  }),
  performer: one(users, {
    fields: [conversations.performerId],
    references: [users.id]
  }),
  messages: many(messages)
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id]
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: 'sender'
  }),
  recipient: one(users, {
    fields: [messages.recipientId],
    references: [users.id],
    relationName: 'recipient'
  })
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id]
  }),
  relatedUser: one(users, {
    fields: [transactions.relatedUserId],
    references: [users.id],
    relationName: 'relatedTransactions'
  })
}));

// Type definitions
export type DbUser = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type DbConversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;

export type DbMessage = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type DbTransaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type UserType = typeof USER_TYPE_VALUES[number];

// Extended interfaces with additional fields
export interface User {
  id: number;
  username?: string | null;
  type: UserType;
  displayName: string;
  firstName: string;
  lastName?: string | null;
  profilePhoto?: string | null;
  bio?: string | null;
  age?: number | null;
  location?: string | null;
  interests?: string[] | null;
  messagePrice?: number | null;
  rating?: number | null;
  lastActive: Date;
  responseTime?: number | null;
  avatar?: string | null;
  coins: number;
  totalSpent: number;
  isPerformer: boolean;
  createdAt: Date;
  updatedAt: Date;
  referralCode: string;
  telegramId: string;
  passwordHash?: string | null;
}

export interface Message extends DbMessage {
  sender?: {
    id: number;
    name: string;
  };
}

export interface Transaction {
  id: number;
  userId: number;
  type: 'purchase' | 'spend' | 'earn' | 'referral';
  amount: number;
  description?: string | null;
  relatedUserId?: number | null;
  createdAt: Date;
}
