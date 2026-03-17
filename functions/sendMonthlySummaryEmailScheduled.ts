import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a82e8090f60786b869983c/54148c256_85F10F30-6B5D-4EA2-865F-C1C5AC4C4170.PNG';
const APP_URL = 'https://app.aturpintar.id/Analytics';

function emailLayout({ previewText, content }) {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Atur Pintar</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; background-color: #F2F4F7; font-family: 'Inter', -apple-system, BlinkMacSystemFont, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    a { color: inherit; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; padding: 0 16px !important; }
      .body-pad { padding: 32px 24px !important; }
      .header-pad { padding: 28px 24px !important; }
      .footer-pad { padding: 20px 24px !important; }
      .stat-col { display: block !important; width: 100% !important; margin-bottom: 12px !important; }
    }
  </style>
</head>
<body>
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#F2F4F7;">${previewText}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2F4F7;padding:48px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">

                <!-- Header -->
                <tr>
                  <td class="header-pad" style="background-color:#0A0A0A;padding:32px 40px;text-align:center;">
                    <img src="${LOGO_URL}" alt="Atur Pintar" width="52" height="52" style="border-radius:14px;margin-bottom:14px;display:block;margin-left:auto;margin-right:auto;">
                    <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">Atur Pintar</p>
                    <p style="margin:4px 0 0;color:#8FA4C8;font-size:12px;letter-spacing:0.5px;text-transform:uppercase;">Financial Tracker</p>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td class="body-pad" style="padding:40px 40px 32px;">
                    ${content}
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td class="footer-pad" style="background-color:#F8FAFC;padding:24px 40px;text-align:center;border-top:1px solid #E2E8F0;">
                    <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#1A1A1A;">Atur Pintar</p>
                    <p style="margin:0;font-size:12px;color:#94A3B8;line-height:1.7;">Email ringkasan dikirim otomatis setiap bulan. Pertanyaan? Hubungi <a href="mailto:support@aturpintar.id" style="color:#FF6A00;text-decoration:none;">support@aturpintar.id</a></p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
          <tr><td style="height:32px;"></td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const users = await base44.asServiceRole.entities.User.list();

    const now = new Date();
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
            $lte: monthEnd.toISOString().split('T')[0],
          }
        }, '-date', 500);

        if (transactions.length === 0) continue;

        const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        const savings = transactions.filter(t => t.type === 'savings').reduce((s, t) => s + t.amount, 0);
        const balance = income - expenses;
        const savingsRate = income > 0 ? ((income - expenses) / income * 100).toFixed(1) : '0.0';

        const goals = await base44.asServiceRole.entities.SavingsGoal.filter({ created_by: user.email });
        const completedGoals = goals.filter(g => g.status === 'completed').length;

        const userName = user.full_name || 'Pengguna';
        const balancePositive = balance >= 0;
        const savingsRateNum = parseFloat(savingsRate);

        let savingsStatus = '⚠️ Perlu ditingkatkan';
        let savingsColor = '#FF6A00';
        if (savingsRateNum >= 30) { savingsStatus = '🌟 Luar biasa!'; savingsColor = '#22C55E'; }
        else if (savingsRateNum >= 20) { savingsStatus = '✅ Sudah bagus!'; savingsColor = '#22C55E'; }
        else if (savingsRateNum >= 10) { savingsStatus = '👍 Cukup baik'; savingsColor = '#F59E0B'; }

        const content = `
          <!-- Title -->
          <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#FF6A00;text-transform:uppercase;letter-spacing:1px;text-align:center;">Laporan Bulanan</p>
          <p style="margin:0 0 4px;font-size:24px;font-weight:700;color:#1A1A1A;text-align:center;line-height:1.2;">📊 ${monthName}</p>
          <p style="margin:0 0 28px;font-size:14px;color:#64748B;text-align:center;">Hei <strong style="color:#1A1A1A;">${userName}</strong>! Ini ringkasan keuanganmu bulan lalu.</p>

          <!-- Net Balance Hero -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A0A0A;border-radius:16px;margin-bottom:16px;overflow:hidden;">
            <tr>
              <td style="padding:28px;text-align:center;">
                <p style="margin:0 0 6px;font-size:11px;color:#8FA4C8;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Saldo Bersih</p>
                <p style="margin:0;font-size:36px;font-weight:700;color:${balancePositive ? '#4ade80' : '#f87171'};">
                  ${balancePositive ? '+' : ''}Rp ${balance.toLocaleString('id-ID')}
                </p>
                <p style="margin:8px 0 0;font-size:13px;color:${balancePositive ? '#86efac' : '#fca5a5'};">${balancePositive ? '✨ Bulan ini kamu surplus!' : '⚠️ Pengeluaran melebihi pemasukan'}</p>
              </td>
            </tr>
          </table>

          <!-- Income & Expense Stats (2 col) -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
            <tr>
              <td class="stat-col" width="49%" style="background-color:#F0FDF4;border-radius:14px;padding:18px 20px;vertical-align:top;">
                <p style="margin:0 0 4px;font-size:11px;color:#16A34A;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;">Pemasukan</p>
                <p style="margin:0;font-size:20px;font-weight:700;color:#15803D;">Rp ${income.toLocaleString('id-ID')}</p>
              </td>
              <td width="2%"></td>
              <td class="stat-col" width="49%" style="background-color:#FEF2F2;border-radius:14px;padding:18px 20px;vertical-align:top;">
                <p style="margin:0 0 4px;font-size:11px;color:#DC2626;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;">Pengeluaran</p>
                <p style="margin:0;font-size:20px;font-weight:700;color:#DC2626;">Rp ${expenses.toLocaleString('id-ID')}</p>
              </td>
            </tr>
          </table>

          <!-- Detail Stats -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8FAFC;border-radius:14px;margin-bottom:28px;overflow:hidden;">
            <tr>
              <td style="padding:20px 24px;">
                <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#1A1A1A;">📈 Analisis Bulan Ini</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size:13px;color:#64748B;padding:8px 0;border-bottom:1px solid #E2E8F0;">Total Transaksi</td>
                    <td style="font-size:13px;color:#1A1A1A;font-weight:700;text-align:right;padding:8px 0;border-bottom:1px solid #E2E8F0;">${transactions.length} transaksi</td>
                  </tr>
                  <tr>
                    <td style="font-size:13px;color:#64748B;padding:8px 0;border-bottom:1px solid #E2E8F0;">Tabungan</td>
                    <td style="font-size:13px;color:#3B82F6;font-weight:700;text-align:right;padding:8px 0;border-bottom:1px solid #E2E8F0;">Rp ${savings.toLocaleString('id-ID')}</td>
                  </tr>
                  <tr>
                    <td style="font-size:13px;color:#64748B;padding:8px 0;${completedGoals > 0 ? 'border-bottom:1px solid #E2E8F0;' : ''}">Rasio Menabung</td>
                    <td style="font-size:13px;font-weight:700;text-align:right;padding:8px 0;color:${savingsColor};${completedGoals > 0 ? 'border-bottom:1px solid #E2E8F0;' : ''}">${savingsRate}% — ${savingsStatus}</td>
                  </tr>
                  ${completedGoals > 0 ? `<tr>
                    <td style="font-size:13px;color:#64748B;padding:8px 0;">Target Selesai</td>
                    <td style="font-size:13px;color:#22C55E;font-weight:700;text-align:right;padding:8px 0;">🎯 ${completedGoals} goal tercapai!</td>
                  </tr>` : ''}
                </table>
              </td>
            </tr>
          </table>

          <!-- CTA -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center">
                <a href="${APP_URL}" style="display:inline-block;background-color:#FF6A00;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:16px 44px;border-radius:14px;letter-spacing:-0.2px;">
                  Lihat Analitik Lengkap →
                </a>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0;font-size:12px;color:#94A3B8;text-align:center;">Terus semangat mengelola keuanganmu! 💪</p>
        `;

        const emailBody = emailLayout({
          previewText: `Ringkasan keuangan ${monthName} — Saldo bersih: ${balancePositive ? '+' : ''}Rp ${balance.toLocaleString('id-ID')}`,
          content,
        });

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: user.email,
          subject: `📊 Laporan Keuangan ${monthName} Kamu — Atur Pintar`,
          body: emailBody,
          from_name: 'Atur Pintar',
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