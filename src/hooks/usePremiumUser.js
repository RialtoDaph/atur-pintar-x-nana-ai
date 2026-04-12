import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Returns { isPremium, loading, user }
 * isPremium = true if:
 *   - subscription_status === 'active'
 *   - subscription_plan is 'premium_monthly' or 'premium_yearly'
 *   - subscription_end_date > today
 */
export function usePremiumUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me()
      .then(u => { setUser(u); })
      .catch(() => { setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  const isPremium = (() => {
    if (!user) return false;
    const { subscription_status, subscription_plan, subscription_end_date } = user;
    if (subscription_status !== 'active') return false;
    if (!['premium_monthly', 'premium_yearly'].includes(subscription_plan)) return false;
    if (!subscription_end_date) return false;
    return new Date(subscription_end_date) > new Date();
  })();

  return { isPremium, loading, user };
}