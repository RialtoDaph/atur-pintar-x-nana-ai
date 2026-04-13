import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { action, transaction, oldTransaction } = await req.json();

    const results = [];

    // ── 1. Account balance sync ──────────────────────────────────────────────
    const oldAccountId = oldTransaction?.account_id;
    const newAccountId = transaction?.account_id;

    if (action === "update" && oldAccountId && newAccountId && oldAccountId !== newAccountId) {
      // Account changed on edit: revert from old account, apply to new account
      const [oldAccs, newAccs] = await Promise.all([
        base44.entities.Account.filter({ id: oldAccountId }),
        base44.entities.Account.filter({ id: newAccountId }),
      ]);
      const oldAcc = oldAccs?.[0];
      const newAcc = newAccs?.[0];
      if (oldAcc) {
        await base44.entities.Account.update(oldAccountId, {
          balance: (oldAcc.balance || 0) - getDelta(oldTransaction.type, oldTransaction.amount),
        });
        results.push("old_account_reverted");
      }
      if (newAcc) {
        await base44.entities.Account.update(newAccountId, {
          balance: (newAcc.balance || 0) + getDelta(transaction.type, transaction.amount),
        });
        results.push("new_account_applied");
      }
    } else {
      // Same account (or create/delete)
      const accountId = newAccountId || oldAccountId;
      if (accountId) {
        const accounts = await base44.entities.Account.filter({ id: accountId });
        const account = accounts?.[0];
        if (account) {
          let newBalance = account.balance || 0;
          if (action === "create") {
            newBalance += getDelta(transaction.type, transaction.amount);
          } else if (action === "delete" && oldTransaction) {
            newBalance -= getDelta(oldTransaction.type, oldTransaction.amount);
          } else if (action === "update" && oldTransaction) {
            // Same account: reverse old, apply new
            newBalance -= getDelta(oldTransaction.type, oldTransaction.amount);
            newBalance += getDelta(transaction.type, transaction.amount);
          }
          await base44.entities.Account.update(accountId, { balance: newBalance });
          results.push("account_synced");
        }
      }
    }

    // ── 2. Savings goal sync ─────────────────────────────────────────────────
    const oldGoalId = oldTransaction?.goal_id;
    const newGoalId = transaction?.goal_id;

    // Handle goal_id change on edit
    if (action === "update" && oldGoalId && newGoalId && oldGoalId !== newGoalId) {
      // Revert from old goal
      if (oldTransaction?.type === "savings") {
        const oldGoals = await base44.entities.SavingsGoal.filter({ id: oldGoalId });
        const oldGoal = oldGoals?.[0];
        if (oldGoal) {
          const newAmount = Math.max(0, (oldGoal.current_amount || 0) - oldTransaction.amount);
          await base44.entities.SavingsGoal.update(oldGoalId, { current_amount: newAmount });
          results.push("old_goal_reverted");
        }
      }
      // Apply to new goal
      if (transaction?.type === "savings" && newGoalId) {
        const newGoals = await base44.entities.SavingsGoal.filter({ id: newGoalId });
        const newGoal = newGoals?.[0];
        if (newGoal) {
          const newAmount = (newGoal.current_amount || 0) + transaction.amount;
          const updates = { current_amount: newAmount };
          if (newAmount >= newGoal.target_amount && newGoal.status !== "completed") {
            updates.status = "completed";
          }
          await base44.entities.SavingsGoal.update(newGoalId, updates);
          results.push("new_goal_applied");
        }
      }
    } else {
      const goalId = newGoalId || oldGoalId;
      if (goalId && (transaction?.type === "savings" || oldTransaction?.type === "savings")) {
        const goals = await base44.entities.SavingsGoal.filter({ id: goalId });
        const goal = goals?.[0];
        if (goal) {
          let newAmount = goal.current_amount || 0;
          if (action === "create" && transaction.type === "savings") {
            newAmount += transaction.amount;
          } else if (action === "delete" && oldTransaction?.type === "savings") {
            newAmount -= oldTransaction.amount;
          } else if (action === "update") {
            if (oldTransaction?.type === "savings") newAmount -= oldTransaction.amount;
            if (transaction?.type === "savings") newAmount += transaction.amount;
          }
          newAmount = Math.max(0, newAmount);
          const updates = { current_amount: newAmount };

          // Auto-complete goal if target reached
          if (newAmount >= goal.target_amount && goal.status !== "completed") {
            updates.status = "completed";
            await createAlertIfNotExists(base44, user.email, {
              type: "goal_near",
              title: "🎉 Tujuan tabungan tercapai!",
              message: `Selamat! Kamu berhasil mencapai tujuan "${goal.name}". Target ${goal.target_amount} terpenuhi!`,
              severity: "high",
              status: "unread",
            });
            results.push("goal_completed");
          }
          // Revert completed status if amount drops below target
          if (newAmount < goal.target_amount && goal.status === "completed") {
            updates.status = "active";
          }
          await base44.entities.SavingsGoal.update(goalId, updates);
          results.push("goal_synced");
        }
      }
    }

    // ── 3. Debt payment sync ─────────────────────────────────────────────────
    const oldDebtId = oldTransaction?.debt_id;
    const newDebtId = transaction?.debt_id;

    if (action === "update" && oldDebtId && newDebtId && oldDebtId !== newDebtId) {
      // Debt changed: revert old, apply new
      if (oldTransaction?.type === "expense") {
        const oldDebts = await base44.entities.Debt.filter({ id: oldDebtId });
        const oldDebt = oldDebts?.[0];
        if (oldDebt) {
          const newRemaining = Math.min(oldDebt.total_amount || 0, (oldDebt.remaining_amount || 0) + oldTransaction.amount);
          await base44.entities.Debt.update(oldDebtId, { remaining_amount: newRemaining, status: newRemaining > 0 ? "active" : "paid" });
        }
      }
      if (transaction?.type === "expense") {
        const newDebts = await base44.entities.Debt.filter({ id: newDebtId });
        const newDebt = newDebts?.[0];
        if (newDebt) {
          const newRemaining = Math.max(0, (newDebt.remaining_amount || 0) - transaction.amount);
          await base44.entities.Debt.update(newDebtId, { remaining_amount: newRemaining, status: newRemaining <= 0 ? "paid" : "active" });
        }
      }
      results.push("debt_synced_split");
    } else {
      const debtId = newDebtId || oldDebtId;
      if (debtId && (transaction?.type === "expense" || oldTransaction?.type === "expense")) {
        const debts = await base44.entities.Debt.filter({ id: debtId });
        const debt = debts?.[0];
        if (debt) {
          let remaining = debt.remaining_amount || 0;
          if (action === "create" && transaction.type === "expense") {
            remaining -= transaction.amount;
          } else if (action === "delete" && oldTransaction?.type === "expense") {
            remaining += oldTransaction.amount;
          } else if (action === "update") {
            if (oldTransaction?.type === "expense") remaining += oldTransaction.amount;
            if (transaction?.type === "expense") remaining -= transaction.amount;
          }
          remaining = Math.max(0, remaining);
          const debtUpdates = { remaining_amount: remaining };
          if (remaining <= 0) {
            debtUpdates.status = "paid";
          } else if (debt.status === "paid" && remaining > 0) {
            debtUpdates.status = "active";
          }
          await base44.entities.Debt.update(debtId, debtUpdates);
          results.push("debt_synced");
        }
      }
    }

    return Response.json({ success: true, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getDelta(type, amount) {
  if (type === "income") return amount;
  if (type === "expense" || type === "savings") return -amount;
  return 0;
}

async function createAlertIfNotExists(base44, userEmail, alertData) {
  try {
    const existing = await base44.entities.Alert.filter({ title: alertData.title, status: "unread" });
    if (existing && existing.length > 0) return;
    await base44.entities.Alert.create({ ...alertData, created_by: userEmail });
  } catch (e) {
    // Silent fail
  }
}