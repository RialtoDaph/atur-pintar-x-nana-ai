import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAppSettings } from "@/components/utils/useAppSettings";

const DAY_LABELS = ["M", "S", "S", "R", "K", "J", "S"];
const MONTHS_ID = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

export default function SpendingHeatmapCard({ transactions = [], embedded = false }) {
  const { formatCurrency } = useAppSettings();
  const now = new Date();
  const [viewMonth, setViewMonth] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selectedDay, setSelectedDay] = useState(null);

  const { dailyTotals, maxAmount, daysInMonth, firstDayOffset, totalMonth, busiestDay } = useMemo(() => {
    const { year, month } = viewMonth;
    const totals = {};
    transactions.forEach((t) => {
      if (t.type !== "expense") return;
      const d = new Date(t.date);
      if (d.getMonth() !== month || d.getFullYear() !== year) return;
      const day = d.getDate();
      totals[day] = (totals[day] || 0) + (t.amount || 0);
    });

    const values = Object.values(totals);
    const max = values.length > 0 ? Math.max(...values) : 0;
    const dim = new Date(year, month + 1, 0).getDate();
    const offset = new Date(year, month, 1).getDay();
    const total = values.reduce((s, v) => s + v, 0);

    let busy = null;
    let busyAmt = 0;
    Object.entries(totals).forEach(([day, amt]) => {
      if (amt > busyAmt) {
        busyAmt = amt;
        busy = parseInt(day);
      }
    });

    return {
      dailyTotals: totals,
      maxAmount: max,
      daysInMonth: dim,
      firstDayOffset: offset,
      totalMonth: total,
      busiestDay: busy != null ? { day: busy, amount: busyAmt } : null,
    };
  }, [transactions, viewMonth]);

  const getColor = (amount) => {
    if (!amount || maxAmount === 0) return "#F2F4F7";
    const intensity = amount / maxAmount;
    if (intensity > 0.75) return "#FF6A00";
    if (intensity > 0.5) return "#FF9A3C";
    if (intensity > 0.25) return "#FFC785";
    return "#FFE4CC";
  };

  const getTextColor = (amount) => {
    if (!amount || maxAmount === 0) return "#8FA4C8";
    return amount / maxAmount > 0.5 ? "#FFFFFF" : "#1A1A1A";
  };

  const navigate = (dir) => {
    setSelectedDay(null);
    setViewMonth((prev) => {
      let m = prev.month + dir;
      let y = prev.year;
      if (m < 0) { m = 11; y--; }
      if (m > 11) { m = 0; y++; }
      return { year: y, month: m };
    });
  };

  const isToday = (day) =>
    viewMonth.year === now.getFullYear() && viewMonth.month === now.getMonth() && day === now.getDate();

  const cells = [];
  for (let i = 0; i < firstDayOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const Wrapper = embedded
    ? ({ children }) => <>{children}</>
    : ({ children }) => <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6">{children}</div>;

  return (
    <Wrapper>
      {/* Header — hidden in embedded mode */}
      {!embedded && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔥</span>
            <div>
              <h3 className="text-[#1A1A1A] font-bold text-base sm:text-lg leading-tight">Heatmap Pengeluaran</h3>
              <p className="text-[10px] sm:text-xs text-[#8FA4C8] mt-0.5">Lihat hari boros vs hari hemat</p>
            </div>
          </div>
        </div>
      )}

      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-full bg-[#F8FAFC] flex items-center justify-center text-[#1A1A1A] active:scale-95 transition-transform tap-highlight-fix"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <p className="text-sm font-bold text-[#1A1A1A]">
          {MONTHS_ID[viewMonth.month]} {viewMonth.year}
        </p>
        <button
          onClick={() => navigate(1)}
          className="w-8 h-8 rounded-full bg-[#F8FAFC] flex items-center justify-center text-[#1A1A1A] active:scale-95 transition-transform tap-highlight-fix"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-1.5">
        {DAY_LABELS.map((lbl, i) => (
          <div key={i} className="text-center text-[10px] font-semibold text-[#8FA4C8]">
            {lbl}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {cells.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} />;
          const amount = dailyTotals[day] || 0;
          const today = isToday(day);
          const selected = selectedDay === day;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(selected ? null : day)}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center transition-all tap-highlight-fix ${
                selected ? "ring-2 ring-[#FF6A00] scale-105" : ""
              } ${today ? "ring-2 ring-[#1A1A1A]" : ""}`}
              style={{ background: getColor(amount), color: getTextColor(amount) }}
            >
              <span className="text-[10px] sm:text-xs font-bold leading-none">{day}</span>
            </button>
          );
        })}
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div className="mt-3 p-2.5 rounded-xl bg-[#F8FAFC]">
          <p className="text-[10px] text-[#8FA4C8] font-medium">
            {selectedDay} {MONTHS_ID[viewMonth.month]} {viewMonth.year}
          </p>
          <p className="text-sm font-bold text-[#1A1A1A] mt-0.5">
            {dailyTotals[selectedDay] ? formatCurrency(dailyTotals[selectedDay]) : "Tidak ada pengeluaran"}
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#F2F4F7]">
        <span className="text-[10px] text-[#8FA4C8]">Hemat</span>
        <div className="flex gap-1">
          {["#F2F4F7", "#FFE4CC", "#FFC785", "#FF9A3C", "#FF6A00"].map((c) => (
            <div key={c} className="w-3 h-3 rounded" style={{ background: c }} />
          ))}
        </div>
        <span className="text-[10px] text-[#8FA4C8]">Boros</span>
      </div>

      {/* Summary footer */}
      {totalMonth > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="bg-[#F8FAFC] rounded-xl p-2.5">
            <p className="text-[9px] text-[#8FA4C8] font-medium">Total Bulan</p>
            <p className="text-xs font-bold text-[#1A1A1A] mt-0.5 truncate">{formatCurrency(totalMonth)}</p>
          </div>
          {busiestDay && (
            <div className="bg-[#FFF5F5] rounded-xl p-2.5">
              <p className="text-[9px] text-[#FF6B6B] font-medium">Hari Terboros</p>
              <p className="text-xs font-bold text-[#1A1A1A] mt-0.5 truncate">
                Tgl {busiestDay.day} · {formatCurrency(busiestDay.amount)}
              </p>
            </div>
          )}
        </div>
      )}
    </Wrapper>
  );
}