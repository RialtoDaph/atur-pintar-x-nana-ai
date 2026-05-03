import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ALLOWED_ENTITIES = ['Transaction', 'SavingsGoal', 'Budget', 'Debt', 'Reminder'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { operation, entity, id, data } = await req.json();

    if (!ALLOWED_ENTITIES.includes(entity)) {
      return Response.json({ error: 'Entity not allowed' }, { status: 400 });
    }

    const repo = base44.asServiceRole.entities[entity];
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    let result = null;
    let targetEmail = null;

    if (operation === 'update') {
      // Capture target user email before mutating
      try {
        const existing = await repo.filter({ id }).catch(() => null);
        if (existing?.[0]?.created_by) targetEmail = existing[0].created_by;
      } catch (_) {}
      result = await repo.update(id, data);
    } else if (operation === 'delete') {
      try {
        const existing = await repo.filter({ id }).catch(() => null);
        if (existing?.[0]?.created_by) targetEmail = existing[0].created_by;
      } catch (_) {}
      await repo.delete(id);
      result = { id };
    } else if (operation === 'create') {
      result = await repo.create(data);
      targetEmail = data?.created_by || null;
    } else {
      return Response.json({ error: 'Invalid operation' }, { status: 400 });
    }

    // Audit log — fire and forget
    base44.asServiceRole.entities.SystemLog.create({
      log_type: 'sensitive_access',
      user_email: user.email,
      user_id: user.id,
      action: `admin_${operation}_${entity}`,
      entity_type: entity,
      entity_id: id || result?.id || null,
      target_email: targetEmail,
      ip_address: ip,
      severity: operation === 'delete' ? 'warning' : 'info',
      details: `Admin ${user.email} performed ${operation} on ${entity}${id ? ` (id: ${id})` : ''}${targetEmail ? ` belonging to ${targetEmail}` : ''}`,
    }).catch(() => {});

    return Response.json({ success: true, result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});