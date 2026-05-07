import { useState } from "react";
import { X, Home } from "lucide-react";

export default function UMKMPintarAdBanner() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div
      className="relative bg-[#1C0F00] mx-4 mb-4 p-[14px]"
      style={{ borderRadius: 12 }}
    >
      {/* Sponsored label */}
      <span
        className="absolute top-2 left-3 text-white/40"
        style={{ fontSize: 10 }}
      >
        Sponsored
      </span>

      {/* Close button */}
      <button
        onClick={() => setVisible(false)}
        aria-label="Tutup iklan"
        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors tap-highlight-fix"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Brand row */}
      <div className="flex items-center gap-2 mt-3 mb-2">
        <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center gap-0.5 flex-shrink-0">
          <span className="text-[#E8520A] font-bold text-[10px] leading-none">UP</span>
          <Home className="w-2.5 h-2.5 text-[#E8520A]" />
        </div>
        <span className="text-white font-bold text-sm">UMKM Pintar</span>
      </div>

      {/* Headline */}
      <p className="text-white font-bold leading-snug" style={{ fontSize: 15 }}>
        Punya usaha sampingan?
      </p>

      {/* Subtext */}
      <p className="text-white/70 mt-1 mb-3 leading-snug" style={{ fontSize: 12 }}>
        Buat invoice, slip gaji & kwitansi profesional dalam menit.
      </p>

      {/* CTA */}
      <button
        onClick={() => window.open("https://umkmpintar.base44.app", "_blank")}
        className="bg-[#E8520A] text-white font-bold px-4 py-2 rounded-lg active:scale-95 transition-transform tap-highlight-fix"
        style={{ fontSize: 13 }}
      >
        Coba Gratis
      </button>
    </div>
  );
}