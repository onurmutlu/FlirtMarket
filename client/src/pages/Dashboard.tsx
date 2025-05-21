import { useState, useEffect } from "react";
import { UserLevel } from "@/components/ui/user-level";
import { CoinGoal } from "@/components/ui/coin-goal";
import { CoinWheel } from "@/components/ui/coin-wheel";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";
import { apiRequest } from "@/lib/queryClient";

export default function Dashboard() {
  const { user, addCoins } = useUser();
  const [lastFreeSpin, setLastFreeSpin] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    // LocalStorage'dan son çevirme zamanını al
    const storedLastSpin = localStorage.getItem('lastFreeSpin');
    if (storedLastSpin) {
      setLastFreeSpin(storedLastSpin);
    }
  }, []);

  // Ücretsiz çevirme hakkı kontrolü
  const checkFreeSpin = () => {
    if (!user) return false;
    const today = new Date().toISOString().split('T')[0];
    return lastFreeSpin !== today;
  };

  // Çark çevirme işlemi
  const handleSpin = async (amount: number) => {
    if (isSpinning || !user) return;
    
    try {
      setIsSpinning(true);
      const today = new Date().toISOString().split('T')[0];
      
      // API'ye çark çevirme isteği gönder
      const response = await apiRequest('POST', '/api/wheel/spin', {
        amount,
        date: today
      });
      
      const result = await response.json();
      
      if (result.success) {
        // LocalStorage'a kaydet
        localStorage.setItem('lastFreeSpin', today);
        setLastFreeSpin(today);
        
        // Coinleri ekle
        addCoins(amount);
        
        toast.success(`🎉 Tebrikler! ${amount} ZYRA kazandınız!`, {
          description: "Kazandığınız ZYRA'lar hesabınıza eklendi.",
        });
      } else {
        toast.error("Çark çevirme başarısız oldu", {
          description: result.message || "Lütfen daha sonra tekrar deneyin.",
        });
      }
    } catch (error) {
      console.error('Wheel spin error:', error);
      toast.error("Bir hata oluştu", {
        description: "Çark çevirme işlemi sırasında bir hata oluştu.",
      });
    } finally {
      setIsSpinning(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Kullanıcı Seviyesi */}
        <UserLevel totalSpent={user.totalSpent || 0} />

        {/* Jeton Hedefi */}
        <CoinGoal
          targetAmount={1000}
          currentAmount={user.coins || 0}
          description="Bugün 1000 ZYRA'ya ulaşırsam özel içerik paylaşacağım 💫"
          onComplete={() => {
            toast.success("🎯 Hedefinize ulaştınız!", {
              description: "Artık özel içeriğinizi paylaşabilirsiniz.",
            });
          }}
        />

        {/* Coin Çarkı */}
        <div className="md:col-span-2">
          <CoinWheel
            isFreeSpin={checkFreeSpin()}
            onSpin={handleSpin}
            className="mx-auto max-w-md"
            disabled={isSpinning}
          />
        </div>
      </div>
    </div>
  );
} 