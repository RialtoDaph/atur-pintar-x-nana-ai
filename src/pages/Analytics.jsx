import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatRupiah } from "@/components/utils/formatRupiah";
import { TrendingUp, Zap, AlertCircle } from "lucide-react";

const DEFAULT_CATEGORIES = {
  makanan: { label: "Makanan", emoji: "🍔", color: "#FF6B6B" },
  transportasi: { label: "Transportasi", emoji: "🚗", color: "#4ECDC4" },
  hiburan: { label: "Hiburan", emoji: "🎮", color: "#FFE66D" },
  belanja: { label: "Belanja", emoji: "🛍️", color: "#95E1D3" },
  tagihan: { label: "Tagihan", emoji: "💳", color: "#FF6348" },
  kesehatan: { label: "Kesehatan", emoji: "⚕️", color: "#A29BFE" },
};

export default function Analytics() {
  const [transactions, setTransactions] = useState([]);
  const [customCategories, setCustomCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const txns = await base44.entities.Transaction.list();
      const customs = await base44.entities.CustomCategory.list();

      const categoryMap = {};
      customs.forEach((cat) => {
        categoryMap[`custom_${cat.id}`] = {
          label: cat.name,
          emoji: cat.emoji,
          color: cat.color
        };
      });

      setCustomCategories(categoryMap);
      setTransactions(txns || []);
      
      // Generate insights
      generateInsights(txns || []);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setLoading(false);
  }

  async function generateInsights(txns) {
    setInsightLoading(true);
    try {
      const now = new Date();
      const currentMonth = txns.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });

      const lastMonth = txns.filter(t => {
        const d = new Date(t.date);
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1);
        return d.getMonth() === lastMonthDate.getMonth() && d.getFullYear() === lastMonthDate.getFullYear();
      });

      const currentExpense = currentMonth.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
      const lastExpense = lastMonth.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
      const currentIncome = currentMonth.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);

      const categorySpend = {};
      currentMonth.forEach(t => {
        if (t.type === "expense") {
          categorySpend[t.category || "lainnya"] = (categorySpend[t.category || "lainnya"] || 0) + t.amount;
        }
      });

      const topCategory = Object.entries(categorySpend).sort((a, b) => b[1] - a[1])[0];

      const prompt = `Analyze this financial data and provide 2-3 actionable insights in Indonesian:
- Current month spending: ${currentExpense.toLocaleString()} IDR
- Last month spending: ${lastExpense.toLocaleString()} IDR
- Current month income: ${currentIncome.toLocaleString()} IDR
- Top spending category: ${topCategory?.[0]} with ${topCategory?.[1].toLocaleString()} IDR
- Spending trend: ${currentExpense > lastExpense ? "increased" : "decreased"}

Provide brief, practical insights about their spending patterns and recommendations.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false
      });

      setInsights(result || "");
    } catch (error) {
      console.error("Error generating insights:", error);
      setInsights("Tidak dapat menghasilkan insights pada saat ini");
    }
    setInsightLoading(false);
  }

  const categories = { ...DEFAULT_CATEGORIES, ...customCategories };

  // Get data for current and last month
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const currentMonthTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d >= currentMonthStart && d <= currentMonthEnd;
  });

  const lastMonthTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d >= lastMonthStart && d <= lastMonthEnd;
  });

  // Calculate period stats
  const currentStats = {
    income: currentMonthTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0),
    expense: currentMonthTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    savings: currentMonthTx.filter(t => t.type === "savings").reduce((s, t) => s + t.amount, 0),
  };

  const lastStats = {
    income: lastMonthTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0),
    expense: lastMonthTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    savings: lastMonthTx.filter(t => t.type === "savings").reduce((s, t) => s + t.amount, 0),
  };

  // Get 6-month trend data
  const getTrendData = () => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      
      const monthTx = transactions.filter(t => {
        const td = new Date(t.date);
        return td >= monthStart && td <= monthEnd;
      });

      const expense = monthTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
      const income = monthTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);

      data.push({
        month: d.toLocaleDateString('id-ID', { month: 'short' }),
        income,
        expense,
        balance: income - expense
      });
    }
    return data;
  };

  // Get category trend data
  const getCategoryTrendData = () => {
    const categoryData = {};
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const monthKey = d.toLocaleDateString('id-ID', { month: 'short' });
      
      const monthTx = transactions.filter(t => {
        const td = new Date(t.date);
        return td >= monthStart && td <= monthEnd && t.type === "expense";
      });

      if (!categoryData[monthKey]) categoryData[monthKey] = {};
      
      monthTx.forEach(t => {
        const cat = t.category || "lainnya";
        categoryData[monthKey][cat] = (categoryData[monthKey][cat] || 0) + t.amount;
      });
    }

    return Object.entries(categoryData).map(([month, cats]) => ({
      month,
      ...cats
    }));
  };

  const trendData = getTrendData();
  const categoryTrendData = getCategoryTrendData();

  // Get current month category breakdown
  const getCurrentCategoryData = () => {
    const catMap = {};
    currentMonthTx.filter(t => t.type === "expense").forEach(t => {
      const catKey = t.category || "lainnya";
      if (!catMap[catKey]) catMap[catKey] = 0;
      catMap[catKey] += t.amount;
    });

    return Object.entries(catMap).map(([key, amount]) => ({
      name: categories[key]?.label || key,
      emoji: categories[key]?.emoji || "📦",
      value: amount,
      color: categories[key]?.color || "#FF6A00",
      key
    })).sort((a, b) => b.value - a.value);
  };

  const categoryData = getCurrentCategoryData();

  // Calculate percentage changes
  const expenseChange = lastStats.expense > 0 
    ? ((currentStats.expense - lastStats.expense) / lastStats.expense * 100).toFixed(1)
    : 0;

  const incomeChange = lastStats.income > 0 
    ? ((currentStats.income - lastStats.income) / lastStats.income * 100).toFixed(1)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F4F7] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#FF6A00] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F4F7]">
      {/* Header */}
      <div className="bg-[#0A0A0A] sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-5 py-4">
          <p className="text-[#8FA4C8] text-xs font-medium">Laporan</p>
          <h1 className="text-white text-xl font-bold mt-1">📊 Analitik Keuangan</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-6 space-y-4 pb-20">
        
        {/* AI Insights */}
        {insights && (
          <div className="bg-gradient-to-br from-[#FFF8F0] to-white rounded-2xl shadow-sm p-4 border-2 border-[#FF6A00]/20">
            <div className="flex gap-3">
              <Zap className="w-5 h-5 text-[#FF6A00] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[#FF6A00] text-sm mb-1">💡 Insight Cerdas</p>
                <p className="text-[#1A1A1A] text-xs leading-relaxed">{insightLoading ? "Menganalisis data..." : insights}</p>
              </div>
            </div>
          </div>
        )}

        {/* Period Comparison */}
        <div className="space-y-3">
          <h2 className="text-[#1A1A1A] font-bold text-base px-1">📅 Perbandingan Periode</h2>
          <div className="grid grid-cols-2 gap-3">
            {/* Current Month */}
            <div className="bg-white rounded-2xl shadow-sm p-4 border border-[#E2E8F0]">
              <p className="text-[#8FA4C8] text-xs font-medium mb-3">Bulan Ini</p>
              <div className="space-y-2">
                <div>
                  <p className="text-[#4ECDC4] text-xs font-bold">📈 Pemasukan</p>
                  <p className="text-[#1A1A1A] font-bold text-sm">{formatRupiah(currentStats.income)}</p>
                  {incomeChange !== "0.0" && (
                    <p className={`text-xs mt-1 ${incomeChange > 0 ? "text-[#FF6B6B]" : "text-[#34C87A]"}`}>
                      {incomeChange > 0 ? "↑" : "↓"} {Math.abs(incomeChange)}%
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-[#FF6B6B] text-xs font-bold">📉 Pengeluaran</p>
                  <p className="text-[#1A1A1A] font-bold text-sm">{formatRupiah(currentStats.expense)}</p>
                  {expenseChange !== "0.0" && (
                    <p className={`text-xs mt-1 ${expenseChange > 0 ? "text-[#FF6B6B]" : "text-[#34C87A]"}`}>
                      {expenseChange > 0 ? "↑" : "↓"} {Math.abs(expenseChange)}%
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Last Month */}
            <div className="bg-white rounded-2xl shadow-sm p-4 border border-[#E2E8F0]">
              <p className="text-[#8FA4C8] text-xs font-medium mb-3">Bulan Lalu</p>
              <div className="space-y-2">
                <div>
                  <p className="text-[#4ECDC4] text-xs font-bold">📈 Pemasukan</p>
                  <p className="text-[#1A1A1A] font-bold text-sm">{formatRupiah(lastStats.income)}</p>
                </div>
                <div>
                  <p className="text-[#FF6B6B] text-xs font-bold">📉 Pengeluaran</p>
                  <p className="text-[#1A1A1A] font-bold text-sm">{formatRupiah(lastStats.expense)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 6-Month Trend */}
        {trendData.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-[#E2E8F0]">
            <h2 className="text-[#1A1A1A] font-bold text-base mb-4">📈 Tren 6 Bulan Terakhir</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#8FA4C8" style={{ fontSize: '12px' }} />
                <YAxis stroke="#8FA4C8" style={{ fontSize: '12px' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#4ECDC4" name="Pemasukan" strokeWidth={2} dot={{ fill: '#4ECDC4', r: 4 }} />
                <Line type="monotone" dataKey="expense" stroke="#FF6B6B" name="Pengeluaran" strokeWidth={2} dot={{ fill: '#FF6B6B', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Category Trend */}
        {categoryTrendData.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-[#E2E8F0]">
            <h2 className="text-[#1A1A1A] font-bold text-base mb-4">📊 Tren Pengeluaran per Kategori</h2>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={categoryTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#8FA4C8" style={{ fontSize: '12px' }} />
                <YAxis stroke="#8FA4C8" style={{ fontSize: '12px' }} />
                <Tooltip />
                <Legend />
                {Object.keys(categories).slice(0, 5).map((cat) => (
                  <Bar key={cat} dataKey={cat} fill={categories[cat]?.color} name={categories[cat]?.label} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Current Month Category Breakdown */}
        {categoryData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-[#E2E8F0]">
              <h2 className="text-[#1A1A1A] font-bold text-base mb-4">🥧 Pengeluaran Bulan Ini</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ emoji, percent }) => `${emoji} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={95}
                    fill="#8884d8"
                    dataKey="value"
                    style={{ cursor: "pointer" }}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 border border-[#E2E8F0]">
              <h2 className="text-[#1A1A1A] font-bold text-base mb-4">📋 Rincian Kategori</h2>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {categoryData.map((cat) => {
                  const percent = currentStats.expense > 0 ? ((cat.value / currentStats.expense) * 100).toFixed(1) : "0";
                  return (
                    <div key={cat.key} className="flex items-center justify-between p-3 bg-[#F8FAFB] rounded-lg border border-[#E2E8F0] hover:border-[#FF6A00] transition-all">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{cat.emoji}</span>
                        <div>
                          <p className="text-[#1A1A1A] font-medium text-sm">{cat.name}</p>
                          <p className="text-[#8FA4C8] text-xs">{percent}%</p>
                        </div>
                      </div>
                      <p className="text-[#1A1A1A] font-bold text-sm">{formatRupiah(cat.value)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {transactions.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center border border-[#E2E8F0]">
            <AlertCircle className="w-10 h-10 text-[#8FA4C8] mx-auto mb-3" />
            <p className="text-[#8FA4C8] text-sm">Belum ada transaksi untuk dianalisis</p>
          </div>
        )}

      </div>
    </div>
  );
}