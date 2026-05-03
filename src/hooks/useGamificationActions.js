/**
 * useGamificationActions — lightweight client-side helpers for:
 * 1. updateStreak: updates daily_streak on every user activity
 * 2. completeMission: marks today's DailyMission complete + awards XP
 */
import { base44 } from "@/api/base44Client";
import { format, subDays } from "date-fns";

const LEVEL_THRESHOLDS = [
  { level: 1, min: 0 },
  { level: 2, min: 200 },
  { level: 3, min: 500 },
  { level: 4, min: 1000 },
  { level: 5, min: 2000 },
  { level: 6, min: 3500 },
  { level: 7, min: 5000 },
];

function getLevelFromXP(xp) {
  let level = LEVEL_THRESHOLDS[0];
  for (const l of LEVEL_THRESHOLDS) {
    if (xp >= l.min) level = l;
  }
  return level.level;
}

async function getOrCreateProfile(userEmail) {
  const profiles = await base44.entities.GamificationProfile.filter({ created_by: userEmail }).catch(() => []);
  if (profiles && profiles.length > 0) {
    return [...profiles].sort((a, b) => (b.total_points || 0) - (a.total_points || 0))[0];
  }
  return base44.entities.GamificationProfile.create({
    daily_streak: 0, longest_streak: 0, total_points: 0, level: 1,
    achievements: [], last_activity_date: null,
  });
}

/**
 * Update daily streak for the current user.
 * Safe to call on any user interaction — handles dedup (same-day) internally.
 */
export async function updateStreak(userEmail) {
  if (!userEmail) return;
  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");

  const profile = await getOrCreateProfile(userEmail);
  const last = profile.last_activity_date;

  // Already counted today — nothing to do
  if (last === today) return;

  let newStreak;
  if (last === yesterday) {
    newStreak = (profile.daily_streak || 0) + 1;
  } else {
    newStreak = 1;
  }

  await base44.entities.GamificationProfile.update(profile.id, {
    daily_streak: newStreak,
    longest_streak: Math.max(profile.longest_streak || 0, newStreak),
    last_activity_date: today,
  });
}

/**
 * Complete a DailyMission for today and award XP.
 * mission_key: "catat_transaksi" | "tanya_nana" | "cek_budget"
 * Safe to call multiple times — only acts when mission exists and is_completed=false.
 */
export async function completeMission(userEmail, missionKey) {
  if (!userEmail || !missionKey) return;
  const today = format(new Date(), "yyyy-MM-dd");

  // Find today's incomplete mission
  const missions = await base44.entities.DailyMission.filter({
    created_by: userEmail,
    date: today,
    mission_key: missionKey,
    is_completed: false,
  }).catch(() => []);

  if (!missions || missions.length === 0) return; // already done or doesn't exist

  const mission = missions[0];
  const xpReward = mission.xp_reward || 0;

  // Mark complete
  await base44.entities.DailyMission.update(mission.id, { is_completed: true });

  // Award XP only (streak is handled separately by updateStreak)
  if (xpReward > 0) {
    const profile = await getOrCreateProfile(userEmail);
    const newXP = (profile.total_points || 0) + xpReward;
    await base44.entities.GamificationProfile.update(profile.id, {
      total_points: newXP,
      level: getLevelFromXP(newXP),
    });
  }
}