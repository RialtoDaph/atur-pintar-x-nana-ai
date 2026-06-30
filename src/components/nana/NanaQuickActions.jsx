import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Plus, RefreshCw, TrendingDown, PiggyBank, Wallet, Receipt, Target, BarChart3, CreditCard, Coins } from "lucide-react";

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
      const recentChat = await fetchRecentUserChat();
      const avoidList = Array.from(seenLabels).slice(-12).join(" | ");
      const isEmptyUser = isContextEmpty(contextSnapshot);

      const prompt = `Kamu adalah Nana AI, asisten keuangan. Buatkan 3 saran percakapan yang RELEVAN untuk user INI berdasarkan data & interaksinya.

ATURAN PENTING:
- Saran HARUS berdasarkan data user di bawah (jangan ngarang angka/kategori yang tidak ada di data).
- Kalau riwayat chat user ada, prioritaskan saran yang melanjutkan/menyambung topik terakhir.
- ${isEmptyUser ? "User BELUM punya data finansial (transaksi/budget/goal kosong) → buat saran ONBOARDING: cara mulai catat, buat goal pertama, atur budget, dll. JANGAN sebut angka palsu." : "User punya data finansial → buat saran SPESIFIK menyebut nama kategori/goal/utang yang nyata dari data."}

Setiap saran punya 3 field:
1. "label" — judul super pendek 2-4 kata (yang muncul di tombol). Contoh: "Analisa makan", "Cek budget transport", "Strategi lunas KPR", "Mulai catat transaksi".
2. "question" — pertanyaan lengkap natural dari sudut pandang USER ke Nana, 1-2 kalimat.
3. "icon" — pilih satu: spending, wallet, goal, budget, bill, debt, saving, invest.

Aturan label: maks 4 kata, tanpa tanda tanya, panjang konsisten.

JANGAN ulang label ini: ${avoidList || "(belum ada)"}

${recentChat}
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

      if (items.length > 0) {
        setSuggestions(items);
        // Cap memory: keep only last 24 labels to avoid unbounded growth
        setSeenLabels((prev) => {
          const next = [...prev, ...items.map((i) => i.label)];
          return new Set(next.slice(-24));
        });
      }
    } catch {
      // Silent fail — keep previous suggestions or skeleton
    } finally {
      setLoading(false);
    }
  }

  const display = suggestions;

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
          <span className="text-xs font-semibold text-[#8FA4C8]">Saran dari Nana</span>
        </div>
        <button
          onClick={() => !disabled && generate(false)}
          disabled={disabled || loading}
          title="Saran baru"
          className="w-6 h-6 flex items-center justify-center rounded-full bg-[#F97316]/10 text-[#F97316] hover:bg-[#F97316] hover:text-white transition-all disabled:opacity-40 tap-highlight-fix"
        >
          {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {display.length === 0
          ? (loading
              ? [0, 1, 2].map((i) => (
                  <div
                    key={`skel-${i}`}
                    className="flex items-start gap-1.5 px-2 py-2 bg-white dark:bg-[#1A1E25] border border-[#E2E8F0] dark:border-[#2D2D2D] rounded-xl min-w-0 animate-pulse"
                  >
                    <div className="w-3.5 h-3.5 rounded-full bg-[#E2E8F0] dark:bg-[#2D2D2D] flex-shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <div className="h-2 bg-[#E2E8F0] dark:bg-[#2D2D2D] rounded w-full" />
                      <div className="h-2 bg-[#E2E8F0] dark:bg-[#2D2D2D] rounded w-2/3" />
                    </div>
                  </div>
                ))
              : (
                <button
                  onClick={() => generate(false)}
                  disabled={disabled}
                  className="col-span-3 flex items-center justify-center gap-1.5 px-2 py-2.5 bg-white dark:bg-[#1A1E25] border border-dashed border-[#E2E8F0] dark:border-[#2D2D2D] rounded-xl text-[11px] font-medium text-[#8FA4C8] hover:text-[#F97316] hover:border-[#F97316] transition-all tap-highlight-fix"
                >
                  <RefreshCw className="w-3 h-3" />
                  Coba generate saran lagi
                </button>
              ))
          : display.map((s, i) => {
              const Icon = ICON_MAP[s.icon] || TrendingDown;
              return (
                <button
                  key={`${s.label}-${i}`}
                  onClick={() => !disabled && onSelect(s.question)}
                  disabled={disabled || loading}
                  title={s.question}
                  className="flex items-start gap-1.5 px-2 py-2 bg-white dark:bg-[#1A1E25] border border-[#E2E8F0] dark:border-[#2D2D2D] rounded-xl hover:border-[#F97316] hover:bg-[#F97316]/5 dark:hover:bg-[#F97316]/10 transition-all disabled:opacity-40 tap-highlight-fix text-left min-w-0"
                >
                  <Icon className="w-3.5 h-3.5 text-[#F97316] flex-shrink-0 mt-0.5" />
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

// Detect if user has no financial data yet — avoid AI hallucinating fake numbers
function isContextEmpty(s) {
  if (!s) return true;
  const hasTx = (s.thisMonth?.income || 0) > 0 || (s.thisMonth?.expense || 0) > 0;
  const hasGoals = (s.goals?.length || 0) > 0;
  const hasBudgets = (s.budgetStatus?.length || 0) > 0;
  const hasDebts = (s.debts?.length || 0) > 0;
  return !hasTx && !hasGoals && !hasBudgets && !hasDebts;
}

// Fetch last 5 user chat messages to ground suggestions in real interaction history
async function fetchRecentUserChat() {
  try {
    const me = await base44.auth.me();
    if (!me?.email) return "";
    const msgs = await base44.entities.NanaConversation.filter({ created_by: me.email, role: "user" }, "-created_date", 5);
    if (!msgs?.length) return "";
    const lines = msgs
      .map((m) => (m.message || "").replace(/\[mood:[^\]]+\]\s*/g, "").trim())
      .filter((x) => x && x.length < 200)
      .slice(0, 5);
    if (!lines.length) return "";
    return `[Riwayat 5 pertanyaan terakhir user ke Nana:\n${lines.map((l, i) => `${i + 1}. ${l}`).join("\n")}]`;
  } catch {
    return "";
  }
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