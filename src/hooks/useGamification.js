import { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { format, subDays } from "date-fns";

export const LEVELS = [
  { level: 1, name: "Pemula",    min: 0,    max: 100,  color: "#8FA4C8" },
  { level: 2, name: "Teratur",   min: 100,  max: 300,  color: "#4CAF50" },
  { level: 3, name: "Konsisten", min: 300,  max: 600,  color: "#2196F3" },
  { level: 4, name: "Disiplin",  min: 600,  max: 1000, color: "#9C27B0" },
  { level: 5, name: "Master",    min: 1000, max: 99999, color: "#FF6A00" },
];

const ACHIEVEMENTS_DEF = [
  { key: "first_transaction", name: "Langkah Pertama",  emoji: "🐣", desc: "Tambah transaksi pertama kali" },
  { key: "streak_7",          name: "Rajin Mencatat",   emoji: "📝", desc: "Streak 7 hari berturut-turut" },
  { key: "streak_30",         name: "Konsisten",        emoji: "🏆", desc: "Streak 30 hari berturut-turut" },
  { key: "first_goal",        name: "Penabung Pemula",  emoji: "💰", desc: "Buat savings goal pertama" },
  { key: "debt_free",         name: "Bebas Utang",      emoji: "🎉", desc: "Lunasi utang pertama" },
  { key: "budget_master",     name: "Anti Boros",       emoji: "💪", desc: "Budget tidak terlampaui sebulan penuh" },
];

export function getLevelFromXP(xp) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].min) return LEVELS[i];
  }
  return LEVELS[0];
}

export function useGamification(user) {
  // Popup states
  const [streakPopup, setStreakPopup]         = useState(null); // { message, streak }
  const [achievementPopup, setAchievementPopup] = useState(null); // achievement def object
  const [levelUpPopup, setLevelUpPopup]       = useState(null); // { level }
  const [xpFloatMsg, setXpFloatMsg]           = useState(null); // e.g. "+5 XP"
  const [profile, setProfile]                 = useState(null);
  const [streakResetMsg, setStreakResetMsg]   = useState(null);

  // ── helpers ─────────────────────────────────────────
  async function getOrCreateProfile() {
    const existing = await base44.entities.GamificationProfile.filter({ created_by: user.email });
    if (existing.length === 0) {
      return await base44.entities.GamificationProfile.create({
        daily_streak: 0, longest_streak: 0, total_points: 0, level: 1,
        achievements: [], last_activity_date: null,
      });
    }
    // Deduplicate
    const sorted = [...existing].sort((a, b) => (b.total_points || 0) - (a.total_points || 0));
    if (existing.length > 1) {
      for (const extra of sorted.slice(1)) {
        base44.entities.GamificationProfile.delete(extra.id).catch(() => {});
      }
    }
    return sorted[0];
  }

  async function unlockAchievement(p, key) {
    const already = (p.achievements || []).includes(key);
    if (already) return;
    const def = ACHIEVEMENTS_DEF.find(a => a.key === key);
    if (!def) return;
    const newAchievements = [...(p.achievements || []), key];
    await base44.entities.GamificationProfile.update(p.id, { achievements: newAchievements });
    await base44.entities.Alert.create({
      type: "goal_near",
      title: `Achievement Unlocked: ${def.name} ${def.emoji}`,
      message: def.desc,
      severity: "low",
      status: "unread",
    });
    setAchievementPopup(def);
  }

  // ── Check streak reset on app load ──────────────────
  const checkStreakOnLoad = useCallback(async () => {
    if (!user?.email) return;
    try {
      const p = await getOrCreateProfile();
      setProfile(p);
      const today     = format(new Date(), "yyyy-MM-dd");
      const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
      const last = p.last_activity_date;
      if (last && last !== today && last !== yesterday && (p.daily_streak || 0) > 0) {
        const updated = await base44.entities.GamificationProfile.update(p.id, { daily_streak: 0 });
        setProfile(updated);
        setStreakResetMsg("Streak kamu reset nih 😢 Tambah transaksi hari ini untuk mulai lagi!");
      }
    } catch (e) {}
  }, [user?.email]);

  // ── Called after each new transaction ───────────────
  const onNewTransaction = useCallback(async (opts = {}) => {
    if (!user?.email) return;
    try {
      const p       = await getOrCreateProfile();
      const today     = format(new Date(), "yyyy-MM-dd");
      const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
      const last      = p.last_activity_date;
      const currentXP = p.total_points || 0;
      const currentStreak = p.daily_streak || 0;
      let updates = {};
      let xpGained = 0;
      let showStreakPopup = false;
      let streakMsg = "";
      let newStreak = currentStreak;

      if (last === today) {
        // Same day — small XP, no popup
        xpGained = 5;
        updates.total_points = currentXP + xpGained;
        setXpFloatMsg(`+${xpGained} XP`);
        setTimeout(() => setXpFloatMsg(null), 2000);
      } else if (last === yesterday) {
        // Consecutive day
        newStreak = currentStreak + 1;
        xpGained = 15;
        updates.daily_streak = newStreak;
        updates.longest_streak = Math.max(p.longest_streak || 0, newStreak);
        updates.last_activity_date = today;
        updates.total_points = currentXP + xpGained;
        streakMsg = `🔥 Streak ${newStreak} hari! +${xpGained} XP`;
        showStreakPopup = true;
      } else {
        // Broken streak or first ever
        newStreak = 1;
        xpGained = 10;
        updates.daily_streak = 1;
        updates.last_activity_date = today;
        updates.total_points = currentXP + xpGained;
        streakMsg = "Streak dimulai! Terus semangat 💪";
        showStreakPopup = true;
      }

      // Level check
      const newXP       = updates.total_points ?? currentXP;
      const newLevel    = getLevelFromXP(newXP);
      const oldLevel    = getLevelFromXP(currentXP);
      updates.level = newLevel.level;
      if (newLevel.level > oldLevel.level) {
        setLevelUpPopup({ level: newLevel });
      }

      const updated = await base44.entities.GamificationProfile.update(p.id, updates);
      setProfile(updated);

      if (showStreakPopup) {
        setStreakPopup({ message: streakMsg, streak: newStreak });
      }

      // Achievements
      const freshP = { ...p, ...updates };
      const allTx = await base44.entities.Transaction.filter({ created_by: user.email }, "-date", 2);
      if (allTx.length === 1) await unlockAchievement(freshP, "first_transaction");
      if (newStreak >= 7)  await unlockAchievement(freshP, "streak_7");
      if (newStreak >= 30) await unlockAchievement(freshP, "streak_30");

      if (opts.isFirstGoal) await unlockAchievement(freshP, "first_goal");
      if (opts.isDebtPaid)  await unlockAchievement(freshP, "debt_free");
      if (opts.isBudgetMaster) await unlockAchievement(freshP, "budget_master");

    } catch (e) {}
  }, [user?.email]);

  return {
    profile,
    setProfile,
    streakPopup,
    setStreakPopup,
    achievementPopup,
    setAchievementPopup,
    levelUpPopup,
    setLevelUpPopup,
    xpFloatMsg,
    streakResetMsg,
    setStreakResetMsg,
    onNewTransaction,
    checkStreakOnLoad,
  };
}