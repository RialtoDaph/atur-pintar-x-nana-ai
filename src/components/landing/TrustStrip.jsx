import { Lock, Sparkles } from "lucide-react";

// Honest trust signals — no fake numbers. Diganti kalau sudah punya data real (X+ users, rating).
const TRUST_ITEMS = [
  { icon: "🇮🇩", label: "Buatan Indonesia" },
  { icon: <Lock className="w-3 h-3" />, label: "Data dienkripsi" },
  { icon: "💳", label: "Tanpa kartu kredit" },
  { icon: <Sparkles className="w-3 h-3" />, label: "AI-powered" }
];

export default function TrustStrip() {
  return (
    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-2 text-[11px] text-white/45">
      {TRUST_ITEMS.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="flex items-center justify-center w-4 text-white/60">{item.icon}</span>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}