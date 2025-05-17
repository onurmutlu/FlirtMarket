import { pgTable, text, serial, integer, boolean, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// User types: regular (male) and performer (female)
export const USER_TYPES = {
  REGULAR: "regular",
  PERFORMER: "performer",
  ADMIN: "admin",
} as const;

// User type values as simple string array for schema
export const USER_TYPE_VALUES = ["regular", "performer", "admin"];

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id").notNull().unique(),
  username: text("username"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  type: text("type", { enum: USER_TYPE_VALUES }).notNull().default(USER_TYPES.REGULAR),
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
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
