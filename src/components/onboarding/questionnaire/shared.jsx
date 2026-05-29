import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export function ScreenWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex flex-col min-h-full"
    >
      {children}
    </motion.div>
  );
}

export function NanaAvatar({ size = "lg", excited = false }) {
  const sz = size === "lg" ? "w-20 h-20" : "w-12 h-12";
  return (
    <motion.div
      animate={excited ? { scale: [1, 1.15, 0.95, 1.05, 1], rotate: [0, -5, 5, -3, 0] } : {}}
      transition={{ duration: 0.6, repeat: excited ? Infinity : 0, repeatDelay: 2 }}
      className={`${sz} rounded-full overflow-hidden shadow-lg mx-auto ring-2 ring-[#FF6B35]/30`}
    >
      <img
        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a82e8090f60786b869983c/7708b64f5_generated_image.png"
        alt="Nana"
        className="w-full h-full object-cover"
      />
    </motion.div>
  );
}

export function CTAButton({ onClick, disabled, loading, children, secondary = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40 ${
        secondary
          ? "border-2 border-[#FF6B35] text-[#FF6B35] bg-transparent"
          : "bg-[#FF6B35] text-white shadow-lg shadow-[#FF6B35]/30"
      }`}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
    </button>
  );
}