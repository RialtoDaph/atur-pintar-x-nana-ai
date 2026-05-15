import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const code = (body.invite_code || '').trim().toUpperCase();
    if (!code || code.length !== 8) {
      return Response.json({ error: 'Kode undangan tidak valid' }, { status: 400 });
    }

    // Use service role to bypass RLS for lookup
    const all = await base44.asServiceRole.entities.SharedWallet.filter({ invite_code: code });
    const target = all?.[0];
    if (!target) {
      return Response.json({ error: 'Kode undangan tidak valid' }, { status: 404 });
    }

    const members = target.members || [];
    const pending = target.pending_invites || [];

    if (members.includes(user.email)) {
      return Response.json({ error: 'Anda sudah tergabung' }, { status: 400 });
    }

    const updated = await base44.asServiceRole.entities.SharedWallet.update(target.id, {
      members: [...new Set([...members, user.email])],
      pending_invites: pending.filter((e) => e !== user.email)
    });

    return Response.json({ success: true, wallet: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});