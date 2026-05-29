import { motion } from "framer-motion";
import { ScreenWrapper, NanaAvatar, CTAButton } from "./shared";
import { PERSONAS } from "./config";

// ─── Screen 9: Persona Reveal ─────────────────────────────────────────────────
export default function PersonaReveal({ persona, onNext }) {
  const p = PERSONAS[persona];
  return (
    <ScreenWrapper>
      <div className="flex-1 px-6 py-8 overflow-y-auto">
        <div className="text-center mb-6">
          <NanaAvatar excited size="lg" />
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-[#8FA4C8] text-sm mt-4 mb-1">Kamu adalah...</p>
            <h2 className="text-2xl font-bold text-[#1A1A1A]">{p.label}</h2>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          <div className="bg-[#F8FAFC] rounded-2xl p-4">
            <p className="text-sm text-[#4A5568] leading-relaxed">{p.desc}</p>
          </div>

          <div className="bg-[#F0FDF4] rounded-2xl p-4">
            <p className="text-xs font-bold text-[#16A34A] uppercase tracking-widest mb-3">Kekuatan kamu</p>
            {p.strengths.map((s, i) => (
              <div key={i} className="flex items-start gap-2 mb-1.5">
                <span className="text-[#16A34A]">✅</span>
                <span className="text-sm text-[#1A1A1A]">{s}</span>
              </div>
            ))}
          </div>

          <div className="bg-[#FFF7ED] rounded-2xl p-4">
            <p className="text-xs font-bold text-[#EA580C] uppercase tracking-widest mb-3">Area berkembang</p>
            {p.growth.map((g, i) => (
              <div key={i} className="flex items-start gap-2 mb-1.5">
                <span>📈</span>
                <span className="text-sm text-[#1A1A1A]">{g}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="px-6 pb-8">
        <CTAButton onClick={onNext}>
          Oke Nana, aku siap! →
        </CTAButton>
      </div>
    </ScreenWrapper>
  );
}