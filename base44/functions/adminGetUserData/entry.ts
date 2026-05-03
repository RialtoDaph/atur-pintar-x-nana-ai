import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { user_email } = await req.json();
    if (!user_email) return Response.json({ error: 'user_email required' }, { status: 400 });

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    const [transactions, goals, budgets, debts, reminders, customCategories] = await Promise.all([
      base44.asServiceRole.entities.Transaction.filter({ created_by: user_email }, '-date', 200),
      base44.asServiceRole.entities.SavingsGoal.filter({ created_by: user_email }),
      base44.asServiceRole.entities.Budget.filter({ created_by: user_email }),
      base44.asServiceRole.entities.Debt.filter({ created_by: user_email }),
      base44.asServiceRole.entities.Reminder.filter({ created_by: user_email }),
      base44.asServiceRole.entities.CustomCategory.filter({ created_by: user_email }),
    ]);

    // Audit log: catat akses data sensitif user
    await base44.asServiceRole.entities.SystemLog.create({
      log_type: 'sensitive_access',
      user_email: user.email,
      action: 'admin_view_user_data',
      entity_type: 'Transaction,SavingsGoal,Budget,Debt',
      target_email: user_email,
      ip_address: ip,
      severity: 'warning',
      details: `Admin ${user.email} mengakses data sensitif user ${user_email}: ${transactions.length} transaksi, ${goals.length} goals, ${debts.length} utang`
    }).catch(() => {});

    return Response.json({ transactions, goals, budgets, debts, reminders, customCategories });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});