import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { Resend } from 'npm:resend@4.0.0';

const resend = new Resend(Deno.env.get('Resend_api_'));

const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a82e8090f60786b869983c/54148c256_85F10F30-6B5D-4EA2-865F-C1C5AC4C4170.PNG';
const APP_URL = 'https://app.aturpintar.id/Subscription';

function emailLayout({ previewText, content }) {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Atur Pintar</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; background-color: #F2F4F7; font-family: 'Inter', -apple-system, BlinkMacSystemFont, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    a { color: inherit; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; padding: 0 16px !important; }
      .card { border-radius: 16px !important; }
      .header-pad { padding: 28px 24px !important; }
      .body-pad { padding: 32px 24px !important; }
      .footer-pad { padding: 20px 24px !important; }
      .stat-row td { display: block !important; width: 100% !important; }
      .stat-cell { margin-bottom: 12px !important; }
    }
  </style>
</head>
<body>
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#F2F4F7;">${previewText}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2F4F7;padding:48px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          
          <!-- Card -->
          <tr>
            <td class="card" style="background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
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
                    <p style="margin:0;font-size:12px;color:#94A3B8;line-height:1.7;">Email ini dikirim otomatis. Jika ada pertanyaan, balas email ini atau hubungi kami di <a href="mailto:nana.ai@aturpintar.id" style="color:#FF6A00;text-decoration:none;">nana.ai@aturpintar.id</a></p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Bottom spacing -->
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let remindersSent = 0;

    for (const user of users) {
      if (!user.subscription_end_date || !user.subscription_plan || user.subscription_plan === 'free') continue;
      if (user.subscription_status !== 'active') continue;
      if (user.role === 'admin') continue;

      const endDate = new Date(user.subscription_end_date);
      endDate.setHours(0, 0, 0, 0);
      const diffDays = Math.round((endDate - today) / (1000 * 60 * 60 * 24));

      if (diffDays !== 7) continue;

      if (user.last_reminder_sent_date) {
        const lastSent = new Date(user.last_reminder_sent_date);
        lastSent.setHours(0, 0, 0, 0);
        const daysSinceLastSent = Math.round((today - lastSent) / (1000 * 60 * 60 * 24));
        if (daysSinceLastSent < 6) continue;
      }

      const planLabel = user.subscription_plan === 'premium_monthly' ? 'Premium Bulanan' : 'Premium Tahunan';
      const endDateFormatted = endDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
      const userName = user.full_name || user.email;

      const content = `
        <!-- Alert Icon -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr>
            <td align="center">
              <div style="display:inline-block;background-color:#FFF3E0;border-radius:50%;width:64px;height:64px;line-height:64px;text-align:center;font-size:28px;">⏰</div>
            </td>
          </tr>
        </table>

        <!-- Title -->
        <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1A1A1A;text-align:center;line-height:1.3;">Langgananmu Akan Berakhir</p>
        <p style="margin:0 0 28px;font-size:15px;color:#64748B;text-align:center;line-height:1.6;">
          Hei <strong style="color:#1A1A1A;">${userName}</strong>, langganan <strong style="color:#1A1A1A;">${planLabel}</strong> kamu tinggal <strong style="color:#FF6A00;">7 hari lagi</strong>.
        </p>

        <!-- Info Box -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFF7F0;border:1.5px solid #FFD4B3;border-radius:14px;margin-bottom:28px;">
          <tr>
            <td style="padding:20px 24px;">
              <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#FF6A00;text-transform:uppercase;letter-spacing:1px;">📋 Detail Langganan</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:14px;color:#64748B;padding:4px 0;">Paket</td>
                  <td style="font-size:14px;color:#1A1A1A;font-weight:600;text-align:right;">${planLabel}</td>
                </tr>
                <tr>
                  <td style="font-size:14px;color:#64748B;padding:4px 0;">Berakhir pada</td>
                  <td style="font-size:14px;color:#1A1A1A;font-weight:600;text-align:right;">${endDateFormatted}</td>
                </tr>
                <tr>
                  <td style="font-size:14px;color:#64748B;padding:4px 0;">Sisa waktu</td>
                  <td style="font-size:14px;color:#FF6A00;font-weight:700;text-align:right;">7 hari</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Message -->
        <p style="margin:0 0 28px;font-size:14px;color:#64748B;line-height:1.7;text-align:center;">
          Perpanjang sekarang agar tetap bisa menikmati <strong style="color:#1A1A1A;">AI Financial Coach</strong>, analitik lanjutan, laporan bulanan, dan semua fitur Premium lainnya.
        </p>

        <!-- CTA Button -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center">
              <a href="${APP_URL}" style="display:inline-block;background-color:#FF6A00;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:16px 40px;border-radius:14px;letter-spacing:-0.2px;">
                Perpanjang Langganan →
              </a>
            </td>
          </tr>
        </table>

        <!-- Small note -->
        <p style="margin:20px 0 0;font-size:12px;color:#94A3B8;text-align:center;">Klik tombol di atas untuk melihat pilihan paket yang tersedia.</p>
      `;

      const emailBody = emailLayout({
        previewText: `Langganan ${planLabel} kamu akan berakhir dalam 7 hari — perpanjang sekarang.`,
        content,
      });

      await resend.emails.send({
        from: 'Atur Pintar <admin@aturpintar.id>',
        to: user.email,
        subject: `⏰ 7 Hari Lagi — Perpanjang Langganan Atur Pintar Kamu`,
        html: emailBody,
      });

      await base44.asServiceRole.entities.User.update(user.id, {
        last_reminder_sent_date: today.toISOString().split('T')[0],
      });

      remindersSent++;
    }

    return Response.json({ success: true, reminders_sent: remindersSent });
  } catch (error) {
    console.error('Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});