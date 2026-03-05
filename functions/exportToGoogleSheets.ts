import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current month transactions
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const transactions = await base44.entities.Transaction.filter({
      created_by: user.email,
      date: { $gte: monthStart.toISOString().split('T')[0], $lte: monthEnd.toISOString().split('T')[0] }
    }, "-date", 500);

    // Get custom categories for labels
    const customCats = await base44.entities.CustomCategory.filter({ created_by: user.email });

    const DEFAULT_CATEGORIES = {
      expense: [
        { key: "housing", label: "Housing" },
        { key: "food", label: "Food" },
        { key: "transport", label: "Transport" },
        { key: "health", label: "Health" },
        { key: "entertainment", label: "Entertainment" },
        { key: "shopping", label: "Shopping" },
        { key: "subscriptions", label: "Subscriptions" },
        { key: "other", label: "Other" },
      ],
      income: [
        { key: "salary", label: "Salary" },
        { key: "freelance", label: "Freelance" },
        { key: "other", label: "Other" },
      ],
    };

    const getCategoryLabel = (key) => {
      if (key.startsWith('custom_')) {
        const customId = key.replace('custom_', '');
        return customCats.find(c => c.id === customId)?.name || key;
      }
      const allCats = [...DEFAULT_CATEGORIES.expense, ...DEFAULT_CATEGORIES.income];
      return allCats.find(c => c.key === key)?.label || key;
    };

    // Get goals for summary
    const goals = await base44.entities.SavingsGoal.filter({ created_by: user.email });

    // Prepare data for Google Sheets
    const monthName = monthStart.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    // Summary section
    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const savings = transactions.filter(t => t.type === 'savings').reduce((s, t) => s + t.amount, 0);

    // Format data structure that will be sent to invoke function
    const exportData = {
      month: monthName,
      summary: {
        income,
        expenses,
        savings,
        balance: income - expenses
      },
      transactions: transactions.map(t => ({
        date: t.date,
        type: t.type,
        category: getCategoryLabel(t.category),
        amount: t.amount,
        note: t.note || ''
      })),
      goals: goals.map(g => ({
        name: g.name,
        target: g.target_amount,
        current: g.current_amount || 0,
        status: g.status,
        progress: ((g.current_amount || 0) / g.target_amount * 100).toFixed(1)
      }))
    };

    return Response.json(exportData);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});