export interface User {
  id: number;
  telegramId: string;
  username?: string | null;
  firstName: string;
  lastName?: string | null;
  type: 'regular' | 'performer' | 'admin';
  coins: number;
  profilePhoto?: string | null;
  bio?: string | null;
  location?: string | null;
  interests: string[];
  age?: number | null;
  rating: number;
  referralCode?: string | null;
  referredBy?: string | null;
  messagePrice?: number | null;
  responseRate?: number | null;
  responseTime?: number | null; // in minutes
  createdAt: Date;
  lastActive: Date;
}

export interface Conversation {
  id: number;
  regularUserId: number;
  performerId: number;
  lastMessageAt: Date;
  createdAt: Date;
  otherUser?: User;
  lastMessage?: Message | null;
  unreadCount?: number;
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  recipientId: number;
  content: string;
  cost?: number | null;
  read: boolean;
  createdAt: Date;
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

export interface CoinPackage {
  amount: number;
  price: number;
  discount?: number;
  isPopular?: boolean;
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export interface TelegramWebAppUser {
  user?: TelegramUser;
  auth_date?: number;
  hash?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface AppState {
  currentTab: 'explore' | 'messages' | 'profile' | 'earnings';
  showCoinPurchaseModal: boolean;
  showPerformerProfile: boolean;
  showConversation: boolean;
  activePerformerId?: number;
  activeConversationId?: number;
}
