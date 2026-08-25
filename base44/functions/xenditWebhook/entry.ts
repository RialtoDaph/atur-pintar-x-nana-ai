import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

// Webhook dari Xendit — dipanggil saat invoice PAID / EXPIRED.
// URL: https://app-atur-pintar.base44.app/functions/xenditWebhook
// Header verifikasi: x-callback-token = XENDIT_WEBHOOK_TOKEN
export default async function (req: Request): Promise<Response> {
  try {
    // 1) Validasi token Xendit
    const callbackToken = req.headers.get('x-callback-token');
    const expectedToken = secrets.get('XENDIT_WEBHOOK_TOKEN');
    if (!callbackToken || callbackToken !== expectedToken) {
      return Response.json({ error: 'Invalid callback token' }, { status: 401 });
    }

    // 2) Parse payload
    const payload = await req.json();
    const externalId = payload?.external_id;
    const status = payload?.status; // PAID | EXPIRED | PENDING
    const paidAmount = payload?.paid_amount ?? payload?.amount;

    if (!externalId) {
      return Response.json({ error: 'Missing external_id' }, { status: 400 });
    }

    // Service role — webhook tidak login sebagai user
    const base44 = createClientFromRequest(req);

    // 3) Cari SubscriptionPayment yang cocok
    const payments = await base44.asServiceRole.entities.SubscriptionPayment.filter({
      xendit_external_id: externalId,
    });
    const payment = payments?.[0];
    if (!payment) {
      return Response.json({ error: 'Payment record not found' }, { status: 404 });
    }

    // Idempotent — kalau sudah approved, skip
    if (payment.status === 'approved' && status === 'PAID') {
      return Response.json({ ok: true, note: 'already approved' });
    }

    // 4) Update status berdasarkan callback Xendit
    if (status === 'PAID') {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      // Hitung expiry berdasarkan plan
      const expiryDate = new Date(today);
      if (payment.plan === 'premium_monthly') {
        expiryDate.setMonth(expiryDate.getMonth() + 1);
      } else if (payment.plan === 'premium_yearly') {
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      }
      const expiryStr = expiryDate.toISOString().split('T')[0];

      // Update payment record
      await base44.asServiceRole.entities.SubscriptionPayment.update(payment.id, {
        status: 'approved',
        approved_at: todayStr,
        expires_at: expiryStr,
      });

      // Update user subscription — cari user by email
      const users = await base44.asServiceRole.entities.User.filter({ email: payment.user_email });
      const user = users?.[0];
      if (user) {
        await base44.asServiceRole.entities.User.update(user.id, {
          subscription_status: 'active',
          subscription_plan: payment.plan,
          subscription_start_date: todayStr,
          subscription_end_date: expiryStr,
        });
      }
    } else if (status === 'EXPIRED') {
      await base44.asServiceRole.entities.SubscriptionPayment.update(payment.id, {
        status: 'expired',
      });
    }

    return Response.json({ ok: true, status, external_id: externalId });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}