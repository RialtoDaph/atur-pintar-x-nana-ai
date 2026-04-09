import { Pencil, Trash2, AlertTriangle } from "lucide-react";
import { useAppSettings } from "@/components/utils/useAppSettings";

function getDaysRemaining() {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return lastDay - now.getDate();
}

export default function BudgetCard({ budget, categoryMeta, spent, onEdit, onDelete }) {
  const { t, formatCurrency } = useAppSettings();
  const rawPercent = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
  const percent = Math.min(rawPercent, 100);
  const isOver = spent > budget.amount;
  const isCritical = !isOver && rawPercent >= 85;
  const isWarning = !isOver && !isCritical && rawPercent >= 60;
  const daysLeft = getDaysRemaining();

  // Progressive colors: green < 60%, yellow 60-85%, orange 85-100%, red > 100%
  const borderColor = isOver ? "border-red-300" : isCritical ? "border-orange-200" : isWarning ? "border-yellow-200" : "border-transparent";
  const barColor = isOver ? "#EF4444" : isCritical ? "#F97316" : isWarning ? "#EAB308" : "#22C55E";

  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border ${borderColor}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
            style={{ backgroundColor: (categoryMeta.color || "#95A5A6") + "20" }}
          >
            {categoryMeta.emoji}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-[#1A1A1A]">{categoryMeta.label}</p>
              {(isOver || isCritical) && (
                <AlertTriangle className="w-3.5 h-3.5" style={{ color: isOver ? "#FF6B6B" : "#F5A623" }} />
              )}
            </div>
            <p className="text-xs text-[#8FA4C8]">
              {formatCurrency(spent)} / {formatCurrency(budget.amount)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${isOver ? "text-[#FF6B6B]" : isCritical ? "text-[#F5A623]" : "text-[#1A1A1A]"}`}>
            {Math.round(rawPercent)}%
          </span>
          <button
            onClick={() => onEdit(budget)}
            className="text-[#CBD5E0] hover:text-[#FF6A00] transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(budget.id)}
            className="text-[#CBD5E0] hover:text-[#FF6B6B] transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="w-full bg-[#F2F4F7] rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all ${isOver ? "animate-pulse" : ""}`}
          style={{ width: `${percent}%`, backgroundColor: barColor }}
        />
      </div>
      <p className="text-[10px] text-[#8FA4C8] mt-1">Sisa {daysLeft} hari di bulan ini</p>

      {isOver && (
        <p className="text-xs text-red-500 mt-0.5 font-semibold">⚠️ Over budget {formatCurrency(spent - budget.amount)}!</p>
      )}
      {isCritical && !isOver && (
        <p className="text-xs text-orange-500 mt-0.5 font-medium">🔔 Hampir habis — sisa {formatCurrency(budget.amount - spent)}</p>
      )}
      {isWarning && !isOver && !isCritical && (
        <p className="text-xs text-yellow-600 mt-0.5 font-medium">💡 Sisa {formatCurrency(budget.amount - spent)}</p>
      )}
    </div>
  );
}