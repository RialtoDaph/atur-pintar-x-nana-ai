import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const today = new Date().toISOString().split('T')[0];
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const threeDaysStr = threeDaysFromNow.toISOString().split('T')[0];
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const sevenDaysStr = sevenDaysFromNow.toISOString().split('T')[0];

    // Get all premium users (exclude admins)
    const allUsers = await base44.asServiceRole.entities.User.list();
    const premiumUsers = allUsers.filter(u => 
      u.subscription_plan && u.subscription_plan !== 'free' && u.subscription_end_date && u.role !== 'admin'
    );

    let expired = 0, expiring3d = 0, expiring7d = 0;

    for (const user of premiumUsers) {
      const endDate = user.subscription_end_date;

      // Expired: downgrade and notify
      if (endDate < today) {
        await base44.asServiceRole.entities.User.update(user.id, {
          subscription_plan: 'free',
          subscription_status: 'expired'
        });
        await base44.asServiceRole.entities.AdminNotification.create({
          title: '❌ Langganan Berakhir',
          message: 'Langganan premium kamu sudah berakhir. Perpanjang untuk tetap menikmati fitur premium!',
          target_type: 'specific',
          target_email: user.email,
          is_read: false,
          read_by: []
        });
        expired++;
      }
      // Expiring in 3 days
      else if (endDate === threeDaysStr) {
        await base44.asServiceRole.entities.AdminNotification.create({
          title: '⏰ Langganan Berakhir dalam 3 Hari',
          message: 'Langganan premium kamu berakhir dalam 3 hari. Perpanjang sekarang untuk menghindari kehilangan akses!',
          target_type: 'specific',
          target_email: user.email,
          is_read: false,
          read_by: []
        });
        expiring3d++;
      }
      // Expiring in 7 days
      else if (endDate === sevenDaysStr) {
        await base44.asServiceRole.entities.AdminNotification.create({
          title: '⏰ Langganan Berakhir dalam 7 Hari',
          message: 'Langganan premium kamu berakhir dalam 7 hari. Pertimbangkan untuk perpanjang sekarang!',
          target_type: 'specific',
          target_email: user.email,
          is_read: false,
          read_by: []
        });
        expiring7d++;
      }
    }

    return Response.json({ expired, expiring3d, expiring7d });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});