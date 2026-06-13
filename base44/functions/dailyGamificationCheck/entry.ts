/**
 * dailyGamificationCheck — runs as a scheduled admin function
 * Loops all users and processes gamification: streak reset check,
 * challenge failure check, and monthly FinancialHealthScore update.
 * Does NOT award XP (that happens on user action via processGamification).
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Use Jakarta time (WIB, UTC+7) so a user's "day" matches their local calendar,
// regardless of where the scheduler runs. MUST stay in sync with processGamification.
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

function wibDate(offsetDays = 0) {
  const d = new Date(Date.now() + WIB_OFFSET_MS);
  if (offsetDays) d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function todayStr() { return wibDate(0); }
function yesterdayStr() { return wibDate(-1); }
function currentMonth() { return wibDate(0).slice(0, 7); }

// Days between two YYYY-MM-DD strings (b - a), date-only.
function daysBetween(a, b) {
  const da = new Date(a + "T00:00:00Z");
  const db = new Date(b + "T00:00:00Z");
  return Math.round((db - da) / (1000 * 60 * 60 * 24));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const today = todayStr();
    const yesterday = yesterdayStr();
    const month = currentMonth();

    // Get all gamification profiles
    const allProfiles = await base44.asServiceRole.entities.GamificationProfile.list('-updated_date', 200);
    const results = { streak_resets: 0, health_scores: 0, challenges_failed: 0 };

    for (const profile of (allProfiles || [])) {
      const userEmail = profile.created_by;
      if (!userEmail) continue;

      // 1. Streak protection / reset:
      //   - last == today / yesterday → fine, no action.
      //   - gap >= 2 days + streak > 0 → consume 1 Streak Freeze if available
      //     (keeps streak alive; bump last_activity_date to yesterday so the user
      //     coming back today naturally extends streak by +1 and we don't
      //     double-consume on the next scheduler run).
      //   - gap >= 2 days + no freeze → reset streak to 0.
      const last = profile.last_activity_date;
      const currentStreak = profile.daily_streak || 0;
      const gapDays = last ? daysBetween(last, today) : 0;

      if (last && gapDays >= 2 && currentStreak > 0) {
        const freezes = profile.streak_freezes_available ?? 0;
        if (freezes >= 1) {
          await base44.asServiceRole.entities.GamificationProfile.update(profile.id, {
            streak_freezes_available: freezes - 1,
            streak_freeze_last_used: today,
            last_activity_date: yesterday,
          }).catch((e) => console.error('dailyGamificationCheck: freeze consume failed:', e));
          results.freezes_consumed = (results.freezes_consumed || 0) + 1;
        } else {
          await base44.asServiceRole.entities.GamificationProfile.update(profile.id, {
            daily_streak: 0,
          }).catch((e) => console.error('dailyGamificationCheck: streak reset failed:', e));
          results.streak_resets++;
        }
      }

      // 2. Challenge failure check
      const challenges = await base44.asServiceRole.entities.Challenge.filter({ created_by: userEmail, status: "active" }).catch(() => []);
      for (const ch of (challenges || [])) {
        if (ch.end_date && today > ch.end_date && (ch.progress || 0) < 100) {
          await base44.asServiceRole.entities.Challenge.update(ch.id, { status: "failed" }).catch((e) => console.error('dailyGamificationCheck: challenge update failed:', e));
          results.challenges_failed++;
        }
      }

      // 3. FinancialHealthScore: create initial record if missing for this month
      const scores = await base44.asServiceRole.entities.FinancialHealthScore.filter({ created_by: userEmail }).catch(() => []);
      const hasThisMonth = (scores || []).some(s => s.month === month);
      if (!hasThisMonth) {
        // Fetch basic data for initial score
        const [monthTx, budgets, goals, nanaConvos] = await Promise.all([
          base44.asServiceRole.entities.Transaction.filter({ created_by: userEmail }, '-date', 100).catch(() => []),
          base44.asServiceRole.entities.Budget.filter({ created_by: userEmail }).catch(() => []),
          base44.asServiceRole.entities.SavingsGoal.filter({ created_by: userEmail }).catch(() => []),
          base44.asServiceRole.entities.NanaConversation.filter({ created_by: userEmail }, '-created_date', 20).catch(() => []),
        ]);

        const thisMonthTx = (monthTx || []).filter(tx => (tx.date || tx.created_date || '').startsWith(month));
        const uniqueDays = new Set(thisMonthTx.map(tx => (tx.date || tx.created_date || '').slice(0, 10))).size;
        // Use actual days in current month (28-31), not hardcoded 30 — keeps math accurate at month-end.
        const _now = new Date();
        const _daysInMonth = new Date(_now.getFullYear(), _now.getMonth() + 1, 0).getDate();
        const daysSoFar = Math.min(_now.getDate(), _daysInMonth);
        const consistency_score = Math.min(250, Math.round((uniqueDays / Math.max(daysSoFar, 1)) * 250));

        const monthBudgets = (budgets || []).filter(b => b.month === month);
        let budget_adherence_score = 125;
        if (monthBudgets.length > 0) {
          let adherent = 0;
          for (const b of monthBudgets) {
            const spent = thisMonthTx.filter(tx => tx.category === b.category && tx.type === 'expense')
              .reduce((s, tx) => s + (tx.amount || 0), 0);
            if (spent <= (b.amount || 0)) adherent++;
          }
          budget_adherence_score = Math.round((adherent / monthBudgets.length) * 250);
        }

        const streak_score = Math.min(200, Math.round(((profile.daily_streak || 0) / 30) * 200));

        const activeGoals = (goals || []).filter(g => g.status !== 'failed');
        let goal_progress_score = 0;
        if (activeGoals.length > 0) {
          const avg = activeGoals.reduce((s, g) => s + Math.min(1, (g.current_amount || 0) / Math.max(g.target_amount || 1, 1)), 0) / activeGoals.length;
          goal_progress_score = Math.min(200, Math.round(avg * 200));
        }

        const nanaThisMonth = (nanaConvos || []).filter(c => (c.created_date || '').startsWith(month));
        const nana_interaction_score = Math.min(100, nanaThisMonth.length * 10);

        const total_score = consistency_score + budget_adherence_score + streak_score + goal_progress_score + nana_interaction_score;

        await base44.asServiceRole.entities.FinancialHealthScore.create({
          month,
          total_score,
          consistency_score,
          budget_adherence_score,
          streak_score,
          goal_progress_score,
          nana_interaction_score,
          last_calculated_at: new Date().toISOString(),
        }).catch((e) => console.error('dailyGamificationCheck: health score create failed:', e));
        results.health_scores++;
      }
    }

    return Response.json({ success: true, results, processed: (allProfiles || []).length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});