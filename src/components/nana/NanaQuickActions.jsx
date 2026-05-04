import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Lightbulb, Plus, RefreshCw } from "lucide-react";

const FALLBACK = [
  "Analisa pengeluaran aku bulan ini",
  "Boleh jajan berapa hari ini?",
  "Progress tabungan aku gimana?",
];

/**
 * Dynamic quick action suggestions, personalized by Nana AI based on
 * the user's current financial snapshot. Shows 3 pills at a time;
 * pressing + generates 3 fresh suggestions.
 */
export default function NanaQuickActions({ onSelect, disabled, contextSnapshot }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [seenSet, setSeenSet] = useState(new Set());

  useEffect(() => {
    // Fetch initial suggestions once context is available
    if (contextSnapshot && suggestions.length === 0) {
      generate(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextSnapshot]);

  async function generate(isInitial = false) {
    if (loading) return;
    setLoading(true);
    try {
      const ctx = contextSnapshot ? buildShortContext(contextSnapshot) : "";
      const avoidList = Array.from(seenSet).slice(-12).join(" | ");

      const prompt = `Kamu adalah Nana AI, asisten keuangan untuk pengguna ini. Berdasarkan kondisi keuangan user di bawah, buatkan 3 pertanyaan SARAN (bukan jawaban) yang relevan, natural, dan paling berguna untuk mereka tanyakan ke kamu sekarang.

Aturan:
- Tulis dari sudut pandang USER bertanya ke Nana (gunakan "aku" / "ku")
- Singkat (maks 7 kata), bahasa Indonesia santai
- Spesifik ke data user (sebut kategori/goal/utang/tagihan kalau relevan)
- Variatif: campur topik (budget, tabungan, utang, tagihan, kebiasaan, investasi)
- JANGAN ulang pertanyaan ini: ${avoidList || "(belum ada)"}

${ctx}

Output JSON saja, tanpa penjelasan.`;

      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["suggestions"],
        },
      });

      const items = (res?.suggestions || []).filter(Boolean).slice(0, 3);
      if (items.length === 0) {
        setSuggestions(isInitial ? FALLBACK : suggestions);
      } else {
        setSuggestions(items);
        setSeenSet((prev) => new Set([...prev, ...items]));
      }
    } catch {
      if (isInitial) setSuggestions(FALLBACK);
    } finally {
      setLoading(false);
    }
  }

  const display = suggestions.length > 0 ? suggestions : FALLBACK;

  return (
    <div className="mb-2">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Lightbulb className="w-3.5 h-3.5 text-[#8FA4C8]" />
        <span className="text-xs font-medium text-[#8FA4C8]">Saran dari Nana</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {display.map((s, i) => (
          <button
            key={`${s}-${i}`}
            onClick={() => !disabled && onSelect(s)}
            disabled={disabled || loading}
            className="text-[12px] text-[#1A1A1A] dark:text-white bg-white dark:bg-[#1A1E25] border border-[#E2E8F0] dark:border-[#2D2D2D] rounded-full px-3 py-1.5 hover:border-[#FF6A00] hover:bg-[#FF6A00]/5 dark:hover:bg-[#FF6A00]/10 transition-all disabled:opacity-40 tap-highlight-fix"
          >
            {s}
          </button>
        ))}
        <button
          onClick={() => !disabled && generate(false)}
          disabled={disabled || loading}
          title="Saran baru"
          className="w-7 h-7 flex items-center justify-center rounded-full bg-[#FF6A00]/10 border border-[#FF6A00]/30 text-[#FF6A00] hover:bg-[#FF6A00] hover:text-white transition-all disabled:opacity-40 tap-highlight-fix"
        >
          {loading ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Plus className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}

// Build a short, focused context for suggestion generation only (smaller than full chat context)
function buildShortContext(s) {
  if (!s) return "";
  const fmt = (n) => `Rp ${Math.round(n || 0).toLocaleString("id-ID")}`;
  const lines = [`[Kondisi user:`];
  if (s.thisMonth) {
    lines.push(`Bulan ini: pemasukan ${fmt(s.thisMonth.income)}, pengeluaran ${fmt(s.thisMonth.expense)}, net ${fmt(s.thisMonth.net)}.`);
    if (s.thisMonth.spendingSpikes?.length > 0) {
      lines.push(`Lonjakan: ${s.thisMonth.spendingSpikes.slice(0, 3).map((x) => `${x.category} +${x.spikePct}%`).join(", ")}.`);
    }
  }
  if (s.budgetStatus?.length > 0) {
    const risky = s.budgetStatus.filter((b) => b.pct >= 80).slice(0, 3);
    if (risky.length > 0) lines.push(`Anggaran nyaris habis: ${risky.map((b) => `${b.category} ${b.pct}%`).join(", ")}.`);
  }
  if (s.goals?.length > 0) {
    lines.push(`Goal aktif: ${s.goals.slice(0, 3).map((g) => `${g.name} ${g.pct}%`).join(", ")}.`);
  }
  if (s.debts?.length > 0) {
    lines.push(`Utang: ${s.debts.slice(0, 3).map((d) => `${d.name} sisa ${fmt(d.remaining)}`).join(", ")}.`);
  }
  if (s.upcomingReminders?.length > 0) {
    lines.push(`Tagihan dekat: ${s.upcomingReminders.slice(0, 3).map((r) => `${r.title} (${r.daysUntilDue}h)`).join(", ")}.`);
  }
  if (s.todayMood) lines.push(`Mood hari ini: ${s.todayMood.mood_label || s.todayMood.mood}.`);
  lines.push("]");
  return lines.join(" ");
}