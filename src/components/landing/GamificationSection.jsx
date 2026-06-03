import { useNavigate } from "react-router-dom";
import Reveal from "./Reveal";

const LEVELS = [
  { icon: "🌱", level: "Lv.1", label: "Newbie Ngatur" },
  { icon: "💸", level: "Lv.2", label: "Si Pencatat" },
  { icon: "🎯", level: "Lv.3", label: "Budgeter Muda" },
  { icon: "🤝", level: "Lv.4", label: "Social Saver" },
  { icon: "🧠", level: "Lv.5", label: "Financial Aware" },
  { icon: "🏆", level: "Lv.7", label: "Atur Pintar Pro" }
];

export default function GamificationSection() {
  const navigate = useNavigate();
  return (
    <section className="pb-16 px-5 sm:px-12 lg:px-20 relative z-10">
      <div className="max-w-4xl mx-auto card-d rounded-3xl p-6 sm:p-8 overflow-hidden">
        <Reveal>
          <div className="mb-5">
            <span className="text-[10px] font-black text-[#F97316] uppercase tracking-widest">Gamifikasi</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1 mb-1">Level up bukan cuma di game.</h2>
            <p className="text-white/40 text-xs leading-relaxed">Setiap kebiasaan finansial yang kamu lakuin punya reward nyata.</p>
          </div>
        </Reveal>
        <Reveal delay={80}>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-5">
            {LEVELS.map((lv, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl" style={{ background: "rgba(255,106,0,0.07)", border: "1px solid rgba(255,106,0,0.15)" }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-base"
                  style={{ background: `linear-gradient(135deg, rgba(255,106,0,${0.2 + i * 0.13}) 0%, rgba(255,179,71,${0.25 + i * 0.1}) 100%)`, border: "1px solid rgba(255,106,0,0.25)" }}>
                  {lv.icon}
                </div>
                <p className="text-[9px] font-black text-[#F97316]">{lv.level}</p>
                <p className="text-[8px] text-white/35 text-center leading-tight">{lv.label}</p>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={140}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-white/8">
            <p className="text-white/45 text-xs leading-relaxed">
              XP nambah tiap catat, jaga streak & dengerin Nana.<br />
              <span className="text-white/65 font-semibold">Karena konsistensi harusnya ada rewardnya.</span>
            </p>
            <button onClick={() => navigate("/register")} className="flex-shrink-0 flex items-center gap-1.5 bg-[#F97316] hover:bg-[#e05e00] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all whitespace-nowrap">
              Mulai Gratis →
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}