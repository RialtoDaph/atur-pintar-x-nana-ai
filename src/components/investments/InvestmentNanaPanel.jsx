import { useState } from "react";
import { TrendingUp, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";
import { useAppSettings } from "@/components/utils/useAppSettings";

export default function InvestmentNanaPanel({ investments }) {
  const { formatCurrency } = useAppSettings();
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState(null);

  if (!investments || investments.length === 0) return null;

  const totalInvested = investments.reduce((s, i) => s + (i.initial_amount || 0), 0);
  const totalValue = investments.reduce((s, i) => s + (i.current_value || 0), 0);
  const totalGain = totalValue - totalInvested;
  const gainPct = totalInvested > 0 ? ((totalGain / totalInvested) * 100).toFixed(1) : 0;

  async function getAdvice() {
    setLoading(true);
    setExpanded(true);

    const details = investments.map(inv => {
      const ret = inv.initial_amount > 0 ? ((inv.current_value - inv.initial_amount) / inv.initial_amount * 100).toFixed(1) : 0;
      return `- ${inv.name} (${inv.type}): modal ${formatCurrency(inv.initial_amount)}, nilai kini ${formatCurrency(inv.current_value)}, return ${ret}%`;
    }).join("\n");

    const prompt = `Kamu adalah Nana AI, asisten keuangan personal.

PENTING: Jawab HANYA tentang topik investasi portofolio di bawah. Jangan bahas utang, anggaran, atau topik lain.

Portofolio investasi pengguna:
${details}

Ringkasan: modal total ${formatCurrency(totalInvested)}, nilai kini ${formatCurrency(totalValue)}, return ${gainPct}%

Berikan rekomendasi KHUSUS INVESTASI:
1. Analisis komposisi & diversifikasi portofolio saat ini
2. Rekomendasi optimasi atau aset tambahan yang sesuai
3. Tips manajemen risiko berdasarkan portofolio ini

Format: poin singkat, pakai emoji, maksimal 150 kata. Bahasa Indonesia santai.`;

    const res = await base44.integrations.Core.InvokeLLM({ prompt });
    setAdvice(typeof res === "string" ? res : res?.response || "Gagal memuat saran.");
    setLoading(false);
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <button
        onClick={() => { if (!advice && !loading) getAdvice(); else setExpanded(e => !e); }}
        className="w-full flex items-center gap-3 p-4 hover:bg-[#F8FAFC] transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-full bg-[#4F7CFF]/10 flex items-center justify-center flex-shrink-0">
          <TrendingUp className="w-5 h-5 text-[#4F7CFF]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#1A1A1A]">💡 Rekomendasi Investasi Nana AI</p>
          <p className="text-xs text-[#8FA4C8]">Analisis & optimasi portofoliomu</p>
        </div>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="w-4 h-4 text-[#FF6A00] animate-spin" />}
          {expanded ? <ChevronUp className="w-4 h-4 text-[#8FA4C8]" /> : <ChevronDown className="w-4 h-4 text-[#8FA4C8]" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-[#F2F4F7] pt-3">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-[#8FA4C8]">
              <Loader2 className="w-4 h-4 animate-spin text-[#FF6A00]" />
              <span>Nana AI menganalisis portofoliomu...</span>
            </div>
          ) : advice ? (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                  <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a82e8090f60786b869983c/7708b64f5_generated_image.png" alt="Nana" className="w-full h-full object-cover" />
                </div>
                <span className="text-xs font-semibold text-[#FF6A00]">Nana AI</span>
                <button onClick={() => { setAdvice(null); getAdvice(); }} className="ml-auto text-[10px] text-[#8FA4C8] hover:text-[#FF6A00] transition-colors">↻ Refresh</button>
              </div>
              <ReactMarkdown className="prose prose-sm max-w-none text-[#1A1A1A] [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:my-2 [&>li]:mb-1 text-sm leading-relaxed">
                {advice}
              </ReactMarkdown>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}