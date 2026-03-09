import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard, Users, ArrowLeftRight, Tag, Sparkles,
  CreditCard, Bell, ScrollText, AlertTriangle, ChevronRight, Shield
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, page: "AdminDashboard" },
  { label: "Users", icon: Users, page: "AdminUsers" },
  { label: "Transactions", icon: ArrowLeftRight, page: "AdminTransactions" },
  { label: "Categories", icon: Tag, page: "AdminCategories" },
  { label: "AI Insights", icon: Sparkles, page: "AdminAIInsights" },
  { label: "Subscriptions", icon: CreditCard, page: "AdminSubscriptions" },
  { label: "Notifications", icon: Bell, page: "AdminNotifications" },
  { label: "Anomaly Detector", icon: AlertTriangle, page: "AdminAnomalies" },
  { label: "System Logs", icon: ScrollText, page: "AdminLogs" },
];

export default function AdminLayout({ children, currentPage }) {
  return (
    <div className="min-h-screen bg-[#F2F4F7] flex">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-56 bg-[#0A0A0A] flex flex-col z-40">
        {/* Logo */}
        <div className="px-5 py-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#FF6A00] rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white text-sm font-bold leading-none">Atur Pintar</p>
              <p className="text-[#8FA4C8] text-[10px] mt-0.5">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = currentPage === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors group ${
                  active
                    ? "bg-[#FF6A00] text-white"
                    : "text-[#888] hover:text-white hover:bg-white/10"
                }`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight className="w-3 h-3 opacity-70" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/10">
          <Link
            to={createPageUrl("Dashboard")}
            className="text-xs text-[#8FA4C8] hover:text-white transition-colors flex items-center gap-1.5"
          >
            <ChevronRight className="w-3 h-3 rotate-180" />
            Back to App
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="ml-56 flex-1 min-h-screen overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}