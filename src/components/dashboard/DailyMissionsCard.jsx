import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";

const LEVEL_THRESHOLDS = [
  { level: 1, name: "Newbie Ngatur", min: 0, max: 499 },
  { level: 2, name: "Si Pencatat", min: 500, max: 1499 },
  { level: 3, name: "Budgeter Muda", min: 1500, max: 2999 },
  { level: 4, name: "Social Saver", min: 3000, max: 5999 },
  { level: 5, name: "Financial Aware", min: 6000, max: 9999 },
  { level: 6, name: "Investor Pemula", min: 10000, max: 19999 },
  { level: 7, name: "Atur Pintar Pro", min: 20000, max: Infinity },
];

function getLevelInfo(xp) {
  const current = LEVEL_THRESHOLDS.find(l => xp >= l.min && xp <= l.max) || LEVEL_THRESHOLDS[0];
  const next = LEVEL_THRESHOLDS.find(l => l.level === current.level + 1);
  return { current, next };
}

const DEFAULT_MISSIONS = [
  { mission_key: "catat_transaksi", icon: "📝", title: "Catat 1 pengeluaran", xp_reward: 10 },
  { mission_key: "cek_budget", icon: "📊", title: "Cek budget minggu ini", xp_reward: 15 },
  { mission_key: "tanya_nana", icon: "✨", title: "Tanya Nana 1 pertanyaan", xp_reward: 20 },
];

export default function DailyMissionsCard({ user, gamificationProfile, onProfileUpdate }) {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLevelUp, setShowLevelUp] = useState(null);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!user?.email) return;
    loadMissions();
  }, [user?.email]);

  async function loadMissions() {
    setLoading(true);
    const existing = await base44.entities.DailyMission.filter({
      created_by: user.email,
      date: today,
    }).catch(() => []);

    if (existing && existing.length >= 3) {
      setMissions(existing);
    } else {
      // Generate default missions
      const toCreate = DEFAULT_MISSIONS.filter(
        dm => !existing.find(e => e.mission_key === dm.mission_key)
      );
      const created = await Promise.all(
        toCreate.map(m =>
          base44.entities.DailyMission.create({
            date: today,
            mission_key: m.mission_key,
            title: m.title,
            icon: m.icon,
            xp_reward: m.xp_reward,
            is_completed: false,
          })
        )
      );
      setMissions([...existing, ...created]);
    }
    setLoading(false);
  }

  async function handleComplete(mission) {
    if (mission.is_completed) return;

    // Optimistic update
    setMissions(prev => prev.map(m => m.id === mission.id ? { ...m, is_completed: true } : m));

    // Update mission
    await base44.entities.DailyMission.update(mission.id, { is_completed: true });

    // Update gamification
    const profiles = await base44.entities.GamificationProfile.filter({ created_by: user.email }).catch(() => []);
    let profile = profiles?.[0];

    if (!profile) {
      profile = await base44.entities.GamificationProfile.create({
        total_points: 0, level: 1, daily_streak: 0, last_activity_date: today,
      });
    }

    const newXP = (profile.total_points || 0) + (mission.xp_reward || 0);
    const prevLevelInfo = getLevelInfo(profile.total_points || 0);
    const newLevelInfo = getLevelInfo(newXP);

    // Streak logic
    const lastDate = profile.last_activity_date;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yestStr = yesterday.toISOString().split("T")[0];

    let newStreak = profile.daily_streak || 0;
    if (lastDate === yestStr) newStreak += 1;
    else if (lastDate !== today) newStreak = 1;

    await base44.entities.GamificationProfile.update(profile.id, {
      total_points: newXP,
      level: newLevelInfo.current.level,
      daily_streak: newStreak,
      last_activity_date: today,
    });

    if (onProfileUpdate) {
      onProfileUpdate({
        ...profile,
        total_points: newXP,
        level: newLevelInfo.current.level,
        daily_streak: newStreak,
        last_activity_date: today,
      });
    }

    if (newLevelInfo.current.level > prevLevelInfo.current.level) {
      setShowLevelUp(newLevelInfo.current);
    }
  }

  const completed = missions.filter(m => m.is_completed).length;
  const allDone = missions.length > 0 && completed === missions.length;
  const totalXP = DEFAULT_MISSIONS.reduce((s, m) => s + m.xp_reward, 0);

  // Level progress
  const xp = gamificationProfile?.total_points || 0;
  const { current: lvl, next: nextLvl } = getLevelInfo(xp);
  const xpInLevel = xp - lvl.min;
  const xpNeeded = nextLvl ? nextLvl.min - lvl.min : 1;
  const pct = nextLvl ? Math.min((xpInLevel / xpNeeded) * 100, 100) : 100;

  if (loading) {
    return <div className="bg-white rounded-2xl h-32 animate-pulse shadow-sm" />;
  }

  return (
    <>
      {/* Daily Missions */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[#1A1A1A]">Mission Hari Ini 🎯</h3>
          <span className="text-xs text-[#8FA4C8] font-semibold">{completed}/{missions.length} selesai</span>
        </div>

        {allDone ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#F0FDF4] rounded-xl p-3 text-center"
          >
            <p className="text-sm font-bold text-[#16A34A]">Semua mission selesai! 🎉 +{totalXP} XP</p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {missions.map(m => (
              <button
                key={m.id}
                onClick={() => handleComplete(m)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${
                  m.is_completed
                    ? "border-[#E2E8F0] bg-[#F8FAFC] opacity-60"
                    : "border-[#E2E8F0] bg-white hover:border-[#FF6B35]/40 active:scale-98"
                }`}
              >
                <span className="text-xl flex-shrink-0">{m.icon}</span>
                <span className={`flex-1 text-sm font-medium text-left ${m.is_completed ? "line-through text-[#8FA4C8]" : "text-[#1A1A1A]"}`}>
                  {m.title}
                </span>
                <span className="text-xs font-bold text-[#FF6B35] flex-shrink-0">+{m.xp_reward} XP</span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  m.is_completed ? "bg-[#16A34A] border-[#16A34A]" : "border-[#CBD5E0]"
                }`}>
                  {m.is_completed && <span className="text-white text-[10px]">✓</span>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Level Progress Bar */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-bold text-[#1A1A1A]">⚡ Level {lvl.level} — {lvl.name}</p>
          <span className="text-xs font-bold text-[#FF6B35]">{xp.toLocaleString("id-ID")} XP</span>
        </div>
        <div className="h-2.5 bg-[#F2F4F7] rounded-full overflow-hidden mb-1.5">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #FF6B35, #FFD700)" }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
        {nextLvl ? (
          <p className="text-xs text-[#8FA4C8]">
            {(nextLvl.min - xp).toLocaleString("id-ID")} XP lagi untuk Level {nextLvl.level} — {nextLvl.name}
          </p>
        ) : (
          <p className="text-xs text-[#FF6B35] font-semibold">Level Maksimal tercapai! 🏆</p>
        )}
      </div>

      {/* Level Up Modal */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-xs w-full text-center shadow-2xl"
            >
              <div className="text-5xl mb-3">⬆️</div>
              <p className="text-xs font-bold text-[#FF6B35] uppercase tracking-widest mb-1">Level Up!</p>
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-1">Level {showLevelUp.level}</h2>
              <p className="text-[#4A5568] text-sm mb-6">{showLevelUp.name} 🎉</p>
              <button
                onClick={() => setShowLevelUp(null)}
                className="w-full py-3.5 rounded-2xl bg-[#FF6B35] text-white font-bold text-sm shadow-lg shadow-[#FF6B35]/30"
              >
                Keren! →
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}