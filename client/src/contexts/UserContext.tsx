import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthResponse } from '@/types';
import { getInitData } from '@/lib/telegram';
import { apiRequest, queryClient } from "@/lib/queryClient";
import { toast } from "@/components/ui/use-toast";

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  setAuthToken: (token: string | null) => void;
  isLoading: boolean;
  error: Error | null;
  updateUser: (userData: Partial<User>) => Promise<User>;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  logout: () => void;
  authenticate: () => Promise<void>;
  loginWithTelegram: () => void;
}

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  setAuthToken: () => {},
  isLoading: true,
  error: null,
  updateUser: async () => { throw new Error("No authenticated user"); },
  addCoins: () => {},
  spendCoins: () => false,
  logout: () => {},
  authenticate: async () => {},
  loginWithTelegram: () => {}
});

const UserContextProvider = ({ children }: { children: ReactNode }) => {
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
    
    // Giriş sayfasında olup olmadığımızı kontrol et
    const isLoginPage = window.location.pathname.includes('/login');
    
    try {
      // Logout URL parametresi varsa, oturumu tamamen temizle
      if (window.location.search.includes('logout=true')) {
        localStorage.removeItem('auth_token');
        sessionStorage.clear();
        setUser(null);
        setAuthToken(null);
        setIsLoading(false);
        return;
      }
      
      // Token kontrolü
      const token = localStorage.getItem('auth_token');
      if (!token) {
        // Token yoksa ve login sayfasında değilsek, login'e yönlendir
        if (!isLoginPage) {
          window.location.replace('/login');
        }
        setUser(null);
        setAuthToken(null);
        setIsLoading(false);
        return;
      }
      
      // Token varsa kullanıcı bilgilerini getir
      try {
        const response = await apiRequest('GET', '/api/users/me');
        const userData: User = await response.json();
        
        if (!userData || !userData.id) {
          throw new Error('Invalid user data');
        }
        
        setUser(userData);
        setAuthToken(token);
      } catch (error) {
        console.error('User data fetch error:', error);
        // Hata varsa oturumu kapat
        localStorage.removeItem('auth_token');
        sessionStorage.clear();
        setUser(null);
        setAuthToken(null);
        
        // Login sayfasında değilsek yönlendir
        if (!isLoginPage) {
          window.location.replace('/login');
        }
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      
      // Oturum bilgilerini temizle
      localStorage.removeItem('auth_token');
      sessionStorage.clear();
      setUser(null);
      setAuthToken(null);
      
      // Login sayfasında değilsek yönlendir
      if (!isLoginPage) {
        window.location.replace('/login');
      }
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
    // State'i temizle
    setUser(null);
    setAuthToken(null);
    
    // Storage'ları temizle
    localStorage.removeItem('auth_token');
    localStorage.removeItem('lastFreeSpin');
    localStorage.removeItem('admin_token');
    sessionStorage.clear();
    
    // Query cache'i temizle
    queryClient.clear();
    
    // Sayfayı tamamen yenile ve login sayfasına yönlendir
    window.location.href = '/login?logout=true';
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
    // Only authenticate if we have a token but no user
    // This prevents infinite authentication loops
    const token = localStorage.getItem('auth_token');
    if (token && !user) {
      authenticate().catch(err => {
        console.error("Failed to authenticate:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const loginWithTelegram = () => {
    try {
      if (window.Telegram?.WebApp) {
        // Telegram WebApp mevcutsa
        const initData = window.Telegram.WebApp.initData;
        if (!initData) {
          console.error("Telegram WebApp initData bulunamadı");
          toast({
            title: "Hata!",
            description: "Telegram WebApp verileri alınamadı. Lütfen tekrar deneyin veya test hesabı kullanın.",
            variant: "destructive",
          });
          return;
        }
        
        setIsLoading(true);
        apiRequest("POST", "/api/auth/telegram", { initData })
          .then(res => {
            if (!res.ok) {
              throw new Error("Telegram ile giriş başarısız oldu");
            }
            return res.json();
          })
          .then(data => {
            if (data.token) {
              localStorage.setItem('auth_token', data.token);
              setAuthToken(data.token);
            }
            setUser(data.user);
          })
          .catch(err => {
            console.error("Telegram login error:", err);
            toast({
              title: "Giriş başarısız!",
              description: "Telegram ile giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.",
              variant: "destructive",
            });
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        // Test modu
        console.log("Telegram WebApp is not available - running in test mode");
        setIsLoading(true);
        apiRequest("POST", "/api/auth/telegram", { initData: "mock_init_data" })
          .then(res => {
            if (!res.ok) {
              throw new Error("Test modu girişi başarısız oldu");
            }
            return res.json();
          })
          .then(data => {
            if (data.token) {
              localStorage.setItem('auth_token', data.token);
              setAuthToken(data.token);
            }
            setUser(data.user);
          })
          .catch(err => {
            console.error("Test login error:", err);
            toast({
              title: "Giriş başarısız!",
              description: "Test modu ile giriş yapılırken bir hata oluştu.",
              variant: "destructive",
            });
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
    } catch (err) {
      console.error("Telegram login unhandled error:", err);
      setIsLoading(false);
      toast({
        title: "Giriş başarısız!",
        description: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    }
  };

  const value = {
    user,
    setUser,
    setAuthToken,
    isLoading,
    error,
    updateUser,
    addCoins,
    spendCoins,
    logout,
    authenticate,
    loginWithTelegram
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

export { UserContextProvider as UserProvider, useUser };
