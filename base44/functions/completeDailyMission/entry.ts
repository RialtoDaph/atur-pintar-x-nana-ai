/**
 * completeDailyMission — entity automation handler
 * Triggered on Transaction.create or NanaConversation.create
 * Marks the relevant DailyMission as completed and awards XP.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function getLevelFromXP(xp) {
  const LEVELS = [
    { level: 1, min: 0, max: 499 },
    { level: 2, min: 500, max: 1499 },
    { level: 3, min: 1500, max: 2999 },
    { level: 4, min: 3000, max: 5999 },
    { level: 5, min: 6000, max: 9999 },
    { level: 6, min: 10000, max: 19999 },
    { level: 7, min: 20000, max: Infinity },
  ];
  return LEVELS.find(l => xp >= l.min && xp <= l.max) || LEVELS[0];
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const entityName = payload?.event?.entity_name;
    const eventType = payload?.event?.type;
    const data = payload?.data;

    if (eventType !== 'create' || !data) {
      return Response.json({ skipped: true });
    }

    const userEmail = data.created_by;
    if (!userEmail) return Response.json({ skipped: true, reason: 'no user' });

    // Determine which mission key to complete
    let missionKey = null;
    if (entityName === 'Transaction') {
      missionKey = 'catat_transaksi';
    } else if (entityName === 'NanaConversation' && data.role === 'user') {
      missionKey = 'tanya_nana';
    }

    if (!missionKey) return Response.json({ skipped: true, reason: 'no matching mission' });

    const today = new Date().toISOString().slice(0, 10);

    // Find today's mission for this user
    const missions = await base44.asServiceRole.entities.DailyMission.filter({
      created_by: userEmail,
      date: today,
      mission_key: missionKey,
      is_completed: false,
    });

    if (!missions || missions.length === 0) {
      return Response.json({ skipped: true, reason: 'mission already completed or not found' });
    }

    const mission = missions[0];

    // Mark mission completed
    await base44.asServiceRole.entities.DailyMission.update(mission.id, { is_completed: true });

    // Award XP to GamificationProfile
    const profiles = await base44.asServiceRole.entities.GamificationProfile.filter({ created_by: userEmail });
    let profile = profiles?.[0];

    if (!profile) {
      profile = await base44.asServiceRole.entities.GamificationProfile.create({
        total_points: 0, level: 1, daily_streak: 0,
        longest_streak: 0, achievements: [], last_activity_date: today,
        created_by: userEmail,
      });
    }

    const xpReward = mission.xp_reward || 0;
    const newXP = (profile.total_points || 0) + xpReward;
    const newLevel = getLevelFromXP(newXP);

    // Streak update — single correct logic
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yestStr = yesterday.toISOString().slice(0, 10);
    const last = profile.last_activity_date;

    let newStreak = profile.daily_streak || 0;
    if (last === today) {
      // Already counted today — only update XP, don't touch streak
      await base44.asServiceRole.entities.GamificationProfile.update(profile.id, {
        total_points: newXP,
        level: newLevel.level,
      });
      return Response.json({ success: true, mission_key: missionKey, xp_awarded: xpReward });
    } else if (last === yestStr) {
      newStreak = (profile.daily_streak || 0) + 1;
    } else {
      // Null or more than 1 day ago — reset to 1
      newStreak = 1;
    }

    await base44.asServiceRole.entities.GamificationProfile.update(profile.id, {
      total_points: newXP,
      level: newLevel.level,
      daily_streak: newStreak,
      longest_streak: Math.max(profile.longest_streak || 0, newStreak),
      last_activity_date: today,
    });

    return Response.json({ success: true, mission_key: missionKey, xp_awarded: xpReward });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});