import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const DEFAULTS = {
  monthly: 39000,
  yearly: 299000,
};

function formatRp(n) {
  return 'Rp ' + (n || 0).toLocaleString('id-ID');
}

export function usePricing() {
  const [monthly, setMonthly] = useState(DEFAULTS.monthly);
  const [yearly, setYearly] = useState(DEFAULTS.yearly);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.AppConfig.list()
      .then(configs => {
        if (configs && configs.length > 0) {
          setMonthly(configs[0].premium_price_monthly || DEFAULTS.monthly);
          setYearly(configs[0].premium_price_yearly || DEFAULTS.yearly);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const yearlySavingPct = monthly > 0
    ? Math.round((1 - yearly / (monthly * 12)) * 100)
    : 0;

  return {
    monthly,
    yearly,
    loading,
    monthlyFormatted: formatRp(monthly) + '/bulan',
    yearlyFormatted: formatRp(yearly) + '/tahun',
    yearlySavingPct,
    yearlySavingLabel: yearlySavingPct > 0 ? `Hemat ${yearlySavingPct}%` : 'Best Value',
  };
}