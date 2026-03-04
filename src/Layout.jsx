import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { LayoutDashboard, Target, ArrowLeftRight, BarChart2, PiggyBank, CreditCard, TrendingUp, Moon, Sun, Settings } from "lucide-react";
import { useState, useEffect } from "react";

export default function Layout({ children, currentPageName }) {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");

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
    { name: "Settings", label: "Pengaturan", icon: Settings, page: "Settings" },
  ];

  const mobileNav = [
    { name: "Dashboard", label: "Home", icon: LayoutDashboard, page: "Dashboard" },
    { name: "Transactions", label: "Transaksi", icon: ArrowLeftRight, page: "Transactions" },
    { name: "Budget", label: "Anggaran", icon: PiggyBank, page: "Budget" },
    { name: "Investments", label: "Investasi", icon: TrendingUp, page: "Investments" },
    { name: "Analytics", label: "Analitik", icon: BarChart2, page: "Analytics" },
  ];

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
        <div className="mb-8 px-2">
          <p className="text-xl font-bold text-white tracking-tight">SaveWise</p>
          <p className="text-xs text-[#8FA4C8] mt-0.5">Your personal finance app</p>
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

        {/* Dark mode toggle */}
        <button
          onClick={() => setDarkMode(d => !d)}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-[#888] hover:text-white hover:bg-white/10 transition-colors mt-2"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {darkMode ? "Mode Terang" : "Mode Gelap"}
        </button>
      </div>

      {/* Main content */}
      <div className="sm:ml-60">
        {children}
      </div>

      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 sm:hidden bg-[#0A0A0A] flex z-40 border-t border-white/10">
        {mobileNav.map((item) => {
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
      </div>
    </div>
  );
}