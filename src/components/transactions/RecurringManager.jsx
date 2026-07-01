import { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { recalculateAccountBalance } from "@/components/utils/accountSync";

const INTERVAL_DAYS = { daily: 1, weekly: 7, monthly: 30, yearly: 365 };

function addInterval(dateStr, interval) {
  const d = new Date(dateStr);
  if (interval === "monthly") {
    d.setMonth(d.getMonth() + 1);
  } else if (interval === "yearly") {
    d.setFullYear(d.getFullYear() + 1);
  } else {
    d.setDate(d.getDate() + INTERVAL_DAYS[interval]);
  }
  return d.toISOString().split("T")[0];
}

export async function processRecurringTransactions(userEmail) {
  const today = new Date().toISOString().split("T")[0];
  const filter = userEmail ? { is_recurring: true, created_by: userEmail } : { is_recurring: true };
  const all = await base44.entities.Transaction.filter(filter);

  for (const tx of all) {
    if (!tx.recurring_interval) continue;

    // Expected next child date = parent.date + 1 interval (NEVER the parent's own date —
    // that's the parent transaction itself, generating it as a child would duplicate it).
    // Subsequent runs walk forward from recurring_last_generated.
    const baseDate = tx.recurring_last_generated || tx.date;
    let expectedNextDate = addInterval(baseDate, tx.recurring_interval);

    // Only generate when TODAY has reached/passed the expected next occurrence.
    if (expectedNextDate > today) continue;

    // Fetch all existing children once to dedupe against expected dates.
    const existingChildren = await base44.entities.Transaction.filter({
      recurring_parent_id: tx.id,
    });
    const existingDates = new Set((existingChildren || []).map((c) => c.date));

    const toCreate = [];
    let current = expectedNextDate;
    let anyCreated = false;

    // Catch up: generate one child per missed occurrence, up to and including today.
    while (current <= today) {
      if (!existingDates.has(current)) {
        toCreate.push({
          amount: tx.amount,
          type: tx.type,
          category: tx.category,
          note: tx.note,
          date: current,
          is_recurring: false,
          is_recurring_child: true,
          recurring_parent_id: tx.id,
          ...(tx.account_id ? { account_id: tx.account_id } : {}),
        });
        existingDates.add(current);
        anyCreated = true;
      }
      current = addInterval(current, tx.recurring_interval);
    }

    if (toCreate.length > 0) {
      await base44.entities.Transaction.bulkCreate(toCreate);
    }

    // Only touch the parent when we actually generated something —
    // avoids a wasted write per template per day for users who open the app daily.
    if (anyCreated) {
      await base44.entities.Transaction.update(tx.id, {
        recurring_last_generated: today,
      });
      if (tx.account_id) {
        // Recalculate balance ONCE from source of truth (idempotent, accurate).
        await recalculateAccountBalance(tx.account_id);
      }
    }
  }
}

// Silent background component that runs on mount — once per day per session
export default function RecurringManager({ userEmail }) {
  useEffect(() => {
    if (!userEmail) return;
    const today = new Date().toISOString().split("T")[0];
    const key = `recurring_processed_${userEmail}_${today}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    processRecurringTransactions(userEmail).catch(console.error);
  }, [userEmail]);
  return null;
}