import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch all users and all AppSettings using service role
    const [users, allSettings] = await Promise.all([
      base44.asServiceRole.entities.User.list(),
      base44.asServiceRole.entities.AppSettings.list(),
    ]);

    // Map settings to users by created_by email
    const settingsByEmail = {};
    for (const s of allSettings) {
      if (s.created_by) settingsByEmail[s.created_by] = s;
    }

    const result = users.map(u => ({
      id: u.id,
      full_name: u.full_name,
      email: u.email,
      role: u.role,
      created_date: u.created_date,
      settings: settingsByEmail[u.email] || null,
    }));

    // Audit log: admin listed all users (with settings)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
    await base44.asServiceRole.entities.SystemLog.create({
      log_type: 'sensitive_access',
      user_email: user.email,
      user_id: user.id,
      action: 'admin_list_users',
      ip_address: ip,
      severity: 'info',
      details: `Admin ${user.email} listed ${users.length} users with their AppSettings.`
    }).catch(() => {});

    return Response.json({ users: result });
  } catch (error) {
    console.error('adminGetUsers error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});