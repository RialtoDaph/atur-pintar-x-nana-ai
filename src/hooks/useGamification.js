import { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { toast } from "sonner";

export const LEVELS = [
  { level: 1, name: "Newbie Ngatur",     min: 0,     max: 499,   unlocks: null },
  { level: 2, name: "Si Pencatat",       min: 500,   max: 1499,  unlocks: "🔓 Expense Analytics detail" },
  { level: 3, name: "Budgeter Muda",     min: 1500,  max: 2999,  unlocks: "🔓 Goal Tracker unlimited" },
  { level: 4, name: "Social Saver",      min: 3000,  max: 5999,  unlocks: "🔓 Shared Wallet" },
  { level: 5, name: "Financial Aware",   min: 6000,  max: 9999,  unlocks: "🔓 Nana AI Advanced" },
  { level: 6, name: "Investor Pemula",   min: 10000, max: 19999, unlocks: "🔓 Investment Insights" },
  { level: 7, name: "Atur Pintar Pro",   min: 20000, max: 999999,unlocks: "🔓 Full access + Badge Eksklusif" },
];

export const ACHIEVEMENTS_DEF = [
  // Streak
  { key: "streak_3",           title: "🔥 3 Hari Berturut!",      icon: "🔥", xp: 30,  category: "streak",      hint: "Streak 3 hari berturut-turut" },
  { key: "streak_7",           title: "🔥 Seminggu Penuh!",       icon: "🔥", xp: 70,  category: "streak",      hint: "Streak 7 hari berturut-turut" },
  { key: "streak_14",          title: "🔥 2 Minggu Konsisten!",   icon: "🔥", xp: 140, category: "streak",      hint: "Streak 14 hari berturut-turut" },
  { key: "streak_30",          title: "💎 30 Hari Konsisten!",    icon: "💎", xp: 300, category: "streak",      hint: "Streak 30 hari berturut-turut" },
  // Transaksi
  { key: "first_transaction",  title: "📝 Pencatat Pertama",      icon: "📝", xp: 20,  category: "transaction", hint: "Catat transaksi pertama" },
  { key: "transaction_10",     title: "📊 10 Transaksi!",         icon: "📊", xp: 50,  category: "transaction", hint: "Total 10 transaksi" },
  { key: "transaction_50",     title: "🗂️ 50 Transaksi!",        icon: "🗂️", xp: 150, category: "transaction", hint: "Total 50 transaksi" },
  { key: "transaction_100",    title: "💯 100 Transaksi!",        icon: "💯", xp: 300, category: "transaction", hint: "Total 100 transaksi" },
  // Goal
  { key: "first_goal",         title: "🎯 Punya Tujuan!",         icon: "🎯", xp: 30,  category: "goal",        hint: "Buat 1 savings goal" },
  { key: "goal_50pct",         title: "📈 Setengah Jalan!",       icon: "📈", xp: 80,  category: "goal",        hint: "Goal 50% tercapai" },
  { key: "goal_completed",     title: "🏆 Goal Tercapai!",        icon: "🏆", xp: 200, category: "goal",        hint: "Selesaikan 1 savings goal" },
  // Level
  { key: "level_2",            title: "🌱 Si Pencatat",           icon: "🌱", xp: 20,  category: "level",       hint: "Capai Level 2" },
  { key: "level_3",            title: "🎮 Budgeter Muda",         icon: "🎮", xp: 50,  category: "level",       hint: "Capai Level 3" },
  { key: "level_4",            title: "🤝 Social Saver",          icon: "🤝", xp: 60,  category: "level",       hint: "Capai Level 4" },
  { key: "level_5",            title: "🧠 Financial Aware",       icon: "🧠", xp: 100, category: "level",       hint: "Capai Level 5" },
  { key: "level_6",            title: "💡 Investor Pemula",       icon: "💡", xp: 200, category: "level",       hint: "Capai Level 6" },
  { key: "level_7",            title: "🏆 Atur Pintar Pro!",      icon: "🏆", xp: 500, category: "level",       hint: "Capai Level 7" },
  // Special
  { key: "first_budget",       title: "💰 Budgeter Pertama!",     icon: "💰", xp: 25,  category: "special",     hint: "Buat budget pertama" },
  { key: "budget_stay",        title: "✅ Hemat Sebulan!",        icon: "✅", xp: 100, category: "special",     hint: "Tetap dalam budget sebulan penuh" },
  { key: "first_nana_chat",    title: "🤖 Sapa Nana!",            icon: "🤖", xp: 15,  category: "special",     hint: "Chat pertama dengan Nana" },
  { key: "persona_revealed",   title: "🔮 Persona Terungkap!",   icon: "🔮", xp: 30,  category: "special",     hint: "Persona keuangan terungkap" },
  { key: "mood_7_days",        title: "😊 7 Hari Mood Check!",   icon: "😊", xp: 70,  category: "special",     hint: "7 hari mood check-in berturut" },
];

export function getLevelFromXP(xp) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].min) return LEVELS[i];
  }
  return LEVELS[0];
}

