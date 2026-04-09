import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export function usePricing() {
  const [pricing, setPricing] = useState({
    monthly: 49000,
    yearly: 490000,
    loading: true,
  });

  useEffect(() => {
    base44.entities.AppConfig.list()
      .then(configs => {
        const config = configs?.[0];
        setPricing({
          monthly: config?.premium_price_monthly || 49000,
          yearly: config?.premium_price_yearly || 490000,
          loading: false,
        });
      })
      .catch(() => setPricing({ monthly: 49000, yearly: 490000, loading: false }));
  }, []);

  function formatRp(n) {
    return 'Rp ' + (n || 0).toLocaleString('id-ID');
  }

  const yearlyDiscount = pricing.monthly > 0
    ? Math.round((1 - pricing.yearly / (pricing.monthly * 12)) * 100)
    : 0;

  return {
    ...pricing,
    formatRp,
    monthlyLabel: pricing.loading ? '...' : formatRp(pricing.monthly),
    yearlyLabel: pricing.loading ? '...' : formatRp(pricing.yearly),
    yearlyDiscount,
  };
}