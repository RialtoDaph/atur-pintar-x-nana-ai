import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Returns { isPremium, loading, user, isExpired }
 *
 * Premium logic (SubscriptionPayment removed — Apple IAP nantinya):
 *   1. Admins (role === 'admin') are ALWAYS premium.
 *   2. Otherwise, check the legacy User.subscription_* fields (still filled by
 *      free-access window & admin manual grants) — Apple IAP hook will write here.
 */
export function usePremiumUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    base44.auth.me()
      .then((u) => { if (!cancelled) setUser(u); })
      .catch(() => { if (!cancelled) setUser(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const today = new Date().toISOString().split('T')[0];

  // 🎁 FREE ACCESS WINDOW — all features unlocked for everyone until this date.
  // Remove this block (or set FREE_ACCESS_UNTIL to a past date) to re-enable premium gating.
  const FREE_ACCESS_UNTIL = '2099-12-31';

  const { isPremium, isExpired } = (() => {
    if (!user) return { isPremium: false, isExpired: false };
    if (user.role === 'admin') return { isPremium: true, isExpired: false };
    if (today <= FREE_ACCESS_UNTIL) return { isPremium: true, isExpired: false };

    const { subscription_status, subscription_plan, subscription_end_date } = user;
    if (subscription_status !== 'active') return { isPremium: false, isExpired: subscription_status === 'expired' };
    if (!['premium_monthly', 'premium_yearly'].includes(subscription_plan)) return { isPremium: false, isExpired: false };
    if (!subscription_end_date) return { isPremium: false, isExpired: false };
    return { isPremium: new Date(subscription_end_date) > new Date(), isExpired: false };
  })();

  return { isPremium, isExpired, loading, user };
}