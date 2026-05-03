import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current and previous month
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      .toISOString()
      .slice(0, 7);

    // Fetch all budgets from previous month
    const prevBudgets = await base44.entities.Budget.filter({
      created_by: user.email,
      month: prevMonth
    });

    let created = 0;
    let skipped = 0;

    // For each previous month budget, create for current month if not exists
    for (const budget of prevBudgets) {
      // Check if budget already exists for current month
      const existing = await base44.entities.Budget.filter({
        created_by: user.email,
        month: currentMonth,
        category: budget.category
      });

      if (existing.length === 0) {
        // Create new budget for current month
        await base44.entities.Budget.create({
          category: budget.category,
          amount: budget.amount,
          month: currentMonth,
          color: budget.color
        });
        created++;
      } else {
        skipped++;
      }
    }

    // Create notification for user
    await base44.asServiceRole.entities.AdminNotification.create({
      title: 'Budget Bulan Baru Siap',
      message: `Budget bulan ${currentMonth.split('-')[1]}/${currentMonth.split('-')[0]} telah dibuat. ${created} budget baru ditambahkan.`,
      target_type: 'specific',
      target_email: user.email,
      is_read: false
    });

    return Response.json({ 
      success: true, 
      created, 
      skipped,
      month: currentMonth 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});