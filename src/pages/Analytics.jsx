import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { Loader2, TrendingUp, Target, ArrowUpRight, ArrowDownRight, PieChart as PieChartIcon, BarChart3 } from "lucide-react";
import { formatRupiah } from "@/components/utils/formatRupiah";

const CATEGORIES = {
  food: { label: "Makanan", emoji: "🍔", color: "#FF6B6B" },
  transport: { label: "Transportasi", emoji: "🚗", color: "#4ECDC4" },
  utilities: { label: "Tagihan", emoji: "💡", color: "#45B7D1" },
  entertainment: { label: "Hiburan", emoji: "🎬", color: "#FFA07A" },
  shopping: { label: "Belanja", emoji: "🛍️", color: "#DDA15E" },
  health: { label: "Kesehatan", emoji: "⚕️", color: "#BC6C25" },
  education: { label: "Pendidikan", emoji: "📚", color: "#6A4C93" },
  other: { label: "Lainnya", emoji: "📌", color: "#8E9AAF" },
};

const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export default function AnalyticsPage() {
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [txData, goalData, budgetData, investmentData] = await Promise.all([
          base44.entities.Transaction.list(),
          base44.entities.SavingsGoal.list(),
          base44.entities.Budget.list(),
          base44.entities.Investment.list(),
        ]);
        setTransactions(txData);
        setGoals(goalData);
        setBudgets(budgetData);
        setInvestments(investmentData);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Process 6-month income vs expense trend
  const last6Months = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const monthKey = `${year}-${month}`;
    
    const monthIncome = transactions
      .filter(t => t.type === "income" && t.date?.startsWith(monthKey))
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const monthExpense = transactions
      .filter(t => t.type === "expense" && t.date?.startsWith(monthKey))
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    last6Months.push({
      month: monthNames[date.getMonth()],
      income: monthIncome,
      expense: monthExpense,
    });
  }

  // Process current month category breakdown
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const categoryData = {};

  transactions
    .filter(t => t.type === "expense" && t.date?.startsWith(currentMonth))
    .forEach(t => {
      const cat = t.category || "other";
      categoryData[cat] = (categoryData[cat] || 0) + (t.amount || 0);
    });

  const pieData = Object.entries(categoryData).map(([key, value]) => ({
    name: CATEGORIES[key]?.label || key,
    value,
    color: CATEGORIES[key]?.color || "#8E9AAF",
  }));

  // 12-month spending trend
  const last12Months = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const monthKey = `${year}-${month}`;
    
    const monthExpense = transactions
      .filter(t => t.type === "expense" && t.date?.startsWith(monthKey))
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    last12Months.push({
      month: monthNames[date.getMonth()],
      expense: monthExpense,
    });
  }

  // Budget vs spending comparison
  const budgetComparison = budgets
    .filter(b => b.month === currentMonth)
    .map(b => ({
      category: CATEGORIES[b.category]?.label || b.category,
      budget: b.amount,
      spent: categoryData[b.category] || 0,
    }));

  // Goals progress
  const goalsProgress = goals.map(g => ({
    name: g.name,
    current: g.current_amount || 0,
    target: g.target_amount || 0,
    percentage: Math.round(((g.current_amount || 0) / (g.target_amount || 1)) * 100),
  }));

  // Investments summary
  const investmentsTotal = investments.reduce((sum, inv) => sum + (inv.current_value || 0), 0);
  const investmentsGain = investments.reduce((sum, inv) => sum + ((inv.current_value || 0) - (inv.initial_amount || 0)), 0);
  const gainPercent = investmentsTotal > 0 ? ((investmentsGain / investmentsTotal) * 100).toFixed(2) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF6A00]" />
      </div>
    );
  }

  const totalExpense = Object.values(categoryData).reduce((a, b) => a + b, 0);
  const totalIncome = transactions
    .filter(t => t.type === "income" && t.date?.startsWith(currentMonth))
    .reduce((s, t) => s + (t.amount || 0), 0);
  const netBalance = totalIncome - totalExpense;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-gray-950 dark:via-[#0A0A0A] dark:to-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-20 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="px-8 py-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analitik Keuangan</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Dashboard insight keuangan real-time</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-8 max-w-7xl mx-auto space-y-8">
        {/* Top stats grid - 3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Current month income */}
          <div className="group relative bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-green-400/20 to-green-600/20 rounded-full blur-3xl group-hover:scale-110 transition-transform" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Pemasukan Bulan Ini</p>
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-950 flex items-center justify-center">
                  <ArrowDownRight className="w-5 h-5 text-green-600 dark:text-green-400 rotate-180" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatRupiah(totalIncome)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">+2.5% dari bulan lalu</p>
            </div>
          </div>

          {/* Current month expense */}
          <div className="group relative bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-orange-400/20 to-orange-600/20 rounded-full blur-3xl group-hover:scale-110 transition-transform" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Pengeluaran Bulan Ini</p>
                <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-950 flex items-center justify-center">
                  <ArrowUpRight className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatRupiah(totalExpense)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">-1.2% dari bulan lalu</p>
            </div>
          </div>

          {/* Net balance */}
          <div className="group relative bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-full blur-3xl group-hover:scale-110 transition-transform" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Net Balance</p>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${netBalance >= 0 ? "bg-blue-100 dark:bg-blue-950" : "bg-red-100 dark:bg-red-950"}`}>
                  <TrendingUp className={`w-5 h-5 ${netBalance >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"}`} />
                </div>
              </div>
              <p className={`text-3xl font-bold ${netBalance >= 0 ? "text-gray-900 dark:text-white" : "text-red-600 dark:text-red-400"}`}>{formatRupiah(netBalance)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">{netBalance >= 0 ? "Surplus" : "Deficit"}</p>
            </div>
          </div>
        </div>

        {/* Charts section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 12-month spending trend */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 hover:shadow-md transition-all">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-950 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tren Pengeluaran</h3>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={last12Months} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="month" stroke="#9ca3af" style={{ fontSize: "12px" }} />
                <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
                <Tooltip formatter={(value) => formatRupiah(value)} contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", color: "#fff" }} />
                <Line type="monotone" dataKey="expense" stroke="#FF6A00" strokeWidth={3} dot={{ fill: "#FF6A00", r: 5 }} activeDot={{ r: 7 }} isAnimationActive={true} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 6-month income vs expense */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 hover:shadow-md transition-all">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Perbandingan Aliran Dana</h3>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={last6Months} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="month" stroke="#9ca3af" style={{ fontSize: "12px" }} />
                <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
                <Tooltip formatter={(value) => formatRupiah(value)} contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", color: "#fff" }} />
                <Legend wrapperStyle={{ paddingTop: "20px" }} />
                <Bar dataKey="income" fill="#10B981" name="Pemasukan" radius={[8, 8, 0, 0]} />
                <Bar dataKey="expense" fill="#FF6A00" name="Pengeluaran" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Current month by category */}
        {pieData.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 hover:shadow-md transition-all">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-950 flex items-center justify-center">
                <PieChartIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Pengeluaran Per Kategori</h3>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${formatRupiah(value)}`}
                  outerRadius={100}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatRupiah(value)} contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", color: "#fff" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Budget allocation vs spending */}
        {budgetComparison.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 hover:shadow-md transition-all">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Anggaran vs Pengeluaran</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={budgetComparison} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="category" stroke="#9ca3af" style={{ fontSize: "12px" }} />
                <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
                <Tooltip formatter={(value) => formatRupiah(value)} contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", color: "#fff" }} />
                <Legend wrapperStyle={{ paddingTop: "20px" }} />
                <Bar dataKey="budget" fill="#6A4C93" name="Anggaran" radius={[8, 8, 0, 0]} />
                <Bar dataKey="spent" fill="#FF6A00" name="Pengeluaran" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Savings goals and investments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Savings goals progress */}
          {goalsProgress.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                  <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tujuan Tabungan</h3>
              </div>
              <div className="space-y-5">
                {goalsProgress.map((goal) => (
                  <div key={goal.name} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{goal.name}</span>
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{goal.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all"
                        style={{ width: `${Math.min(goal.percentage, 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {formatRupiah(goal.current)} / {formatRupiah(goal.target)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Investments summary */}
          {investments.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-950 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Portfolio Investasi</h3>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Total</p>
                  <p className="font-bold text-sm text-gray-900 dark:text-white">{formatRupiah(investmentsTotal)}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Gain</p>
                  <p className={`font-bold text-sm ${investmentsGain >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    {formatRupiah(investmentsGain)}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Return</p>
                  <p className={`font-bold text-sm ${gainPercent >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    {gainPercent}%
                  </p>
                </div>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {investments.map((inv) => (
                  <div key={inv.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{inv.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Beli: {formatRupiah(inv.initial_amount)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{formatRupiah(inv.current_value)}</p>
                      <p className={`text-xs font-medium ${inv.current_value >= inv.initial_amount ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
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
    </div>
  );
}