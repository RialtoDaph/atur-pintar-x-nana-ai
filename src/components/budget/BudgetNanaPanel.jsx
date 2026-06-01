import { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp, Loader2, AlertTriangle, TrendingDown } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";
import { useAppSettings } from "@/components/utils/useAppSettings";

const CATEGORY_LABELS = {
  housing: { id: "Rumah/Sewa", en: "Housing", emoji: "🏠" },
  food: { id: "Makanan", en: "Food", emoji: "🍔" },
  transport: { id: "Transportasi", en: "Transport", emoji: "🚗" },
  health: { id: "Kesehatan", en: "Health", emoji: "❤️" },
  entertainment: { id: "Hiburan", en: "Entertainment", emoji: "🎬" },
  shopping: { id: "Belanja", en: "Shopping", emoji: "🛍️" },
  subscriptions: { id: "Langganan", en: "Subscriptions", emoji: "📱" },
  other: { id: "Lainnya", en: "Other", emoji: "📦" },
};

function getCatLabel(key, lang) {
  const meta = CATEGORY_LABELS[key] || { emoji: "📦", id: key, en: key };
  return `${meta.emoji} ${lang === "id" ? meta.id : meta.en}`;
}

/**
 * Proactive budget alert panel powered by Nana AI.
 * Shows when budgets approach limits and offers lifestyle adjustment tips.
 */
