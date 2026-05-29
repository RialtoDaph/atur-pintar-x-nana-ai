import { useEffect } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { ScreenWrapper, CTAButton } from "./shared";

// ─── Screen 12: Welcome to the Game ─────────────────────────────────────────
export default function Screen12({ primaryGoal, primaryGoalLabel, onDone }) {
  useEffect(() => {
    let cancelled = false;
    const end = Date.now() + 2500;
    let rafId;
    const frame = () => {
      if (cancelled) return;
      confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors: ["#FF6B35", "#FFD700", "#FF9A5C"] });
      confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors: ["#FF6B35", "#FFD700", "#FF9A5C"] });
      if (Date.now() < end) rafId = requestAnimationFrame(frame);
    };
    const timeoutId = setTimeout(frame, 400);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <ScreenWrapper>
      <div className="flex-1 px-6 py-8 overflow-y-auto">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">Selamat datang di<br />Atur Pintar!</h2>
          <p className="text-sm text-[#4A5568]">
            Kamu resmi jadi <strong>Level 1, Newbie Ngatur.</strong><br />
            Dan perjalanan naik level dimulai sekarang.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3 mb-6"
        >
          {/* XP Bar */}
          <div className="bg-[#F8FAFC] rounded-2xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-[#1A1A1A]">⚡ XP</span>
              <span className="text-xs text-[#8FA4C8]">0 / 500</span>
            </div>
            <div className="h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FFD700] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: "2%" }}
                transition={{ delay: 0.8, duration: 0.6 }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#FFF7ED] rounded-2xl p-4 text-center">
              <div className="text-2xl mb-1">🔥</div>
              <p className="text-xs text-[#8FA4C8]">Streak</p>
              <p className="text-sm font-bold text-[#1A1A1A]">Hari ke-1</p>
            </div>
            <div className="bg-[#F0FDF4] rounded-2xl p-4 text-center">
              <div className="text-2xl mb-1">🎯</div>
              <p className="text-xs text-[#8FA4C8]">Goal</p>
              <p className="text-xs font-bold text-[#1A1A1A] leading-tight">{primaryGoalLabel || primaryGoal}</p>
            </div>
          </div>
        </motion.div>

        {/* First Mission */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-r from-[#FF6B35] to-[#FF9A5C] rounded-2xl p-4 text-white"
        >
          <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">🏆 Mission Pertama</p>
          <p className="text-sm font-semibold">Catat 1 pengeluaran hari ini → +10 XP</p>
        </motion.div>
      </div>

      <div className="px-6 pb-8 pt-4">
        <CTAButton onClick={onDone}>
          Masuk ke Dashboard →
        </CTAButton>
      </div>
    </ScreenWrapper>
  );
}