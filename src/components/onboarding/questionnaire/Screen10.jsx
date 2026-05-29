import { useState } from "react";
import { ScreenWrapper, NanaAvatar, CTAButton } from "./shared";
import { FIRST_GOALS } from "./config";

// ─── Screen 10: First Goal ───────────────────────────────────────────────────
export default function Screen10({ onNext }) {
  const [selected, setSelected] = useState(null);
  const [customGoal, setCustomGoal] = useState("");

  const isValid = selected && (selected !== "custom" || customGoal.trim().length > 0);

  function handleNext() {
    if (!isValid) return;
    const goal = selected === "custom" ? customGoal.trim() : selected;
    onNext(goal);
  }

  return (
    <ScreenWrapper>
      <div className="flex-1 px-6 py-8 overflow-y-auto">
        <div className="flex items-center gap-3 mb-6">
          <NanaAvatar size="sm" />
          <div className="bg-[#F2F4F7] rounded-2xl rounded-tl-sm px-4 py-3 flex-1">
            <p className="text-sm text-[#1A1A1A] leading-relaxed">
              Sekarang, kamu mau nabung buat apa dalam 3 bulan ke depan?
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {FIRST_GOALS.filter(g => g.key !== "custom").map(goal => (
            <button
              key={goal.key}
              onClick={() => setSelected(goal.key)}
              className={`py-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                selected === goal.key
                  ? "border-[#FF6B35] bg-[#FF6B35]/10"
                  : "border-[#E2E8F0] bg-white"
              }`}
            >
              <span className="text-3xl">{goal.emoji}</span>
              <span className="text-xs font-semibold text-[#1A1A1A] text-center">{goal.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => setSelected("custom")}
          className={`w-full py-3 rounded-2xl border-2 flex items-center justify-center gap-2 transition-all mb-3 ${
            selected === "custom"
              ? "border-[#FF6B35] bg-[#FF6B35]/10"
              : "border-dashed border-[#CBD5E0]"
          }`}
        >
          <span>✏️</span>
          <span className="text-sm font-medium text-[#4A5568]">Tulis sendiri...</span>
        </button>

        {selected === "custom" && (
          <input
            type="text"
            placeholder="Nabung buat apa?"
            maxLength={50}
            className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35] bg-white mb-3"
            value={customGoal}
            onChange={e => setCustomGoal(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && isValid) {
                e.preventDefault();
                handleNext();
              }
            }}
            autoFocus
          />
        )}

        <p className="text-xs text-[#8FA4C8] text-center">
          Ini bukan komitmen seumur hidup. Bisa diubah kapan saja. Yang penting mulai dulu.
        </p>
      </div>

      <div className="px-6 pb-8">
        <CTAButton
          onClick={handleNext}
          disabled={!isValid}
        >
          Lanjut →
        </CTAButton>
      </div>
    </ScreenWrapper>
  );
}