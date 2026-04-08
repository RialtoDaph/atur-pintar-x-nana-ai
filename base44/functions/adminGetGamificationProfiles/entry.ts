import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const profiles = await base44.asServiceRole.entities.GamificationProfile.list();
    const userMap = {};

    profiles.forEach(profile => {
      if (!userMap[profile.created_by]) {
        userMap[profile.created_by] = {
          email: profile.created_by,
          profiles: [],
          daily_streak: 0,
          longest_streak: 0,
          level: 0,
          total_points: 0,
          last_activity_date: null
        };
      }
      userMap[profile.created_by].profiles.push(profile);
      userMap[profile.created_by].daily_streak = profile.daily_streak || 0;
      userMap[profile.created_by].longest_streak = profile.longest_streak || 0;
      userMap[profile.created_by].level = profile.level || 0;
      userMap[profile.created_by].total_points = profile.total_points || 0;
      userMap[profile.created_by].last_activity_date = profile.last_activity_date;
    });

    return Response.json({ users: Object.values(userMap) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});