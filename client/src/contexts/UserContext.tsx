import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthResponse } from '@/types';
import { getInitData } from '@/lib/telegram';

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  updateUser: (userData: Partial<User>) => Promise<User>;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  logout: () => void;
  authenticate: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Helper function for making authenticated API requests
async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const token = localStorage.getItem('auth_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: 'include',
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text || res.statusText}`);
  }
  
  return res;
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(() => {
    return localStorage.getItem('auth_token');
  });

  // Extract the referral code from URL if it exists
  const getRefCode = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('ref');
  };

  // Authentication function
  const authenticate = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!authToken) {
        const initData = getInitData();
        
        if (!initData) {
          throw new Error('No Telegram init data available');
        }
        
        const response = await apiRequest('POST', '/api/auth/telegram', {
          initData,
          ref: getRefCode()
        });
        
        const data: AuthResponse = await response.json();
        
        // Save token to local storage
        localStorage.setItem('auth_token', data.token);
        setAuthToken(data.token);
        
        // Set user data
        setUser(data.user);
      } else {
        // If we already have a token, fetch user data
        const response = await apiRequest('GET', '/api/users/me');
        const userData: User = await response.json();
        setUser(userData);
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  // Update user data function
  const updateUser = async (userData: Partial<User>): Promise<User> => {
    if (!user) throw new Error("No authenticated user");
    
    const response = await apiRequest('PATCH', '/api/users/me', userData);
    const updatedUser: User = await response.json();
    
    // Update local state
    setUser(updatedUser);
    return updatedUser;
  };

  // Add coins to user
  const addCoins = (amount: number) => {
    if (!user) return;
    
    setUser({
      ...user,
      coins: (user.coins || 0) + amount
    });
  };

  // Spend coins and return if successful
  const spendCoins = (amount: number): boolean => {
    if (!user || (user.coins || 0) < amount) return false;
    
    setUser({
      ...user,
      coins: user.coins - amount
    });
    
    return true;
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('auth_token');
    setAuthToken(null);
    setUser(null);
  };

  // Set up authentication headers whenever authToken changes
  useEffect(() => {
    if (authToken) {
      localStorage.setItem('auth_token', authToken);
    } else {
      localStorage.removeItem('auth_token');
    }
  }, [authToken]);

  // Run authentication on component mount
  useEffect(() => {
    authenticate().catch(err => {
      console.error("Failed to authenticate:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsLoading(false);
    });
  }, []);

  const value = {
    user,
    isLoading,
    error,
    updateUser,
    addCoins,
    spendCoins,
    logout,
    authenticate
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
