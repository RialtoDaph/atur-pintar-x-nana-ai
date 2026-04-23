import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { base44 } from "@/api/base44Client";
import { useAppSettings } from "@/components/utils/useAppSettings";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const DEFAULT_CONFIG = {
  housing: { label: "Rumah/Sewa", color: "#4F7CFF", emoji: "🏠" },
  food: { label: "Makanan", color: "#00C9A7", emoji: "🍔" },
  transport: { label: "Transportasi", color: "#F5A623", emoji: "🚗" },
  health: { label: "Kesehatan", color: "#FF6B6B", emoji: "❤️" },
  entertainment: { label: "Hiburan", color: "#9B59B6", emoji: "🎬" },
  shopping: { label: "Belanja", color: "#E91E8C", emoji: "🛍️" },
  subscriptions: { label: "Langganan", color: "#1ABC9C", emoji: "📱" },
  salary: { label: "Gaji", color: "#27AE60", emoji: "💼" },
  freelance: { label: "Freelance", color: "#2ECC71", emoji: "💻" },
  savings: { label: "Tabungan", color: "#3498DB", emoji: "💰" },
  other: { label: "Lainnya", color: "#95A5A6", emoji: "📦" },
};

const INITIAL_VISIBLE = 4;

export default function CategoryBreakdownChart({ transactions, loading, periodSubtitle }) {
  const { formatCurrency } = useAppSettings();
  const [customCats, setCustomCats] = useState([]);
  const [showAllExpense, setShowAllExpense] = useState(false);
  const [showAllIncome, setShowAllIncome] = useState(false);
  const [activeTab, setActiveTab] = useState("expense");

  useEffect(() => {
    Promise.all([
      base44.entities.CustomCategory.list(),
      base44.entities.GlobalCategory.list(),
    ]).then(([custom, global]) => {
      setCustomCats([...custom, ...global]);
    });
  }, []);

  const categoryConfig = { ...DEFAULT_CONFIG };
  customCats.forEach(c => {
    const entry = { label: c.name, color: c.color || "#95A5A6", emoji: c.emoji || "📦" };
    categoryConfig[`custom_${c.id}`] = entry;
    categoryConfig[c.id] = entry;
  });

  // Expense data
  const expenses = transactions.filter(t => t.type === "expense");
  const byExpenseCategory = {};
  expenses.forEach(t => {
    const cat = t.category || "other";
    byExpenseCategory[cat] = (byExpenseCategory[cat] || 0) + t.amount;
  });
  const expenseData = Object.entries(byExpenseCategory)
    .map(([key, value]) => {
      const config = categoryConfig[key] || { label: key, color: "#95A5A6", emoji: "📦" };
      return { key, value, ...config };
    })
    .sort((a, b) => b.value - a.value);
  const expenseTotal = expenseData.reduce((s, d) => s + d.value, 0);

  // Income data
  const incomes = transactions.filter(t => t.type === "income");
  const byIncomeCategory = {};
  incomes.forEach(t => {
    const cat = t.category || "other";
    byIncomeCategory[cat] = (byIncomeCategory[cat] || 0) + t.amount;
  });
  const incomeData = Object.entries(byIncomeCategory)
    .map(([key, value]) => {
      const config = categoryConfig[key] || { label: key, color: "#95A5A6", emoji: "📦" };
      return { key, value, ...config };
    })
    .sort((a, b) => b.value - a.value);
  const incomeTotal = incomeData.reduce((s, d) => s + d.value, 0);

  const activeData = activeTab === "expense" ? expenseData : incomeData;
  const activeTotal = activeTab === "expense" ? expenseTotal : incomeTotal;
  const showAll = activeTab === "expense" ? showAllExpense : showAllIncome;
  const setShowAll = activeTab === "expense" ? setShowAllExpense : setShowAllIncome;

  if (loading) return <div className="bg-white rounded-2xl shadow-sm h-48 animate-pulse" />;

  const renderEmptyState = () => {
    if (activeTab === "expense") {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <span className="text-4xl mb-3">🛍️</span>
          <p className="font-semibold text-[#1A1A1A] text-sm mb-1">Belum ada pengeluaran yang tercatat!</p>
          <p className="text-xs text-[#8FA4C8] mb-4">Catat transaksi pertamamu biar kita tahu kamu paling boros di mana</p>
          <Link to={createPageUrl("Transactions")} className="px-4 py-2 bg-[#FF6A00] text-white text-xs font-semibold rounded-xl hover:bg-[#e55f00] transition-colors">
            Catat Transaksi
          </Link>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <span className="text-4xl mb-3">💰</span>
        <p className="font-semibold text-[#1A1A1A] text-sm mb-1">Belum ada pemasukan yang tercatat!</p>
        <p className="text-xs text-[#8FA4C8] mb-4">Catat income pertamamu yuk</p>
        <Link to={createPageUrl("Transactions")} className="px-4 py-2 bg-[#FF6A00] text-white text-xs font-semibold rounded-xl hover:bg-[#e55f00] transition-colors">
          Catat Pemasukan
        </Link>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-bold text-[#1A1A1A] text-base">Kategori Keuangan</h2>
          {periodSubtitle && <p className="text-xs text-[#8FA4C8] mt-0.5">{periodSubtitle}</p>}
        </div>
        {/* Pill tabs */}
        <div className="flex bg-[#F2F4F7] rounded-full p-0.5">
          <button
            onClick={() => setActiveTab("expense")}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
              activeTab === "expense"
                ? "bg-[#FF6A00] text-white shadow-sm"
                : "text-[#8FA4C8]"
            }`}
          >
            Pengeluaran
          </button>
          <button
            onClick={() => setActiveTab("income")}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
              activeTab === "income"
                ? "bg-[#00C9A7] text-white shadow-sm"
                : "text-[#8FA4C8]"
            }`}
          >
            Pemasukan
          </button>
        </div>
      </div>

      {/* Content with smooth transition */}
      <div key={activeTab} style={{ animation: "fadeIn 0.2s ease" }}>
        {activeData.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            <div className="w-full h-36">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activeData}
                    dataKey="value"
                    cx="50%" cy="50%"
                    innerRadius={38} outerRadius={65}
                    strokeWidth={0} paddingAngle={2}
                  >
                    {activeData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => formatCurrency(v)}
                    contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 2px 12px rgba(0,0,0,0.1)", fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 space-y-2">
              {(showAll ? activeData : activeData.slice(0, INITIAL_VISIBLE)).map((d) => (
                <div key={d.key} className="flex items-center gap-2 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-xs text-[#4A5568] flex-1 min-w-0 truncate">{d.emoji} {d.label}</span>
                  <span className="text-xs font-semibold text-[#1A1A1A] flex-shrink-0 whitespace-nowrap">{formatCurrency(d.value)}</span>
                  <span className="text-[10px] text-[#8FA4C8] flex-shrink-0 w-8 text-right whitespace-nowrap">
                    {activeTotal > 0 ? ((d.value / activeTotal) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              ))}
              {activeData.length > INITIAL_VISIBLE && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="w-full text-center text-xs text-[#FF6A00] font-medium pt-1 hover:opacity-75 transition-opacity"
                >
                  {showAll ? "Sembunyikan ▲" : `Lihat ${activeData.length - INITIAL_VISIBLE} kategori lainnya ▼`}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}