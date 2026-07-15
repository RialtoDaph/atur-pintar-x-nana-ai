import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppSettings } from "@/components/utils/useAppSettings";
import { LayoutList, Flame } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import AnalyticsCardManager from "@/components/analytics/AnalyticsCardManager";
import PremiumBlurCard from "@/components/subscription/PremiumBlurCard";
import DateRangeFilter from "@/components/analytics/DateRangeFilter";
import CategoryBreakdownChart from "@/components/analytics/CategoryBreakdownChart";
import BehaviorHeroCard from "@/components/analytics/BehaviorHeroCard";
import BehaviorInsightsTabs from "@/components/analytics/BehaviorInsightsTabs";
import NanaAIHub from "@/components/analytics/NanaAIHub";
import PortfolioSummary from "@/components/dashboard/PortfolioSummary";

const DEFAULT_ANALYTICS_CARDS = [
  { id: "behavior_hero", visible: true },
  { id: "behavior_insights", visible: true },
  { id: "nana_ai_hub", visible: true },
  { id: "spending_chart", visible: true },
  { id: "portfolio_summary", visible: true },
];

const DEFAULT_CATEGORIES_FLAT = [
  { key: "housing", i18nKey: "cat_housing", emoji: "🏠", color: "#4F7CFF" },
  { key: "food", i18nKey: "cat_food", emoji: "🍔", color: "#FF6B6B" },
  { key: "transport", i18nKey: "cat_transport", emoji: "🚗", color: "#F5A623" },
  { key: "health", i18nKey: "cat_health", emoji: "❤️", color: "#FF5E8A" },
  { key: "entertainment", i18nKey: "cat_entertainment", emoji: "🎬", color: "#9B59B6" },
  { key: "shopping", i18nKey: "cat_shopping", emoji: "🛍️", color: "#E91E8C" },
  { key: "subscriptions", i18nKey: "cat_subscriptions", emoji: "📱", color: "#1ABC9C" },
  { key: "salary", i18nKey: "cat_salary", emoji: "💼", color: "#00C9A7" },
  { key: "freelance", i18nKey: "cat_freelance", emoji: "💻", color: "#34C87A" },
  { key: "savings", i18nKey: "cat_savings", emoji: "🐷", color: "#4F7CFF" },
  { key: "other", i18nKey: "cat_other", emoji: "📦", color: "#8FA4C8" },
];

function buildPeriodSubtitle(filterPeriod, customDateRange) {
  const now = new Date();
  const MONTHS_ID = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

  if (customDateRange) {
    const s = customDateRange.start;
    const e = customDateRange.end;
    if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
      return `${MONTHS_ID[s.getMonth()]} ${s.getFullYear()}`;
    }
    return `${MONTHS_ID[s.getMonth()]} - ${MONTHS_ID[e.getMonth()]} ${e.getFullYear()}`;
  }

  const months = parseInt(filterPeriod);
  if (months === 1) {
    return `${MONTHS_ID[now.getMonth()]} ${now.getFullYear()}`;
  }
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  return `${MONTHS_ID[start.getMonth()]} - ${MONTHS_ID[now.getMonth()]} ${now.getFullYear()}`;
}

