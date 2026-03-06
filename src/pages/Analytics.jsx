import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { formatRupiah } from "@/components/utils/formatRupiah";
import { useAppSettings } from "@/components/utils/useAppSettings";
import FinancialCalendar from "@/components/analytics/FinancialCalendar";
import DateRangeFilter from "@/components/analytics/DateRangeFilter";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, Area, AreaChart, CartesianGrid
} from "recharts";

const CATEGORY_CONFIG = {
  housing:       { label: "Housing",       emoji: "🏠", color: "#4F7CFF" },
  food:          { label: "Food",           emoji: "🍔", color: "#00C9A7" },
  transport:     { label: "Transport",      emoji: "🚗", color: "#F5A623" },
  health:        { label: "Health",         emoji: "❤️", color: "#FF6B6B" },
  entertainment: { label: "Entertainment",  emoji: "🎬", color: "#9B59B6" },
  shopping:      { label: "Shopping",       emoji: "🛍️", color: "#E91E8C" },
  subscriptions: { label: "Subscriptions",  emoji: "📱", color: "#1ABC9C" },
  salary:        { label: "Salary",         emoji: "💼", color: "#27AE60" },
  freelance:     { label: "Freelance",      emoji: "💻", color: "#2ECC71" },
  savings:       { label: "Savings",        emoji: "💰", color: "#3498DB" },
  other:         { label: "Other",          emoji: "📦", color: "#95A5A6" },
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function Analytics() {
  const { t } = useAppSettings();
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState("6");
  const [customDateRange, setCustomDateRange] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      Promise.all([
        base44.entities.Transaction.filter({ created_by: user.email }, "-date", 500),
        base44.entities.SavingsGoal.filter({ created_by: user.email }, "-created_date"),
        base44.entities.Budget.filter({ created_by: user.email }),
        base44.entities.Investment.filter({ created_by: user.email }),
        base44.entities.Debt.filter({ created_by: user.email })
      ]).then(([t, g, b, i, d]) => {
        setTransactions(t);
        setGoals(g);
        setBudgets(b);
        setInvestments(i);
        setDebts(d);
        setLoading(false);
      });
    }
  }, [user]);

  // Handle filter changes
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

  // Build trend data based on selected period
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
      name: MONTHS[month],
      Income: monthTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0),
      Expenses: monthTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    };
  });

  // Build category breakdown for current month expenses
  const thisMonthTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.type === "expense";
  });

  const categoryMap = {};
  thisMonthTx.forEach(t => {
    const cat = t.category || "other";
    categoryMap[cat] = (categoryMap[cat] || 0) + t.amount;
  });

  const pieData = Object.entries(categoryMap)
    .map(([key, value]) => ({
      name: CATEGORY_CONFIG[key]?.label || key,
      value,
      color: CATEGORY_CONFIG[key]?.color || "#8FA4C8",
      emoji: CATEGORY_CONFIG[key]?.emoji || "📦",
    }))
    .sort((a, b) => b.value - a.value);

  const totalExpenses = pieData.reduce((s, d) => s + d.value, 0);

  // Build 12 months trend data for spending analysis
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
      name: MONTHS[month],
      Expense: monthTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0),
      Income: monthTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0),
    };
  });

  // Budget allocation for current month
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthBudgets = budgets.filter(b => b.month === thisMonth);
  const budgetData = monthBudgets.map(b => ({
    name: CATEGORY_CONFIG[b.category]?.label || b.category,
    budget: b.amount,
    spent: thisMonthTx.filter(t => t.category === b.category).reduce((s, t) => s + t.amount, 0),
    color: CATEGORY_CONFIG[b.category]?.color || "#8FA4C8"
  }));

  // Savings goals progress
  const goalsData = goals.map(g => ({
    name: g.name,
    current: g.current_amount || 0,
    target: g.target_amount,
    progress: ((g.current_amount || 0) / (g.target_amount || 1)) * 100,
    color: g.color || "#FF6A00"
  }));

  // Investment summary
  const totalInvested = investments.reduce((s, inv) => s + inv.initial_amount, 0);
  const totalCurrentValue = investments.reduce((s, inv) => s + inv.current_value, 0);
  const investmentReturn = totalCurrentValue - totalInvested;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F4F7] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#00C9A7] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F4F7] pb-10">
      {/* Header */}
      <div className="bg-[#0A0A0A] px-5 pt-10 pb-8">
        <div className="max-w-2xl mx-auto">
          <p className="text-[#8FA4C8] text-sm font-medium">{t('analytics_overview')}</p>
          <h1 className="text-white text-2xl font-bold mt-0.5">{t('analytics_title')}</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 mt-6 space-y-5">

        {/* Date Range Filter */}
        <DateRangeFilter onFilterChange={handleFilterChange} defaultPeriod="6" />

        {/* Financial Calendar */}
        <FinancialCalendar transactions={transactions} debts={debts} goals={goals} />

        {/* Spending Trend */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-[#0A0A0A] text-base mb-4">{t('analytics_spending_trend')}</h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={last12Months}>
              <defs>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF6B6B" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#FF6B6B" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#8FA4C8" }} />
              <YAxis tick={{ fontSize: 11, fill: "#8FA4C8" }} tickFormatter={v => v >= 1000000 ? `${(v/1000000).toFixed(0)}jt` : v >= 1000 ? `${(v/1000).toFixed(0)}rb` : v} />
              <Tooltip formatter={(value) => [formatRupiah(value), undefined]} contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
              <Area type="monotone" dataKey="Expense" stroke="#FF6B6B" fill="url(#colorExpense)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Trend Bar Chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-[#0A0A0A] text-base mb-4">{t('analytics_income_vs_expense')}</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trendData} barCategoryGap="30%">
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#8FA4C8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#8FA4C8" }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000000 ? `${(v/1000000).toFixed(0)}jt` : v >= 1000 ? `${(v/1000).toFixed(0)}rb` : v} />
              <Tooltip
                formatter={(value) => [formatRupiah(value), undefined]}
                contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
              />
              <Bar dataKey="Income" fill="#00C9A7" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Expenses" fill="#FF6B6B" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-5 mt-2 justify-center">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#00C9A7] inline-block"/><span className="text-xs text-[#8FA4C8]">{t('analytics_income_label')}</span></div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#FF6B6B] inline-block"/><span className="text-xs text-[#8FA4C8]">{t('analytics_expense_label')}</span></div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-[#0A0A0A] text-base mb-1">{t('analytics_category_breakdown')}</h2>
          <p className="text-xs text-[#8FA4C8] mb-4">{t('analytics_this_month')}</p>

          {pieData.length === 0 ? (
            <p className="text-center text-[#8FA4C8] text-sm py-10">{t('analytics_no_expense_data')}</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                   formatter={(value) => [formatRupiah(value), undefined]}
                    contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="space-y-2.5 mt-2">
                {pieData.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 min-w-0">
                    <span className="text-base flex-shrink-0">{item.emoji}</span>
                    <span className="text-sm font-medium text-[#0A0A0A] flex-1 min-w-0 truncate">{item.name}</span>
                    <div className="w-16 h-1.5 bg-[#F2F4F7] rounded-full overflow-hidden flex-shrink-0 hidden sm:block">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(item.value / totalExpenses) * 100}%`, backgroundColor: item.color }}
                      />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-[#0A0A0A] flex-shrink-0 whitespace-nowrap">
                      {formatRupiah(item.value)}
                    </span>
                    <span className="text-[10px] text-[#8FA4C8] flex-shrink-0 w-8 text-right whitespace-nowrap">
                      {((item.value / totalExpenses) * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Budget Allocation vs Spent */}
        {budgetData.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-[#0A0A0A] text-base mb-4">{t('analytics_budget_vs_spent')}</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={budgetData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#8FA4C8" }} />
                <YAxis tick={{ fontSize: 11, fill: "#8FA4C8" }} tickFormatter={v => v >= 1000000 ? `${(v/1000000).toFixed(0)}jt` : v >= 1000 ? `${(v/1000).toFixed(0)}rb` : v} />
                <Tooltip formatter={(value) => [formatRupiah(value), undefined]} contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
                <Bar dataKey="budget" fill="#4F7CFF" radius={[6, 6, 0, 0]} name={t('budget_total')} />
                <Bar dataKey="spent" fill="#FF6B6B" radius={[6, 6, 0, 0]} name={t('budget_spent')} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Savings Goals Progress */}
        {goalsData.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-[#0A0A0A] text-base mb-4">{t('analytics_goals_progress')}</h2>
            <div className="space-y-4">
              {goalsData.map((goal, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#0A0A0A]">{goal.name}</span>
                    <span className="text-xs font-semibold text-[#8FA4C8]">{goal.progress.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-[#F2F4F7] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(goal.progress, 100)}%`, backgroundColor: goal.color }}/>
                  </div>
                  <div className="flex justify-between text-xs text-[#8FA4C8]">
                    <span>{formatRupiah(goal.current)}</span>
                    <span>{formatRupiah(goal.target)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Investment Summary */}
        {investments.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-[#0A0A0A] text-base mb-4">{t('analytics_investment_summary')}</h2>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-[#F2F4F7] rounded-xl p-3">
                <p className="text-[10px] text-[#8FA4C8] font-medium mb-1">{t('analytics_initial_value')}</p>
                <p className="text-sm font-bold text-[#0A0A0A]">{formatRupiah(totalInvested)}</p>
              </div>
              <div className="bg-[#F2F4F7] rounded-xl p-3">
                <p className="text-[10px] text-[#8FA4C8] font-medium mb-1">{t('analytics_current_value')}</p>
                <p className="text-sm font-bold text-[#0A0A0A]">{formatRupiah(totalCurrentValue)}</p>
              </div>
              <div className={`rounded-xl p-3 ${investmentReturn >= 0 ? "bg-[#00C9A7]/10" : "bg-[#FF6B6B]/10"}`}>
                <p className="text-[10px] text-[#8FA4C8] font-medium mb-1">{t('analytics_return')}</p>
                <p className={`text-sm font-bold ${investmentReturn >= 0 ? "text-[#00C9A7]" : "text-[#FF6B6B]"}`}>
                  {investmentReturn >= 0 ? "+" : ""}{formatRupiah(investmentReturn)}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {investments.map((inv, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-[#F2F4F7] rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#0A0A0A]">{inv.name}</p>
                    <p className="text-xs text-[#8FA4C8]">{inv.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#0A0A0A]">{formatRupiah(inv.current_value)}</p>
                    <p className={`text-xs font-medium ${inv.current_value >= inv.initial_amount ? "text-[#00C9A7]" : "text-[#FF6B6B]"}`}>
                      {inv.current_value >= inv.initial_amount ? "+" : ""}{formatRupiah(inv.current_value - inv.initial_amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}