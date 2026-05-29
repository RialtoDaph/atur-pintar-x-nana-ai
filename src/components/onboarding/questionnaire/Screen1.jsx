import { motion } from "framer-motion";
import { ScreenWrapper, NanaAvatar, CTAButton } from "./shared";

// ─── Screen 1: Splash & Welcome ─────────────────────────────────────────────
export default function Screen1({ onNext }) {
  return (
    <ScreenWrapper>
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-10">
        <motion.img
          src="https://media.base44.com/images/public/69a82e8090f60786b869983c/d2e52bdf2_3.png"
          alt="Atur Pintar"
          className="w-16 h-16 mb-6"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
        />
        <NanaAvatar excited />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <h1 className="text-3xl font-bold text-[#1A1A1A] mb-3">Halo! 👋</h1>
          <p className="text-[#4A5568] text-sm leading-relaxed max-w-xs mx-auto">
            Aku <strong>Nana</strong>, dan aku bakal jadi teman finansial kamu yang paling jujur (dan paling lucu) yang pernah ada.
            <br /><br />
            Sebelum mulai, aku mau kenalan dulu sama kamu. Cuma 2 menit. Janji.
          </p>
        </motion.div>
      </div>
      <div className="px-6 pb-8">
        <CTAButton onClick={onNext}>
          Yuk Mulai →
        </CTAButton>
      </div>
    </ScreenWrapper>
  );
}