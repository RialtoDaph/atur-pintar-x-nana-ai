import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAppSettings } from "@/components/utils/useAppSettings";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const DEFAULT_CAT = { emoji: "📦", color: "#95A5A6" };
const CAT_MAP = {
  housing: { emoji: "🏠", color: "#4F7CFF" }, food: { emoji: "🍔", color: "#00C9A7" },
  transport: { emoji: "🚗", color: "#F5A623" }, health: { emoji: "❤️", color: "#FF6B6B" },
  entertainment: { emoji: "🎬", color: "#9B59B6" }, shopping: { emoji: "🛍️", color: "#E91E8C" },
  subscriptions: { emoji: "📱", color: "#1ABC9C" }, salary: { emoji: "💼", color: "#27AE60" },
  freelance: { emoji: "💻", color: "#2ECC71" }, savings: { emoji: "💰", color: "#3498DB" },
  other: { emoji: "📦", color: "#95A5A6" },
};

function relativeDate(dateStr) {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (dateStr === today) return "Hari ini";
  if (dateStr === yesterday) return "Kemarin";
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export default function RecentTransactionsWidget({ transactions, loading }) {
  const { formatCurrency } = useAppSettings();
  const [globalCats, setGlobalCats] = useState([]);

  useEffect(() => {
    base44.entities.GlobalCategory.list().then(c => setGlobalCats(c || [])).catch(() => {});
  }, []);

  const displayTx = (transactions || [])
    .filter(t => !(t.is_recurring && !t.is_recurring_child) && !t.is_deleted)
    .slice(0, 5);

  function getCatInfo(catKey) {
    const gc = globalCats.find(c => c.id === catKey);
    if (gc) return { emoji: gc.emoji || "📦", color: "#F97316" };
    return CAT_MAP[catKey] || DEFAULT_CAT;
  }

  if (loading) return (
    <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
      {[1,2,3].map(i => <div key={i} className="h-10 bg-[#F2F4F7] rounded-xl animate-pulse" />)}
    </div>
  );

  if (displayTx.length === 0) return (
    <div className="bg-white rounded-2xl shadow-sm p-5 text-center">
      <p className="text-2xl mb-2">📭</p>
      <p className="text-sm text-[#8FA4C8]">Belum ada transaksi tercatat</p>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-[#1A1A1A]">Transaksi Terbaru 📋</h3>
        <Link to={createPageUrl("Transactions")} className="text-xs text-[#F97316] font-semibold">Lihat Semua</Link>
      </div>
      <div className="space-y-1">
        {displayTx.map(tx => {
          const { emoji, color } = getCatInfo(tx.category);
          const isIncome = tx.type === "income";
          return (
            <div key={tx.id} className="flex items-center gap-3 py-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0" style={{ backgroundColor: color + "18" }}>
                {emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[#1A1A1A] truncate">{tx.note || "Transaksi"}</p>
                <p className="text-[10px] text-[#8FA4C8]">{relativeDate(tx.date)}</p>
              </div>
              <span className="text-xs font-bold flex-shrink-0" style={{ color: isIncome ? "#16A34A" : "#DC2626" }}>
                {isIncome ? "+" : "−"}{formatCurrency(tx.amount)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}