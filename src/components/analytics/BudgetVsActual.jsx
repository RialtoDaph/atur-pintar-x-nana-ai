import { useAppSettings } from "@/components/utils/useAppSettings";

function getBudgetColor(pct) {
  if (pct > 100) return "#EF4444";
  if (pct > 80) return "#F97316";
  if (pct > 60) return "#F59E0B";
  return "#22C55E";
}

export default function BudgetVsActual({ budgets, transactions, allCategoriesConfig }) {
  const { formatCurrency } = useAppSettings();

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const monthBudgets = budgets.filter(b => b.month === currentMonth);

  const budgetData = monthBudgets.map(b => {
    const cat = allCategoriesConfig[b.category] || { label: b.category, emoji: "📦", color: "#8FA4C8" };
    const spent = transactions
      .filter(tx => tx.type === "expense" && tx.category === b.category && !tx.is_deleted)
      .reduce((s, tx) => s + (tx.amount || 0), 0);
    const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0;
    const color = getBudgetColor(pct);
    const remaining = b.amount - spent;
    return { ...b, cat, spent, pct, color, remaining };
  });

  if (budgetData.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#F0F2F5]">
        <p className="text-sm font-bold text-[#1A1A1A] mb-2">💰 Anggaran vs Aktual</p>
        <p className="text-center text-[#8FA4C8] text-sm py-6">Belum ada anggaran bulan ini</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#F0F2F5]">
      <p className="text-sm font-bold text-[#1A1A1A] mb-4">💰 Anggaran vs Aktual (Bulan Ini)</p>
      <div className="space-y-3">
        {budgetData.map(b => (
          <div key={b.id}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-base">{b.cat.emoji}</span>
                <span className="text-xs font-semibold text-[#1A1A1A]">{b.cat.label}</span>
                {b.pct > 80 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: b.color + "20", color: b.color }}>
                    {b.pct > 100 ? "Melebihi!" : "Hampir habis"}
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="text-xs font-bold" style={{ color: b.color }}>{formatCurrency(b.spent)}</span>
                <span className="text-xs text-[#8FA4C8]"> / {formatCurrency(b.amount)}</span>
              </div>
            </div>
            <div className="h-2 bg-[#F2F4F7] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(b.pct, 100)}%`, backgroundColor: b.color }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-[#8FA4C8]">{b.pct.toFixed(0)}% terpakai</span>
              <span className="text-[10px] font-semibold" style={{ color: b.remaining < 0 ? "#EF4444" : "#22C55E" }}>
                {b.remaining < 0 ? `Lebih ${formatCurrency(Math.abs(b.remaining))}` : `Sisa ${formatCurrency(b.remaining)}`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}