export function useGamification(user) {
  const [streakPopup, setStreakPopup]           = useState(null);
  const [achievementPopup, setAchievementPopup] = useState(null);
  const [levelUpPopup, setLevelUpPopup]         = useState(null);
  const [xpFloatMsg, setXpFloatMsg]             = useState(null);
  const [profile, setProfile]                   = useState(null);
  const [streakResetMsg, setStreakResetMsg]      = useState(null);

  async function getOrCreateProfile() {
    const existing = await base44.entities.GamificationProfile.filter({ created_by: user.email });
    if (!existing || existing.length === 0) {
      const today = format(new Date(), "yyyy-MM-dd");
      return await base44.entities.GamificationProfile.create({
        daily_streak: 0, longest_streak: 0, total_points: 0, level: 1,
        achievements: [], last_activity_date: null,
        streak_freezes_available: 1, streak_freeze_last_regen: today,
      });
    }
    const sorted = [...existing].sort((a, b) => (b.total_points || 0) - (a.total_points || 0));
    if (existing.length > 1) {
      for (const extra of sorted.slice(1)) {
        base44.entities.GamificationProfile.delete(extra.id).catch(() => {});
      }
    }
    return sorted[0];
  }

  const checkStreakOnLoad = useCallback(async () => {
    if (!user?.email) return;
    try {
      // Read-only: load the profile so UI can render current streak.
      // All streak mutation (increment / freeze / reset) is owned by the
      // backend `processGamification` function — never write here, otherwise
      // we race with backend updates triggered by transaction saves.
      const p = await getOrCreateProfile();
      setProfile(p);
    } catch (e) {}
  }, [user?.email]);

  const addXP = useCallback(async (xpAmount, opts = {}) => {
    if (!user?.email) return;
    try {
      // Determine trigger from opts
      const trigger = opts.trigger || (opts.checkTransactions ? "transaction_created" : opts.checkGoals ? "goal_updated" : "daily_check");

      // Call backend for all gamification logic (streak, achievements, challenges, health score)
      const res = await base44.functions.invoke("processGamification", { trigger, metadata: opts });
      const data = res?.data || {};

      // Refresh profile from DB
      const profiles = await base44.entities.GamificationProfile.filter({ created_by: user.email });
      const p = profiles?.[0] || {};
      setProfile(p);

      // Show XP float
      if ((data.xpAdded || xpAmount) > 0) {
        setXpFloatMsg(`+${data.xpAdded || xpAmount} XP`);
        setTimeout(() => setXpFloatMsg(null), 2000);
      }

      // Streak popup — muncul tiap transaksi pertama di hari itu (saat streak naik / mulai baru)
      const newStreak = data.streak || 0;
      if (data.streakChanged && newStreak >= 1) {
        setStreakPopup({ message: `🔥 Streak ${newStreak} hari!`, streak: newStreak });
      }

      // Streak Freeze used — kasih toast supaya user tahu freeze-nya kepakai
      if (data.streakFreezeUsedToday) {
        toast.success("❄️ Streak Freeze dipakai!", {
          description: `Streak kamu aman, lanjut ke ${newStreak} hari. Sisa freeze: ${data.streakFreezesAvailable}`,
          duration: 6000,
        });
      }

      // Level up popup
      if (data.leveledUp) {
        const newLevelData = LEVELS.find(l => l.level === data.level) || LEVELS[0];
        setLevelUpPopup({ level: newLevelData });
        base44.entities.ShareableCard.create({
          card_type: "level_up",
          card_data: { level: data.level, level_name: newLevelData?.name },
          generated_at: new Date().toISOString(),
        }).catch(() => {});
      }

      // Achievement popup + toast (show first unlocked, toast for all)
      if (data.unlockedAchievements?.length > 0) {
        const key = data.unlockedAchievements[0];
        const def = ACHIEVEMENTS_DEF.find(a => a.key === key);
        if (def) setAchievementPopup(def);

        // Toast for each unlocked achievement
        for (const aKey of data.unlockedAchievements) {
          const aDef = ACHIEVEMENTS_DEF.find(a => a.key === aKey);
          if (aDef) {
            toast.success(`${aDef.icon} Achievement Unlocked: ${aDef.title}`, {
              description: `+${aDef.xp} XP — ${aDef.hint}`,
              duration: 5000,
            });
          }
        }
      }

      return {
        updatedProfile: p,
        didLevelUp: data.leveledUp || false,
        newStreak,
        bonusXP: 0,
        newLevelData: LEVELS.find(l => l.level === data.level) || LEVELS[0],
      };
    } catch (e) {
      console.error("addXP error:", e);
    }
  }, [user?.email]);

  // `saveTransactionWithSync` invokes processGamification directly and forwards
  // the response in the `transaction-added` event detail. Here we consume that
  // payload to fire the streak/level/achievement popups — same logic as addXP,
  // but without re-invoking the backend (would double-award XP).
  const onNewTransaction = useCallback(async (gamData = null) => {
    if (!user?.email) return;
    try {
      // Refresh profile so streak number / XP bar reflect new server state
      const profiles = await base44.entities.GamificationProfile.filter({ created_by: user.email });
      if (profiles?.[0]) setProfile(profiles[0]);

      if (!gamData) return;

      // XP float
      if ((gamData.xpAdded || 0) > 0) {
        setXpFloatMsg(`+${gamData.xpAdded} XP`);
        setTimeout(() => setXpFloatMsg(null), 2000);
      }

      // Streak popup
      const newStreak = gamData.streak || 0;
      if (gamData.streakChanged && newStreak >= 1) {
        setStreakPopup({ message: `🔥 Streak ${newStreak} hari!`, streak: newStreak });
      }

      // Streak Freeze toast
      if (gamData.streakFreezeUsedToday) {
        toast.success("❄️ Streak Freeze dipakai!", {
          description: `Streak kamu aman, lanjut ke ${newStreak} hari. Sisa freeze: ${gamData.streakFreezesAvailable}`,
          duration: 6000,
        });
      }

      // Level up
      if (gamData.leveledUp) {
        const newLevelData = LEVELS.find(l => l.level === gamData.level) || LEVELS[0];
        setLevelUpPopup({ level: newLevelData });
      }

      // Achievements
      if (gamData.unlockedAchievements?.length > 0) {
        const key = gamData.unlockedAchievements[0];
        const def = ACHIEVEMENTS_DEF.find(a => a.key === key);
        if (def) setAchievementPopup(def);
        for (const aKey of gamData.unlockedAchievements) {
          const aDef = ACHIEVEMENTS_DEF.find(a => a.key === aKey);
          if (aDef) {
            toast.success(`${aDef.icon} Achievement Unlocked: ${aDef.title}`, {
              description: `+${aDef.xp} XP — ${aDef.hint}`,
              duration: 5000,
            });
          }
        }
      }
    } catch {}
  }, [user?.email]);

  return {
    profile,
    setProfile,
    streakPopup, setStreakPopup,
    achievementPopup, setAchievementPopup,
    levelUpPopup, setLevelUpPopup,
    xpFloatMsg,
    streakResetMsg, setStreakResetMsg,
    onNewTransaction,
    addXP,
    checkStreakOnLoad,
  };
}