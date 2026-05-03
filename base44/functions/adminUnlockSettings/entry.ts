import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { settings_id, unlock } = await req.json();

    if (!settings_id) {
      return Response.json({ error: 'settings_id is required' }, { status: 400 });
    }

    // Capture target user before mutating
    let targetEmail = null;
    try {
      const existing = await base44.asServiceRole.entities.AppSettings.filter({ id: settings_id });
      if (existing?.[0]?.created_by) targetEmail = existing[0].created_by;
    } catch (_) {}

    await base44.asServiceRole.entities.AppSettings.update(settings_id, {
      settings_unlocked: unlock === true,
    });

    // Audit log
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
    base44.asServiceRole.entities.SystemLog.create({
      log_type: 'sensitive_access',
      user_email: user.email,
      user_id: user.id,
      action: unlock === true ? 'admin_unlock_settings' : 'admin_lock_settings',
      entity_type: 'AppSettings',
      entity_id: settings_id,
      target_email: targetEmail,
      ip_address: ip,
      severity: 'warning',
      details: `Admin ${user.email} ${unlock === true ? 'unlocked' : 'locked'} settings for ${targetEmail || 'unknown user'}`,
    }).catch(() => {});

    return Response.json({ success: true, unlocked: unlock === true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});