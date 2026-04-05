import { useState } from "react";
import { CreditCard, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";
import { useAppSettings } from "@/components/utils/useAppSettings";

export default function DebtNanaPanel({ debts }) {
  const { formatCurrency } = useAppSettings();
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState(null);

  const activeDebts = debts?.filter(d => d.status === "active") || [];
  if (activeDebts.length === 0) return null;

  const totalRemaining = activeDebts.reduce((s, d) => s + (d.remaining_amount || 0), 0);
  const totalMonthly = activeDebts.reduce((s, d) => s + (d.monthly_payment || 0), 0);

  async function getAdvice() {
    setLoading(true);
    setExpanded(true);

    const sortedByInterest = [...activeDebts].sort((a, b) => (b.interest_rate || 0) - (a.interest_rate || 0));
    const details = sortedByInterest.map(d =>
      `- ${d.name} (${d.type}): sisa ${formatCurrency(d.remaining_amount)}, bunga ${d.interest_rate || 0}%/tahun, cicilan ${formatCurrency(d.monthly_payment || 0)}/bulan`
    ).join("\n");

    const prompt = `Kamu adalah Nana AI, asisten keuangan personal.

PENTING: Jawab HANYA tentang strategi pengelolaan utang di bawah. Jangan bahas investasi, anggaran, atau topik lain.

Utang aktif pengguna (urutan bunga tertinggi):
${details}

Total sisa utang: ${formatCurrency(totalRemaining)}
Total cicilan bulanan: ${formatCurrency(totalMonthly)}/bulan

Berikan rekomendasi KHUSUS UTANG:
1. Strategi pelunasan optimal (Avalanche/Snowball) beserta alasannya
2. Potensi penghematan bunga jika mengikuti strategi tersebut
3. Tips konkret untuk mempercepat pelunasan

Format: poin singkat, angka konkret, maksimal 150 kata. Bahasa Indonesia santai.`;

    const res = await base44.integrations.Core.InvokeLLM({ prompt });
    setAdvice(typeof res === "string" ? res : res?.response || "Gagal memuat saran.");
    setLoading(false);
  }

  const hasHighInterest = activeDebts.some(d => (d.interest_rate || 0) >= 18);

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <button
        onClick={() => { if (!advice && !loading) getAdvice(); else setExpanded(e => !e); }}
        className="w-full flex items-center gap-3 p-4 hover:bg-[#F8FAFC] transition-colors text-left"
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${hasHighInterest ? "bg-[#FF6B6B]/10" : "bg-[#F5A623]/10"}`}>
          <CreditCard className={`w-5 h-5 ${hasHighInterest ? "text-[#FF6B6B]" : "text-[#F5A623]"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#1A1A1A]">
            {hasHighInterest ? "⚠️" : "💡"} Strategi Pelunasan Utang Nana AI
          </p>
          <p className="text-xs text-[#8FA4C8]">{activeDebts.length} utang aktif · {formatCurrency(totalRemaining)}</p>
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
              <span>Nana AI menganalisis strategi utangmu...</span>
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