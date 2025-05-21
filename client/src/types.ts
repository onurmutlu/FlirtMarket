export interface User {
  id: number;
  username: string;
  type: 'performer' | 'user' | 'admin';
  displayName: string;
  firstName?: string;
  lastName?: string;
  profilePhoto?: string;
  bio?: string;
  age?: number;
  location?: string;
  interests?: string[];
  messagePrice?: number;
  rating?: number;
  lastActive?: string;
  responseTime?: number;
  avatar?: string;
  coins: number;
  totalSpent: number;
  isPerformer: boolean;
  createdAt: string;
  updatedAt: string;
  referralCode?: string;
  telegramId?: string;
}

export interface Conversation {
  id: string;
  regularUserId: string;
  performerId: string;
  lastMessageAt: string;
  createdAt: string;
  otherUser?: User;
  lastMessage?: Message | null;
  unreadCount?: number;
}

export interface Message {
  id: number;
  content: string;
  senderId: string;
  senderName: string;
  createdAt: string;
  read: boolean;
  sender?: {
    id: string;
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

export interface CoinPackage {
  amount: number;
  price: number;
  discount: number;
  isPopular?: boolean;
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
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
