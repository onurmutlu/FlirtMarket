import { useState } from "react";
import { cn } from "@/lib/utils";
import { StarIcon } from "@radix-ui/react-icons";
import { motion } from "framer-motion";
import { PurchaseSuccess } from "./purchase-success";

interface CoinPackage {
  id: string;
  coins: number;
  bonus: number;
  price: number;
  isPopular?: boolean;
}

interface UserStats {
  totalSpent: number;
  averageTransaction: number;
  lastPurchaseAmount: number;
  consecutivePurchases: number;
  level: number;
  xp: number;
}

function calculateXP(amount: number): number {
  // Her 10 ZYRA için 1 XP
  return Math.floor(amount / 10);
}

function getRecommendedPackage(stats: UserStats): CoinPackage {
  const packages: CoinPackage[] = [
    { id: "starter", coins: 100, bonus: 10, price: 50 },
    { id: "basic", coins: 500, bonus: 50, price: 200 },
    { id: "popular", coins: 1000, bonus: 200, price: 350 },
    { id: "premium", coins: 2500, bonus: 750, price: 750 },
    { id: "ultimate", coins: 5000, bonus: 2000, price: 1250 },
  ];

  // Kullanıcının harcama davranışlarını analiz et
  const spendingFactor = stats.totalSpent / stats.averageTransaction;
  const loyaltyBonus = stats.consecutivePurchases * 0.1; // Her ardışık alımda %10 bonus
  const levelMultiplier = 1 + (stats.level * 0.05); // Her seviye için %5 çarpan

  // Önerilen coin miktarını hesapla
  let recommendedCoins = Math.ceil(
    stats.averageTransaction * spendingFactor * (1 + loyaltyBonus) * levelMultiplier
  );

  // En yakın paketi bul
  const recommended = packages.reduce((best, current) => {
    const currentDiff = Math.abs(current.coins - recommendedCoins);
    const bestDiff = Math.abs(best.coins - recommendedCoins);
    
    if (currentDiff < bestDiff) {
      return current;
    }
    
    // Eğer farklar eşitse, daha yüksek bonus oranı olanı seç
    if (currentDiff === bestDiff) {
      return (current.bonus / current.coins) > (best.bonus / best.coins) ? current : best;
    }
    
    return best;
  });

  // Özel bonus hesapla
  const extraBonus = Math.floor(
    recommended.bonus * (1 + loyaltyBonus) * levelMultiplier
  );

  return {
    ...recommended,
    bonus: extraBonus
  };
}

function PackageCard({
  coins,
  bonus,
  price,
  isRecommended,
  onPurchase,
  className,
}: {
  coins: number;
  bonus: number;
  price: number;
  isRecommended?: boolean;
  onPurchase: () => void;
  className?: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative overflow-hidden rounded-xl p-4",
        "bg-black/40 backdrop-blur-lg backdrop-saturate-150",
        "border border-white/10",
        isRecommended && [
          "border-purple-500/50",
          "animate-glow",
          "shadow-[0_0_20px_2px_rgba(168,85,247,0.2)]",
        ],
        className
      )}
    >
      {isRecommended && (
        <div className="absolute -right-6 -top-2 rotate-12 bg-purple-500/80 px-8 py-1 text-xs font-semibold">
          Önerilen
        </div>
      )}

      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">
            {coins} <span className="text-purple-400">ZYRA</span>
          </h3>
          {bonus > 0 && (
            <p className="mt-1 text-sm text-emerald-400">+{bonus} Bonus</p>
          )}
        </div>
        
        {isRecommended && (
          <StarIcon className="h-5 w-5 animate-pulse text-purple-400" />
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-white/60">
          {((coins + bonus) / price).toFixed(1)} ZYRA/₺
        </p>
        <button
          onClick={onPurchase}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium",
            "bg-white/10 hover:bg-white/20",
            "transition-colors duration-200",
            isRecommended && "bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
          )}
        >
          {price} ₺
        </button>
      </div>
    </motion.div>
  );
}

interface CoinPackagesProps {
  userStats: UserStats;
  onPurchase?: (amount: number) => Promise<void>;
  className?: string;
}

export function CoinPackages({ userStats, onPurchase, className }: CoinPackagesProps) {
  const [purchaseSuccess, setPurchaseSuccess] = useState<{
    amount: number;
    xpGained: number;
  } | null>(null);

  const recommendedPackage = getRecommendedPackage(userStats);
  
  const allPackages: CoinPackage[] = [
    { id: "starter", coins: 100, bonus: 10, price: 50 },
    { id: "basic", coins: 500, bonus: 50, price: 200 },
    recommendedPackage,
    { id: "premium", coins: 2500, bonus: 750, price: 750 },
  ];

  const handlePurchase = async (coins: number, bonus: number) => {
    try {
      if (onPurchase) {
        await onPurchase(coins + bonus);
      }

      const xpGained = calculateXP(coins);
      setPurchaseSuccess({ amount: coins + bonus, xpGained });
    } catch (error) {
      console.error("Purchase failed:", error);
    }
  };

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <style>{`
        @keyframes glow {
          0%, 100% { border-color: rgba(168,85,247,0.2); }
          50% { border-color: rgba(168,85,247,0.5); }
        }
        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }
      `}</style>

      <div className="grid gap-4 md:grid-cols-2">
        {allPackages.map((pkg) => (
          <PackageCard
            key={pkg.id}
            coins={pkg.coins}
            bonus={pkg.bonus}
            price={pkg.price}
            isRecommended={pkg.id === recommendedPackage.id}
            onPurchase={() => handlePurchase(pkg.coins, pkg.bonus)}
          />
        ))}
      </div>

      {purchaseSuccess && (
        <PurchaseSuccess
          amount={purchaseSuccess.amount}
          xpGained={purchaseSuccess.xpGained}
          consecutivePurchases={userStats.consecutivePurchases}
          bonusAmount={userStats.consecutivePurchases >= 3 ? 50 : 0}
          onClose={() => setPurchaseSuccess(null)}
        />
      )}
    </div>
  );
} 