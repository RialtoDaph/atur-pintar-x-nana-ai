import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";

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

export default function StreakMissionWidget({ user, gamificationProfile, onProfileUpdate }) {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split("T")[0];

  const xp = gamificationProfile?.total_points || 0;
  const streak = gamificationProfile?.daily_streak || 0;
  const { current: lvl, next: nextLvl } = getLevelInfo(xp);
  const xpInLevel = xp - lvl.min;
  const xpNeeded = nextLvl ? nextLvl.min - lvl.min : 1;
  const pct = nextLvl ? Math.min((xpInLevel / xpNeeded) * 100, 100) : 100;

  useEffect(() => {
    if (!user?.email) return;
    loadMissions();
  }, [user?.email]);

  async function loadMissions() {
    setLoading(true);
    const existing = await base44.entities.DailyMission.filter({ created_by: user.email, date: today }).catch(() => []);
    if (existing && existing.length >= 3) {
      setMissions(existing);
    } else {
      const toCreate = DEFAULT_MISSIONS.filter(dm => !existing.find(e => e.mission_key === dm.mission_key));
      const created = await Promise.all(toCreate.map(m => base44.entities.DailyMission.create({ date: today, ...m, is_completed: false })));
      setMissions([...existing, ...created]);
    }
    setLoading(false);
  }

  async function handleComplete(mission) {
    if (mission.is_completed) return;
    setMissions(prev => prev.map(m => m.id === mission.id ? { ...m, is_completed: true } : m));
    await base44.entities.DailyMission.update(mission.id, { is_completed: true });

    const profiles = await base44.entities.GamificationProfile.filter({ created_by: user.email }).catch(() => []);
    let profile = profiles?.[0];
    if (!profile) profile = await base44.entities.GamificationProfile.create({ total_points: 0, level: 1, daily_streak: 0, last_activity_date: today });

    const newXP = (profile.total_points || 0) + (mission.xp_reward || 0);
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yestStr = yesterday.toISOString().split("T")[0];
    let newStreak = profile.daily_streak || 0;
    if (profile.last_activity_date === yestStr) newStreak += 1;
    else if (profile.last_activity_date !== today) newStreak = 1;

    const updated = { ...profile, total_points: newXP, level: getLevelInfo(newXP).current.level, daily_streak: newStreak, last_activity_date: today };
    await base44.entities.GamificationProfile.update(profile.id, { total_points: updated.total_points, level: updated.level, daily_streak: updated.daily_streak, last_activity_date: today });
    if (onProfileUpdate) onProfileUpdate(updated);
  }

  const completed = missions.filter(m => m.is_completed).length;
  const allDone = missions.length > 0 && completed === missions.length;

  if (loading) return <div className="bg-white rounded-2xl shadow-sm h-36 animate-pulse" />;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      {/* Streak + Level header */}
      <div className="flex items-center gap-4 mb-4">
        <div className="text-center">
          <div className="flex items-center gap-0.5 justify-center">
            <span className="text-2xl font-black text-[#F97316]">{streak}</span>
            {streak > 0 && <span className="text-lg">🔥</span>}
          </div>
          <p className="text-[10px] text-[#8FA4C8] font-medium">Hari streak</p>
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <p className="text-xs font-bold text-[#1A1A1A]">⚡ Lv.{lvl.level} — {lvl.name}</p>
            <span className="text-[10px] font-bold text-[#F97316]">{xp.toLocaleString("id-ID")} XP</span>
          </div>
          <div className="h-2 bg-[#F2F4F7] rounded-full overflow-hidden">
            <motion.div className="h-full rounded-full" style={{ background: "linear-gradient(90deg, #FF6B35, #FFD700)" }}
              initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: "easeOut" }} />
          </div>
          {nextLvl && <p className="text-[9px] text-[#8FA4C8] mt-0.5">{(nextLvl.min - xp).toLocaleString("id-ID")} XP → {nextLvl.name}</p>}
        </div>
      </div>

      {/* Missions */}
      <div className="border-t border-[#F2F4F7] pt-3">
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs font-bold text-[#1A1A1A]">Mission Hari Ini 🎯</p>
          <span className="text-[10px] text-[#8FA4C8]">{completed}/{missions.length}</span>
        </div>
        {allDone ? (
          <div className="bg-[#F0FDF4] rounded-xl p-3 text-center">
            <p className="text-sm font-bold text-[#16A34A]">Semua selesai! 🎉 +{DEFAULT_MISSIONS.reduce((s, m) => s + m.xp_reward, 0)} XP</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {missions.map(m => (
              <button key={m.id} onClick={() => handleComplete(m)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl border transition-all tap-highlight-fix ${m.is_completed ? "border-[#E2E8F0] bg-[#F8FAFC] opacity-60" : "border-[#E2E8F0] bg-white hover:border-[#FF6B35]/40"}`}>
                <span className="text-base flex-shrink-0">{m.icon}</span>
                <span className={`flex-1 text-xs font-medium text-left ${m.is_completed ? "line-through text-[#8FA4C8]" : "text-[#1A1A1A]"}`}>{m.title}</span>
                <span className="text-[10px] font-bold text-[#FF6B35] flex-shrink-0">+{m.xp_reward} XP</span>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${m.is_completed ? "bg-[#16A34A] border-[#16A34A]" : "border-[#CBD5E0]"}`}>
                  {m.is_completed && <span className="text-white text-[8px]">✓</span>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}