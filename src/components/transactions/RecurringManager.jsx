import { useEffect } from "react";
import { base44 } from "@/api/base44Client";

const INTERVAL_DAYS = { daily: 1, weekly: 7, monthly: 30, yearly: 365 };

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

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
    const lastGen = tx.recurring_last_generated || tx.date;
    let nextDate = addInterval(lastGen, tx.recurring_interval);

    if (nextDate <= today) {
      // Generate all missing occurrences up to today
      let current = nextDate;
      let latestGenerated = lastGen;

      while (current <= today) {
        await base44.entities.Transaction.create({
          amount: tx.amount,
          type: tx.type,
          category: tx.category,
          note: tx.note,
          date: current,
          is_recurring_child: true,
          recurring_parent_id: tx.id,
        });
        latestGenerated = current;
        current = addInterval(current, tx.recurring_interval);
      }

      await base44.entities.Transaction.update(tx.id, {
        recurring_last_generated: latestGenerated,
      });
    }
  }
}

// Silent background component that runs on mount
export default function RecurringManager({ userEmail }) {
  useEffect(() => {
    if (!userEmail) return;
    processRecurringTransactions(userEmail).catch(console.error);
  }, [userEmail]);
  return null;
}