import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { formatRupiah } from "@/components/utils/formatRupiah";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const CATEGORY_CONFIG = {
  housing:       { label: "Housing",       emoji: "🏠", color: "#4F7CFF" },
  food:          { label: "Food",           emoji: "🍔", color: "#FF6B6B" },
  transport:     { label: "Transport",      emoji: "🚗", color: "#F5A623" },
  health:        { label: "Health",         emoji: "❤️", color: "#FF5E8A" },
  entertainment: { label: "Entertainment",  emoji: "🎬", color: "#9B59B6" },
  shopping:      { label: "Shopping",       emoji: "🛍️", color: "#E91E8C" },
  subscriptions: { label: "Subscriptions",  emoji: "📱", color: "#1ABC9C" },
  salary:        { label: "Salary",         emoji: "💼", color: "#00C9A7" },
  freelance:     { label: "Freelance",      emoji: "💻", color: "#34C87A" },
  savings:       { label: "Savings",        emoji: "🐷", color: "#4F7CFF" },
  other:         { label: "Other",          emoji: "📦", color: "#8FA4C8" },
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function Analytics() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Transaction.list("-date", 500).then(t => {
      setTransactions(t);
      setLoading(false);
    });
  }, []);

  // Build last 6 months trend data
  const now = new Date();
  const trendData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
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
          <p className="text-[#8FA4C8] text-sm font-medium">Overview</p>
          <h1 className="text-white text-2xl font-bold mt-0.5">Analytics</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 mt-6 space-y-5">

        {/* Monthly Trend Bar Chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-[#0A0A0A] text-base mb-4">Income vs Expenses (6 months)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trendData} barCategoryGap="30%">
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#8FA4C8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#8FA4C8" }} axisLine={false} tickLine={false} tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0)+"k" : v}`} />
              <Tooltip
                formatter={(value) => [`$${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, undefined]}
                contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
              />
              <Bar dataKey="Income" fill="#FF6A00" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Expenses" fill="#FF6B6B" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-5 mt-2 justify-center">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#00C9A7] inline-block"/><span className="text-xs text-[#8FA4C8]">Income</span></div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#FF6B6B] inline-block"/><span className="text-xs text-[#8FA4C8]">Expenses</span></div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-[#0A0A0A] text-base mb-1">Spending by Category</h2>
          <p className="text-xs text-[#8FA4C8] mb-4">This month</p>

          {pieData.length === 0 ? (
            <p className="text-center text-[#8FA4C8] text-sm py-10">No expense data this month</p>
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
                    formatter={(value) => [`$${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, undefined]}
                    contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="space-y-2.5 mt-2">
                {pieData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{item.emoji}</span>
                      <span className="text-sm font-medium text-[#0A0A0A]">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-1.5 bg-[#F2F4F7] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${(item.value / totalExpenses) * 100}%`, backgroundColor: item.color }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-[#0A0A0A] w-16 text-right">
                        ${item.value.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                      </span>
                      <span className="text-xs text-[#8FA4C8] w-10 text-right">
                        {((item.value / totalExpenses) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}