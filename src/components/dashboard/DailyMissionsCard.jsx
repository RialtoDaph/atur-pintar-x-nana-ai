import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { LEVELS } from "@/hooks/useGamification";
import { completeMission } from "@/hooks/useGamificationActions";
import { haptic } from "@/hooks/useHaptic";

function getLevelInfo(xp) {
  const current = LEVELS.find(l => xp >= l.min && xp <= l.max) || LEVELS[0];
  const next = LEVELS.find(l => l.level === current.level + 1);
  return { current, next };
}

// Keep in sync with functions/generateDailyMissions.js — single source of truth for XP rewards.
const DEFAULT_MISSIONS = [
  { mission_key: "catat_transaksi", icon: "📝", title: "Catat Transaksi", xp_reward: 10 },
  { mission_key: "cek_budget",      icon: "📊", title: "Cek Budget",      xp_reward: 10 },
  { mission_key: "tanya_nana",      icon: "💬", title: "Tanya Nana AI",   xp_reward: 10 },
];

export default function DailyMissionsCard({ user, gamificationProfile, onProfileUpdate }) {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLevelUp, setShowLevelUp] = useState(null);
  const [dismissedBanner, setDismissedBanner] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!user?.email) return;
    loadMissions();
  }, [user?.email]);

  async function loadMissions() {
    setLoading(true);

    // Step 1: Clean up stale uncompleted missions from past dates — AWAIT so they're gone before we query today
    const allUncompleted = await base44.entities.DailyMission.filter({
      created_by: user.email, is_completed: false,
    }).catch(() => []);
    const stale = (allUncompleted || []).filter(m => m.date && m.date < today);
    if (stale.length) {
      await Promise.all(stale.map(m => base44.entities.DailyMission.delete(m.id).catch(() => {})));
    }

    // Step 2: Fetch today's missions and dedupe by mission_key (in case duplicates already exist)
    const todayRaw = await base44.entities.DailyMission.filter({
      created_by: user.email, date: today,
    }).catch(() => []);

    const seen = new Set();
    const dupes = [];
    const existing = [];
    for (const m of (todayRaw || [])) {
      if (seen.has(m.mission_key)) {
        dupes.push(m);
      } else {
        seen.add(m.mission_key);
        existing.push(m);
      }
    }
    if (dupes.length) {
      await Promise.all(dupes.map(m => base44.entities.DailyMission.delete(m.id).catch(() => {})));
    }

    // Step 3: Create only missions that don't exist yet for today
    const toCreate = DEFAULT_MISSIONS.filter(dm => !seen.has(dm.mission_key));
    const created = toCreate.length
      ? await Promise.all(toCreate.map(m =>
          base44.entities.DailyMission.create({
            date: today,
            mission_key: m.mission_key,
            title: m.title,
            icon: m.icon,
            xp_reward: m.xp_reward,
            is_completed: false,
          })
        ))
      : [];

    setMissions([...existing, ...created]);
    setLoading(false);
  }

  async function handleComplete(mission) {
    if (mission.is_completed) return;

    // Haptic feedback — celebrate the completion
    haptic.success();

    // Optimistic update — remove completed mission from list
    setMissions(prev => prev.filter(m => m.id !== mission.id));

    // Track previous level to detect level-up after backend awards XP
    const prevXP = gamificationProfile?.total_points || 0;
    const prevLevelInfo = getLevelInfo(prevXP);

    // Delegate to backend (marks mission + awards XP authoritatively via processGamification).
    // This avoids race conditions where multiple parallel writes to total_points overwrite each other.
    await completeMission(user.email, mission.mission_key);

    // Refresh profile from DB to get authoritative XP/level
    const profiles = await base44.entities.GamificationProfile.filter({ created_by: user.email }).catch(() => []);
    const sorted = (profiles || []).sort((a, b) => (b.total_points || 0) - (a.total_points || 0));
    const fresh = sorted[0];
    if (!fresh) return;

    const newLevelInfo = getLevelInfo(fresh.total_points || 0);

    if (onProfileUpdate) onProfileUpdate(fresh);

    if (newLevelInfo.current.level > prevLevelInfo.current.level) {
      haptic.heavy();
      setShowLevelUp(newLevelInfo.current);
    }
  }

  // Active = not yet completed (we remove on complete via optimistic update; this is a safety net)
  const activeMissions = missions.filter(m => !m.is_completed);
  const completed = DEFAULT_MISSIONS.length - activeMissions.length;
  const totalXP = DEFAULT_MISSIONS.reduce((s, m) => s + m.xp_reward, 0);
  // All done = no active missions left AND we've already loaded (so we don't flash banner before load)
  const allDone = !loading && activeMissions.length === 0 && !dismissedBanner;

  // Auto-hide banner after 5 seconds
  useEffect(() => {
    if (!loading && activeMissions.length === 0 && !dismissedBanner) {
      const timer = setTimeout(() => setDismissedBanner(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [loading, activeMissions.length, dismissedBanner]);

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
    <div className="space-y-3">
      {/* All missions done — small congratulatory banner showing total XP earned */}
      {allDone && (
        <div className="bg-white rounded-2xl shadow-sm p-3 flex items-center gap-3">
          <span className="text-xl flex-shrink-0">🎉</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#1A1A1A] leading-tight">Semua mission selesai!</p>
            <p className="text-[11px] text-[#8FA4C8] leading-tight mt-0.5">Balik lagi besok untuk mission baru</p>
          </div>
          <span className="text-xs font-bold text-[#F97316] flex-shrink-0">+{totalXP} XP</span>
        </div>
      )}

      {/* Daily Missions — hidden when all done so it doesn't clutter the dashboard */}
      {activeMissions.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[#1A1A1A]">Mission Hari Ini 🎯</h3>
            <span className="text-xs text-[#8FA4C8] font-semibold">{completed}/{missions.length} selesai</span>
          </div>

          <div className="space-y-2">
            {activeMissions.map(m => (
              <button
                key={m.id}
                onClick={() => handleComplete(m)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#F97316]/40 active:scale-98 transition-all"
              >
                <span className="text-xl flex-shrink-0">{m.icon}</span>
                <span className="flex-1 text-sm font-medium text-left text-[#1A1A1A]">
                  {m.title}
                </span>
                <span className="text-xs font-bold text-[#F97316] flex-shrink-0">+{m.xp_reward} XP</span>
                <div className="w-5 h-5 rounded-full border-2 border-[#CBD5E0] flex items-center justify-center flex-shrink-0">
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Level Progress Bar — clickable to Gamifikasi page */}
      <Link
        to="/Gamifikasi"
        className="block bg-white rounded-2xl shadow-sm p-4 hover:shadow-md active:scale-[0.99] transition-all tap-highlight-fix"
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-bold text-[#1A1A1A]">⚡ Level {lvl.level} — {lvl.name}</p>
          <span className="text-xs font-bold text-[#F97316]">{xp.toLocaleString("id-ID")} XP</span>
        </div>
        <div className="h-2.5 bg-[#F2F4F7] rounded-full overflow-hidden mb-1.5">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #F97316, #FFD700)" }}
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
          <p className="text-xs text-[#F97316] font-semibold">Level Maksimal tercapai! 🏆</p>
        )}
      </Link>

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
              <p className="text-xs font-bold text-[#F97316] uppercase tracking-widest mb-1">Level Up!</p>
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-1">Level {showLevelUp.level}</h2>
              <p className="text-[#4A5568] text-sm mb-6">{showLevelUp.name} 🎉</p>
              <button
                onClick={() => setShowLevelUp(null)}
                className="w-full py-3.5 rounded-2xl bg-[#F97316] text-white font-bold text-sm shadow-lg shadow-[#F97316]/30"
              >
                Keren! →
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}