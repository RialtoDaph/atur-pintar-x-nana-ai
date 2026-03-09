import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const transactions = await base44.asServiceRole.entities.Transaction.list('-date', 3000);

    // Group by user
    const byUser = {};
    for (const t of transactions) {
      const email = t.created_by || 'unknown';
      if (!byUser[email]) byUser[email] = [];
      byUser[email].push(t);
    }

    const anomalies = [];

    for (const [email, txs] of Object.entries(byUser)) {
      const expenses = txs.filter(t => t.type === 'expense' && t.amount > 0);
      if (expenses.length < 3) continue;

      const amounts = expenses.map(t => t.amount);
      const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const std = Math.sqrt(amounts.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / amounts.length);

      // 1. Spike anomaly: amount > mean + 3*std
      for (const t of expenses) {
        if (t.amount > mean + 3 * std && t.amount > 500000) {
          anomalies.push({
            type: 'spending_spike',
            severity: 'high',
            user_email: email,
            transaction_id: t.id,
            amount: t.amount,
            date: t.date,
            category: t.category,
            note: t.note,
            description: `Transaksi sebesar Rp ${t.amount.toLocaleString('id-ID')} jauh di atas rata-rata Rp ${Math.round(mean).toLocaleString('id-ID')}`,
          });
        }
      }

      // 2. Duplicate transaction: same amount + category + date
      const seen = {};
      for (const t of txs) {
        const key = `${t.date}-${t.category}-${t.amount}-${t.type}`;
        if (seen[key]) {
          anomalies.push({
            type: 'duplicate_transaction',
            severity: 'medium',
            user_email: email,
            transaction_id: t.id,
            amount: t.amount,
            date: t.date,
            category: t.category,
            note: t.note,
            description: `Kemungkinan transaksi duplikat pada ${t.date} kategori ${t.category}`,
          });
        } else {
          seen[key] = true;
        }
      }

      // 3. Zero or negative amount (data bug)
      for (const t of txs) {
        if (t.amount <= 0) {
          anomalies.push({
            type: 'data_bug',
            severity: 'high',
            user_email: email,
            transaction_id: t.id,
            amount: t.amount,
            date: t.date,
            category: t.category,
            note: t.note,
            description: `Transaksi dengan amount ${t.amount} (nol atau negatif) — kemungkinan bug data`,
          });
        }
      }

      // 4. Unusually high frequency: >10 transactions in one day
      const byDay = {};
      for (const t of txs) {
        if (!t.date) continue;
        byDay[t.date] = (byDay[t.date] || 0) + 1;
      }
      for (const [day, count] of Object.entries(byDay)) {
        if (count > 10) {
          anomalies.push({
            type: 'high_frequency',
            severity: 'medium',
            user_email: email,
            transaction_id: null,
            amount: null,
            date: day,
            category: null,
            note: null,
            description: `${count} transaksi dalam satu hari (${day}) — aktivitas tidak wajar`,
          });
        }
      }
    }

    // Sort by severity
    const order = { high: 0, medium: 1, low: 2 };
    anomalies.sort((a, b) => (order[a.severity] ?? 2) - (order[b.severity] ?? 2));

    return Response.json({ anomalies, total: anomalies.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});