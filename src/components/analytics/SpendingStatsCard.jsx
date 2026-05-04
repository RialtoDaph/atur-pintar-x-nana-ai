import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

function fmt(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}jt`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}rb`;
  return n.toLocaleString("id-ID");
}

const MONTHS_ID = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
const COLORS = ["#FF6B35","#4F7CFF","#22C55E","#F59E0B","#A855F7","#EC4899","#14B8A6","#8FA4C8"];

export default function SpendingStatsCard({ transactions, allCategoriesConfig }) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const thisMonthExpenses = useMemo(() =>
    transactions.filter(t => {
      if (t.type !== "expense" || t.is_deleted) return false;
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }), [transactions, currentMonth, currentYear]
  );

  const { top5, trend3M, totalThisMonth, avgDaily, biggest, pieData } = useMemo(() => {
    // Top 5 categories this month
    const catMap = {};
    thisMonthExpenses.forEach(t => {
      const cat = t.category || "other";
      catMap[cat] = (catMap[cat] || 0) + (t.amount || 0);
    });
    const top5Arr = Object.entries(catMap)
      .map(([key, val]) => {
        const cfg = allCategoriesConfig[key] || {};
        const emoji = cfg.emoji ? `${cfg.emoji} ` : "";
        return {
          name: `${emoji}${cfg.label || key}`,
          amount: val,
          color: cfg.color || "#8FA4C8",
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Income vs Expense last 3 months — single pass
    const buckets = {};
    for (let i = 0; i < 3; i++) {
      const d = new Date(currentYear, currentMonth - 2 + i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      buckets[key] = { name: MONTHS_ID[d.getMonth()], Pemasukan: 0, Pengeluaran: 0 };
    }
    for (const t of transactions) {
      if (t.is_deleted) continue;
      const td = new Date(t.date);
      const k = `${td.getFullYear()}-${td.getMonth()}`;
      const bucket = buckets[k];
      if (!bucket) continue;
      if (t.type === "income") bucket.Pemasukan += t.amount || 0;
      else if (t.type === "expense") bucket.Pengeluaran += t.amount || 0;
    }
    const trend3MArr = Object.values(buckets);

    // Avg daily + biggest
    const todayDay = now.getDate();
    const total = thisMonthExpenses.reduce((s, t) => s + (t.amount || 0), 0);
    const avg = todayDay > 0 ? Math.round(total / todayDay) : 0;
    const big = thisMonthExpenses.reduce((max, t) => (!max || t.amount > max.amount) ? t : max, null);

    const pie = top5Arr.map((c, i) => ({ name: c.name, value: c.amount, color: c.color || COLORS[i] }));

    return { top5: top5Arr, trend3M: trend3MArr, totalThisMonth: total, avgDaily: avg, biggest: big, pieData: pie };
  }, [thisMonthExpenses, transactions, allCategoriesConfig, currentMonth, currentYear, now]);

  const todayDay = now.getDate();

  if (thisMonthExpenses.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-[#F2F4F7]">
        <p className="text-xs font-bold text-[#8FA4C8] uppercase tracking-widest">Statistik Pengeluaran</p>
        <p className="text-base font-bold text-[#1A1A1A] mt-0.5">{MONTHS_ID[currentMonth]} {currentYear}</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 p-4">
        <div className="bg-[#F8FAFC] rounded-xl p-3">
          <p className="text-[10px] text-[#8FA4C8] font-semibold uppercase tracking-wider">Rata-rata Harian</p>
          <p className="text-lg font-black text-[#1A1A1A] mt-0.5">Rp {fmt(avgDaily)}</p>
          <p className="text-[10px] text-[#8FA4C8]">{todayDay} hari tercatat</p>
        </div>
        <div className="bg-[#F8FAFC] rounded-xl p-3">
          <p className="text-[10px] text-[#8FA4C8] font-semibold uppercase tracking-wider">Pengeluaran Terbesar</p>
          {biggest ? (
            <>
              <p className="text-lg font-black text-[#EF4444] mt-0.5">Rp {fmt(biggest.amount)}</p>
              <p className="text-[10px] text-[#8FA4C8] truncate">{biggest.note || allCategoriesConfig[biggest.category]?.label || "—"}</p>
            </>
          ) : (
            <p className="text-sm text-[#8FA4C8]">—</p>
          )}
        </div>
      </div>

      {/* Top 5 categories bar chart */}
      {top5.length > 0 && (
        <div className="px-4 pb-4">
          <p className="text-[10px] font-bold text-[#8FA4C8] uppercase tracking-widest mb-2">Top Kategori Bulan Ini</p>
          <div className="space-y-2.5">
            {top5.map((c, i) => {
              const pct = totalThisMonth > 0 ? (c.amount / totalThisMonth) * 100 : 0;
              return (
                <div key={i}>
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-xs text-[#1A1A1A] font-medium truncate max-w-[60%]">{c.name}</span>
                    <span className="text-xs font-bold text-[#1A1A1A]">Rp {fmt(c.amount)}</span>
                  </div>
                  <div className="h-1.5 bg-[#F2F4F7] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: c.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Income vs Expense 3M trend */}
      <div className="px-4 pb-4 border-t border-[#F2F4F7] pt-4">
        <p className="text-[10px] font-bold text-[#8FA4C8] uppercase tracking-widest mb-2">Pemasukan vs Pengeluaran (3 Bulan)</p>
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={trend3M} margin={{ top: 0, right: 4, left: -10, bottom: 0 }} barGap={2}>
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#8FA4C8" }} />
            <YAxis tick={{ fontSize: 9, fill: "#8FA4C8" }} tickFormatter={fmt} width={38} />
            <Tooltip
              formatter={(val, name) => [`Rp ${val.toLocaleString("id-ID")}`, name]}
              contentStyle={{ fontSize: 11, borderRadius: 8, border: "none", boxShadow: "0 2px 12px rgba(0,0,0,0.12)" }}
            />
            <Bar dataKey="Pemasukan" fill="#22C55E" radius={[3,3,0,0]} />
            <Bar dataKey="Pengeluaran" fill="#FF6B35" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-1 justify-center text-[10px] text-[#8FA4C8]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"/>Pemasukan</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#FF6B35] inline-block"/>Pengeluaran</span>
        </div>
      </div>

      {/* Donut breakdown */}
      {pieData.length > 0 && (
        <div className="px-4 pb-4 border-t border-[#F2F4F7] pt-3">
          <p className="text-[10px] font-bold text-[#8FA4C8] uppercase tracking-widest mb-1">Breakdown Pengeluaran</p>
          <div className="flex items-center gap-2">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={52} dataKey="value" paddingAngle={2}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1.5 min-w-0">
              {pieData.map((d, i) => (
                <div key={i} className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-[10px] text-[#1A1A1A] truncate flex-1">{d.name}</span>
                  <span className="text-[10px] font-bold text-[#1A1A1A] flex-shrink-0">
                    {totalThisMonth > 0 ? Math.round((d.value / totalThisMonth) * 100) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}