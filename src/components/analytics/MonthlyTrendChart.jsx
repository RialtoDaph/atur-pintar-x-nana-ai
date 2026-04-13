import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Dot } from "recharts";
import { useAppSettings } from "@/components/utils/useAppSettings";

function formatShort(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}Jt`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}rb`;
  return String(n);
}

const CustomTooltip = ({ active, payload, label, formatCurrency }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-lg border border-[#F0F2F5] p-3 text-xs min-w-[140px]">
      <p className="font-bold text-[#1A1A1A] mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }} className="flex justify-between gap-3">
          <span>{p.name}</span><span className="font-semibold">{formatCurrency(p.value)}</span>
        </p>
      ))}
    </div>
  );
};

export default function MonthlyTrendChart({ transactions }) {
  const { formatCurrency } = useAppSettings();

  const data = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const month = d.getMonth();
      const year = d.getFullYear();
      const monthTx = transactions.filter(tx => {
        const td = new Date(tx.date);
        return td.getMonth() === month && td.getFullYear() === year;
      });
      return {
        name: d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" }),
        Pemasukan: monthTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0),
        Pengeluaran: monthTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0),
        Tabungan: monthTx.filter(t => t.type === "savings").reduce((s, t) => s + t.amount, 0),
      };
    });
  }, [transactions]);

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#F0F2F5]">
      <p className="text-sm font-bold text-[#1A1A1A] mb-4">📈 Tren Bulanan (6 Bulan)</p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#8FA4C8" }} tickLine={false} axisLine={false} />
          <YAxis tickFormatter={formatShort} tick={{ fontSize: 10, fill: "#8FA4C8" }} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
          <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
          <Line type="monotone" dataKey="Pemasukan" stroke="#22C55E" strokeWidth={2.5} dot={{ r: 4, fill: "#22C55E", strokeWidth: 0 }} activeDot={{ r: 6 }} />
          <Line type="monotone" dataKey="Pengeluaran" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 4, fill: "#EF4444", strokeWidth: 0 }} activeDot={{ r: 6 }} />
          <Line type="monotone" dataKey="Tabungan" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 4, fill: "#3B82F6", strokeWidth: 0 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}