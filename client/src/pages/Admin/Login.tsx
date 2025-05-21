import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setUser } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Fetch doğrudan kullanılacak çünkü henüz token olmadan API isteği yapıyoruz
      const response = await fetch('/api/admin/login', {
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
        const errorData = await response.json();
        throw new Error(errorData.message || 'Giriş başarısız');
      }

      const data = await response.json();
      
      if (data.token) {
        // First set the tokens in localStorage
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('admin_token', data.token);
        
        // Set the user data
        if (data.user) {
          // Make sure user has admin type
          const adminUser = {
            ...data.user,
            type: 'admin'
          };
          setUser(adminUser);
        }
        
        toast({
          title: 'Giriş başarılı',
          description: 'Yönetici paneline yönlendiriliyorsunuz',
        });
        
        // Use setTimeout to ensure state updates are processed before navigation
        setTimeout(() => {
          navigate('/admin/dashboard', { replace: true });
        }, 100);
      } else {
        throw new Error('Token alınamadı');
      }
    } catch (err) {
      console.error('Admin login error:', err);
      setError('Kullanıcı adı veya şifre hatalı');
      toast({
        title: 'Giriş başarısız',
        description: 'Kullanıcı adı veya şifre hatalı',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-xl shadow-lg">
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <ShieldAlert className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-3xl font-bold">Yönetici Girişi</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            FlirtMarket yönetici paneline erişmek için giriş yapın
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="text-destructive text-sm text-center bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-1">
                Kullanıcı Adı
              </label>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-muted bg-background placeholder-muted-foreground text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Admin kullanıcı adı"
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Şifre
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-muted bg-background placeholder-muted-foreground text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Admin şifresi"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Giriş Yapılıyor...
                </>
              ) : (
                "Giriş Yap"
              )}
            </button>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Test hesabı: <span className="font-medium">admin</span> / <span className="font-medium">admin123</span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
} 