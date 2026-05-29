import { ScreenWrapper, CTAButton } from "./shared";

// ─── Screen 3: Intro Quiz ────────────────────────────────────────────────────
export default function Screen3({ onNext, onSkip }) {
  return (
    <ScreenWrapper>
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-10">
        <div className="text-5xl mb-5">🧠</div>
        <h2 className="text-2xl font-bold text-[#1A1A1A] mb-3">Kenalan dulu,<br />baru kasih saran.</h2>
        <p className="text-[#4A5568] text-sm leading-relaxed max-w-xs mx-auto mb-8">
          5 pertanyaan singkat biar Nana tau gimana cara terbaik bantu kamu.
          <br /><br />
          Gak ada jawaban yang salah, yang salah itu kalau bohong ke diri sendiri. 😄
        </p>
      </div>
      <div className="px-6 pb-8 space-y-3">
        <CTAButton onClick={onNext}>
          Mulai Quiz →
        </CTAButton>
        <button
          onClick={onSkip}
          className="w-full py-3 text-sm font-medium text-[#8FA4C8] hover:text-[#FF6B35] transition-colors tap-highlight-fix"
        >
          Lewati quiz, isi yang penting aja
        </button>
      </div>
    </ScreenWrapper>
  );
}