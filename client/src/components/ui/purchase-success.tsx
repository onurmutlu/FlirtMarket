import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CoinsIcon, Sparkles, Trophy } from "lucide-react";
import confetti from "canvas-confetti";

interface PurchaseSuccessProps {
  amount: number;
  xpGained: number;
  consecutivePurchases: number;
  bonusAmount?: number;
  onClose: () => void;
}

function CoinRain() {
  useEffect(() => {
    const duration = 3 * 1000;
    const defaults = {
      startVelocity: 30,
      spread: 360,
      ticks: 60,
      zIndex: 100,
      colors: ["#FFD700", "#FFA500"],
    };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval: any = setInterval(() => {
      const timeLeft = duration;

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      confetti({
        ...defaults,
        particleCount: 50,
        origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return null;
}

export function PurchaseSuccess({
  amount,
  xpGained,
  consecutivePurchases,
  bonusAmount = 0,
  onClose,
}: PurchaseSuccessProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <CoinRain />
        
        <motion.div
          className="relative overflow-hidden rounded-2xl bg-black/80 p-6 backdrop-blur-xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          {/* Başlık */}
          <motion.div
            className="mb-6 flex items-center justify-center gap-2 text-2xl font-bold text-white"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <CoinsIcon className="h-8 w-8 text-yellow-400" />
            <span>{amount} ZYRA</span>
            <Sparkles className="h-8 w-8 text-purple-400" />
          </motion.div>

          {/* XP Kazanımı */}
          <motion.div
            className="mb-4 rounded-lg bg-purple-500/20 p-4 text-center"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-sm text-purple-300">
              +{xpGained} XP Kazandın! 🎮
            </p>
          </motion.div>

          {/* Üst Üste Alım Bonusu */}
          {consecutivePurchases > 0 && (
            <motion.div
              className="mb-4 rounded-lg bg-emerald-500/20 p-4 text-center"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center justify-center gap-2">
                <Trophy className="h-5 w-5 text-emerald-400" />
                <p className="text-sm text-emerald-300">
                  {consecutivePurchases}. Üst Üste Alım!
                </p>
              </div>
              {consecutivePurchases >= 3 && bonusAmount > 0 && (
                <motion.p
                  className="mt-2 text-xs text-emerald-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  +{bonusAmount} Bonus Coin Kazandın! 🎁
                </motion.p>
              )}
            </motion.div>
          )}

          {/* İlerleme Çubuğu */}
          <motion.div
            className="h-2 overflow-hidden rounded-full bg-white/10"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-purple-300"
              initial={{ x: "-100%" }}
              animate={{ x: "0%" }}
              transition={{ delay: 0.5, duration: 0.8 }}
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 