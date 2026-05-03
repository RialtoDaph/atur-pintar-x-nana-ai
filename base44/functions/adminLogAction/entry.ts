import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Require authentication — prevents anonymous log spam / impersonation
    const callerUser = await base44.auth.me();
    if (!callerUser) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { log_type, action, entity_type, entity_id, details, severity } = body;

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';

    // Force user identity from auth token — never trust client-supplied user_email/user_id
    await base44.asServiceRole.entities.SystemLog.create({
      log_type: log_type || 'activity',
      user_email: callerUser.email,
      user_id: callerUser.id,
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