export default function BudgetNanaPanel({ budgets, spendingByCategory, goals }) {
  const { formatCurrency, settings } = useAppSettings();
  const lang = settings?.language || "id";
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState(null);

  const fmt = (n) => `Rp ${Math.round(n || 0).toLocaleString("id-ID")}`;

  // Categorize budgets by alert level
  const nearLimit = []; // 70-85%
  const critical = [];  // 85-100%
  const exceeded = [];  // 100%+

  budgets.forEach(b => {
    const spent = spendingByCategory[b.category] || 0;
    const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0;
    const entry = { ...b, spent, pct: Math.round(pct), remaining: Math.max(b.amount - spent, 0) };
    if (pct >= 100) exceeded.push(entry);
    else if (pct >= 85) critical.push(entry);
    else if (pct >= 70) nearLimit.push(entry);
  });

  const alertBudgets = [...exceeded, ...critical, ...nearLimit];
  const allHealthy = alertBudgets.length === 0;

  const totalSavingsTarget = goals?.reduce((s, g) => s + Math.max((g.target_amount || 0) - (g.current_amount || 0), 0), 0) || 0;

  async function getLifestyleAdvice() {
    setLoading(true);
    setExpanded(true);

    const exceededText = exceeded.map(b =>
      `- ${getCatLabel(b.category, lang)}: terpakai ${fmt(b.spent)} dari limit ${fmt(b.amount)} (${b.pct}%, lebih ${fmt(b.spent - b.amount)})`
    ).join("\n");

    const criticalText = critical.map(b =>
      `- ${getCatLabel(b.category, lang)}: ${b.pct}% dari ${fmt(b.amount)}, sisa ${fmt(b.remaining)}`
    ).join("\n");

    const nearText = nearLimit.map(b =>
      `- ${getCatLabel(b.category, lang)}: ${b.pct}% dari ${fmt(b.amount)}, sisa ${fmt(b.remaining)}`
    ).join("\n");

    const healthyText = allHealthy
      ? budgets.map(b => {
          const spent = spendingByCategory[b.category] || 0;
          const pct = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
          return `- ${getCatLabel(b.category, lang)}: ${pct}% dari ${fmt(b.amount)}, sisa ${fmt(Math.max(b.amount - spent, 0))}`;
        }).join("\n")
      : "";

    const goalsText = totalSavingsTarget > 0
      ? `\nTarget tabungan yang belum tercapai: ${fmt(totalSavingsTarget)}`
      : "";

    const prompt = allHealthy
      ? `Kamu adalah Nana AI, asisten keuangan personal.

PENTING: Berikan HANYA saran tentang anggaran dan pengeluaran. Jangan bahas investasi, utang, atau topik lain.

Status anggaran pengguna bulan ini (semua sehat, di bawah 70%):
${healthyText}
${goalsText}

Berikan saran proaktif KHUSUS ANGGARAN:
1. Kebiasaan baik untuk mempertahankan anggaran tetap sehat
2. Peluang realokasi sisa anggaran ke tabungan/investasi
3. Tips agar konsisten sampai akhir bulan

Format: poin singkat, emoji, maksimal 150 kata. Bahasa Indonesia santai.`
      : `Kamu adalah Nana AI, asisten keuangan personal.

PENTING: Berikan HANYA saran tentang anggaran dan pengeluaran di bawah ini. Jangan bahas investasi, utang, atau topik lain.

Situasi anggaran pengguna bulan ini:
${exceededText ? `\n🔴 ANGGARAN TERLAMPAUI:\n${exceededText}` : ""}
${criticalText ? `\n🟠 MENDEKATI BATAS (85-100%):\n${criticalText}` : ""}
${nearText ? `\n🟡 PERLU PERHATIAN (70-85%):\n${nearText}` : ""}
${goalsText}

Berikan saran KHUSUS ANGGARAN yang spesifik dan praktis:
1. Cara menghemat di kategori yang terlampaui/mendekati batas
2. Tips kebiasaan sehari-hari untuk kontrol pengeluaran
3. Realokasi anggaran yang disarankan jika perlu

Format: emoji, singkat, berdampak. Maksimal 150 kata. Bahasa Indonesia santai.`;

    try {
      const res = await base44.integrations.Core.InvokeLLM({ prompt });
      setAdvice(typeof res === "string" ? res : res?.response || "Gagal memuat saran.");
    } catch {
      setAdvice("Gagal memuat saran. Coba lagi nanti.");
    }
    setLoading(false);
  }

  const severityColor = exceeded.length > 0 ? "#FF6B6B" : critical.length > 0 ? "#F5A623" : nearLimit.length > 0 ? "#FFB347" : "#4F7CFF";
  const severityBg = severityColor;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => {
          if (!advice && !loading) getLifestyleAdvice();
          else setExpanded(e => !e);
        }}
        className="w-full flex items-center gap-3 p-4 hover:bg-[#F8FAFC] transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2" style={{ ringColor: severityColor, boxShadow: `0 0 0 2px ${severityColor}33` }}>
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a82e8090f60786b869983c/7708b64f5_generated_image.png" alt="Nana AI" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#1A1A1A]">
            {exceeded.length > 0
              ? `⚠️ ${exceeded.length} Anggaran Terlampaui`
              : allHealthy
                ? `💡 Rekomendasi Anggaran Nana AI`
                : `🔔 ${alertBudgets.length} Anggaran Mendekati Batas`}
          </p>
          <p className="text-xs text-[#8FA4C8]">
            {allHealthy
              ? (lang === "id" ? "Tips proaktif menjaga anggaranmu tetap sehat" : "Proactive tips to keep your budget healthy")
              : (lang === "id" ? "Ketuk untuk saran penyesuaian dari Nana AI" : "Tap for Nana AI lifestyle tips")
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="w-4 h-4 text-[#FF6A00] animate-spin" />}
          {expanded
            ? <ChevronUp className="w-4 h-4 text-[#8FA4C8]" />
            : <ChevronDown className="w-4 h-4 text-[#8FA4C8]" />
          }
        </div>
      </button>

      {/* Budget status pills */}
      {!allHealthy && (
      <div className="px-4 pb-3 flex flex-wrap gap-1.5">
        {exceeded.map(b => (
          <span key={b.id} className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#FF6B6B]/10 text-[#FF6B6B]">
            {CATEGORY_LABELS[b.category]?.emoji || "📦"} {b.pct}% — Terlampaui
          </span>
        ))}
        {critical.map(b => (
          <span key={b.id} className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#F5A623]/10 text-[#F5A623]">
            {CATEGORY_LABELS[b.category]?.emoji || "📦"} {b.pct}% — Kritis
          </span>
        ))}
        {nearLimit.map(b => (
          <span key={b.id} className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-600">
            {CATEGORY_LABELS[b.category]?.emoji || "📦"} {b.pct}% — Perhatian
          </span>
        ))}
      </div>
      )}

      {/* Nana AI Advice */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-[#F2F4F7] pt-3">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-[#8FA4C8]">
              <Loader2 className="w-4 h-4 animate-spin text-[#FF6A00]" />
              <span>Nana AI sedang menyiapkan saran untukmu...</span>
            </div>
          ) : advice ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                  <img
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a82e8090f60786b869983c/7708b64f5_generated_image.png"
                    alt="Nana"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-xs font-semibold text-[#FF6A00]">Nana AI</span>
                <button onClick={() => { setAdvice(null); getLifestyleAdvice(); }} className="ml-auto text-[10px] text-[#8FA4C8] hover:text-[#FF6A00] transition-colors">↻ Refresh</button>
              </div>
              <ReactMarkdown className="prose prose-sm max-w-none text-[#1A1A1A] [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:my-2 [&>li]:mb-1 text-xs leading-relaxed">
                {advice}
              </ReactMarkdown>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}