import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { Resend } from 'npm:resend@4.0.0';

const resend = new Resend(Deno.env.get('Resend_api_'));

const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a82e8090f60786b869983c/54148c256_85F10F30-6B5D-4EA2-865F-C1C5AC4C4170.PNG';
const APP_URL = 'https://app.aturpintar.id/Alerts';

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
                    <p style="margin:0;font-size:12px;color:#94A3B8;line-height:1.7;">Notifikasi ini dikirim karena kamu mengaktifkan alert keuangan. Pertanyaan? <a href="mailto:nana.ai@aturpintar.id" style="color:#FF6A00;text-decoration:none;">nana.ai@aturpintar.id</a></p>
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

    if (payload?.event?.type !== 'create') {
      return Response.json({ skipped: true });
    }

    const alertData = payload?.data;
    if (!alertData) return Response.json({ skipped: true, reason: 'no data' });
    if (alertData.email_sent) return Response.json({ skipped: true, reason: 'already sent' });
    if (alertData.severity === 'low') return Response.json({ skipped: true, reason: 'low severity' });

    const createdBy = alertData.created_by;
    if (!createdBy) return Response.json({ skipped: true, reason: 'no user' });

    const severity = alertData.severity || 'medium';
    const isHigh = severity === 'high';

    const severityConfig = {
      high: { icon: '🚨', color: '#EF4444', bgColor: '#FEF2F2', borderColor: '#FECACA', label: 'PENTING', badgeBg: '#EF4444' },
      medium: { icon: '⚠️', color: '#F59E0B', bgColor: '#FFFBEB', borderColor: '#FDE68A', label: 'PERHATIAN', badgeBg: '#F59E0B' },
    };
    const sc = severityConfig[severity] || severityConfig.medium;

    const typeLabels = {
      spending_spike: 'Lonjakan Pengeluaran',
      bill_upcoming: 'Tagihan Mendekat',
      goal_near: 'Target Hampir Tercapai',
      savings_opportunity: 'Peluang Menabung',
      unusual_pattern: 'Pola Tidak Biasa',
      budget_exceeded: 'Anggaran Terlampaui',
    };
    const typeLabel = typeLabels[alertData.type] || 'Notifikasi Keuangan';

    const content = `
      <!-- Severity Badge -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
        <tr>
          <td align="center">
            <span style="display:inline-block;background-color:${sc.badgeBg};color:#ffffff;font-size:11px;font-weight:700;padding:5px 14px;border-radius:20px;text-transform:uppercase;letter-spacing:1px;">${sc.icon} ${sc.label}</span>
          </td>
        </tr>
      </table>

      <!-- Title -->
      <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1A1A1A;text-align:center;line-height:1.3;">${alertData.title}</p>
      <p style="margin:0 0 28px;font-size:13px;color:#64748B;text-align:center;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">${typeLabel}</p>

      <!-- Alert Message Box -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${sc.bgColor};border:1.5px solid ${sc.borderColor};border-radius:14px;margin-bottom:28px;">
        <tr>
          <td style="padding:20px 24px;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:${sc.color};text-transform:uppercase;letter-spacing:0.8px;">📌 Pesan Alert</p>
            <p style="margin:0;font-size:14px;color:#1A1A1A;line-height:1.7;">${alertData.message}</p>
          </td>
        </tr>
      </table>

      <!-- Tips based on type -->
      ${alertData.type === 'budget_exceeded' || alertData.type === 'spending_spike' ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8FAFC;border-radius:14px;margin-bottom:28px;">
        <tr>
          <td style="padding:20px 24px;">
            <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#1A1A1A;">💡 Tips dari Nana AI:</p>
            <p style="margin:0;font-size:13px;color:#64748B;line-height:1.7;">Tinjau pengeluaran kamu dan cari kategori yang bisa dikurangi. Cek halaman Analitik untuk melihat detail pola belanjamu.</p>
          </td>
        </tr>
      </table>` : ''}

      <!-- CTA -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <a href="${APP_URL}" style="display:inline-block;background-color:#FF6A00;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:16px 44px;border-radius:14px;letter-spacing:-0.2px;">
              Lihat Detail Alert →
            </a>
          </td>
        </tr>
      </table>
      <p style="margin:16px 0 0;font-size:12px;color:#94A3B8;text-align:center;">Buka aplikasi untuk mengambil tindakan yang diperlukan.</p>
    `;

    const emailBody = emailLayout({
      // Guard: message can be empty/undefined → avoid throw on .slice
      previewText: `${sc.icon} ${alertData.title} — ${(alertData.message || '').slice(0, 80)}...`,
      content,
    });

    await resend.emails.send({
      from: 'Nana AI <nana.ai@aturpintar.id>',
      to: createdBy,
      subject: `${sc.icon} ${alertData.title} — Atur Pintar`,
      html: emailBody,
    });

    await base44.asServiceRole.entities.Alert.update(alertData.id, { email_sent: true });

    return Response.json({ success: true, sent_to: createdBy });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});