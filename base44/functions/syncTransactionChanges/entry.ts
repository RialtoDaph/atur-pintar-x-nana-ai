import { createClientFromRequest } from "npm:@base44/sdk@0.8.23";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { action, transaction, oldTransaction } = await req.json();

    const results = [];

    // ── 1. Account balance sync ──────────────────────────────────────────────
    const accountId = transaction?.account_id || oldTransaction?.account_id;
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
          newBalance -= getDelta(oldTransaction.type, oldTransaction.amount);
          newBalance += getDelta(transaction.type, transaction.amount);
        }
        await base44.entities.Account.update(accountId, { balance: newBalance });
        results.push("account_synced");
      }
    }

    // ── 2. Savings goal sync ─────────────────────────────────────────────────
    const goalId = transaction?.goal_id || oldTransaction?.goal_id;
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
          // Create alert (with dedup check)
          await createAlertIfNotExists(base44, user.email, {
            type: "goal_near",
            title: "🎉 Tujuan tabungan tercapai!",
            message: `Selamat! Kamu berhasil mencapai tujuan "${goal.name}". Target ${goal.target_amount} terpenuhi!`,
            severity: "high",
            status: "unread",
          });
          results.push("goal_completed");
        }
        await base44.entities.SavingsGoal.update(goalId, updates);
        results.push("goal_synced");
      }
    }

    // ── 3. Debt payment sync ─────────────────────────────────────────────────
    const debtId = transaction?.debt_id || oldTransaction?.debt_id;
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
        if (remaining <= 0) debtUpdates.status = "paid";
        await base44.entities.Debt.update(debtId, debtUpdates);
        results.push("debt_synced");
      }
    }

    // ── 4. Alert dedup helper for spending_spike "Yuk mulai catat transaksi" ─
    // (Handled via createAlertIfNotExists above — used elsewhere too)

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
    // Check for existing unread alert with same title
    const existing = await base44.entities.Alert.filter({ title: alertData.title, status: "unread" });
    if (existing && existing.length > 0) return; // Skip duplicate
    await base44.entities.Alert.create({ ...alertData, created_by: userEmail });
  } catch (e) {
    // Silent fail - don't block the main sync
  }
}