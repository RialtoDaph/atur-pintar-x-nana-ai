import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { action, email } = body;

    if (action === 'resetUser') {
      const profiles = await base44.asServiceRole.entities.GamificationProfile.filter({ created_by: email });
      await Promise.all(
        profiles.map(p =>
          base44.asServiceRole.entities.GamificationProfile.update(p.id, {
            daily_streak: 0,
            last_activity_date: null
          })
        )
      );
      return Response.json({ success: true, message: `Streak reset untuk ${email}` });
    }

    if (action === 'resetAll') {
      const allProfiles = await base44.asServiceRole.entities.GamificationProfile.list();
      await Promise.all(
        allProfiles.map(p =>
          base44.asServiceRole.entities.GamificationProfile.update(p.id, {
            daily_streak: 0,
            last_activity_date: null
          })
        )
      );
      return Response.json({ success: true, message: `Reset semua ${allProfiles.length} streak` });
    }

    if (action === 'deleteDuplicates') {
      const profiles = await base44.asServiceRole.entities.GamificationProfile.filter({ created_by: email });
      if (profiles.length <= 1) {
        return Response.json({ success: true, message: 'Tidak ada duplikat' });
      }

      const sorted = [...profiles].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      const toDelete = sorted.slice(1);

      await Promise.all(toDelete.map(p => base44.asServiceRole.entities.GamificationProfile.delete(p.id)));
      return Response.json({ success: true, message: `Hapus ${toDelete.length} duplikat untuk ${email}` });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});