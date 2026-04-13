import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { useAppSettings } from "@/components/utils/useAppSettings";

function formatShort(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}Jt`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}rb`;
  return String(n);
}

const CustomTooltip = ({ active, payload, label, formatCurrency }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-lg border border-[#F0F2F5] p-3 text-xs">
      <p className="font-bold text-[#1A1A1A] mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {formatCurrency(p.value)}</p>
      ))}
    </div>
  );
};

export default function DailyCashflowChart({ transactions, dateFrom, dateTo }) {
  const { formatCurrency } = useAppSettings();

  const data = useMemo(() => {
    const map = {};
    transactions.forEach(tx => {
      if (!tx.date) return;
      const day = tx.date.substring(0, 10);
      if (!map[day]) map[day] = { date: day, income: 0, expense: 0 };
      if (tx.type === "income") map[day].income += tx.amount || 0;
      if (tx.type === "expense") map[day].expense += tx.amount || 0;
    });
    return Object.values(map)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(d => ({
        ...d,
        label: new Date(d.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
      }));
  }, [transactions]);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#F0F2F5]">
        <p className="text-sm font-bold text-[#1A1A1A] mb-4">📊 Cash Flow Harian</p>
        <p className="text-center text-[#8FA4C8] text-sm py-8">Tidak ada data di periode ini</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#F0F2F5]">
      <p className="text-sm font-bold text-[#1A1A1A] mb-4">📊 Cash Flow Harian</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#8FA4C8" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis tickFormatter={formatShort} tick={{ fontSize: 10, fill: "#8FA4C8" }} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
          <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
          <Bar dataKey="income" name="Pemasukan" fill="#22C55E" radius={[3, 3, 0, 0]} maxBarSize={24} />
          <Bar dataKey="expense" name="Pengeluaran" fill="#EF4444" radius={[3, 3, 0, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}