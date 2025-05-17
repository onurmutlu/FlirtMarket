import { db } from '../server/db';
import { 
  users, conversations, messages, transactions, 
  USER_TYPES 
} from '../shared/schema';

// Helper function to generate referral code
function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function seedDatabase() {
  console.log('🌱 Seeding database...');
  
  try {
    // Checking if users already exist
    const existingUsers = await db.select({ count: { value: users.id } }).from(users);
    if (existingUsers[0]?.count.value > 0) {
      console.log('Database already has users. Skipping seed process.');
      process.exit(0);
    }

    // Create test users
    const now = new Date();
    
    // Create a regular user (Male)
    const [regularUser] = await db.insert(users).values({
      telegramId: '123456789',
      username: 'testuser',
      firstName: 'John',
      lastName: 'Doe',
      type: USER_TYPES.REGULAR,
      coins: 100,
      profilePhoto: null,
      bio: 'Just a regular user looking to chat',
      location: 'New York',
      interests: ['sports', 'movies', 'travel'],
      age: 28,
      rating: 0,
      referralCode: generateReferralCode(),
      referredBy: null,
      messagePrice: null,
      responseRate: null,
      responseTime: null,
      createdAt: now,
      lastActive: now
    }).returning();
    
    console.log('Created regular user:', regularUser.id);
    
    // Create performer users (Female)
    const performerData = [
      {
        telegramId: '987654321',
        username: 'performer1',
        firstName: 'Sarah',
        lastName: 'Smith',
        type: USER_TYPES.PERFORMER,
        coins: 200,
        profilePhoto: null,
        bio: 'Professional dancer and model',
        location: 'Los Angeles',
        interests: ['dancing', 'fashion', 'photography'],
        age: 25,
        rating: 4.8,
        referralCode: generateReferralCode(),
        referredBy: null,
        messagePrice: 5,
        responseRate: 95,
        responseTime: 10,
        createdAt: now,
        lastActive: now
      },
      {
        telegramId: '567891234',
        username: 'performer2',
        firstName: 'Mia',
        lastName: 'Johnson',
        type: USER_TYPES.PERFORMER,
        coins: 150,
        profilePhoto: null,
        bio: 'Fitness instructor and wellness coach',
        location: 'Miami',
        interests: ['fitness', 'nutrition', 'yoga'],
        age: 27,
        rating: 4.5,
        referralCode: generateReferralCode(),
        referredBy: null,
        messagePrice: 3,
        responseRate: 90,
        responseTime: 15,
        createdAt: now,
        lastActive: now
      }
    ];
    
    for (const performer of performerData) {
      const [newPerformer] = await db.insert(users).values(performer).returning();
      console.log('Created performer:', newPerformer.id);
      
      // Create sample conversation between regular user and performer
      const [conversation] = await db.insert(conversations).values({
        regularUserId: regularUser.id,
        performerId: newPerformer.id,
        lastMessageAt: now,
        createdAt: now
      }).returning();
      
      console.log('Created conversation:', conversation.id);
      
      // Add sample messages
      await db.insert(messages).values([
        {
          conversationId: conversation.id,
          senderId: regularUser.id,
          recipientId: newPerformer.id,
          content: `Hi ${newPerformer.firstName}, how are you today?`,
          cost: null,
          read: true,
          createdAt: new Date(now.getTime() - 3600000) // 1 hour ago
        },
        {
          conversationId: conversation.id,
          senderId: newPerformer.id,
          recipientId: regularUser.id,
          content: `Hello ${regularUser.firstName}! I'm doing great, thanks for asking. How about you?`,
          cost: newPerformer.messagePrice,
          read: true,
          createdAt: new Date(now.getTime() - 3000000) // 50 minutes ago
        },
        {
          conversationId: conversation.id,
          senderId: regularUser.id,
          recipientId: newPerformer.id,
          content: "I'm good! I saw your profile and was interested in your hobbies.",
          cost: null,
          read: true,
          createdAt: new Date(now.getTime() - 1800000) // 30 minutes ago
        }
      ]);
      
      console.log('Added sample messages');
      
      // Create sample transactions
      await db.insert(transactions).values([
        {
          userId: regularUser.id,
          type: 'purchase',
          amount: 100,
          description: 'Initial coin purchase',
          relatedUserId: null,
          createdAt: new Date(now.getTime() - 86400000) // 1 day ago
        },
        {
          userId: regularUser.id,
          type: 'spend',
          amount: -newPerformer.messagePrice!,
          description: `Message to ${newPerformer.firstName}`,
          relatedUserId: newPerformer.id,
          createdAt: new Date(now.getTime() - 3000000) // 50 minutes ago
        },
        {
          userId: newPerformer.id,
          type: 'earn',
          amount: newPerformer.messagePrice!,
          description: `Message to ${regularUser.firstName}`,
          relatedUserId: regularUser.id,
          createdAt: new Date(now.getTime() - 3000000) // 50 minutes ago
        }
      ]);
      
      console.log('Added sample transactions');
    }
    
    // Create an admin user
    const [adminUser] = await db.insert(users).values({
      telegramId: '111222333',
      username: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      type: USER_TYPES.ADMIN,
      coins: 0,
      profilePhoto: null,
      bio: 'System administrator',
      location: null,
      interests: [],
      age: null,
      rating: 0,
      referralCode: null,
      referredBy: null,
      messagePrice: null,
      responseRate: null,
      responseTime: null,
      createdAt: now,
      lastActive: now
    }).returning();
    
    console.log('Created admin user:', adminUser.id);
    
    console.log('✅ Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the seed function
seedDatabase();