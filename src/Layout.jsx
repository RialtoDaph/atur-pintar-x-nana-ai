import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { LayoutDashboard, Target, ArrowLeftRight, BarChart2, PiggyBank, CreditCard, TrendingUp, Moon, Sun, Settings, MoreHorizontal, Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import NanaFloatingChat from "@/components/nana/NanaFloatingChat";

export default function Layout({ children, currentPageName }) {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");
  const [user, setUser] = useState(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark-app");
      localStorage.setItem("darkMode", "true");
    } else {
      document.documentElement.classList.remove("dark-app");
      localStorage.setItem("darkMode", "false");
    }
  }, [darkMode]);

  const navItems = [
    { name: "Dashboard", label: "Home", icon: LayoutDashboard, page: "Dashboard" },
    { name: "Transactions", label: "Transaksi", icon: ArrowLeftRight, page: "Transactions" },
    { name: "Goals", label: "Tujuan", icon: Target, page: "Goals" },
    { name: "Budget", label: "Anggaran", icon: PiggyBank, page: "Budget" },
    { name: "Debts", label: "Utang", icon: CreditCard, page: "Debts" },
    { name: "Investments", label: "Investasi", icon: TrendingUp, page: "Investments" },
    { name: "Analytics", label: "Analitik", icon: BarChart2, page: "Analytics" },
    { name: "Alerts", label: "Alerts", icon: Bell, page: "Alerts" },
    { name: "Reminders", label: "Pengingat", icon: Bell, page: "Reminders" },
    { name: "Settings", label: "Pengaturan", icon: Settings, page: "Settings" },
  ];

  // Mobile: only 4 main + "More"
  const mobileMainNav = [
    { name: "Dashboard", label: "Home", icon: LayoutDashboard, page: "Dashboard" },
    { name: "Transactions", label: "Transaksi", icon: ArrowLeftRight, page: "Transactions" },
    { name: "Analytics", label: "Analitik", icon: BarChart2, page: "Analytics" },
    { name: "Investments", label: "Investasi", icon: TrendingUp, page: "Investments" },
  ];

  const mobileMoreNav = [
    { name: "Goals", label: "Tujuan", icon: Target, page: "Goals" },
    { name: "Budget", label: "Anggaran", icon: PiggyBank, page: "Budget" },
    { name: "Debts", label: "Utang", icon: CreditCard, page: "Debts" },
    { name: "Alerts", label: "Alerts", icon: Bell, page: "Alerts" },
    { name: "Settings", label: "Setting", icon: Settings, page: "Settings" },
    { name: "Reminders", label: "Pengingat", icon: Bell, page: "Reminders" },
  ];

  const initials = user?.full_name ? user.full_name.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase() : "U";

  return (
    <div className={`min-h-screen font-sans pb-20 sm:pb-0 transition-colors ${darkMode ? "bg-[#111] text-white" : "bg-[#F2F4F7]"}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; }
        * { -webkit-font-smoothing: antialiased; }
        .dark-app .dm-card { background: #1E1E1E !important; color: #fff !important; }
        .dark-app .dm-bg { background: #111 !important; }
        .dark-app .dm-text { color: #E2E8F0 !important; }
        .dark-app .dm-muted { color: #8FA4C8 !important; }
        .dark-app .dm-border { border-color: #2D2D2D !important; }
        .dark-app .dm-input { background: #1E1E1E !important; border-color: #2D2D2D !important; color: #fff !important; }
      `}</style>

      {/* Desktop sidebar */}
      <div className="hidden sm:flex fixed left-0 top-0 h-full w-60 bg-[#0A0A0A] flex-col px-5 py-8 z-40">
        {/* Logo */}
        <div className="mb-8 px-2">
          <p className="text-xl font-bold text-white tracking-tight">Atur.in</p>
          <p className="text-xs text-[#8FA4C8] mt-0.5">Kelola keuanganmu</p>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => {
            const active = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#FF6A00] text-white shadow-sm"
                    : "text-[#888] hover:text-white hover:bg-white/10"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Dark mode + Profile */}
        <div className="space-y-1 mt-2">
          <button
            onClick={() => setDarkMode(d => !d)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-[#888] hover:text-white hover:bg-white/10 transition-colors w-full"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {darkMode ? "Mode Terang" : "Mode Gelap"}
          </button>
          <Link
            to={createPageUrl("Settings")}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-[#888] hover:text-white hover:bg-white/10 transition-colors"
          >
            <div className="w-5 h-5 rounded-full bg-[#FF6A00] flex items-center justify-center text-white text-[9px] font-bold">
              {initials}
            </div>
            <span className="truncate">{user?.full_name || "Profil"}</span>
          </Link>
        </div>
      </div>

      {/* Mobile top header */}
      <div className="sm:hidden fixed top-0 left-0 right-0 z-40 bg-[#0A0A0A] flex items-center justify-between px-5 py-3 border-b border-white/10">
        <p className="text-white font-bold text-lg tracking-tight">Atur.in</p>
        <Link to={createPageUrl("Settings")} className="w-8 h-8 rounded-full bg-[#FF6A00] flex items-center justify-center text-white text-xs font-bold">
          {initials}
        </Link>
      </div>

      {/* Main content — add top padding on mobile for header */}
      <div className="sm:ml-60 pt-14 sm:pt-0">
        {children}
      </div>

      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 sm:hidden bg-[#0A0A0A] flex z-40 border-t border-white/10">
        {mobileMainNav.map((item) => {
          const active = currentPageName === item.page;
          return (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              className={`flex-1 flex flex-col items-center py-3 gap-0.5 text-[10px] font-medium transition-colors ${
                active ? "text-[#FF6A00]" : "text-[#888]"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
        {/* More button */}
        <button
          onClick={() => setShowMoreMenu(m => !m)}
          className={`flex-1 flex flex-col items-center py-3 gap-0.5 text-[10px] font-medium transition-colors ${
            mobileMoreNav.some(i => i.page === currentPageName) ? "text-[#FF6A00]" : "text-[#888]"
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          Lainnya
        </button>
      </div>

      {/* Nana Floating Chat */}
      {currentPageName !== "Nana" && <NanaFloatingChat />}

      {/* More menu popup */}
      {showMoreMenu && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setShowMoreMenu(false)} />
          <div className="fixed bottom-16 right-2 z-50 bg-[#0A0A0A] rounded-2xl shadow-2xl border border-white/10 py-2 min-w-[160px]">
            {mobileMoreNav.map((item) => {
              const active = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setShowMoreMenu(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                    active ? "text-[#FF6A00]" : "text-[#888] hover:text-white"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}