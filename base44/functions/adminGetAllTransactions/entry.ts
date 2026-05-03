import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    const transactions = await base44.asServiceRole.entities.Transaction.list('-date', 2000);

    // Audit log: catat akses semua transaksi
    await base44.asServiceRole.entities.SystemLog.create({
      log_type: 'sensitive_access',
      user_email: user.email,
      action: 'admin_view_all_transactions',
      entity_type: 'Transaction',
      target_email: 'ALL_USERS',
      ip_address: ip,
      severity: 'warning',
      details: `Admin ${user.email} mengakses ${transactions.length} transaksi dari semua user`
    }).catch(() => {});

    return Response.json({ transactions });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});