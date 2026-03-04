import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { formatRupiah } from "@/components/utils/formatRupiah";

const COLORS = {
  blue: "#4F7CFF", green: "#34C87A", orange: "#F5A623",
  purple: "#9B59B6", pink: "#E91E8C", teal: "#1ABC9C",
};

export default function GoalsMiniList({ goals, loading }) {
  if (loading) {
    return (
      <div className="px-5 pb-4 space-y-3">
        {[1,2].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
      </div>
    );
  }

  if (goals.length === 0) {
    return (
      <div className="px-5 pb-5 text-center py-6 text-[#8FA4C8] text-sm">
        No goals yet. Start saving for something!
      </div>
    );
  }

  return (
    <div className="px-5 pb-2 space-y-3">
      {goals.slice(0, 3).map((goal) => {
        const color = COLORS[goal.color] || COLORS.blue;
        const progress = goal.target_amount > 0
          ? Math.min((goal.current_amount / goal.target_amount) * 100, 100)
          : 0;
        return (
          <Link key={goal.id} to={createPageUrl(`Goals?id=${goal.id}`)} className="block">
            <div className="flex items-center gap-3 mb-1.5">
              <span className="text-lg">{goal.icon || "💰"}</span>
              <span className="flex-1 text-sm font-medium text-[#1B2559] truncate">{goal.name}</span>
              <span className="text-xs font-semibold text-[#8FA4C8]">
                {formatRupiah(goal.current_amount || 0)} / {formatRupiah(goal.target_amount)}
              </span>
            </div>
            <div className="h-1.5 bg-[#F0F0EE] rounded-full overflow-hidden ml-8">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, backgroundColor: color }}
              />
            </div>
          </Link>
        );
      })}
    </div>
  );
}