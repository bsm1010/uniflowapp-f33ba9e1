import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Zap, X, Sparkles } from "lucide-react";
import { XPBar } from "./XPBar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface LevelUpDialogProps {
  open: boolean;
  level: number;
  xp: number;
  xpForCurrent: number;
  xpForNext: number;
  onClose: () => void;
}

export function LevelUpDialog({ open, level, xp, xpForCurrent, xpForNext, onClose }: LevelUpDialogProps) {
  const { t } = useTranslation();
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
            className="w-full max-w-sm"
          >
            <Card className="border-0 shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-br from-violet-600 via-fuchsia-600 to-amber-500 p-6 text-center relative">
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 text-white/70 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.2 }}
                  className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-white/20 backdrop-blur mb-4"
                >
                  <Zap className="h-8 w-8 text-white drop-shadow-lg" />
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-white"
                >
                  {t("dashboard.gamification.levelUp")}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-white/80 text-sm mt-1"
                >
                  {t("dashboard.gamification.youReached")} <span className="font-bold text-white">{t("dashboard.gamification.levelPrefix")}{level}</span>
                </motion.p>
              </div>
              <div className="p-5 space-y-4">
                <XPBar
                  xp={xp}
                  level={level}
                  xpForCurrent={xpForCurrent}
                  xpForNext={xpForNext}
                  size="sm"
                />
                <Button
                  className="w-full gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:from-violet-600 hover:to-fuchsia-600"
                  onClick={onClose}
                >
                  <Sparkles className="h-4 w-4" />
                  {t("dashboard.gamification.continue")}
                </Button>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
