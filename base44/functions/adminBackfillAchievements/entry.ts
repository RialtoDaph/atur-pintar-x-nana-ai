/**
 * adminBackfillAchievements — admin-only function to recalculate and unlock
 * achievements for ALL users (or a specific user) based on their actual data.
 *
 * This fixes historical drift where users earned milestones but the achievement
 * never unlocked (e.g. user has 15 transactions but transaction_10 is locked).
 *
 * Mirrors the achievement logic in processGamification but RUNS RETROACTIVELY
 * against each user's full data. Does NOT touch streak/last_activity/XP for
 * non-achievement triggers — only unlocks missed achievements and awards their XP.
 *
 * Payload: { target_email?: string }  // omit to run for ALL users
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
  { key: "streak_3",           xp: 30,  category: "streak",      title: "🔥 3 Hari Berturut!",  icon: "🔥", hint: "Streak 3 hari" },
  { key: "streak_7",           xp: 70,  category: "streak",      title: "🔥 Seminggu Penuh!",   icon: "🔥", hint: "Streak 7 hari" },
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
  { key: "persona_revealed",   xp: 30,  category: "special",     title: "🔮 Persona Terungkap!",icon: "🔮", hint: "Persona keuangan terungkap" },
];

function getLevelFromXP(xp) {
  let level = LEVEL_THRESHOLDS[0];
  for (const l of LEVEL_THRESHOLDS) {
    if (xp >= l.min) level = l;
  }
  return level.level;
}

async function backfillUser(base44, userEmail, profile) {
  // Fetch all relevant data for this user via service role (so we don't get RLS'd)
  const [allTx, goals, budgets, nanaConvos, achievementRecords, personas] = await Promise.all([
    base44.asServiceRole.entities.Transaction.filter({ created_by: userEmail, is_deleted: false }, "-date", 2000).catch(() => []),
    base44.asServiceRole.entities.SavingsGoal.filter({ created_by: userEmail }).catch(() => []),
    base44.asServiceRole.entities.Budget.filter({ created_by: userEmail }).catch(() => []),
    base44.asServiceRole.entities.NanaConversation.filter({ created_by: userEmail }).catch(() => []),
    base44.asServiceRole.entities.Achievement.filter({ created_by: userEmail }).catch(() => []),
    base44.asServiceRole.entities.UserPersona.filter({ created_by: userEmail }).catch(() => []),
  ]);

  const unlockedKeys = new Set((achievementRecords || []).filter(a => a.is_unlocked).map(a => a.achievement_key));
  const newlyUnlocked = [];
  let xpAdded = 0;
  const profileAchievements = Array.isArray(profile.achievements) ? [...profile.achievements] : [];

  async function tryUnlock(key, condition) {
    if (!condition || unlockedKeys.has(key)) return;
    const def = ACHIEVEMENTS_DEF.find(a => a.key === key);
    if (!def) return;
    unlockedKeys.add(key);
    newlyUnlocked.push(key);
    xpAdded += def.xp;

    const existing = (achievementRecords || []).find(a => a.achievement_key === key);
    if (existing) {
      await base44.asServiceRole.entities.Achievement.update(existing.id, {
        is_unlocked: true,
        unlocked_at: new Date().toISOString(),
        title: def.title,
        description: def.hint,
        icon: def.icon,
        category: def.category,
        xp_reward: def.xp,
      }).catch(() => {});
    } else {
      // Create using service role and set created_by manually
      await base44.asServiceRole.entities.Achievement.create({
        achievement_key: key,
        title: def.title,
        description: def.hint,
        icon: def.icon,
        category: def.category,
        xp_reward: def.xp,
        is_unlocked: true,
        unlocked_at: new Date().toISOString(),
        created_by: userEmail,
      }).catch(() => {});
    }
    if (!profileAchievements.includes(key)) profileAchievements.push(key);
  }

  // Transaction milestones
  const txCount = (allTx || []).length;
  await tryUnlock("first_transaction", txCount >= 1);
  await tryUnlock("transaction_10", txCount >= 10);
  await tryUnlock("transaction_50", txCount >= 50);
  await tryUnlock("transaction_100", txCount >= 100);

  // Streak milestones (based on longest_streak ever reached)
  const longest = profile.longest_streak || 0;
  await tryUnlock("streak_3", longest >= 3);
  await tryUnlock("streak_7", longest >= 7);
  await tryUnlock("streak_14", longest >= 14);
  await tryUnlock("streak_30", longest >= 30);

  // Goal milestones
  await tryUnlock("first_goal", (goals || []).length >= 1);
  await tryUnlock("goal_50pct", (goals || []).some(g => g.target_amount > 0 && (g.current_amount || 0) / g.target_amount >= 0.5));
  await tryUnlock("goal_completed", (goals || []).some(g => g.status === "completed"));

  // Budget milestones
  await tryUnlock("first_budget", (budgets || []).length >= 1);

  // Nana milestone
  await tryUnlock("first_nana_chat", (nanaConvos || []).length >= 1);

  // Persona milestone
  await tryUnlock("persona_revealed", (personas || []).length >= 1);

  // Now compute new XP and level
  let newXP = (profile.total_points || 0) + xpAdded;
  let level = getLevelFromXP(newXP);

  // Level achievements based on the NEW level (might cascade — level_2 +20 XP could trigger level_3)
  // Loop a few times to catch cascades
  for (let i = 0; i < 6; i++) {
    let beforeXP = newXP;
    if (level >= 2 && !unlockedKeys.has("level_2")) { await tryUnlock("level_2", true); newXP = (profile.total_points || 0) + xpAdded; }
    if (level >= 3 && !unlockedKeys.has("level_3")) { await tryUnlock("level_3", true); newXP = (profile.total_points || 0) + xpAdded; }
    if (level >= 4 && !unlockedKeys.has("level_4")) { await tryUnlock("level_4", true); newXP = (profile.total_points || 0) + xpAdded; }
    if (level >= 5 && !unlockedKeys.has("level_5")) { await tryUnlock("level_5", true); newXP = (profile.total_points || 0) + xpAdded; }
    if (level >= 6 && !unlockedKeys.has("level_6")) { await tryUnlock("level_6", true); newXP = (profile.total_points || 0) + xpAdded; }
    if (level >= 7 && !unlockedKeys.has("level_7")) { await tryUnlock("level_7", true); newXP = (profile.total_points || 0) + xpAdded; }
    const newLevel = getLevelFromXP(newXP);
    if (newLevel === level && newXP === beforeXP) break;
    level = newLevel;
  }

  // Save profile with updated XP, level, and achievements list
  if (newlyUnlocked.length > 0 || profileAchievements.length !== (profile.achievements || []).length) {
    await base44.asServiceRole.entities.GamificationProfile.update(profile.id, {
      total_points: newXP,
      level,
      achievements: profileAchievements,
    }).catch(() => {});
  }

  return { email: userEmail, newlyUnlocked, xpAdded, newXP, level };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const targetEmail = body.target_email;

    // Get all profiles (or just one) via service role
    let profiles;
    if (targetEmail) {
      profiles = await base44.asServiceRole.entities.GamificationProfile.filter({ created_by: targetEmail }).catch(() => []);
    } else {
      profiles = await base44.asServiceRole.entities.GamificationProfile.list("-updated_date", 500).catch(() => []);
    }

    const summary = [];
    for (const p of (profiles || [])) {
      const email = p.created_by;
      if (!email) continue;
      try {
        const r = await backfillUser(base44, email, p);
        summary.push(r);
      } catch (e) {
        summary.push({ email, error: e.message });
      }
    }

    const totalUnlocked = summary.reduce((s, r) => s + ((r.newlyUnlocked || []).length), 0);
    const totalXP = summary.reduce((s, r) => s + (r.xpAdded || 0), 0);

    return Response.json({
      success: true,
      profiles_processed: summary.length,
      total_achievements_unlocked: totalUnlocked,
      total_xp_awarded: totalXP,
      details: summary,
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});