import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all transactions for the current month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const transactions = await base44.entities.Transaction.filter({
      created_by: user.email,
      date: { $gte: monthStart.toISOString().split('T')[0], $lte: monthEnd.toISOString().split('T')[0] }
    }, "-date", 500);

    // Calculate summary
    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const savings = transactions.filter(t => t.type === 'savings').reduce((s, t) => s + t.amount, 0);

    // Get goals
    const goals = await base44.entities.SavingsGoal.filter({ created_by: user.email });
    const completedGoals = goals.filter(g => g.status === 'completed').length;

    // Format month
    const monthName = monthStart.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    // Send email
    const emailBody = `
      <html>
      <body style="font-family: 'Inter', sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; background: #F2F4F7; padding: 20px; border-radius: 12px;">
          
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0A0A0A; margin: 0;">Ringkasan Keuangan ${monthName}</h1>
            <p style="color: #8FA4C8; margin-top: 8px;">Atur.in - Kelola Keuanganmu</p>
          </div>

          <div style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
              <div style="text-align: center;">
                <p style="color: #8FA4C8; margin: 0 0 8px 0; font-size: 12px;">PENDAPATAN</p>
                <p style="color: #00C9A7; font-size: 24px; font-weight: bold; margin: 0;">Rp ${income.toLocaleString('id-ID')}</p>
              </div>
              <div style="text-align: center;">
                <p style="color: #8FA4C8; margin: 0 0 8px 0; font-size: 12px;">PENGELUARAN</p>
                <p style="color: #FF6B6B; font-size: 24px; font-weight: bold; margin: 0;">Rp ${expenses.toLocaleString('id-ID')}</p>
              </div>
              <div style="text-align: center;">
                <p style="color: #8FA4C8; margin: 0 0 8px 0; font-size: 12px;">TABUNGAN</p>
                <p style="color: #4F7CFF; font-size: 24px; font-weight: bold; margin: 0;">Rp ${savings.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>

          <div style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <h3 style="color: #0A0A0A; margin-top: 0;">📊 Analisis Bulanan</h3>
            <ul style="color: #4A5568; font-size: 14px;">
              <li>Total Transaksi: ${transactions.length}</li>
              <li>Saldo Bersih: Rp ${(income - expenses).toLocaleString('id-ID')}</li>
              <li>Rasio Pengematan: ${((income - expenses) / income * 100).toFixed(1)}%</li>
              ${completedGoals > 0 ? `<li>✅ Target Selesai: ${completedGoals}</li>` : ''}
            </ul>
          </div>

          <div style="text-align: center; padding-top: 20px; border-top: 1px solid #E2E8F0;">
            <a href="#" style="background: #FF6A00; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
              Lihat Detail di Aplikasi
            </a>
          </div>

        </div>
      </body>
      </html>
    `;

    await base44.integrations.Core.SendEmail({
      to: user.email,
      subject: `Ringkasan Keuangan ${monthName}`,
      body: emailBody,
      from_name: 'Atur.in'
    });

    return Response.json({ success: true, message: `Email ringkasan bulanan dikirim ke ${user.email}` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});