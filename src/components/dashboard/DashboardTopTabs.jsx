import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";

const TABS = [
  { name: "Dashboard", label: "Dashboard" },
  { name: "Transactions", label: "Transaksi" },
  { name: "Analytics", label: "Analitik" },
  { name: "Tips", label: "Tips" },
];

export default function DashboardTopTabs() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="hidden sm:flex items-center gap-2 mb-4">
      {TABS.map((tab) => {
        const path = createPageUrl(tab.name);
        const active = currentPath === path || (tab.name === "Dashboard" && currentPath === "/");
        return (
          <Link
            key={tab.name}
            to={path}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors tap-highlight-fix ${
              active
                ? "bg-[#0A0A0A] text-white"
                : "bg-white text-[#1A1A1A] hover:bg-[#F2F4F7] border border-[#E2E8F0]"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}