import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import confetti from "canvas-confetti";

export default function AchievementPopup({ achievement, onClose }) {
  useEffect(() => {
    if (!achievement) return;
    confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 }, colors: ["#FF6A00", "#FFD700", "#FFF"] });
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [achievement]);

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.4, y: 80 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 12, stiffness: 180 }}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-3xl px-8 py-8 flex flex-col items-center gap-4 shadow-2xl mx-6 max-w-xs w-full"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 0.8 }}
              className="text-6xl"
            >
              {achievement.emoji}
            </motion.div>

            <div className="text-center">
              <p className="text-xs font-bold text-[#FF6A00] uppercase tracking-widest mb-1">Achievement Unlocked! 🏆</p>
              <h2 className="text-xl font-black text-[#1A1A1A]">{achievement.name}</h2>
              <p className="text-sm text-[#8FA4C8] mt-1">{achievement.desc}</p>
            </div>

            <div className="w-full h-px bg-[#F2F4F7]" />

            <button onClick={onClose}
              className="w-full py-3 rounded-2xl bg-[#FF6A00] text-white font-bold text-sm hover:bg-[#e05e00] transition-colors">
              Keren! 💪
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}