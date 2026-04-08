import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Flame, Star, Trophy, Zap } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";

const LEVELS = [
  { level: 1, name: "Pemula", min: 0, max: 100, color: "#8FA4C8" },
  { level: 2, name: "Teratur", min: 100, max: 300, color: "#4CAF50" },
  { level: 3, name: "Konsisten", min: 300, max: 700, color: "#2196F3" },
  { level: 4, name: "Disiplin", min: 700, max: 1500, color: "#9C27B0" },
  { level: 5, name: "Master", min: 1500, max: 9999, color: "#FF6A00" },
];

export default function StreakWidget({ user, transactionCount }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadAndUpdateStreak();
  }, [user, transactionCount]);

  async function loadAndUpdateStreak() {
    const today = format(new Date(), "yyyy-MM-dd");
    const existing = await base44.entities.GamificationProfile.filter({ created_by: user.email });

    if (existing.length === 0) {
      // First time - create profile
      const p = await base44.entities.GamificationProfile.create({
        daily_streak: 1,
        longest_streak: 1,
        last_activity_date: today,
        total_points: 10,
        level: 1,
        achievements: ["first_login"],
      });
      setProfile(p);
      setLoading(false);
      return;
    }

    const p = existing[0];
    const last = p.last_activity_date;
    const yesterday = format(new Date(Date.now() - 86400000), "yyyy-MM-dd");

    let updates = {};

    if (last === today) {
      // Already active today, just award points for transactions
      if (transactionCount > 0 && !p.achievements?.includes("first_transaction")) {
        updates.achievements = [...(p.achievements || []), "first_transaction"];
        updates.total_points = (p.total_points || 0) + 50;
      }
    } else if (last === yesterday) {
      // Continued streak!
      const newStreak = (p.daily_streak || 0) + 1;
      updates.daily_streak = newStreak;
      updates.longest_streak = Math.max(p.longest_streak || 0, newStreak);
      updates.last_activity_date = today;
      updates.total_points = (p.total_points || 0) + 10 + (newStreak % 7 === 0 ? 50 : 0); // bonus every 7 days
    } else if (last !== today) {
      // Streak broken
      updates.daily_streak = 1;
      updates.last_activity_date = today;
      updates.total_points = (p.total_points || 0) + 5;
    }

    // Update level
    const newPoints = updates.total_points || p.total_points || 0;
    const lvl = LEVELS.find(l => newPoints >= l.min && newPoints < l.max) || LEVELS[LEVELS.length - 1];
    updates.level = lvl.level;

    if (Object.keys(updates).length > 0) {
      const updated = await base44.entities.GamificationProfile.update(p.id, updates);
      setProfile(updated);
    } else {
      setProfile(p);
    }
    setLoading(false);
  }

  if (loading || !profile) return null;

  const currentLevel = LEVELS.find(l => l.level === (profile.level || 1)) || LEVELS[0];
  const nextLevel = LEVELS.find(l => l.level === (profile.level || 1) + 1);
  const progressToNext = nextLevel
    ? Math.min(100, ((profile.total_points - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100)
    : 100;

  const isActiveToday = profile.last_activity_date === format(new Date(), "yyyy-MM-dd");

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 border border-[#F2F4F7]">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-[#8FA4C8] uppercase tracking-widest">Daily Streak</p>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: currentLevel.color + "20", color: currentLevel.color }}>
          Lv.{currentLevel.level} {currentLevel.name}
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Streak */}
        <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl ${isActiveToday ? "bg-[#FF6A00]/10" : "bg-[#F2F4F7]"}`}>
          <Flame className={`w-6 h-6 ${isActiveToday ? "text-[#FF6A00]" : "text-[#8FA4C8]"}`} />
          <p className={`text-xl font-black ${isActiveToday ? "text-[#FF6A00]" : "text-[#8FA4C8]"}`}>{profile.daily_streak}</p>
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-bold text-[#1A1A1A]">
              {profile.daily_streak === 0 ? "Mulai streak hari ini!" :
               !isActiveToday ? "Catat transaksi untuk lanjutkan streak!" :
               `${profile.daily_streak} hari berturut-turut 🔥`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold text-[#1A1A1A]">{profile.total_points} XP</span>
            </div>
            <div className="flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs text-[#8FA4C8]">Terpanjang: {profile.longest_streak} hr</span>
            </div>
          </div>
          {/* XP Progress bar */}
          {nextLevel && (
            <div className="mt-2">
              <div className="h-1.5 bg-[#F2F4F7] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressToNext}%`, backgroundColor: currentLevel.color }}
                />
              </div>
              <p className="text-[10px] text-[#8FA4C8] mt-0.5">{profile.total_points}/{nextLevel.min} XP → Lv.{nextLevel.level} {nextLevel.name}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}