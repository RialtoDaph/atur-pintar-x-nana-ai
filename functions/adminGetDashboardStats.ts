import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const [users, transactions, goals, debts] = await Promise.all([
      base44.asServiceRole.entities.User.list(),
      base44.asServiceRole.entities.Transaction.list('-date', 2000),
      base44.asServiceRole.entities.SavingsGoal.list(),
      base44.asServiceRole.entities.Debt.list(),
    ]);

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const thisMonthStr = now.toISOString().slice(0, 7);
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last6Months.push(d.toISOString().slice(0, 7));
    }

    // Active users (had a transaction this month)
    const activeEmailsMonthly = new Set(
      transactions.filter(t => t.date?.startsWith(thisMonthStr)).map(t => t.created_by)
    );
    const activeEmailsDaily = new Set(
      transactions.filter(t => t.date === todayStr).map(t => t.created_by)
    );

    // Income vs expenses
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);

    // Monthly breakdown for charts
    const txByMonth = {};
    const usersByMonth = {};
    for (const m of last6Months) { txByMonth[m] = 0; usersByMonth[m] = new Set(); }
    for (const t of transactions) {
      const m = t.date?.slice(0, 7);
      if (txByMonth[m] !== undefined) {
        txByMonth[m]++;
        if (t.created_by) usersByMonth[m].add(t.created_by);
      }
    }
    const usersByMonthCount = {};
    for (const m of last6Months) usersByMonthCount[m] = usersByMonth[m].size;

    // Registered users by month
    const regByMonth = {};
    for (const m of last6Months) regByMonth[m] = 0;
    for (const u of users) {
      const m = u.created_date?.slice(0, 7);
      if (regByMonth[m] !== undefined) regByMonth[m]++;
    }

    const chartData = last6Months.map(m => ({
      month: m,
      transactions: txByMonth[m],
      activeUsers: usersByMonthCount[m],
      newUsers: regByMonth[m],
    }));

    return Response.json({
      totalUsers: users.length,
      activeUsersMonthly: activeEmailsMonthly.size,
      activeUsersDaily: activeEmailsDaily.size,
      totalTransactions: transactions.length,
      totalIncome,
      totalExpense,
      totalGoals: goals.length,
      totalDebts: debts.length,
      chartData,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});