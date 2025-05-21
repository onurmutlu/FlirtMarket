export interface User {
  id: number;
  username: string;
  displayName: string;
  bio: string;
  photoUrl: string;
  status: 'online' | 'busy' | 'offline';
  role: 'PERFORMER';
  coins: number;
  createdAt: string;
}

export interface Message {
  id: number;
  senderId: number;
  senderName: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface Mission {
  id: number;
  title: string;
  description: string;
  reward: number;
  target: number;
  progress: number;
  completed: boolean;
}

export interface Referral {
  id: number;
  username: string;
  earnedCoins: number;
  joinedAt: string;
}

export interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  level: number;
  maxLevel: number;
  progress: number;
  target: number;
  unlocked: boolean;
}

export interface NotificationSettings {
  newMessage: boolean;
  missionComplete: boolean;
  newReferral: boolean;
  coinEarned: boolean;
}

export interface ProfileFormData {
  displayName: string;
  bio: string;
  photoUrl: string;
  hourlyRate: number;
} 