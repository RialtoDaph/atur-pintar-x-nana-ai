import { Pencil, Trash2, AlertTriangle } from "lucide-react";
import { useAppSettings } from "@/components/utils/useAppSettings";

export default function BudgetCard({ budget, categoryMeta, spent, onEdit, onDelete }) {
  const { t, formatCurrency } = useAppSettings();
  const rawPercent = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
  const percent = Math.min(rawPercent, 100);
  const isOver = spent > budget.amount;
  const isCritical = !isOver && rawPercent >= 85;
  const isNear = !isOver && !isCritical && rawPercent >= 70;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
            style={{ backgroundColor: (categoryMeta.color || "#95A5A6") + "20" }}
          >
            {categoryMeta.emoji}
          </div>
          <div>
            <p className="font-semibold text-[#1A1A1A]">{categoryMeta.label}</p>
            <p className="text-xs text-[#8FA4C8]">
              {formatCurrency(spent)} / {formatCurrency(budget.amount)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${isOver ? "text-[#FF6B6B]" : "text-[#1A1A1A]"}`}>
            {Math.round(percent)}%
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

      <div className="w-full bg-[#F2F4F7] rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all"
          style={{
            width: `${percent}%`,
            backgroundColor: isOver ? "#FF6B6B" : percent > 70 ? "#F5A623" : (categoryMeta.color || "#4F7CFF"),
          }}
        />
      </div>

      {isOver && (
        <p className="text-xs text-[#FF6B6B] mt-1.5 font-medium">
          ⚠️ {t("budget_over")} {formatCurrency(spent - budget.amount)}
        </p>
      )}
    </div>
  );
}