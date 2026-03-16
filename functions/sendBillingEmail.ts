import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    // Called from entity automation when SubscriptionPayment is created/updated
    const paymentData = payload?.data;
    const userEmail = paymentData?.user_email || paymentData?.created_by;

    if (!userEmail) {
      return Response.json({ error: 'No user email in payload' }, { status: 400 });
    }

    // Fetch user name
    let userName = 'Pengguna';
    try {
      const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
      if (users.length > 0) userName = users[0].full_name || 'Pengguna';
    } catch {}

    const planName = paymentData?.plan_name || 'Premium';
    const amount = paymentData?.amount ? `Rp ${Number(paymentData.amount).toLocaleString('id-ID')}` : '-';
    const status = paymentData?.status || 'active';
    const expiryDate = paymentData?.expires_at
      ? new Date(paymentData.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      : '-';

    const isSuccess = status === 'active' || status === 'paid';

    const emailBody = `
      <html>
      <body style="font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #F2F4F7;">
        <div style="max-width: 600px; margin: 40px auto; background: #F2F4F7; padding: 24px; border-radius: 16px;">
          
          <div style="text-align: center; margin-bottom: 8px;">
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a82e8090f60786b869983c/54148c256_85F10F30-6B5D-4EA2-865F-C1C5AC4C4170.PNG" alt="Atur Pintar" style="width: 48px; height: 48px; border-radius: 12px; margin-bottom: 8px;">
            <p style="color: #0A0A0A; font-size: 18px; font-weight: bold; margin: 0 0 16px 0;">Atur Pintar</p>
          </div>
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #0A0A0A; margin: 0; font-size: 24px;">${isSuccess ? '🎊 Pembayaran Berhasil!' : '⚠️ Pembayaran Gagal'}</h1>
            <p style="color: #8FA4C8; margin-top: 8px; font-size: 14px;">Atur Pintar Premium</p>
          </div>

          <div style="background: white; padding: 24px; border-radius: 12px; margin-bottom: 20px;">
            <p style="color: #4A5568; margin: 0 0 4px 0; font-size: 14px;">Halo, <strong>${userName}</strong></p>
            <p style="color: #4A5568; font-size: 14px;">${isSuccess
              ? 'Terima kasih! Akun Premium kamu sudah aktif. Nikmati semua fitur Atur Pintar tanpa batas.'
              : 'Pembayaran kamu tidak berhasil diproses. Silakan coba lagi atau hubungi support kami.'
            }</p>
          </div>

          <div style="background: ${isSuccess ? '#0A0A0A' : '#FFF5F5'}; padding: 24px; border-radius: 12px; margin-bottom: 20px;">
            <h3 style="color: ${isSuccess ? 'white' : '#FF6B6B'}; margin-top: 0;">Detail Langganan</h3>
            <table style="width: 100%; color: ${isSuccess ? '#8FA4C8' : '#4A5568'}; font-size: 14px;">
              <tr>
                <td style="padding: 6px 0;">Paket</td>
                <td style="text-align: right; color: ${isSuccess ? 'white' : '#0A0A0A'}; font-weight: bold;">${planName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0;">Jumlah</td>
                <td style="text-align: right; color: ${isSuccess ? 'white' : '#0A0A0A'}; font-weight: bold;">${amount}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0;">Status</td>
                <td style="text-align: right; color: ${isSuccess ? '#99ff80' : '#FF6B6B'}; font-weight: bold;">${isSuccess ? '✅ Aktif' : '❌ Gagal'}</td>
              </tr>
              ${isSuccess ? `<tr>
                <td style="padding: 6px 0;">Aktif hingga</td>
                <td style="text-align: right; color: white; font-weight: bold;">${expiryDate}</td>
              </tr>` : ''}
            </table>
          </div>

          ${isSuccess ? `
          <div style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <h4 style="color: #0A0A0A; margin-top: 0;">🌟 Fitur Premium yang kamu dapatkan:</h4>
            <ul style="color: #4A5568; font-size: 14px; line-height: 2;">
              <li>💬 Chat Nana AI tanpa batas</li>
              <li>📊 Analitik mendalam & laporan lengkap</li>
              <li>📤 Export data ke Google Sheets</li>
              <li>🔔 Notifikasi cerdas & budget alerts</li>
            </ul>
          </div>` : ''}

          <div style="text-align: center; padding-top: 16px; border-top: 1px solid #E2E8F0;">
            <a href="https://app.base44.com" style="background: #FF6A00; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block; font-size: 14px;">
              ${isSuccess ? 'Mulai Gunakan Premium →' : 'Coba Lagi →'}
            </a>
            <p style="color: #8FA4C8; font-size: 12px; margin-top: 16px;">Atur Pintar — Financial Tracker powered by Nana AI</p>
          </div>

        </div>
      </body>
      </html>
    `;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: userEmail,
      subject: isSuccess ? `🎊 Premium aktif! Selamat, ${userName}` : `⚠️ Pembayaran Premium gagal — Atur Pintar`,
      body: emailBody,
      from_name: 'Atur Pintar'
    });

    return Response.json({ success: true, message: `Billing email sent to ${userEmail}` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});