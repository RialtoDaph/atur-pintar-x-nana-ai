import { ChevronRight } from "lucide-react";

/**
 * InboxActionCard — single action item card for AdminInbox.
 * Shows priority dot, icon, title, count, description, and chevron.
 */
export default function InboxActionCard({ priority = "low", icon: Icon, iconColor, title, count, description, onClick }) {
  const priorityDot = {
    high: "bg-[#EF4444]",
    medium: "bg-[#F97316]",
    low: "bg-[#10B981]",
  }[priority];

  return (
    <button
      onClick={onClick}
      className="w-full bg-white border border-[#E2E8F0] rounded-2xl p-4 flex items-center gap-3 hover:border-[#F97316]/40 active:scale-[0.99] transition-all text-left"
    >
      <div className="relative flex-shrink-0">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconColor || "bg-[#F2F4F7]"}`}>
          {Icon && <Icon className="w-5 h-5 text-white" />}
        </div>
        <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${priorityDot}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-[#1A1A1A] text-sm truncate">{title}</p>
          {count !== undefined && count !== null && (
            <span className="flex-shrink-0 px-1.5 py-0.5 bg-[#F2F4F7] rounded-full text-[10px] font-bold text-[#1A1A1A]">
              {count}
            </span>
          )}
        </div>
        <p className="text-xs text-[#8FA4C8] mt-0.5 truncate">{description}</p>
      </div>

      <ChevronRight className="w-4 h-4 text-[#8FA4C8] flex-shrink-0" />
    </button>
  );
}