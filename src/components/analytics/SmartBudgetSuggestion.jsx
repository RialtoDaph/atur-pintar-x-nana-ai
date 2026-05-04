import { useState, useMemo } from "react";
import { Sparkles, Check, X, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAppSettings } from "@/components/utils/useAppSettings";

export default function SmartBudgetSuggestion({ transactions, budgets, allCategoriesConfig, currentMonth, user }) {
  const { formatCurrency, t } = useAppSettings();
  const [expanded, setExpanded] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [savedIds, setSavedIds] = useState(new Set());
  const [dismissedIds, setDismissedIds] = useState(new Set());
  const [saving, setSaving] = useState({});

  // Calculate 3-month average spending per category
  const suggestions = useMemo(() => {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

    const recentExpenses = transactions.filter(tx => {
      if (tx.type !== "expense") return false;
      const d = new Date(tx.date);
      return d >= threeMonthsAgo && d < new Date(now.getFullYear(), now.getMonth(), 1);
    });

    // Group by category
    const catTotals = {};
    const catMonths = {};
    recentExpenses.forEach(tx => {
      const cat = tx.category || "other";
      const month = new Date(tx.date).getMonth() + "-" + new Date(tx.date).getFullYear();
      catTotals[cat] = (catTotals[cat] || 0) + tx.amount;
      if (!catMonths[cat]) catMonths[cat] = new Set();
      catMonths[cat].add(month);
    });

    return Object.entries(catTotals)
      .map(([cat, total]) => {
        const monthCount = catMonths[cat]?.size || 1;
        const avg = total / monthCount;
        const suggested = Math.ceil(avg * 1.1 / 10000) * 10000; // round up to nearest 10k with 10% buffer
        const existing = budgets.find(b => b.category === cat && b.month === currentMonth);
        const config = allCategoriesConfig[cat] || { label: cat, emoji: "📦", color: "#8FA4C8" };
        return { cat, avg, suggested, existing, config };
      })
      .filter(s => !savedIds.has(s.cat) && !dismissedIds.has(s.cat))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 8);
  }, [transactions, budgets, allCategoriesConfig, currentMonth, savedIds, dismissedIds]);

  const handleApprove = async (cat, amount) => {
    const raw = editValues[cat];
    const parsed = raw !== undefined && raw !== "" ? Number(raw) : amount;
    const finalAmount = Number.isFinite(parsed) && parsed > 0 ? parsed : amount;
    setSaving(s => ({ ...s, [cat]: true }));
    try {
      const existing = budgets.find(b => b.category === cat && b.month === currentMonth);
      if (existing) {
        await base44.entities.Budget.update(existing.id, { amount: finalAmount });
      } else {
        await base44.entities.Budget.create({ category: cat, amount: finalAmount, month: currentMonth });
      }
      setSavedIds(s => new Set([...s, cat]));
    } finally {
      setSaving(s => ({ ...s, [cat]: false }));
      setEditingId(null);
    }
  };

  const handleDismiss = (cat) => {
    setDismissedIds(s => new Set([...s, cat]));
  };

  if (suggestions.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4F7CFF] to-[#9B59B6] flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#1A1A1A]">Smart Budget</p>
            <p className="text-xs text-[#8FA4C8]">Saran limit berdasarkan rata-rata 3 bulan terakhir</p>
          </div>
        </div>
        <button onClick={() => setExpanded(e => !e)} className="text-[#8FA4C8] hover:text-[#1A1A1A] transition-colors">
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {expanded && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-3">
          {suggestions.map(({ cat, avg, suggested, existing, config }) => {
            const displayAmount = editValues[cat] !== undefined ? editValues[cat] : suggested;
            const isEditing = editingId === cat;
            const progressPct = Math.min((avg / suggested) * 100, 100);
            const progressColor = progressPct >= 90 ? "#FF6B6B" : progressPct >= 70 ? "#F5A623" : "#00C9A7";

            return (
              <div key={cat} className="border border-[#F2F4F7] rounded-xl p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg">{config.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1A1A1A] truncate">{config.label}</p>
                      <p className="text-[10px] text-[#8FA4C8]">
                        Rata-rata: {formatCurrency(avg)}/bln
                        {existing && <span className="ml-1 text-[#4F7CFF]">· Budget saat ini: {formatCurrency(existing.amount)}</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Edit / Amount */}
                    {isEditing ? (
                      <input
                        type="number"
                        value={editValues[cat]}
                        onChange={e => setEditValues(v => ({ ...v, [cat]: e.target.value }))}
                        className="w-28 text-xs border border-[#E2E8F0] rounded-lg px-2 py-1 text-right font-semibold"
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() => { setEditingId(cat); setEditValues(v => ({ ...v, [cat]: suggested })); }}
                        className="flex items-center gap-1 text-xs font-bold text-[#4F7CFF] hover:bg-[#4F7CFF]/10 px-2 py-1 rounded-lg transition-colors"
                      >
                        <span>{formatCurrency(displayAmount)}</span>
                        <Pencil className="w-3 h-3" />
                      </button>
                    )}

                    {/* Approve */}
                    <button
                      onClick={() => handleApprove(cat, suggested)}
                      disabled={saving[cat]}
                      className="w-7 h-7 rounded-full bg-[#00C9A7]/10 hover:bg-[#00C9A7]/20 flex items-center justify-center transition-colors"
                    >
                      {saving[cat]
                        ? <div className="w-3 h-3 border-2 border-[#00C9A7] border-t-transparent rounded-full animate-spin" />
                        : <Check className="w-3.5 h-3.5 text-[#00C9A7]" />}
                    </button>

                    {/* Dismiss */}
                    <button
                      onClick={() => handleDismiss(cat)}
                      className="w-7 h-7 rounded-full bg-[#F2F4F7] hover:bg-[#FF6B6B]/10 flex items-center justify-center transition-colors"
                    >
                      <X className="w-3.5 h-3.5 text-[#8FA4C8] hover:text-[#FF6B6B]" />
                    </button>
                  </div>
                </div>

                {/* Progress bar: avg vs suggested */}
                <div className="space-y-1">
                  <div className="h-1.5 bg-[#F2F4F7] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${progressPct}%`, backgroundColor: progressColor }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-[#8FA4C8]">
                    <span>Pengeluaran rata-rata</span>
                    <span style={{ color: progressColor }}>{progressPct.toFixed(0)}% dari limit yang disarankan</span>
                  </div>
                </div>
              </div>
            );
          })}

          <p className="text-[10px] text-[#8FA4C8] text-center pt-1">
            ✅ Setujui untuk menyimpan ke anggaran bulan ini · ✏️ Klik nominal untuk mengedit · ✕ untuk abaikan
          </p>
        </div>
      )}
    </div>
  );
}