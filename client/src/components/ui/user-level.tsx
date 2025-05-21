import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { DiamondIcon, CoinsIcon, CrownIcon } from "lucide-react";
import styled, { keyframes } from "styled-components";

interface Level {
  id: string;
  name: string;
  icon: JSX.Element;
  requiredCoins: number;
  color: string;
  benefits: string[];
  borderEffect?: string;
}

const LEVELS: Level[] = [
  {
    id: "bronze",
    name: "Bronz",
    icon: <CoinsIcon className="h-6 w-6" />,
    requiredCoins: 0,
    color: "text-orange-400",
    benefits: ["Temel özellikler"],
  },
  {
    id: "silver",
    name: "Gümüş",
    icon: <CrownIcon className="h-6 w-6" />,
    requiredCoins: 500,
    color: "text-slate-300",
    benefits: ["+10% bonus coin", "Özel rozetler"],
    borderEffect: "animate-border-silver",
  },
  {
    id: "gold",
    name: "Altın",
    icon: <CrownIcon className="h-6 w-6" />,
    requiredCoins: 1000,
    color: "text-yellow-400",
    benefits: ["+25% bonus coin", "Animasyonlu mesajlar", "VIP destek"],
    borderEffect: "animate-border-gold",
  },
  {
    id: "diamond",
    name: "Elmas",
    icon: <DiamondIcon className="h-6 w-6" />,
    requiredCoins: 2500,
    color: "text-blue-400",
    benefits: ["+50% bonus coin", "Özel efektler", "Premium içerik"],
    borderEffect: "animate-border-diamond",
  },
];

interface UserLevelProps {
  totalSpent: number;
  className?: string;
}

const borderSilver = keyframes`
  0%, 100% { border-color: rgba(226,232,240,0.3); }
  50% { border-color: rgba(226,232,240,0.6); }
`;

const borderGold = keyframes`
  0%, 100% { border-color: rgba(250,204,21,0.3); }
  50% { border-color: rgba(250,204,21,0.6); }
`;

const borderDiamond = keyframes`
  0% { border-color: rgba(96,165,250,0.3); }
  33% { border-color: rgba(167,139,250,0.3); }
  66% { border-color: rgba(236,72,153,0.3); }
  100% { border-color: rgba(96,165,250,0.3); }
`;

const AnimatedBorder = styled.div`
  &.animate-border-silver {
    animation: ${borderSilver} 2s ease-in-out infinite;
  }
  &.animate-border-gold {
    animation: ${borderGold} 2s ease-in-out infinite;
  }
  &.animate-border-diamond {
    animation: ${borderDiamond} 3s ease-in-out infinite;
  }
`;

export function UserLevel({ totalSpent, className }: UserLevelProps) {
  // Mevcut seviyeyi bul
  const currentLevel = LEVELS.reduce((prev, curr) => {
    if (totalSpent >= curr.requiredCoins) return curr;
    return prev;
  });

  // Bir sonraki seviye
  const nextLevel = LEVELS[LEVELS.indexOf(currentLevel) + 1];

  // İlerleme yüzdesi
  const progress = nextLevel
    ? ((totalSpent - currentLevel.requiredCoins) /
       (nextLevel.requiredCoins - currentLevel.requiredCoins)) * 100
    : 100;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Mevcut Seviye Kartı */}
      <AnimatedBorder
        className={cn(
          "relative overflow-hidden rounded-xl p-6",
          "bg-black/40 backdrop-blur-lg backdrop-saturate-150",
          "border border-white/10",
          currentLevel.borderEffect
        )}
      >
        <style>{`
          @keyframes border-silver {
            0%, 100% { border-color: rgba(226,232,240,0.3); }
            50% { border-color: rgba(226,232,240,0.6); }
          }
          @keyframes border-gold {
            0%, 100% { border-color: rgba(250,204,21,0.3); }
            50% { border-color: rgba(250,204,21,0.6); }
          }
          @keyframes border-diamond {
            0% { border-color: rgba(96,165,250,0.3); }
            33% { border-color: rgba(167,139,250,0.3); }
            66% { border-color: rgba(236,72,153,0.3); }
            100% { border-color: rgba(96,165,250,0.3); }
          }
          .animate-border-silver {
            animation: border-silver 2s ease-in-out infinite;
          }
          .animate-border-gold {
            animation: border-gold 2s ease-in-out infinite;
          }
          .animate-border-diamond {
            animation: border-diamond 3s ease-in-out infinite;
          }
        `}</style>

        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full",
                "bg-gradient-to-br from-white/10 to-white/5",
                currentLevel.color
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {currentLevel.icon}
            </motion.div>
            <div>
              <h3 className={cn("text-lg font-bold", currentLevel.color)}>
                {currentLevel.name} Seviye
              </h3>
              <p className="text-sm text-white/60">
                {totalSpent} ZYRA harcandı
              </p>
            </div>
          </div>
        </div>

        {/* Seviye Özellikleri */}
        <div className="mb-4 space-y-2">
          {currentLevel.benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-2 text-sm text-white/80"
            >
              <motion.div
                className={cn("h-1.5 w-1.5 rounded-full", currentLevel.color)}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              {benefit}
            </motion.div>
          ))}
        </div>

        {nextLevel && (
          <>
            {/* İlerleme Çubuğu */}
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className={cn(
                  "h-full rounded-full",
                  "bg-gradient-to-r from-purple-500 to-purple-300"
                )}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1 }}
              />
            </div>

            {/* Sonraki Seviye Bilgisi */}
            <div className="mt-2 flex justify-between text-xs">
              <span className="text-white/60">
                {nextLevel.requiredCoins - totalSpent} ZYRA kaldı
              </span>
              <span className={cn("font-medium", nextLevel.color)}>
                {nextLevel.name} Seviye
              </span>
            </div>
          </>
        )}
      </AnimatedBorder>

      {/* Tüm Seviyeler */}
      <div className="grid grid-cols-2 gap-4">
        {LEVELS.map((level) => (
          <motion.div
            key={level.id}
            className={cn(
              "rounded-lg p-4",
              "bg-black/20 backdrop-blur-sm",
              "border border-white/10",
              totalSpent >= level.requiredCoins && [
                "bg-black/40",
                level.borderEffect,
              ]
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full",
                  "bg-gradient-to-br from-white/10 to-white/5",
                  totalSpent >= level.requiredCoins
                    ? level.color
                    : "text-white/40"
                )}
              >
                {level.icon}
              </div>
              <div>
                <h4
                  className={cn(
                    "font-medium",
                    totalSpent >= level.requiredCoins
                      ? level.color
                      : "text-white/40"
                  )}
                >
                  {level.name}
                </h4>
                <p className="text-xs text-white/40">
                  {level.requiredCoins} ZYRA
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <style>{`
        .progress-ring {
          transform: rotate(-90deg);
        }
        .progress-ring__circle {
          transition: stroke-dashoffset 0.35s;
          transform-origin: 50% 50%;
        }
      `}</style>
    </div>
  );
} 