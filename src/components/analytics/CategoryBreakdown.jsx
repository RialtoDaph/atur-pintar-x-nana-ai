import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useAppSettings } from "@/components/utils/useAppSettings";

const CustomTooltip = ({ active, payload, formatCurrency }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white rounded-xl shadow-lg border border-[#F0F2F5] p-3 text-xs">
      <p className="font-bold" style={{ color: d.payload.color }}>{d.payload.emoji} {d.name}</p>
      <p className="text-[#1A1A1A] font-semibold">{formatCurrency(d.value)}</p>
    </div>
  );
};

export default function CategoryBreakdown({ expenses, allCategoriesConfig, onCategoryClick, selectedCategory }) {
  const { formatCurrency } = useAppSettings();

  const pieData = useMemo(() => {
    const map = {};
    expenses.forEach(tx => {
      const cat = tx.category || "other";
      map[cat] = (map[cat] || 0) + (tx.amount || 0);
    });
    return Object.entries(map)
      .map(([key, value]) => ({
        key,
        name: allCategoriesConfig[key]?.label || key,
        value,
        color: allCategoriesConfig[key]?.color || "#8FA4C8",
        emoji: allCategoriesConfig[key]?.emoji || "📦",
      }))
      .sort((a, b) => b.value - a.value);
  }, [expenses, allCategoriesConfig]);

  const total = pieData.reduce((s, d) => s + d.value, 0);

  if (pieData.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#F0F2F5]">
        <p className="text-sm font-bold text-[#1A1A1A] mb-2">🛍️ Breakdown Pengeluaran</p>
        <p className="text-center text-[#8FA4C8] text-sm py-8">Tidak ada pengeluaran di periode ini</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#F0F2F5]">
      <p className="text-sm font-bold text-[#1A1A1A] mb-4">🛍️ Breakdown Pengeluaran</p>
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="w-48 h-48 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={2} dataKey="value">
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color}
                    opacity={selectedCategory && selectedCategory !== entry.key ? 0.4 : 1}
                    style={{ cursor: "pointer" }}
                    onClick={() => onCategoryClick?.(selectedCategory === entry.key ? null : entry.key)}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 w-full space-y-2 max-h-60 overflow-y-auto">
          {pieData.map((d) => {
            const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : 0;
            const isSelected = selectedCategory === d.key;
            return (
              <button
                key={d.key}
                onClick={() => onCategoryClick?.(isSelected ? null : d.key)}
                className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl transition-all text-left ${
                  isSelected ? "ring-2 ring-offset-1" : "hover:bg-[#F8FAFC]"
                }`}
                style={isSelected ? { ringColor: d.color } : {}}
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                  style={{ backgroundColor: d.color + "20" }}>
                  {d.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-xs font-semibold text-[#1A1A1A] truncate">{d.name}</p>
                    <p className="text-xs font-bold text-[#1A1A1A] flex-shrink-0">{formatCurrency(d.value)}</p>
                  </div>
                  <div className="h-1.5 bg-[#F2F4F7] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: d.color }} />
                  </div>
                </div>
                <span className="text-[10px] font-bold flex-shrink-0" style={{ color: d.color }}>{pct}%</span>
              </button>
            );
          })}
        </div>
      </div>
      {selectedCategory && (
        <button onClick={() => onCategoryClick?.(null)}
          className="mt-3 text-xs text-[#F97316] font-semibold underline underline-offset-2">
          Hapus filter kategori
        </button>
      )}
    </div>
  );
}