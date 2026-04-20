import { motion } from "framer-motion";

const INTERVAL_LABELS = {
  daily: "Harian",
  weekly: "Mingguan",
  monthly: "Bulanan",
  yearly: "Tahunan",
};

function resolveCategory(tx, categories) {
  const cat = categories.find(c => c.id === tx.category || c.name?.toLowerCase() === tx.category?.toLowerCase());
  if (cat) return { emoji: cat.emoji, label: cat.name, color: cat.color };
  return { emoji: "📦", label: tx.category || "Lainnya", color: "#95A5A6" };
}

function DebtCard({ debt, idx }) {
  const progress = debt.total_amount > 0
    ? Math.round(((debt.total_amount - debt.remaining_amount) / debt.total_amount) * 100)
    : null;

  const dueDateLabel = debt.due_date
    ? new Date(debt.due_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.06 }}
      className="bg-white rounded-2xl p-4 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-[#FFF3E0] flex items-center justify-center text-xl flex-shrink-0">
          {debt.icon || "💳"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#1A1A1A]">{debt.name}</p>
          {dueDateLabel && <p className="text-[11px] text-[#8FA4C8] mt-0.5">Jatuh tempo: {dueDateLabel}</p>}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-[#F97316]">
            Rp{(debt.monthly_payment || 0).toLocaleString("id-ID")}<span className="text-[10px] font-normal text-[#8FA4C8]">/bln</span>
          </p>
        </div>
      </div>

      {progress !== null && (
        <div className="mt-3">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] text-[#8FA4C8]">Pelunasan</span>
            <span className="text-[10px] font-bold text-[#F97316]">{progress}% lunas</span>
          </div>
          <div className="h-1.5 bg-[#F2F4F7] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-[#F97316] transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}

function RecurringCard({ tx, categories, idx }) {
  const cat = resolveCategory(tx, categories);
  const intervalLabel = INTERVAL_LABELS[tx.recurring_interval] || tx.recurring_interval || "Berkala";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.06 }}
      className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3"
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
        style={{ backgroundColor: (cat.color || "#888") + "20" }}
      >
        {cat.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[#1A1A1A] truncate">{tx.note || cat.label}</p>
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#F97316]/10 text-[#F97316] mt-1 inline-block">
          {intervalLabel}
        </span>
      </div>
      <p className="text-sm font-bold text-[#EF4444] flex-shrink-0">
        −Rp{(tx.amount || 0).toLocaleString("id-ID")}
      </p>
    </motion.div>
  );
}

export default function TxRutinTab({ debts, recurringTxs, categories }) {
  return (
    <div className="px-3 pb-28 space-y-6 pt-3">
      {/* Section A: Cicilan & Utang */}
      <div>
        <p className="text-xs font-bold text-[#8FA4C8] uppercase tracking-wider px-1 mb-2">Cicilan & Utang</p>
        {debts.length === 0 ? (
          <div className="bg-white rounded-2xl p-5 text-center shadow-sm">
            <p className="text-2xl mb-2">✅</p>
            <p className="text-sm text-[#8FA4C8]">Tidak ada cicilan aktif</p>
          </div>
        ) : (
          <div className="space-y-2">
            {debts.map((debt, idx) => <DebtCard key={debt.id} debt={debt} idx={idx} />)}
          </div>
        )}
      </div>

      {/* Section B: Rutin Berkala */}
      <div>
        <p className="text-xs font-bold text-[#8FA4C8] uppercase tracking-wider px-1 mb-2">Rutin Berkala</p>
        {recurringTxs.length === 0 ? (
          <div className="bg-white rounded-2xl p-5 text-center shadow-sm">
            <p className="text-2xl mb-2">🔁</p>
            <p className="text-sm text-[#8FA4C8]">Tidak ada transaksi rutin</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recurringTxs.map((tx, idx) => (
              <RecurringCard key={tx.id} tx={tx} categories={categories} idx={idx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}