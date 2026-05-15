import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Unified action handler for SharedWallet mutations that need to bypass RLS
// (RLS allows only owner to update wallet, but members need to: accept/decline invite, leave, add transactions, etc.)
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { action, wallet_id } = body;

    if (!action || !wallet_id) {
      return Response.json({ error: 'Missing action or wallet_id' }, { status: 400 });
    }

    // Fetch wallet via service role
    const wallets = await base44.asServiceRole.entities.SharedWallet.filter({ id: wallet_id });
    const wallet = wallets?.[0];
    if (!wallet) {
      return Response.json({ error: 'Wallet not found' }, { status: 404 });
    }

    const members = wallet.members || [];
    const pending = wallet.pending_invites || [];
    const isOwner = wallet.owner_email === user.email;
    const isMember = members.includes(user.email);
    const isInvited = pending.includes(user.email);

    let updated;

    switch (action) {
      case 'accept_invite': {
        if (!isInvited) return Response.json({ error: 'Tidak diundang' }, { status: 403 });
        updated = await base44.asServiceRole.entities.SharedWallet.update(wallet_id, {
          members: [...new Set([...members, user.email])],
          pending_invites: pending.filter((e) => e !== user.email)
        });
        break;
      }
      case 'decline_invite': {
        if (!isInvited) return Response.json({ error: 'Tidak diundang' }, { status: 403 });
        updated = await base44.asServiceRole.entities.SharedWallet.update(wallet_id, {
          pending_invites: pending.filter((e) => e !== user.email)
        });
        break;
      }
      case 'leave': {
        if (!isMember || isOwner) return Response.json({ error: 'Tidak bisa keluar' }, { status: 403 });
        updated = await base44.asServiceRole.entities.SharedWallet.update(wallet_id, {
          members: members.filter((e) => e !== user.email)
        });
        break;
      }
      case 'invite_member': {
        if (!isOwner) return Response.json({ error: 'Hanya owner yang bisa undang' }, { status: 403 });
        const email = (body.email || '').trim();
        if (!email) return Response.json({ error: 'Email kosong' }, { status: 400 });
        if (members.includes(email)) return Response.json({ error: 'Sudah menjadi anggota' }, { status: 400 });
        updated = await base44.asServiceRole.entities.SharedWallet.update(wallet_id, {
          pending_invites: [...new Set([...pending, email])]
        });
        break;
      }
      case 'kick_member': {
        if (!isOwner) return Response.json({ error: 'Hanya owner yang bisa keluarkan' }, { status: 403 });
        const email = body.email;
        updated = await base44.asServiceRole.entities.SharedWallet.update(wallet_id, {
          members: members.filter((e) => e !== email),
          pending_invites: pending.filter((e) => e !== email)
        });
        break;
      }
      case 'update_balance': {
        if (!isMember && !isOwner) return Response.json({ error: 'Bukan anggota' }, { status: 403 });
        updated = await base44.asServiceRole.entities.SharedWallet.update(wallet_id, {
          balance: body.balance || 0
        });
        break;
      }
      case 'delete_wallet': {
        if (!isOwner) return Response.json({ error: 'Hanya owner yang bisa hapus' }, { status: 403 });
        // Cascade delete all transactions
        const txs = await base44.asServiceRole.entities.SharedWalletTransaction.filter({ wallet_id });
        await Promise.all((txs || []).map((t) => base44.asServiceRole.entities.SharedWalletTransaction.delete(t.id).catch(() => {})));
        await base44.asServiceRole.entities.SharedWallet.delete(wallet_id);
        return Response.json({ success: true });
      }
      default:
        return Response.json({ error: 'Unknown action' }, { status: 400 });
    }

    return Response.json({ success: true, wallet: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});