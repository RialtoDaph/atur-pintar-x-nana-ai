import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan } = await req.json();

    if (!plan || !['premium_monthly', 'premium_yearly'].includes(plan)) {
      return Response.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Read price from AppConfig (admin-controlled)
    let monthlyPrice = 49000;
    let yearlyPrice = 490000;
    try {
      const configs = await base44.asServiceRole.entities.AppConfig.list();
      if (configs && configs.length > 0) {
        monthlyPrice = configs[0].premium_price_monthly || 49000;
        yearlyPrice = configs[0].premium_price_yearly || 490000;
      }
    } catch (e) {
      console.warn('Could not read AppConfig, using defaults');
    }

    const amount = plan === 'premium_monthly' ? monthlyPrice : yearlyPrice;

    // Cek apakah ada pending payment yang masih valid (< 24 jam)
    const existingPending = await base44.asServiceRole.entities.SubscriptionPayment.filter({
      user_email: user.email,
      status: 'pending',
    });

    if (existingPending.length > 0 && existingPending[0].midtrans_snap_token) {
      const existing = existingPending[0];
      const ageHours = (Date.now() - new Date(existing.created_date).getTime()) / (1000 * 60 * 60);
      if (ageHours < 24 && existing.plan === plan) {
        return Response.json({ token: existing.midtrans_snap_token, order_id: existing.midtrans_order_id });
      }
      await base44.asServiceRole.entities.SubscriptionPayment.update(existing.id, { status: 'expired' });
    }

    const orderId = `AP-${user.id.slice(0, 8)}-${Date.now()}`;
    const serverKey = Deno.env.get("MIDTRANS_SERVER_KEY");
    const auth = btoa(`${serverKey}:`);

    const body = {
      transaction_details: { order_id: orderId, gross_amount: amount },
      customer_details: {
        first_name: user.full_name || user.email,
        email: user.email,
      },
      item_details: [{
        id: plan,
        price: amount,
        quantity: 1,
        name: plan === 'premium_monthly' ? 'Atur Pintar Premium Bulanan' : 'Atur Pintar Premium Tahunan',
      }],
    };

    const midtransRes = await fetch('https://app.midtrans.com/snap/v1/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${auth}` },
      body: JSON.stringify(body),
    });

    const snapData = await midtransRes.json();

    if (!snapData.token) {
      return Response.json({ error: 'Failed to get Snap token', detail: snapData }, { status: 500 });
    }

    await base44.asServiceRole.entities.SubscriptionPayment.create({
      user_email: user.email,
      user_name: user.full_name,
      plan: plan,
      amount: amount,
      status: 'pending',
      midtrans_order_id: orderId,
      midtrans_snap_token: snapData.token,
    });

    return Response.json({ token: snapData.token, order_id: orderId });

  } catch (error) {
    console.error("Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});