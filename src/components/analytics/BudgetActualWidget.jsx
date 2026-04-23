import { useAppSettings } from "@/components/utils/useAppSettings";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function BudgetActualWidget({ budgets, transactions, allCategoriesConfig, periodSubtitle }) {
  const { formatCurrency } = useAppSettings();
  const now = new Date();

  // Hitung spending bulan ini per kategori
  const thisMonthExpenses = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.type === "expense";
  });

  const spentByCategory = {};
  thisMonthExpenses.forEach(t => {
    const cat = t.category || "other";
    spentByCategory[cat] = (spentByCategory[cat] || 0) + t.amount;
  });

  if (budgets.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="mb-3">
          <h2 className="font-bold text-[#1A1A1A] text-base">Budget vs Aktual</h2>
          {periodSubtitle && <p className="text-xs text-[#8FA4C8] mt-0.5">{periodSubtitle}</p>}
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <span className="text-4xl mb-3">💸</span>
          <p className="font-semibold text-[#1A1A1A] text-sm mb-1">Kamu belum punya budget nih!</p>
          <p className="text-xs text-[#8FA4C8] mb-4">Set budget bulananmu sekarang biar pengeluaran lebih terkontrol</p>
          <Link
            to={createPageUrl("Budget")}
            className="px-4 py-2 bg-[#FF6A00] text-white text-xs font-semibold rounded-xl hover:bg-[#e55f00] transition-colors"
          >
            Buat Budget
          </Link>
        </div>
      </div>
    );
  }

  const budgetItems = budgets.map(b => {
    const catConfig = allCategoriesConfig[b.category] || { emoji: "📦", label: b.category };
    const spent = spentByCategory[b.category] || 0;
    const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0;
    const isOver = pct > 100;
    const barColor = pct > 90 ? "#FF6B6B" : pct > 70 ? "#F5A623" : "#00C9A7";

    return { ...b, catConfig, spent, pct, isOver, barColor };
  });

  const overBudgetCount = budgetItems.filter(b => b.isOver).length;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <div className="mb-4">
        <h2 className="font-bold text-[#1A1A1A] text-base">Budget vs Aktual</h2>
        {periodSubtitle && <p className="text-xs text-[#8FA4C8] mt-0.5">{periodSubtitle}</p>}
      </div>

      <div className="space-y-4">
        {budgetItems.map((item, i) => (
          <div key={item.id || i}>
            {/* Category name + over badge */}
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs text-[#4A5568] truncate">
                  {item.catConfig.emoji} {item.catConfig.label}
                </span>
                {item.isOver && (
                  <span className="px-1.5 py-0.5 bg-[#FF6B6B]/15 text-[#FF6B6B] text-[9px] font-bold rounded-full flex-shrink-0">
                    Melebihi!
                  </span>
                )}
              </div>
              <span className={`text-xs font-bold flex-shrink-0 ml-2 ${item.isOver ? "text-[#FF6B6B]" : "text-[#4A5568]"}`}>
                {Math.min(item.pct, 100).toFixed(0)}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-[#F2F4F7] rounded-full overflow-hidden mb-1">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(item.pct, 100)}%`,
                  backgroundColor: item.barColor,
                }}
              />
            </div>

            {/* Amount text */}
            <p className="text-[10px] text-[#8FA4C8]">
              {formatCurrency(item.spent)} terpakai dari {formatCurrency(item.amount)}
            </p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className={`mt-4 pt-3 border-t border-[#F2F4F7] text-xs font-medium ${overBudgetCount > 0 ? "text-[#FF6B6B]" : "text-[#00C9A7]"}`}>
        {overBudgetCount === 0
          ? "✅ Semua budget masih aman bulan ini!"
          : `⚠️ ${overBudgetCount} kategori melebihi budget bulan ini`
        }
      </div>
    </div>
  );
}