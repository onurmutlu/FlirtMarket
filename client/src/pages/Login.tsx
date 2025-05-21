import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function Login() {
  const { user, loginWithTelegram, setUser, setAuthToken } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // Check if user is already logged in and redirect only once
  useEffect(() => {
    // Prevent redirect loop - only redirect if not already redirecting
    if (user && user.id && !redirecting) {
      setRedirecting(true);
      
      // Log the redirection attempt
      console.log("Redirecting user based on type:", user.type);
      
      // Determine where to redirect based on user type
      if (user.type === 'admin') {
        // For admin users, navigate to admin dashboard
        window.location.href = "/admin/dashboard";
      } else if (user.type === 'performer') {
        // For performer users, navigate to performer dashboard
        window.location.href = "/performer/dashboard";
      } else {
        // For regular users, navigate to home
        window.location.href = "/";
      }
    }
  }, [user, navigate, redirecting]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || redirecting) return;
    
    setLoading(true);
    setError("");
    
    try {
      // Special handling for admin:admin123
      if (username === 'admin' && password === 'admin123') {
        // Direct API call without using apiRequest to avoid any middleware issues
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username,
            password,
          }),
        });
        
        if (!response.ok) {
          throw new Error('Login failed');
        }
        
        const data = await response.json();
        
        if (data.token) {
          // Store token and set user data
          localStorage.setItem('auth_token', data.token);
          localStorage.setItem('admin_token', data.token);
          
          // Ensure user has admin type
          const adminUser = {
            ...data.user,
            type: 'admin'
          };
          
          setAuthToken(data.token);
          setUser(adminUser);
          
          toast({
            title: "Giriş başarılı",
            description: "Yönetici paneline yönlendiriliyorsunuz",
          });
          
          // Use window.location for a full page refresh to admin dashboard
          window.location.href = "/admin/dashboard";
          return;
        }
      }
      
      // Regular API request for other admin logins
      const response = await apiRequest("POST", "/api/auth/login", {
        username,
        password,
        type: "admin"
      });
      
      const data = await response.json();
      
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('admin_token', data.token);
        
        setAuthToken(data.token);
        setUser(data.user);
        
        toast({
          title: "Giriş başarılı",
          description: "Yönetici paneline yönlendiriliyorsunuz",
        });
        
        // Use window.location for a full page refresh
        window.location.href = "/admin/dashboard";
      }
    } catch (err) {
      console.error("Admin login error:", err);
      setError("Giriş başarısız. Kullanıcı adı veya şifre hatalı.");
      toast({
        title: "Giriş başarısız",
        description: "Kullanıcı adı veya şifre hatalı",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePerformerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || redirecting) return;
    
    setLoading(true);
    setError("");
    
    try {
      // Test for showcu:showcu123
      if (username === 'showcu' && password === 'showcu123') {
        // Direct API call
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username,
            password,
          }),
        });
        
        if (!response.ok) {
          throw new Error('Login failed');
        }
        
        const data = await response.json();
        
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
          
          // Ensure user has performer type
          const performerUser = {
            ...data.user,
            type: 'performer'
          };
          
          setAuthToken(data.token);
          setUser(performerUser);
          
          toast({
            title: "Giriş başarılı",
            description: "Şovcu paneline yönlendiriliyorsunuz",
          });
          
          // Use window.location for a full page refresh
          window.location.href = "/performer/dashboard";
          return;
        }
      }
      
      // Regular API request
      const response = await apiRequest("POST", "/api/auth/login", {
        username,
        password,
        type: "performer"
      });
      
      const data = await response.json();
      
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        
        setAuthToken(data.token);
        setUser(data.user);
        
        toast({
          title: "Giriş başarılı",
          description: "Şovcu paneline yönlendiriliyorsunuz",
        });
        
        // Use window.location for a full page refresh
        window.location.href = "/performer/dashboard";
      }
    } catch (err) {
      console.error("Performer login error:", err);
      setError("Giriş başarısız. Kullanıcı adı veya şifre hatalı.");
      toast({
        title: "Giriş başarısız",
        description: "Kullanıcı adı veya şifre hatalı",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold">FlirtMarket'e Hoş Geldiniz</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Devam etmek için giriş yapın
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {/* Normal kullanıcı girişi */}
          <button
            onClick={loginWithTelegram}
            disabled={loading || redirecting}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#0088cc] hover:bg-[#0088cc]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0088cc] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                İşlem yapılıyor...
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5 mr-2"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.05-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .24z" />
                </svg>
                Telegram ile Giriş Yap
              </>
            )}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted-foreground">veya</span>
            </div>
          </div>

          {/* Kullanıcı Girişi */}
          <div className="space-y-4">
            {error && (
              <div className="text-destructive text-sm text-center bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}
            <Input
              type="text"
              placeholder="Kullanıcı adı"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading || redirecting}
            />
            <Input
              type="password"
              placeholder="Şifre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading || redirecting}
            />
            <Button
              onClick={(e) => {
                e.preventDefault();
                if (loading || redirecting) return;
                
                // Kullanıcı adına göre doğru login fonksiyonunu çağır
                if (username === 'admin') {
                  handleAdminLogin(e);
                } else if (username === 'showcu') {
                  handlePerformerLogin(e);
                } else {
                  // Varsayılan olarak normal kullanıcı girişi
                  handleAdminLogin(e); // Şimdilik admin login kullanıyoruz
                }
              }}
              className="w-full bg-primary hover:bg-primary/90"
              type="button"
              disabled={loading || redirecting}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Giriş Yapılıyor...
                </>
              ) : (
                "Giriş Yap"
              )}
            </Button>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Test hesapları: <span className="font-medium">admin:admin123</span> / <span className="font-medium">showcu:showcu123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 