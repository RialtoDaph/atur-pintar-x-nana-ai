import { useState } from "react";
import { Search, Bell, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import GlobalSearch from "@/components/search/GlobalSearch";
import AlertsDrawer from "@/components/dashboard/AlertsDrawer";

/**
 * Desktop-only top bar for the Dashboard page.
 * Mirrors mockup: [Search input] [🔥 streak] [🔔 bell] [+ Catat Transaksi]
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
  const streak = gamificationProfile?.daily_streak ?? 0;

  return (
    <div className="hidden lg:flex items-center gap-3 mb-4">
      {/* Search */}
      <button
        onClick={() => setShowSearch(true)}
        className="flex-1 flex items-center gap-3 h-11 px-4 rounded-full bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] transition-colors text-left shadow-sm"
      >
        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <span className="text-sm text-gray-400">Cari transaksi, kategori, rekening...</span>
      </button>

      {/* Streak pill */}
      {streak > 0 && (
        <Link
          to="/Gamifikasi"
          className="flex items-center gap-1.5 h-11 px-4 rounded-full bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] transition-colors shadow-sm"
          title="Lihat progres gamifikasi"
        >
          <span className="text-base">🔥</span>
          <span className="text-sm font-bold text-[#1A1A1A]">{streak}</span>
          <span className="text-sm text-gray-600">hari</span>
        </Link>
      )}

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