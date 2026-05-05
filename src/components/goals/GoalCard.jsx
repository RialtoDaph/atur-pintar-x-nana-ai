import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAppSettings } from "@/components/utils/useAppSettings";

const COLORS = {
  blue: "#4F7CFF", green: "#34C87A", orange: "#F5A623",
  purple: "#9B59B6", pink: "#E91E8C", teal: "#1ABC9C",
};

export default function GoalCard({ goal }) {
  const { formatCurrency } = useAppSettings();

  const progress = goal.target_amount > 0
    ? Math.min(((goal.current_amount || 0) / goal.target_amount) * 100, 100)
    : 0;
  const color = COLORS[goal.color] || COLORS.blue;
  const remaining = Math.max(goal.target_amount - (goal.current_amount || 0), 0);
  const daysLeft = goal.deadline
    ? Math.max(Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24)), 0)
    : null;
  const isUrgent = daysLeft !== null && daysLeft < 30 && remaining > 0;
  const isCompleted = goal.status === "completed";
  const isPaused = goal.status === "paused";

  // Border + bar color
  const borderColor = isCompleted ? "border-[#34C87A]/30" : isUrgent ? "border-orange-200" : "border-transparent";
  const barColor = isCompleted ? "#34C87A" : color;

  // Status text
  let statusText = null;
  if (isCompleted) {
    statusText = <p className="text-xs text-[#34C87A] mt-1 font-semibold">🎉 Target tercapai!</p>;
  } else if (isPaused) {
    statusText = <p className="text-[11px] text-[#8FA4C8] mt-1">Goal sedang dijeda</p>;
  } else if (daysLeft !== null) {
    if (daysLeft === 0) {
      statusText = <p className="text-xs text-red-500 mt-1 font-medium">⏰ Hari terakhir!</p>;
    } else if (isUrgent) {
      statusText = <p className="text-xs text-orange-500 mt-1 font-medium">⏳ {daysLeft} hari lagi · sisa {formatCurrency(remaining)}</p>;
    } else {
      statusText = <p className="text-[11px] text-[#8FA4C8] mt-1">{daysLeft} hari lagi · sisa {formatCurrency(remaining)}</p>;
    }
  } else if (remaining > 0) {
    statusText = <p className="text-[11px] text-[#8FA4C8] mt-1">Sisa {formatCurrency(remaining)}</p>;
  }

  return (
    <Link
      to={createPageUrl(`Goals?id=${goal.id}`)}
      className={`block bg-white rounded-2xl p-5 shadow-sm border ${borderColor} hover:shadow-md transition-shadow tap-highlight-fix`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
            style={{ backgroundColor: `${color}20` }}
          >
            {goal.icon || "💰"}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-[#1A1A1A] truncate">{goal.name}</p>
              {isPaused && <span className="text-[10px] bg-[#8FA4C8]/20 text-[#8FA4C8] font-bold px-2 py-0.5 rounded-full flex-shrink-0">Jeda</span>}
            </div>
            <p className="text-xs text-[#8FA4C8] truncate">
              {formatCurrency(goal.current_amount || 0)} / {formatCurrency(goal.target_amount)}
            </p>
          </div>
        </div>
        <span className={`text-sm font-bold flex-shrink-0 ${isCompleted ? "text-[#34C87A]" : isUrgent ? "text-orange-500" : "text-[#1A1A1A]"}`}>
          {Math.round(progress)}%
        </span>
      </div>

      <div className="w-full bg-[#F2F4F7] rounded-full h-2.5">
        <div
          className="h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${progress}%`, backgroundColor: barColor }}
        />
      </div>

      {statusText}
    </Link>
  );
}