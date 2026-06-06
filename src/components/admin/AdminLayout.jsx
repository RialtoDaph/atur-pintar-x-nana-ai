import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useState } from "react";
import {
  LayoutDashboard, Users, ArrowLeftRight, Tag, Sparkles,
  CreditCard, Bell, ScrollText, AlertTriangle, ChevronRight, Shield, Menu, X, Settings, Wallet, MessageSquare
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, page: "AdminDashboard" },
  { label: "Users", icon: Users, page: "AdminUsers" },
  { label: "Categories", icon: Tag, page: "AdminCategories" },
  { label: "Default Rekening", icon: Wallet, page: "AdminDefaultAccounts" },
  { label: "Subscriptions", icon: CreditCard, page: "AdminSubscriptions" },
  { label: "Notifications", icon: Bell, page: "AdminNotifications" },
  { label: "Feedback", icon: MessageSquare, page: "AdminFeedback" },
  { label: "Settings", icon: Settings, page: "AdminSettings" },
  { label: "System Logs", icon: ScrollText, page: "AdminLogs" },
];

export default function AdminLayout({ children, currentPage }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#F97316] rounded-lg flex items-center justify-center">
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
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors group ${
                active
                  ? "bg-[#F97316] text-white"
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
    </>
  );

  return (
    <div className="min-h-screen bg-[#F2F4F7] flex">
      {/* Desktop Sidebar */}
      <div className="hidden sm:flex fixed left-0 top-0 h-full w-56 bg-[#0A0A0A] flex-col z-40">
        <SidebarContent />
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 sm:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <div className={`fixed left-0 top-0 h-full w-56 bg-[#0A0A0A] flex flex-col z-50 sm:hidden transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <SidebarContent />
      </div>

      {/* Mobile Top Header */}
      <div className="sm:hidden fixed top-0 left-0 right-0 z-30 bg-[#0A0A0A] border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 flex items-center justify-center bg-white/10 rounded-xl text-white hover:bg-white/20 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#F97316] rounded-lg flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <p className="text-white text-sm font-bold">Admin Panel</p>
          </div>
          <div className="w-9" />
        </div>
      </div>

      {/* Content */}
      <div className="sm:ml-56 flex-1 min-h-screen overflow-x-hidden pt-14 sm:pt-0">
        {children}
      </div>
    </div>
  );
}