import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Check, Crown, X, Clock, CheckCircle2, Zap } from "lucide-react";

const PLANS = [
  {
    key: "free",
    label: "Free",
    price: "Rp 0",
    period: "selamanya",
    color: "border-[#E2E8F0]",
    badge: null,
    features: [
      "Catat transaksi",
      "Nana AI chat (basic)",
      "Dashboard keuangan",
      "Analitik dasar",
      "AI insight sederhana",
      "Goals & Budget basic",
    ],
  },
  {
    key: "premium_monthly",
    label: "Premium",
    price: "Rp 39.000",
    period: "per bulan",
    color: "border-[#FF6A00]",
    badge: "Populer",
    features: [
      "Semua fitur Free",
      "AI financial coach penuh",
      "AI insight lebih dalam",
      "Prediksi cashflow otomatis",
      "Analitik lanjutan",
      "Financial health score",
      "Laporan keuangan bulanan",
      "Unlimited AI chat",
      "Export PDF & Google Sheets",
      "Custom kategori & widget",
    ],
  },
  {
    key: "premium_yearly",
    label: "Premium Tahunan",
    price: "Rp 299.000",
    period: "per tahun",
    color: "border-purple-500",
    badge: "Hemat 36%",
    features: [
      "Semua fitur Premium",
      "Harga lebih hemat",
      "Priority support",
    ],
  },
];

const BANK_INFO = {
  bank: "BCA",
  account_number: "0850064971",
  account_name: "Rialto Daphino Effendy",
};

export default function Subscription() {
  const [user, setUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existingPayment, setExistingPayment] = useState(null);
  const [loadingSnap, setLoadingSnap] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      base44.entities.SubscriptionPayment.filter({ user_email: user.email, status: "pending" })
        .then((res) => { if (res.length > 0) setExistingPayment(res[0]); })
        .catch(() => {});
    }
  }, [user]);

  // Load Midtrans Snap script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', 'Mid-client-DbRxTJwt9Fuh-xM6');
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  async function handleSelectPlan(plan) {
    if (plan.key === "free") return;
    setSelectedPlan(plan);
    setLoadingSnap(true);

    const res = await base44.functions.invoke('createMidtransTransaction', { plan: plan.key });
    const { token } = res.data;

    setLoadingSnap(false);

    window.snap.pay(token, {
      onSuccess: async (result) => {
        await base44.auth.updateMe({ subscription_status: 'pending', subscription_plan: plan.key });
        setUser((u) => ({ ...u, subscription_status: 'pending' }));
        setSubmitted(true);
        setShowPaymentModal(true);
      },
      onPending: async () => {
        await base44.auth.updateMe({ subscription_status: 'pending', subscription_plan: plan.key });
        setUser((u) => ({ ...u, subscription_status: 'pending' }));
        setSubmitted(true);
        setShowPaymentModal(true);
      },
      onError: (result) => {
        console.error('Payment error', result);
      },
      onClose: () => {
        // User menutup popup tanpa bayar
      },
    });
  }

  const isPremium = user?.subscription_plan === "premium_monthly" || user?.subscription_plan === "premium_yearly";
  const isPending = user?.subscription_status === "pending";

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

        {/* Status Badge */}
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

        {isPending && !isPremium && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-500" />
            <div>
              <p className="text-sm font-bold text-amber-700">Pembayaran Sedang Diverifikasi</p>
              <p className="text-xs text-amber-600">Admin akan mengonfirmasi dalam 1×24 jam.</p>
            </div>
          </div>
        )}

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((plan) => {
            const isActive = user?.subscription_plan === plan.key;
            return (
              <div
                key={plan.key}
                className={`bg-white rounded-2xl shadow-sm border-2 ${plan.color} overflow-hidden relative`}
              >
                {plan.badge && (
                  <div className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    plan.key === "premium_monthly" ? "bg-[#FF6A00] text-white" : "bg-purple-500 text-white"
                  }`}>
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
                  </ul>
                  {plan.key === "free" ? (
                    <div className={`w-full py-2.5 rounded-xl text-sm font-semibold text-center ${
                      isActive ? "bg-[#F2F4F7] text-[#8FA4C8]" : "bg-[#F2F4F7] text-[#8FA4C8]"
                    }`}>
                      {isActive ? "Paket Aktif" : "Paket Gratis"}
                    </div>
                  ) : isActive && isPremium ? (
                    <div className="w-full py-2.5 rounded-xl text-sm font-semibold text-center bg-[#FF6A00]/10 text-[#FF6A00]">
                      ✓ Aktif
                    </div>
                  ) : isPending ? (
                    <div className="w-full py-2.5 rounded-xl text-sm font-semibold text-center bg-amber-50 text-amber-600">
                      Menunggu Konfirmasi
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSelectPlan(plan)}
                      disabled={loadingSnap}
                      className={`w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2 ${
                        plan.key === "premium_monthly"
                          ? "bg-[#FF6A00] hover:bg-[#e05e00]"
                          : "bg-purple-500 hover:bg-purple-600"
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

        {/* FAQ */}
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
      {showPaymentModal && submitted && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-6 text-center">
            <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-3" />
            <p className="text-lg font-bold text-[#1A1A1A]">Pembayaran Berhasil!</p>
            <p className="text-sm text-[#8FA4C8] mt-1">Langganan kamu sedang diproses dan akan aktif dalam beberapa menit.</p>
            <button
              onClick={() => { setShowPaymentModal(false); setSubmitted(false); }}
              className="mt-4 w-full py-3 bg-[#FF6A00] text-white rounded-xl font-semibold text-sm"
            >
              Selesai
            </button>
          </div>
        </div>
      )}
    </div>
  );
}