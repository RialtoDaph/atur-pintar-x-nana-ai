import { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { format, subDays } from "date-fns";

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
  { key: "streak_3",           title: "🔥 3 Hari Berturut!",    icon: "🔥", xp: 30,  category: "streak",      hint: "Streak 3 hari berturut-turut" },
  { key: "streak_7",           title: "🔥 Seminggu Penuh!",     icon: "🔥", xp: 70,  category: "streak",      hint: "Streak 7 hari berturut-turut" },
  { key: "streak_30",          title: "💎 30 Hari Konsisten!",  icon: "💎", xp: 300, category: "streak",      hint: "Streak 30 hari berturut-turut" },
  // Transaksi
  { key: "first_transaction",  title: "📝 Pencatat Pertama",    icon: "📝", xp: 20,  category: "transaction", hint: "Catat transaksi pertama" },
  { key: "transaction_10",     title: "📊 10 Transaksi!",       icon: "📊", xp: 50,  category: "transaction", hint: "Total 10 transaksi" },
  { key: "transaction_50",     title: "🗂️ 50 Transaksi!",      icon: "🗂️", xp: 150, category: "transaction", hint: "Total 50 transaksi" },
  // Goal
  { key: "first_goal",         title: "🎯 Punya Tujuan!",       icon: "🎯", xp: 30,  category: "goal",        hint: "Buat 1 savings goal" },
  { key: "goal_completed",     title: "🏆 Goal Tercapai!",      icon: "🏆", xp: 200, category: "goal",        hint: "Selesaikan 1 savings goal" },
  // Level
  { key: "level_3",            title: "🎮 Budgeter Muda",       icon: "🎮", xp: 50,  category: "level",       hint: "Capai Level 3" },
  { key: "level_5",            title: "🧠 Financial Aware",     icon: "🧠", xp: 100, category: "level",       hint: "Capai Level 5" },
  { key: "level_7",            title: "🏆 Atur Pintar Pro!",    icon: "🏆", xp: 500, category: "level",       hint: "Capai Level 7" },
];

export function getLevelFromXP(xp) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].min) return LEVELS[i];
  }
  return LEVELS[0];
}

// Shared helper: award XP and handle streak/level-up via backend
// Returns { updatedProfile, didLevelUp, newLevelData }
export async function awardXP(userEmail, xpAmount, options = {}) {
  // Delegate to processGamification backend for correct streak/achievement logic
  const trigger = options.trigger || (options.checkTransactions ? "transaction_created" : "daily_check");
  try {
    const res = await base44.functions.invoke("processGamification", { trigger, metadata: options });
    const data = res?.data || {};
    // Return a shape compatible with callers
    const existing = await base44.entities.GamificationProfile.filter({ created_by: userEmail });
    const p = existing?.[0] || {};
    const newLevel = getLevelFromXP(p.total_points || 0);
    const oldLevel = getLevelFromXP((p.total_points || 0) - (data.xpAdded || xpAmount));
    return {
      updatedProfile: p,
      didLevelUp: data.leveledUp || false,
      newLevelData: newLevel,
      oldLevelData: oldLevel,
      newStreak: data.streak || p.daily_streak || 0,
      bonusXP: 0,
    };
  } catch (e) {
    // Fallback: update profile directly if backend fails
    const existing = await base44.entities.GamificationProfile.filter({ created_by: userEmail });
    let p;
    if (!existing || existing.length === 0) {
      p = await base44.entities.GamificationProfile.create({
        daily_streak: 0, longest_streak: 0, total_points: 0, level: 1,
        achievements: [], last_activity_date: null,
      });
    } else {
      const sorted = [...existing].sort((a, b) => (b.total_points || 0) - (a.total_points || 0));
      p = sorted[0];
    }
    const today = format(new Date(), "yyyy-MM-dd");
    const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
    const last = p.last_activity_date;
    let newStreak = p.daily_streak || 0;
    if (last === today) { /* same day */ }
    else if (last === yesterday) { newStreak += 1; }
    else { newStreak = 1; }
    const newXP = (p.total_points || 0) + xpAmount;
    const oldLevel = getLevelFromXP(p.total_points || 0);
    const newLevel = getLevelFromXP(newXP);
    const updates = {
      total_points: newXP,
      level: newLevel.level,
      daily_streak: newStreak,
      longest_streak: Math.max(p.longest_streak || 0, newStreak),
      last_activity_date: today,
    };
    await base44.entities.GamificationProfile.update(p.id, updates);
    return {
      updatedProfile: { ...p, ...updates, id: p.id },
      didLevelUp: newLevel.level > oldLevel.level,
      newLevelData: newLevel,
      oldLevelData: oldLevel,
      newStreak,
      bonusXP: 0,
    };
  }
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
      return await base44.entities.GamificationProfile.create({
        daily_streak: 0, longest_streak: 0, total_points: 0, level: 1,
        achievements: [], last_activity_date: null,
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

  async function unlockAchievement(p, key) {
    if ((p.achievements || []).includes(key)) return null;
    const def = ACHIEVEMENTS_DEF.find(a => a.key === key);
    if (!def) return null;

    const newAchievements = [...(p.achievements || []), key];
    await base44.entities.GamificationProfile.update(p.id, { achievements: newAchievements });

    // Save to Achievement entity
    await base44.entities.Achievement.create({
      achievement_key: key,
      title: def.title,
      description: def.hint,
      icon: def.icon,
      category: def.category,
      xp_reward: def.xp,
      is_unlocked: true,
      unlocked_at: new Date().toISOString(),
    }).catch(() => {});

    setAchievementPopup(def);
    return def;
  }

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
        setProfile({ ...p, ...updated });
        setStreakResetMsg("Streak kamu reset nih 😢 Tambah transaksi hari ini untuk mulai lagi!");
      }
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

      // Streak popup
      const newStreak = data.streak || 0;
      if (newStreak > 1) {
        setStreakPopup({ message: `🔥 Streak ${newStreak} hari!`, streak: newStreak });
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

      // Achievement popup (show first unlocked)
      if (data.unlockedAchievements?.length > 0) {
        const key = data.unlockedAchievements[0];
        const def = ACHIEVEMENTS_DEF.find(a => a.key === key);
        if (def) setAchievementPopup(def);
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

  // Legacy compat: onNewTransaction still works
  const onNewTransaction = useCallback(async (opts = {}) => {
    await addXP(10, { checkTransactions: true, checkGoals: opts.isFirstGoal, ...opts });
  }, [addXP]);

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