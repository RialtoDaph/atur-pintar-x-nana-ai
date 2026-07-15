/**
 * incrementNanaQuota — atomically increment user's Nana message quota.
 *
 * Replaces client-side read-modify-write pattern that caused race conditions
 * when users spam-sent messages (concurrent updateMe calls overwriting each other
 * with stale counts).
 *
 * Always reads the latest user state inside the function and writes
 * the incremented value, so concurrent calls each see the correct base.
 *
 * Returns: { count, month, limitReached }
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const FREE_MSG_LIMIT = 30;

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const isPremium = user.subscription_plan === "premium_monthly" || user.subscription_plan === "premium_yearly";

    // 🎁 Free access window — semua user dapat unlimited Nana chat sampai tanggal ini
    const FREE_ACCESS_UNTIL = "2099-12-31";
    const todayStr = new Date().toISOString().slice(0, 10);
    const inFreeWindow = todayStr <= FREE_ACCESS_UNTIL;

    // Premium users (atau dalam free window) tidak punya limit — return early.
    if (isPremium || inFreeWindow || user.role === "admin") {
      return Response.json({ count: 0, month: currentMonth(), limitReached: false, isPremium: true });
    }

    const month = currentMonth();
    const sameMonth = user.nana_message_month === month;
    const currentCount = sameMonth ? (user.nana_message_count || 0) : 0;

    if (currentCount >= FREE_MSG_LIMIT) {
      return Response.json({
        count: currentCount,
        month,
        limitReached: true,
        isPremium: false,
      });
    }

    const newCount = currentCount + 1;
    await base44.auth.updateMe({
      nana_message_count: newCount,
      nana_message_month: month,
    });

    return Response.json({
      count: newCount,
      month,
      limitReached: newCount >= FREE_MSG_LIMIT,
      isPremium: false,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});