import { useState } from "react";
import { Search, Bell, Plus, Sun, Moon } from "lucide-react";
import { Link } from "react-router-dom";
import GlobalSearch from "@/components/search/GlobalSearch";
import AlertsDrawer from "@/components/dashboard/AlertsDrawer";
import { sanitizeDisplayName } from "@/components/dashboard/DashboardGreeting";

/**
 * Desktop-only top bar for the Dashboard page.
 * Layout: [Greeting] [Search] [🔥 streak] [🔔 bell] [+ Catat Transaksi]
 * Hidden on mobile (mobile uses Layout's existing header + FAB).
 */
export default function DashboardDesktopTopBar({
  user,
  gamificationProfile,
  unreadCount = 0,
  onAddTransaction,
}) {
  const [showSearch, setShowSearch] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [isDark, setIsDark] = useState(() => localStorage.getItem("darkMode") === "true");
  const streak = gamificationProfile?.daily_streak ?? 0;

  function toggleDark() {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("darkMode", next ? "true" : "false");
    if (next) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }

  const hour = new Date().getHours();
  const emailPrefix = user?.email?.split("@")[0];
  const name = sanitizeDisplayName(user?.full_name)
    || (emailPrefix ? emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1) : null)
    || "Kamu";
  let greeting;
  if (hour >= 6 && hour < 11) greeting = `Pagi, ${name}!`;
  else if (hour >= 11 && hour < 15) greeting = `Halo, ${name}!`;
  else if (hour >= 15 && hour < 19) greeting = `Sore, ${name}!`;
  else greeting = `Malam, ${name}!`;

  return (
    <div className="hidden lg:flex items-center gap-3 mb-4">
      {/* Greeting — compact, left-aligned */}
      <div className="flex-shrink-0 pr-2">
        <h2 className="text-lg font-bold text-[#1A1A1A] dark:text-white leading-tight whitespace-nowrap">{greeting}</h2>
      </div>

      {/* Search */}
      <button
        onClick={() => setShowSearch(true)}
        className="flex-1 min-w-0 flex items-center gap-3 h-11 px-4 rounded-full bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] transition-colors text-left shadow-sm"
      >
        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <span className="text-sm text-gray-400">Cari transaksi, kategori, rekening...</span>
      </button>

      {/* Streak pill — always visible on desktop */}
      <Link
        to="/Gamifikasi"
        className="flex items-center gap-1.5 h-11 px-4 rounded-full bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] transition-colors shadow-sm"
        title="Lihat progres gamifikasi"
      >
        <span className="text-base">🔥</span>
        <span className="text-sm font-bold text-[#1A1A1A]">{streak}</span>
        <span className="text-sm text-gray-600">hari</span>
      </Link>

      {/* Dark mode toggle */}
      <button
        onClick={toggleDark}
        className="w-11 h-11 rounded-full bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] flex items-center justify-center transition-colors shadow-sm"
        title={isDark ? "Mode Terang" : "Mode Gelap"}
        aria-label={isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
      >
        {isDark ? <Moon className="w-4 h-4 text-[#1A1A1A]" /> : <Sun className="w-4 h-4 text-[#F97316]" />}
      </button>

      {/* Bell / Alerts */}
      <button
        onClick={() => setShowAlerts(true)}
        className="relative w-11 h-11 rounded-full bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] flex items-center justify-center transition-colors shadow-sm"
        title="Notifikasi"
      >
        <Bell className="w-4 h-4 text-[#1A1A1A]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#EF4444] text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Catat Transaksi */}
      <button
        onClick={onAddTransaction}
        className="flex items-center gap-2 h-11 px-5 rounded-full bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold text-sm transition-colors shadow-sm"
      >
        <Plus className="w-4 h-4" strokeWidth={2.5} />
        Catat Transaksi
      </button>

      {showSearch && <GlobalSearch onClose={() => setShowSearch(false)} />}
      {showAlerts && <AlertsDrawer onClose={() => setShowAlerts(false)} user={user} />}
    </div>
  );
}