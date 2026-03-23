import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, ComposedChart } from "recharts";
import { ChevronRight, TrendingUp, TrendingDown, ChevronDown, ChevronUp } from "lucide-react";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { formatRupiah } from "@/components/utils/formatRupiah";
import { useAppSettings } from "@/components/utils/useAppSettings";

export default function DailySpendingCard({
  transactions,
  filterPeriod,
  customDateRange,
  onNavigateToDetail
}) {
  const navigate = useNavigate();
  const { formatShortNumber } = useAppSettings();
  const [expanded, setExpanded] = useState(true);
  const now = new Date();

  const getMonthRange = () => {
    if (customDateRange) {
      return customDateRange;
    }
    const months = parseInt(filterPeriod);
    return {
      start: new Date(now.getFullYear(), now.getMonth() - (months - 1), 1),
      end: now,
    };
  };

  const monthRange = getMonthRange();

  // Get all months in range
  const monthDiff =
    (monthRange.end.getFullYear() - monthRange.start.getFullYear()) * 12 +
    (monthRange.end.getMonth() - monthRange.start.getMonth());

  // Calculate monthly expenses for current period
  const currentMonthlyData = Array.from({ length: monthDiff + 1 }, (_, i) => {
    const d = new Date(monthRange.start.getFullYear(), monthRange.start.getMonth() + i, 1);
    const month = d.getMonth();
    const year = d.getFullYear();
    const monthTx = transactions.filter(t => {
      const td = new Date(t.date);
      return (
        td.getMonth() === month &&
        td.getFullYear() === year &&
        t.type === "expense"
      );
    });
    const total = monthTx.reduce((s, t) => s + t.amount, 0);
    return {
      name: d.toLocaleDateString("id-ID", { month: "short" }),
      value: total,
      label: d.toLocaleDateString("id-ID", { month: "2-digit", year: "2-digit" })
    };
  });

  // Calculate daily average for current period
  const fullPeriodEnd = new Date(monthRange.end.getFullYear(), monthRange.end.getMonth() + 1, 0);
  const periodStart = monthRange.start;
  const totalDays = Math.max(
    Math.ceil((fullPeriodEnd - periodStart) / (1000 * 60 * 60 * 24)) + 1,
    1
  );
  const currentTotal = currentMonthlyData.reduce((s, m) => s + m.value, 0);
  const currentDailyAvg = currentTotal / totalDays;

  // Calculate previous period for trend
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
      return (
        td.getMonth() === month &&
        td.getFullYear() === year &&
        t.type === "expense"
      );
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

  const handleNavigate = () => {
    navigate(`${createPageUrl("SpendingDetail")}?type=daily&period=${filterPeriod}`);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#FF9A3C] flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#1A1A1A]">Pengeluaran Harian</p>
            <p className="text-xs text-[#8FA4C8]">Rata-rata per hari dalam periode</p>
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
        <>
          {/* Chart */}
          <div className="px-4 sm:px-5">
            <ResponsiveContainer width="100%" height={180}>
              <ComposedChart data={currentMonthlyData}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#8FA4C8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#8FA4C8" }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value) => [formatRupiah(value), undefined]}
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
      )}
    </div>
  );
}