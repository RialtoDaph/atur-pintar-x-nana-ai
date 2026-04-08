import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Get all active subscriptions for this user where next_due_date is today
    const subscriptions = await base44.entities.Subscription.filter({
      created_by: user.email,
      status: 'active'
    });

    let created = 0;
    for (const sub of subscriptions) {
      if (sub.next_due_date === today) {
        // Create transaction for this subscription
        await base44.entities.Transaction.create({
          amount: sub.amount,
          type: 'expense',
          category: 'subscriptions',
          note: sub.name || 'Subscription',
          date: today,
          is_recurring: false
        });
        created++;

        // Calculate next due date based on billing cycle
        const d = new Date(today);
        if (sub.billing_cycle === 'monthly') {
          d.setMonth(d.getMonth() + 1);
        } else if (sub.billing_cycle === 'quarterly') {
          d.setMonth(d.getMonth() + 3);
        } else if (sub.billing_cycle === 'yearly') {
          d.setFullYear(d.getFullYear() + 1);
        }
        const nextDue = d.toISOString().split('T')[0];
        
        // Update subscription next_due_date
        await base44.entities.Subscription.update(sub.id, { next_due_date: nextDue });
      }
    }

    return Response.json({ success: true, created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});