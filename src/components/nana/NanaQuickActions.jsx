import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Plus, RefreshCw, TrendingDown, PiggyBank, Wallet, Receipt, Target, BarChart3, CreditCard, Coins } from "lucide-react";

const FALLBACK = [
  { label: "Analisa pengeluaran", question: "Tolong analisa pengeluaran aku bulan ini secara detail. Kategori mana yang paling boros dan apa saranmu?", icon: "spending" },
  { label: "Boleh jajan?", question: "Hari ini aku boleh jajan berapa biar tetap aman sampai akhir bulan?", icon: "wallet" },
  { label: "Progress tabungan", question: "Gimana progress semua tujuan tabunganku? Yang mana yang paling perlu didorong?", icon: "goal" },
];

const ICON_MAP = {
  spending: TrendingDown,
  wallet: Wallet,
  goal: Target,
  budget: BarChart3,
  bill: Receipt,
  debt: CreditCard,
  saving: PiggyBank,
  invest: Coins,
};

/**
 * Dynamic quick action suggestions, personalized by Nana AI based on
 * the user's current financial snapshot. Shows 3 cards at a time;
 * pressing + generates 3 fresh suggestions. Clicking a card sends
 * the FULL question to the chat (not just the short label).
 */
export default function NanaQuickActions({ onSelect, disabled, contextSnapshot }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [seenLabels, setSeenLabels] = useState(new Set());

  useEffect(() => {
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
      const avoidList = Array.from(seenLabels).slice(-12).join(" | ");

      const prompt = `Kamu adalah Nana AI, asisten keuangan. Buatkan 3 saran percakapan yang relevan untuk user ini sekarang.

Setiap saran punya 2 bagian:
1. "label" — judul super pendek 2-4 kata (yang muncul di tombol). HARUS singkat & rapi, contoh: "Analisa makan", "Cek budget transport", "Strategi lunas KPR".
2. "question" — pertanyaan lengkap natural dari sudut pandang USER ke Nana, 1-2 kalimat, spesifik ke data user (sebut angka/nama kategori/goal jika relevan).
3. "icon" — pilih satu: spending, wallet, goal, budget, bill, debt, saving, invest.

Aturan label:
- Maks 4 kata, tidak boleh panjang
- Tidak pakai tanda tanya
- Konsisten panjangnya (jangan ada yang 2 kata lalu yang lain 6 kata)

Variatif topik (campur: budget, tabungan, utang, tagihan, kebiasaan, investasi).
JANGAN ulang label ini: ${avoidList || "(belum ada)"}

${ctx}

Output JSON saja.`;

      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  label: { type: "string" },
                  question: { type: "string" },
                  icon: { type: "string", enum: ["spending", "wallet", "goal", "budget", "bill", "debt", "saving", "invest"] },
                },
                required: ["label", "question"],
              },
            },
          },
          required: ["suggestions"],
        },
      });

      const items = (res?.suggestions || [])
        .filter((s) => s?.label && s?.question)
        .slice(0, 3)
        .map((s) => ({
          label: trimLabel(s.label),
          question: s.question,
          icon: s.icon || "spending",
        }));

      if (items.length === 0) {
        if (isInitial) setSuggestions(FALLBACK);
      } else {
        setSuggestions(items);
        setSeenLabels((prev) => new Set([...prev, ...items.map((i) => i.label)]));
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
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#FF6A00]" />
          <span className="text-xs font-semibold text-[#8FA4C8]">Saran dari Nana</span>
        </div>
        <button
          onClick={() => !disabled && generate(false)}
          disabled={disabled || loading}
          title="Saran baru"
          className="w-6 h-6 flex items-center justify-center rounded-full bg-[#FF6A00]/10 text-[#FF6A00] hover:bg-[#FF6A00] hover:text-white transition-all disabled:opacity-40 tap-highlight-fix"
        >
          {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {display.map((s, i) => {
          const Icon = ICON_MAP[s.icon] || TrendingDown;
          return (
            <button
              key={`${s.label}-${i}`}
              onClick={() => !disabled && onSelect(s.question)}
              disabled={disabled || loading}
              title={s.question}
              className="flex items-start gap-1.5 px-2 py-2 bg-white dark:bg-[#1A1E25] border border-[#E2E8F0] dark:border-[#2D2D2D] rounded-xl hover:border-[#FF6A00] hover:bg-[#FF6A00]/5 dark:hover:bg-[#FF6A00]/10 transition-all disabled:opacity-40 tap-highlight-fix text-left min-w-0"
            >
              <Icon className="w-3.5 h-3.5 text-[#FF6A00] flex-shrink-0 mt-0.5" />
              <span
                className="text-[11px] font-medium text-[#1A1A1A] dark:text-white leading-tight break-words"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  wordBreak: 'break-word',
                }}
              >
                {s.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Keep labels clean (no trailing punctuation, max 5 words so 2 lines fit nicely)
function trimLabel(label) {
  const cleaned = String(label).replace(/[?!.]+$/g, "").trim();
  const words = cleaned.split(/\s+/);
  return words.slice(0, 5).join(" ");
}

// Build a short, focused context for suggestion generation only
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