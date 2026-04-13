import { useAppSettings } from "@/components/utils/useAppSettings";

export default function TopTransactions({ transactions, allCategoriesConfig }) {
  const { formatCurrency } = useAppSettings();

  const top5 = [...transactions]
    .filter(tx => tx.type === "expense")
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  if (top5.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#F0F2F5]">
        <p className="text-sm font-bold text-[#1A1A1A] mb-2">🔝 Top 5 Pengeluaran Terbesar</p>
        <p className="text-center text-[#8FA4C8] text-sm py-6">Tidak ada pengeluaran di periode ini</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#F0F2F5]">
      <p className="text-sm font-bold text-[#1A1A1A] mb-3">🔝 Top 5 Pengeluaran Terbesar</p>
      <div className="space-y-2.5">
        {top5.map((tx, i) => {
          const cat = allCategoriesConfig[tx.category] || { emoji: "📦", label: tx.category || "Lainnya", color: "#8FA4C8" };
          return (
            <div key={tx.id} className="flex items-center gap-3">
              <span className="text-xs font-bold text-[#8FA4C8] w-4 flex-shrink-0">#{i + 1}</span>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                style={{ backgroundColor: cat.color + "20" }}>
                {cat.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#1A1A1A] truncate">{tx.note || cat.label}</p>
                <p className="text-[10px] text-[#8FA4C8]">
                  {cat.label} · {new Date(tx.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                </p>
              </div>
              <span className="text-xs font-bold text-[#EF4444] flex-shrink-0">-{formatCurrency(tx.amount)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}