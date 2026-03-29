import { useRef } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle, TrendingUp, Sparkles, Users, ArrowRight, Play, Zap, BarChart2, MessageCircle, Shield } from "lucide-react";

const PROBLEMS = [
  { emoji: "💸", text: "Gaji masuk, tapi gak tau kemana hilangnya" },
  { emoji: "😩", text: "Udah coba nabung, tapi selalu kepake juga" },
  { emoji: "😶‍🌫️", text: "Gak pernah tau kondisi keuangan sendiri" },
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

const PLANS = [
  {
    name: "Gratis",
    price: "Rp 0",
    period: "Gratis selamanya(terbatas)",
    features: ["Pencatatan transaksi", "Dashboard keuangan", "Laporan bulanan"],
    cta: "Mulai Gratis",
    highlight: false,
  },
  {
    name: "Premium",
    price: "Rp 39.000",
    period: "per bulan",
    features: ["Semua fitur gratis", "Nana AI tanpa batas", "Analitik canggih", "Budget & Goals tracker", "Export laporan"],
    cta: "Coba Sekarang",
    highlight: true,
    badge: "Paling populer",
  },
  {
    name: "Tahunan",
    price: "Rp 299.000",
    period: "per tahun",
    features: ["Semua fitur Premium", "Hemat 36% vs bulanan", "Prioritas support"],
    cta: "Coba Sekarang",
    highlight: false,
    badge: "Hemat 36%",
  },
];

export default function LandingPage() {
  const howRef = useRef(null);
  const featuresRef = useRef(null);
  const pricingRef = useRef(null);

  const handleCTA = () => {
    base44.auth.redirectToLogin();
  };

  const scrollToHow = () => {
    howRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif; }
        .g-text { background: linear-gradient(135deg, #FF6A00 0%, #FFB347 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .glow { box-shadow: 0 0 40px rgba(255,106,0,0.25); }
        .card-d { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); }
        .step-line::after { content: ''; position: absolute; left: 19px; top: 40px; bottom: -16px; width: 1px; background: rgba(255,106,0,0.2); }
      `}</style>

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 sm:px-8 py-4 bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-2">
          <img src="https://media.base44.com/images/public/69a82e8090f60786b869983c/d2e52bdf2_3.png" alt="Logo" className="w-7 h-7" />
          <span className="font-black text-white text-sm tracking-tight">Atur Pintar</span>
        </div>
        <div className="hidden sm:flex items-center gap-4">
          <button onClick={scrollToHow} className="text-xs text-white/50 hover:text-white transition-colors">Cara Kerja</button>
          <button onClick={() => featuresRef.current?.scrollIntoView({ behavior: "smooth" })} className="text-xs text-white/50 hover:text-white transition-colors">Fitur</button>
          <button onClick={() => pricingRef.current?.scrollIntoView({ behavior: "smooth" })} className="text-xs text-white/50 hover:text-white transition-colors">Harga</button>
        </div>
        <button
          onClick={handleCTA}
          className="text-xs font-bold bg-[#FF6A00] hover:bg-[#e05e00] text-white px-4 py-2 rounded-full transition-colors"
        >
          Masuk / Daftar
        </button>
      </nav>

      {/* 1. HERO */}
      <section className="pt-28 pb-20 px-5 sm:px-8 text-center relative">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-[#FF6A00]/6 blur-[140px] pointer-events-none" />

        <div className="inline-flex items-center gap-2 bg-[#FF6A00]/10 border border-[#FF6A00]/20 rounded-full px-4 py-1.5 mb-6">
          <Sparkles className="w-3 h-3 text-[#FF6A00]" />
          <span className="text-[11px] text-[#FF6A00] font-bold uppercase tracking-wide">AI-powered personal finance</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black leading-[1.1] mb-5 max-w-3xl mx-auto">
          Uang kamu hilang<br />
          <span className="g-text">tanpa sadar?</span>
        </h1>

        <p className="text-base sm:text-lg text-white/50 max-w-lg mx-auto mb-10 leading-relaxed">
          Atur Pintar bantu kamu catat pengeluaran dan kasih insight dari AI biar kamu{" "}
          <span className="text-white font-semibold">gak boros lagi.</span>
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleCTA}
            className="group flex items-center gap-2.5 bg-[#FF6A00] hover:bg-[#e05e00] text-white font-bold text-base px-8 py-4 rounded-2xl transition-all glow hover:scale-105 active:scale-95 w-full sm:w-auto"
          >
            <Users className="w-4 h-4" />
            Mulai Gratis Sekarang
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
          <button
            onClick={scrollToHow}
            className="flex items-center gap-2 text-white/60 hover:text-white border border-white/10 hover:border-white/20 font-semibold text-sm px-6 py-4 rounded-2xl transition-all w-full sm:w-auto"
          >
            <Play className="w-3.5 h-3.5" />
            Lihat Cara Kerja
          </button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-3">
          <div className="flex -space-x-2">
            {["🧑‍💼", "👩‍💻", "🧑‍🎓", "👩‍💼", "🧑‍🍳"].map((e, i) => (
              <div key={i} className="w-8 h-8 rounded-full bg-[#1A1A1A] border-2 border-[#0A0A0A] flex items-center justify-center text-sm">{e}</div>
            ))}
          </div>
          <p className="text-sm text-white/50">Ratusan pengguna aktif</p>
        </div>
      </section>

      {/* 2. PROBLEM */}
      <section className="px-5 sm:px-8 pb-20 max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-white/30 text-xs font-bold uppercase tracking-widest mb-2">Familiar gak?</p>
          <h2 className="text-2xl sm:text-3xl font-black text-white">Masalah yang kamu rasain juga</h2>
        </div>
        <div className="space-y-3">
          {PROBLEMS.map((p, i) => (
            <div key={i} className="card-d rounded-2xl px-5 py-4 flex items-center gap-4">
              <span className="text-2xl flex-shrink-0">{p.emoji}</span>
              <p className="text-white/80 text-sm sm:text-base font-medium leading-snug">{p.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 bg-[#FF6A00]/8 border border-[#FF6A00]/20 rounded-2xl px-5 py-4 text-center">
          <p className="text-white/70 text-sm leading-relaxed">
            Kamu gak sendirian. Dan ini bukan masalah kemauan —{" "}
            <span className="text-white font-semibold">ini masalah tools yang belum tepat.</span>
          </p>
        </div>
      </section>

      {/* 3. SOLUTION */}
      <section className="px-5 sm:px-8 pb-20 max-w-2xl mx-auto text-center">
        <p className="text-white/30 text-xs font-bold uppercase tracking-widest mb-2">Solusinya simpel</p>
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">Dengan Atur Pintar:</h2>
        <p className="text-[#FF6A00] font-bold text-sm mb-8">Bukan cuma catat. Tapi ngerti uang kamu.</p>
        <div className="space-y-3 text-left">
          {[
            { icon: "⚡", text: "Catat transaksi dalam 3 detik" },
            { icon: "📊", text: "Lihat kondisi keuangan langsung" },
            { icon: "🤖", text: "Dapat insight personal dari Nana AI" },
          ].map((item, i) => (
            <div key={i} className="card-d rounded-2xl px-5 py-4 flex items-center gap-4">
              <span className="text-2xl">{item.icon}</span>
              <p className="text-white font-semibold text-sm sm:text-base">{item.text}</p>
              <CheckCircle className="w-4 h-4 text-[#FF6A00] ml-auto flex-shrink-0" />
            </div>
          ))}
        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section ref={howRef} className="px-5 sm:px-8 pb-20 max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-white/30 text-xs font-bold uppercase tracking-widest mb-2">Cara kerja</p>
          <h2 className="text-2xl sm:text-3xl font-black text-white">Semudah ini, serius.</h2>
        </div>
        <div className="space-y-0">
          {STEPS.map((step, i) => (
            <div key={i} className={`relative flex gap-5 ${i < STEPS.length - 1 ? "pb-8 step-line" : ""}`}>
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#FF6A00]/15 border border-[#FF6A00]/30 flex items-center justify-center">
                <span className="text-[#FF6A00] text-xs font-black">{step.num}</span>
              </div>
              <div className="pt-1.5">
                <p className="text-white font-bold text-sm sm:text-base">{step.title}</p>
                <p className="text-white/40 text-xs mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <button
            onClick={handleCTA}
            className="inline-flex items-center gap-2 bg-[#FF6A00] hover:bg-[#e05e00] text-white font-bold text-sm px-6 py-3.5 rounded-xl transition-all hover:scale-105"
          >
            Coba Sekarang <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 5. FEATURES */}
      <section ref={featuresRef} className="px-5 sm:px-8 pb-20 max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-white/30 text-xs font-bold uppercase tracking-widest mb-2">Fitur utama</p>
          <h2 className="text-2xl sm:text-3xl font-black text-white">Yang kamu dapetin</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map((f, i) => (
            <div key={i} className="card-d rounded-2xl p-5 hover:border-[#FF6A00]/25 transition-colors group">
              <div className="w-9 h-9 rounded-xl bg-[#FF6A00]/10 flex items-center justify-center text-[#FF6A00] mb-3 group-hover:bg-[#FF6A00]/20 transition-colors">
                {f.icon}
              </div>
              <p className="text-white font-bold text-sm mb-1">{f.title}</p>
              <p className="text-white/45 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. SOCIAL PROOF */}
      <section className="px-5 sm:px-8 pb-20 max-w-2xl mx-auto">
        <div className="card-d rounded-3xl p-8 glow text-center">
          <div className="w-14 h-14 rounded-full bg-[#FF6A00]/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-[#FF6A00]" />
          </div>
          <p className="text-white/60 text-sm leading-relaxed italic">
            "Dirancang untuk membantu kamu yang sering bingung kemana uang pergi."
          </p>
          <p className="text-white/25 text-xs mt-3">— Tim Atur Pintar</p>
        </div>
      </section>

      {/* 7. PRICING */}
      <section ref={pricingRef} className="px-5 sm:px-8 pb-20 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-white/30 text-xs font-bold uppercase tracking-widest mb-2">Harga</p>
          <h2 className="text-2xl sm:text-3xl font-black text-white">Harga sederhana, gak ribet</h2>
          <p className="text-white/40 text-sm mt-2">Akses semua fitur termasuk Nana AI</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PLANS.map((plan, i) => (
            <div
              key={i}
              className={`relative rounded-2xl p-6 flex flex-col ${
                plan.highlight ? "bg-[#FF6A00] border border-[#FF6A00]" : "card-d"
              }`}
            >
              {plan.badge && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${
                  plan.highlight ? "bg-white text-[#FF6A00]" : "bg-[#FF6A00] text-white"
                }`}>
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
              </div>
              <button
                onClick={handleCTA}
                className={`w-full font-bold text-sm py-3 rounded-xl transition-all ${
                  plan.highlight
                    ? "bg-white text-[#FF6A00] hover:bg-white/90"
                    : "border border-white/15 text-white hover:border-[#FF6A00]/50 hover:text-[#FF6A00]"
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 8. FINAL CTA */}
      <section className="px-5 sm:px-8 pb-24 max-w-2xl mx-auto text-center">
        <div className="card-d rounded-3xl p-10 sm:p-14 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-[#FF6A00]/6 blur-[80px] pointer-events-none" />
          <h2 className="text-2xl sm:text-4xl font-black text-white mb-3 leading-tight relative">
            Kalau kamu gak kontrol uangmu,<br />
            <span className="g-text">uangmu yang kontrol kamu.</span>
          </h2>
          <p className="text-white/40 text-sm mb-8 relative">Mulai sekarang. Gratis 30 hari. Gak perlu kartu kredit.</p>
          <button
            onClick={handleCTA}
            className="relative group inline-flex items-center gap-3 bg-[#FF6A00] hover:bg-[#e05e00] text-white font-black text-base px-10 py-4 rounded-2xl transition-all glow hover:scale-105 active:scale-95"
          >
            <Users className="w-5 h-5" />
            Mulai Gratis Sekarang
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-8 text-center px-5">
        <div className="flex items-center justify-center gap-2 mb-2">
          <img src="https://media.base44.com/images/public/69a82e8090f60786b869983c/d2e52bdf2_3.png" alt="Logo" className="w-5 h-5" />
          <span className="text-sm font-black text-white">Atur Pintar</span>
        </div>
        <p className="text-white/20 text-xs">© 2025 Atur Pintar. Kelola uangmu lebih cerdas.</p>
      </footer>
    </div>
  );
}