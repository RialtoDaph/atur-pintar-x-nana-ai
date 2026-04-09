import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Check, Crown, Clock, CheckCircle2, Zap, AlertCircle } from "lucide-react";
import { useAppConfig } from "@/components/utils/useAppConfig";

const FEATURES_FREE = [
  "Catat transaksi (unlimited)",
  "Dashboard keuangan",
  "Chat Nana AI Setiap Hari",
  "Anggaran dan lainnya (terbatas)",
];
const LIMITS_FREE = ["❌ Fitur Investasi", "❌ Analitik lanjutan (blur)", "❌ Nana AI > 30 chat/bln"];
const FEATURES_MONTHLY = [
  "Semua fitur Free",
  "Anggaran & Goals unlimited",
  "Utang unlimited",
  "Nana AI chat unlimited",
  "Fitur Investasi penuh",
  "Analitik lanjutan (semua kartu)",
  "AI insight lebih dalam",
  "Prediksi cashflow otomatis",
  "Export PDF & Google Sheets",
  "Custom kategori & widget",
];
const FEATURES_YEARLY = ["Semua fitur Premium", "Harga lebih hemat", "Priority support"];

function formatRp(n) {
  return "Rp " + (n || 0).toLocaleString("id-ID");
}

export default function Subscription() {
  const { config, loading: configLoading } = useAppConfig();
  const [user, setUser] = useState(null);
  const [loadingSnap, setLoadingSnap] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [successPlan, setSuccessPlan] = useState(null);

  const monthlyPrice = config?.premium_price_monthly || 49000;
  const yearlyPrice = config?.premium_price_yearly || 490000;
  const yearlyDiscount = monthlyPrice > 0
    ? Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100)
    : 0;

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Load Midtrans Snap script
  useEffect(() => {
    if (document.querySelector('script[src*="snap.midtrans.com"]')) return;
    const script = document.createElement("script");
    script.src = "https://app.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", "Mid-client-DbRxTJwt9Fuh-xM6");
    document.head.appendChild(script);
  }, []);

  async function handleBuy(planKey) {
    setPaymentError(null);
    setLoadingSnap(true);
    try {
      const res = await base44.functions.invoke("createMidtransTransaction", { plan: planKey });
      const { token } = res.data;
      setLoadingSnap(false);

      window.snap.pay(token, {
        onSuccess: async () => {
          // Immediately activate subscription client-side, webhook will confirm
          const endDate = new Date();
          if (planKey === "premium_monthly") endDate.setMonth(endDate.getMonth() + 1);
          else endDate.setFullYear(endDate.getFullYear() + 1);
          const endDateStr = endDate.toISOString().split("T")[0];
          await base44.auth.updateMe({
            subscription_status: "active",
            subscription_plan: planKey,
            subscription_end_date: endDateStr,
          });
          setUser(u => ({ ...u, subscription_status: "active", subscription_plan: planKey, subscription_end_date: endDateStr }));
          setSuccessPlan(planKey);
        },
        onPending: async () => {
          await base44.auth.updateMe({ subscription_status: "pending", subscription_plan: planKey });
          setUser(u => ({ ...u, subscription_status: "pending", subscription_plan: planKey }));
          setSuccessPlan("pending");
        },
        onError: (result) => {
          setPaymentError("Pembayaran gagal. Silakan coba lagi.");
          console.error("Payment error", result);
        },
        onClose: () => {
          // User closed without paying — do nothing
        },
      });
    } catch (e) {
      setLoadingSnap(false);
      setPaymentError("Terjadi kesalahan. Coba lagi.");
    }
  }

  const isPremium = user?.subscription_plan && ["premium_monthly", "premium_yearly"].includes(user.subscription_plan) && user?.subscription_status === "active";
  const isPending = user?.subscription_status === "pending" && !isPremium;

  const PLANS = [
    {
      key: "free",
      label: "Free",
      price: "Rp 0",
      period: "selamanya",
      borderColor: "border-[#E2E8F0]",
      badge: null,
      badgeColor: "",
      features: FEATURES_FREE,
      limits: LIMITS_FREE,
    },
    {
      key: "premium_monthly",
      label: "Premium",
      price: configLoading ? "..." : formatRp(monthlyPrice),
      period: "per bulan",
      borderColor: "border-[#FF6A00]",
      badge: "Populer",
      badgeColor: "bg-[#FF6A00] text-white",
      features: FEATURES_MONTHLY,
      limits: [],
    },
    {
      key: "premium_yearly",
      label: "Premium Tahunan",
      price: configLoading ? "..." : formatRp(yearlyPrice),
      period: "per tahun",
      borderColor: "border-purple-500",
      badge: yearlyDiscount > 0 ? `Hemat ${yearlyDiscount}%` : "Best Value",
      badgeColor: "bg-purple-500 text-white",
      features: FEATURES_YEARLY,
      limits: [],
    },
  ];

  return (
    <div className="min-h-screen bg-[#F2F4F7] pb-10">
      {/* Header */}
      <div className="bg-[#0A0A0A] px-5 pt-10 pb-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-[#8FA4C8] text-sm font-medium">Langganan</p>
          <h1 className="text-white text-2xl font-bold mt-0.5">Pilih Paket</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 mt-6 space-y-4">

        {/* Status Banners */}
        {isPremium && (
          <div className="bg-[#FF6A00]/10 border border-[#FF6A00]/30 rounded-2xl p-4 flex items-center gap-3">
            <Crown className="w-5 h-5 text-[#FF6A00]" />
            <div>
              <p className="text-sm font-bold text-[#FF6A00]">Kamu sudah Premium!</p>
              {user?.subscription_end_date && (
                <p className="text-xs text-[#8FA4C8]">Aktif hingga {new Date(user.subscription_end_date).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}</p>
              )}
            </div>
          </div>
        )}
        {isPending && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-500" />
            <div>
              <p className="text-sm font-bold text-amber-700">Pembayaran Sedang Diverifikasi</p>
              <p className="text-xs text-amber-600">Admin akan mengonfirmasi dalam 1×24 jam.</p>
            </div>
          </div>
        )}
        {paymentError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-700">{paymentError}</p>
          </div>
        )}

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map(plan => {
            const isActive = user?.subscription_plan === plan.key && isPremium;
            return (
              <div key={plan.key} className={`bg-white rounded-2xl shadow-sm border-2 ${plan.borderColor} overflow-hidden relative`}>
                {plan.badge && (
                  <div className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${plan.badgeColor}`}>
                    {plan.badge}
                  </div>
                )}
                <div className="p-5">
                  <p className="text-xs font-bold text-[#8FA4C8] uppercase tracking-widest mb-1">{plan.label}</p>
                  <p className="text-2xl font-bold text-[#1A1A1A]">{plan.price}</p>
                  <p className="text-xs text-[#8FA4C8] mb-4">{plan.period}</p>
                  <ul className="space-y-2 mb-5">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-[#1A1A1A]">
                        <Check className="w-3.5 h-3.5 text-[#FF6A00] flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                    {plan.limits.map((f, i) => (
                      <li key={`l-${i}`} className="flex items-start gap-2 text-xs text-[#8FA4C8]">{f}</li>
                    ))}
                  </ul>

                  {plan.key === "free" ? (
                    <div className="w-full py-2.5 rounded-xl text-sm font-semibold text-center bg-[#F2F4F7] text-[#8FA4C8]">
                      {user?.subscription_plan === "free" || !user?.subscription_plan ? "Paket Aktif" : "Paket Gratis"}
                    </div>
                  ) : isActive ? (
                    <div className="w-full py-2.5 rounded-xl text-sm font-semibold text-center bg-[#FF6A00]/10 text-[#FF6A00]">
                      ✓ Aktif
                    </div>
                  ) : isPending ? (
                    <div className="w-full py-2.5 rounded-xl text-sm font-semibold text-center bg-amber-50 text-amber-600">
                      Menunggu Konfirmasi
                    </div>
                  ) : (
                    <button
                      onClick={() => handleBuy(plan.key)}
                      disabled={loadingSnap}
                      className={`w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2 ${
                        plan.key === "premium_monthly" ? "bg-[#FF6A00] hover:bg-[#e05e00]" : "bg-purple-500 hover:bg-purple-600"
                      }`}
                    >
                      {loadingSnap ? (
                        <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Memuat...</>
                      ) : (
                        <><Zap className="w-4 h-4" /> Bayar Sekarang</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Steps */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-xs font-bold text-[#8FA4C8] uppercase tracking-widest mb-3">Cara Berlangganan</p>
          <ol className="space-y-2">
            {["Pilih paket Premium yang kamu inginkan.", "Klik 'Bayar Sekarang' dan selesaikan pembayaran via Midtrans.", "Langganan aktif otomatis setelah pembayaran dikonfirmasi."].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-[#1A1A1A]">
                <span className="w-5 h-5 rounded-full bg-[#FF6A00] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Success Modal */}
      {successPlan && successPlan !== "pending" && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-9 h-9 text-green-500" />
            </div>
            <p className="text-xl font-bold text-[#1A1A1A] mb-1">Pembayaran Berhasil! 🎉</p>
            <p className="text-sm text-[#8FA4C8] mt-1 mb-1">
              Selamat! Kamu sekarang pengguna <span className="font-bold text-[#FF6A00]">Premium</span>.
            </p>
            <p className="text-xs text-[#8FA4C8] mb-5">
              Paket: {successPlan === "premium_monthly" ? "Premium Bulanan" : "Premium Tahunan"}
            </p>
            <button
              onClick={() => setSuccessPlan(null)}
              className="w-full py-3 bg-[#FF6A00] text-white rounded-xl font-semibold text-sm hover:bg-[#e05e00] transition-colors"
            >
              Mulai Gunakan Fitur Premium
            </button>
          </div>
        </div>
      )}

      {/* Pending Modal */}
      {successPlan === "pending" && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-8 text-center">
            <Clock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <p className="text-xl font-bold text-[#1A1A1A] mb-1">Pembayaran Diproses</p>
            <p className="text-sm text-[#8FA4C8] mt-1 mb-5">Pembayaran kamu sedang diverifikasi. Akses premium akan aktif setelah konfirmasi (maks 1×24 jam).</p>
            <button onClick={() => setSuccessPlan(null)} className="w-full py-3 bg-[#FF6A00] text-white rounded-xl font-semibold text-sm hover:bg-[#e05e00] transition-colors">
              OK, Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  );
}