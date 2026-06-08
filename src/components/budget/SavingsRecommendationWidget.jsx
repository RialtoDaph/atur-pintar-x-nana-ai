import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAppSettings } from "@/components/utils/useAppSettings";

// Fallback labels for legacy/built-in category keys (kept for backward compatibility)
const CATEGORY_LABELS = {
  housing: { id: "Rumah/Sewa", en: "Housing/Rent", emoji: "🏠" },
  food: { id: "Makanan", en: "Food", emoji: "🍔" },
  transport: { id: "Transportasi", en: "Transport", emoji: "🚗" },
  health: { id: "Kesehatan", en: "Health", emoji: "❤️" },
  entertainment: { id: "Hiburan", en: "Entertainment", emoji: "🎬" },
  shopping: { id: "Belanja", en: "Shopping", emoji: "🛍️" },
  subscriptions: { id: "Langganan", en: "Subscriptions", emoji: "📱" },
  other: { id: "Lainnya", en: "Other", emoji: "📦" },
};

// Detect raw IDs (e.g. "69e5598816967cd0bb4dc383") so we can hide them as labels
function isRawId(key) {
  return typeof key === "string" && /^[a-f0-9]{20,}$/i.test(key);
}

export default function SavingsRecommendationWidget({ spendingByCategory, budgets, transactions3M, getCategoryMeta }) {
  const { formatCurrency, settings } = useAppSettings();
  const lang = settings.language || "id";
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [expanded, setExpanded] = useState(false);

  // Resolve category key → "emoji label" string.
  // Priority: parent-provided categoryMap (real names from DB) → static fallback → "Lainnya" if raw ID.
  function getCatLabel(key) {
    if (getCategoryMeta) {
      const meta = getCategoryMeta(key);
      // Avoid showing raw IDs even if categoryMap fell back to the key itself
      if (meta?.label && !isRawId(meta.label)) {
        return `${meta.emoji || "📦"} ${meta.label}`;
      }
    }
    const fallback = CATEGORY_LABELS[key];
    if (fallback) return `${fallback.emoji} ${lang === "id" ? fallback.id : fallback.en}`;
    // Last resort — never show raw hash to the user
    return `📦 ${lang === "id" ? "Lainnya" : "Other"}`;
  }

  // Compute 3-month average per category from transactions3M
  const catAvg3M = {};
  if (transactions3M?.length > 0) {
    const catSum = {};
    const months = new Set();
    transactions3M.forEach((tx) => {
      if (tx.type !== "expense") return;
      const m = tx.date?.slice(0, 7);
      if (m) months.add(m);
      const c = tx.category || "other";
      catSum[c] = (catSum[c] || 0) + tx.amount;
    });
    const numMonths = Math.max(months.size, 1);
    Object.entries(catSum).forEach(([k, v]) => { catAvg3M[k] = Math.round(v / numMonths); });
  }

  // Detect spikes
  const spikes = Object.entries(spendingByCategory)
    .filter(([k, v]) => catAvg3M[k] && v > catAvg3M[k] * 1.15)
    .map(([k, v]) => ({ key: k, thisMonth: v, avg: catAvg3M[k], diff: v - catAvg3M[k], pct: Math.round(((v - catAvg3M[k]) / catAvg3M[k]) * 100) }))
    .sort((a, b) => b.diff - a.diff);

  // Over-budget categories
  const overBudget = budgets.filter((b) => (spendingByCategory[b.category] || 0) > b.amount);

  const hasInsights = spikes.length > 0 || overBudget.length > 0;

  async function getRecommendation() {
    setLoading(true);
    setExpanded(true);

    const fmt = (n) => `Rp ${Math.round(n || 0).toLocaleString("id-ID")}`;

    const spikesText = spikes.map((s) =>
      `- ${getCatLabel(s.key)}: bulan ini ${fmt(s.thisMonth)}, rata-rata 3 bulan lalu ${fmt(s.avg)} (+${s.pct}%, lebih ${fmt(s.diff)})`
    ).join("\n");

    const overText = overBudget.map((b) => {
      const spent = spendingByCategory[b.category] || 0;
      return `- ${getCatLabel(b.category)}: limit ${fmt(b.amount)}, terpakai ${fmt(spent)} (lebih ${fmt(spent - b.amount)})`;
    }).join("\n");

    const prompt = `Analisis pola pengeluaran bulanan pengguna dan berikan rekomendasi penghematan yang spesifik dan actionable.

${spikesText ? `LONJAKAN PENGELUARAN vs rata-rata 3 bulan:\n${spikesText}\n` : ""}
${overText ? `KATEGORI MELEBIHI ANGGARAN:\n${overText}\n` : ""}
${!spikesText && !overText ? "Pengeluaran bulan ini relatif normal, tidak ada lonjakan signifikan." : ""}

Berikan 3-5 rekomendasi konkret dalam format:
1. Kategori yang paling bisa dihemat
2. Estimasi penghematan dalam Rupiah
3. Tips praktis yang bisa langsung dilakukan

Format jawaban: singkat, padat, gunakan bullet points. Maksimal 200 kata.`;

    try {
      const res = await base44.integrations.Core.InvokeLLM({ prompt });
      setRecommendation(typeof res === "string" ? res : res?.response || "");
    } catch (e) {
      setRecommendation("Gagal memuat rekomendasi. Coba lagi.");
    }
    setLoading(false);
  }

  const headerIconBg = hasInsights ? "bg-[#F97316]/10" : "bg-[#00C9A7]/10";
  const headerIconColor = hasInsights ? "text-[#F97316]" : "text-[#00C9A7]";
  const headerTitle = hasInsights
    ? (lang === "id" ? "Rekomendasi Penghematan Nana AI" : "Nana AI Savings Tips")
    : (lang === "id" ? "💡 Analisis Pengeluaran Nana AI" : "💡 Nana AI Spending Analysis");
  const headerSub = hasInsights
    ? (spikes.length > 0
        ? (lang === "id" ? `${spikes.length} kategori melonjak vs bulan lalu` : `${spikes.length} categories spiked vs avg`)
        : (lang === "id" ? `${overBudget.length} kategori melebihi anggaran` : `${overBudget.length} categories over budget`))
    : (lang === "id" ? "Ketuk untuk analisis pola pengeluaranmu" : "Tap for spending pattern analysis");

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => { if (!recommendation && !loading) getRecommendation(); else setExpanded(e => !e); }}
        className="w-full flex items-center gap-3 p-4 hover:bg-[#F8FAFC] transition-colors text-left"
      >
        <div className={`w-10 h-10 rounded-full ${headerIconBg} flex items-center justify-center flex-shrink-0`}>
          <Sparkles className={`w-5 h-5 ${headerIconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#1A1A1A]">{headerTitle}</p>
          <p className="text-xs text-[#8FA4C8]">{headerSub}</p>
        </div>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="w-4 h-4 text-[#F97316] animate-spin" />}
          {expanded ? <ChevronUp className="w-4 h-4 text-[#8FA4C8]" /> : <ChevronDown className="w-4 h-4 text-[#8FA4C8]" />}
        </div>
      </button>

      {/* Spike badges */}
      {spikes.length > 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {spikes.slice(0, 4).map((s) => (
            <span key={s.key} className="text-[10px] font-semibold px-2 py-1 rounded-full bg-[#FF6B6B]/10 text-[#FF6B6B]">
              {getCatLabel(s.key)} +{s.pct}%
            </span>
          ))}
        </div>
      )}

      {/* Recommendation content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-[#F2F4F7] pt-3">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-[#8FA4C8]">
              <Loader2 className="w-4 h-4 animate-spin text-[#F97316]" />
              <span>{lang === "id" ? "Nana sedang menganalisis pola pengeluaranmu..." : "Nana is analyzing your spending pattern..."}</span>
            </div>
          ) : recommendation ? (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                  <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a82e8090f60786b869983c/7708b64f5_generated_image.png" alt="Nana" className="w-full h-full object-cover" />
                </div>
                <span className="text-xs font-semibold text-[#F97316]">Nana AI</span>
                <button onClick={() => { setRecommendation(null); getRecommendation(); }} className="ml-auto text-[10px] text-[#8FA4C8] hover:text-[#F97316] transition-colors">↻ Refresh</button>
              </div>
              <ReactMarkdown className="prose prose-sm max-w-none text-[#1A1A1A] [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:my-2 [&>li]:mb-1 [&>strong]:font-semibold text-sm leading-relaxed">
                {recommendation}
              </ReactMarkdown>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}