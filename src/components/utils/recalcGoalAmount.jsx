import { base44 } from "@/api/base44Client";

/**
 * Recalculates a SavingsGoal's `current_amount` from the SUM of all linked
 * non-deleted "savings" transactions, and auto-marks the goal as "completed"
 * once current_amount >= target_amount.
 *
 * Call this from every code path that mutates a savings-linked transaction:
 *  - create (new savings tx with goal_id)
 *  - update (goal_id changed, amount changed, or type flipped to/from savings)
 *  - soft-delete (is_deleted set to true)
 *
 * Pass `null`/falsy goalId to no-op (lets callers blindly pass an optional id).
 * Errors are swallowed (best-effort sync) so the calling save flow never fails.
 */
export async function recalcGoalAmount(goalId) {
  if (!goalId) return;
  try {
    const txs = await base44.entities.Transaction.filter({
      goal_id: goalId,
      type: "savings",
      is_deleted: false,
    });
    const sum = (txs || []).reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const [goal] = await base44.entities.SavingsGoal.filter({ id: goalId });
    if (!goal) return;
    const patch = { current_amount: sum };
    // Only flip to completed when target is set and reached.
    // Don't auto-revert from "completed" → "active" here (user may have manually completed it).
    if ((goal.target_amount || 0) > 0 && sum >= goal.target_amount && goal.status !== "completed") {
      patch.status = "completed";
    }
    await base44.entities.SavingsGoal.update(goalId, patch);
  } catch {
    // silent — sync is best-effort
  }
}