import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { Resend } from 'npm:resend@4.0.0';

const resend = new Resend(Deno.env.get('Resend_api_'));

const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a82e8090f60786b869983c/54148c256_85F10F30-6B5D-4EA2-865F-C1C5AC4C4170.PNG';
const APP_URL = 'https://app.aturpintar.id/Dashboard';
const SUBSCRIPTION_URL = 'https://app.aturpintar.id/Subscription';

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
                    <p style="margin:4px 0 0;color:#8FA4C8;font-size:12px;letter-spacing:0.5px;text-transform:uppercase;">by PT Rideff Vreka Tech</p>
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
                    <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#1A1A1A;">Atur Pintar</p>
                    <p style="margin:0 0 4px;font-size:11px;color:#94A3B8;">Produk dari PT Rideff Vreka Tech</p>
                    <p style="margin:0;font-size:12px;color:#94A3B8;line-height:1.7;">Ada pertanyaan soal tagihan? Hubungi <a href="mailto:support@aturpintar.id" style="color:#FF6A00;text-decoration:none;">support@aturpintar.id</a></p>
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
    const payload = await req.json();

    const paymentData = payload?.data;
    const userEmail = paymentData?.user_email || paymentData?.created_by;

    if (!userEmail) {
      return Response.json({ error: 'No user email in payload' }, { status: 400 });
    }

    let userName = 'Pengguna';
    try {
      const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
      if (users.length > 0) userName = users[0].full_name || 'Pengguna';
    } catch {}

    const planLabel = paymentData?.plan === 'premium_monthly' ? 'Premium Bulanan' : paymentData?.plan === 'premium_yearly' ? 'Premium Tahunan' : (paymentData?.plan_name || 'Premium');
    const amount = paymentData?.amount ? `Rp ${Number(paymentData.amount).toLocaleString('id-ID')}` : '-';
    const status = paymentData?.status || 'pending';
    const expiryDate = paymentData?.expires_at
      ? new Date(paymentData.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      : '-';

    const isSuccess = status === 'approved' || status === 'active' || status === 'paid';

    const premiumFeatures = [
      '💬 Chat Nana AI tanpa batas',
      '📊 Analitik lanjutan & laporan bulanan',
      '📤 Export ke Google Sheets & PDF',
      '🔔 Smart alerts & budget notifications',
      '🎯 Unlimited savings goals',
    ];

    const featureList = premiumFeatures.map(f => `
      <tr>
        <td style="padding:7px 0;font-size:13px;color:#4A5568;border-bottom:1px solid #F2F4F7;">${f}</td>
      </tr>
    `).join('');

    const successContent = `
      <!-- Status Icon -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
        <tr>
          <td align="center">
            <div style="display:inline-block;background-color:#F0FDF4;border-radius:50%;width:72px;height:72px;line-height:72px;text-align:center;font-size:32px;">✅</div>
          </td>
        </tr>
      </table>

      <p style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1A1A1A;text-align:center;line-height:1.2;">Pembayaran Berhasil!</p>
      <p style="margin:0 0 28px;font-size:15px;color:#64748B;text-align:center;line-height:1.6;">
        Hei <strong style="color:#1A1A1A;">${userName}</strong>, akun Premium kamu sudah aktif. Selamat menikmati semua fiturnya!
      </p>

      <!-- Receipt Box -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A0A0A;border-radius:16px;margin-bottom:28px;overflow:hidden;">
        <tr>
          <td style="padding:24px 28px;">
            <p style="margin:0 0 4px;font-size:11px;color:#8FA4C8;">Pembayaran diterima oleh PT Rideff Vreka Tech</p>
            <p style="margin:0 0 16px;font-size:11px;font-weight:700;color:#8FA4C8;text-transform:uppercase;letter-spacing:1px;">📋 Ringkasan Pembayaran</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:14px;color:#8FA4C8;padding:6px 0;">Paket</td>
                <td style="font-size:14px;color:#ffffff;font-weight:600;text-align:right;">${planLabel}</td>
              </tr>
              <tr>
                <td style="font-size:14px;color:#8FA4C8;padding:6px 0;border-top:1px solid #1e1e1e;">Total Bayar</td>
                <td style="font-size:16px;color:#FF6A00;font-weight:700;text-align:right;border-top:1px solid #1e1e1e;">${amount}</td>
              </tr>
              <tr>
                <td style="font-size:14px;color:#8FA4C8;padding:6px 0;border-top:1px solid #1e1e1e;">Status</td>
                <td style="font-size:14px;color:#4ade80;font-weight:700;text-align:right;border-top:1px solid #1e1e1e;">✓ Aktif</td>
              </tr>
              ${expiryDate !== '-' ? `<tr>
                <td style="font-size:14px;color:#8FA4C8;padding:6px 0;border-top:1px solid #1e1e1e;">Aktif hingga</td>
                <td style="font-size:14px;color:#ffffff;font-weight:600;text-align:right;border-top:1px solid #1e1e1e;">${expiryDate}</td>
              </tr>` : ''}
            </table>
          </td>
        </tr>
      </table>

      <!-- Features -->
      <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#1A1A1A;">🌟 Fitur yang kamu dapatkan:</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        ${featureList}
      </table>

      <!-- CTA -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <a href="${APP_URL}" style="display:inline-block;background-color:#FF6A00;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:16px 44px;border-radius:14px;letter-spacing:-0.2px;">
              Mulai Gunakan Premium →
            </a>
          </td>
        </tr>
      </table>
    `;

    const failedContent = `
      <!-- Status Icon -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
        <tr>
          <td align="center">
            <div style="display:inline-block;background-color:#FEF2F2;border-radius:50%;width:72px;height:72px;line-height:72px;text-align:center;font-size:32px;">❌</div>
          </td>
        </tr>
      </table>

      <p style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1A1A1A;text-align:center;line-height:1.2;">Pembayaran Gagal</p>
      <p style="margin:0 0 28px;font-size:15px;color:#64748B;text-align:center;line-height:1.6;">
        Hei <strong style="color:#1A1A1A;">${userName}</strong>, pembayaran kamu tidak berhasil diproses. Jangan khawatir, coba lagi kapan saja.
      </p>

      <!-- Detail Box -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FEF2F2;border:1.5px solid #FECACA;border-radius:14px;margin-bottom:24px;">
        <tr>
          <td style="padding:20px 24px;">
            <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#EF4444;text-transform:uppercase;letter-spacing:1px;">⚠️ Detail Transaksi</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:14px;color:#64748B;padding:4px 0;">Paket</td>
                <td style="font-size:14px;color:#1A1A1A;font-weight:600;text-align:right;">${planLabel}</td>
              </tr>
              <tr>
                <td style="font-size:14px;color:#64748B;padding:4px 0;">Jumlah</td>
                <td style="font-size:14px;color:#1A1A1A;font-weight:600;text-align:right;">${amount}</td>
              </tr>
              <tr>
                <td style="font-size:14px;color:#64748B;padding:4px 0;">Status</td>
                <td style="font-size:14px;color:#EF4444;font-weight:700;text-align:right;">✗ Gagal</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <p style="margin:0 0 24px;font-size:14px;color:#64748B;line-height:1.7;text-align:center;">
        Pastikan metode pembayaran kamu valid dan coba lagi. Jika masalah berlanjut, hubungi tim support kami.
      </p>

      <!-- CTA -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <a href="${SUBSCRIPTION_URL}" style="display:inline-block;background-color:#FF6A00;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:16px 44px;border-radius:14px;letter-spacing:-0.2px;">
              Coba Bayar Lagi →
            </a>
          </td>
        </tr>
      </table>
    `;

    const emailBody = emailLayout({
      previewText: isSuccess
        ? `Pembayaran berhasil! Akun Premium ${userName} sudah aktif.`
        : `Pembayaran gagal diproses. Coba lagi untuk mengaktifkan Premium.`,
      content: isSuccess ? successContent : failedContent,
    });

    await resend.emails.send({
      from: 'Atur Pintar by PT Rideff Vreka Tech <admin@aturpintar.id>',
      to: userEmail,
      subject: isSuccess
        ? `✅ Premium Aktif! Selamat, ${userName} — Atur Pintar`
        : `❌ Pembayaran Gagal — Atur Pintar`,
      html: emailBody,
    });

    return Response.json({ success: true, message: `Billing email sent to ${userEmail}` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});