import { formatRupiah } from "@/components/utils/formatRupiah";

const CATEGORY_CONFIG = {
  housing: { emoji: "🏠", color: "#4F7CFF" },
  food: { emoji: "🍔", color: "#00C9A7" },
  transport: { emoji: "🚗", color: "#F5A623" },
  health: { emoji: "❤️", color: "#FF6B6B" },
  entertainment: { emoji: "🎬", color: "#9B59B6" },
  shopping: { emoji: "🛍️", color: "#E91E8C" },
  subscriptions: { emoji: "📱", color: "#1ABC9C" },
  salary: { emoji: "💼", color: "#27AE60" },
  freelance: { emoji: "💻", color: "#2ECC71" },
  savings: { emoji: "💰", color: "#3498DB" },
  other: { emoji: "📦", color: "#95A5A6" },
};

export default function RecentTransactions({ transactions, loading }) {
  if (loading) {
    return (
      <div className="px-5 pb-5 space-y-3">
        {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="px-5 pb-5 text-center py-8 text-[#8FA4C8] text-sm">
        No transactions yet. Add your first one!
      </div>
    );
  }

  return (
    <div className="pb-2">
      {transactions.map((tx) => {
        const cat = CATEGORY_CONFIG[tx.category] || CATEGORY_CONFIG.other;
        const isIncome = tx.type === "income";
        return (
          <div key={tx.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
              style={{ backgroundColor: cat.color + "18" }}
            >
              {cat.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1B2559] truncate">{tx.note || (tx.category ? tx.category.charAt(0).toUpperCase() + tx.category.slice(1) : "Transaction")}</p>
              <p className="text-xs text-[#8FA4C8]">{new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
            </div>
            <span
              className="text-sm font-bold flex-shrink-0"
              style={{ color: isIncome ? "#00C9A7" : "#FF6B6B" }}
            >
              {isIncome ? "+" : "−"}${tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        );
      })}
    </div>
  );
}