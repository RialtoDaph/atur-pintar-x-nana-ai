import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, ComposedChart } from "recharts";
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp } from "lucide-react";
import { createPageUrl } from "@/utils";
import { useAppSettings } from "@/components/utils/useAppSettings";
import { Link } from "react-router-dom";

export default function DailySpendingCard({
  transactions,
  filterPeriod,
  customDateRange,
  periodSubtitle,
}) {
  const { formatShortNumber, formatCurrency } = useAppSettings();
  const [expanded, setExpanded] = useState(true);
  const now = new Date();

  const getMonthRange = () => {
    if (customDateRange) return customDateRange;
    const months = parseInt(filterPeriod);
    return {
      start: new Date(now.getFullYear(), now.getMonth() - (months - 1), 1),
      end: now,
    };
  };

  const monthRange = getMonthRange();

  const monthDiff =
    (monthRange.end.getFullYear() - monthRange.start.getFullYear()) * 12 +
    (monthRange.end.getMonth() - monthRange.start.getMonth());

  const currentMonthlyData = Array.from({ length: monthDiff + 1 }, (_, i) => {
    const d = new Date(monthRange.start.getFullYear(), monthRange.start.getMonth() + i, 1);
    const month = d.getMonth();
    const year = d.getFullYear();
    const monthTx = transactions.filter(t => {
      const td = new Date(t.date);
      return td.getMonth() === month && td.getFullYear() === year && t.type === "expense";
    });
    const total = monthTx.reduce((s, t) => s + t.amount, 0);
    return {
      name: d.toLocaleDateString("id-ID", { month: "short" }),
      value: total,
    };
  });

  const currentTotal = currentMonthlyData.reduce((s, m) => s + m.value, 0);

  // Hitung hari aktual dalam periode yang dipilih (start → end)
  const totalDays = Math.max(
    Math.ceil((monthRange.end - monthRange.start) / (1000 * 60 * 60 * 24)) + 1,
    1
  );
  const currentDailyAvg = currentTotal / totalDays;

  // Previous period untuk trend
  const prevMonthRange = {
    start: new Date(monthRange.start.getFullYear(), monthRange.start.getMonth() - (monthDiff + 1), 1),
    end: new Date(monthRange.start.getFullYear(), monthRange.start.getMonth(), 0),
  };

  const prevMonthDiff =
    (prevMonthRange.end.getFullYear() - prevMonthRange.start.getFullYear()) * 12 +
    (prevMonthRange.end.getMonth() - prevMonthRange.start.getMonth());

  const prevMonthlyData = Array.from({ length: prevMonthDiff + 1 }, (_, i) => {
    const d = new Date(prevMonthRange.start.getFullYear(), prevMonthRange.start.getMonth() + i, 1);
    const month = d.getMonth();
    const year = d.getFullYear();
    const monthTx = transactions.filter(t => {
      const td = new Date(t.date);
      return td.getMonth() === month && td.getFullYear() === year && t.type === "expense";
    });
    return monthTx.reduce((s, t) => s + t.amount, 0);
  });

  const prevTotalDays = Math.max(
    Math.ceil((prevMonthRange.end - prevMonthRange.start) / (1000 * 60 * 60 * 24)) + 1,
    1
  );
  const prevTotal = prevMonthlyData.reduce((s, m) => s + m, 0);
  const prevDailyAvg = prevTotal / prevTotalDays;

  const trendDiff = currentDailyAvg - prevDailyAvg;
  const isTrendPositive = trendDiff >= 0;

  const isEmpty = currentTotal === 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-5 pr-14">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#FF9A3C] flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#1A1A1A]">Pengeluaran Harian</p>
            <p className="text-xs text-[#8FA4C8]">{periodSubtitle || "Rata-rata per hari dalam periode"}</p>
          </div>
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-[#8FA4C8] hover:text-[#1A1A1A] transition-colors tap-highlight-fix"
        >
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {expanded && (
        isEmpty ? (
          <div className="flex flex-col items-center justify-center px-6 py-8 text-center">
            <span className="text-4xl mb-3">📅</span>
            <p className="font-semibold text-[#1A1A1A] text-sm mb-1">Hari-harimu masih kosong di sini!</p>
            <p className="text-xs text-[#8FA4C8] mb-4">Catat pengeluaran pertamamu hari ini dan lihat polamu berkembang</p>
            <Link
              to={createPageUrl("Transactions")}
              className="px-4 py-2 bg-[#FF6A00] text-white text-xs font-semibold rounded-xl hover:bg-[#e55f00] transition-colors"
            >
              Catat Sekarang
            </Link>
          </div>
        ) : (
          <>
            {/* Chart */}
            <div className="px-4 sm:px-5">
              <ResponsiveContainer width="100%" height={180}>
                <ComposedChart data={currentMonthlyData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#8FA4C8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#8FA4C8" }} axisLine={false} tickLine={false} tickFormatter={v => formatShortNumber(v)} />
                  <Tooltip
                    formatter={(value) => [formatCurrency(value), undefined]}
                    contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }}
                  />
                  <Bar dataKey="value" fill="#FF6B6B" radius={[6, 6, 0, 0]} />
                  <Line dataKey="value" stroke="#FF6B6B" strokeDasharray="5,5" dot={false} strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Summary */}
            <div className="px-4 sm:px-5 mt-4 flex items-baseline gap-2">
              <p className="text-sm text-[#8FA4C8]">Ø</p>
              <p className="text-xl sm:text-2xl font-bold text-[#0A0A0A]">{formatShortNumber(currentDailyAvg)}</p>
              <p className="text-sm text-[#8FA4C8]">/Hari</p>
            </div>
            <div className="px-4 sm:px-5 mt-0.5">
              <p className="text-[10px] text-[#8FA4C8]">Rata-rata dari {totalDays} hari periode aktif · Total {formatShortNumber(currentTotal)}</p>
            </div>

            {/* Trend */}
            <div className="px-4 sm:px-5 mt-2 flex items-center gap-2 pb-4 sm:pb-5">
              <div className="flex items-center gap-1">
                {isTrendPositive ? (
                  <TrendingUp className="w-4 h-4 text-[#FF6B6B]" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-[#00C9A7]" />
                )}
                <span className={`text-sm font-semibold ${isTrendPositive ? "text-[#FF6B6B]" : "text-[#00C9A7]"}`}>
                  {isTrendPositive ? "+" : ""}{formatShortNumber(trendDiff)}
                </span>
              </div>
              <span className="text-xs text-[#8FA4C8]">vs periode sebelumnya</span>
            </div>
          </>
        )
      )}
    </div>
  );
}