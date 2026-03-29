import { Crown } from "lucide-react";
import { Link } from "react-router-dom";

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
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 rounded-2xl gap-2">
        <div className="w-10 h-10 rounded-full bg-[#FF6A00]/10 flex items-center justify-center">
          <Crown className="w-5 h-5 text-[#FF6A00]" />
        </div>
        <p className="text-sm font-bold text-[#1A1A1A]">Fitur Premium</p>
        <p className="text-xs text-[#8FA4C8] text-center px-6">Upgrade untuk akses penuh ke fitur ini</p>
        <Link
          to="/Subscription"
          className="mt-1 px-4 py-2 bg-[#FF6A00] text-white rounded-xl text-xs font-bold hover:bg-[#e05e00] transition-colors shadow-sm"
        >
          Upgrade Sekarang
        </Link>
      </div>
    </div>
  );
}}>
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 rounded-2xl gap-2">
        <div className="w-10 h-10 rounded-full bg-[#FF6A00]/10 flex items-center justify-center">
          <Crown className="w-5 h-5 text-[#FF6A00]" />
        </div>
        <p className="text-sm font-bold text-[#1A1A1A]">Fitur Premium</p>
        <p className="text-xs text-[#8FA4C8] text-center px-6">Upgrade untuk akses penuh ke fitur ini</p>
        <Link
          to="/Subscription"
          className="mt-1 px-4 py-2 bg-[#FF6A00] text-white rounded-xl text-xs font-bold hover:bg-[#e05e00] transition-colors shadow-sm"
        >
          Upgrade Sekarang
        </Link>
      </div>
    </div>
  );
}