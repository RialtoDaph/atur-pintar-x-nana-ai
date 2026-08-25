import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

// Buat Xendit Invoice untuk upgrade premium (bulanan atau tahunan).
// Frontend memanggil: base44.functions.invoke('createXenditInvoice', { plan: 'premium_monthly' | 'premium_yearly' })
// Response: { invoice_url, external_id, invoice_id, amount, plan }
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const plan = body?.plan;
    if (!['premium_monthly', 'premium_yearly'].includes(plan)) {
      return Response.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Ambil harga dari AppConfig (source of truth)
    const configs = await base44.asServiceRole.entities.AppConfig.list();
    const cfg = configs?.[0] || {};
    const amount = plan === 'premium_monthly'
      ? (cfg.premium_price_monthly || 18000)
      : (cfg.premium_price_yearly || 189000);
    const originalAmount = plan === 'premium_monthly'
      ? (cfg.premium_price_monthly_original || 49000)
      : (cfg.premium_price_yearly_original || 399900);

    // External ID unik — cegah tabrakan / retry
    const externalId = `aturpintar-${user.id}-${Date.now()}`;

    // Success/failure redirect URLs (kembali ke halaman Subscription setelah bayar)
    const origin = req.headers.get('origin') || 'https://app-atur-pintar.base44.app';
    const successUrl = `${origin}/Subscription?status=success`;
    const failureUrl = `${origin}/Subscription?status=failure`;

    // Panggil Xendit Invoice API
    const xenditSecret = secrets.get('XENDIT_SECRET_KEY');
    const auth = 'Basic ' + btoa(xenditSecret + ':');

    const description = plan === 'premium_monthly'
      ? 'Atur Pintar Premium — Bulanan'
      : 'Atur Pintar Premium — Tahunan';

    const xenditRes = await fetch('https://api.xendit.co/v2/invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth,
      },
      body: JSON.stringify({
        external_id: externalId,
        amount,
        payer_email: user.email,
        description,
        success_redirect_url: successUrl,
        failure_redirect_url: failureUrl,
        invoice_duration: 86400, // 24 jam
        currency: 'IDR',
        items: [
          {
            name: description,
            quantity: 1,
            price: amount,
            category: 'Subscription',
          },
        ],
      }),
    });

    const xenditData = await xenditRes.json();
    if (!xenditRes.ok) {
      return Response.json(
        { error: 'Xendit error', details: xenditData },
        { status: 502 }
      );
    }

    // Simpan record SubscriptionPayment (status: pending)
    // Pakai asServiceRole karena kita perlu set field `created_by` supaya webhook nanti bisa find
    await base44.asServiceRole.entities.SubscriptionPayment.create({
      user_email: user.email,
      user_name: user.full_name || user.email,
      plan,
      amount,
      status: 'pending',
      provider: 'xendit',
      xendit_external_id: externalId,
      xendit_invoice_id: xenditData.id,
      xendit_invoice_url: xenditData.invoice_url,
      description: `Original: Rp ${originalAmount.toLocaleString('id-ID')}`,
    });

    return Response.json({
      invoice_url: xenditData.invoice_url,
      external_id: externalId,
      invoice_id: xenditData.id,
      amount,
      plan,
    });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}