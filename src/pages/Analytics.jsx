import { useState, useEffect, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import PremiumGate from "@/components/subscription/PremiumGate";
import { useAppSettings } from "@/components/utils/useAppSettings";
import FinancialCalendar from "@/components/analytics/FinancialCalendar";
import DateRangeFilter from "@/components/analytics/DateRangeFilter";
import DailySpendingCard from "@/components/analytics/DailySpendingCard";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart, CartesianGrid
} from "recharts";
import { LayoutList } from "lucide-react";
import AnalyticsCardManager from "@/components/analytics/AnalyticsCardManager";
import NetWorthCard from "@/components/analytics/NetWorthCard";

const DEFAULT_ANALYTICS_CARDS = [
  { id: "daily_spending", visible: true },
  { id: "income_expense_chart", visible: true },
  { id: "spending_trend", visible: true },
  { id: "category_breakdown", visible: true },
  { id: "budget_chart", visible: true },
  { id: "goals_progress", visible: true },
  { id: "investments", visible: true },
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

  useEffect(() => {
    if (user) {
      Promise.all([
        base44.entities.Transaction.filter({ created_by: user.email }, "-date", 300),
        base44.entities.SavingsGoal.filter({ created_by: user.email }, "-created_date"),
        base44.entities.Budget.filter({ created_by: user.email }),
        base44.entities.Investment.filter({ created_by: user.email }),
        base44.entities.Debt.filter({ created_by: user.email }),
        base44.entities.CustomCategory.list("-created_date"),
        base44.entities.AppSettings.list()
      ]).then(([t, g, b, i, d, cc, settings]) => {
        setTransactions(t);
        setGoals(g);
        setBudgets(b);
        setInvestments(i);
        setDebts(d);
        setCustomCategories(cc);
        const userSettings = settings.find(s => s.id === user.settings_id);
        if (userSettings) {
          setAppSettings(userSettings);
          if (userSettings.analytics_cards && userSettings.analytics_cards.length > 0) {
            setAnalyticsCards(userSettings.analytics_cards);
          }
        }
        setLoading(false);
      });
    }
  }, [user]);

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

  const areaChartMonthRange = parseInt(filterPeriod) >= 12 || customDateRange ? monthDiff + 1 : 12;
  const last12Months = Array.from({ length: Math.max(areaChartMonthRange, 12) }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (Math.max(areaChartMonthRange, 12) - 1 - i), 1);
    const month = d.getMonth();
    const year = d.getFullYear();
    const monthTx = transactions.filter(t => {
      const td = new Date(t.date);
      return td.getMonth() === month && td.getFullYear() === year;
    });
    return {
      name: localizedMonths[month],
      Expense: monthTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0),
      Income: monthTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0),
    };
  });

  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthBudgets = budgets.filter(b => b.month === thisMonth);
  const budgetData = monthBudgets.map(b => ({
    name: allCategoriesConfig[b.category]?.label || b.category,
    budget: b.amount,
    spent: thisMonthTx.filter(t => t.category === b.category).reduce((s, t) => s + t.amount, 0),
    color: allCategoriesConfig[b.category]?.color || "#8FA4C8"
  }));

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

        {/* Summary Cards - 4 column grid, responsive to 2 or 1 on mobile */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border-l-4 border-[#00C9A7]">
            <p className="text-[9px] sm:text-[10px] text-[#8FA4C8] font-medium uppercase tracking-widest mb-1.5">{t('analytics_income_label')}</p>
            <p className="text-base sm:text-lg lg:text-xl font-bold text-[#00C9A7]">{formatShortNumber(totalIncome)}</p>
            <p className="text-[9px] sm:text-[10px] text-[#8FA4C8] mt-1">{formatPeriodLabel(filterPeriod)}</p>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border-l-4 border-[#FF6B6B]">
            <p className="text-[9px] sm:text-[10px] text-[#8FA4C8] font-medium uppercase tracking-widest mb-1.5">{t('analytics_expense_label')}</p>
            <p className="text-base sm:text-lg lg:text-xl font-bold text-[#FF6B6B]">{formatShortNumber(periodExpenses)}</p>
            <p className="text-[9px] sm:text-[10px] text-[#8FA4C8] mt-1">{formatPeriodLabel(filterPeriod)}</p>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border-l-4" style={{ borderLeftColor: netCashflow >= 0 ? "#00C9A7" : "#FF6B6B" }}>
            <p className="text-[9px] sm:text-[10px] text-[#8FA4C8] font-medium uppercase tracking-widest mb-1.5">{t('net_flow')}</p>
            <p className="text-base sm:text-lg lg:text-xl font-bold" style={{ color: netCashflow >= 0 ? "#00C9A7" : "#FF6B6B" }}>
              {netCashflow >= 0 ? "+" : ""}{formatShortNumber(netCashflow)}
            </p>
            <p className="text-[9px] sm:text-[10px] text-[#8FA4C8] mt-1">{formatPeriodLabel(filterPeriod)}</p>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border-l-4 border-[#4F7CFF]">
            <p className="text-[9px] sm:text-[10px] text-[#8FA4C8] font-medium uppercase tracking-widest mb-1.5">{t('savings_rate')}</p>
            <p className="text-base sm:text-lg lg:text-xl font-bold text-[#4F7CFF]">{savingsRate}%</p>
            <p className="text-[9px] sm:text-[10px] text-[#8FA4C8] mt-1">{t('of_income')}</p>
          </div>
        </div>

        {/* Calendar Section */}
        <FinancialCalendar transactions={transactions} debts={debts} goals={goals} />

        {/* Daily Spending Card */}
        {(() => {
          const orderedCards = analyticsCards.length > 0 ? analyticsCards : DEFAULT_ANALYTICS_CARDS;
          const dailyVisible = orderedCards.find(c => c.id === "daily_spending")?.visible !== false;

          if (!dailyVisible) return null;

          return (
            <div className="grid grid-cols-1 gap-5">
              <DailySpendingCard
                key="daily_spending"
                transactions={transactions}
                filterPeriod={filterPeriod}
                customDateRange={customDateRange}
              />
            </div>
          );
        })()}

        {/* Charts Grid - 1 on mobile, 2 on desktop */}
        <div className="space-y-5 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0">

          {/* Income vs Expense Bar Chart */}
          {isCardVisible("income_expense_chart") && (
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
            <h2 className="font-bold text-[#0A0A0A] text-base mb-4">{t('analytics_income_vs_expense')}</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trendData} barCategoryGap="30%">
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#8FA4C8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#8FA4C8" }} axisLine={false} tickLine={false} tickFormatter={formatYAxisTick} />
                <Tooltip
                  formatter={(value) => [formatCurrency(value), undefined]}
                  contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }}
                />
                <Bar dataKey="Income" fill="#00C9A7" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Expenses" fill="#FF6B6B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-3 justify-center text-xs">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#00C9A7]"/><span className="text-[#8FA4C8]">{t('analytics_income_label')}</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#FF6B6B]"/><span className="text-[#8FA4C8]">{t('analytics_expense_label')}</span></div>
            </div>
          </div>)}

          {/* Spending Trend Area Chart */}
          {isCardVisible("spending_trend") && (
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
            <h2 className="font-bold text-[#0A0A0A] text-base mb-4">{t('analytics_spending_trend')}</h2>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={last12Months}>
                <defs>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6B6B" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FF6B6B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#8FA4C8" }} />
                <YAxis tick={{ fontSize: 10, fill: "#8FA4C8" }} tickFormatter={formatYAxisTick} />
                <Tooltip formatter={(value) => [formatCurrency(value), undefined]} contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }} />
                <Area type="monotone" dataKey="Expense" stroke="#FF6B6B" fill="url(#colorExpense)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>)}

        </div>

        {/* Category Breakdown */}
        {isCardVisible("category_breakdown") && (
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
          <h2 className="font-bold text-[#0A0A0A] text-base mb-1">{t('analytics_category_breakdown')}</h2>
          <p className="text-xs text-[#8FA4C8] mb-4">{formatPeriodLabel(filterPeriod)}</p>

          {pieData.length === 0 ? (
            <p className="text-center text-[#8FA4C8] text-sm py-8">{t('analytics_no_expense_data')}</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [formatCurrency(value), undefined]}
                    contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="space-y-2 mt-4">
                {pieData.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 min-w-0 text-xs sm:text-sm">
                    <span className="text-base flex-shrink-0">{item.emoji}</span>
                    <span className="font-medium text-[#0A0A0A] flex-1 truncate">{item.name}</span>
                    <div className="w-12 h-1 bg-[#F2F4F7] rounded-full overflow-hidden flex-shrink-0 hidden sm:block">
                      <div className="h-full rounded-full" style={{ width: `${(item.value / totalExpenses) * 100}%`, backgroundColor: item.color }} />
                    </div>
                    <span className="font-semibold text-[#0A0A0A] flex-shrink-0 whitespace-nowrap">{formatCurrency(item.value)}</span>
                    <span className="text-[10px] text-[#8FA4C8] flex-shrink-0 w-6 text-right">{((item.value / totalExpenses) * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>)}

        {/* Budget Section */}
        {isCardVisible("budget_chart") && budgetData.length > 0 && (
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
            <h2 className="font-bold text-[#0A0A0A] text-base mb-4">{t('analytics_budget_vs_spent')}</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={budgetData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#8FA4C8" }} />
                <YAxis tick={{ fontSize: 10, fill: "#8FA4C8" }} tickFormatter={formatYAxisTick} />
                <Tooltip formatter={(value) => [formatCurrency(value), undefined]} contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }} />
                <Bar dataKey="budget" fill="#4F7CFF" radius={[6, 6, 0, 0]} name={t('budget_total')} />
                <Bar dataKey="spent" fill="#FF6B6B" radius={[6, 6, 0, 0]} name={t('budget_spent')} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Net Worth Card */}
        <NetWorthCard
          goals={goals}
          investments={investments}
          debts={debts}
          transactions={transactions}
        />

        {/* Goals Progress */}
        {isCardVisible("goals_progress") && goalsData.length > 0 && (
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
            <h2 className="font-bold text-[#0A0A0A] text-base mb-4">{t('analytics_goals_progress')}</h2>
            <div className="space-y-4">
              {goalsData.map((goal, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-medium text-[#0A0A0A]">{goal.name}</span>
                    <span className="font-semibold text-[#8FA4C8]">{goal.progress.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-[#F2F4F7] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(goal.progress, 100)}%`, backgroundColor: goal.color }}/>
                  </div>
                  <div className="flex justify-between text-xs text-[#8FA4C8]">
                    <span>{formatCurrency(goal.current)}</span>
                    <span>{formatCurrency(goal.target)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Investments */}
        {isCardVisible("investments") && investments.length > 0 && (
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
            <h2 className="font-bold text-[#0A0A0A] text-base mb-4">{t('analytics_investment_summary')}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              <div className="bg-[#F2F4F7] rounded-xl p-3">
                <p className="text-[9px] sm:text-[10px] text-[#8FA4C8] font-medium mb-1">{t('analytics_initial_value')}</p>
                <p className="text-sm sm:text-base font-bold text-[#0A0A0A]">{formatCurrency(totalInvested)}</p>
              </div>
              <div className="bg-[#F2F4F7] rounded-xl p-3">
                <p className="text-[9px] sm:text-[10px] text-[#8FA4C8] font-medium mb-1">{t('analytics_current_value')}</p>
                <p className="text-sm sm:text-base font-bold text-[#0A0A0A]">{formatCurrency(totalCurrentValue)}</p>
              </div>
              <div className={`rounded-xl p-3 ${investmentReturn >= 0 ? "bg-[#00C9A7]/10" : "bg-[#FF6B6B]/10"}`}>
                <p className="text-[9px] sm:text-[10px] text-[#8FA4C8] font-medium mb-1">{t('analytics_return')}</p>
                <p className={`text-sm sm:text-base font-bold ${investmentReturn >= 0 ? "text-[#00C9A7]" : "text-[#FF6B6B]"}`}>
                  {investmentReturn >= 0 ? "+" : ""}{formatCurrency(investmentReturn)}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {investments.map((inv, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-[#F2F4F7] rounded-lg text-xs sm:text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#0A0A0A] truncate">{inv.name}</p>
                    <p className="text-[10px] text-[#8FA4C8]">{inv.type}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="font-bold text-[#0A0A0A]">{formatCurrency(inv.current_value)}</p>
                    <p className={`text-[10px] font-medium ${inv.current_value >= inv.initial_amount ? "text-[#00C9A7]" : "text-[#FF6B6B]"}`}>
                       {inv.current_value >= inv.initial_amount ? "+" : ""}{formatCurrency(inv.current_value - inv.initial_amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
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