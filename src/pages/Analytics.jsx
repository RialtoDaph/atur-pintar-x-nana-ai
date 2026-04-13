import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppSettings } from "@/components/utils/useAppSettings";
import { Calendar, ChevronDown } from "lucide-react";

import SummaryCards from "@/components/analytics/SummaryCards";
import DailyCashflowChart from "@/components/analytics/DailyCashflowChart";
import MonthlyTrendChart from "@/components/analytics/MonthlyTrendChart";
import CategoryBreakdown from "@/components/analytics/CategoryBreakdown";
import BudgetVsActual from "@/components/analytics/BudgetVsActual";
import NetWorthSnapshot from "@/components/analytics/NetWorthSnapshot";
import TopTransactions from "@/components/analytics/TopTransactions";
import SmartInsights from "@/components/analytics/SmartInsights";

const PERIOD_OPTIONS = [
  { label: "Bulan ini", value: "this_month" },
  { label: "3 Bulan Terakhir", value: "3" },
  { label: "6 Bulan Terakhir", value: "6" },
  { label: "Tahun ini", value: "this_year" },
  { label: "Custom", value: "custom" },
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
  { key: "cicilan", i18nKey: "cat_cicilan", emoji: "💳", color: "#EF4444" },
];

function getDateRange(period, customFrom, customTo) {
  const now = new Date();
  if (period === "this_month") {
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1),
      to: now,
    };
  }
  if (period === "this_year") {
    return {
      from: new Date(now.getFullYear(), 0, 1),
      to: now,
    };
  }
  if (period === "custom" && customFrom && customTo) {
    return { from: new Date(customFrom), to: new Date(customTo + "T23:59:59") };
  }
  const months = parseInt(period) || 6;
  return {
    from: new Date(now.getFullYear(), now.getMonth() - (months - 1), 1),
    to: now,
  };
}

