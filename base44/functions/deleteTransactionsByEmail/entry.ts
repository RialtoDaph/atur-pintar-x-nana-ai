import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only admins can delete other users' data
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { email } = await req.json();
    if (!email) {
      return Response.json({ error: 'Email parameter required' }, { status: 400 });
    }

    const results = {};

    // Delete Transactions
    const transactions = await base44.asServiceRole.entities.Transaction.filter({ created_by: email });
    if (transactions.length > 0) {
      await Promise.all(transactions.map(tx => base44.asServiceRole.entities.Transaction.delete(tx.id)));
      results.transactions = transactions.length;
    }

    // Delete Subscriptions
    const subscriptions = await base44.asServiceRole.entities.Subscription.filter({ created_by: email });
    if (subscriptions.length > 0) {
      await Promise.all(subscriptions.map(sub => base44.asServiceRole.entities.Subscription.delete(sub.id)));
      results.subscriptions = subscriptions.length;
    }

    // Delete Budgets
    const budgets = await base44.asServiceRole.entities.Budget.filter({ created_by: email });
    if (budgets.length > 0) {
      await Promise.all(budgets.map(b => base44.asServiceRole.entities.Budget.delete(b.id)));
      results.budgets = budgets.length;
    }

    // Delete Savings Goals
    const goals = await base44.asServiceRole.entities.SavingsGoal.filter({ created_by: email });
    if (goals.length > 0) {
      await Promise.all(goals.map(g => base44.asServiceRole.entities.SavingsGoal.delete(g.id)));
      results.goals = goals.length;
    }

    // Delete Debts
    const debts = await base44.asServiceRole.entities.Debt.filter({ created_by: email });
    if (debts.length > 0) {
      await Promise.all(debts.map(d => base44.asServiceRole.entities.Debt.delete(d.id)));
      results.debts = debts.length;
    }

    // Delete Reminders
    const reminders = await base44.asServiceRole.entities.Reminder.filter({ created_by: email });
    if (reminders.length > 0) {
      await Promise.all(reminders.map(r => base44.asServiceRole.entities.Reminder.delete(r.id)));
      results.reminders = reminders.length;
    }

    // Reset streak data on user profile
    const targetUser = (await base44.asServiceRole.entities.User.filter({ email }))[0];
    if (targetUser) {
      await base44.asServiceRole.entities.User.update(targetUser.id, {
        current_streak: 0,
        longest_streak: 0,
        last_transaction_date: null
      });
      results.streakReset = true;
    }

    return Response.json({
      message: `Deleted all financial data for ${email}`,
      email,
      deletedItems: results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});