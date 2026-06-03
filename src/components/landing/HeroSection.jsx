import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import Reveal from "./Reveal";
import TrustStrip from "./TrustStrip";

export default function HeroSection({ onScrollToNewsletter }) {
  const navigate = useNavigate();
  return (
    <section className="pt-28 pb-24 px-5 sm:px-12 lg:px-20 relative z-10 text-center sm:text-left">
      <div className="absolute top-10 left-0 w-[600px] h-[500px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(255,106,0,0.06) 0%, transparent 70%)" }} />
      <div className="max-w-3xl mx-auto sm:mx-0">
        <Reveal>
          <div className="inline-flex items-center gap-2 bg-[#F97316]/10 border border-[#F97316]/25 rounded-full px-4 py-1.5 mb-7">
            <Sparkles className="w-3 h-3 text-[#F97316]" />
            <span className="text-[11px] text-[#F97316] font-bold uppercase tracking-wide">Early Access · AI-Powered</span>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black leading-[1.08] mb-6">
            Aplikasi keuangan yang<br />
            <span className="g-text">akhirnya kamu buka tiap hari.</span>
          </h1>
        </Reveal>

        <Reveal delay={160}>
          <p className="text-base sm:text-lg text-white/55 max-w-xl mb-10 leading-relaxed mx-auto sm:mx-0">
            Bukan karena harus, tapi karena seru.<br />
            Catat duit, naik level, saingan sama teman.<br />
            Atur Pintar hadir buat kamu yang capek merasa <em>guilty</em> soal keuangan.
          </p>
        </Reveal>

        <Reveal delay={240}>
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-center sm:justify-start mb-6">
            <button
              onClick={() => navigate("/register")}
              className="group flex items-center gap-2.5 bg-[#F97316] hover:bg-[#e05e00] text-white font-bold text-base px-8 py-4 rounded-2xl transition-all glow hover:scale-105 active:scale-95 w-full sm:w-auto justify-center">
              Mulai Gratis Sekarang
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={() => document.getElementById("features-section")?.scrollIntoView({ behavior: "smooth" })}
              className="flex items-center gap-2 text-white/60 hover:text-white font-semibold text-sm px-6 py-4 transition-all w-full sm:w-auto justify-center">
              Lihat fiturnya dulu ↓
            </button>
          </div>
        </Reveal>

        <Reveal delay={280}>
          <div className="mb-6">
            <TrustStrip />
          </div>
        </Reveal>

        <Reveal delay={320}>
          <p className="text-xs text-white/35 text-center sm:text-left">
            Mau dapet update dulu?{" "}
            <button onClick={onScrollToNewsletter} className="text-white/55 hover:text-white underline underline-offset-2 decoration-[#F97316]/40 transition-colors">
              Langganan newsletter
            </button>
          </p>
        </Reveal>
      </div>
    </section>
  );
}