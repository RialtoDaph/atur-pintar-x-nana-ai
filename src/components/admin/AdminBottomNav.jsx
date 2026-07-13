import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { LayoutDashboard, Users, Tag, Menu } from "lucide-react";

/**
 * AdminBottomNav — mobile-only bottom tab bar for fast admin navigation.
 * 4 tabs: Dashboard, Users, Categories, More (opens sidebar drawer).
 */
export default function AdminBottomNav({ currentPage, onOpenMore, openFeedbackCount = 0 }) {
  const tabs = [
    { label: "Home", icon: LayoutDashboard, page: "AdminDashboard" },
    { label: "Users", icon: Users, page: "AdminUsers" },
    { label: "Kategori", icon: Tag, page: "AdminCategories" },
    { label: "Lainnya", icon: Menu, isMore: true, badge: openFeedbackCount },
  ];

  return (
    <div
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0A0A0A] border-t border-white/10 flex"
      style={{
        boxShadow: "0 -4px 24px rgba(0,0,0,0.5)",
        paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom, 0px))",
      }}
    >
      {tabs.map((t) => {
        const active = !t.isMore && currentPage === t.page;
        const content = (
          <>
            <div className="relative">
              <t.icon className="w-5 h-5" />
              {t.badge > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[#EF4444] text-white text-[9px] font-bold flex items-center justify-center">
                  {t.badge > 9 ? "9+" : t.badge}
                </span>
              )}
            </div>
            {t.label}
          </>
        );
        const className = `flex-1 flex flex-col items-center py-3 gap-0.5 text-[10px] font-medium transition-colors tap-highlight-fix ${
          active ? "text-[#F97316]" : "text-[#888]"
        }`;

        if (t.isMore) {
          return (
            <button key="more" onClick={onOpenMore} className={`${className} bg-transparent border-none cursor-pointer`}>
              {content}
            </button>
          );
        }
        return (
          <Link key={t.page} to={createPageUrl(t.page)} className={className}>
            {content}
          </Link>
        );
      })}
    </div>
  );
}