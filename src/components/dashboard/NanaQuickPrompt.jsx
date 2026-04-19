import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Sparkles } from "lucide-react";

const PROMPTS = [
  "Bagaimana kondisi keuanganku bulan ini?",
  "Apa yang bisa aku hemat?",
  "Analisis pengeluaranku",
];

export default function NanaQuickPrompt() {
  const navigate = useNavigate();

  function handlePrompt(prompt) {
    sessionStorage.setItem("nana_prefill", prompt);
    navigate(createPageUrl("Nana"));
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-[#F97316]" />
        <h3 className="text-sm font-bold text-[#1A1A1A]">Tanya Nana AI</h3>
      </div>
      <div className="space-y-2">
        {PROMPTS.map(prompt => (
          <button key={prompt} onClick={() => handlePrompt(prompt)}
            className="w-full text-left px-4 py-2.5 rounded-xl bg-[#FFF7ED] border border-[#F97316]/20 text-xs font-medium text-[#EA580C] hover:bg-[#FFF0DC] transition-colors tap-highlight-fix">
            💬 {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}