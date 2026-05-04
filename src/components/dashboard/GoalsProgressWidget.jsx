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
        <div className="px-4 pb-4 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="flex gap-2">
            {activeGoals.map(g => {
              const completed = g.percent >= 100;
              const pillColor = completed ? "#00C9A7" : g.percent >= 60 ? "#F5A623" : "#FF6A00";
              return (
                <Link
                  key={g.id}
                  to={createPageUrl("Goals")}
                  className="flex items-center gap-2 py-1.5 pl-1.5 pr-3 rounded-full bg-[#F2F4F7] hover:bg-[#E8EBF0] active:bg-[#E2E5EC] transition-colors flex-shrink-0"
                >
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-sm flex-shrink-0">
                    {g.icon || "🎯"}
                  </div>
                  <p className="text-xs font-semibold text-[#1A1A1A] max-w-[100px] truncate">{g.name}</p>
                  <span className="text-[10px] font-bold flex-shrink-0" style={{ color: pillColor }}>
                    {Math.round(g.percent)}%
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}