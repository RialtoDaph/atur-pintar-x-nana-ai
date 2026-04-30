import { base44 } from "@/api/base44Client";
import { format } from "date-fns";

/**
 * Update challenge progress after a transaction is saved
 * Call this immediately after Transaction.create() succeeds
 */
export async function updateChallengesAfterTransaction(userEmail) {
  if (!userEmail) return;

  try {
    const today = format(new Date(), "yyyy-MM-dd");

    // Fetch all active challenges
    const activeChallenges = await base44.entities.Challenge.filter({
      created_by: userEmail,
      status: "active",
    }).catch(() => []);

    if (!activeChallenges || activeChallenges.length === 0) return;

    // Fetch today's transactions
    const todaysTxs = await base44.entities.Transaction.filter({
      created_by: userEmail,
      date: today,
    }).catch(() => []);

    // Fetch GamificationProfile for XP reward
    const profiles = await base44.entities.GamificationProfile.filter({
      created_by: userEmail,
    }).catch(() => []);
    const profile = profiles?.[0];

    // Process each active challenge
    for (const challenge of activeChallenges) {
      let needsUpdate = false;
      let updatedData = { ...challenge };

      // Check if challenge has expired
      if (challenge.end_date && challenge.end_date < today) {
        if (challenge.status === "active" && challenge.progress < 100) {
          updatedData.status = "failed";
          needsUpdate = true;
        }
      } else if (challenge.challenge_key === "nabung_30_hari") {
        // Check if already counted today
        if (challenge.last_progress_date !== today) {
          // Check if there's a transaction today with amount >= 10000
          const hasQualifyingTx = todaysTxs.some((tx) => (tx.amount || 0) >= 10000);

          if (hasQualifyingTx) {
            updatedData.progress_days = (challenge.progress_days || 0) + 1;
            updatedData.last_progress_date = today;
            updatedData.progress = Math.round(
              ((updatedData.progress_days || 0) / (challenge.duration_days || 30)) * 100
            );

            if (updatedData.progress >= 100) {
              updatedData.status = "completed";
              // Award XP if profile exists
              if (profile && challenge.xp_reward) {
                await base44.entities.GamificationProfile.update(profile.id, {
                  total_points: (profile.total_points || 0) + challenge.xp_reward,
                });
              }
            }

            needsUpdate = true;
          }
        }
      } else if (challenge.challenge_key.startsWith("nabung_mingguan_")) {
        // Weekly savings challenge
        if (challenge.last_progress_date !== today) {
          const hasQualifyingTx = todaysTxs.some((tx) => (tx.amount || 0) >= 50000);

          if (hasQualifyingTx) {
            updatedData.progress_days = (challenge.progress_days || 0) + 1;
            updatedData.last_progress_date = today;
            updatedData.progress = Math.round(
              ((updatedData.progress_days || 0) / (challenge.duration_days || 7)) * 100
            );

            if (updatedData.progress >= 100) {
              updatedData.status = "completed";
              if (profile && challenge.xp_reward) {
                await base44.entities.GamificationProfile.update(profile.id, {
                  total_points: (profile.total_points || 0) + challenge.xp_reward,
                });
              }
            }

            needsUpdate = true;
          }
        }
      }

      // Save if needed
      if (needsUpdate) {
        await base44.entities.Challenge.update(challenge.id, updatedData).catch(() => {});
      }
    }
  } catch (error) {
    console.error("Error updating challenges:", error);
  }
}

/**
 * Check and expire challenges that have passed their end_date
 * Call this on Challenge/Gamification page load
 */
export async function expireChallenges(userEmail) {
  if (!userEmail) return;

  try {
    const today = format(new Date(), "yyyy-MM-dd");

    const activeChallenges = await base44.entities.Challenge.filter({
      created_by: userEmail,
      status: "active",
    }).catch(() => []);

    if (!activeChallenges || activeChallenges.length === 0) return;

    for (const challenge of activeChallenges) {
      if (challenge.end_date && challenge.end_date < today && challenge.progress < 100) {
        await base44.entities.Challenge.update(challenge.id, { status: "failed" }).catch(() => {});
      }
    }
  } catch (error) {
    console.error("Error expiring challenges:", error);
  }
}