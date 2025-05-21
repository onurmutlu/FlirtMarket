import { useState } from "react";
import { CoinPackages } from "@/components/ui/coin-packages";
import { OnboardingTutorial } from "@/components/ui/onboarding-tutorial";

// Örnek kullanıcı istatistikleri
const initialStats = {
  totalSpent: 750,
  averageTransaction: 75,
  lastPurchaseAmount: 100,
  consecutivePurchases: 0,
  level: 1,
  xp: 100,
};

export default function BuyCoinsPage() {
  const [userStats, setUserStats] = useState(initialStats);

  const handlePurchase = async (amount: number) => {
    // Burada gerçek satın alma işlemi yapılacak
    // Şimdilik sadece state'i güncelliyoruz
    setUserStats(prev => ({
      ...prev,
      lastPurchaseAmount: amount,
      consecutivePurchases: prev.consecutivePurchases + 1,
      totalSpent: prev.totalSpent + amount,
      xp: prev.xp + Math.floor(amount / 10),
      level: Math.floor((prev.xp + Math.floor(amount / 10)) / 100) + 1,
    }));
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-gray-900 via-purple-900/20 to-black p-4">
      <OnboardingTutorial />
      
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white/90">
            ZYRA Coin Satın Al
          </h1>
          <p className="mt-2 text-white/60">
            Daha fazla etkileşim için coin satın alın
          </p>
        </div>

        {/* Seviye Göstergesi */}
        <div className="mb-8 rounded-xl bg-black/40 p-4 backdrop-blur-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">Seviye {userStats.level}</p>
              <p className="text-xs text-purple-400">
                {userStats.xp} XP • Sonraki seviye: {(userStats.level) * 100} XP
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-white/60">Üst Üste Alım</p>
              <p className="text-xs text-emerald-400">
                {userStats.consecutivePurchases} kez
                {userStats.consecutivePurchases >= 2 && " • 1 alım kaldı!"}
              </p>
            </div>
          </div>
          
          {/* XP Progress Bar */}
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-purple-300 transition-all duration-500"
              style={{
                width: `${(userStats.xp % 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Kullanıcı İstatistikleri */}
        <div className="mb-8 grid grid-cols-3 gap-4 user-stats">
          <div className="rounded-xl bg-white/5 p-4 text-center">
            <p className="text-sm text-white/60">Toplam Harcama</p>
            <p className="mt-1 text-xl font-bold text-white">
              {userStats.totalSpent} ₺
            </p>
          </div>
          <div className="rounded-xl bg-white/5 p-4 text-center">
            <p className="text-sm text-white/60">Ortalama İşlem</p>
            <p className="mt-1 text-xl font-bold text-white">
              {userStats.averageTransaction} ZYRA
            </p>
          </div>
          <div className="rounded-xl bg-white/5 p-4 text-center">
            <p className="text-sm text-white/60">Son Alım</p>
            <p className="mt-1 text-xl font-bold text-white">
              {userStats.lastPurchaseAmount} ZYRA
            </p>
          </div>
        </div>

        {/* Coin Paketleri */}
        <div className="coin-packages">
          <CoinPackages
            userStats={userStats}
            onPurchase={handlePurchase}
          />
        </div>

        {/* Bilgi Notu */}
        <p className="mt-8 text-center text-sm text-white/40">
          * Bonus coinler 24 saat içinde hesabınıza tanımlanacaktır.
        </p>
      </div>
    </div>
  );
} 