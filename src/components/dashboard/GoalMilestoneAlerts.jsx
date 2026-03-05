import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { formatRupiah } from "@/components/utils/formatRupiah";
import { Trophy, Target, Flame } from "lucide-react";

const MILESTONES = [
  { threshold: 100, label: "Target Tercapai! 🎉", icon: Trophy, bg: "bg-[#F1C40F]/10", border: "border-[#F1C40F]/30", text: "text-[#D4A017]", bar: "#F1C40F" },
  { threshold: 75, label: "75% – Hampir sampai!", icon: Flame, bg: "bg-[#FF6A00]/10", border: "border-[#FF6A00]/30", text: "text-[#FF6A00]", bar: "#FF6A00" },
  { threshold: 50, label: "50% – Separuh jalan!", icon: Target, bg: "bg-[#4F7CFF]/10", border: "border-[#4F7CFF]/30", text: "text-[#4F7CFF]", bar: "#4F7CFF" },
];

function getMilestone(progress) {
  if (progress >= 100) return MILESTONES[0];
  if (progress >= 75) return MILESTONES[1];
  if (progress >= 50) return MILESTONES[2];
  return null;
}

export default function GoalMilestoneAlerts({ goals }) {
  const alertGoals = goals
    .map(goal => {
      const progress = goal.target_amount > 0
        ? Math.min((goal.current_amount / goal.target_amount) * 100, 100)
        : 0;
      const milestone = getMilestone(progress);
      return milestone ? { goal, progress, milestone } : null;
    })
    .filter(Boolean);

  if (alertGoals.length === 0) return null;

  return (
    <div className="space-y-2">
      {alertGoals.map(({ goal, progress, milestone }) => {
        const Icon = milestone.icon;
        return (
          <Link key={goal.id} to={createPageUrl(`Goals?id=${goal.id}`)} className="block">
            <div className={`rounded-2xl border px-4 py-3 ${milestone.bg} ${milestone.border}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${milestone.text}`} />
                  <span className={`text-xs font-bold ${milestone.text}`}>{milestone.label}</span>
                </div>
                <span className="text-[10px] text-[#8FA4C8]">{Math.round(progress)}%</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{goal.icon || "💰"}</span>
                <span className="text-xs font-semibold text-[#1A1A1A] truncate flex-1">{goal.name}</span>
                <span className="text-[10px] text-[#8FA4C8]">
                  {formatRupiah(goal.current_amount || 0)} / {formatRupiah(goal.target_amount)}
                </span>
              </div>
              <div className="h-1.5 bg-black/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${progress}%`, backgroundColor: milestone.bar }}
                />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}