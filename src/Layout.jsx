import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { LayoutDashboard, Target, ArrowLeftRight, BarChart2 } from "lucide-react";

export default function Layout({ children, currentPageName }) {
  const navItems = [
    { name: "Dashboard", label: "Home", icon: LayoutDashboard, page: "Dashboard" },
    { name: "Transactions", label: "Transactions", icon: ArrowLeftRight, page: "Transactions" },
    { name: "Goals", label: "Goals", icon: Target, page: "Goals" },
    { name: "Analytics", label: "Analytics", icon: BarChart2, page: "Analytics" },
  ];

  return (
    <div className="min-h-screen bg-[#F2F4F7] font-sans pb-20 sm:pb-0">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; }
        * { -webkit-font-smoothing: antialiased; }
      `}</style>

      {/* Desktop sidebar */}
      <div className="hidden sm:flex fixed left-0 top-0 h-full w-60 bg-[#0A0A0A] flex-col px-5 py-8 z-40">
        <div className="mb-10 px-2">
          <p className="text-xl font-bold text-white tracking-tight">SaveWise</p>
          <p className="text-xs text-[#8FA4C8] mt-0.5">Your personal finance app</p>
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const active = currentPageName === item.page || (currentPageName === "Goals" && item.page === "Goals");
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
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
      </div>

      {/* Main content */}
      <div className="sm:ml-60">
        {children}
      </div>

      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 sm:hidden bg-[#1B2559] flex z-40 border-t border-white/10">
        {navItems.map((item) => {
          const active = currentPageName === item.page;
          return (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium transition-colors ${
                active ? "text-[#00C9A7]" : "text-[#8FA4C8]"
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