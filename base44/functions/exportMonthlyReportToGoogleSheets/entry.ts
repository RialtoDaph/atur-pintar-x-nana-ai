import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const [allTransactions, customCategories, goals] = await Promise.all([
      base44.entities.Transaction.filter({ created_by: user.email }, '-date'),
      base44.entities.CustomCategory.filter({ created_by: user.email }),
      base44.entities.SavingsGoal.filter({ created_by: user.email })
    ]);

    const transactions = allTransactions.filter(t => t.date >= monthStart && t.date <= monthEnd);

    const defaultCategories = {
      housing: { label: 'Rumah', emoji: '🏠' },
      food: { label: 'Makanan', emoji: '🍔' },
      transport: { label: 'Transportasi', emoji: '🚗' },
      health: { label: 'Kesehatan', emoji: '❤️' },
      entertainment: { label: 'Hiburan', emoji: '🎬' },
      shopping: { label: 'Belanja', emoji: '🛍️' },
      subscriptions: { label: 'Langganan', emoji: '📱' },
      salary: { label: 'Gaji', emoji: '💼' },
      freelance: { label: 'Freelance', emoji: '💻' },
      savings: { label: 'Tabungan', emoji: '🐷' },
      other: { label: 'Lainnya', emoji: '📦' }
    };

    function getCategoryLabel(key) {
      if (!key) return 'Lainnya';
      if (defaultCategories[key]) return `${defaultCategories[key].emoji} ${defaultCategories[key].label}`;
      const custom = customCategories.find(c => `custom_${c.id}` === key || c.id === key);
      if (custom) return `${custom.emoji} ${custom.name}`;
      return key;
    }

    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const savings = transactions.filter(t => t.type === 'savings').reduce((s, t) => s + t.amount, 0);

    const expensesByCategory = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      const key = t.category || 'other';
      expensesByCategory[key] = (expensesByCategory[key] || 0) + t.amount;
    });

    const monthName = now.toLocaleString('id-ID', { month: 'long', year: 'numeric' });

    // Build rows
    const values = [
      ['LAPORAN KEUANGAN BULANAN - ATUR PINTAR'],
      [`Bulan: ${monthName}`],
      ['Dibuat:', new Date().toLocaleString('id-ID')],
      [''],
      ['RINGKASAN'],
      ['Pemasukan', income],
      ['Pengeluaran', expenses],
      ['Tabungan', savings],
      ['Saldo Bersih', income - expenses],
      [''],
      ['PENGELUARAN PER KATEGORI'],
      ['Kategori', 'Jumlah (Rp)'],
      ...Object.entries(expensesByCategory).map(([k, v]) => [getCategoryLabel(k), v]),
      [''],
      ['SEMUA TRANSAKSI BULAN INI'],
      ['Tanggal', 'Jenis', 'Kategori', 'Nominal (Rp)', 'Catatan'],
      ...transactions.map(t => [t.date, t.type, getCategoryLabel(t.category), t.amount, t.note || '']),
      [''],
      ['TUJUAN TABUNGAN'],
      ['Nama', 'Target (Rp)', 'Terkumpul (Rp)', 'Progress (%)', 'Status'],
      ...goals.map(g => [g.name, g.target_amount, g.current_amount || 0, (((g.current_amount || 0) / g.target_amount) * 100).toFixed(1), g.status])
    ];

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    // Create spreadsheet
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ properties: { title: `Laporan ${monthName} - Atur Pintar` } })
    });

    const spreadsheet = await createRes.json();
    if (!spreadsheet.spreadsheetId) {
      return Response.json({ error: 'Gagal membuat spreadsheet: ' + JSON.stringify(spreadsheet) }, { status: 500 });
    }

    const spreadsheetId = spreadsheet.spreadsheetId;

    // Write data
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values })
      }
    );

    return Response.json({
      success: true,
      spreadsheetId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
      message: `Laporan ${monthName} berhasil dibuat`
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});