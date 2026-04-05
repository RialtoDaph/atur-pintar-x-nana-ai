import { useState } from "react";
import { Target, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";
import { useAppSettings } from "@/components/utils/useAppSettings";

export default function GoalsNanaPanel({ goals }) {
  const { formatCurrency } = useAppSettings();
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState(null);

  const activeGoals = goals?.filter(g => g.status === "active") || [];
  if (activeGoals.length === 0) return null;

  const today = new Date();

  async function getAdvice() {
    setLoading(true);
    setExpanded(true);

    const details = activeGoals.map(g => {
      const pct = g.target_amount > 0 ? Math.round(((g.current_amount || 0) / g.target_amount) * 100) : 0;
      const remaining = g.target_amount - (g.current_amount || 0);
      const daysLeft = g.deadline ? Math.round((new Date(g.deadline) - today) / (1000 * 60 * 60 * 24)) : null;
      return `- ${g.name}: ${formatCurrency(g.current_amount || 0)}/${formatCurrency(g.target_amount)} (${pct}%)${daysLeft !== null ? `, deadline ${daysLeft} hari lagi` : ""}, sisa ${formatCurrency(remaining)}`;
    }).join("\n");

    const prompt = `Kamu adalah Nana AI, asisten keuangan personal.

PENTING: Jawab HANYA tentang strategi pencapaian tujuan tabungan di bawah. Jangan bahas investasi, utang, atau topik lain.

Tujuan tabungan aktif pengguna:
${details}

Berikan rekomendasi KHUSUS TUJUAN TABUNGAN:
1. Prioritas tujuan mana yang harus difokuskan dan alasannya
2. Berapa perlu ditabung per bulan untuk masing-masing tujuan mendesak
3. Tips konkret mempercepat pencapaian tujuan

Format: poin singkat, angka konkret, maksimal 150 kata. Bahasa Indonesia santai.`;

    const res = await base44.integrations.Core.InvokeLLM({ prompt });
    setAdvice(typeof res === "string" ? res : res?.response || "Gagal memuat saran.");
    setLoading(false);
  }

  const urgentCount = activeGoals.filter(g => {
    if (!g.deadline) return false;
    const days = Math.round((new Date(g.deadline) - today) / (1000 * 60 * 60 * 24));
    const pct = g.target_amount > 0 ? ((g.current_amount || 0) / g.target_amount) * 100 : 0;
    return days < 30 && pct < 100;
  }).length;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <button
        onClick={() => { if (!advice && !loading) getAdvice(); else setExpanded(e => !e); }}
        className="w-full flex items-center gap-3 p-4 hover:bg-[#F8FAFC] transition-colors text-left"
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${urgentCount > 0 ? "bg-[#F5A623]/10" : "bg-[#4F7CFF]/10"}`}>
          <Target className={`w-5 h-5 ${urgentCount > 0 ? "text-[#F5A623]" : "text-[#4F7CFF]"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#1A1A1A]">
            {urgentCount > 0 ? `⚠️ ${urgentCount} Tujuan Mendesak` : "💡"} Strategi Tabungan Nana AI
          </p>
          <p className="text-xs text-[#8FA4C8]">{activeGoals.length} tujuan aktif</p>
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
              <span>Nana AI menganalisis tujuanmu...</span>
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