import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { insertUserSchema, USER_TYPES, insertConversationSchema, insertMessageSchema } from "@shared/schema";
import { setupBot } from "./telegram/bot";
import { validateToken } from "./auth/jwt";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const COMMISSION_RATE = 0.7; // 70% platform commission

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize Telegram bot
  const httpServer = createServer(app);
  setupBot(httpServer);

  // API routes
  const apiRouter = express.Router();
  app.use("/api", apiRouter);

  // Development mode debug endpoint
  if (process.env.NODE_ENV === 'development') {
    apiRouter.get("/debug/user", (req, res) => {
      const testUser = {
        id: 1,
        telegramId: "123456789",
        firstName: "Test",
        lastName: "User",
        type: 'regular',
        coins: 100,
        profilePhoto: "https://via.placeholder.com/100",
        bio: "Test bio",
        location: "Test City",
        interests: ["Music", "Sports", "Travel"],
        age: 25,
        rating: 4.5,
        referralCode: "TEST123",
        createdAt: new Date(),
        lastActive: new Date()
      };
      res.json(testUser);
    });
  }

  // Middleware to verify JWT token
  apiRouter.use(validateToken);

  // Auth routes
  apiRouter.post("/auth/telegram", async (req: Request, res: Response) => {
    try {
      const { initData } = req.body;
      let telegramUser;
      
      // Check if we're in development mode
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      if (isDevelopment && (!initData || initData === "mock_init_data")) {
        // Use test data in development mode
        console.log("Using test authentication data in development mode");
        telegramUser = {
          id: 123456789,
          first_name: "Test",
          last_name: "User",
          username: "testuser",
          photo_url: "https://via.placeholder.com/100",
          auth_date: Math.floor(Date.now() / 1000)
        };
      } else {
        // Normal flow for production
        if (!initData) {
          return res.status(400).json({ message: "Invalid Telegram authentication data" });
        }
        
        // Parse and verify the initData
        telegramUser = parseTelegramInitData(initData);
        
        if (!telegramUser) {
          return res.status(400).json({ message: "Invalid Telegram authentication data" });
        }
      }
      
      // Check if user exists
      let user = await storage.getUserByTelegramId(telegramUser.id.toString());
      
      // Create user if not exists
      if (!user) {
        // Determine if this is from a referral
        let referredBy = null;
        if (req.body.ref) {
          const referrer = await storage.getUserByReferralCode(req.body.ref);
          if (referrer) {
            referredBy = referrer.referralCode;
          }
        }
        
        // Generate a random referral code
        const referralCode = generateReferralCode();
        
        user = await storage.createUser({
          telegramId: telegramUser.id.toString(),
          username: telegramUser.username || null,
          firstName: telegramUser.first_name,
          lastName: telegramUser.last_name || null,
          type: telegramUser.gender === "female" ? USER_TYPES.PERFORMER : USER_TYPES.REGULAR,
          profilePhoto: telegramUser.photo_url || null,
          referralCode,
          referredBy,
          coins: 50, // Starting bonus
          messagePrice: telegramUser.gender === "female" ? 35 : undefined,
          responseTime: telegramUser.gender === "female" ? 5 : undefined,
          interests: []
        });
        
        // Process referral bonus if applicable
        if (referredBy) {
          const referrer = await storage.getUserByReferralCode(referredBy);
          if (referrer) {
            await storage.processReferralBonus(referrer.id, user.id);
          }
        }
      } else {
        // Update user's last active time
        user = await storage.updateUser(user.id, { lastActive: new Date() }) || user;
      }
      
      // Generate JWT token
      const token = jwt.sign({ userId: user.id, telegramId: user.telegramId, type: user.type }, JWT_SECRET, { expiresIn: "30d" });
      
      res.json({ token, user });
    } catch (error) {
      console.error("Auth error:", error);
      res.status(500).json({ message: "Authentication failed" });
    }
  });

  // User routes
  apiRouter.get("/users/me", async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user information" });
    }
  });

  apiRouter.patch("/users/me", async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const updateSchema = z.object({
        bio: z.string().optional(),
        location: z.string().optional(),
        age: z.number().min(18).max(100).optional(),
        interests: z.array(z.string()).optional(),
        messagePrice: z.number().min(5).optional(),
      });
      
      const validatedData = updateSchema.parse(req.body);
      const updatedUser = await storage.updateUser(userId, validatedData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Failed to update user information" });
    }
  });

  // Performer routes
  apiRouter.get("/performers", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const query = req.query.q as string | undefined;
      
      let performers;
      if (query) {
        performers = await storage.searchPerformers(query);
      } else {
        performers = await storage.getPerformers(limit, offset);
      }
      
      res.json(performers);
    } catch (error) {
      console.error("Get performers error:", error);
      res.status(500).json({ message: "Failed to get performers" });
    }
  });

  apiRouter.get("/performers/:id", async (req: Request, res: Response) => {
    try {
      const performerId = parseInt(req.params.id);
      if (isNaN(performerId)) {
        return res.status(400).json({ message: "Invalid performer ID" });
      }
      
      const performer = await storage.getUserById(performerId);
      if (!performer || performer.type !== USER_TYPES.PERFORMER) {
        return res.status(404).json({ message: "Performer not found" });
      }
      
      res.json(performer);
    } catch (error) {
      console.error("Get performer error:", error);
      res.status(500).json({ message: "Failed to get performer information" });
    }
  });

  // Conversation routes
  apiRouter.get("/conversations", async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      const userType = req.user?.type;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const isPerformer = userType === USER_TYPES.PERFORMER;
      const conversations = await storage.getConversationsForUser(userId, isPerformer);
      
      // Get the users in these conversations
      const userIds = new Set<number>();
      conversations.forEach(conv => {
        userIds.add(conv.regularUserId);
        userIds.add(conv.performerId);
      });
      
      const conversationDetails = await Promise.all(
        conversations.map(async (conv) => {
          const otherUserId = isPerformer ? conv.regularUserId : conv.performerId;
          const otherUser = await storage.getUserById(otherUserId);
          
          // Get last message
          const messages = await storage.getMessagesForConversation(conv.id);
          const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
          
          // Count unread messages
          const unreadCount = messages.filter(
            msg => !msg.read && msg.recipientId === userId
          ).length;
          
          return {
            ...conv,
            otherUser,
            lastMessage,
            unreadCount
          };
        })
      );
      
      res.json(conversationDetails);
    } catch (error) {
      console.error("Get conversations error:", error);
      res.status(500).json({ message: "Failed to get conversations" });
    }
  });

  apiRouter.post("/conversations", async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      const userType = req.user?.type;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Only regular users can start conversations
      if (userType !== USER_TYPES.REGULAR) {
        return res.status(403).json({ message: "Only regular users can start conversations" });
      }
      
      const conversationData = insertConversationSchema.parse(req.body);
      
      // Ensure the requesting user is the regular user
      if (conversationData.regularUserId !== userId) {
        return res.status(403).json({ message: "Unauthorized conversation creation" });
      }
      
      // Check if performer exists
      const performer = await storage.getUserById(conversationData.performerId);
      if (!performer || performer.type !== USER_TYPES.PERFORMER) {
        return res.status(404).json({ message: "Performer not found" });
      }
      
      // Check if conversation already exists
      const existingConversation = await storage.getConversation(
        conversationData.regularUserId,
        conversationData.performerId
      );
      
      if (existingConversation) {
        return res.json(existingConversation);
      }
      
      // Create new conversation
      const conversation = await storage.createConversation(conversationData);
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Create conversation error:", error);
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  // Message routes
  apiRouter.get("/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const conversationId = parseInt(req.params.id);
      if (isNaN(conversationId)) {
        return res.status(400).json({ message: "Invalid conversation ID" });
      }
      
      // Verify user has access to this conversation
      const conversation = await storage.getConversationById(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      if (conversation.regularUserId !== userId && conversation.performerId !== userId) {
        return res.status(403).json({ message: "Access to this conversation denied" });
      }
      
      // Get messages
      const messages = await storage.getMessagesForConversation(conversationId);
      
      // Mark messages as read
      await storage.markMessagesAsRead(conversationId, userId);
      
      res.json(messages);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ message: "Failed to get messages" });
    }
  });

  apiRouter.post("/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      const userType = req.user?.type;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const conversationId = parseInt(req.params.id);
      if (isNaN(conversationId)) {
        return res.status(400).json({ message: "Invalid conversation ID" });
      }
      
      // Verify conversation exists and user has access
      const conversation = await storage.getConversationById(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      if (conversation.regularUserId !== userId && conversation.performerId !== userId) {
        return res.status(403).json({ message: "Access to this conversation denied" });
      }
      
      // Different behavior based on user type
      const isPerformer = userType === USER_TYPES.PERFORMER;
      const sender = await storage.getUserById(userId);
      
      if (!sender) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Determine recipient
      const recipientId = isPerformer ? conversation.regularUserId : conversation.performerId;
      const recipient = await storage.getUserById(recipientId);
      
      if (!recipient) {
        return res.status(404).json({ message: "Recipient not found" });
      }
      
      // Process message creation differently based on user type
      const { content } = req.body;
      
      if (!content || typeof content !== 'string' || content.trim() === '') {
        return res.status(400).json({ message: "Message content is required" });
      }
      
      if (isPerformer) {
        // Performers can send messages for free and earn coins
        const messageData = {
          conversationId,
          senderId: userId,
          recipientId,
          content,
          cost: 0
        };
        
        const message = await storage.createMessage(messageData);
        
        // Performer earns coins for responding (30% of message price)
        const messagePricePerformers = sender.messagePrice || 35; // Default 35 if not set
        const earnings = Math.floor(messagePricePerformers * (1 - COMMISSION_RATE));
        
        await storage.addCoins(
          userId, 
          earnings, 
          `Earnings for responding to ${recipient.firstName}`,
          recipientId
        );
        
        res.status(201).json(message);
      } else {
        // Regular users must pay coins to send messages
        const performerMessagePrice = recipient.messagePrice || 35; // Default 35 if not set
        
        // Check if user has enough coins
        if ((sender.coins || 0) < performerMessagePrice) {
          return res.status(400).json({ 
            message: "Insufficient coins", 
            required: performerMessagePrice, 
            available: sender.coins 
          });
        }
        
        // Spend coins
        const updatedUser = await storage.spendCoins(
          userId, 
          performerMessagePrice, 
          `Message to ${recipient.firstName}`,
          recipientId
        );
        
        if (!updatedUser) {
          return res.status(400).json({ message: "Failed to process payment" });
        }
        
        // Create the message
        const messageData = {
          conversationId,
          senderId: userId,
          recipientId,
          content,
          cost: performerMessagePrice
        };
        
        const message = await storage.createMessage(messageData);
        res.status(201).json({ message, updatedCoins: updatedUser.coins });
      }
    } catch (error) {
      console.error("Send message error:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Coin routes
  apiRouter.post("/coins/purchase", async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const purchaseSchema = z.object({
        amount: z.number().min(1).int(),
        paymentMethod: z.string(),
        paymentId: z.string().optional()
      });
      
      const { amount, paymentMethod, paymentId } = purchaseSchema.parse(req.body);
      
      // In a real application, integrate with payment processor here
      // For this demo, we'll simulate a successful payment
      
      // Add coins to user's account
      const updatedUser = await storage.addCoins(
        userId, 
        amount, 
        `Purchase of ${amount} coins via ${paymentMethod}${paymentId ? ` (ID: ${paymentId})` : ''}`
      );
      
      res.status(201).json({ 
        success: true, 
        user: updatedUser, 
        message: `Successfully purchased ${amount} coins` 
      });
    } catch (error) {
      console.error("Coin purchase error:", error);
      res.status(500).json({ message: "Failed to process coin purchase" });
    }
  });

  apiRouter.get("/transactions", async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const transactions = await storage.getTransactionsForUser(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Get transactions error:", error);
      res.status(500).json({ message: "Failed to get transaction history" });
    }
  });

  // Admin routes (simplified for demo)
  apiRouter.get("/admin/users", async (req: Request, res: Response) => {
    try {
      const userType = req.user?.type;
      
      if (userType !== USER_TYPES.ADMIN) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const performers = await storage.getUsersByType(USER_TYPES.PERFORMER);
      const regularUsers = await storage.getUsersByType(USER_TYPES.REGULAR);
      
      res.json({ performers, regularUsers });
    } catch (error) {
      console.error("Admin get users error:", error);
      res.status(500).json({ message: "Failed to get user data" });
    }
  });

  return httpServer;
}

// Helper functions
function parseTelegramInitData(initData: string): any {
  try {
    // In a real application, validate the initData hash
    // For this demo, we'll parse the data assuming it's valid
    const params = new URLSearchParams(initData);
    const user = params.get('user');
    
    if (!user) return null;
    
    return JSON.parse(user);
  } catch (error) {
    console.error("Error parsing Telegram initData:", error);
    return null;
  }
}

function generateReferralCode(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}
