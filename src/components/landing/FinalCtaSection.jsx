import { useNavigate } from "react-router-dom";
import Reveal from "./Reveal";

export default function FinalCtaSection() {
  const navigate = useNavigate();
  return (
    <section className="pb-0 px-5 sm:px-12 lg:px-20 relative z-10">
      <div className="relative rounded-3xl overflow-hidden py-20 px-8 sm:px-16 text-center bg-[#0A0A0A] border border-white/[0.08]">
        <div className="absolute top-0 left-0 w-64 h-64 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2" style={{ background: "radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full pointer-events-none translate-x-1/3 translate-y-1/3" style={{ background: "radial-gradient(circle, rgba(249,115,22,0.10) 0%, transparent 70%)" }} />
        <Reveal>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black g-text mb-4 leading-tight">Duit bukan musuh.<br />Malas yang musuh.</h2>
        </Reveal>
        <Reveal delay={100}>
          <p className="text-white/60 text-base mb-10 max-w-md mx-auto">Dan Atur Pintar ada buat lawan mager bareng kamu.</p>
        </Reveal>
        <Reveal delay={180}>
          <div className="flex justify-center">
            <button onClick={() => navigate("/register")} className="group flex items-center justify-center gap-2.5 bg-[#F97316] hover:bg-[#e05e00] text-white font-bold text-base px-8 py-4 rounded-2xl transition-all glow hover:scale-105 active:scale-95">
              Mulai Gratis Sekarang →
            </button>
          </div>
        </Reveal>
        <Reveal delay={250}>
          <p className="text-white/25 text-xs mt-8">Web app siap pakai sekarang. Aplikasi iOS & Android segera hadir.</p>
        </Reveal>
      </div>
    </section>
  );
}