import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Flame, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import StreakCelebrationPopup from "./StreakCelebrationPopup";

const LEVELS = [
  { level: 1, name: "Pemula", min: 0, max: 100, color: "#8FA4C8" },
  { level: 2, name: "Teratur", min: 100, max: 300, color: "#4CAF50" },
  { level: 3, name: "Konsisten", min: 300, max: 700, color: "#2196F3" },
  { level: 4, name: "Disiplin", min: 700, max: 1500, color: "#9C27B0" },
  { level: 5, name: "Master", min: 1500, max: 9999, color: "#FF6A00" },
];

export default function StreakWidget({ user, lastTxAddedAt }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [streakMessage, setStreakMessage] = useState("");
  const [popupStreak, setPopupStreak] = useState(0);

  useEffect(() => {
    if (!user) return;
    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (!user || !lastTxAddedAt) return;
    handleNewTransaction();
  }, [lastTxAddedAt]);

  async function fetchProfile() {
    try {
      const existing = await base44.entities.GamificationProfile.filter({ created_by: user.email });
      if (existing.length > 0) setProfile(existing[0]);
    } catch (e) {}
    setLoading(false);
  }

  async function handleNewTransaction() {
    const today = format(new Date(), "yyyy-MM-dd");
    let existing;
    try {
      existing = await base44.entities.GamificationProfile.filter({ created_by: user.email });
    } catch (e) { return; }

    // Create profile if doesn't exist
    if (existing.length === 0) {
      const created = await base44.entities.GamificationProfile.create({
        daily_streak: 1,
        longest_streak: 0,
        last_activity_date: today,
        total_points: 0,
        level: 1,
        achievements: ["first_transaction"],
      });
      setProfile(created);
      setLoading(false);
      setPopupStreak(1);
      setStreakMessage("Transaksi pertama tercatat! Streak kamu dimulai! +10 XP 🎉");
      setShowPopup(true);
      return;
    }

    const p = existing[0];
    const last = p.last_activity_date;
    const yesterday = format(new Date(Date.now() - 86400000), "yyyy-MM-dd");
    const currentPoints = p.total_points || 0;

    let updates = {};

    if (last === today) {
      // Same day: give +5 XP for every additional transaction
      updates.total_points = currentPoints + 5;
      setPopupStreak(p.daily_streak || 1);
      setStreakMessage(`+5 XP! Terus catat pengeluaranmu! 💪`);
      setShowPopup(true);
    } else if (last === yesterday) {
      // Consecutive day: streak continues
      const newStreak = (p.daily_streak || 1) + 1;
      const bonus = newStreak % 7 === 0 ? 50 : 0;
      updates.daily_streak = newStreak;
      updates.longest_streak = Math.max(p.longest_streak || 0, newStreak);
      updates.last_activity_date = today;
      updates.total_points = currentPoints + 10 + bonus;
      setPopupStreak(newStreak);
      setStreakMessage(bonus > 0 ? `Luar biasa! ${newStreak} hari berturut! +${10 + bonus} XP 🏆` : `Streak berlanjut! ${newStreak} hari! +10 XP 🔥`);
      setShowPopup(true);
    } else {
      // Broken streak or first time today
      updates.daily_streak = 1;
      updates.last_activity_date = today;
      updates.total_points = currentPoints + 5;
      setPopupStreak(1);
      setStreakMessage("Streak baru dimulai hari ini! +5 XP ✨");
      setShowPopup(true);
    }

    // Recalculate level
    const newPoints = updates.total_points ?? currentPoints;
    const lvl = LEVELS.find(l => newPoints >= l.min && newPoints < l.max) || LEVELS[LEVELS.length - 1];
    updates.level = lvl.level;

    const updated = await base44.entities.GamificationProfile.update(p.id, updates);
    setProfile(updated);
  }

  if (loading || !profile) return null;

  const currentLevel = LEVELS.find(l => l.level === (profile.level || 1)) || LEVELS[0];
  const nextLevel = LEVELS.find(l => l.level === (profile.level || 1) + 1);
  const progressToNext = nextLevel
    ? Math.min(100, ((profile.total_points - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100)
    : 100;

  const isActiveToday = profile.last_activity_date === format(new Date(), "yyyy-MM-dd");

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#F2F4F7] overflow-hidden">
      <StreakCelebrationPopup
        show={showPopup}
        message={streakMessage}
        streak={popupStreak}
        onClose={() => setShowPopup(false)}
      />

      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full px-4 py-3 flex items-center gap-3 text-left tap-highlight-fix"
      >
        {/* Flame + streak */}
        <motion.div
          animate={showPopup ? { scale: [1, 1.25, 1] } : {}}
          transition={{ duration: 0.5 }}
          className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${isActiveToday ? "bg-[#FF6A00]/10" : "bg-[#F2F4F7]"}`}
        >
          <Flame className={`w-4 h-4 ${isActiveToday ? "text-[#FF6A00]" : "text-[#8FA4C8]"}`} />
          <p className={`text-xs font-black leading-none mt-0.5 ${isActiveToday ? "text-[#FF6A00]" : "text-[#8FA4C8]"}`}>{profile.daily_streak}</p>
        </motion.div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#1A1A1A] leading-tight">
            {!isActiveToday ? "Catat transaksi hari ini!" : `${profile.daily_streak} hari berturut-turut 🔥`}
          </p>
          {nextLevel && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 bg-[#F2F4F7] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${progressToNext}%`, backgroundColor: currentLevel.color }} />
              </div>
              <span className="text-[10px] text-[#8FA4C8] whitespace-nowrap">{profile.total_points} XP</span>
            </div>
          )}
        </div>

        <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: currentLevel.color + "20", color: currentLevel.color }}>
          Lv.{currentLevel.level}
        </span>
        {expanded ? <ChevronUp className="w-4 h-4 text-[#8FA4C8] flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#8FA4C8] flex-shrink-0" />}
      </button>

      {expanded && (
        <div className="border-t border-[#F2F4F7] px-4 py-3 grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-2xl font-black text-[#FF6A00]">{profile.daily_streak}</p>
            <p className="text-[10px] text-[#8FA4C8] font-medium">Streak Kini</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-[#1A1A1A]">{profile.longest_streak || 0}</p>
            <p className="text-[10px] text-[#8FA4C8] font-medium">Terpanjang</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black" style={{ color: currentLevel.color }}>{profile.total_points}</p>
            <p className="text-[10px] text-[#8FA4C8] font-medium">Total XP</p>
          </div>
          <div className="col-span-3">
            <p className="text-[10px] text-[#8FA4C8] font-semibold uppercase tracking-wider mb-1.5">Level berikutnya</p>
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
  );
}