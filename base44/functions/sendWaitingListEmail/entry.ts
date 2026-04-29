import { Resend } from 'npm:resend@4.0.0';

const resend = new Resend(Deno.env.get('Resend_api_'));

Deno.serve(async (req) => {
  try {
    const { name, email, queueNumber } = await req.json();

    if (!name || !email) {
      return Response.json({ error: 'Missing name or email' }, { status: 400 });
    }

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Inter', Arial, sans-serif; background: #0A0A0A; color: #fff; margin: 0; padding: 0; }
    .container { max-width: 520px; margin: 40px auto; background: #111; border-radius: 20px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); }
    .header { background: linear-gradient(135deg, #FF6A00, #FFB347); padding: 36px 32px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 900; color: #fff; }
    .header p { margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 14px; }
    .body { padding: 32px; }
    .queue { background: rgba(255,106,0,0.12); border: 1px solid rgba(255,106,0,0.3); border-radius: 14px; padding: 20px; text-align: center; margin-bottom: 24px; }
    .queue .num { font-size: 48px; font-weight: 900; color: #FF6A00; line-height: 1; }
    .queue .label { color: rgba(255,255,255,0.5); font-size: 12px; margin-top: 4px; }
    .benefits { margin-bottom: 24px; }
    .benefit { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
    .benefit .icon { font-size: 18px; }
    .benefit p { margin: 0; color: rgba(255,255,255,0.75); font-size: 14px; }
    .cta { text-align: center; margin: 28px 0; }
    .cta a { display: inline-block; background: #FF6A00; color: #fff; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 14px; }
    .note { color: rgba(255,255,255,0.35); font-size: 12px; line-height: 1.6; margin-top: 24px; }
    .footer { border-top: 1px solid rgba(255,255,255,0.06); padding: 20px 32px; text-align: center; color: rgba(255,255,255,0.2); font-size: 11px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Kamu masuk!</h1>
      <p>Selamat datang di waiting list Atur Pintar, ${name}.</p>
    </div>
    <div class="body">
      <div class="queue">
        <div class="num">#${queueNumber}</div>
        <div class="label">nomor antrian kamu</div>
      </div>

      <p style="color:rgba(255,255,255,0.7); font-size:14px; margin-bottom:20px; line-height:1.6;">
        Halo <strong style="color:#fff">${name}</strong>,<br><br>
        Kamu resmi masuk waiting list Atur Pintar sebagai <strong style="color:#FF6A00">#${queueNumber}</strong>. Makin cepat daftar, makin cepat dapat akses — dan kamu sudah selangkah lebih maju dari banyak orang!
      </p>

      <div class="benefits">
        <div class="benefit"><span class="icon">⚡</span><p><strong>Early access</strong> sebelum dibuka ke publik</p></div>
        <div class="benefit"><span class="icon">🏅</span><p>Badge <strong>"Founding Member"</strong> permanen di profilmu</p></div>
        <div class="benefit"><span class="icon">🎁</span><p><strong>30 hari Premium gratis</strong> saat akses dibuka</p></div>
      </div>

      <div class="cta">
        <a href="https://aturpintar.id/LandingPage#nana-demo">Cobain Demo Nana</a>
      </div>

      <p class="note">
        Akses dikirim berurutan sesuai nomor antrian. Semakin awal daftar, semakin cepat dapat. Kami akan kabarin kamu via email ini segera setelah giliran kamu tiba.
      </p>
    </div>
    <div class="footer">
      Salam, Tim Atur Pintar 🧡<br>
      <a href="mailto:support@aturpintar.id" style="color:rgba(255,255,255,0.3); text-decoration:none;">support@aturpintar.id</a>
    </div>
  </div>
</body>
</html>
    `;

    await resend.emails.send({
      from: 'Atur Pintar <admin@aturpintar.id>',
      to: email,
      subject: `Kamu masuk antrian, ${name}! 🎉`,
      html: htmlBody,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});