import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle, Users, Sparkles, TrendingUp, Shield, Zap, ChevronDown, X } from "lucide-react";

const SALARY_OPTIONS = [
  "< Rp 3.000.000",
  "Rp 3.000.000 – 5.000.000",
  "Rp 5.000.000 – 10.000.000",
  "Rp 10.000.000 – 20.000.000",
  "> Rp 20.000.000",
];

const TRACKING_OPTIONS = ["Tidak mencatat", "Notes di HP", "Excel / Spreadsheet", "Aplikasi lain"];
const INTEREST_OPTIONS = ["Ya", "Mungkin", "Belum yakin"];

const FEATURES = [
  { icon: "💬", title: "Catat via Chat dengan Nana AI", desc: "Ketik 'BArusan beli Martabak 20rb' dan Nana langsung mencatatnya otomatis" },
  { icon: "📊", title: "Analisis Cerdas AI", desc: "Lihat pola pengeluaran dan rekomendasi personal tiap bulan, Minggu, bahkan Harian" },
  { icon: "🎯", title: "Goals, Budget & Hutang Piutang", desc: "Buat tujuan tabungan dan pantau anggaran dengan mudah" },
  { icon: "🤖", title: "AI Financial Advisor", desc: "Tanya apa saja soal keuangan, Nana siap membantu 24/7" },
];

