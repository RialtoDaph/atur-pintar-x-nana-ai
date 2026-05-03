import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduled invocation (no user) OR admin user. Reject regular users.
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // 1. Auto-expire pending payments (>7 days)
    const pendingPayments = await base44.asServiceRole.entities.SubscriptionPayment.filter({ status: 'pending' });
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    for (const payment of pendingPayments) {
      if (new Date(payment.created_date) < sevenDaysAgo) {
        await base44.asServiceRole.entities.SubscriptionPayment.update(payment.id, { status: 'expired' });

        // Notify user
        try {
          await base44.asServiceRole.entities.AdminNotification.create({
            title: '⏰ Pembayaran Kadaluarsa',
            message: 'Pembayaran premium kamu telah kadaluarsa. Silakan ajukan pembayaran baru.',
            target_type: 'specific',
            target_email: payment.created_by,
            is_read: false,
            read_by: []
          });
        } catch (e) {
          console.error('adminSubscriptionManager: failed to notify expired payment:', e);
        }
      }
    }

    // 2. Auto-expire subscriptions that have passed end_date
    const allUsers = await base44.asServiceRole.entities.User.list();
    for (const user of allUsers) {
      if (user.subscription_end_date && new Date(user.subscription_end_date) < today) {
        if (user.subscription_status === 'active') {
          await base44.asServiceRole.entities.User.update(user.id, {
            subscription_status: 'expired',
            subscription_plan: 'free'
          });
        }
      }

      // 3. Send 3-day expiry reminder
      if (user.subscription_end_date) {
        const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
        const endDate = new Date(user.subscription_end_date);
        const daysDiff = Math.floor((endDate - today) / (24 * 60 * 60 * 1000));

        if (daysDiff === 3 && user.subscription_status === 'active') {
          try {
            await base44.asServiceRole.entities.AdminNotification.create({
              title: '⏰ Langganan Berakhir Dalam 3 Hari',
              message: 'Langganan premium kamu akan berakhir dalam 3 hari. Perpanjang sekarang untuk akses tanpa gangguan!',
              target_type: 'specific',
              target_email: user.email,
              is_read: false,
              read_by: []
            });
          } catch (e) {
            console.error('adminSubscriptionManager: failed to send 3-day reminder:', e);
          }
        }
      }
    }

    // Log activity
    try {
      await base44.asServiceRole.entities.SystemLog.create({
        log_type: 'activity',
        action: 'subscription_auto_check',
        severity: 'info',
        details: 'Daily subscription auto-expire & reminder check'
      });
    } catch (e) {
      console.error('adminSubscriptionManager: failed to write activity log:', e);
    }

    return Response.json({ success: true, message: 'Subscription check completed' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});