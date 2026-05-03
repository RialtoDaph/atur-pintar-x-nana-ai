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

    await base44.asServiceRole.entities.AppSettings.update(settings_id, {
      settings_unlocked: unlock === true,
    });

    return Response.json({ success: true, unlocked: unlock === true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});