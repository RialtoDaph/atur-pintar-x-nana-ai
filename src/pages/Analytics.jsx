import { useState, useEffect, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from '@tanstack/react-query';
import { useAppSettings } from "@/components/utils/useAppSettings";
import PremiumGate from "@/components/subscription/PremiumGate";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { LayoutList, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Suspense, lazy } from "react";
const PortfolioSummary = lazy(() => import("@/components/dashboard/PortfolioSummary"));
const GoalsMiniList = lazy(() => import("@/components/dashboard/GoalsMiniList"));
import AnalyticsCardManager from "@/components/analytics/AnalyticsCardManager";
import NetWorthCard from "@/components/analytics/NetWorthCard";
import AIFinancialNarrative from "@/components/analytics/AIFinancialNarrative";
import AnomalyDetector from "@/components/analytics/AnomalyDetector";
import FinancialCalendar from "@/components/analytics/FinancialCalendar";
import DateRangeFilter from "@/components/analytics/DateRangeFilter";
import DailySpendingCard from "@/components/analytics/DailySpendingCard";

const DEFAULT_ANALYTICS_CARDS = [
  { id: "net_worth", visible: true },
  { id: "anomaly_detector", visible: true },
  { id: "financial_calendar", visible: true },
  { id: "daily_spending", visible: true },
  { id: "portfolio_summary", visible: true },
  { id: "savings_goals", visible: true },
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

export default function Analytics() {
  const { t, formatShortNumber, formatCurrency } = useAppSettings();
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [debts, setDebts] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState("6");
  const [customDateRange, setCustomDateRange] = useState(null);
  const [user, setUser] = useState(null);
  const [analyticsCards, setAnalyticsCards] = useState(DEFAULT_ANALYTICS_CARDS);
  const [appSettings, setAppSettings] = useState(null);
  const [showCardManager, setShowCardManager] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
    }).catch(() => {});
  }, []);

  // Use React Query for data fetching with automatic caching & deduplication
  const { data: queryData, isLoading } = useQuery({
    queryKey: ['analytics', user?.email],
    queryFn: async () => {
      if (!user) return null;
      try {
        const [t, g, b, i, d, cc, settings] = await Promise.all([
          base44.entities.Transaction.filter({ created_by: user.email }, "-date", 300),
          base44.entities.SavingsGoal.filter({ created_by: user.email }, "-created_date"),
          base44.entities.Budget.filter({ created_by: user.email }),
          base44.entities.Investment.filter({ created_by: user.email }),
          base44.entities.Debt.filter({ created_by: user.email }),
          base44.entities.CustomCategory.list("-created_date"),
          base44.entities.AppSettings.list()
        ]);
        return { t, g, b, i, d, cc, settings };
      } catch (error) {
        console.error('Failed to load analytics data:', error);
        return null;
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });

  useEffect(() => {
    if (queryData) {
      setTransactions(queryData.t || []);
      setGoals(queryData.g || []);
      setBudgets(queryData.b || []);
      setInvestments(queryData.i || []);
      setDebts(queryData.d || []);
      setCustomCategories(queryData.cc || []);
      const userSettings = queryData.settings?.find(s => s.id === user.settings_id);
      if (userSettings) {
        setAppSettings(userSettings);
        if (userSettings.analytics_cards && userSettings.analytics_cards.length > 0) {
          setAnalyticsCards(userSettings.analytics_cards);
        }
      }
    }
    setLoading(isLoading);
  }, [queryData, isLoading, user?.settings_id]);

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
    return config;
  }, [customCategories, t]);

  const handleFilterChange = (filter) => {
    if (filter.type === "period") {
      setFilterPeriod(filter.value);
      setCustomDateRange(null);
    } else if (filter.type === "custom") {
      setCustomDateRange({
        start: new Date(filter.startDate),
        end: new Date(filter.endDate),
      });
    }
  };

  const formatYAxisTick = useCallback((value) => formatShortNumber(value), [formatShortNumber]);

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

  const now = new Date();
  const getMonthRange = () => {
    if (customDateRange) {
      return customDateRange;
    }
    const months = parseInt(filterPeriod);
    return {
      start: new Date(now.getFullYear(), now.getMonth() - (months - 1), 1),
      end: now,
    };
  };

  const monthRange = getMonthRange();
  const monthDiff =
    (monthRange.end.getFullYear() - monthRange.start.getFullYear()) * 12 +
    (monthRange.end.getMonth() - monthRange.start.getMonth());

  const trendData = Array.from({ length: monthDiff + 1 }, (_, i) => {
    const d = new Date(monthRange.start.getFullYear(), monthRange.start.getMonth() + i, 1);
    const month = d.getMonth();
    const year = d.getFullYear();
    const monthTx = transactions.filter(t => {
      const td = new Date(t.date);
      return td.getMonth() === month && td.getFullYear() === year;
    });
    return {
      name: localizedMonths[month],
      Income: monthTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0),
      Expenses: monthTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    };
  });

  const thisMonthTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.type === "expense";
  });

  // Filtered expenses based on selected period (for category breakdown)
  const filteredExpenses = transactions.filter(t => {
    if (t.type !== "expense") return false;
    const d = new Date(t.date);
    return d >= monthRange.start && d <= monthRange.end;
  });

  const categoryMap = {};
  filteredExpenses.forEach(t => {
    const cat = t.category || "other";
    categoryMap[cat] = (categoryMap[cat] || 0) + t.amount;
  });

  const pieData = Object.entries(categoryMap)
    .map(([key, value]) => ({
      name: allCategoriesConfig[key]?.label || key,
      value,
      color: allCategoriesConfig[key]?.color || "#8FA4C8",
      emoji: allCategoriesConfig[key]?.emoji || "📦",
    }))
    .sort((a, b) => b.value - a.value);

  const totalExpenses = filteredExpenses.reduce((s, t) => s + t.amount, 0);



  const budgetData = budgets.map(b => {
    const catConfig = allCategoriesConfig[b.category] || {};
    const spent = thisMonthTx.filter(t => t.category === b.category).reduce((s, t) => s + t.amount, 0);
    return { name: (catConfig.emoji || "") + " " + (catConfig.label || b.category), budget: b.amount, spent };
  });

  const goalsData = goals.map(g => ({
    name: g.name,
    current: g.current_amount || 0,
    target: g.target_amount,
    progress: ((g.current_amount || 0) / (g.target_amount || 1)) * 100,
    color: g.color || "#FF6A00"
  }));

  const totalInvested = investments.reduce((s, inv) => s + inv.initial_amount, 0);
  const totalCurrentValue = investments.reduce((s, inv) => s + inv.current_value, 0);
  const investmentReturn = totalCurrentValue - totalInvested;

  const isPremium = user?.subscription_plan === "premium_monthly" || user?.subscription_plan === "premium_yearly";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F4F7] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#00C9A7] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isPremium) {
    return <PremiumGate feature="Analitik lanjutan" />;
  }

  const totalIncome = trendData.reduce((sum, month) => sum + month.Income, 0);
  const periodExpenses = trendData.reduce((sum, month) => sum + month.Expenses, 0);
  const netCashflow = totalIncome - periodExpenses;
  const savingsRate = totalIncome > 0 ? ((netCashflow / totalIncome) * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-[#F2F4F7] pb-10">
      {/* Header */}
      <div className="bg-[#0A0A0A] px-5 pt-8 pb-6 sm:pt-10 sm:pb-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[#8FA4C8] text-xs sm:text-sm font-medium">{t('analytics_overview')}</p>
            <h1 className="text-white text-xl sm:text-2xl font-bold mt-1">{t('analytics_title')}</h1>
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

        {/* Filter - Compact at top */}
        <div className="relative">
          <DateRangeFilter onFilterChange={handleFilterChange} defaultPeriod="6" />
        </div>

        {/* AI Financial Narrative */}
        <AIFinancialNarrative
          trendData={trendData}
          pieData={pieData}
          totalIncome={totalIncome}
          totalExpenses={periodExpenses}
          savingsRate={savingsRate}
          periodLabel={formatPeriodLabel(filterPeriod)}
        />

        {/* Net Worth Card */}
        {isCardVisible("net_worth") && (
          <NetWorthCard
            goals={goals}
            investments={investments}
            debts={debts}
            transactions={transactions}
          />
        )}

        {/* Anomaly Detector */}
        {isCardVisible("anomaly_detector") && (
          <AnomalyDetector
            transactions={transactions}
            allCategoriesConfig={allCategoriesConfig}
          />
        )}

        {/* Calendar Section */}
        {isCardVisible("financial_calendar") && (
          <FinancialCalendar transactions={transactions} debts={debts} goals={goals} />
        )}

        {/* Daily Spending Card */}
        {isCardVisible("daily_spending") && (
          <DailySpendingCard
            transactions={transactions}
            filterPeriod={filterPeriod}
            customDateRange={customDateRange}
          />
        )}

        {/* Portfolio Summary */}
        {isCardVisible("portfolio_summary") && (
          <Suspense fallback={<div className="bg-white rounded-2xl h-20 animate-pulse shadow-sm" />}>
            <PortfolioSummary user={user} />
          </Suspense>
        )}

        {/* Savings Goals */}
        {isCardVisible("savings_goals") && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <h2 className="font-bold text-[#0A0A0A] text-sm">{t('savings_goals')}</h2>
              <Link to={createPageUrl("Goals")} className="text-xs text-[#FF6A00] font-semibold flex items-center gap-0.5">
                {t('view_all')} <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <Suspense fallback={<div className="h-10 animate-pulse" />}>
              <GoalsMiniList goals={goals} loading={loading} />
            </Suspense>
          </div>
        )}

      </div>

      {/* Card Manager Modal */}
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