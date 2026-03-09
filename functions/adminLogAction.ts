import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // This can be called without admin check since it logs all types
    let callerUser = null;
    try { callerUser = await base44.auth.me(); } catch (_) { /* anonymous ok for error logs */ }

    const body = await req.json();
    const { log_type, action, entity_type, entity_id, details, severity, user_email, user_id } = body;

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    await base44.asServiceRole.entities.SystemLog.create({
      log_type: log_type || 'activity',
      user_email: user_email || callerUser?.email || 'anonymous',
      user_id: user_id || callerUser?.id || null,
      action: action || 'unknown',
      entity_type: entity_type || null,
      entity_id: entity_id || null,
      ip_address: ip,
      details: details || null,
      severity: severity || 'info',
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});