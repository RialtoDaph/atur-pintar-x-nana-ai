import { Crown } from "lucide-react";

export default function PremiumBlurCard({ children, title }) {
  return (
    <div className="relative rounded-2xl overflow-hidden">
      {title && (
        <div className="absolute top-0 left-0 right-0 z-10 px-5 pt-4 pb-2 bg-gradient-to-b from-white/90 to-transparent">
          <p className="text-sm font-bold text-[#1A1A1A]">{title}</p>
        </div>
      )}
      <div className="pointer-events-none select-none" style={{ filter: "blur(5px)", opacity: 0.6 }}>
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 rounded-2xl gap-2 px-6 text-center">
        <div className="w-10 h-10 rounded-full bg-[#F97316]/10 flex items-center justify-center">
          <Crown className="w-5 h-5 text-[#F97316]" />
        </div>
        <p className="text-sm font-bold text-[#1A1A1A]">Fitur Premium</p>
        <p className="text-xs text-[#8FA4C8]">Segera tersedia via App Store.</p>
      </div>
    </div>
  );
}