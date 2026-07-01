import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Check, Crown, Clock, CheckCircle2, Zap, AlertCircle, ShieldCheck } from "lucide-react";
import { useAppConfig } from "@/components/utils/useAppConfig";
import CheckoutDisclaimerModal from "@/components/subscription/CheckoutDisclaimerModal";

const FEATURES_FREE = [
  "Catat transaksi (unlimited)",
  "Dashboard keuangan",
  "Nana AI (5 chat/hari)",
  "2 budget, 2 goals, 2 utang",
];
const LIMITS_FREE = ["❌ Fitur Investasi", "❌ Analitik lanjutan (blur)", "❌ Export PDF & Google Sheets"];
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
  const [orderId, setOrderId] = useState(null);
  // Plan the user is trying to checkout — opens the disclaimer confirmation modal
  const [pendingCheckoutPlan, setPendingCheckoutPlan] = useState(null);
  // Inline legal-consent checkbox. Must be ticked before any "Bayar Sekarang"
  // button can be pressed — guarantees the disclaimer is visible on-page even
  // if the modal is skipped or a checkout flow is automated.
  const [legalAccepted, setLegalAccepted] = useState(false);

  const monthlyPrice = config?.premium_price_monthly || 49000;
  const yearlyPrice = config?.premium_price_yearly || 399900;
  const yearlyDiscount = monthlyPrice > 0
    ? Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100)
    : 0;

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // After Xendit redirect-back, refetch user once to pick up webhook-applied premium status.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paid = params.get("paid");
    if (paid === "1") {
      base44.auth.me().then((u) => {
        setUser(u);
        if (u?.subscription_status === "active") {
          setSuccessPlan(u.subscription_plan || "premium_monthly");
        } else {
          // Webhook belum masuk — tampilkan pending
          setSuccessPlan("pending");
        }
        // Bersihkan query param tanpa reload
        window.history.replaceState({}, "", window.location.pathname);
      }).catch(() => {});
    } else if (paid === "0") {
      // Xendit redirected back with failure/cancellation. Show a detailed error card
      // with concrete next steps — the modal below surfaces the same info in-context.
      setPaymentError({
        title: "Pembayaran Gagal atau Dibatalkan",
        message: "Transaksi kamu ditolak oleh payment gateway atau dibatalkan sebelum selesai. Dana kamu aman — tidak ada biaya yang diambil.",
        reasons: [
          "Metode pembayaran ditolak (saldo/limit tidak cukup, kartu diblokir, atau data salah).",
          "Sesi pembayaran kedaluwarsa sebelum kamu menyelesaikan transfer/OTP.",
          "Kamu menutup halaman Xendit sebelum konfirmasi.",
        ],
      });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  async function handleBuy(planKey) {
    setPaymentError(null);
    setLoadingSnap(true);
    // Close the disclaimer modal once we start the actual redirect
    setPendingCheckoutPlan(null);
    try {
      const returnUrl = `${window.location.origin}${window.location.pathname}?paid=1`;
      const failUrl = `${window.location.origin}${window.location.pathname}?paid=0`;
      const res = await base44.functions.invoke("createXenditInvoice", {
        plan: planKey,
        success_redirect_url: returnUrl,
        failure_redirect_url: failUrl,
      });
      const { invoice_url, external_id } = res.data || {};
      setOrderId(external_id || null);
      if (!invoice_url) {
        setLoadingSnap(false);
        setPaymentError("Gagal membuat invoice. Coba lagi.");
        return;
      }
      // Redirect ke halaman pembayaran Xendit
      window.location.href = invoice_url;
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
      borderColor: "border-[#F97316]",
      badge: "Populer",
      badgeColor: "bg-[#F97316] text-white",
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
          <div className="bg-[#F97316]/10 border border-[#F97316]/30 rounded-2xl p-4 flex items-center gap-3">
            <Crown className="w-5 h-5 text-[#F97316]" />
            <div>
              <p className="text-sm font-bold text-[#F97316]">Kamu sudah Premium!</p>
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
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                {typeof paymentError === "string" ? (
                  <p className="text-sm text-red-700">{paymentError}</p>
                ) : (
                  <>
                    <p className="text-sm font-bold text-red-800 mb-1">{paymentError.title}</p>
                    <p className="text-xs text-red-700 leading-relaxed mb-2">{paymentError.message}</p>
                    {paymentError.reasons?.length > 0 && (
                      <>
                        <p className="text-[11px] font-semibold text-red-800 uppercase tracking-wider mb-1">Kemungkinan penyebab</p>
                        <ul className="text-xs text-red-700 leading-relaxed space-y-0.5 mb-3 list-disc list-inside">
                          {paymentError.reasons.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                      </>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      <button
                        onClick={() => setPaymentError(null)}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        Coba Bayar Lagi
                      </button>
                      <a
                        href="mailto:admin@aturpintar.id?subject=Bantuan%20Pembayaran%20Premium"
                        className="px-3 py-1.5 bg-white border border-red-200 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-100 transition-colors"
                      >
                        Hubungi Support
                      </a>
                    </div>
                  </>
                )}
              </div>
            </div>
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
                        <Check className="w-3.5 h-3.5 text-[#F97316] flex-shrink-0 mt-0.5" />
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
                    <div className="w-full py-2.5 rounded-xl text-sm font-semibold text-center bg-[#F97316]/10 text-[#F97316]">
                      ✓ Aktif
                    </div>
                  ) : isPending ? (
                    <div className="w-full py-2.5 rounded-xl text-sm font-semibold text-center bg-amber-50 text-amber-600">
                      Menunggu Konfirmasi
                    </div>
                  ) : (
                    <button
                      onClick={() => setPendingCheckoutPlan(plan)}
                      disabled={loadingSnap || !legalAccepted}
                      title={!legalAccepted ? "Centang persetujuan syarat & ketentuan di bawah dulu" : undefined}
                      className={`w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                        plan.key === "premium_monthly" ? "bg-[#F97316] hover:bg-[#e05e00]" : "bg-purple-500 hover:bg-purple-600"
                      }`}
                    >
                      {loadingSnap && pendingCheckoutPlan?.key === plan.key ? (
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
            {["Pilih paket Premium yang kamu inginkan.", "Klik 'Bayar Sekarang' lalu pilih metode bayar (QRIS, VA bank, e-wallet, atau kartu) di halaman Xendit.", "Langganan aktif otomatis setelah pembayaran dikonfirmasi."].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-[#1A1A1A]">
                <span className="w-5 h-5 rounded-full bg-[#F97316] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* Legal disclaimer + inline consent — must be ticked to enable checkout buttons.
            Kept on-page (not just inside the modal) so the disclaimer is guaranteed to be
            visible before any payment can be initiated, even for automated flows. */}
        {!isPremium && !isPending && (
          <div className="bg-white rounded-2xl shadow-sm border-2 border-[#F97316]/30 p-4 sm:p-5">
            <div className="flex items-start gap-3 mb-3">
              <ShieldCheck className="w-5 h-5 text-[#F97316] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-[#1A1A1A] mb-1">Disclaimer Legal Sebelum Pembayaran</p>
                <p className="text-xs text-[#4A5568] leading-relaxed">
                  Dengan melanjutkan, kamu setuju bahwa: (1) langganan Premium diperpanjang manual & bisa dibatalkan kapan saja;
                  (2) refund tunduk pada Kebijakan Refund Atur Pintar; (3) pembayaran diproses oleh Xendit
                  (PT Xendit Investasi Indonesia), payment gateway berlisensi Bank Indonesia, dan diterima oleh PT Rideff Vreka Tech.
                </p>
              </div>
            </div>
            <label className="flex items-start gap-3 cursor-pointer select-none bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 hover:bg-[#F2F4F7] transition-colors">
              <input
                type="checkbox"
                checked={legalAccepted}
                onChange={(e) => setLegalAccepted(e.target.checked)}
                aria-label="Saya menyetujui syarat, kebijakan refund, dan pembatalan langganan"
                className="w-4 h-4 mt-0.5 accent-[#F97316] flex-shrink-0"
              />
              <span className="text-xs text-[#1A1A1A] leading-relaxed">
                Saya sudah membaca dan menyetujui{" "}
                <Link to="/TermsOfService" target="_blank" rel="noopener" className="text-[#F97316] hover:underline font-semibold">Syarat & Ketentuan</Link>,{" "}
                <Link to="/RefundPolicy" target="_blank" rel="noopener" className="text-[#F97316] hover:underline font-semibold">Kebijakan Refund</Link>, dan{" "}
                <Link to="/CancellationPolicy" target="_blank" rel="noopener" className="text-[#F97316] hover:underline font-semibold">Kebijakan Pembatalan Langganan</Link>{" "}
                Atur Pintar.
              </span>
            </label>
            {!legalAccepted && (
              <p className="text-[11px] text-[#F97316] font-semibold mt-2 ml-1">
                Centang persetujuan di atas untuk mengaktifkan tombol "Bayar Sekarang".
              </p>
            )}
          </div>
        )}
      </div>

      {/* Checkout Disclaimer Modal — must be acknowledged before redirect to Xendit */}
      {pendingCheckoutPlan && (
        <CheckoutDisclaimerModal
          plan={pendingCheckoutPlan}
          priceLabel={pendingCheckoutPlan.price}
          loading={loadingSnap}
          onClose={() => setPendingCheckoutPlan(null)}
          onConfirm={() => handleBuy(pendingCheckoutPlan.key)}
        />
      )}

      {/* Success Modal */}
      {successPlan && successPlan !== "pending" && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-9 h-9 text-green-500" />
            </div>
            <p className="text-xl font-bold text-[#1A1A1A] mb-1">Pembayaran Berhasil! 🎉</p>
            <p className="text-sm text-[#8FA4C8] mt-1 mb-3">
              Selamat! Kamu sekarang pengguna <span className="font-bold text-[#F97316]">Premium</span>.
            </p>
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 text-left mb-5 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[#8FA4C8]">Produk</span>
                <span className="font-semibold text-[#1A1A1A]">Atur Pintar Premium</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#8FA4C8]">Paket</span>
                <span className="font-semibold text-[#1A1A1A]">{successPlan === "premium_monthly" ? "Premium Bulanan" : "Premium Tahunan"}</span>
              </div>
              {orderId && (
                <div className="flex justify-between text-xs">
                  <span className="text-[#8FA4C8]">No. Order</span>
                  <span className="font-mono font-semibold text-[#1A1A1A]">{orderId}</span>
                </div>
              )}
              <div className="pt-1.5 border-t border-[#E2E8F0]">
                <p className="text-[10px] text-[#8FA4C8] text-center">Pembayaran diterima oleh PT Rideff Vreka Tech</p>
              </div>
            </div>
            <button
              onClick={() => setSuccessPlan(null)}
              className="w-full py-3 bg-[#F97316] text-white rounded-xl font-semibold text-sm hover:bg-[#e05e00] transition-colors"
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
            <button onClick={() => setSuccessPlan(null)} className="w-full py-3 bg-[#F97316] text-white rounded-xl font-semibold text-sm hover:bg-[#e05e00] transition-colors">
              OK, Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  );
}