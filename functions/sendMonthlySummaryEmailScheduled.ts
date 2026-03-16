import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Scheduled version: sends monthly summary to ALL users
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Use service role to get all users
    const users = await base44.asServiceRole.entities.User.list();

    const now = new Date();
    // Get last month data (this runs on the 1st, so we summarize previous month)
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthStart = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth(), 1);
    const monthEnd = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth() + 1, 0);
    const monthName = monthStart.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    let sent = 0;
    let failed = 0;

    for (const user of users) {
      if (!user.email || !user.onboarding_completed) continue;

      try {
        const transactions = await base44.asServiceRole.entities.Transaction.filter({
          created_by: user.email,
          date: {
            $gte: monthStart.toISOString().split('T')[0],
            $lte: monthEnd.toISOString().split('T')[0]
          }
        }, "-date", 500);

        if (transactions.length === 0) continue; // Skip users with no activity

        const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        const savings = transactions.filter(t => t.type === 'savings').reduce((s, t) => s + t.amount, 0);
        const balance = income - expenses;

        const goals = await base44.asServiceRole.entities.SavingsGoal.filter({ created_by: user.email });
        const completedGoals = goals.filter(g => g.status === 'completed').length;

        const savingsRate = income > 0 ? ((income - expenses) / income * 100).toFixed(1) : '0.0';
        const userName = user.full_name || 'Pengguna';

        const emailBody = `
          <html>
          <body style="font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #F2F4F7;">
            <div style="max-width: 600px; margin: 40px auto; background: #F2F4F7; padding: 24px; border-radius: 16px;">
              
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #0A0A0A; margin: 0; font-size: 24px;">📊 Ringkasan Keuangan</h1>
                <p style="color: #FF6A00; font-weight: bold; margin-top: 4px; font-size: 16px;">${monthName}</p>
                <p style="color: #8FA4C8; margin-top: 4px; font-size: 13px;">Halo, ${userName}! Ini laporan keuanganmu bulan lalu.</p>
              </div>

              <div style="background: #0A0A0A; padding: 24px; border-radius: 12px; margin-bottom: 20px;">
                <p style="color: #8FA4C8; margin: 0 0 4px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">SALDO BERSIH</p>
                <p style="color: ${balance >= 0 ? '#99ff80' : '#FF6B6B'}; font-size: 32px; font-weight: bold; margin: 0;">
                  ${balance >= 0 ? '+' : ''}Rp ${balance.toLocaleString('id-ID')}
                </p>
              </div>

              <div style="display: flex; gap: 12px; margin-bottom: 20px;">
                <div style="flex: 1; background: white; padding: 16px; border-radius: 12px; text-align: center;">
                  <p style="color: #8FA4C8; margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase;">PENDAPATAN</p>
                  <p style="color: #00C9A7; font-size: 18px; font-weight: bold; margin: 0;">Rp ${income.toLocaleString('id-ID')}</p>
                </div>
                <div style="flex: 1; background: white; padding: 16px; border-radius: 12px; text-align: center;">
                  <p style="color: #8FA4C8; margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase;">PENGELUARAN</p>
                  <p style="color: #FF6B6B; font-size: 18px; font-weight: bold; margin: 0;">Rp ${expenses.toLocaleString('id-ID')}</p>
                </div>
              </div>

              <div style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                <h3 style="color: #0A0A0A; margin-top: 0; font-size: 14px;">📈 Analisis Bulan Ini</h3>
                <table style="width: 100%; color: #4A5568; font-size: 13px;">
                  <tr>
                    <td style="padding: 5px 0;">Total Transaksi</td>
                    <td style="text-align: right; font-weight: bold; color: #0A0A0A;">${transactions.length}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;">Tabungan</td>
                    <td style="text-align: right; font-weight: bold; color: #4F7CFF;">Rp ${savings.toLocaleString('id-ID')}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;">Rasio Menabung</td>
                    <td style="text-align: right; font-weight: bold; color: ${parseFloat(savingsRate) >= 20 ? '#00C9A7' : '#FF6A00'};">${savingsRate}%</td>
                  </tr>
                  ${completedGoals > 0 ? `<tr>
                    <td style="padding: 5px 0;">Target Selesai</td>
                    <td style="text-align: right; font-weight: bold; color: #00C9A7;">✅ ${completedGoals} target</td>
                  </tr>` : ''}
                </table>
              </div>

              <div style="text-align: center; padding-top: 16px; border-top: 1px solid #E2E8F0;">
                <a href="https://app.base44.com" style="background: #FF6A00; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block; font-size: 14px;">
                  Lihat Detail di Aplikasi →
                </a>
                <p style="color: #8FA4C8; font-size: 12px; margin-top: 16px;">Atur Pintar — Financial Tracker powered by Nana AI</p>
              </div>

            </div>
          </body>
          </html>
        `;

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: user.email,
          subject: `📊 Ringkasan Keuangan ${monthName} — Atur Pintar`,
          body: emailBody,
          from_name: 'Atur Pintar'
        });

        sent++;
      } catch (err) {
        console.error(`Failed to send to ${user.email}:`, err.message);
        failed++;
      }
    }

    return Response.json({ success: true, sent, failed, total: users.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});