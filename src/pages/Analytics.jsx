import { useState, useEffect, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppSettings } from "@/components/utils/useAppSettings";
import { LayoutList } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import AnalyticsCardManager from "@/components/analytics/AnalyticsCardManager";
import PremiumBlurCard from "@/components/subscription/PremiumBlurCard";
import NetWorthCard from "@/components/analytics/NetWorthCard";
import AIFinancialNarrative from "@/components/analytics/AIFinancialNarrative";
import DateRangeFilter from "@/components/analytics/DateRangeFilter";
import DailySpendingCard from "@/components/analytics/DailySpendingCard";
import SpendingChart from "@/components/dashboard/SpendingChart";
import FinancialScoreCard from "@/components/analytics/FinancialScoreCard";
import CategoryBreakdownChart from "@/components/analytics/CategoryBreakdownChart";
import BudgetActualWidget from "@/components/analytics/BudgetActualWidget";
import { Flame } from "lucide-react";

const DEFAULT_ANALYTICS_CARDS = [
  { id: "net_worth", visible: true },
  { id: "daily_spending", visible: true },
  { id: "spending_chart", visible: true },
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

// Format subtitle periode yang human-readable
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
  const { t, formatShortNumber, formatCurrency } = useAppSettings();
  const queryClient = useQueryClient();
  const [filterPeriod, setFilterPeriod] = useState("6");
  const [customDateRange, setCustomDateRange] = useState(null);
  const [user, setUser] = useState(null);
  const [analyticsCards, setAnalyticsCards] = useState(DEFAULT_ANALYTICS_CARDS);
  const [appSettings, setAppSettings] = useState(null);
  const [showCardManager, setShowCardManager] = useState(false);
  const [gamification, setGamification] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
    }).catch(() => {});
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

  const { data: rawTransactions = [], isLoading: txLoading } = useQuery({
    queryKey: ["transactions_analytics", user?.email],
    queryFn: () => base44.entities.Transaction.filter({ created_by: user.email }, "-date", 2000),
    enabled,
    staleTime: 0,
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

  const { data: investments = [] } = useQuery({
    queryKey: ["investments", user?.email],
    queryFn: () => base44.entities.Investment.filter({ created_by: user.email }),
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const { data: debts = [] } = useQuery({
    queryKey: ["debts", user?.email],
    queryFn: () => base44.entities.Debt.filter({ created_by: user.email }),
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
        // Filter out financial_calendar if still in saved settings
        const filtered = userSettings.analytics_cards.filter(c => c.id !== "financial_calendar");
        setAnalyticsCards(filtered);
      }
    }
  }, [settingsList, user?.settings_id]);

  // Exclude soft-deleted records and recurring TEMPLATES (only generated children represent real activity)
  const transactions = rawTransactions.filter(t => !t.is_deleted && !(t.is_recurring === true && !t.is_recurring_child));
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
    // GlobalCategory entries — looked up by their record id (current source of truth)
    globalCategories.forEach(cat => {
      config[cat.id] = { label: cat.name, emoji: cat.emoji || "📦", color: cat.color || "#8FA4C8" };
    });
    return config;
  }, [customCategories, globalCategories, t]);

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
    if (customDateRange) return customDateRange;
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

  const isPremium = user?.subscription_plan === "premium_monthly" || user?.subscription_plan === "premium_yearly";

  const totalIncome = trendData.reduce((sum, month) => sum + month.Income, 0);
  const periodExpenses = trendData.reduce((sum, month) => sum + month.Expenses, 0);
  const netCashflow = totalIncome - periodExpenses;
  const savingsRate = totalIncome > 0 ? ((netCashflow / totalIncome) * 100).toFixed(1) : 0;

  const periodSubtitle = buildPeriodSubtitle(filterPeriod, customDateRange);

  // Data untuk NanaDailyNarrative
  const streak = gamification?.daily_streak || 0;
  const thisMonthIncome = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.type === "income";
  }).reduce((s, t) => s + t.amount, 0);
  const thisMonthExpenseAmt = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.type === "expense";
  }).reduce((s, t) => s + t.amount, 0);
  const thisSavingRate = thisMonthIncome > 0 ? ((thisMonthIncome - thisMonthExpenseAmt) / thisMonthIncome) * 100 : null;
  const totalSavings = goals.reduce((s, g) => s + (g.current_amount || 0), 0);
  const totalInvestmentValue = investments.reduce((s, i) => s + (i.current_value || 0), 0);
  const totalDebtsAmt = debts.filter(d => d.status === "active").reduce((s, d) => s + (d.remaining_amount || 0), 0);
  const netWorthValue = totalSavings + totalInvestmentValue - totalDebtsAmt;

  const filteredTxForPeriod = transactions.filter(t => {
    const d = new Date(t.date);
    return d >= monthRange.start && d <= monthRange.end;
  });

  // Delta: periode sebelumnya dengan durasi sama
  const periodDurationMs = monthRange.end - monthRange.start;
  const prevPeriodEnd = new Date(monthRange.start.getTime() - 1);
  const prevPeriodStart = new Date(prevPeriodEnd.getTime() - periodDurationMs);
  const prevPeriodTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d >= prevPeriodStart && d <= prevPeriodEnd;
  });
  const prevIncome = prevPeriodTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const prevExpenses = prevPeriodTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const prevNetCashflow = prevIncome - prevExpenses;
  const prevSavingsRate = prevIncome > 0 ? ((prevNetCashflow / prevIncome) * 100) : null;
  const hasPrevData = prevPeriodTx.length > 0;

  return (
    <div className="min-h-screen bg-[#F2F4F7] pb-10">
      {/* Header */}
      <div className="bg-[#0A0A0A] px-5 pt-8 pb-6 sm:pt-10 sm:pb-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[#8FA4C8] text-xs sm:text-sm font-medium">{t('analytics_overview')}</p>
            <div className="flex items-center gap-2 mt-1">
              <h1 className="text-white text-xl sm:text-2xl font-bold">{t('analytics_title')}</h1>
              {/* Streak mini-banner */}
              <Link
                to={createPageUrl("Gamifikasi")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all tap-highlight-fix ${
                  streak > 0
                    ? "bg-[#FF6A00] text-white"
                    : "bg-white/10 text-[#8FA4C8]"
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

        {/* Financial Score Card — paling atas */}
        <FinancialScoreCard user={user} />

        {/* AI Financial Narrative */}
        <AIFinancialNarrative
          trendData={trendData}
          pieData={pieData}
          totalIncome={totalIncome}
          totalExpenses={periodExpenses}
          savingsRate={savingsRate}
          periodLabel={formatPeriodLabel(isPremium ? filterPeriod : "3")}
          periodSubtitle={periodSubtitle}
          goals={goals}
          hasPrevData={hasPrevData}
          prevIncome={prevIncome}
          prevExpenses={prevExpenses}
          prevSavingsRate={prevSavingsRate}
        />

        {/* Net Worth Card */}
        {isCardVisible("net_worth") && (
          isPremium ? (
            <NetWorthCard
              goals={goals}
              investments={investments}
              debts={debts}
              transactions={transactions}
              periodSubtitle={periodSubtitle}
            />
          ) : (
            <PremiumBlurCard title="📊 Kekayaan Bersih (Net Worth)">
              <NetWorthCard goals={goals} investments={investments} debts={debts} transactions={transactions} periodSubtitle={periodSubtitle} />
            </PremiumBlurCard>
          )
        )}

        {/* Daily Spending Card */}
        {isCardVisible("daily_spending") && (
          isPremium ? (
            <DailySpendingCard
              transactions={transactions}
              filterPeriod={filterPeriod}
              customDateRange={customDateRange}
              periodSubtitle={periodSubtitle}
            />
          ) : (
            <PremiumBlurCard title="📈 Pengeluaran Harian">
              <DailySpendingCard transactions={transactions} filterPeriod={filterPeriod} customDateRange={customDateRange} periodSubtitle={periodSubtitle} />
            </PremiumBlurCard>
          )
        )}

        {/* Category Breakdown (Expense + Income tabs) */}
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

        {/* Budget vs Aktual */}
        {isPremium ? (
          <BudgetActualWidget
            budgets={budgets}
            transactions={transactions}
            allCategoriesConfig={allCategoriesConfig}
            periodSubtitle={periodSubtitle}
          />
        ) : (
          <PremiumBlurCard title="💸 Budget vs Aktual">
            <BudgetActualWidget budgets={budgets} transactions={transactions} allCategoriesConfig={allCategoriesConfig} periodSubtitle={periodSubtitle} />
          </PremiumBlurCard>
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