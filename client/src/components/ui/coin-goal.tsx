import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
import { CoinsIcon, LockIcon, UnlockIcon } from "lucide-react";

interface CoinGoalProps {
  targetAmount: number;
  currentAmount: number;
  onComplete?: () => void;
  description: string;
  className?: string;
}

export function CoinGoal({
  targetAmount,
  currentAmount,
  onComplete,
  description,
  className,
}: CoinGoalProps) {
  const [isCompleted, setIsCompleted] = useState(false);
  const progress = Math.min((currentAmount / targetAmount) * 100, 100);

  useEffect(() => {
    if (currentAmount >= targetAmount && !isCompleted) {
      setIsCompleted(true);
      onComplete?.();
      // Konfeti efekti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [currentAmount, targetAmount, isCompleted, onComplete]);

  return (
    <div
      className={cn(
        "rounded-xl p-6",
        "bg-black/40 backdrop-blur-lg",
        "border border-white/10",
        className
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/20"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <CoinsIcon className="h-6 w-6 text-purple-400" />
          </motion.div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {currentAmount} / {targetAmount} ZYRA
            </h3>
            <p className="text-sm text-white/60">{description}</p>
          </div>
        </div>
        <AnimatePresence>
          {isCompleted ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20"
            >
              <UnlockIcon className="h-4 w-4 text-green-400" />
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/20"
            >
              <LockIcon className="h-4 w-4 text-orange-400" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* İlerleme Çubuğu */}
      <div className="h-3 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-300"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Hedef Durumu */}
      <div className="mt-2 flex justify-between text-sm">
        <span className="text-white/60">
          {Math.max(targetAmount - currentAmount, 0)} ZYRA kaldı
        </span>
        <span className="font-medium text-purple-400">
          {isCompleted ? "Hedef Tamamlandı! 🎉" : `%${Math.round(progress)}`}
        </span>
      </div>
    </div>
  );
} 