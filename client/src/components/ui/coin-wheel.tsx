import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CoinsIcon, RefreshCwIcon } from "lucide-react";
import confetti from "canvas-confetti";
import { Button } from "./button";

interface CoinWheelProps {
  isFreeSpin: boolean;
  onSpin: (amount: number) => void;
  className?: string;
  disabled?: boolean;
}

const WHEEL_ITEMS = [
  { value: 5, color: "bg-purple-500", textColor: "text-white" },
  { value: 2, color: "bg-green-500", textColor: "text-white" },
  { value: 10, color: "bg-yellow-500", textColor: "text-black" },
  { value: 1, color: "bg-blue-500", textColor: "text-white" },
  { value: 20, color: "bg-pink-500", textColor: "text-white" },
  { value: 3, color: "bg-indigo-500", textColor: "text-white" },
  { value: 50, color: "bg-amber-500", textColor: "text-black" },
  { value: 0, color: "bg-gray-500", textColor: "text-white" },
];

export function CoinWheel({ isFreeSpin, onSpin, className, disabled }: CoinWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  const spinWheel = async () => {
    if (isSpinning || !isFreeSpin || disabled) return;
    
    try {
      setIsSpinning(true);
      setSelectedItem(null);
      
      // Rastgele dönüş açısı hesapla (minimum 2 tur atsın)
      const randomDegrees = Math.floor(Math.random() * 360);
      const fullRotations = 720; // 2 tam tur
      const newRotation = rotation + fullRotations + randomDegrees;
      
      setRotation(newRotation);
      
      // Kazanılan değeri hesapla
      const normalizedDegree = newRotation % 360;
      const itemIndex = Math.floor((360 - normalizedDegree) / (360 / WHEEL_ITEMS.length));
      const item = WHEEL_ITEMS[itemIndex % WHEEL_ITEMS.length];
      
      // 3 saniye bekle ve sonucu göster
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setSelectedItem(item.value);
      
      if (item.value > 0) {
        // Konfeti efekti
        confetti({
          particleCount: item.value * 5,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
      
      // Sonucu gönder
      await onSpin(item.value);
      
      // Spinner'ı durdur
      setTimeout(() => {
        setIsSpinning(false);
      }, 1000);
    } catch (error) {
      console.error('Wheel spin error:', error);
      setIsSpinning(false);
    }
  };
  
  return (
    <div className={cn("text-center", className)}>
      <h3 className="mb-4 text-xl font-bold">Günlük ZYRA Çarkı</h3>
      <p className="mb-6 text-sm text-muted-foreground">
        {isFreeSpin
          ? "Her gün bir kez ücretsiz çevirme hakkın var!"
          : "Bugün için ücretsiz çevirme hakkını kullandın. Yarın tekrar gel!"}
      </p>
      
      <div className="relative mx-auto my-8 h-64 w-64">
        {/* Çark işaretçisi (üçgen) */}
        <div className="absolute left-1/2 top-0 z-10 h-0 w-0 -translate-x-1/2 -translate-y-1/2 transform">
          <div className="h-0 w-0 border-l-[10px] border-r-[10px] border-t-[20px] border-l-transparent border-r-transparent border-t-primary"></div>
        </div>
        
        {/* Çark */}
        <motion.div
          ref={wheelRef}
          className="relative h-full w-full rounded-full border-4 border-white/10"
          style={{
            transformOrigin: "center center",
          }}
          animate={{
            rotate: rotation,
          }}
          transition={{
            duration: 3,
            ease: [0.17, 0.67, 0.83, 0.97],
          }}
        >
          {WHEEL_ITEMS.map((item, index) => {
            const degrees = (index * 360) / WHEEL_ITEMS.length;
            return (
              <div
                key={index}
                className={cn(
                  "absolute left-1/2 top-1/2 h-full w-1/2 origin-left",
                  item.color
                )}
                style={{
                  transform: `rotate(${degrees}deg)`,
                  clipPath: "polygon(0 0, 100% 50%, 0 100%)",
                }}
              >
                <div
                  className={cn("absolute left-[60%] top-1/2 -translate-y-1/2 font-bold", item.textColor)}
                  style={{
                    transform: `rotate(${90 + degrees}deg)`,
                  }}
                >
                  {item.value}
                </div>
              </div>
            );
          })}
        </motion.div>
        
        {/* Orta düğme */}
        <div className="absolute left-1/2 top-1/2 z-10 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 transform items-center justify-center rounded-full bg-primary shadow-lg">
          <CoinsIcon className="h-8 w-8 text-white" />
        </div>
      </div>
      
      {selectedItem !== null && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-4 text-lg font-bold"
        >
          {selectedItem > 0 ? (
            <span className="text-green-500">Kazandın: {selectedItem} ZYRA! 🎉</span>
          ) : (
            <span className="text-red-500">Üzgünüm, boş geldi! 😢</span>
          )}
        </motion.div>
      )}
      
      <Button
        size="lg"
        disabled={disabled || isSpinning || !isFreeSpin}
        onClick={spinWheel}
        className="mt-4"
      >
        <RefreshCwIcon className="mr-2 h-4 w-4" />
        {isSpinning ? "Çevriliyor..." : "Çarkı Çevir"}
      </Button>
    </div>
  );
} 