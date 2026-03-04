import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { formatRupiah } from "@/components/utils/formatRupiah";

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
  const [timeRange, setTimeRange] = useState("3months");
  const [drillDownCategory, setDrillDownCategory] = useState(null);

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
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setLoading(false);
  }

  const categories = { ...DEFAULT_CATEGORIES, ...customCategories };

  const getDateRange = (offset = 0) => {
    const end = new Date();
    const start = new Date();

    if (offset !== 0) {
      end.setMonth(end.getMonth() + offset);
      start.setMonth(start.getMonth() + offset);
    }

    if (timeRange === "1month") start.setMonth(start.getMonth() - 1);
    else if (timeRange === "3months") start.setMonth(start.getMonth() - 3);
    else if (timeRange === "6months") start.setMonth(start.getMonth() - 6);
    else if (timeRange === "1year") start.setFullYear(start.getFullYear() - 1);

    return { start, end };
  };

  const filteredTransactions = transactions.filter((txn) => {
    const txnDate = new Date(txn.date);
    const { start, end } = getDateRange();
    const dateMatch = txnDate >= start && txnDate <= end;
    const typeMatch = !drillDownCategory || txn.category === drillDownCategory;
    return dateMatch && typeMatch;
  });

  const getMonthlyData = () => {
    const monthMap = {};
    const { start } = getDateRange();

    for (let i = 0; i < 6; i++) {
      const date = new Date(start);
      date.setMonth(date.getMonth() + i);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthMap[key] = { income: 0, expense: 0, month: date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }) };
    }

    filteredTransactions.forEach((txn) => {
      const txnDate = new Date(txn.date);
      const key = `${txnDate.getFullYear()}-${String(txnDate.getMonth() + 1).padStart(2, '0')}`;
      if (monthMap[key]) {
        if (txn.type === "income") monthMap[key].income += txn.amount;
        else if (txn.type === "expense") monthMap[key].expense += txn.amount;
      }
    });

    return Object.values(monthMap);
  };

  const getCategoryData = () => {
    const catMap = {};
    const expenses = filteredTransactions.filter((t) => t.type === "expense");

    expenses.forEach((txn) => {
      const catKey = txn.category || "lainnya";
      if (!catMap[catKey]) catMap[catKey] = 0;
      catMap[catKey] += txn.amount;
    });

    return Object.entries(catMap).map(([key, amount]) => {
      const colorMap = {
        makanan: "#FF6B6B",
        transportasi: "#4ECDC4",
        hiburan: "#FFE66D",
        belanja: "#95E1D3",
        tagihan: "#FF6348",
        kesehatan: "#A29BFE",
      };
      return {
        name: categories[key]?.label || key,
        emoji: categories[key]?.emoji || "📦",
        value: amount,
        color: categories[key]?.color || colorMap[key] || "#FF6A00",
        key: key
      };
    }).sort((a, b) => b.value - a.value);
  };

  const stats = (() => {
    const income = filteredTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    const expense = filteredTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
    const savings = filteredTransactions.filter((t) => t.type === "savings").reduce((sum, t) => sum + t.amount, 0);

    return { income, expense, savings, balance: income - expense };
  })();

  const monthlyData = getMonthlyData();
  const categoryData = getCategoryData();

  const getDrillDownTransactions = () => {
    if (!drillDownCategory) return [];
    return filteredTransactions.filter((t) => t.category === drillDownCategory && t.type === "expense").sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F4F7] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#FF6A00] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (drillDownCategory) {
    const drillTxns = getDrillDownTransactions();
    const categoryName = categories[drillDownCategory]?.label || drillDownCategory;
    const categoryEmoji = categories[drillDownCategory]?.emoji || "📦";

    return (
      <div className="min-h-screen bg-[#F2F4F7]">
        <div className="bg-[#0A0A0A] sticky top-0 z-30">
          <div className="max-w-2xl mx-auto px-5 py-4">
            <button
              onClick={() => setDrillDownCategory(null)}
              className="text-[#FF6A00] text-sm font-semibold hover:opacity-80 transition-opacity mb-3"
            >
              ← Kembali
            </button>
            <h1 className="text-white text-xl font-bold">{categoryEmoji} {categoryName}</h1>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-5 py-6">
          <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-5 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#8FA4C8] text-xs">Total Pengeluaran</p>
                <p className="text-[#1A1A1A] font-bold text-2xl mt-1">{formatRupiah(drillTxns.reduce((s, t) => s + t.amount, 0))}</p>
              </div>
              <p className="text-[#8FA4C8] text-xs mt-1">{drillTxns.length} transaksi</p>
            </div>
          </div>
          <div className="space-y-2">
            {drillTxns.length === 0 ?
            <div className="bg-white rounded-2xl p-8 text-center border border-[#E2E8F0]">
                <p className="text-[#8FA4C8]">Tidak ada transaksi dalam kategori ini</p>
              </div> :

            drillTxns.map((txn) =>
            <div key={txn.id} className="bg-white rounded-2xl p-4 border border-[#E2E8F0] flex items-center justify-between">
                  <div>
                    <p className="text-[#1A1A1A] font-medium text-sm">{txn.note || categoryName}</p>
                    <p className="text-[#8FA4C8] text-xs">{new Date(txn.date).toLocaleDateString('id-ID')}</p>
                  </div>
                  <p className="text-[#FF6B6B] font-bold">{formatRupiah(txn.amount)}</p>
                </div>
            )
            }
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F4F7]">
      <div className="bg-[#0A0A0A] sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-5 py-4">
          <div>
            <p className="text-[#8FA4C8] text-xs font-medium">Laporan</p>
            <h1 className="text-white text-xl font-bold mt-1">📊 Analitik Keuangan</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-6 space-y-4 pb-20">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[#8FA4C8] text-xs font-medium block mb-2">Periode</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-white border border-[#E2E8F0] text-[#1A1A1A] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FF6A00]">

              <option value="1month">1 Bulan</option>
              <option value="3months">3 Bulan</option>
              <option value="6months">6 Bulan</option>
              <option value="1year">1 Tahun</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-[#4ECDC4]/20">
            <p className="text-[#4ECDC4] text-xs font-bold uppercase">📈 Pemasukan</p>
            <p className="text-[#1A1A1A] text-base font-bold mt-2">{formatRupiah(stats.income)}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-[#FF6B6B]/20">
            <p className="text-[#FF6B6B] text-xs font-bold uppercase">📉 Pengeluaran</p>
            <p className="text-[#FF6B6B] text-base font-bold mt-2">{formatRupiah(stats.expense)}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-[#A29BFE]/20">
            <p className="text-[#A29BFE] text-xs font-bold uppercase">🏦 Saldo</p>
            <p className="text-[#A29BFE] text-base font-bold mt-2">{formatRupiah(stats.balance)}</p>
          </div>
        </div>

        {monthlyData.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-[#E2E8F0]">
            <h2 className="text-[#1A1A1A] font-bold text-base mb-4">📈 Pemasukan & Pengeluaran</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4ECDC4" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#4ECDC4" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6B6B" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#FF6B6B" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#8FA4C8" style={{ fontSize: '12px' }} />
                <YAxis stroke="#8FA4C8" style={{ fontSize: '12px' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="income" fill="url(#colorIncome)" name="Pemasukan" />
                <Bar dataKey="expense" fill="url(#colorExpense)" name="Pengeluaran" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {categoryData.length > 0 &&
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-[#E2E8F0]">
            <h2 className="text-[#1A1A1A] font-bold text-base mb-4">🥧 Pengeluaran per Kategori</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ emoji, name, percent }) => `${emoji} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={95}
                  innerRadius={0}
                  fill="#8884d8"
                  dataKey="value"
                  onClick={(entry) => setDrillDownCategory(entry.key)}
                  style={{ cursor: "pointer" }}>

                    {categoryData.map((entry, index) =>
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
                  )}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-[#E2E8F0]">
            <h2 className="text-[#1A1A1A] font-bold text-base mb-4">📋 Rincian Kategori</h2>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {categoryData.map((cat, i) => {
                const percent = (cat.value / stats.expense * 100).toFixed(1);
                return (
                  <div key={i} className="flex items-center justify-between p-3 bg-[#F8FAFB] rounded-xl border border-[#E2E8F0] hover:border-[#FF6A00] hover:shadow-sm transition-all cursor-pointer hover:bg-[#FFF8F0]" onClick={() => setDrillDownCategory(cat.key)}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{cat.emoji}</span>
                        <div>
                          <p className="text-[#1A1A1A] font-medium text-sm">{cat.name}</p>
                          <p className="text-[#8FA4C8] text-xs">{percent}%</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[#1A1A1A] font-bold text-sm">{formatRupiah(cat.value)}</p>
                        <p className="text-[#FF6A00] text-xs font-bold">{percent}%</p>
                      </div>
                    </div>
                );
              })}
            </div>
          </div>
        </div>
        }

        {filteredTransactions.length === 0 &&
        <div className="bg-white rounded-2xl shadow-sm p-10 text-center border border-[#E2E8F0]">
            <p className="text-[#8FA4C8] text-sm">Tidak ada data transaksi untuk periode ini</p>
          </div>
        }
      </div>
    </div>
  );
}