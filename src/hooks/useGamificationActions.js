/**
 * useGamificationActions — thin client helpers that DELEGATE to backend.
 *
 * IMPORTANT: All XP / streak / level logic is owned by `processGamification`
 * (backend). Never write to GamificationProfile directly from the frontend —
 * doing so causes race conditions with the backend processor.
 *
 * - completeMission: marks today's DailyMission complete and asks backend to
 *   award XP via processGamification (trigger="mission_completed").
 *   Safe to call multiple times — DailyMission filter checks is_completed=false.
 */
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";

/**
 * @deprecated Streak is now handled exclusively by the backend `processGamification`
 * function (triggered on activity like transaction_created/goal_created/etc).
 * This stub exists only to keep older imports compiling — it is a no-op.
 */
export async function updateStreak() {
  // No-op: backend processGamification owns streak logic.
}

/**
 * Mark a daily mission as completed (frontend-only mark) and let the backend
 * processGamification award XP and handle level/achievements.
 *
 * Note: `cek_budget` is fired client-side (user viewed Budget page).
 * `catat_transaksi` and `tanya_nana` are auto-completed by the
 * `completeDailyMission` backend automation when the Transaction /
 * NanaConversation is created — but calling here as a fallback is safe
 * (the mission filter on is_completed=false makes it idempotent).
 *
 * mission_key: "catat_transaksi" | "tanya_nana" | "cek_budget"
 */
export async function completeMission(userEmail, missionKey) {
  if (!userEmail || !missionKey) return;
  const today = format(new Date(), "yyyy-MM-dd");

  const missions = await base44.entities.DailyMission.filter({
    created_by: userEmail,
    date: today,
    mission_key: missionKey,
    is_completed: false,
  }).catch(() => []);

  if (!missions || missions.length === 0) return; // already done or doesn't exist

  const mission = missions[0];

  // Mark mission completed (frontend-safe — only flips the boolean)
  await base44.entities.DailyMission.update(mission.id, { is_completed: true }).catch(() => {});

  // Ask backend to award XP authoritatively (avoids race with processGamification)
  base44.functions.invoke("processGamification", {
    trigger: "mission_completed",
    metadata: { mission_key: missionKey, xp_reward: mission.xp_reward || 0 },
  }).catch(() => {});
}