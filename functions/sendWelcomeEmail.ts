import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    // Called from entity automation: payload.data contains user data
    const userData = payload?.data;
    const userEmail = userData?.email;
    const userName = userData?.full_name || 'Pengguna';

    if (!userEmail) {
      return Response.json({ error: 'No email found in payload' }, { status: 400 });
    }

    const emailBody = `
      <html>
      <body style="font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #F2F4F7;">
        <div style="max-width: 600px; margin: 40px auto; background: #F2F4F7; padding: 24px; border-radius: 16px;">
          
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #0A0A0A; margin: 0; font-size: 28px;">Selamat Datang di Atur Pintar! 🎉</h1>
            <p style="color: #8FA4C8; margin-top: 8px; font-size: 14px;">Kelola keuanganmu lebih cerdas bersama Nana AI</p>
          </div>

          <div style="background: #0A0A0A; padding: 24px; border-radius: 12px; margin-bottom: 20px; text-align: center;">
            <p style="color: #8FA4C8; margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Halo,</p>
            <p style="color: white; font-size: 24px; font-weight: bold; margin: 0;">${userName} 👋</p>
          </div>

          <div style="background: white; padding: 24px; border-radius: 12px; margin-bottom: 20px;">
            <h3 style="color: #0A0A0A; margin-top: 0;">Apa yang bisa kamu lakukan sekarang?</h3>
            <ul style="color: #4A5568; font-size: 14px; line-height: 2;">
              <li>📊 <strong>Catat transaksi</strong> — income, expense, dan tabungan</li>
              <li>🎯 <strong>Buat target tabungan</strong> — pantau progresmu setiap hari</li>
              <li>💡 <strong>Tanya Nana AI</strong> — asisten keuangan pribadimu</li>
              <li>📈 <strong>Lihat analitik</strong> — pahami pola pengeluaranmu</li>
              <li>🔔 <strong>Atur pengingat tagihan</strong> — jangan sampai terlewat</li>
            </ul>
          </div>

          <div style="background: #FF6A00; padding: 20px; border-radius: 12px; margin-bottom: 20px; text-align: center;">
            <p style="color: white; margin: 0 0 12px 0; font-size: 14px;">Mulai perjalanan keuangan pintarmu sekarang!</p>
            <a href="https://app.base44.com" style="background: white; color: #FF6A00; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block; font-size: 14px;">
              Buka Aplikasi →
            </a>
          </div>

          <div style="text-align: center; padding-top: 16px; border-top: 1px solid #E2E8F0;">
            <p style="color: #8FA4C8; font-size: 12px; margin: 0;">Atur Pintar — Financial Tracker powered by Nana AI</p>
          </div>

        </div>
      </body>
      </html>
    `;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: userEmail,
      subject: `Selamat datang di Atur Pintar, ${userName}! 🎉`,
      body: emailBody,
      from_name: 'Atur Pintar'
    });

    return Response.json({ success: true, message: `Welcome email sent to ${userEmail}` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});