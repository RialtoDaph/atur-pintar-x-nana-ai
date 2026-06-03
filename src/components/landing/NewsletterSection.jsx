import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle } from "lucide-react";
import Reveal from "./Reveal";

const SPAM_NAME_PATTERNS = ["http", "https", ".com", ".net", ".org", ".id", "www.", "evil", "hack", "click", "klik"];
const isValidName = (name) => {
  const lower = name.toLowerCase();
  return !SPAM_NAME_PATTERNS.some((p) => lower.includes(p));
};
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

export default function NewsletterSection() {
  const [form, setForm] = useState({ name: "", email: "" });
  const [honeypot, setHoneypot] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Honeypot: silently reject if filled
    if (honeypot) return;

    // Client-side validation
    const newErrors = {};
    if (!isValidName(form.name)) newErrors.name = "Nama tidak valid, mohon isi nama asli kamu";
    if (!isValidEmail(form.email)) newErrors.email = "Format email tidak valid";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});

    setLoading(true);
    try {
      const res = await base44.functions.invoke("submitWaitingList", {
        name: form.name,
        email: form.email,
        source: "newsletter",
        honeypot
      });
      if (res.data?.error) throw new Error(res.data.error);
      setSuccess(true);
      if (window.confetti) window.confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 }, colors: ["#F97316", "#FFB347", "#ffffff"] });
    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("rate") || msg.includes("banyak") || msg.includes("limit")) {
        setErrors({ general: "Terlalu banyak percobaan, coba lagi nanti" });
      } else {
        setErrors({ general: "Gagal berlangganan, coba lagi." });
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <section id="newsletter-section" className="pb-24 px-5 sm:px-12 lg:px-20 relative z-10">
        <div className="max-w-lg mx-auto card-d rounded-3xl p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-[#F97316]/20 flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-[#F97316]" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Yeay! 🎉</h2>
          <p className="text-[#F97316] font-bold text-lg mb-3">Kamu sudah berlangganan.</p>
          <p className="text-white/60 text-sm leading-relaxed">
            Tips keuangan, update fitur baru, dan cerita seru dari Nana akan mampir ke inbox kamu.
          </p>
          <p className="text-white/40 text-xs mt-3">
            Dikirim ke <span className="text-white font-semibold">{form.email}</span>
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="newsletter-section" className="pb-24 px-5 sm:px-12 lg:px-20 relative z-10">
      <div className="max-w-lg mx-auto">
        <Reveal>
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">Belum siap daftar? Tetap stay updated.</h2>
            <p className="text-[#F97316] font-bold text-lg mb-3">Newsletter + Early Access Updates.</p>
            <p className="text-white/50 text-sm">Tips keuangan ringan, update fitur baru, dan akses awal ke rilis berikutnya. Tanpa spam.</p>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <form onSubmit={handleSubmit} className="card-d rounded-2xl p-6 space-y-4">
            {/* Honeypot */}
            <div style={{ position: "absolute", left: "-9999px", top: "-9999px", opacity: 0, pointerEvents: "none" }} aria-hidden="true">
              <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
            </div>

            {errors.general && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-xs font-medium">
                {errors.general}
              </div>
            )}

            <div>
              <label className="text-white/60 text-xs mb-1.5 block">Nama *</label>
              <input required value={form.name} onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setErrors((er) => ({ ...er, name: undefined })); }} placeholder="Nama kamu" className={`bg-white/5 text-white px-4 py-3 text-sm rounded-xl w-full border placeholder-white/25 outline-none focus:border-[#F97316]/50 ${errors.name ? "border-red-500/60" : "border-white/10"}`} />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="text-white/60 text-xs mb-1.5 block">Email aktif *</label>
              <input required type="email" value={form.email} onChange={(e) => { setForm((f) => ({ ...f, email: e.target.value })); setErrors((er) => ({ ...er, email: undefined })); }} placeholder="email@kamu.com" className={`bg-white/5 text-white px-4 py-3 text-sm rounded-xl w-full border placeholder-white/25 outline-none focus:border-[#F97316]/50 ${errors.email ? "border-red-500/60" : "border-white/10"}`} />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>
            <button type="submit" disabled={loading} className="w-full py-4 bg-[#F97316] hover:bg-[#e05e00] text-white font-black text-base rounded-full transition-all disabled:opacity-60 mt-2">
              {loading ? "Berlangganan..." : "Langganan Newsletter →"}
            </button>
            <p className="text-center text-white/30 text-xs">Gratis. Bisa unsubscribe kapan saja.</p>
          </form>
        </Reveal>
      </div>
    </section>
  );
}