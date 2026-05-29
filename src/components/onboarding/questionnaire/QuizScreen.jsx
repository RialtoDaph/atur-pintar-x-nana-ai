import { useState, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { ScreenWrapper } from "./shared";

// ─── Screen 4–8: Quiz Questions ──────────────────────────────────────────────
// Parent uses `key={quiz-${questionIndex}}` so this component fully remounts
// per question — useState initializer is sufficient for pre-fill, no effect needed.
export default function QuizScreen({ questionIndex, totalQuestions, question, previousAnswer, onAnswer, onBack, canGoBack }) {
  const [selected, setSelected] = useState(previousAnswer || null);
  const isTransitioning = useRef(false);

  function handleSelect(key) {
    if (isTransitioning.current) return;
    isTransitioning.current = true;
    setSelected(key);
    setTimeout(() => onAnswer(key), 500);
  }

  function handleBack() {
    if (isTransitioning.current) return;
    isTransitioning.current = true;
    onBack();
  }

  // Progress: baseline = questions answered so far, animate to current if selected
  const baselinePct = (questionIndex / totalQuestions) * 100;
  const targetPct = ((questionIndex + (selected ? 1 : 0)) / totalQuestions) * 100;

  return (
    <ScreenWrapper>
      {/* Progress */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between text-xs text-[#8FA4C8] mb-2">
          <div className="flex items-center gap-2">
            {canGoBack && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-[#FF6B35] font-medium tap-highlight-fix"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Kembali
              </button>
            )}
            <span>Pertanyaan {questionIndex + 1} dari {totalQuestions}</span>
          </div>
          <span>{Math.round(targetPct)}%</span>
        </div>
        <div className="h-1.5 bg-[#F2F4F7] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#FF6B35] rounded-full"
            initial={{ width: `${baselinePct}%` }}
            animate={{ width: `${targetPct}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      <div className="flex-1 px-6 pb-6">
        <h2 className="text-lg font-bold text-[#1A1A1A] mb-6 leading-snug">{question.q}</h2>
        <div className="space-y-3">
          {question.opts.map(opt => (
            <motion.button
              key={opt.key}
              onClick={() => handleSelect(opt.key)}
              whileTap={{ scale: 0.97 }}
              className={`w-full text-left px-4 py-4 rounded-2xl border-2 flex items-center gap-3 transition-all duration-200 ${
                selected === opt.key
                  ? "border-[#FF6B35] bg-[#FF6B35]/10"
                  : "border-[#E2E8F0] bg-white hover:border-[#FF6B35]/40"
              }`}
            >
              <span className="text-2xl w-8 flex-shrink-0">{opt.emoji}</span>
              <span className="text-sm font-medium text-[#1A1A1A] leading-snug">{opt.text}</span>
              {selected === opt.key && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-auto w-5 h-5 rounded-full bg-[#FF6B35] flex items-center justify-center flex-shrink-0"
                >
                  <span className="text-white text-xs">✓</span>
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </ScreenWrapper>
  );
}