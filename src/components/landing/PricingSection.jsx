import { forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import Reveal from "./Reveal";

const FREE_FEATURES = ["Expense & income tracker", "Daily missions & XP", "Nana AI basic (5 chat/hari)", "Leaderboard teman", "1 financial goal"];
const PLUS_FEATURES = ["Semua fitur Free", "Nana AI unlimited chat", "Advanced spending analytics", "Shared wallet unlimited", "Semua level unlocked", "Badge & skin eksklusif", "Laporan PDF bulanan"];

const PricingSection = forwardRef(function PricingSection(_, ref) {
  const navigate = useNavigate();
  return (
    <section ref={ref} className="pb-24 px-5 sm:px-12 lg:px-20 relative z-10">
      <div className="max-w-3xl mx-auto">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-2 text-center">Mulai gratis. Upgrade kalau udah ketagihan.</h2>
          <p className="text-center text-white/40 text-sm mb-10">Tanpa kartu kredit. Tanpa syarat tersembunyi.</p>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Reveal delay={60}>
            <div className="card-d rounded-2xl p-7 flex flex-col h-full">
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">Gratis</span>
              <p className="text-3xl font-black text-white mb-0.5">Rp 0</p>
              <p className="text-white/35 text-xs mb-6">per bulan</p>
              <div className="space-y-2.5 flex-1 mb-7">
                {FREE_FEATURES.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-[#F97316] flex-shrink-0" />
                    <p className="text-white/60 text-xs">{f}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate("/register")} className="w-full py-3 rounded-xl border border-[#F97316]/50 text-[#F97316] font-bold text-sm hover:bg-[#F97316]/10 transition-colors">
                Pilih Free →
              </button>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="relative rounded-2xl p-7 flex flex-col h-full bg-[#F97316] border-2 border-[#F97316]">
              <div className="absolute -top-3.5 left-6 bg-white text-[#F97316] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">POPULER ⭐</div>
              <span className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-3">Plus</span>
              <p className="text-3xl font-black text-white mb-0.5">Rp 49.000</p>
              <p className="text-white/70 text-xs mb-1">per bulan</p>
              <p className="text-white/60 text-[11px] mb-6">atau Rp 399.000/tahun <span className="text-white font-bold">(hemat ~32%)</span></p>
              <div className="space-y-2.5 flex-1 mb-7">
                {PLUS_FEATURES.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-white text-xs">⭐</span>
                    <p className="text-white/90 text-xs">{f}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate("/register")} className="w-full py-3 rounded-xl bg-white text-[#F97316] font-bold text-sm hover:bg-white/90 transition-colors">
                Upgrade ke Plus →
              </button>
            </div>
          </Reveal>
        </div>
        <Reveal delay={200}>
          <p className="text-center text-white/30 text-xs mt-5 italic">Lebih murah dari kopi yang kamu beli tadi pagi. ☕</p>
        </Reveal>
      </div>
    </section>
  );
});

export default PricingSection;