export default function Analytics() {
  const { t, formatCurrency } = useAppSettings();
  const queryClient = useQueryClient();

  const [period, setPeriod] = useState("this_month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => setUser(u)).catch(() => {});
  }, []);

  const enabled = !!user?.email;

  const { data: rawTransactions = [], isLoading: txLoading } = useQuery({
    queryKey: ["transactions_analytics", user?.email],
    queryFn: () => base44.entities.Transaction.filter({ created_by: user.email }, "-date", 500),
    enabled,
    staleTime: 0,
  });

  const { data: goals = [] } = useQuery({
    queryKey: ["goals", user?.email],
    queryFn: () => base44.entities.SavingsGoal.filter({ created_by: user.email }),
    enabled,
    staleTime: 2 * 60 * 1000,
  });

  const { data: budgets = [] } = useQuery({
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

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts", user?.email],
    queryFn: () => base44.entities.Account.filter({ created_by: user.email }),
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const { data: customCategories = [] } = useQuery({
    queryKey: ["custom_categories"],
    queryFn: () => base44.entities.CustomCategory.list("-created_date"),
    enabled,
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (!user?.email) return;
    const unsub = base44.entities.Transaction.subscribe(() =>
      queryClient.invalidateQueries({ queryKey: ["transactions_analytics", user.email] })
    );
    return unsub;
  }, [user?.email]);

  // Clean transactions: exclude deleted, recurring templates, and opening_balance
  const transactions = useMemo(() =>
    rawTransactions.filter(tx =>
      !tx.is_deleted &&
      !(tx.is_recurring === true && !tx.is_recurring_child) &&
      tx.category !== "opening_balance"
    ),
    [rawTransactions]
  );

  const allCategoriesConfig = useMemo(() => {
    const config = {};
    DEFAULT_CATEGORIES_FLAT.forEach(cat => {
      config[cat.key] = { label: t(cat.i18nKey) || cat.key, emoji: cat.emoji, color: cat.color };
    });
    customCategories.forEach(cat => {
      config[`custom_${cat.id}`] = { label: cat.name, emoji: cat.emoji, color: cat.color || "#8FA4C8" };
    });
    return config;
  }, [customCategories, t]);

  const dateRange = getDateRange(period, customFrom, customTo);

  const periodTx = useMemo(() =>
    transactions.filter(tx => {
      if (!tx.date) return false;
      const d = new Date(tx.date);
      return d >= dateRange.from && d <= dateRange.to;
    }),
    [transactions, dateRange]
  );

  // Apply category filter for display in category breakdown
  const filteredForCategory = selectedCategory
    ? periodTx.filter(tx => tx.category === selectedCategory)
    : periodTx;

  const totalIncome = useMemo(() =>
    periodTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0),
    [periodTx]
  );
  const totalExpense = useMemo(() =>
    periodTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    [periodTx]
  );
  const totalSavings = useMemo(() =>
    periodTx.filter(t => t.type === "savings").reduce((s, t) => s + t.amount, 0),
    [periodTx]
  );

  const periodLabel = PERIOD_OPTIONS.find(o => o.value === period)?.label || period;
  const loading = txLoading;

  return (
    <div className="min-h-screen bg-[#F2F4F7] pb-10">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#0A0A0A] to-[#0d0d0d] px-5 pt-10 pb-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-[#8FA4C8] text-sm font-medium">Analitik Keuangan</p>
          <h1 className="text-white text-2xl font-bold mt-0.5">Statistik & Insight</h1>

          {/* Period Filter */}
          <div className="mt-4 relative">
            <button
              onClick={() => setShowPeriodMenu(v => !v)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white text-sm font-semibold transition-colors"
            >
              <Calendar className="w-4 h-4" />
              {periodLabel}
              <ChevronDown className={`w-4 h-4 transition-transform ${showPeriodMenu ? "rotate-180" : ""}`} />
            </button>
            {showPeriodMenu && (
              <div className="absolute top-full mt-2 left-0 z-30 bg-white rounded-2xl shadow-xl border border-[#F0F2F5] overflow-hidden w-56">
                {PERIOD_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setPeriod(opt.value); setShowPeriodMenu(false); }}
                    className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-[#F8FAFC] ${period === opt.value ? "text-[#F97316] font-bold bg-[#FFF7ED]" : "text-[#1A1A1A]"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Custom Date Range */}
          {period === "custom" && (
            <div className="mt-3 flex gap-2">
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                className="flex-1 px-3 py-2 bg-white/10 text-white text-xs rounded-xl border border-white/20 outline-none" />
              <span className="text-white/60 self-center text-xs">s/d</span>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                className="flex-1 px-3 py-2 bg-white/10 text-white text-xs rounded-xl border border-white/20 outline-none" />
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-4 space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* 1. Summary Cards */}
            <SummaryCards income={totalIncome} expense={totalExpense} savings={totalSavings} />

            {/* 2. Smart Insights */}
            <SmartInsights
              transactions={transactions}
              budgets={budgets}
              goals={goals}
              allCategoriesConfig={allCategoriesConfig}
            />

            {/* 3. Daily Cash Flow */}
            <DailyCashflowChart transactions={periodTx} />

            {/* 4. Monthly Trend (always 6 months) */}
            <MonthlyTrendChart transactions={transactions} />

            {/* 5. Category Breakdown */}
            <CategoryBreakdown
              expenses={periodTx.filter(tx => tx.type === "expense")}
              allCategoriesConfig={allCategoriesConfig}
              onCategoryClick={setSelectedCategory}
              selectedCategory={selectedCategory}
            />

            {/* Filtered transactions by category (if selected) */}
            {selectedCategory && (
              <TopTransactions
                transactions={filteredForCategory}
                allCategoriesConfig={allCategoriesConfig}
              />
            )}

            {/* 6. Budget vs Actual */}
            <BudgetVsActual
              budgets={budgets}
              transactions={transactions}
              allCategoriesConfig={allCategoriesConfig}
            />

            {/* 7. Net Worth */}
            <NetWorthSnapshot
              accounts={accounts}
              investments={investments}
              debts={debts}
            />

            {/* 8. Top 5 Transactions */}
            {!selectedCategory && (
              <TopTransactions
                transactions={periodTx}
                allCategoriesConfig={allCategoriesConfig}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}