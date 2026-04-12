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

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});