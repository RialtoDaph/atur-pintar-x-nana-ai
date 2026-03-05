import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current month's transactions
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const transactions = await base44.entities.Transaction.filter(
      { created_by: user.email },
      '-date'
    );

    const monthlyTransactions = transactions.filter(t => t.date >= monthStart && t.date <= monthEnd);
    const customCategories = await base44.entities.CustomCategory.filter({ created_by: user.email });
    const goals = await base44.entities.SavingsGoal.filter({ created_by: user.email });

    // Default categories
    const defaultCategories = {
      food: { label: 'Makanan', emoji: '🍔' },
      transport: { label: 'Transportasi', emoji: '🚗' },
      utilities: { label: 'Listrik/Air', emoji: '💡' },
      entertainment: { label: 'Hiburan', emoji: '🎬' },
      shopping: { label: 'Belanja', emoji: '🛍️' },
      health: { label: 'Kesehatan', emoji: '⚕️' },
      education: { label: 'Pendidikan', emoji: '📚' },
      salary: { label: 'Gaji', emoji: '💰' },
      freelance: { label: 'Freelance', emoji: '💻' },
      investment: { label: 'Investasi', emoji: '📈' },
      other: { label: 'Lainnya', emoji: '📌' }
    };

    // Calculate summaries
    const income = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const savings = monthlyTransactions
      .filter(t => t.type === 'savings')
      .reduce((sum, t) => sum + t.amount, 0);

    // Group expenses by category
    const expensesByCategory = {};
    monthlyTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const catKey = t.category || 'other';
        if (!expensesByCategory[catKey]) {
          expensesByCategory[catKey] = 0;
        }
        expensesByCategory[catKey] += t.amount;
      });

    // Create sheet title
    const monthName = now.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
    const sheetTitle = `Laporan ${monthName}`;

    // Prepare data for Google Sheets
    const values = [
      ['LAPORAN KEUANGAN BULANAN'],
      [`Bulan: ${monthName}`],
      [''],
      ['RINGKASAN'],
      ['Pemasukan', income],
      ['Pengeluaran', expenses],
      ['Tabungan', savings],
      ['Saldo Bersih', income - expenses],
      [''],
      ['PENGELUARAN BERDASARKAN KATEGORI'],
      ['Kategori', 'Jumlah']
    ];

    // Add category breakdown
    Object.entries(expensesByCategory).forEach(([catKey, amount]) => {
      let label = catKey;
      if (defaultCategories[catKey]) {
        label = `${defaultCategories[catKey].emoji} ${defaultCategories[catKey].label}`;
      } else {
        const custom = customCategories.find(c => c.id === catKey);
        if (custom) {
          label = `${custom.emoji} ${custom.name}`;
        }
      }
      values.push([label, amount]);
    });

    // Get Google Sheets connector
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    // Create new spreadsheet
    const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: {
          title: sheetTitle,
          locale: 'id_ID'
        }
      })
    });

    const spreadsheet = await createResponse.json();
    const spreadsheetId = spreadsheet.spreadsheetId;
    const sheetId = spreadsheet.sheets[0].properties.sheetId;

    // Update sheet with data
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Sheet1'!A1?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values })
      }
    );

    // Format header row
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [
          {
            repeatCell: {
              range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
              cell: {
                userEnteredFormat: {
                  textFormat: { bold: true, fontSize: 14 },
                  backgroundColor: { red: 0.2, green: 0.2, blue: 0.2 },
                  textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } }
                }
              },
              fields: 'userEnteredFormat'
            }
          }
        ]
      })
    });

    return Response.json({
      success: true,
      spreadsheetId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
      message: `Laporan ${monthName} berhasil dibuat di Google Sheets`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});