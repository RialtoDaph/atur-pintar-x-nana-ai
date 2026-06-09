import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { Resend } from 'npm:resend@4.0.0';

const resend = new Resend(Deno.env.get('Resend_api_'));

const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a82e8090f60786b869983c/54148c256_85F10F30-6B5D-4EA2-865F-C1C5AC4C4170.PNG';
const APP_URL = 'https://aturpintar.id/login';

function emailLayout({ previewText, content }) {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Atur Pintar Beta</title>
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
                <tr>
                  <td class="header-pad" style="background-color:#0A0A0A;padding:36px 40px;text-align:center;">
                    <img src="${LOGO_URL}" alt="Atur Pintar" width="56" height="56" style="border-radius:16px;margin-bottom:16px;display:block;margin-left:auto;margin-right:auto;">
                    <p style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">Atur Pintar</p>
                    <p style="margin:4px 0 0;color:#8FA4C8;font-size:12px;letter-spacing:0.5px;text-transform:uppercase;">Beta Version</p>
                  </td>
                </tr>
                <tr>
                  <td class="body-pad" style="padding:40px 40px 32px;">
                    ${content}
                  </td>
                </tr>
                <tr>
                  <td class="footer-pad" style="background-color:#F8FAFC;padding:24px 40px;text-align:center;border-top:1px solid #E2E8F0;">
                    <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#1A1A1A;">Atur Pintar</p>
                    <p style="margin:0 0 4px;font-size:11px;color:#94A3B8;">Produk dari PT Rideff Vreka Tech</p>
                    <p style="margin:0;font-size:12px;color:#94A3B8;line-height:1.7;">Ada pertanyaan? Hubungi kami di <a href="mailto:nana.ai@aturpintar.id" style="color:#FF6A00;text-decoration:none;">nana.ai@aturpintar.id</a></p>
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

function buildContent(name) {
  return `
    <p style="font-size:22px;font-weight:700;color:#1A1A1A;margin:0 0 12px;">
      Halo ${name}! 🎉
    </p>

    <p style="font-size:14px;color:#64748B;margin:0 0 24px;line-height:1.6;">
      Atur Pintar <strong style="color:#1A1A1A;">Beta Version</strong> sudah launching dan <strong>akses kamu sudah aktif!</strong> Kamu jadi salah satu orang pertama yang bisa cobain semua fiturnya.
    </p>

    <p style="font-size:14px;font-weight:700;color:#1A1A1A;margin:0 0 12px;">
      Yang kamu dapat:
    </p>

    <ul style="margin:0 0 24px;padding-left:20px;color:#64748B;font-size:13px;line-height:1.9;">
      <li><strong style="color:#1A1A1A;">60 hari Premium gratis</strong></li>
      <li><strong style="color:#1A1A1A;">Early access</strong> ke semua fitur</li>
      <li><strong style="color:#1A1A1A;">Founding Member badge</strong> selamanya</li>
    </ul>

    <p style="font-size:13px;color:#64748B;margin:0 0 28px;line-height:1.6;">
      Yang paling penting buat kami: <strong style="color:#1A1A1A;">feedback kamu</strong>. Kalau ada bug, fitur yang kurang, atau ide — langsung cerita ke kami ya. Bantuan kamu yang bikin Atur Pintar makin baik. 🧡
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td align="center">
          <a href="${APP_URL}" style="display:inline-block;background-color:#FF6A00;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:16px 44px;border-radius:14px;letter-spacing:-0.2px;">
            Buka Atur Pintar →
          </a>
        </td>
      </tr>
    </table>

    <p style="font-size:12px;color:#94A3B8;text-align:center;margin:0;">
      Ada pertanyaan? Email ke <a href="mailto:nana.ai@aturpintar.id" style="color:#FF6A00;text-decoration:none;">nana.ai@aturpintar.id</a>
    </p>
  `;
}

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) return false;
  const lower = email.toLowerCase();
  const junkPatterns = ['ggg.ggg', 'test.test', 'aaa.aaa', 'example.com'];
  if (junkPatterns.some(p => lower.includes(p))) return false;
  return true;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const waitingList = await base44.asServiceRole.entities.WaitingList.filter({ invited: false });

    const results = { sent: 0, skipped: 0, failed: 0, errors: [] };
    const sentEmails = new Set();

    for (const entry of waitingList) {
      const email = entry.email?.trim().toLowerCase();
      const name = entry.name?.trim() || 'Teman';

      if (!isValidEmail(email)) {
        results.skipped++;
        continue;
      }
      if (sentEmails.has(email)) {
        results.skipped++;
        continue;
      }
      sentEmails.add(email);

      try {
        await resend.emails.send({
          from: 'Atur Pintar <admin@aturpintar.id>',
          to: email,
          subject: `${name}, akses Beta Atur Pintar kamu sudah aktif! 🎉`,
          html: emailLayout({
            previewText: `Halo ${name}! Akses Beta Atur Pintar kamu sudah aktif. 60 hari Premium gratis menanti.`,
            content: buildContent(name),
          }),
        });

        await base44.asServiceRole.entities.WaitingList.update(entry.id, {
          invited: true,
          invited_at: new Date().toISOString(),
        });

        results.sent++;
        // Resend free tier: ~2 req/sec
        await new Promise(r => setTimeout(r, 600));
      } catch (err) {
        results.failed++;
        results.errors.push({ email, error: err.message });
      }
    }

    return Response.json({
      success: true,
      total_in_waiting_list: waitingList.length,
      ...results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});