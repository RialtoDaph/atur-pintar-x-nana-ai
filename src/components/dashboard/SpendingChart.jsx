import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { base44 } from "@/api/base44Client";
import { useAppSettings } from "@/components/utils/useAppSettings";

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
  const { formatCurrency } = useAppSettings();
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
      <h2 className="font-bold text-[#1A1A1A] text-base mb-3">Pengeluaran per Kategori</h2>
      <div className="w-full h-36">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={38} outerRadius={65} strokeWidth={0} paddingAngle={2}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 2px 12px rgba(0,0,0,0.1)", fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 space-y-2">
        {data.slice(0, 5).map((d) => (
          <div key={d.key} className="flex items-center gap-2 min-w-0">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-xs text-[#4A5568] flex-1 min-w-0 truncate">{d.emoji} {d.label}</span>
            <span className="text-xs font-semibold text-[#1A1A1A] flex-shrink-0 whitespace-nowrap">{formatCurrency(d.value)}</span>
            <span className="text-[10px] text-[#8FA4C8] flex-shrink-0 w-8 text-right whitespace-nowrap">{total > 0 ? ((d.value / total) * 100).toFixed(0) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}