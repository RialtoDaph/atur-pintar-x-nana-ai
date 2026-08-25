import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const DEFAULTS = {
  monthly: 18000,
  yearly: 189000,
  monthlyOriginal: 49000,
  yearlyOriginal: 399900,
};

function formatRp(n) {
  return 'Rp ' + (n || 0).toLocaleString('id-ID');
}

export function usePricing() {
  const [monthly, setMonthly] = useState(DEFAULTS.monthly);
  const [yearly, setYearly] = useState(DEFAULTS.yearly);
  const [monthlyOriginal, setMonthlyOriginal] = useState(DEFAULTS.monthlyOriginal);
  const [yearlyOriginal, setYearlyOriginal] = useState(DEFAULTS.yearlyOriginal);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.AppConfig.list()
      .then(configs => {
        if (configs && configs.length > 0) {
          const c = configs[0];
          setMonthly(c.premium_price_monthly || DEFAULTS.monthly);
          setYearly(c.premium_price_yearly || DEFAULTS.yearly);
          setMonthlyOriginal(c.premium_price_monthly_original || DEFAULTS.monthlyOriginal);
          setYearlyOriginal(c.premium_price_yearly_original || DEFAULTS.yearlyOriginal);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const yearlySavingPct = monthly > 0
    ? Math.round((1 - yearly / (monthly * 12)) * 100)
    : 0;

  const monthlyDiscountPct = monthlyOriginal > 0
    ? Math.round((1 - monthly / monthlyOriginal) * 100)
    : 0;
  const yearlyDiscountPct = yearlyOriginal > 0
    ? Math.round((1 - yearly / yearlyOriginal) * 100)
    : 0;

  return {
    monthly,
    yearly,
    monthlyOriginal,
    yearlyOriginal,
    loading,
    monthlyFormatted: formatRp(monthly) + '/bulan',
    yearlyFormatted: formatRp(yearly) + '/tahun',
    monthlyOriginalFormatted: formatRp(monthlyOriginal),
    yearlyOriginalFormatted: formatRp(yearlyOriginal),
    yearlySavingPct,
    yearlySavingLabel: yearlySavingPct > 0 ? `Hemat ${yearlySavingPct}%` : 'Best Value',
    monthlyDiscountPct,
    yearlyDiscountPct,
  };
}