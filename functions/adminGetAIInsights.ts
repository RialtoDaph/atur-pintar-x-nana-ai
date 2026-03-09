import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Get all users and their transaction counts
    const [users, transactions] = await Promise.all([
      base44.asServiceRole.entities.User.list(),
      base44.asServiceRole.entities.Transaction.list('-date', 3000),
    ]);

    // Simulate AI insights data based on transaction patterns
    const byUser = {};
    for (const t of transactions) {
      const email = t.created_by || 'unknown';
      if (!byUser[email]) byUser[email] = { income: 0, expense: 0, count: 0, categories: {} };
      byUser[email].count++;
      if (t.type === 'income') byUser[email].income += t.amount || 0;
      if (t.type === 'expense') {
        byUser[email].expense += t.amount || 0;
        if (t.category) byUser[email].categories[t.category] = (byUser[email].categories[t.category] || 0) + (t.amount || 0);
      }
    }

    const insights = users.map(u => {
      const data = byUser[u.email] || { income: 0, expense: 0, count: 0, categories: {} };
      const topCategory = Object.entries(data.categories).sort((a, b) => b[1] - a[1])[0];
      const savingsRate = data.income > 0 ? ((data.income - data.expense) / data.income * 100).toFixed(1) : 0;

      let insightText = '';
      if (data.count === 0) {
        insightText = 'Pengguna belum memiliki transaksi.';
      } else if (data.expense > data.income) {
        insightText = `Pengeluaran melebihi pemasukan. Defisit Rp ${(data.expense - data.income).toLocaleString('id-ID')}.`;
      } else if (savingsRate > 30) {
        insightText = `Tingkat tabungan sangat baik (${savingsRate}%). Pengeluaran terbesar: ${topCategory?.[0] || '-'}.`;
      } else {
        insightText = `Tingkat tabungan ${savingsRate}%. Kategori terbesar: ${topCategory?.[0] || '-'} Rp ${(topCategory?.[1] || 0).toLocaleString('id-ID')}.`;
      }

      return {
        user_id: u.id,
        user_email: u.email,
        user_name: u.full_name,
        transaction_count: data.count,
        total_income: data.income,
        total_expense: data.expense,
        savings_rate: parseFloat(savingsRate),
        top_category: topCategory?.[0] || null,
        insight: insightText,
        has_deficit: data.expense > data.income,
      };
    }).filter(i => i.transaction_count > 0);

    const totalAICallsEstimate = insights.length * 3; // estimate
    return Response.json({ insights, totalAICallsEstimate });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});