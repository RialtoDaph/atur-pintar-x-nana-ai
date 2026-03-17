import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

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

    const amount = plan === 'premium_monthly' ? 39000 : 299000;
    const orderId = `AP-${user.id.slice(0, 8)}-${Date.now()}`;

    const serverKey = Deno.env.get("MIDTRANS_SERVER_KEY");
    const auth = btoa(`${serverKey}:`);

    const body = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      customer_details: {
        first_name: user.full_name || user.email,
        email: user.email,
      },
      item_details: [
        {
          id: plan,
          price: amount,
          quantity: 1,
          name: plan === 'premium_monthly' ? 'Atur Pintar Premium Bulanan' : 'Atur Pintar Premium Tahunan',
        }
      ],
    };

    const midtransRes = await fetch('https://app.midtrans.com/snap/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify(body),
    });

    const snapData = await midtransRes.json();

    if (!snapData.token) {
      return Response.json({ error: 'Failed to get Snap token', detail: snapData }, { status: 500 });
    }

    // Simpan record pembayaran
    await base44.entities.SubscriptionPayment.create({
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