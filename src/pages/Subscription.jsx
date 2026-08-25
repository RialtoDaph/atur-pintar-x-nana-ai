import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Crown, Check, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { usePricing } from "@/hooks/usePricing";

const FEATURES = [
  "Anggaran & Goals unlimited",
  "Nana AI chat unlimited",
  "Fitur Investasi penuh",
  "Analitik lanjutan (heatmap, forecast, anomaly)",
  "Export PDF & Google Sheets",
  "Shared wallet & split bill unlimited",
  "Prioritas customer support",
];

export default function Subscription() {
  const {
    monthly, yearly, monthlyOriginal, yearlyOriginal,
    monthlyDiscountPct, yearlyDiscountPct, yearlySavingPct, loading: pricingLoading,
  } = usePricing();

  const [user, setUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState("premium_yearly");
  const [creating, setCreating] = useState(false);
  const [lastPayment, setLastPayment] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      // Cek pending payment terakhir → tampilkan tombol lanjutkan
      return base44.entities.SubscriptionPayment.filter(
        { user_email: u.email, status: "pending" },
        "-created_date",
        1,
      );
    }).then(list => {
      if (list && list.length > 0) setLastPayment(list[0]);
    }).catch(() => {});

    // Handle redirect balik dari Xendit
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    if (status === "success") {
      toast.success("Pembayaran diterima! Premium akan aktif setelah dikonfirmasi 🎉", { duration: 5000 });
    } else if (status === "failure") {
      toast.error("Pembayaran gagal atau dibatalkan. Coba lagi ya.", { duration: 4000 });
    }
  }, []);

  async function handleUpgrade() {
    setCreating(true);
    try {
      const res = await base44.functions.invoke("createXenditInvoice", { plan: selectedPlan });
      if (res?.data?.invoice_url) {
        window.location.href = res.data.invoice_url;
      } else {
        toast.error("Gagal membuat invoice. Coba lagi.");
      }
    } catch (err) {
      toast.error("Gagal membuat invoice. Coba lagi.");
    } finally {
      setCreating(false);
    }
  }

  const isAlreadyPremium =
    user?.role === "admin" ||
    (user?.subscription_status === "active" &&
      ["premium_monthly", "premium_yearly"].includes(user?.subscription_plan));

  const formatRp = (n) => "Rp " + (n || 0).toLocaleString("id-ID");

  return (
    <div className="min-h-screen bg-[#F2F4F7] pb-10">
      {/* Header — same pattern as Accounts.jsx */}
      <div className="bg-gradient-to-b from-[#0A0A0A] to-[#0d0d0d] px-5 pt-10 pb-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-[#8FA4C8] text-sm font-medium">Upgrade</p>
          <h1 className="text-white text-2xl font-bold mt-0.5 flex items-center gap-2">
            <Crown className="w-6 h-6 text-[#F97316]" />
            Atur Pintar Premium
          </h1>
          <p className="text-[#8FA4C8] text-xs mt-2">
            Buka semua fitur tanpa batas. Bayar aman via Xendit — VA, QRIS, e-wallet.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 mt-5 space-y-3">
        {isAlreadyPremium && (
          <div className="bg-white rounded-2xl shadow-sm p-4 border border-[#27AE60]/30">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-[#27AE60]" />
              <p className="text-sm font-bold text-[#1A1A1A]">Kamu sudah Premium 🎉</p>
            </div>
            <p className="text-xs text-[#8FA4C8]">
              {user?.role === "admin"
                ? "Akses admin — otomatis premium."
                : `Aktif sampai ${user?.subscription_end_date || "-"}`}
            </p>
          </div>
        )}

        {lastPayment && !isAlreadyPremium && (
          <div className="bg-white rounded-2xl shadow-sm p-4 border border-[#F97316]/30">
            <p className="text-xs font-bold text-[#F97316] uppercase tracking-widest mb-1">Pembayaran Belum Selesai</p>
            <p className="text-sm text-[#1A1A1A] mb-3">
              Ada invoice {lastPayment.plan === "premium_monthly" ? "bulanan" : "tahunan"} yang belum dibayar.
            </p>
            <a
              href={lastPayment.xendit_invoice_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-[#F97316] text-white rounded-xl text-xs font-bold hover:bg-[#e05e00] transition-colors"
            >
              Lanjutkan Pembayaran →
            </a>
          </div>
        )}

        {/* Plan cards */}
        {!isAlreadyPremium && (
          <div className="space-y-3">
            {/* Yearly */}
            <button
              onClick={() => setSelectedPlan("premium_yearly")}
              disabled={pricingLoading}
              className={`w-full bg-white rounded-2xl shadow-sm p-5 text-left transition-all relative ${
                selectedPlan === "premium_yearly"
                  ? "border-2 border-[#F97316]"
                  : "border-2 border-transparent"
              }`}
            >
              {yearlyDiscountPct > 0 && (
                <span className="absolute top-3 right-3 bg-[#F97316] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  HEMAT {yearlyDiscountPct}%
                </span>
              )}
              <p className="text-[10px] font-bold text-[#8FA4C8] uppercase tracking-widest mb-1">Tahunan</p>
              <div className="flex items-baseline gap-2 mb-1">
                <p className="text-2xl font-bold text-[#1A1A1A]">{formatRp(yearly)}</p>
                {yearlyOriginal > yearly && (
                  <p className="text-sm text-[#8FA4C8] line-through">{formatRp(yearlyOriginal)}</p>
                )}
              </div>
              <p className="text-xs text-[#8FA4C8]">
                per tahun · setara {formatRp(Math.round(yearly / 12))}/bulan
                {yearlySavingPct > 0 && ` · hemat ${yearlySavingPct}% vs bulanan`}
              </p>
              {selectedPlan === "premium_yearly" && (
                <div className="absolute top-5 left-5 hidden">
                  <Check className="w-5 h-5 text-[#F97316]" />
                </div>
              )}
            </button>

            {/* Monthly */}
            <button
              onClick={() => setSelectedPlan("premium_monthly")}
              disabled={pricingLoading}
              className={`w-full bg-white rounded-2xl shadow-sm p-5 text-left transition-all relative ${
                selectedPlan === "premium_monthly"
                  ? "border-2 border-[#F97316]"
                  : "border-2 border-transparent"
              }`}
            >
              {monthlyDiscountPct > 0 && (
                <span className="absolute top-3 right-3 bg-[#F97316] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  HEMAT {monthlyDiscountPct}%
                </span>
              )}
              <p className="text-[10px] font-bold text-[#8FA4C8] uppercase tracking-widest mb-1">Bulanan</p>
              <div className="flex items-baseline gap-2 mb-1">
                <p className="text-2xl font-bold text-[#1A1A1A]">{formatRp(monthly)}</p>
                {monthlyOriginal > monthly && (
                  <p className="text-sm text-[#8FA4C8] line-through">{formatRp(monthlyOriginal)}</p>
                )}
              </div>
              <p className="text-xs text-[#8FA4C8]">per bulan</p>
            </button>
          </div>
        )}

        {/* Features */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-[10px] font-bold text-[#F97316] uppercase tracking-widest mb-3">Yang Kamu Dapat</p>
          <ul className="space-y-2.5">
            {FEATURES.map((f, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-[#1A1A1A]">
                <Check className="w-4 h-4 text-[#27AE60] flex-shrink-0 mt-0.5" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Info */}
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-[#F97316]/20">
          <p className="text-xs font-bold text-[#F97316] uppercase tracking-widest mb-2">💡 Info Pembayaran</p>
          <p className="text-sm text-[#1A1A1A]">
            Setelah klik tombol bayar, kamu akan diarahkan ke halaman Xendit untuk pilih metode pembayaran (BCA VA, QRIS, GoPay, OVO, dll). Premium aktif otomatis setelah pembayaran berhasil.
          </p>
        </div>

        {/* CTA button — sticky-ish, mobile first */}
        {!isAlreadyPremium && (
          <button
            onClick={handleUpgrade}
            disabled={creating || pricingLoading}
            className="w-full py-4 bg-[#F97316] text-white rounded-xl font-bold text-sm hover:bg-[#e05e00] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Membuat invoice...
              </>
            ) : (
              <>
                Bayar {selectedPlan === "premium_yearly" ? formatRp(yearly) : formatRp(monthly)}
                {" — Lanjut ke Xendit →"}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}