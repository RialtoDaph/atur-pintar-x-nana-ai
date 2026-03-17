import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a82e8090f60786b869983c/54148c256_85F10F30-6B5D-4EA2-865F-C1C5AC4C4170.PNG';
const APP_URL = 'https://app.aturpintar.id/Dashboard';

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
                  <td class="header-pad" style="background-color:#0A0A0A;padding:36px 40px;text-align:center;">
                    <img src="${LOGO_URL}" alt="Atur Pintar" width="56" height="56" style="border-radius:16px;margin-bottom:16px;display:block;margin-left:auto;margin-right:auto;">
                    <p style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">Atur Pintar</p>
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
                    <p style="margin:0;font-size:12px;color:#94A3B8;line-height:1.7;">Ada pertanyaan? Hubungi kami di <a href="mailto:support@aturpintar.id" style="color:#FF6A00;text-decoration:none;">support@aturpintar.id</a></p>
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

    const entityData = payload?.data;
    const userEmail = entityData?.created_by;
    const userName = entityData?.full_name || 'Pengguna';

    if (!userEmail) {
      return Response.json({ error: 'No email found in payload' }, { status: 400 });
    }

    const features = [
      { icon: '📊', title: 'Catat Transaksi', desc: 'Income, expense & tabungan dalam satu tempat' },
      { icon: '🎯', title: 'Target Tabungan', desc: 'Buat goal dan pantau progresmu setiap hari' },
      { icon: '💡', title: 'Nana AI', desc: 'Asisten keuangan cerdas siap membantu 24/7' },
      { icon: '📈', title: 'Analitik Mendalam', desc: 'Pahami pola pengeluaran & tren keuanganmu' },
      { icon: '🔔', title: 'Pengingat Tagihan', desc: 'Jangan sampai ada tagihan yang terlewat' },
    ];

    const featureRows = features.map(f => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #F2F4F7;vertical-align:top;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:40px;vertical-align:middle;">
                <div style="width:36px;height:36px;background-color:#FFF3E0;border-radius:10px;text-align:center;line-height:36px;font-size:18px;">${f.icon}</div>
              </td>
              <td style="padding-left:12px;vertical-align:middle;">
                <p style="margin:0;font-size:14px;font-weight:600;color:#1A1A1A;">${f.title}</p>
                <p style="margin:2px 0 0;font-size:13px;color:#64748B;">${f.desc}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `).join('');

    const content = `
      <!-- Welcome Title -->
      <p style="margin:0 0 6px;font-size:26px;font-weight:700;color:#1A1A1A;text-align:center;line-height:1.2;">Selamat Datang! 🎉</p>
      <p style="margin:0 0 28px;font-size:15px;color:#64748B;text-align:center;line-height:1.6;">
        Hei <strong style="color:#1A1A1A;">${userName}</strong>, akunmu sudah siap. Yuk mulai kelola keuanganmu lebih cerdas bersama Nana AI.
      </p>

      <!-- Hero Box -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#0A0A0A 0%,#1a1a2e 100%);border-radius:16px;margin-bottom:28px;overflow:hidden;">
        <tr>
          <td style="padding:28px 28px;">
            <p style="margin:0 0 4px;font-size:12px;color:#8FA4C8;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Mulai Sekarang</p>
            <p style="margin:0 0 16px;font-size:20px;font-weight:700;color:#ffffff;line-height:1.3;">Wujudkan kebebasan finansialmu</p>
            <p style="margin:0;font-size:13px;color:#8FA4C8;line-height:1.6;">Bergabunglah bersama ribuan pengguna yang sudah mengelola keuangan mereka lebih cerdas dengan Atur Pintar.</p>
          </td>
        </tr>
      </table>

      <!-- Features -->
      <p style="margin:0 0 16px;font-size:14px;font-weight:700;color:#1A1A1A;">Yang bisa kamu lakukan:</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        ${featureRows}
      </table>

      <!-- CTA -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <a href="${APP_URL}" style="display:inline-block;background-color:#FF6A00;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:16px 44px;border-radius:14px;letter-spacing:-0.2px;">
              Buka Atur Pintar →
            </a>
          </td>
        </tr>
      </table>
      <p style="margin:16px 0 0;font-size:12px;color:#94A3B8;text-align:center;">Selamat bergabung dan semangat mengelola keuanganmu! 💪</p>
    `;

    const emailBody = emailLayout({
      previewText: `Hei ${userName}! Akunmu di Atur Pintar sudah aktif. Mulai kelola keuanganmu sekarang.`,
      content,
    });

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: userEmail,
      subject: `Selamat Datang di Atur Pintar, ${userName}! 🎉`,
      body: emailBody,
      from_name: 'Atur Pintar',
    });

    return Response.json({ success: true, message: `Welcome email sent to ${userEmail}` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});