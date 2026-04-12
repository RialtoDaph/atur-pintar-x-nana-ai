import { useEffect } from "react";
import { Flame, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { LEVELS, getLevelFromXP } from "@/hooks/useGamification";
import StreakCelebrationPopup from "./StreakCelebrationPopup";
import AchievementPopup from "./AchievementPopup";
import { format } from "date-fns";

export default function StreakWidget({
  profile,
  streakPopup, setStreakPopup,
  achievementPopup, setAchievementPopup,
  levelUpPopup, setLevelUpPopup,
  xpFloatMsg,
  streakResetMsg, setStreakResetMsg,
}) {
  const [expanded, setExpanded] = useState(false);

  const safeProfile = profile || { daily_streak: 0, longest_streak: 0, total_points: 0, level: 1, last_activity_date: null };
  const currentLevel = getLevelFromXP(safeProfile.total_points || 0);
  const nextLevel = LEVELS.find(l => l.level === currentLevel.level + 1);
  const progressToNext = nextLevel
    ? Math.min(100, ((safeProfile.total_points - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100)
    : 100;
  const isActiveToday = safeProfile.last_activity_date === format(new Date(), "yyyy-MM-dd");

  return (
    <>
      {/* Streak reset message */}
      <AnimatePresence>
        {streakResetMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-3 mb-0"
          >
            <span className="text-xl">😢</span>
            <p className="text-sm text-amber-800 font-medium flex-1">{streakResetMsg}</p>
            <button onClick={() => setStreakResetMsg(null)} className="text-amber-400 hover:text-amber-600 text-lg leading-none">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-2xl shadow-sm border border-[#F2F4F7] overflow-hidden relative">
        {/* XP float animation */}
        <AnimatePresence>
          {xpFloatMsg && (
            <motion.div
              initial={{ opacity: 1, y: 0 }} animate={{ opacity: 0, y: -24 }} transition={{ duration: 1.8 }}
              className="absolute top-2 right-14 text-xs font-black text-[#FF6A00] pointer-events-none z-10"
            >
              {xpFloatMsg}
            </motion.div>
          )}
        </AnimatePresence>

        <button onClick={() => setExpanded(v => !v)} className="w-full px-4 py-3 flex items-center gap-3 text-left tap-highlight-fix">
          <motion.div
            animate={isActiveToday ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
            className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${isActiveToday ? "bg-[#FF6A00]/10" : "bg-[#F2F4F7]"}`}
          >
            <Flame className={`w-4 h-4 ${isActiveToday ? "text-[#FF6A00]" : "text-[#8FA4C8]"}`} />
            <p className={`text-xs font-black leading-none mt-0.5 ${isActiveToday ? "text-[#FF6A00]" : "text-[#8FA4C8]"}`}>
              {safeProfile.daily_streak}
            </p>
          </motion.div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#1A1A1A] leading-tight">
              {!isActiveToday ? "Catat transaksi hari ini!" : `${safeProfile.daily_streak} hari berturut-turut 🔥`}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 bg-[#F2F4F7] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${progressToNext}%`, backgroundColor: currentLevel.color }} />
              </div>
              <span className="text-[10px] text-[#8FA4C8] whitespace-nowrap">{safeProfile.total_points} XP</span>
            </div>
          </div>

          <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: currentLevel.color + "20", color: currentLevel.color }}>
            Lv.{currentLevel.level} {currentLevel.name}
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 text-[#8FA4C8]" /> : <ChevronDown className="w-4 h-4 text-[#8FA4C8]" />}
        </button>

        {expanded && (
          <div className="border-t border-[#F2F4F7] px-4 py-3 grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-2xl font-black text-[#FF6A00]">{safeProfile.daily_streak}</p>
              <p className="text-[10px] text-[#8FA4C8] font-medium">Streak Kini</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-[#1A1A1A]">{safeProfile.longest_streak || 0}</p>
              <p className="text-[10px] text-[#8FA4C8] font-medium">Terpanjang</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black" style={{ color: currentLevel.color }}>{safeProfile.total_points}</p>
              <p className="text-[10px] text-[#8FA4C8] font-medium">Total XP</p>
            </div>
            <div className="col-span-3">
              <p className="text-[10px] text-[#8FA4C8] font-semibold uppercase tracking-wider mb-1.5">Menuju level berikutnya</p>
              {nextLevel ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-[#F2F4F7] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${progressToNext}%`, backgroundColor: currentLevel.color }} />
                  </div>
                  <span className="text-xs font-bold" style={{ color: currentLevel.color }}>{nextLevel.name}</span>
                </div>
              ) : (
                <p className="text-xs font-bold text-[#FF6A00]">🏆 Level Maksimum tercapai!</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Popups */}
      <StreakCelebrationPopup
        show={!!streakPopup}
        message={streakPopup?.message || ""}
        streak={streakPopup?.streak || 0}
        onClose={() => setStreakPopup(null)}
      />

      <AchievementPopup achievement={achievementPopup} onClose={() => setAchievementPopup(null)} />

      {/* Level Up popup */}
      <AnimatePresence>
        {levelUpPopup && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setLevelUpPopup(null)}
          >
            <motion.div
              initial={{ scale: 0.4, y: 60 }} animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", damping: 12 }}
              className="bg-white rounded-3xl px-8 py-8 flex flex-col items-center gap-4 shadow-2xl mx-6 max-w-xs w-full"
              onClick={e => e.stopPropagation()}
            >
              <motion.div animate={{ rotate: [0, -15, 15, -10, 10, 0] }} transition={{ duration: 0.8 }} className="text-6xl">⭐</motion.div>
              <div className="text-center">
                <p className="text-xs font-bold text-[#FF6A00] uppercase tracking-widest mb-1">Level Up!</p>
                <h2 className="text-xl font-black text-[#1A1A1A]">Kamu sekarang Level {levelUpPopup.level.level}</h2>
                <p className="text-sm font-semibold mt-1" style={{ color: levelUpPopup.level.color }}>{levelUpPopup.level.name}</p>
              </div>
              <button onClick={() => setLevelUpPopup(null)}
                className="w-full py-3 rounded-2xl bg-[#FF6A00] text-white font-bold text-sm hover:bg-[#e05e00] transition-colors">
                Mantap! 🚀
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}