import { Target, ChevronRight, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAppSettings } from "@/components/utils/useAppSettings";

export default function GoalsProgressWidget({ goals = [], loading = false }) {
  const { formatCurrency } = useAppSettings();

  if (loading) {
    return <div className="bg-white rounded-2xl shadow-sm h-24 animate-pulse" />;
  }

  const activeGoals = goals
    .filter(g => g.status !== "paused")
    .map(g => {
      const percent = g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0;
      return { ...g, percent: Math.min(percent, 999) };
    })
    .sort((a, b) => b.percent - a.percent);

  const totalTarget = activeGoals.reduce((s, g) => s + (g.target_amount || 0), 0);
  const totalSaved = activeGoals.reduce((s, g) => s + (g.current_amount || 0), 0);
  const overallPercent = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  // Each goal row is ~64px (h-16). Show 3 rows + small peek for scroll affordance.
  const ROW_HEIGHT = 64;
  const VISIBLE_ROWS = 3;
  const showScroll = activeGoals.length > VISIBLE_ROWS;
  const maxHeight = showScroll ? `${ROW_HEIGHT * VISIBLE_ROWS + 8}px` : undefined;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-[#FF6A00]" />
          <h2 className="font-bold text-[#0A0A0A] text-sm">Tujuan Tabungan</h2>
          {activeGoals.length > 0 && (
            <span className="text-[10px] font-bold text-[#FF6A00] bg-[#FF6A00]/10 px-1.5 py-0.5 rounded-full">
              {overallPercent}%
            </span>
          )}
        </div>
        <Link to={createPageUrl("Goals")} className="text-xs text-[#FF6A00] font-semibold flex items-center gap-0.5">
          Lihat semua <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {activeGoals.length === 0 ? (
        <Link to={createPageUrl("Goals")} className="flex items-center gap-3 px-4 pb-4">
          <div className="w-10 h-10 rounded-full bg-[#F2F4F7] flex items-center justify-center text-lg text-[#8FA4C8]">
            <Plus className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-[#1A1A1A]">Belum ada tujuan</p>
            <p className="text-[11px] text-[#8FA4C8]">Mulai bikin target tabungan</p>
          </div>
        </Link>
      ) : (
        <div
          className="px-4 pb-2 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          style={{ maxHeight }}
        >
          <div className="space-y-2">
            {activeGoals.map(g => {
              const completed = g.percent >= 100;
              const barColor = completed ? "#00C9A7" : g.percent >= 60 ? "#F5A623" : "#FF6A00";
              return (
                <Link
                  key={g.id}
                  to={createPageUrl("Goals")}
                  className="flex items-center gap-3 py-2 hover:bg-[#F8FAFC] active:bg-[#F2F4F7] rounded-xl transition-colors -mx-2 px-2"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#F2F4F7] flex items-center justify-center text-base flex-shrink-0">
                    {g.icon || "🎯"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-xs font-semibold text-[#1A1A1A] truncate">{g.name}</p>
                      <p className="text-[10px] font-bold flex-shrink-0" style={{ color: barColor }}>
                        {Math.round(g.percent)}%
                      </p>
                    </div>
                    <div className="h-1.5 bg-[#F2F4F7] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(g.percent, 100)}%`, backgroundColor: barColor }}
                      />
                    </div>
                    <p className="text-[10px] text-[#8FA4C8] mt-1 truncate">
                      {formatCurrency(g.current_amount || 0)} / {formatCurrency(g.target_amount || 0)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {activeGoals.length > 0 && (
        <div className="px-4 py-3 border-t border-[#F2F4F7] flex items-center justify-between text-[11px]">
          <span className="text-[#8FA4C8]">Total Terkumpul</span>
          <span className="font-bold text-[#1A1A1A]">{formatCurrency(totalSaved)} / {formatCurrency(totalTarget)}</span>
        </div>
      )}
    </div>
  );
}