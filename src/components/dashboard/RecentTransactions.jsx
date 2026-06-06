import { useAppSettings } from "@/components/utils/useAppSettings";
import { RefreshCw } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { createPageUrl } from "@/utils";
import { resolveTransactionCategory } from "@/components/utils/resolveTransactionCategory";

export default function RecentTransactions({ transactions, loading, goals = [], categories = [] }) {
  const { formatCurrency, t } = useAppSettings();

  // Show parents only if no child has been recorded for them this month
  const now = new Date();
  const currentMonthChildParentIds = new Set(
    (transactions || [])
      .filter(tx => tx.is_recurring_child && (() => { const d = new Date(tx.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })())
      .map(tx => tx.recurring_parent_id)
      .filter(Boolean)
  );
  const displayTxs = (transactions || []).filter(tx => {
    if (tx.is_recurring && !tx.is_recurring_child) {
      return !currentMonthChildParentIds.has(tx.id);
    }
    return true;
  });

  if (loading) {
    return (
      <div className="px-5 pb-5 space-y-3">
        {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
      </div>
    );
  }

  if (displayTxs.length === 0) {
    return (
      <EmptyState
        emoji="📝"
        title={t('no_transactions')}
        subtitle="Mulai catat transaksi untuk lihat aktivitas keuanganmu di sini"
        ctaLabel="Catat Transaksi"
        ctaTo={createPageUrl("Transactions")}
      />
    );
  }

  return (
    <div className="pb-2">
      {displayTxs.map((tx) => {
        const cat = resolveTransactionCategory(tx, { categories, goals });
        const isIncome = tx.type === "income";
        const goal = tx.type === "savings" && tx.goal_id ? goals.find(g => g.id === tx.goal_id) : null;
        return (
          <div key={tx.id} className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 transition-colors">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
              style={{ backgroundColor: cat.color + "18" }}
            >
              {cat.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#1B2559] truncate">{tx.note || goal?.name || cat.label}</p>
              <p className="text-[10px] text-[#8FA4C8] flex items-center gap-1">
                {tx.is_recurring && <RefreshCw className="w-2.5 h-2.5 text-[#F97316]" />}
                {new Date(tx.date).toLocaleDateString("id-ID", { month: "short", day: "numeric" })}
              </p>
            </div>
            <span
              className="text-xs font-bold flex-shrink-0"
              style={{ color: isIncome ? "#00C9A7" : "#FF6B6B" }}
            >
              {isIncome ? "+" : "−"}{formatCurrency(tx.amount)}
            </span>
          </div>
        );
      })}
    </div>
  );
}