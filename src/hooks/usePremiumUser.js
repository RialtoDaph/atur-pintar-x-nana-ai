import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Returns { isPremium, loading, user, isExpired }
 *
 * Premium logic (in order):
 *   1. Admins (role === 'admin') are ALWAYS premium.
 *   2. Otherwise, look up the user's most recent approved SubscriptionPayment:
 *        - If expires_at exists AND expires_at < today → NOT premium (expired), isExpired = true
 *        - If expires_at >= today OR no expires_at but status === 'approved' → premium
 *   3. Fallback to the legacy User.subscription_* fields for users who don't have
 *      a SubscriptionPayment record yet (preserves existing gating).
 *
 * isExpired = true only when a previously-approved payment is now past its expires_at
 * (used to show the renewal banner). Never true for users who never subscribed.
 */
export function usePremiumUser() {
  const [user, setUser] = useState(null);
  const [latestPayment, setLatestPayment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    base44.auth.me()
      .then(async (u) => {
        if (cancelled) return;
        setUser(u);
        if (!u || u.role === 'admin') return;
        try {
          const payments = await base44.entities.SubscriptionPayment.filter(
            { created_by: u.email, status: 'approved' },
            '-approved_at',
            1
          );
          if (!cancelled) setLatestPayment(payments?.[0] || null);
        } catch {
          if (!cancelled) setLatestPayment(null);
        }
      })
      .catch(() => { if (!cancelled) setUser(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const today = new Date().toISOString().split('T')[0];

  // 🎁 FREE ACCESS WINDOW — all features unlocked for everyone until this date.
  // Remove this block (or set FREE_ACCESS_UNTIL to a past date) to re-enable premium gating.
  const FREE_ACCESS_UNTIL = '2026-08-08';

  const { isPremium, isExpired } = (() => {
    if (!user) return { isPremium: false, isExpired: false };
    if (user.role === 'admin') return { isPremium: true, isExpired: false };
    if (today <= FREE_ACCESS_UNTIL) return { isPremium: true, isExpired: false };

    // SubscriptionPayment-based check (new source of truth)
    if (latestPayment) {
      if (latestPayment.expires_at && latestPayment.expires_at < today) {
        return { isPremium: false, isExpired: true };
      }
      return { isPremium: true, isExpired: false };
    }

    // Legacy fallback — preserve existing gating for users without a payment record
    const { subscription_status, subscription_plan, subscription_end_date } = user;
    if (subscription_status !== 'active') return { isPremium: false, isExpired: false };
    if (!['premium_monthly', 'premium_yearly'].includes(subscription_plan)) return { isPremium: false, isExpired: false };
    if (!subscription_end_date) return { isPremium: false, isExpired: false };
    return { isPremium: new Date(subscription_end_date) > new Date(), isExpired: false };
  })();

  return { isPremium, isExpired, loading, user };
}