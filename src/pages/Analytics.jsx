import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Loader2, TrendingUp, Target } from "lucide-react";
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

  return (
    <div className={`min-h-screen ${false ? "bg-gray-50 dark:bg-gray-950" : "bg-white dark:bg-[#0A0A0A]"}`}>
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="p-8 max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">Analitik Keuangan</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Pantau tren pengeluaran dan insight keuangan Anda</p>
        </div>
      </div>

      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Top stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Current month expense */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 rounded-lg p-6 border border-orange-200 dark:border-orange-800">
            <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Pengeluaran Bulan Ini</p>
            <p className="text-2xl font-bold text-orange-900 dark:text-orange-100 mt-2">
              {formatRupiah(Object.values(categoryData).reduce((a, b) => a + b, 0))}
            </p>
          </div>

          {/* This month income */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg p-6 border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">Pemasukan Bulan Ini</p>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-2">
              {formatRupiah(transactions.filter(t => t.type === "income" && t.date?.startsWith(currentMonth)).reduce((s, t) => s + (t.amount || 0), 0))}
            </p>
          </div>

          {/* Active goals */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Tujuan Tabungan Aktif</p>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-2">{goals.length}</p>
          </div>

          {/* Total investments */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
            <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Nilai Investasi</p>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-2">{formatRupiah(investmentsTotal)}</p>
          </div>
        </div>

        {/* Main charts grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 12-month spending trend */}
          <Card className="dm-card border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Tren Pengeluaran (12 Bulan)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={last12Months}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip formatter={(value) => formatRupiah(value)} contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", color: "#fff" }} />
                  <Area type="monotone" dataKey="expense" stroke="#FF6A00" fill="#FF6A0015" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 6-month income vs expense */}
          <Card className="dm-card border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Pemasukan vs Pengeluaran (6 Bulan)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={last6Months}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip formatter={(value) => formatRupiah(value)} contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", color: "#fff" }} />
                  <Legend />
                  <Bar dataKey="income" fill="#10B981" name="Pemasukan" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="expense" fill="#FF6A00" name="Pengeluaran" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Current month by category */}
        {pieData.length > 0 && (
          <Card className="dm-card border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Pengeluaran Bulan Ini Berdasarkan Kategori</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        )}

        {/* Budget allocation vs spending */}
        {budgetComparison.length > 0 && (
          <Card className="dm-card border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Alokasi Anggaran vs Pengeluaran</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={budgetComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="category" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip formatter={(value) => formatRupiah(value)} contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", color: "#fff" }} />
                  <Legend />
                  <Bar dataKey="budget" fill="#6A4C93" name="Anggaran" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="spent" fill="#FF6A00" name="Pengeluaran" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Savings goals and investments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Savings goals progress */}
          {goalsProgress.length > 0 && (
            <Card className="dm-card border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Progres Tujuan Tabungan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  {goalsProgress.map((goal) => (
                    <div key={goal.name} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{goal.name}</span>
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{goal.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all"
                          style={{ width: `${Math.min(goal.percentage, 100)}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {formatRupiah(goal.current)} / {formatRupiah(goal.target)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Investments summary */}
          {investments.length > 0 && (
            <Card className="dm-card border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  Ringkasan Investasi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total</p>
                    <p className="font-bold text-sm text-gray-900 dark:text-gray-100">{formatRupiah(investmentsTotal)}</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Keuntungan</p>
                    <p className={`font-bold text-sm ${investmentsGain >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {formatRupiah(investmentsGain)}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Return</p>
                    <p className={`font-bold text-sm ${gainPercent >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {gainPercent}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}