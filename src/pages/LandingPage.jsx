import { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { usePricing } from "@/hooks/usePricing";
import { CheckCircle, TrendingUp, Sparkles, Users, ArrowRight, Zap, BarChart2, MessageCircle, Shield } from "lucide-react";

const PROBLEMS = [
  { emoji: "💸", text: "Gaji masuk pagi, sore udah gak kerasa ada" },
  { emoji: "😩", text: "Nabung tapi selalu kepake pas butuh-butuhnya" },
  { emoji: "😶‍🌫️", text: "Akhir bulan cuma bisa nunggu gajian lagi" },
];

const STEPS = [
  { num: "01", title: "Tambah pengeluaran", desc: "Ketik atau pilih, selesai dalam 3 detik." },
  { num: "02", title: "Semua langsung tercatat", desc: "Rapi, terorganisir, gak ada yang kelewat." },
  { num: "03", title: "Lihat dashboard kamu", desc: "Kondisi keuangan seketika kelihatan jelas." },
  { num: "04", title: "Nana AI kasih insight", desc: "Langsung tahu kamu boros di mana." },
  { num: "05", title: "Analitik canggih", desc: "Sekali lihat, tau kemana uang pergi tiap bulan." },
];

const FEATURES = [
  { icon: <Zap className="w-5 h-5" />, title: "Pencatatan simpel", desc: "Gak ribet. Tambah transaksi dalam hitungan detik." },
  { icon: <BarChart2 className="w-5 h-5" />, title: "Dashboard jelas", desc: "Langsung ngerti kondisi keuangan tanpa pusing." },
  { icon: <TrendingUp className="w-5 h-5" />, title: "Analitik lengkap", desc: "Tau pola kebiasaan kamu dan kapan kamu boros." },
  { icon: <MessageCircle className="w-5 h-5" />, title: "Nana AI", desc: "Kasih saran real berdasarkan data keuangan kamu." },
];

export default function LandingPage() {
  const { monthly, yearly, monthlyLabel, yearlyLabel, yearlyDiscount, loading: pricingLoading } = usePricing();
  const howRef = useRef(null);
  const featuresRef = useRef(null);
  const pricingRef = useRef(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradePlan, setUpgradePlan] = useState("premium_monthly");

  const handleCTA = () => {
    base44.auth.redirectToLogin();
  };

  const handlePlanCTA = (planKey) => {
    if (planKey === "free") { base44.auth.redirectToLogin(); return; }
    setUpgradePlan(planKey);
    setShowUpgradeModal(true);
  };

  const scrollTo = (ref) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  const PLANS = [
    {
      key: "free",
      name: "Free",
      price: "Rp 0",
      period: "Gratis selamanya",
      features: ["Catat transaksi (unlimited)", "Dashboard keuangan", "Chat Nana AI (30x/bulan)", "Anggaran maks. 2 kategori", "Goals maks. 2 tujuan"],
      limits: ["❌ Fitur Investasi", "❌ Analitik lanjutan"],
      cta: "Mulai Gratis",
      highlight: false,
    },
    {
      key: "premium_monthly",
      name: "Premium",
      price: pricingLoading ? "..." : monthlyLabel,
      period: "per bulan",
      features: ["Semua fitur Free", "Anggaran & Goals unlimited", "Nana AI chat unlimited", "Fitur Investasi penuh", "Analitik lanjutan semua kartu", "Export PDF & Google Sheets", "Custom kategori & widget"],
      limits: [],
      cta: "Upgrade Sekarang",
      highlight: true,
      badge: "Populer",
    },
    {
      key: "premium_yearly",
      name: "Premium Tahunan",
      price: pricingLoading ? "..." : yearlyLabel,
      period: "per tahun",
      features: ["Semua fitur Premium", `Hemat ${yearlyDiscount}% vs bulanan`, "Priority support"],
      limits: [],
      cta: "Upgrade Sekarang",
      highlight: false,
      badge: yearlyDiscount > 0 ? `Hemat ${yearlyDiscount}%` : "Best Value",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans overflow-x-hidden">
      <style>{`
        .g-text { background: linear-gradient(90deg, #FF6A00, #FF8C42); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .glow { box-shadow: 0 0 32px rgba(255,106,0,0.35); }
        .card-d { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); }
      `}</style>

      {showUpgradeModal && (
        <LandingUpgradeModal
          plan={upgradePlan}
          monthly={monthly}
          yearly={yearly}
          monthlyLabel={monthlyLabel}
          yearlyLabel={yearlyLabel}
          yearlyDiscount={yearlyDiscount}
          onClose={() => setShowUpgradeModal(false)}
        />
      )}

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 sm:px-12 py-4 bg-[#0A0A0A]/80 backdrop-blur-lg border-b border-white/5">
        <div className="flex items-center gap-2">
          <img src="https://media.base44.com/images/public/69a82e8090f60786b869983c/d2e52bdf2_3.png" alt="Logo" className="w-7 h-7" />
          <span className="text-white font-black text-base tracking-tight">Atur Pintar</span>
        </div>
        <div className="hidden sm:flex items-center gap-6 text-white/50 text-sm">
          <button onClick={() => scrollTo(howRef)} className="hover:text-white transition-colors">Cara Kerja</button>
          <button onClick={() => scrollTo(featuresRef)} className="hover:text-white transition-colors">Fitur</button>
          <button onClick={() => scrollTo(pricingRef)} className="hover:text-white transition-colors">Harga</button>
        </div>
        <button
          onClick={handleCTA}
          className="bg-[#FF6A00] hover:bg-[#e05e00] text-white font-bold text-sm px-5 py-2 rounded-xl transition-all"
        >
          Mulai Gratis
        </button>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-20 px-5 sm:px-12 lg:px-20 relative">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#FF6A00]/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-3xl relative z-10">
          <div className="inline-flex items-center gap-2 bg-[#FF6A00]/10 border border-[#FF6A00]/20 rounded-full px-4 py-1.5 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#FF6A00]" />
            <span className="text-[#FF6A00] text-xs font-bold">AI-powered · Dibuat untuk orang Indonesia</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-white leading-tight mb-4">
            Kelola uang kamu<br />
            <span className="g-text">lebih cerdas.</span>
          </h1>
          <p className="text-white/45 text-base sm:text-lg max-w-xl mb-8 leading-relaxed">
            Catat pengeluaran, lacak tabungan, dan biarkan Nana AI kasih insight yang beneran berguna. Semua dalam satu tempat.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleCTA}
              className="inline-flex items-center justify-center gap-3 bg-[#FF6A00] hover:bg-[#e05e00] text-white font-black text-base px-8 py-4 rounded-2xl transition-all glow hover:scale-105 active:scale-95"
            >
              <Users className="w-5 h-5" />
              Mulai Gratis Sekarang
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollTo(howRef)}
              className="inline-flex items-center justify-center gap-2 border border-white/10 hover:border-white/20 text-white/60 hover:text-white font-semibold text-sm px-6 py-4 rounded-2xl transition-all"
            >
              Lihat Cara Kerja
            </button>
          </div>
        </div>
      </section>

      {/* PROBLEMS */}
      <section className="px-5 sm:px-12 lg:px-20 py-16 relative z-10">
        <div className="max-w-3xl">
          <p className="text-white/30 text-xs font-bold uppercase tracking-widest mb-4">Pernah ngalamin ini?</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PROBLEMS.map((p, i) => (
              <div key={i} className="card-d rounded-2xl p-5">
                <p className="text-3xl mb-3">{p.emoji}</p>
                <p className="text-white/65 text-sm leading-snug">{p.text}</p>
              </div>
            ))}
          </div>
          <p className="text-white/35 text-sm mt-6">Atur Pintar hadir buat bantu kamu keluar dari siklus ini. <span className="text-[#FF6A00] font-bold">Serius.</span></p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section ref={howRef} className="px-5 sm:px-12 lg:px-20 py-16 relative z-10">
        <div className="max-w-3xl">
          <p className="text-white/30 text-xs font-bold uppercase tracking-widest mb-2">Cara Kerja</p>
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-8">Sesimpel itu.</h2>
          <div className="space-y-4">
            {STEPS.map((step, i) => (
              <div key={i} className="card-d rounded-2xl p-5 flex items-start gap-4">
                <span className="text-[#FF6A00] font-black text-sm flex-shrink-0 mt-0.5">{step.num}</span>
                <div>
                  <p className="text-white font-bold text-sm mb-0.5">{step.title}</p>
                  <p className="text-white/40 text-xs">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section ref={featuresRef} className="px-5 sm:px-12 lg:px-20 py-16 relative z-10">
        <div className="max-w-3xl">
          <p className="text-white/30 text-xs font-bold uppercase tracking-widest mb-2">Fitur</p>
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-8">Semua yang kamu butuhkan.</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map((feat, i) => (
              <div key={i} className="card-d rounded-2xl p-5 flex gap-4 items-start">
                <div className="w-9 h-9 rounded-xl bg-[#FF6A00]/15 text-[#FF6A00] flex items-center justify-center flex-shrink-0">
                  {feat.icon}
                </div>
                <div>
                  <p className="text-white font-bold text-sm mb-1">{feat.title}</p>
                  <p className="text-white/40 text-xs leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section ref={pricingRef} className="px-5 sm:px-12 lg:px-20 py-16 relative z-10">
        <div className="max-w-4xl">
          <p className="text-white/30 text-xs font-bold uppercase tracking-widest mb-2">Harga</p>
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">Harga sederhana, gak ribet.</h2>
          <p className="text-white/40 text-sm mb-8">Akses semua fitur termasuk Nana AI</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PLANS.map((plan, i) => (
              <div key={i} className={`relative rounded-2xl p-6 flex flex-col ${plan.highlight ? "bg-[#FF6A00] border border-[#FF6A00]" : "card-d"}`}>
                {plan.badge && (
                  <div className={`absolute -top-3 left-6 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${plan.highlight ? "bg-white text-[#FF6A00]" : "bg-[#FF6A00] text-white"}`}>
                    {plan.badge}
                  </div>
                )}
                <p className="font-black text-base mb-1 text-white">{plan.name}</p>
                <p className={`text-3xl font-black mb-0.5 ${plan.highlight ? "text-white" : "g-text"}`}>{plan.price}</p>
                <p className={`text-xs mb-5 ${plan.highlight ? "text-white/70" : "text-white/35"}`}>{plan.period}</p>
                <div className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((feat, j) => (
                    <div key={j} className="flex items-center gap-2">
                      <CheckCircle className={`w-3.5 h-3.5 flex-shrink-0 ${plan.highlight ? "text-white" : "text-[#FF6A00]"}`} />
                      <p className={`text-xs ${plan.highlight ? "text-white/90" : "text-white/60"}`}>{feat}</p>
                    </div>
                  ))}
                  {plan.limits.map((lim, j) => (
                    <p key={`l-${j}`} className="text-xs text-white/25">{lim}</p>
                  ))}
                </div>
                <button
                  onClick={() => handlePlanCTA(plan.key)}
                  className={`w-full font-bold text-sm py-3 rounded-xl transition-all ${plan.highlight ? "bg-white text-[#FF6A00] hover:bg-white/90" : "border border-white/15 text-white hover:border-[#FF6A00]/50 hover:text-[#FF6A00]"}`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-5 sm:px-12 lg:px-20 pb-24 relative z-10">
        <div className="max-w-2xl card-d rounded-3xl p-10 sm:p-14 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-80 h-80 rounded-full bg-[#FF6A00]/6 blur-[80px] pointer-events-none" />
          <h2 className="text-2xl sm:text-4xl font-black text-white mb-3 leading-tight relative">
            Kalau kamu gak kontrol uangmu,<br />
            <span className="g-text">uangmu yang kontrol kamu.</span>
          </h2>
          <p className="text-white/40 text-sm mb-8 relative">Mulai gratis sekarang. Gak perlu kartu kredit. Upgrade kapanpun kamu mau.</p>
          <button
            onClick={handleCTA}
            className="inline-flex items-center gap-3 bg-[#FF6A00] hover:bg-[#e05e00] text-white font-black text-base px-10 py-4 rounded-2xl transition-all glow hover:scale-105 active:scale-95"
          >
            <Users className="w-5 h-5" />
            Mulai Gratis Sekarang
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-8 px-5 sm:px-12 lg:px-20 relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <img src="https://media.base44.com/images/public/69a82e8090f60786b869983c/d2e52bdf2_3.png" alt="Logo" className="w-5 h-5" />
          <span className="text-sm font-black text-white">Atur Pintar</span>
        </div>
        <p className="text-white/20 text-xs mb-3">© 2026 Atur Pintar. Kelola uangmu lebih cerdas.</p>
        <div className="flex items-center gap-4">
          <Link to="/PrivacyPolicy" className="text-white/30 hover:text-white/60 text-xs transition-colors">Kebijakan Privasi</Link>
          <span className="text-white/15 text-xs">·</span>
          <Link to="/TermsOfService" className="text-white/30 hover:text-white/60 text-xs transition-colors">Syarat & Ketentuan</Link>
        </div>
      </footer>
    </div>
  );
}

function LandingUpgradeModal({ plan, monthly, yearly, monthlyLabel, yearlyLabel, yearlyDiscount, onClose }) {
  const [selectedPlan, setSelectedPlan] = useState(plan || "premium_monthly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(null);

  useEffect(() => {
    if (!document.querySelector('script[src*="snap.midtrans.com"]')) {
      const script = document.createElement("script");
      script.src = "https://app.midtrans.com/snap/snap.js";
      script.setAttribute("data-client-key", "Mid-client-DbRxTJwt9Fuh-xM6");
      document.head.appendChild(script);
    }
    base44.auth.isAuthenticated().then(auth => setIsLoggedIn(auth));
  }, []);

  async function triggerPayment() {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("createMidtransTransaction", { plan: selectedPlan });
      const { token } = res.data;
      setLoading(false);
      window.snap.pay(token, {
        onSuccess: async () => {
          const endDate = new Date();
          if (selectedPlan === "premium_monthly") endDate.setMonth(endDate.getMonth() + 1);
          else endDate.setFullYear(endDate.getFullYear() + 1);
          await base44.auth.updateMe({
            subscription_status: "active",
            subscription_plan: selectedPlan,
            subscription_end_date: endDate.toISOString().split("T")[0],
          });
          setSuccess(true);
        },
        onPending: async () => {
          await base44.auth.updateMe({ subscription_status: "pending", subscription_plan: selectedPlan });
          setSuccess(true);
        },
        onError: () => setError("Pembayaran gagal. Silakan coba lagi."),
      });
    } catch (e) {
      setLoading(false);
      setError("Terjadi kesalahan. Coba lagi.");
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4">
        <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-sm p-8 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <p className="text-xl font-bold text-white mb-2">Selamat datang di Premium!</p>
          <p className="text-white/50 text-sm mb-6">Akses premium kamu sudah aktif. Mulai jelajahi semua fitur.</p>
          <button onClick={() => { onClose(); window.location.href = "/Dashboard"; }} className="w-full py-3 bg-[#FF6A00] text-white rounded-xl font-bold hover:bg-[#e05e00] transition-colors">
            Ke Dashboard →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-[#FF6A00] to-[#FF8C42] p-5">
          <p className="text-white font-black text-lg mb-0.5">🚀 Satu langkah lagi</p>
          <p className="text-white/75 text-xs">menuju finansial lebih sehat</p>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 gap-2 mb-5">
            <button onClick={() => setSelectedPlan("premium_monthly")} className={`p-3 rounded-xl border-2 text-left transition-all ${selectedPlan === "premium_monthly" ? "border-[#FF6A00] bg-[#FF6A00]/10" : "border-white/10"}`}>
              <p className="text-white/50 text-[10px]">Bulanan</p>
              <p className="text-white font-black text-sm">{monthlyLabel}</p>
              <p className="text-white/30 text-[10px]">/bulan</p>
            </button>
            <button onClick={() => setSelectedPlan("premium_yearly")} className={`p-3 rounded-xl border-2 text-left relative transition-all ${selectedPlan === "premium_yearly" ? "border-purple-400 bg-purple-500/10" : "border-white/10"}`}>
              {yearlyDiscount > 0 && <span className="absolute -top-2 -right-1 bg-purple-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">Hemat {yearlyDiscount}%</span>}
              <p className="text-white/50 text-[10px]">Tahunan</p>
              <p className="text-white font-black text-sm">{yearlyLabel}</p>
              <p className="text-white/30 text-[10px]">/tahun</p>
            </button>
          </div>

          {error && <p className="text-red-400 text-xs mb-3 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

          <button
            onClick={() => { if (isLoggedIn) triggerPayment(); else base44.auth.redirectToLogin(); }}
            disabled={loading || isLoggedIn === null}
            className="w-full py-3 bg-[#FF6A00] hover:bg-[#e05e00] text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-colors"
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Memproses...</>
            ) : isLoggedIn ? "⚡ Bayar Sekarang" : "🔑 Login & Bayar"}
          </button>
          <p className="text-white/25 text-[10px] text-center mt-2">Pembayaran aman via Midtrans · SSL Encrypted</p>
        </div>
      </div>
    </div>
  );
}