import { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const COLORS = {
  blue: "#4F7CFF",
  green: "#34C87A",
  orange: "#F5A623",
  purple: "#9B59B6",
  pink: "#E91E8C",
  teal: "#1ABC9C",
};

export default function GoalCard({ goal, transactions = [] }) {
  const progress = goal.target_amount > 0
    ? Math.min((goal.current_amount / goal.target_amount) * 100, 100)
    : 0;

  const color = COLORS[goal.color] || COLORS.blue;
  const remaining = Math.max(goal.target_amount - (goal.current_amount || 0), 0);

  return (
    <Link
      to={createPageUrl(`Goals?id=${goal.id}`)}
      className="block bg-white rounded-2xl p-5 shadow-sm border border-[#EFEFED] hover:shadow-md transition-all duration-200 group"
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{goal.icon || "💰"}</span>
          <div>
            <p className="font-semibold text-[#1A1A1A] text-sm leading-tight">{goal.name}</p>
            {goal.deadline && (
              <p className="text-xs text-[#9B9B9B] mt-0.5">
                By {new Date(goal.deadline).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </p>
            )}
          </div>
        </div>
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ backgroundColor: color + "18", color }}
        >
          {goal.status === "completed" ? "✓ Done" : `${progress.toFixed(0)}%`}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-[#F0F0EE] rounded-full mb-3 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progress}%`, backgroundColor: color }}
        />
      </div>

      {/* Amounts */}
      <div className="flex justify-between items-end">
        <div>
          <p className="text-xl font-bold text-[#1A1A1A]">
            ${(goal.current_amount || 0).toLocaleString("en-US", { minimumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-[#9B9B9B]">of ${goal.target_amount.toLocaleString()}</p>
        </div>
        {remaining > 0 && (
          <p className="text-xs text-[#9B9B9B]">
            ${remaining.toLocaleString()} left
          </p>
        )}
      </div>
    </Link>
  );
}