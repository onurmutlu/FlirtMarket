import { pgTable, text, serial, integer, boolean, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User types: regular (male) and performer (female)
export const USER_TYPES = {
  REGULAR: "regular",
  PERFORMER: "performer",
  ADMIN: "admin",
} as const;

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id").notNull().unique(),
  username: text("username"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  type: text("type", { enum: Object.values(USER_TYPES) }).notNull().default(USER_TYPES.REGULAR),
  coins: integer("coins").notNull().default(0),
  profilePhoto: text("profile_photo"),
  bio: text("bio"),
  location: text("location"),
  interests: jsonb("interests").default([]),
  age: integer("age"),
  rating: real("rating").default(0),
  referralCode: text("referral_code").unique(),
  referredBy: text("referred_by"),
  messagePrice: integer("message_price"),
  responseRate: real("response_rate"),
  responseTime: integer("response_time"), // in minutes
  createdAt: timestamp("created_at").defaultNow(),
  lastActive: timestamp("last_active").defaultNow(),
});

// Insert schema
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  rating: true,
  responseRate: true,
});

// Conversations table
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  regularUserId: integer("regular_user_id").notNull(),
  performerId: integer("performer_id").notNull(),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  lastMessageAt: true,
});

// Messages table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  senderId: integer("sender_id").notNull(),
  recipientId: integer("recipient_id").notNull(),
  content: text("content").notNull(),
  cost: integer("cost"),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  read: true,
});

// Transactions table for coin operations
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type", { enum: ["purchase", "spend", "earn", "referral"] }).notNull(),
  amount: integer("amount").notNull(),
  description: text("description"),
  relatedUserId: integer("related_user_id"), // For messages or referrals
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
