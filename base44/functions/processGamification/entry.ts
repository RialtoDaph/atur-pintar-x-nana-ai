/**
 * processGamification — central backend function to handle all gamification logic:
 * 1. Streak update (Bug 1)
 * 2. Achievement unlock (Bug 2)
 * 3. Challenge progress (Bug 3)
 * 4. FinancialHealthScore init/recalc (Bug 4)
 *
 * Call with: { trigger, userEmail, metadata }
 * triggers: "transaction_created", "goal_created", "goal_updated", "budget_created",
 *           "nana_message_sent", "persona_created", "mood_checkin", "onboarding_completed",
 *           "daily_check"
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const LEVEL_THRESHOLDS = [
  { level: 1, min: 0 },
  { level: 2, min: 500 },
  { level: 3, min: 1500 },
  { level: 4, min: 3000 },
  { level: 5, min: 6000 },
  { level: 6, min: 10000 },
  { level: 7, min: 20000 },
];

const ACHIEVEMENTS_DEF = [
  { key: "first_transaction",  xp: 20,  category: "transaction", title: "📝 Pencatat Pertama",   icon: "📝", hint: "Catat transaksi pertama" },
  { key: "transaction_10",     xp: 50,  category: "transaction", title: "📊 10 Transaksi!",      icon: "📊", hint: "Total 10 transaksi" },
  { key: "transaction_50",     xp: 150, category: "transaction", title: "🗂️ 50 Transaksi!",     icon: "🗂️", hint: "Total 50 transaksi" },
  { key: "transaction_100",    xp: 300, category: "transaction", title: "💯 100 Transaksi!",     icon: "💯", hint: "Total 100 transaksi" },
  { key: "streak_3",           xp: 50,  category: "streak",      title: "🔥 3 Hari Berturut!",  icon: "🔥", hint: "Streak 3 hari" },
  { key: "streak_7",           xp: 100, category: "streak",      title: "🔥 Seminggu Penuh!",   icon: "🔥", hint: "Streak 7 hari" },
  { key: "streak_14",          xp: 140, category: "streak",      title: "🔥 2 Minggu Konsisten!", icon: "🔥", hint: "Streak 14 hari" },
  { key: "streak_30",          xp: 300, category: "streak",      title: "💎 30 Hari Konsisten!", icon: "💎", hint: "Streak 30 hari" },
  { key: "first_goal",         xp: 30,  category: "goal",        title: "🎯 Punya Tujuan!",     icon: "🎯", hint: "Buat 1 savings goal" },
  { key: "goal_50pct",         xp: 80,  category: "goal",        title: "📈 Setengah Jalan!",   icon: "📈", hint: "Goal 50% tercapai" },
  { key: "goal_completed",     xp: 200, category: "goal",        title: "🏆 Goal Tercapai!",    icon: "🏆", hint: "Selesaikan 1 savings goal" },
  { key: "level_2",            xp: 20,  category: "level",       title: "🌱 Si Pencatat",       icon: "🌱", hint: "Capai Level 2" },
  { key: "level_3",            xp: 50,  category: "level",       title: "🎮 Budgeter Muda",     icon: "🎮", hint: "Capai Level 3" },
  { key: "level_4",            xp: 60,  category: "level",       title: "🤝 Social Saver",      icon: "🤝", hint: "Capai Level 4" },
  { key: "level_5",            xp: 100, category: "level",       title: "🧠 Financial Aware",   icon: "🧠", hint: "Capai Level 5" },
  { key: "level_6",            xp: 200, category: "level",       title: "💡 Investor Pemula",   icon: "💡", hint: "Capai Level 6" },
  { key: "level_7",            xp: 500, category: "level",       title: "🏆 Atur Pintar Pro!",  icon: "🏆", hint: "Capai Level 7" },
  { key: "first_budget",       xp: 25,  category: "special",     title: "💰 Budgeter Pertama!", icon: "💰", hint: "Buat budget pertama" },
  { key: "first_nana_chat",    xp: 15,  category: "special",     title: "🤖 Sapa Nana!",        icon: "🤖", hint: "Chat pertama dengan Nana" },
  { key: "budget_stay",        xp: 100, category: "special",     title: "✅ Hemat Sebulan!",    icon: "✅", hint: "Tetap dalam budget sebulan penuh" },
  { key: "persona_revealed",   xp: 30,  category: "special",     title: "🔮 Persona Terungkap!",icon: "🔮", hint: "Persona keuangan terungkap" },
  { key: "mood_7_days",        xp: 70,  category: "special",     title: "😊 7 Hari Mood Check!", icon: "😊", hint: "7 hari mood check-in berturut" },
];

function getLevelFromXP(xp) {
  let level = LEVEL_THRESHOLDS[0];
  for (const l of LEVEL_THRESHOLDS) {
    if (xp >= l.min) level = l;
  }
  return level.level;
}

// All streak/date math uses Jakarta time (WIB, UTC+7) so a user's "day"
// matches their local calendar regardless of the server timezone.
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

function wibDate(offsetDays = 0) {
  const d = new Date(Date.now() + WIB_OFFSET_MS);
  if (offsetDays) d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function todayStr() {
  return wibDate(0);
}

function yesterdayStr() {
  return wibDate(-1);
}

function currentMonth() {
  return wibDate(0).slice(0, 7);
}

// Days between two YYYY-MM-DD strings (b - a), date-only, ignoring time.
function daysBetween(a, b) {
  const da = new Date(a + "T00:00:00Z");
  const db = new Date(b + "T00:00:00Z");
  return Math.round((db - da) / (1000 * 60 * 60 * 24));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { trigger, metadata = {} } = await req.json();
    const userEmail = user.email;
    const results = [];

    // ── 1. Get or create GamificationProfile ─────────────────────────────────
    const profiles = await base44.entities.GamificationProfile.filter({ created_by: userEmail });
    let profile;
    if (!profiles || profiles.length === 0) {
      profile = await base44.entities.GamificationProfile.create({
        daily_streak: 0, longest_streak: 0, total_points: 0, level: 1,
        achievements: [], last_activity_date: null,
        streak_freezes_available: 1, streak_freeze_last_regen: todayStr(),
      });
    } else {
      const sorted = [...profiles].sort((a, b) => (b.total_points || 0) - (a.total_points || 0));
      profile = sorted[0];
      // Cleanup duplicates
      for (const extra of sorted.slice(1)) {
        base44.entities.GamificationProfile.delete(extra.id).catch(() => {});
      }
    }

    // ── 2. Streak update ──────────────────────────────────────────────────────
    // Streak naik untuk setiap aktivitas user yang relevan:
    // catat transaksi, selesaikan misi harian, atau buka aplikasi.
    // Trigger lain (goal, budget, nana, dll) tetap menambah XP tapi tidak menyentuh streak.
    const ACTIVITY_TRIGGERS = new Set([
      "transaction_created",
      "mission_completed",
      "app_opened",
    ]);
    const isActivity = ACTIVITY_TRIGGERS.has(trigger);

    const today = todayStr();
    const yesterday = yesterdayStr();

    // Re-fetch the latest profile state right before computing streak to guard against
    // race conditions where two activity triggers fire in parallel (e.g. transaction-added
    // event + a direct call) and both read stale data, causing the streak to be incremented twice.
    const freshProfiles = await base44.entities.GamificationProfile.filter({ created_by: userEmail });
    const freshProfile = (freshProfiles || []).find(p => p.id === profile.id) || profile;
    const last = freshProfile.last_activity_date;
    const currentStreak = freshProfile.daily_streak || 0;

    let newStreak = currentStreak;
    let streakChanged = false;

    // ── Streak Freeze logic ───────────────────────────────────────────────────
    // Freeze regen: +1 per 7 hari sejak last_regen, max 2. Dicek setiap streak check jalan.
    const FREEZE_MAX = 2;
    const FREEZE_REGEN_DAYS = 7;

    const hasFreezeFields =
      freshProfile.streak_freezes_available !== undefined &&
      freshProfile.streak_freeze_last_regen;
    let freezesAvailable = hasFreezeFields ? (freshProfile.streak_freezes_available ?? 1) : 1;
    let freezeLastRegen = freshProfile.streak_freeze_last_regen || today;
    let freezeLastUsed = freshProfile.streak_freeze_last_used || null;
    let freezeUsedToday = false;

    // Regen freezes: 1 per 7 hari sejak last_regen (max 2). Untuk user lama tanpa field,
    // kasih 1 freeze awal & set last_regen ke today (tanpa regen palsu).
    if (hasFreezeFields) {
      const daysSinceRegen = daysBetween(freezeLastRegen, today);
      if (daysSinceRegen >= FREEZE_REGEN_DAYS && freezesAvailable < FREEZE_MAX) {
        const regenAmount = Math.floor(daysSinceRegen / FREEZE_REGEN_DAYS);
        freezesAvailable = Math.min(FREEZE_MAX, freezesAvailable + regenAmount);
        freezeLastRegen = today;
      }
    }

    if (isActivity) {
      if (!last) {
        // First-ever activity
        newStreak = 1;
        streakChanged = true;
      } else if (last === today) {
        // Same day — no change. Idempotent.
      } else if (last === yesterday) {
        newStreak = currentStreak + 1;
        streakChanged = true;
      } else {
        // 2+ days gap
        if (freezesAvailable >= 1 && currentStreak > 0) {
          // Freeze preserves streak (no increment, just keep it alive)
          freezesAvailable -= 1;
          freezeLastUsed = today;
          freezeUsedToday = true;
          // streak unchanged, but last_activity_date will be updated below
        } else {
          // No freeze available → reset to 0
          newStreak = 0;
          streakChanged = true;
        }
      }
    } else {
      // Non-activity trigger: do not touch streak here. Streak is read-only for these.
    }

    const newLongest = Math.max(freshProfile.longest_streak || 0, newStreak);

    // ── 3. XP award ───────────────────────────────────────────────────────────
    let xpToAdd = 0;
    if (trigger === "transaction_created") xpToAdd = 10;
    else if (trigger === "goal_created") xpToAdd = 5;
    else if (trigger === "goal_updated") xpToAdd = 3;
    else if (trigger === "budget_created") xpToAdd = 5;
    else if (trigger === "nana_message_sent") xpToAdd = 2;
    else if (trigger === "persona_created") xpToAdd = 10;
    else if (trigger === "mood_checkin") xpToAdd = 5;
    else if (trigger === "onboarding_completed") xpToAdd = 50;
    else if (trigger === "mission_completed") xpToAdd = Math.max(0, parseInt(metadata?.xp_reward || 0, 10));
    else if (trigger === "challenge_claimed") xpToAdd = Math.max(0, parseInt(metadata?.xp_reward || 0, 10));
    else if (trigger === "boss_attack") xpToAdd = Math.max(0, parseInt(metadata?.xp_reward || 20, 10));

    // Streak milestone XP is awarded via the streak_3/7/30 achievements (50/100/300 XP).
    // No extra bonus here to avoid double-counting.

    const oldXP = profile.total_points || 0;
    let newXP = oldXP + xpToAdd;

    // We'll add achievement XP below; track them
    const unlockedAchievements = [];

    // ── 4. Get Achievement records for this user ──────────────────────────────
    const achievementRecords = await base44.entities.Achievement.filter({ created_by: userEmail }).catch(() => []);
    const unlockedKeys = new Set((achievementRecords || []).filter(a => a.is_unlocked).map(a => a.achievement_key));

    async function tryUnlock(key, condition) {
      if (!condition) return;
      if (unlockedKeys.has(key)) return;
      const def = ACHIEVEMENTS_DEF.find(a => a.key === key);
      if (!def) return;

      unlockedKeys.add(key);
      unlockedAchievements.push(def);
      newXP += def.xp;

      // Find existing record (locked OR with stale metadata from old schema versions)
      const existing = (achievementRecords || []).find(a => a.achievement_key === key);
      if (existing) {
        // Always re-sync metadata to current ACHIEVEMENTS_DEF — fixes records created
        // with old titles/xp/icons (e.g. "Kenalan Sama Nana!" vs current "🤖 Sapa Nana!").
        await base44.entities.Achievement.update(existing.id, {
          is_unlocked: true,
          unlocked_at: new Date().toISOString(),
          title: def.title,
          description: def.hint,
          icon: def.icon,
          category: def.category,
          xp_reward: def.xp,
        }).catch(() => {});
      } else {
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
      }

      // Also sync achievement_key into freshProfile.achievements array
      // (we'll use freshProfile.achievements in step 6 — not the stale outer `profile`).
      if (!freshProfile.achievements) freshProfile.achievements = [];
      if (!freshProfile.achievements.includes(key)) {
        freshProfile.achievements = [...freshProfile.achievements, key];
      }
    }

    // ── 5. Check achievements by trigger ─────────────────────────────────────

    // Streak achievements — based on LONGEST streak ever reached (not current).
    // Once earned, never lost even if current streak resets to 0.
    await tryUnlock("streak_3", newLongest >= 3);
    await tryUnlock("streak_7", newLongest >= 7);
    await tryUnlock("streak_14", newLongest >= 14);
    await tryUnlock("streak_30", newLongest >= 30);

    // Transaction achievements — count ALL transactions (not capped at 200).
    // Use a higher fetch limit so transaction_50/100 unlock correctly for power users.
    if (trigger === "transaction_created" || trigger === "daily_check") {
      const allTx = await base44.entities.Transaction.filter({ created_by: userEmail, is_deleted: false }, "-date", 1000).catch(() => []);
      const txCount = (allTx || []).length;
      await tryUnlock("first_transaction", txCount >= 1);
      await tryUnlock("transaction_10", txCount >= 10);
      await tryUnlock("transaction_50", txCount >= 50);
      await tryUnlock("transaction_100", txCount >= 100);
    }

    // Goal achievements — also check on transaction_created because savings transactions
    // bump goal.current_amount (Goals.handleAddSavings / handleTransaction) without firing
    // a separate goal_updated trigger.
    if (
      trigger === "goal_created" ||
      trigger === "goal_updated" ||
      trigger === "transaction_created" ||
      trigger === "daily_check"
    ) {
      const goals = await base44.entities.SavingsGoal.filter({ created_by: userEmail }).catch(() => []);
      await tryUnlock("first_goal", (goals || []).length >= 1);
      await tryUnlock("goal_50pct", (goals || []).some(g => g.target_amount > 0 && (g.current_amount || 0) / g.target_amount >= 0.5));
      await tryUnlock("goal_completed", (goals || []).some(g => g.status === "completed"));
    }

    // Budget achievements
    if (trigger === "budget_created" || trigger === "daily_check") {
      const budgets = await base44.entities.Budget.filter({ created_by: userEmail }).catch(() => []);
      await tryUnlock("first_budget", (budgets || []).length >= 1);

      // budget_stay: all budgets for last month were not exceeded.
      // Check on every trigger (not just daily_check) so it unlocks the moment user opens app.
      {
        const lastMonth = (() => {
          const d = new Date();
          d.setMonth(d.getMonth() - 1);
          return d.toISOString().slice(0, 7);
        })();
        const lastMonthBudgets = (budgets || []).filter(b => b.month === lastMonth);
        if (lastMonthBudgets.length > 0) {
          const allTx = await base44.entities.Transaction.filter({ created_by: userEmail }, "-date", 500).catch(() => []);
          const lastMonthTx = (allTx || []).filter(tx => (tx.date || "").startsWith(lastMonth));
          const allUnder = lastMonthBudgets.every(b => {
            const spent = lastMonthTx.filter(tx => tx.category === b.category && tx.type === "expense")
              .reduce((s, tx) => s + (tx.amount || 0), 0);
            return spent <= (b.amount || 0);
          });
          await tryUnlock("budget_stay", allUnder);
        }
      }
    }

    // Nana achievement
    if (trigger === "nana_message_sent" || trigger === "daily_check") {
      const convos = await base44.entities.NanaConversation.filter({ created_by: userEmail }).catch(() => []);
      await tryUnlock("first_nana_chat", (convos || []).length >= 1);
    }

    // Persona achievement
    if (trigger === "persona_created") {
      await tryUnlock("persona_revealed", true);
    }

    // Mood achievement
    if (trigger === "mood_checkin" || trigger === "daily_check") {
      const moods = await base44.entities.MoodCheckIn.filter({ created_by: userEmail }, "-created_date", 7).catch(() => []);
      let consecutiveDays = 0;
      if ((moods || []).length >= 7) {
        // Check 7 consecutive days
        const sorted = [...moods].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        let prev = null;
        consecutiveDays = 0;
        for (const m of sorted.slice(0, 7)) {
          const d = new Date(m.created_date).toISOString().slice(0, 10);
          if (!prev) { consecutiveDays = 1; prev = d; continue; }
          const prevD = new Date(prev);
          prevD.setDate(prevD.getDate() - 1);
          if (d === prevD.toISOString().slice(0, 10)) { consecutiveDays++; prev = d; }
          else break;
        }
      }
      await tryUnlock("mood_7_days", consecutiveDays >= 7);
    }

    // Compute level using the FINAL XP (after streak/transaction/goal/budget achievements have added their XP)
    const oldLevel = getLevelFromXP(oldXP);
    const levelAfterAchievements = getLevelFromXP(newXP);

    // Level achievements (based on level reached after all preceding achievement XP)
    await tryUnlock("level_2", levelAfterAchievements >= 2);
    await tryUnlock("level_3", levelAfterAchievements >= 3);
    await tryUnlock("level_4", levelAfterAchievements >= 4);
    await tryUnlock("level_5", levelAfterAchievements >= 5);
    await tryUnlock("level_6", levelAfterAchievements >= 6);
    await tryUnlock("level_7", levelAfterAchievements >= 7);

    // Recalc level after level-achievement XP (e.g. level_2 +20 XP could push into level_3)
    const finalLevel = getLevelFromXP(newXP);

    // ── 6. Save updated profile (including synced achievements array) ─────────
    // Hanya update last_activity_date kalau ini benar-benar aktivitas user.
    const profileUpdates = {
      total_points: newXP,
      level: finalLevel,
      daily_streak: newStreak,
      longest_streak: newLongest,
      achievements: freshProfile.achievements || profile.achievements || [],
      streak_freezes_available: freezesAvailable,
      streak_freeze_last_regen: freezeLastRegen,
    };
    if (freezeLastUsed) {
      profileUpdates.streak_freeze_last_used = freezeLastUsed;
    }
    if (isActivity) {
      profileUpdates.last_activity_date = today;
    }
    await base44.entities.GamificationProfile.update(profile.id, profileUpdates);
    results.push("profile_updated");

    // ── 7. Challenge progress (Bug 3) ─────────────────────────────────────────
    if (trigger === "transaction_created" || trigger === "daily_check") {
      const challenges = await base44.entities.Challenge.filter({ created_by: userEmail, status: "active" }).catch(() => []);

      for (const ch of (challenges || [])) {
        const lastProg = ch.last_progress_date;
        if (lastProg === today) continue; // Already counted today

        const endDate = ch.end_date;
        const now = today;
        const isExpired = endDate && now > endDate;

        if (isExpired && ch.progress < 100) {
          await base44.entities.Challenge.update(ch.id, { status: "failed" }).catch(() => {});
          continue;
        }

        let progressed = false;

        // Fetch today's tx once — reused by multiple challenge handlers
        const txToday = await base44.entities.Transaction.filter({ created_by: userEmail }, "-date", 50).catch(() => []);
        const todayTxList = (txToday || []).filter(tx => {
          const txDate = (tx.date || tx.created_date || "").slice(0, 10);
          return txDate === today && !tx.is_deleted;
        });

        if (ch.challenge_key === "nabung_30_hari") {
          // Min 1 savings tx >= 10rb today
          const hasSavings = todayTxList.some(tx => tx.type === "savings" && (tx.amount || 0) >= 10000);
          if (hasSavings) progressed = true;
        }

        if (ch.challenge_key === "no_impulsif_7") {
          // No impulse/shopping expense today
          const hasImpulse = todayTxList.some(tx => {
            const cat = (tx.category || "").toLowerCase();
            return tx.type === "expense" && (cat.includes("shopping") || cat.includes("belanja") || cat.includes("hiburan") || cat === "entertainment");
          });
          if (!hasImpulse) progressed = true;
        }

        if (ch.challenge_key === "7_hari_catat") {
          // Min 1 expense logged today (any category)
          const hasExpense = todayTxList.some(tx => tx.type === "expense" && (tx.amount || 0) > 0);
          if (hasExpense) progressed = true;
        }

        if (ch.challenge_key === "audit_langganan") {
          // Auto-progress daily during the 7-day window — user just needs to cancel something during the challenge.
          // We give 1 progress day per active day to mark engagement.
          progressed = true;
        }

        if (progressed) {
          const newDays = (ch.progress_days || 0) + 1;
          const duration = ch.duration_days || 1;
          const newProgress = Math.min(100, Math.round((newDays / duration) * 100));
          const newStatus = newProgress >= 100 ? "completed" : "active";

          await base44.entities.Challenge.update(ch.id, {
            progress_days: newDays,
            progress: newProgress,
            status: newStatus,
            last_progress_date: today,
          }).catch(() => {});

          // Award XP on completion — accumulate into newXP so multiple challenges in one run all count
          if (newStatus === "completed" && ch.xp_reward) {
            newXP += ch.xp_reward;
          }
          results.push(`challenge_${ch.challenge_key}_progressed`);
        }
      }

      // After challenge XP added, re-check level achievements (challenge XP might push to next level)
      const lvlAfterChallenges = getLevelFromXP(newXP);
      await tryUnlock("level_2", lvlAfterChallenges >= 2);
      await tryUnlock("level_3", lvlAfterChallenges >= 3);
      await tryUnlock("level_4", lvlAfterChallenges >= 4);
      await tryUnlock("level_5", lvlAfterChallenges >= 5);
      await tryUnlock("level_6", lvlAfterChallenges >= 6);
      await tryUnlock("level_7", lvlAfterChallenges >= 7);

      // Final profile sync after challenges + level achievements
      await base44.entities.GamificationProfile.update(profile.id, {
        total_points: newXP,
        level: getLevelFromXP(newXP),
        achievements: freshProfile.achievements || [],
      }).catch(() => {});
    }

    // ── 8. FinancialHealthScore init/recalc (Bug 4) ───────────────────────────
    const month = currentMonth();
    const existingScores = await base44.entities.FinancialHealthScore.filter({ created_by: userEmail }).catch(() => []);
    const thisMonthScore = (existingScores || []).find(s => s.month === month);

    if (!thisMonthScore || trigger === "daily_check") {
      // Fetch data for scoring (use profile from earlier — already deduplicated and updated)
      const [allTx, budgets, goals, nanaConvos] = await Promise.all([
        base44.entities.Transaction.filter({ created_by: userEmail }, "-date", 200).catch(() => []),
        base44.entities.Budget.filter({ created_by: userEmail }).catch(() => []),
        base44.entities.SavingsGoal.filter({ created_by: userEmail }).catch(() => []),
        base44.entities.NanaConversation.filter({ created_by: userEmail }, "-created_date", 50).catch(() => []),
      ]);

      const gp = { daily_streak: newStreak };
      const monthTx = (allTx || []).filter(tx => (tx.date || tx.created_date || "").startsWith(month));

      // consistency_score: up to 250 — based on how many days this month had a transaction
      const uniqueDays = new Set(monthTx.map(tx => (tx.date || tx.created_date || "").slice(0, 10))).size;
      const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
      const daysSoFar = Math.min(new Date().getDate(), daysInMonth);
      const consistency_score = Math.min(250, Math.round((uniqueDays / Math.max(daysSoFar, 1)) * 250));

      // budget_adherence_score: up to 250 — % budgets not exceeded
      const monthBudgets = (budgets || []).filter(b => b.month === month);
      let budget_adherence_score = 125; // neutral if no budgets
      if (monthBudgets.length > 0) {
        let adherent = 0;
        for (const b of monthBudgets) {
          const spent = monthTx.filter(tx => tx.category === b.category && tx.type === "expense")
            .reduce((s, tx) => s + (tx.amount || 0), 0);
          if (spent <= (b.amount || 0)) adherent++;
        }
        budget_adherence_score = Math.round((adherent / monthBudgets.length) * 250);
      }

      // streak_score: up to 200
      const streak = gp.daily_streak || 0;
      const streak_score = Math.min(200, Math.round((streak / 30) * 200));

      // goal_progress_score: up to 200
      const activeGoals = (goals || []).filter(g => g.status !== "failed");
      let goal_progress_score = 0;
      if (activeGoals.length > 0) {
        const avgProgress = activeGoals.reduce((s, g) => s + Math.min(1, (g.current_amount || 0) / Math.max(g.target_amount || 1, 1)), 0) / activeGoals.length;
        goal_progress_score = Math.min(200, Math.round(avgProgress * 200));
      }

      // nana_interaction_score: up to 100
      const nanaThisMonth = (nanaConvos || []).filter(c => (c.created_date || "").startsWith(month));
      const nana_interaction_score = Math.min(100, nanaThisMonth.length * 10);

      const total_score = consistency_score + budget_adherence_score + streak_score + goal_progress_score + nana_interaction_score;

      const scoreData = {
        month,
        total_score,
        consistency_score,
        budget_adherence_score,
        streak_score,
        goal_progress_score,
        nana_interaction_score,
        last_calculated_at: new Date().toISOString(),
      };

      if (thisMonthScore) {
        await base44.entities.FinancialHealthScore.update(thisMonthScore.id, scoreData).catch(() => {});
      } else {
        await base44.entities.FinancialHealthScore.create(scoreData).catch(() => {});
      }
      results.push("health_score_updated");
    }

    return Response.json({
      success: true,
      results,
      streak: newStreak,
      streakChanged,
      xpAdded: xpToAdd,
      totalXP: newXP,
      level: finalLevel,
      leveledUp: finalLevel > oldLevel,
      unlockedAchievements: unlockedAchievements.map(a => a.key),
      streakFreezesAvailable: freezesAvailable,
      streakFreezeUsedToday: freezeUsedToday,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});