export default function LandingPage() {
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    whatsapp: "",
    job: "",
    salary_estimate: "",
    city: "",
    biggest_money_problem: "",
    current_finance_tracking_method: "",
    early_access_interest: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    base44.entities.WaitingList.list("-created_date", 1000)
      .then((data) => setCount(data.length))
      .catch(() => setCount(0));
  }, [submitted]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Nama wajib diisi";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Email tidak valid";
    if (!form.job.trim()) e.job = "Pekerjaan wajib diisi";
    if (!form.salary_estimate) e.salary_estimate = "Pilih perkiraan gaji";
    if (!form.city.trim()) e.city = "Asal kota wajib diisi";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    await base44.entities.WaitingList.create(form);
    setLoading(false);
    setSubmitted(true);
  };

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  };

  const slotsLeft = count !== null ? Math.max(0, 500 - count) : null;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif; }
        .gradient-text { background: linear-gradient(135deg, #FF6A00 0%, #FFB347 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .glow-orange { box-shadow: 0 0 40px rgba(255,106,0,0.3); }
        .card-dark { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); }
        .input-dark { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: white; }
        .input-dark:focus { outline: none; border-color: #FF6A00; box-shadow: 0 0 0 3px rgba(255,106,0,0.15); }
        .input-dark::placeholder { color: rgba(255,255,255,0.3); }
        .input-error { border-color: #EF4444 !important; }
      `}</style>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#FF6A00] flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-sm">Atur Pintar</span>
        </div>
        {slotsLeft !== null && slotsLeft > 0 && (
          <div className="hidden sm:flex items-center gap-2 bg-[#FF6A00]/10 border border-[#FF6A00]/20 rounded-full px-4 py-1.5">
            <div className="w-2 h-2 rounded-full bg-[#FF6A00] animate-pulse" />
            <span className="text-xs text-[#FF6A00] font-semibold">{slotsLeft} slot tersisa</span>
          </div>
        )}
        <button
          onClick={() => setShowForm(true)}
          className="text-xs font-semibold bg-[#FF6A00] hover:bg-[#e05e00] text-white px-4 py-2 rounded-full transition-colors"
        >
          Daftar Sekarang
        </button>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 text-center relative">
        {/* Background glow */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[#FF6A00]/8 blur-[120px] pointer-events-none" />
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-[#FF6A00]/10 border border-[#FF6A00]/20 rounded-full px-4 py-1.5 mb-6">
          <Sparkles className="w-3.5 h-3.5 text-[#FF6A00]" />
          <span className="text-xs text-[#FF6A00] font-semibold">Early Access — Gratis untuk 500 Orang Pertama</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl font-black leading-tight mb-6 max-w-3xl mx-auto">
          AI Financial Tracker yang Membantu Kamu Mengatur Uang{" "}
          <span className="gradient-text">Semudah Chat Nana AI</span>
        </h1>

        {/* Subheadline */}
        <p className="text-base sm:text-lg text-white/50 max-w-xl mx-auto mb-10 leading-relaxed">
          Kami sedang membuka akses terbatas. Daftar ke waiting list untuk mendapatkan akses pertama saat aplikasi diluncurkan secara{" "}
          <span className="text-white font-semibold">GRATIS</span>{" "}
          <br />
         <span className="text-[#FF6A00] text-sm">*hanya 500 orang pertama.</span>
        </p>

        {/* CTA */}
        <button
          onClick={() => setShowForm(true)}
          className="group inline-flex items-center gap-3 bg-[#FF6A00] hover:bg-[#e05e00] text-white font-bold text-base px-8 py-4 rounded-2xl transition-all glow-orange hover:scale-105 active:scale-95"
        >
          <Users className="w-5 h-5" />
          Gabung Waiting List
        </button>

        {/* Counter */}
        {count !== null && (
          <div className="mt-8 flex items-center justify-center gap-3">
            <div className="flex -space-x-2">
              {["🧑‍💼","👩‍💻","🧑‍🎓","👩‍💼","🧑‍🍳"].map((e, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-[#1A1A1A] border-2 border-[#0A0A0A] flex items-center justify-center text-sm">{e}</div>
              ))}
            </div>
            <p className="text-sm text-white/60">
              <span className="text-white font-bold">{count}</span> orang sudah bergabung
              {slotsLeft !== null && slotsLeft > 0 && (
                <span className="text-[#FF6A00] font-semibold"> · {slotsLeft} slot tersisa</span>
              )}
            </p>
          </div>
        )}
      </section>

      {/* Features */}
      <section className="px-6 pb-20 max-w-4xl mx-auto">
        <p className="text-center text-white/30 text-xs font-semibold uppercase tracking-widest mb-8">Yang akan kamu dapatkan</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map((f, i) => (
            <div key={i} className="card-dark rounded-2xl p-6 hover:border-[#FF6A00]/30 transition-colors">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-white mb-1">{f.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social Proof */}
      <section className="px-6 pb-24 text-center">
        <div className="card-dark rounded-3xl max-w-lg mx-auto p-8 glow-orange">
          <p className="text-5xl font-black gradient-text mb-2">{slotsLeft !== null ? Math.min(count, 500) : "..."}</p>
          <p className="text-white/50 text-sm">dari 500 slot sudah terisi</p>
          <div className="mt-4 w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-[#FF6A00] to-[#FFB347] h-2 rounded-full transition-all"
              style={{ width: `${count !== null ? Math.min((count / 500) * 100, 100) : 0}%` }}
            />
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="mt-6 w-full bg-[#FF6A00] hover:bg-[#e05e00] text-white font-bold py-3.5 rounded-xl transition-colors"
          >
            Amankan Slot Saya →
          </button>
        </div>
      </section>

      {/* Form Modal */}
      {showForm && !submitted && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm overflow-y-auto py-6 px-4">
          <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl p-7 relative my-auto">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-[#FF6A00] flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-xs font-semibold text-[#FF6A00]">Atur Pintar — Waiting List</span>
              </div>
              <h2 className="text-xl font-black text-white">Daftar Akses Awal</h2>
              <p className="text-sm text-white/40 mt-1">Isi form ini untuk mendapatkan akses pertama, gratis.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nama */}
              <div>
                <label className="text-xs font-semibold text-white/60 mb-1.5 block">Nama Lengkap *</label>
                <input
                  className={`input-dark w-full rounded-xl px-4 py-3 text-sm ${errors.name ? "input-error" : ""}`}
                  placeholder="John Doe"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                />
                {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-semibold text-white/60 mb-1.5 block">Email *</label>
                <input
                  type="email"
                  className={`input-dark w-full rounded-xl px-4 py-3 text-sm ${errors.email ? "input-error" : ""}`}
                  placeholder="nama@email.com"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
                {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
              </div>

              {/* WhatsApp */}
              <div>
                <label className="text-xs font-semibold text-white/60 mb-1.5 block">WhatsApp <span className="text-white/30">(opsional)</span></label>
                <input
                  className="input-dark w-full rounded-xl px-4 py-3 text-sm"
                  placeholder="08xx-xxxx-xxxx"
                  value={form.whatsapp}
                  onChange={(e) => handleChange("whatsapp", e.target.value)}
                />
              </div>

              {/* Pekerjaan */}
              <div>
                <label className="text-xs font-semibold text-white/60 mb-1.5 block">Pekerjaan *</label>
                <input
                  className={`input-dark w-full rounded-xl px-4 py-3 text-sm ${errors.job ? "input-error" : ""}`}
                  placeholder="Karyawan swasta, Freelancer, Mahasiswa..."
                  value={form.job}
                  onChange={(e) => handleChange("job", e.target.value)}
                />
                {errors.job && <p className="text-xs text-red-400 mt-1">{errors.job}</p>}
              </div>

              {/* Gaji */}
              <div>
                <label className="text-xs font-semibold text-white/60 mb-1.5 block">Perkiraan Gaji / Pendapatan per Bulan *</label>
                <div className="relative">
                  <select
                    className={`input-dark w-full rounded-xl px-4 py-3 text-sm appearance-none ${errors.salary_estimate ? "input-error" : ""} ${!form.salary_estimate ? "text-white/30" : "text-white"}`}
                    value={form.salary_estimate}
                    onChange={(e) => handleChange("salary_estimate", e.target.value)}
                  >
                    <option value="" disabled>Pilih rentang gaji</option>
                    {SALARY_OPTIONS.map((s) => <option key={s} value={s} className="bg-[#111] text-white">{s}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                </div>
                {errors.salary_estimate && <p className="text-xs text-red-400 mt-1">{errors.salary_estimate}</p>}
              </div>

              {/* Kota */}
              <div>
                <label className="text-xs font-semibold text-white/60 mb-1.5 block">Asal Kota *</label>
                <input
                  className={`input-dark w-full rounded-xl px-4 py-3 text-sm ${errors.city ? "input-error" : ""}`}
                  placeholder="Jakarta, Bandung, Surabaya..."
                  value={form.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                />
                {errors.city && <p className="text-xs text-red-400 mt-1">{errors.city}</p>}
              </div>

              {/* Tantangan keuangan */}
              <div>
                <label className="text-xs font-semibold text-white/60 mb-1.5 block">Tantangan terbesar kamu dalam mengatur uang? <span className="text-white/30">(opsional)</span></label>
                <textarea
                  className="input-dark w-full rounded-xl px-4 py-3 text-sm resize-none"
                  rows={3}
                  placeholder="Ceritakan tantanganmu..."
                  value={form.biggest_money_problem}
                  onChange={(e) => handleChange("biggest_money_problem", e.target.value)}
                />
              </div>

              {/* Tracking method */}
              <div>
                <label className="text-xs font-semibold text-white/60 mb-2 block">Saat ini kamu mencatat keuangan menggunakan apa? <span className="text-white/30"></span></label>
                <div className="grid grid-cols-2 gap-2">
                  {TRACKING_OPTIONS.map((opt) => (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => handleChange("current_finance_tracking_method", opt)}
                      className={`text-xs px-3 py-2.5 rounded-xl border font-medium transition-all text-left ${
                        form.current_finance_tracking_method === opt
                          ? "bg-[#FF6A00]/10 border-[#FF6A00] text-[#FF6A00]"
                          : "border-white/10 text-white/50 hover:border-white/20"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Early access interest */}
              <div>
                <label className="text-xs font-semibold text-white/60 mb-2 block">Jika aplikasi ini membantu, apakah kamu bersedia mencoba versi awal? <span className="text-white/30"></span></label>
                <div className="flex gap-2">
                  {INTEREST_OPTIONS.map((opt) => (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => handleChange("early_access_interest", opt)}
                      className={`flex-1 text-xs px-3 py-2.5 rounded-xl border font-medium transition-all ${
                        form.early_access_interest === opt
                          ? "bg-[#FF6A00]/10 border-[#FF6A00] text-[#FF6A00]"
                          : "border-white/10 text-white/50 hover:border-white/20"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#FF6A00] hover:bg-[#e05e00] disabled:opacity-60 text-white font-bold py-4 rounded-xl transition-all mt-2 text-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Mendaftarkan...
                  </span>
                ) : "🚀 Daftar Waiting List Sekarang"}
              </button>

              <p className="text-center text-white/25 text-[10px] leading-relaxed">
                Pengguna waiting list akan mendapatkan akses lebih awal sebelum peluncuran publik.
              </p>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {submitted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-sm shadow-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-9 h-9 text-green-400" />
            </div>
            <h2 className="text-xl font-black text-white mb-3">Kamu sudah masuk! 🎉</h2>
            <p className="text-white/50 text-sm leading-relaxed mb-6">
              Terima kasih! Kamu sudah masuk waiting list Atur Pintar.<br />
              Kami akan menghubungi kamu saat akses awal dibuka.
            </p>
            <div className="card-dark rounded-2xl p-4 mb-5">
              <p className="text-xs text-white/40 mb-1">Total yang sudah bergabung</p>
              <p className="text-3xl font-black gradient-text">{count}</p>
              <p className="text-xs text-white/40 mt-1">dari 100 slot</p>
            </div>
            <button
              onClick={() => { setShowForm(false); setSubmitted(false); }}
              className="w-full bg-white/8 hover:bg-white/12 border border-white/10 text-white/60 text-sm font-medium py-3 rounded-xl transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-md bg-[#FF6A00] flex items-center justify-center">
            <TrendingUp className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm font-bold text-white">Atur Pintar</span>
        </div>
        <p className="text-white/25 text-xs">© 2025 Atur Pintar. Segera hadir.</p>
      </footer>
    </div>
  );
}