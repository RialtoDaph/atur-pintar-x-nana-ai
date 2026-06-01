/**
 * adminCleanupAchievements — remove duplicate Achievement records per user.
 * Keeps the one with is_unlocked=true (preferring most recently unlocked).
 * If no unlocked one exists, keeps the most recent locked one.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const targetEmail = body.target_email;

    // Get all achievements (or one user's)
    let records;
    if (targetEmail) {
      records = await base44.asServiceRole.entities.Achievement.filter({ created_by: targetEmail }).catch(() => []);
    } else {
      records = await base44.asServiceRole.entities.Achievement.list("-created_date", 5000).catch(() => []);
    }

    // Group by (created_by, achievement_key)
    const groups = {};
    for (const r of (records || [])) {
      const key = `${r.created_by}::${r.achievement_key}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    }

    let deleted = 0;
    let kept = 0;
    const perUser = {};

    for (const key of Object.keys(groups)) {
      const list = groups[key];
      if (list.length <= 1) {
        kept += list.length;
        continue;
      }

      // Sort: unlocked first (most recent unlocked_at), then most recent created
      list.sort((a, b) => {
        if (a.is_unlocked && !b.is_unlocked) return -1;
        if (!a.is_unlocked && b.is_unlocked) return 1;
        const aT = a.unlocked_at || a.created_date || '';
        const bT = b.unlocked_at || b.created_date || '';
        return bT.localeCompare(aT);
      });

      // Keep first, delete the rest
      kept++;
      for (const dup of list.slice(1)) {
        await base44.asServiceRole.entities.Achievement.delete(dup.id).catch(() => {});
        deleted++;
        const email = dup.created_by || 'unknown';
        perUser[email] = (perUser[email] || 0) + 1;
      }
    }

    return Response.json({
      success: true,
      total_records: (records || []).length,
      unique_groups: Object.keys(groups).length,
      kept,
      deleted,
      deleted_per_user: perUser,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});