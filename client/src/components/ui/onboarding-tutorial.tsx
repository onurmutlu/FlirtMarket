import { useEffect, useState } from "react";
import Joyride, { Step, CallBackProps, STATUS } from "react-joyride";
import { motion } from "framer-motion";
import { useLocalStorage } from "@/hooks/use-local-storage";

interface OnboardingTutorialProps {
  isFirstTime?: boolean;
}

const steps: Step[] = [
  {
    target: ".coin-packages",
    content: (
      <div className="space-y-2 p-2">
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-lg font-semibold text-white"
        >
          ZYRA Coin ile Mesajlaş! 💬
        </motion.h3>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-sm text-white/80"
        >
          Coin kullanarak şovculara özel mesajlar gönderebilirsiniz.
          Her mesaj 1 ZYRA coin'e mal olur.
        </motion.p>
      </div>
    ),
    placement: "center",
    disableBeacon: true,
  },
  {
    target: ".user-stats",
    content: (
      <div className="space-y-2 p-2">
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-lg font-semibold text-white"
        >
          Seviyeni Yükselt! 🏆
        </motion.h3>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-sm text-white/80"
        >
          Ne kadar çok coin harcarsanız, seviyeniz o kadar yükselir.
          Yüksek seviyeler size özel ayrıcalıklar sunar.
        </motion.p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: ".recommended-package",
    content: (
      <div className="space-y-2 p-2">
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-lg font-semibold text-white"
        >
          VIP Ayrıcalıkları 👑
        </motion.h3>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-sm text-white/80"
        >
          VIP üyeler her coin paketinde ekstra bonus kazanır ve
          özel mesajlaşma özellikleri açılır.
        </motion.p>
      </div>
    ),
    placement: "left",
  },
];

const joyrideStyles = {
  options: {
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    overlayColor: "rgba(0, 0, 0, 0.5)",
    textColor: "#fff",
    arrowColor: "rgba(0, 0, 0, 0.8)",
  },
  tooltipContainer: {
    textAlign: "left" as const,
  },
  buttonNext: {
    backgroundColor: "rgb(168, 85, 247)",
    fontSize: "14px",
    padding: "8px 16px",
    borderRadius: "6px",
  },
  buttonBack: {
    color: "rgb(168, 85, 247)",
    marginRight: 10,
  },
  buttonClose: {
    display: "none",
  },
};

export function OnboardingTutorial({ isFirstTime = true }: OnboardingTutorialProps) {
  const [run, setRun] = useState(false);
  const [hasSeenTutorial, setHasSeenTutorial] = useLocalStorage("has-seen-tutorial", false);

  useEffect(() => {
    if (isFirstTime && !hasSeenTutorial) {
      setRun(true);
    }
  }, [isFirstTime, hasSeenTutorial]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      setHasSeenTutorial(true);
    }
  };

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton
      run={run}
      scrollToFirstStep
      showProgress
      showSkipButton
      steps={steps}
      styles={joyrideStyles}
      locale={{
        back: "Geri",
        close: "Kapat",
        last: "Bitti",
        next: "İleri",
        skip: "Geç"
      }}
    />
  );
} 