import { motion, AnimatePresence } from "framer-motion";
import { X, Pencil, Calendar, Wallet, Tag } from "lucide-react";

export default function TxDetailSheet({ tx, cat, accountName, formatCurrency, onClose, onEdit }) {
  if (!tx) return null;
  const isIncome = tx.type === "income";
  const amountColor = isIncome ? "#4ADE80" : tx.type === "savings" ? "#60A5FA" : "#F87171";
  const amountPrefix = isIncome ? "+" : "−";

  const dateLabel = tx.date
    ? new Date(tx.date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "-";

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[80] flex items-end"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop blur */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

        {/* Sheet */}
        <motion.div
          className="relative w-full bg-[#1A1E25] rounded-t-2xl z-10 pb-8"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          <div className="px-5 pt-3">
            {/* Icon + amount hero */}
            <div className="flex flex-col items-center py-5">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-3"
                style={{ backgroundColor: (cat?.color || "#888") + "30" }}
              >
                {cat?.emoji || "📦"}
              </div>
              <p className="text-2xl font-bold" style={{ color: amountColor }}>
                {amountPrefix}{formatCurrency(tx.amount)}
              </p>
              <p className="text-white font-semibold mt-1">{tx.note || cat?.label || "-"}</p>
            </div>

            {/* Detail rows */}
            <div className="bg-white/5 rounded-xl divide-y divide-white/10">
              <Row icon={<Calendar className="w-4 h-4" />} label="Tanggal" value={dateLabel} />
              {accountName && <Row icon={<Wallet className="w-4 h-4" />} label="Akun" value={accountName} />}
              <Row icon={<Tag className="w-4 h-4" />} label="Kategori" value={cat?.label || tx.category || "-"} />
              {tx.time && <Row icon={<span className="text-sm">🕐</span>} label="Waktu" value={tx.time} />}
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-5">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-white/20 text-white text-sm font-semibold tap-highlight-fix"
              >
                Tutup
              </button>
              <button
                onClick={() => { onClose(); onEdit(); }}
                className="flex-1 py-3 rounded-xl bg-[#F97316] text-white text-sm font-semibold flex items-center justify-center gap-2 tap-highlight-fix"
              >
                <Pencil className="w-4 h-4" /> Edit
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Row({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="text-[#8FA4C8]">{icon}</span>
      <span className="text-[#8FA4C8] text-sm flex-shrink-0">{label}</span>
      <span className="text-white text-sm font-medium ml-auto text-right">{value}</span>
    </div>
  );
}