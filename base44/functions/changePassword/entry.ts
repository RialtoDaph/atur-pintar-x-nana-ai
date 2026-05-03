import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { newPassword } = await req.json();
    if (!newPassword || newPassword.length < 8) {
      return Response.json({ error: 'Password minimal 8 karakter' }, { status: 400 });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      return Response.json({ error: 'Konfigurasi server tidak lengkap' }, { status: 500 });
    }

    // Get supabase user ID by email using admin API
    const listRes = await fetch(`${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(user.email)}`, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
      }
    });

    const listData = await listRes.json();
    const supabaseUser = listData?.users?.[0];

    if (!supabaseUser) {
      return Response.json({ error: 'User tidak ditemukan di sistem auth' }, { status: 404 });
    }

    // Update password via admin API
    const updateRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${supabaseUser.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: newPassword }),
    });

    if (!updateRes.ok) {
      const err = await updateRes.json();
      return Response.json({ error: err.message || 'Gagal mengganti password' }, { status: 400 });
    }

    // Audit log: password change is a sensitive action
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
    base44.asServiceRole.entities.SystemLog.create({
      log_type: 'sensitive_access',
      user_email: user.email,
      user_id: user.id,
      action: 'password_changed',
      ip_address: ip,
      severity: 'warning',
      details: `User ${user.email} changed their password`,
    }).catch((e) => console.error('changePassword: audit log failed:', e));

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});