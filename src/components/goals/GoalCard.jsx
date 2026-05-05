import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Pencil, Trash2, Calendar, Zap, ChevronRight, PiggyBank, Pause, Play, TrendingUp } from "lucide-react";
import { useAppSettings } from "@/components/utils/useAppSettings";

const COLORS = {
  blue: "#4F7CFF", green: "#34C87A", orange: "#F5A623",
  purple: "#9B59B6", pink: "#E91E8C", teal: "#1ABC9C",
};

export default function GoalCard({ goal, onEdit, onDelete, onAddSavings, onPause, onResume, onRaiseTarget }) {
  const { formatCurrency } = useAppSettings();
  const progress = goal.target_amount > 0
    ? Math.min(((goal.current_amount || 0) / goal.target_amount) * 100, 100)
    : 0;
  const color = COLORS[goal.color] || COLORS.blue;
  const remaining = Math.max(goal.target_amount - (goal.current_amount || 0), 0);
  const daysLeft = goal.deadline
    ? Math.max(Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24)), 0)
    : null;
  const isUrgent = daysLeft !== null && daysLeft < 30;
  const months = daysLeft ? Math.max(daysLeft / 30, 0.5) : null;
  const suggestedMonthly = months && remaining > 0 ? Math.ceil(remaining / months) : null;
  const isCompleted = goal.status === "completed";
  const isPaused = goal.status === "paused";

  // ===== Completed state =====
  if (isCompleted) {
    return (
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-[#34C87A]/30">
        <Link to={createPageUrl(`Goals?id=${goal.id}`)} className="block px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: `${color}1A` }}>
              {goal.icon || "💰"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className="font-bold text-[#1A1A1A] text-sm truncate">{goal.name}</p>
                <span className="text-[10px] bg-[#34C87A] text-white font-bold px-2 py-0.5 rounded-full whitespace-nowrap">🎉 Tercapai</span>
              </div>
              <p className="text-xs text-[#8FA4C8]">{formatCurrency(goal.target_amount)}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#CBD5E0] flex-shrink-0" />
          </div>
          <div className="h-1.5 bg-[#F2F4F7] rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-[#34C87A] w-full" />
          </div>
        </Link>
        <div className="flex border-t border-[#F2F4F7]">
          <button onClick={e => { e.preventDefault(); e.stopPropagation(); onRaiseTarget(goal); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-[#34C87A] hover:bg-[#F0FDF4] transition-colors tap-highlight-fix">
            <TrendingUp className="w-3.5 h-3.5" /> Naikkan Target
          </button>
          <div className="w-px bg-[#F2F4F7]" />
          <button onClick={e => { e.preventDefault(); e.stopPropagation(); onDelete(goal.id); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-[#8FA4C8] hover:text-red-500 hover:bg-red-50 transition-colors tap-highlight-fix">
            <Trash2 className="w-3.5 h-3.5" /> Tutup
          </button>
        </div>
      </div>
    );
  }

  // ===== Active / Paused state =====
  return (
    <div className={`bg-white rounded-2xl shadow-sm overflow-hidden ${isPaused ? "opacity-75" : ""}`}>
      <Link to={createPageUrl(`Goals?id=${goal.id}`)} className="block px-4 pt-4 pb-3">
        {/* Header: icon + name + chevron */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: `${color}1A` }}>
            {goal.icon || "💰"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <p className="font-bold text-[#1A1A1A] text-sm truncate">{goal.name}</p>
              {isPaused && <span className="text-[10px] bg-[#8FA4C8]/20 text-[#8FA4C8] font-bold px-2 py-0.5 rounded-full">Dijeda</span>}
            </div>
            <p className="text-[11px] text-[#8FA4C8]">Target {formatCurrency(goal.target_amount)}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-[#CBD5E0] flex-shrink-0" />
        </div>

        {/* Amount + percent */}
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-[10px] text-[#8FA4C8] uppercase tracking-wide font-semibold mb-0.5">Terkumpul</p>
            <p className="text-lg font-bold text-[#1A1A1A] leading-none">{formatCurrency(goal.current_amount || 0)}</p>
          </div>
          <span className="text-base font-bold leading-none" style={{ color }}>{progress.toFixed(0)}%</span>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-[#F2F4F7] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: color }} />
        </div>

        {/* Footer: deadline + suggested monthly */}
        {(daysLeft !== null || suggestedMonthly) && (
          <div className="flex items-center gap-3 mt-2.5">
            {daysLeft !== null && (
              <div className={`flex items-center gap-1 text-[11px] font-medium ${isUrgent ? "text-[#FF6B6B]" : "text-[#8FA4C8]"}`}>
                <Calendar className="w-3 h-3" />
                {daysLeft >= 0 ? `${daysLeft} hari lagi` : "Terlewat"}
              </div>
            )}
            {suggestedMonthly && (
              <div className={`flex items-center gap-1 text-[11px] font-medium ${isUrgent ? "text-[#FF6B6B]" : "text-[#8FA4C8]"}`}>
                <Zap className="w-3 h-3" />
                {formatCurrency(suggestedMonthly)}/bln
              </div>
            )}
          </div>
        )}
      </Link>

      {/* Action bar */}
      <div className="flex border-t border-[#F2F4F7]">
        {isPaused ? (
          <>
            <button onClick={e => { e.preventDefault(); e.stopPropagation(); onResume(goal); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-[#00C9A7] hover:bg-[#F0FDF4] transition-colors tap-highlight-fix">
              <Play className="w-3.5 h-3.5" /> Resume
            </button>
            <div className="w-px bg-[#F2F4F7]" />
            <button onClick={e => { e.preventDefault(); e.stopPropagation(); onEdit(goal); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-[#8FA4C8] hover:text-[#4F7CFF] hover:bg-[#F8FAFC] transition-colors tap-highlight-fix">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
            <div className="w-px bg-[#F2F4F7]" />
            <button onClick={e => { e.preventDefault(); e.stopPropagation(); onDelete(goal.id); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-[#8FA4C8] hover:text-red-500 hover:bg-red-50 transition-colors tap-highlight-fix">
              <Trash2 className="w-3.5 h-3.5" /> Hapus
            </button>
          </>
        ) : (
          <>
            <button onClick={e => { e.preventDefault(); e.stopPropagation(); onAddSavings(goal); }}
              className="flex-[1.3] flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-[#00C9A7] hover:bg-[#F0FDF4] transition-colors tap-highlight-fix">
              <PiggyBank className="w-3.5 h-3.5" /> Tambah Dana
            </button>
            <div className="w-px bg-[#F2F4F7]" />
            <button onClick={e => { e.preventDefault(); e.stopPropagation(); onPause(goal); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-[#8FA4C8] hover:text-amber-500 hover:bg-amber-50 transition-colors tap-highlight-fix">
              <Pause className="w-3.5 h-3.5" /> Jeda
            </button>
            <div className="w-px bg-[#F2F4F7]" />
            <button onClick={e => { e.preventDefault(); e.stopPropagation(); onEdit(goal); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-[#8FA4C8] hover:text-[#4F7CFF] hover:bg-[#F8FAFC] transition-colors tap-highlight-fix">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
          </>
        )}
      </div>
    </div>
  );
}