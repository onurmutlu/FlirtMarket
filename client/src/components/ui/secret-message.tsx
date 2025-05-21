import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LockIcon, UnlockIcon, SparklesIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SecretMessageProps {
  message: string;
  cost?: number;
  onUnlock?: () => Promise<boolean>;
  className?: string;
}

export function SecretMessage({
  message,
  cost = 30,
  onUnlock,
  className,
}: SecretMessageProps) {
  const [isLocked, setIsLocked] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const handleUnlock = async () => {
    if (!onUnlock || isUnlocking) return;

    setIsUnlocking(true);
    try {
      const success = await onUnlock();
      if (success) {
        setIsLocked(false);
      }
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-xl",
        "border border-white/10",
        className
      )}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Mesaj İçeriği */}
      <motion.div
        className={cn(
          "relative p-4",
          "bg-black/40 backdrop-blur-lg backdrop-saturate-150",
          isLocked && "select-none"
        )}
      >
        <AnimatePresence>
          {isLocked ? (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {/* Blur Efektli Mesaj */}
              <p className="blur-sm text-white/60">
                {message}
              </p>
              
              {/* Kilit İkonu ve Açıklama */}
              <div className="flex items-center justify-center gap-2 text-sm">
                <LockIcon className="h-4 w-4 text-purple-400" />
                <span className="text-purple-300">
                  Bunu sadece özel olanlar görebilir 👀
                </span>
              </div>

              {/* Açma Butonu */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
                className={cn(
                  "mt-4 w-full rounded-lg py-2",
                  "bg-purple-500/20 backdrop-blur-sm",
                  "text-sm font-medium text-purple-300",
                  "transition-colors duration-200",
                  "hover:bg-purple-500/30",
                  "disabled:opacity-50"
                )}
                onClick={handleUnlock}
                disabled={isUnlocking}
              >
                {isUnlocking ? (
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
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", duration: 0.6 }}
            >
              {/* Açılmış Mesaj */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <UnlockIcon className="h-4 w-4" />
                  <span>Mesaj açıldı!</span>
                </div>
                <p className="text-white/90">{message}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Parıltı Efekti */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={false}
        animate={isHovered ? { opacity: 1 } : { opacity: 0 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent" />
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent to-purple-500/10"
          initial={{ x: "100%" }}
          animate={isHovered ? { x: "-100%" } : { x: "100%" }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </motion.div>
    </motion.div>
  );
} 