export default function Analytics() {
  const { t } = useAppSettings();
  const queryClient = useQueryClient();
  const [filterPeriod, setFilterPeriod] = useState(() => {
    try { return sessionStorage.getItem("analytics_filter_period") || "6"; } catch { return "6"; }
  });
  const [customDateRange, setCustomDateRange] = useState(() => {
    try {
      const saved = sessionStorage.getItem("analytics_custom_range");
      if (!saved) return null;
      const p = JSON.parse(saved);
      return { start: new Date(p.start), end: new Date(p.end) };
    } catch { return null; }
  });
  const [user, setUser] = useState(null);
  const [analyticsCards, setAnalyticsCards] = useState(DEFAULT_ANALYTICS_CARDS);
  const [appSettings, setAppSettings] = useState(null);
  const [showCardManager, setShowCardManager] = useState(false);
  const [gamification, setGamification] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => setUser(u)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user?.email) return;
    base44.entities.GamificationProfile.filter({ created_by: user.email })
      .then(data => { if (data.length > 0) setGamification(data[0]); })
      .catch(() => {});
  }, [user?.email]);

  useEffect(() => {
    if (!user?.email) return;
    const unsub1 = base44.entities.Transaction.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["transactions_analytics", user.email] });
    });
    const unsub2 = base44.entities.SavingsGoal.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["goals", user.email] });
    });
    const unsub3 = base44.entities.Budget.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["budgets", user.email] });
    });
    return () => { unsub1(); unsub2(); unsub3(); };
  }, [user?.email]);

  const enabled = !!user?.email;

  // Fetch only the last 13 months of transactions server-side.
  // The 12-month filter is the max analytics view; +1 month gives us prev-period delta.
  const analyticsStartDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 13);
    d.setDate(1);
    return d.toISOString().split("T")[0];
  }, []);

  const { data: rawTransactions = [], isLoading: txLoading } = useQuery({
    queryKey: ["transactions_analytics", user?.email, analyticsStartDate],
    queryFn: () => base44.entities.Transaction.filter(
      { created_by: user.email, date: { $gte: analyticsStartDate } },
      "-date",
      2000
    ),
    enabled,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: goals = [], isLoading: goalsLoading } = useQuery({
    queryKey: ["goals", user?.email],
    queryFn: () => base44.entities.SavingsGoal.filter({ created_by: user.email }, "-created_date"),
    enabled,
    staleTime: 2 * 60 * 1000,
  });

  const { data: budgets = [], isLoading: budgetsLoading } = useQuery({
    queryKey: ["budgets", user?.email],
    queryFn: () => base44.entities.Budget.filter({ created_by: user.email }),
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const { data: customCategories = [] } = useQuery({
    queryKey: ["custom_categories"],
    queryFn: () => base44.entities.CustomCategory.list("-created_date"),
    enabled,
    staleTime: 10 * 60 * 1000,
  });

  const { data: globalCategories = [] } = useQuery({
    queryKey: ["global_categories_analytics"],
    queryFn: () => base44.entities.GlobalCategory.filter({ is_active: true }),
    enabled,
    staleTime: 10 * 60 * 1000,
  });

  const { data: settingsList = [] } = useQuery({
    queryKey: ["app_settings", user?.email],
    queryFn: () => base44.entities.AppSettings.list(),
    enabled,
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    const userSettings = settingsList?.find(s => s.id === user?.settings_id);
    if (userSettings) {
      setAppSettings(userSettings);
      if (userSettings.analytics_cards && userSettings.analytics_cards.length > 0) {
        const filtered = userSettings.analytics_cards.filter(c => c.id !== "financial_calendar");
        setAnalyticsCards(filtered);
      }
    }
  }, [settingsList, user?.settings_id]);

  // PERF: memoize heavy filter
  const transactions = useMemo(
    () => rawTransactions.filter(t => !t.is_deleted && !(t.is_recurring === true && !t.is_recurring_child)),
    [rawTransactions]
  );
  const loading = txLoading || goalsLoading || budgetsLoading;

  const localizedMonths = useMemo(() => {
    return [
      t('month_jan'), t('month_feb'), t('month_mar'), t('month_apr'),
      t('month_may'), t('month_jun'), t('month_jul'), t('month_aug'),
      t('month_sep'), t('month_oct'), t('month_nov'), t('month_dec')
    ];
  }, [t]);

  const allCategoriesConfig = useMemo(() => {
    const config = {};
    DEFAULT_CATEGORIES_FLAT.forEach(cat => {
      config[cat.key] = { label: t(cat.i18nKey), emoji: cat.emoji, color: cat.color };
    });
    customCategories.forEach(cat => {
      config[`custom_${cat.id}`] = { label: cat.name, emoji: cat.emoji, color: cat.color };
    });
    globalCategories.forEach(cat => {
      config[cat.id] = { label: cat.name, emoji: cat.emoji || "📦", color: cat.color || "#8FA4C8" };
    });
    return config;
  }, [customCategories, globalCategories, t]);

  const handleFilterChange = (filter) => {
    if (filter.type === "period") {
      setFilterPeriod(filter.value);
      setCustomDateRange(null);
      try {
        sessionStorage.setItem("analytics_filter_period", filter.value);
        sessionStorage.removeItem("analytics_custom_range");
      } catch {}
    } else if (filter.type === "custom") {
      // BUG FIX: end-of-day so transactions on the end date are included
      const start = new Date(filter.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(filter.endDate);
      end.setHours(23, 59, 59, 999);
      // BUG FIX: validate range — swap if reversed
      const validStart = start <= end ? start : end;
      const validEnd = start <= end ? end : start;
      setCustomDateRange({ start: validStart, end: validEnd });
      try {
        sessionStorage.setItem("analytics_custom_range", JSON.stringify({ start: validStart, end: validEnd }));
      } catch {}
    }
  };

  const isCardVisible = (id) => {
    const card = analyticsCards.find(c => c.id === id);
    return card ? card.visible : true;
  };

  const handleSaveCards = async (newCards) => {
    setAnalyticsCards(newCards);
    if (appSettings) {
      await base44.entities.AppSettings.update(appSettings.id, { analytics_cards: newCards });
    } else {
      const created = await base44.entities.AppSettings.create({ analytics_cards: newCards });
      setAppSettings(created);
    }
  };

  const formatPeriodLabel = (period) => {
    const months = parseInt(period);
    if (months === 1) return t('this_month') || 'Bulan ini';
    if (months === 3) return '3 bulan terakhir';
    if (months === 6) return '6 bulan terakhir';
    if (months === 12) return '12 bulan terakhir';
    return `${months} bulan terakhir`;
  };

  // PERF + BUG FIX: monthRange + all derived computations memoized
  const monthRange = useMemo(() => {
    if (customDateRange) return customDateRange;
    const now = new Date();
    const months = parseInt(filterPeriod) || 6;
    return {
      start: new Date(now.getFullYear(), now.getMonth() - (months - 1), 1),
      end: now,
    };
  }, [filterPeriod, customDateRange]);

  // 🎁 Free access window — semua user dapat akses Analitik penuh sampai tanggal ini
  const FREE_ACCESS_UNTIL = "2099-12-31";
  const todayStr = new Date().toISOString().slice(0, 10);
  const inFreeWindow = todayStr <= FREE_ACCESS_UNTIL;
  const isPremium = inFreeWindow || user?.role === "admin" || user?.subscription_plan === "premium_monthly" || user?.subscription_plan === "premium_yearly";

  // PERF: trendData + summary in one memo. BUG FIX: clamp negative monthDiff.
  const { trendData, totalIncome, periodExpenses, savingsRate, netCashflow } = useMemo(() => {
    const rawDiff =
      (monthRange.end.getFullYear() - monthRange.start.getFullYear()) * 12 +
      (monthRange.end.getMonth() - monthRange.start.getMonth());
    const monthDiff = Math.max(0, rawDiff);

    const td = Array.from({ length: monthDiff + 1 }, (_, i) => {
      const d = new Date(monthRange.start.getFullYear(), monthRange.start.getMonth() + i, 1);
      const month = d.getMonth();
      const year = d.getFullYear();
      let inc = 0, exp = 0;
      for (const t of transactions) {
        const td2 = new Date(t.date);
        if (td2.getMonth() !== month || td2.getFullYear() !== year) continue;
        if (t.type === "income") inc += t.amount;
        else if (t.type === "expense") exp += t.amount;
      }
      return { name: localizedMonths[month], Income: inc, Expenses: exp };
    });

    const ti = td.reduce((s, m) => s + m.Income, 0);
    const te = td.reduce((s, m) => s + m.Expenses, 0);
    const net = ti - te;
    const sr = ti > 0 ? ((net / ti) * 100).toFixed(1) : 0;

    return { trendData: td, totalIncome: ti, periodExpenses: te, savingsRate: sr, netCashflow: net };
  }, [transactions, monthRange, localizedMonths]);

  // PERF: filtered transactions for period (used by pie + delta)
  const { filteredTxForPeriod, pieData } = useMemo(() => {
    const filtered = transactions.filter(t => {
      const d = new Date(t.date);
      return d >= monthRange.start && d <= monthRange.end;
    });
    const catMap = {};
    for (const t of filtered) {
      if (t.type !== "expense") continue;
      const cat = t.category || "other";
      catMap[cat] = (catMap[cat] || 0) + t.amount;
    }
    const pie = Object.entries(catMap)
      .map(([key, value]) => ({
        name: allCategoriesConfig[key]?.label || key,
        value,
        color: allCategoriesConfig[key]?.color || "#8FA4C8",
        emoji: allCategoriesConfig[key]?.emoji || "📦",
      }))
      .sort((a, b) => b.value - a.value);
    return { filteredTxForPeriod: filtered, pieData: pie };
  }, [transactions, monthRange, allCategoriesConfig]);

  // PERF: previous period delta
  const { prevIncome, prevExpenses, prevSavingsRate, hasPrevData } = useMemo(() => {
    const periodDurationMs = monthRange.end - monthRange.start;
    const prevPeriodEnd = new Date(monthRange.start.getTime() - 1);
    const prevPeriodStart = new Date(prevPeriodEnd.getTime() - periodDurationMs);
    const prevTx = transactions.filter(t => {
      const d = new Date(t.date);
      return d >= prevPeriodStart && d <= prevPeriodEnd;
    });
    const pi = prevTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const pe = prevTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const pNet = pi - pe;
    const pSr = pi > 0 ? ((pNet / pi) * 100) : null;
    return { prevIncome: pi, prevExpenses: pe, prevSavingsRate: pSr, hasPrevData: prevTx.length > 0 };
  }, [transactions, monthRange]);

  const periodSubtitle = buildPeriodSubtitle(filterPeriod, customDateRange);
  const streak = gamification?.daily_streak || 0;

  return (
    <div className="min-h-screen bg-[#F2F4F7] pb-10">
      {/* Header */}
      <div className="bg-[#0A0A0A] px-5 pt-8 pb-6 sm:pt-10 sm:pb-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[#8FA4C8] text-xs sm:text-sm font-medium">{t('analytics_overview')}</p>
            <div className="flex items-center gap-2 mt-1">
              <h1 className="text-white text-xl sm:text-2xl font-bold">{t('analytics_title')}</h1>
              <Link
                to={createPageUrl("Gamifikasi")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all tap-highlight-fix ${
                  streak > 0 ? "bg-[#F97316] text-white" : "bg-white/20 text-white"
                }`}
              >
                <Flame className="w-3 h-3" />
                {streak > 0 ? `${streak} hari` : "Mulai streak!"}
              </Link>
            </div>
          </div>
          <button
            onClick={() => setShowCardManager(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white"
            title="Kelola kartu"
          >
            <LayoutList className="w-4 h-4" />
            <span className="text-xs font-medium hidden sm:block">Kelola</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 mt-4 space-y-5">

        <div className="relative">
          <DateRangeFilter onFilterChange={handleFilterChange} defaultPeriod="6" />
        </div>

        {/* 🎯 Behavior Hero — auto-pick insight terkuat (ikut filter periode) */}
        {isCardVisible("behavior_hero") && (
          <BehaviorHeroCard
            transactions={transactions}
            allCategoriesConfig={allCategoriesConfig}
            filterPeriod={filterPeriod}
            customDateRange={customDateRange}
          />
        )}

        {/* 🧠 Kebiasaanmu — 5 tabs (Merchant, 50/30/20, No-Spend, Pola, Heatmap) */}
        {isCardVisible("behavior_insights") && (
          isPremium ? (
            <BehaviorInsightsTabs
              transactions={transactions}
              filterPeriod={filterPeriod}
              customDateRange={customDateRange}
              allCategoriesConfig={allCategoriesConfig}
            />
          ) : (
            <PremiumBlurCard title="🧠 Kebiasaanmu">
              <BehaviorInsightsTabs
                transactions={transactions}
                filterPeriod={filterPeriod}
                customDateRange={customDateRange}
                allCategoriesConfig={allCategoriesConfig}
              />
            </PremiumBlurCard>
          )
        )}

        {/* ✨ Nana AI Hub — 5 tabs (Narasi, Tren, Forecast, Harian, Budget) */}
        {isCardVisible("nana_ai_hub") && (
          <NanaAIHub
            trendData={trendData}
            pieData={pieData}
            totalIncome={totalIncome}
            totalExpenses={periodExpenses}
            savingsRate={savingsRate}
            periodLabel={formatPeriodLabel(filterPeriod)}
            periodSubtitle={periodSubtitle}
            hasPrevData={hasPrevData}
            prevIncome={prevIncome}
            prevExpenses={prevExpenses}
            prevSavingsRate={prevSavingsRate}
            budgets={budgets}
            transactions={transactions}
            filterPeriod={filterPeriod}
            customDateRange={customDateRange}
          />
        )}

        {/* 🛍️ Kategori Keuangan */}
        {isCardVisible("spending_chart") && (
          isPremium ? (
            <CategoryBreakdownChart
              transactions={filteredTxForPeriod}
              loading={loading}
              periodSubtitle={periodSubtitle}
            />
          ) : (
            <PremiumBlurCard title="🛍️ Kategori Keuangan">
              <CategoryBreakdownChart transactions={filteredTxForPeriod} loading={loading} periodSubtitle={periodSubtitle} />
            </PremiumBlurCard>
          )
        )}

        {/* 💼 Portofolio Investasi */}
        {isCardVisible("portfolio_summary") && (
          <PortfolioSummary user={user} periodSubtitle={periodSubtitle} />
        )}

      </div>

      {showCardManager && (
        <AnalyticsCardManager
          cards={analyticsCards}
          onSave={handleSaveCards}
          onClose={() => setShowCardManager(false)}
        />
      )}
    </div>
  );
}