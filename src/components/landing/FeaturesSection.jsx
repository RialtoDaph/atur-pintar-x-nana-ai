import { forwardRef } from "react";
import Reveal from "./Reveal";

const FEATURES = [
  { icon: "🎮", title: "Keuangan yang terasa kayak game.", desc: "Setiap kebiasaan finansial yang kamu lakuin = XP. Naik level, unlock fitur baru, jaga streak harianmu. Duit diatur sambil ngerasa menang tiap hari." },
  { icon: "✨", title: "Kenalan sama Nana, AI bestie finansialmu.", desc: "Bukan chatbot kaku. Nana tau pola pengeluaranmu, kasih insight yang jujur, dan cukup lucu buat bikin kamu gak mager buka app. Dia di pihak kamu, selalu." },
  { icon: "🏆", title: "Saingan nabung sama teman.", desc: "Shared wallet, leaderboard, dan challenge bareng. Karena kadang yang bikin kamu konsisten bukan aplikasinya, tapi tahu temenmu lagi ngejar juga." },
  { icon: "🔥", title: "Kebiasaan kecil, hasil nyata.", desc: "Daily missions yang ringan, achievable, dan numpuk jadi perubahan besar. Satu habit per hari sudah cukup untuk mulai." }
];

const FeaturesSection = forwardRef(function FeaturesSection(_, ref) {
  return (
    <section ref={ref} className="pb-24 px-5 sm:px-12 lg:px-20 relative z-10">
      <div className="max-w-4xl mx-auto">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-2 text-center">Kenalan sama cara baru ngatur uang.</h2>
        </Reveal>
        <Reveal delay={60}>
          <p className="text-center text-white/40 text-sm mb-10">Bukan sekadar catatan. Ini pengalaman.</p>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => (
            <Reveal key={i} delay={i * 70}>
              <div className="card-d rounded-2xl p-5 hover:border-[#F97316]/30 transition-all h-full flex flex-col gap-3">
                <span className="text-3xl">{f.icon}</span>
                <p className="text-white font-bold text-sm leading-snug">{f.title}</p>
                <p className="text-white/45 text-xs leading-relaxed flex-1">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
});

export default FeaturesSection;