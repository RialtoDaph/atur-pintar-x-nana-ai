import { base44 } from "@/api/base44Client";
import { syncAccountBalance } from "@/components/utils/accountSync";
import { recalcGoalAmount } from "@/components/utils/recalcGoalAmount";

/**
 * Single source of truth for saving a new transaction from any "add transaction" UI
 * (Layout FAB, Dashboard desktop CTA, modals, etc.).
 *
 * - Creates the Transaction
 * - Syncs the linked account balance (skips recurring templates — only generated children affect balance)
 * - Recalculates linked SavingsGoal.current_amount when this is a savings tx with goal_id
 * - Dispatches `transaction-added` so Dashboard's gamification listener fires once
 * - Schedules a `refresh-dashboard` event after balance propagates
 *
 * Callers should NOT dispatch these events themselves — that causes double-firing of
 * processGamification and racey balance reads.
 */
export async function saveTransactionWithSync(data) {
  await base44.entities.Transaction.create(data);
  if (data.account_id && !data.is_recurring) {
    await syncAccountBalance(data.account_id, data.amount, data.type, 1);
  }
  if (data.type === "savings" && data.goal_id) {
    await recalcGoalAmount(data.goal_id);
  }
  // Fire streak/XP update immediately — independent of whether the user is on
  // the Dashboard. We AWAIT the response (briefly) so we can forward streak/level/
  // achievement deltas to the Dashboard listener via the `transaction-added`
  // event payload — that's what drives the celebration popups.
  let gamificationResult = null;
  try {
    const res = await base44.functions.invoke("processGamification", { trigger: "transaction_created" });
    gamificationResult = res?.data || null;
  } catch {}
  window.dispatchEvent(new CustomEvent("transaction-added", { detail: { gamification: gamificationResult } }));
  setTimeout(() => window.dispatchEvent(new Event("refresh-dashboard")), 400);
}