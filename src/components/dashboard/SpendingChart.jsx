import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { base44 } from "@/api/base44Client";
import { formatRupiah } from "@/components/utils/formatRupiah";

const DEFAULT_CONFIG = {
  housing: { label: "Housing", color: "#4F7CFF", emoji: "🏠" },
  food: { label: "Food", color: "#00C9A7", emoji: "🍔" },
  transport: { label: "Transport", color: "#F5A623", emoji: "🚗" },
  health: { label: "Health", color: "#FF6B6B", emoji: "❤️" },
  entertainment: { label: "Entertainment", color: "#9B59B6", emoji: "🎬" },
  shopping: { label: "Shopping", color: "#E91E8C", emoji: "🛍️" },
  subscriptions: { label: "Subscriptions", color: "#1ABC9C", emoji: "📱" },
  salary: { label: "Salary", color: "#27AE60", emoji: "💼" },
  freelance: { label: "Freelance", color: "#2ECC71", emoji: "💻" },
  savings: { label: "Savings", color: "#3498DB", emoji: "💰" },
  other: { label: "Other", color: "#95A5A6", emoji: "📦" },
};

export default function SpendingChart({ transactions, loading }) {
  const [customCats, setCustomCats] = useState([]);

  useEffect(() => {
    base44.entities.CustomCategory.list().then(setCustomCats);
  }, []);

  const categoryConfig = { ...DEFAULT_CONFIG };
  customCats.forEach(c => {
    categoryConfig[`custom_${c.id}`] = { label: c.name, color: c.color || "#888", emoji: c.emoji };
  });

  const expenses = transactions.filter(t => t.type === "expense");
  const byCategory = {};
  expenses.forEach(t => {
    const cat = t.category || "other";
    byCategory[cat] = (byCategory[cat] || 0) + t.amount;
  });

  const data = Object.entries(byCategory)
    .map(([key, value]) => {
      const config = categoryConfig[key] || { label: key, color: "#95A5A6", emoji: "📦" };
      return { key, value, ...config };
    })
    .sort((a, b) => b.value - a.value);

  const total = data.reduce((s, d) => s + d.value, 0);

  if (loading) return <div className="bg-white rounded-2xl shadow-sm h-48 animate-pulse" />;
  if (data.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <h2 className="font-bold text-[#1A1A1A] text-base mb-4">Spending by Category</h2>
      <div className="flex items-center gap-4">
        <div className="w-28 h-28 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={28} outerRadius={52} strokeWidth={0}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2">
          {data.slice(0, 5).map((d) => (
            <div key={d.key} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-xs text-[#4A5568]">{d.emoji} {d.label}</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-[#1A1A1A]">${d.value.toFixed(0)}</span>
                <span className="text-[10px] text-[#8FA4C8] ml-1">{total > 0 ? ((d.value / total) * 100).toFixed(0) : 0}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}