import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser, setAuthToken, isLoading } = useUser();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const isLoggedOut = searchParams.get('logout') === 'true';
  
  // Oturum kontrolü
  useEffect(() => {
    // localStorage'da token var mı kontrol et
    const hasToken = !!localStorage.getItem('auth_token');
    
    // Çıkış yapıldıysa, login sayfasında kal
    if (isLoggedOut) {
      return;
    }
    
    // Kullanıcı bilgisi ve token varsa, dashboard'a yönlendir
    if (user && user.id && hasToken && !isLoading) {
      navigate("/");
    }
  }, [user, navigate, isLoggedOut, isLoading]);

  // Sayfa yüklendiğinde çıkış yapıldı ise bildirim göster
  useEffect(() => {
    if (isLoggedOut) {
      // Tarayıcı geçmişinden logout parametresini kaldır
      if (window.history.replaceState) {
        const url = new URL(window.location.href);
        url.searchParams.delete('logout');
        window.history.replaceState({}, document.title, url.toString());
      }
      
      toast({
        title: "Çıkış yapıldı",
        description: "Başarıyla çıkış yaptınız.",
      });
    }
  }, [isLoggedOut, toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiRequest("POST", "/api/auth/login", {
        username,
        password
      });
      
      const data = await response.json();

      // Token ve kullanıcı bilgisini kaydet
      localStorage.setItem('auth_token', data.token);
      setAuthToken(data.token);
      setUser(data.user);

      // Kullanıcı tipine göre yönlendir
      if (data.user.type === 'admin') {
        navigate("/admin/dashboard");
      } else if (data.user.type === 'performer') {
        navigate("/performer/dashboard");
      } else {
        navigate("/");
      }

      toast({
        title: "Başarılı",
        description: "Giriş yapıldı",
      });
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Giriş başarısız",
        description: "Kullanıcı adı veya şifre hatalı",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTelegramLogin = async () => {
    setLoading(true);
    try {
      if (window.Telegram?.WebApp) {
        // Telegram WebApp mevcutsa
        const initData = window.Telegram.WebApp.initData;
        if (!initData) {
          throw new Error("Telegram WebApp verileri alınamadı");
        }
        
        const response = await apiRequest("POST", "/api/auth/telegram", { initData });
        const data = await response.json();
        
        // Token ve kullanıcı bilgisini kaydet
        localStorage.setItem('auth_token', data.token);
        setAuthToken(data.token);
        setUser(data.user);
        
        // Kullanıcı tipine göre yönlendir
        if (data.user.type === 'admin') {
          navigate("/admin/dashboard");
        } else if (data.user.type === 'performer') {
          navigate("/performer/dashboard");
        } else {
          navigate("/");
        }
      } else {
        // Test modu
        console.log("Telegram WebApp is not available - running in test mode");
        const response = await apiRequest("POST", "/api/auth/telegram", { initData: "mock_init_data" });
        const data = await response.json();
        
        // Token ve kullanıcı bilgisini kaydet
        localStorage.setItem('auth_token', data.token);
        setAuthToken(data.token);
        setUser(data.user);
        
        // Kullanıcı tipine göre yönlendir
        if (data.user.type === 'admin') {
          navigate("/admin/dashboard");
        } else if (data.user.type === 'performer') {
          navigate("/performer/dashboard");
        } else {
          navigate("/");
        }
      }
      
      toast({
        title: "Başarılı",
        description: "Giriş yapıldı",
      });
    } catch (error) {
      console.error("Login failed:", error);
      toast({
        title: "Giriş Hatası",
        description: "Telegram ile giriş yapılırken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-[350px]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">FlirtMarket</CardTitle>
          <CardDescription>
            Hesabınıza giriş yapın
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {/* Telegram Giriş */}
          <Button 
            onClick={handleTelegramLogin} 
            className="bg-blue-500 hover:bg-blue-600 w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                İşlem yapılıyor...
              </>
            ) : (
              "Telegram ile Giriş Yap"
            )}
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                veya kullanıcı adı/şifre ile
              </span>
            </div>
          </div>

          {/* Kullanıcı Adı/Şifre Giriş */}
          <form onSubmit={handleLogin}>
            <div className="grid gap-2">
              <div className="grid gap-1">
                <Label htmlFor="username">Kullanıcı Adı</Label>
                <Input
                  id="username"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="password">Şifre</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="•••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button type="submit" disabled={loading} className="mt-2">
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
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 