import { useState } from "react";
import { ScreenWrapper, NanaAvatar, CTAButton } from "./shared";
import { INCOME_RANGES } from "./config";

// ─── Screen 11: Income Range ─────────────────────────────────────────────────
export default function Screen11({ onNext, loading, error }) {
  const [selected, setSelected] = useState(null);

  return (
    <ScreenWrapper>
      <div className="flex-1 px-6 py-8 overflow-y-auto">
        <div className="flex items-center gap-3 mb-6">
          <NanaAvatar size="sm" />
          <div className="bg-[#F2F4F7] rounded-2xl rounded-tl-sm px-4 py-3 flex-1">
            <p className="text-sm text-[#1A1A1A] leading-relaxed">
              Terakhir, biar Nana bisa kasih saran yang relevan, Nana perlu tau income bulanan kamu.
            </p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          {INCOME_RANGES.map(r => (
            <button
              key={r.key}
              onClick={() => setSelected(r.key)}
              className={`w-full text-left px-4 py-3.5 rounded-2xl border-2 text-sm font-medium transition-all ${
                selected === r.key
                  ? "border-[#FF6B35] bg-[#FF6B35]/10 text-[#FF6B35]"
                  : "border-[#E2E8F0] bg-white text-[#1A1A1A]"
              }`}
            >
              {selected === r.key ? "● " : "○ "}{r.label}
            </button>
          ))}
        </div>

        <p className="text-xs text-[#8FA4C8] text-center">
          Data ini cuma buat Nana kasih saran yang relevan. Gak ada yang tau selain kamu dan Nana. 🔒
        </p>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-xs text-red-600 text-center">{error}</p>
          </div>
        )}
      </div>

      <div className="px-6 pb-8">
        <CTAButton
          onClick={() => onNext(selected)}
          disabled={!selected}
          loading={loading}
        >
          Selesai! →
        </CTAButton>
      </div>
    </ScreenWrapper>
  );
}