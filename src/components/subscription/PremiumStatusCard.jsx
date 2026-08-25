import { Crown, Sparkles, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { usePremiumUser } from "@/hooks/usePremiumUser";

/**
 * Card status premium — konsisten dipakai di ProfileSettings.
 * - Admin → tampilkan "Akses Admin (Premium)"
 * - Premium aktif → tampilkan tanggal expired + tombol "Kelola"
 * - Free → tampilkan CTA "Upgrade Sekarang"
 */
export default function PremiumStatusCard() {
  const { isPremium, user, loading } = usePremiumUser();

  if (loading || !user) return null;

  const isAdmin = user.role === "admin";
  const endDate = user.subscription_end_date;
  const plan = user.subscription_plan;

  // ── Premium (user biasa) ──
  if (isPremium && !isAdmin) {
    const planLabel = plan === "premium_yearly" ? "Tahunan" : "Bulanan";
    const formattedDate = endDate
      ? new Date(endDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
      : "-";
    return (
      <Link
        to="/Subscription"
        className="block bg-gradient-to-br from-[#F97316] to-[#FF8C42] rounded-2xl shadow-sm p-4 hover:shadow-md transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-white font-bold text-sm">Premium {planLabel}</p>
              <Sparkles className="w-3.5 h-3.5 text-white/80" />
            </div>
            <p className="text-white/80 text-xs mt-0.5">Aktif sampai {formattedDate}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-white/80 flex-shrink-0" />
        </div>
      </Link>
    );
  }

  // ── Admin (auto premium) ──
  if (isAdmin) {
    return (
      <Link
        to="/Subscription"
        className="block bg-gradient-to-br from-[#0A0A0A] to-[#1a1a1a] rounded-2xl shadow-sm p-4 hover:shadow-md transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F97316]/20 flex items-center justify-center flex-shrink-0">
            <Crown className="w-5 h-5 text-[#F97316]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-white font-bold text-sm">Akses Admin</p>
              <span className="text-[10px] font-bold text-[#F97316] uppercase tracking-widest">Premium</span>
            </div>
            <p className="text-[#8FA4C8] text-xs mt-0.5">Kelola pembayaran & pengguna</p>
          </div>
          <ChevronRight className="w-4 h-4 text-[#8FA4C8] flex-shrink-0" />
        </div>
      </Link>
    );
  }

  // ── Free (belum premium) ──
  return (
    <Link
      to="/Subscription"
      className="block bg-white rounded-2xl shadow-sm p-4 border border-[#F97316]/20 hover:shadow-md transition-all"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#F97316]/10 flex items-center justify-center flex-shrink-0">
          <Crown className="w-5 h-5 text-[#F97316]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[#1A1A1A] font-bold text-sm">Upgrade ke Premium</p>
          <p className="text-[#8FA4C8] text-xs mt-0.5">Buka semua fitur tanpa batas</p>
        </div>
        <div className="px-3 py-1.5 rounded-full bg-[#F97316] text-white text-xs font-bold flex-shrink-0">
          Upgrade
        </div>
      </div>
    </Link>
  );
}