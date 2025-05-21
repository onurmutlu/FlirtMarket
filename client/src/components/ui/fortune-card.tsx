import { useState } from "react";
import { motion } from "framer-motion";
import { SparklesIcon, CoinsIcon, TrophyIcon } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";

type RewardType = "coin" | "xp" | "badge";

interface Reward {
  type: RewardType;
  amount: number;
  title: string;
  description: string;
  emoji: string;
}

const REWARDS: Reward[] = [
  {
    type: "coin",
    amount: 20,
    title: "Şanslı Coin!",
    description: "Bugün şanslı gününmüş 😏",
    emoji: "🎰",
  },
  {
    type: "xp",
    amount: 50,
    title: "XP Boost!",
    description: "Seviyene seviye kattın! 🚀",
    emoji: "⭐️",
  },
  {
    type: "badge",
    amount: 1,
    title: "Özel Rozet!",
    description: "VIP üyelere özel rozet kazandın!",
    emoji: "👑",
  },
];

interface FortuneCardProps {
  cost?: number;
  onPurchase?: () => Promise<boolean>;
  onReward?: (reward: Reward) => void;
  className?: string;
}

export function FortuneCard({
  cost = 50,
  onPurchase,
  onReward,
  className,
}: FortuneCardProps) {
  const [isRevealing, setIsRevealing] = useState(false);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [reward, setReward] = useState<Reward | null>(null);

  const handleReveal = async () => {
    if (!onPurchase || isRevealing) return;

    setIsRevealing(true);
    try {
      const success = await onPurchase();
      if (success) {
        // Rastgele kart seç
        const randomIndex = Math.floor(Math.random() * REWARDS.length);
        setSelectedCard(randomIndex);

        // 3 saniye sonra ödülü göster
        setTimeout(() => {
          const reward = REWARDS[randomIndex];
          setReward(reward);
          onReward?.(reward);

          // Konfeti efekti
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        }, 3000);
      }
    } finally {
      setIsRevealing(false);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white">Kader Paketi</h3>
        <p className="text-sm text-white/60">
          Şansını dene, sürpriz ödüller kazan! 🎁
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className={cn(
              "aspect-[3/4] cursor-pointer rounded-xl p-4",
              "bg-black/40 backdrop-blur-lg backdrop-saturate-150",
              "border-2 border-white/10",
              selectedCard === index && "border-purple-500"
            )}
            animate={{
              rotateY: selectedCard === index ? 180 : 0,
              scale: selectedCard === index ? 1.05 : 1,
            }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="relative h-full w-full"
              animate={{
                rotateY: selectedCard === index ? 180 : 0,
              }}
              transition={{ duration: 0.6 }}
            >
              {/* Ön Yüz */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  backfaceVisibility: "hidden",
                }}
              >
                <SparklesIcon className="h-8 w-8 text-purple-400" />
              </motion.div>

              {/* Arka Yüz */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              >
                {reward && selectedCard === index && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-4xl"
                  >
                    {reward.emoji}
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        ))}
      </div>

      {!selectedCard ? (
        <motion.button
          className={cn(
            "w-full rounded-lg py-2",
            "bg-purple-500/20 backdrop-blur-sm",
            "text-sm font-medium text-purple-300",
            "transition-colors duration-200",
            "hover:bg-purple-500/30",
            "disabled:opacity-50"
          )}
          onClick={handleReveal}
          disabled={isRevealing}
        >
          {isRevealing ? (
            <span className="flex items-center justify-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <SparklesIcon className="h-4 w-4" />
              </motion.div>
              Açılıyor...
            </span>
          ) : (
            <span>{cost} ZYRA ile Aç</span>
          )}
        </motion.button>
      ) : reward ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-black/40 p-4 text-center backdrop-blur-lg"
        >
          <div className="mb-2 text-2xl">{reward.emoji}</div>
          <h4 className="text-lg font-semibold text-white">{reward.title}</h4>
          <p className="text-sm text-white/60">{reward.description}</p>
          <div className="mt-2 flex items-center justify-center gap-2 text-purple-400">
            {reward.type === "coin" && <CoinsIcon className="h-4 w-4" />}
            {reward.type === "xp" && <SparklesIcon className="h-4 w-4" />}
            {reward.type === "badge" && <TrophyIcon className="h-4 w-4" />}
            <span>+{reward.amount} {reward.type.toUpperCase()}</span>
          </div>
        </motion.div>
      ) : null}
    </div>
  );
} 