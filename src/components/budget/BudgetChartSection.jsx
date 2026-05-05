import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Pencil, Trash2 } from "lucide-react";

function fmt(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}jt`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}rb`;
  return n.toLocaleString("id-ID");
}

function getBarColor(pct) {
  if (pct > 100) return "#EF4444";
  if (pct > 80) return "#F97316";
  if (pct > 60) return "#F59E0B";
  return "#22C55E";
}

export default function BudgetChartSection({ budgets, spendingByCategory, getCategoryMeta, formatCurrency, onEdit, onDelete }) {
  const items = useMemo(() => {
    return budgets.map(b => {
      const meta = getCategoryMeta(b.category);
      const spent = spendingByCategory[b.category] || 0;
      const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0;
      return { ...b, meta, spent, pct };
    }).sort((a, b) => b.pct - a.pct);
  }, [budgets, spendingByCategory]);

  const chartData = items.map(i => ({
    name: `${i.meta.emoji} ${i.meta.label}`.slice(0, 12),
    Budget: i.amount,
    Pengeluaran: i.spent,
  }));

  if (budgets.length === 0) return null;

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + (spendingByCategory[b.category] || 0), 0);
  const overallPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Summary header */}
      <div className="px-4 pt-4 pb-3 border-b border-[#F2F4F7]">
        <p className="text-xs font-bold text-[#8FA4C8] uppercase tracking-widest mb-1">Ringkasan Anggaran</p>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-2xl font-black text-[#1A1A1A]">{Math.round(overallPct)}%</p>
            <p className="text-xs text-[#8FA4C8]">dari total anggaran terpakai</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold" style={{ color: getBarColor(overallPct) }}>
              {formatCurrency(totalSpent)}
            </p>
            <p className="text-xs text-[#8FA4C8]">dari {formatCurrency(totalBudget)}</p>
          </div>
        </div>
        {/* Overall bar */}
        <div className="mt-3 h-2.5 bg-[#F2F4F7] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(overallPct, 100)}%`, backgroundColor: getBarColor(overallPct) }}
          />
        </div>
        {/* Legend */}
        <div className="flex gap-4 mt-2 text-[10px] text-[#8FA4C8]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> &lt;60%</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> 60-80%</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500 inline-block" /> 80-100%</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> &gt;100%</span>
        </div>
      </div>

      {/* Per-category bars */}
      <div className="px-4 py-3 space-y-3">
        {items.map(item => (
          <div key={item.id}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-base flex-shrink-0">{item.meta.emoji}</span>
                <span className="text-xs font-semibold text-[#1A1A1A] truncate">{item.meta.label}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <span className="text-xs text-[#8FA4C8]">{formatCurrency(item.spent)}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: getBarColor(item.pct) + "22",
                    color: getBarColor(item.pct),
                  }}
                >
                  {Math.round(item.pct)}%
                </span>
                {onEdit && (
                  <button
                    onClick={() => onEdit(item)}
                    className="text-[#CBD5E0] hover:text-[#FF6A00] transition-colors p-0.5"
                    aria-label="Edit budget"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(item.id)}
                    className="text-[#CBD5E0] hover:text-[#FF6B6B] transition-colors p-0.5"
                    aria-label="Hapus budget"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            <div className="h-2 bg-[#F2F4F7] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(item.pct, 100)}%`,
                  backgroundColor: getBarColor(item.pct),
                }}
              />
            </div>
            <p className="text-[10px] text-[#8FA4C8] mt-0.5">
              Sisa: {item.spent > item.amount
                ? <span className="text-red-500 font-semibold">Over {formatCurrency(item.spent - item.amount)}</span>
                : formatCurrency(item.amount - item.spent)
              }
            </p>
          </div>
        ))}
      </div>

      {/* Grouped Bar Chart */}
      {chartData.length > 0 && (
        <div className="px-3 pb-4 pt-1">
          <p className="text-[10px] font-bold text-[#8FA4C8] uppercase tracking-widest mb-2 px-1">Grafik Anggaran vs Pengeluaran</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} margin={{ top: 0, right: 4, left: -10, bottom: 0 }} barGap={2}>
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#8FA4C8" }} interval={0} />
              <YAxis tick={{ fontSize: 9, fill: "#8FA4C8" }} tickFormatter={fmt} width={40} />
              <Tooltip
                formatter={(val, name) => [`Rp ${val.toLocaleString("id-ID")}`, name]}
                contentStyle={{ fontSize: 11, borderRadius: 8, border: "none", boxShadow: "0 2px 12px rgba(0,0,0,0.12)" }}
              />
              <Bar dataKey="Budget" fill="#E2E8F0" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Pengeluaran" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => {
                  const item = items[i];
                  return <Cell key={i} fill={getBarColor(item?.pct || 0)} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}