import { createClientFromRequest } from "npm:@base44/sdk@0.8.23";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { action, transaction, oldTransaction } = await req.json();
    // action: "create" | "update" | "delete"
    // transaction: current tx data
    // oldTransaction: previous tx data (for updates)

    // 1. Account balance sync
    if (transaction?.account_id) {
      const accounts = await base44.entities.Account.filter({ id: transaction.account_id });
      const account = accounts?.[0];
      if (account) {
        let newBalance = account.balance || 0;

        if (action === "create") {
          const delta = getDelta(transaction.type, transaction.amount);
          newBalance += delta;
        } else if (action === "delete" && oldTransaction) {
          const delta = getDelta(oldTransaction.type, oldTransaction.amount);
          newBalance -= delta;
        } else if (action === "update") {
          // Reverse old, apply new
          const oldDelta = getDelta(oldTransaction.type, oldTransaction.amount);
          newBalance -= oldDelta;
          const newDelta = getDelta(transaction.type, transaction.amount);
          newBalance += newDelta;
        }

        await base44.entities.Account.update(transaction.account_id, { balance: newBalance });
      }
    }

    // 2. Savings goal sync (only for "savings" type)
    if (transaction?.type === "savings" && transaction?.goal_id) {
      const goals = await base44.entities.SavingsGoal.filter({ id: transaction.goal_id });
      const goal = goals?.[0];
      if (goal) {
        let newAmount = goal.current_amount || 0;

        if (action === "create") {
          newAmount += transaction.amount;
        } else if (action === "delete" && oldTransaction) {
          newAmount -= oldTransaction.amount;
        } else if (action === "update") {
          newAmount -= oldTransaction.amount;
          newAmount += transaction.amount;
        }

        newAmount = Math.max(0, newAmount); // Never go negative
        await base44.entities.SavingsGoal.update(transaction.goal_id, { current_amount: newAmount });
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getDelta(type, amount) {
  if (type === "income") return amount;
  if (type === "expense" || type === "savings") return -amount;
  return 0;
}