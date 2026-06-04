import { base44 } from "@/api/base44Client";
import { syncAccountBalance } from "@/components/utils/accountSync";

/**
 * Single source of truth for saving a new transaction from any "add transaction" UI
 * (Layout FAB, Dashboard desktop CTA, modals, etc.).
 *
 * - Creates the Transaction
 * - Syncs the linked account balance (skips recurring templates — only generated children affect balance)
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
  window.dispatchEvent(new CustomEvent("transaction-added"));
  setTimeout(() => window.dispatchEvent(new Event("refresh-dashboard")), 400);
}