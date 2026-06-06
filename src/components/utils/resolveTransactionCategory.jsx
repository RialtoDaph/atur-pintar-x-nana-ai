// Single source of truth for resolving a transaction's display category
// (emoji, label, color). Used across TxRiwayatTab, RecentTransactions,
// TodayTransactionsCard so savings/income/expense tx render consistently.
//
// Priority:
// 1. Savings tx → always "Tabungan" label, icon from linked goal if any
// 2. Match against passed `categories` (id or name)
// 3. Legacy default-category key map
// 4. Custom category lookup via "custom_<id>" key
// 5. Fallback by transaction type (handles tx with empty category, e.g. from Goals)

const LEGACY_MAP = {
  food: { emoji: "🍔", label: "Makanan", color: "#00C9A7" },
  transport: { emoji: "🚗", label: "Transport", color: "#F5A623" },
  housing: { emoji: "🏠", label: "Rumah", color: "#4F7CFF" },
  health: { emoji: "❤️", label: "Kesehatan", color: "#FF6B6B" },
  entertainment: { emoji: "🎬", label: "Hiburan", color: "#9B59B6" },
  shopping: { emoji: "🛍️", label: "Belanja", color: "#E91E8C" },
  subscriptions: { emoji: "📱", label: "Langganan", color: "#1ABC9C" },
  salary: { emoji: "💼", label: "Gaji", color: "#27AE60" },
  freelance: { emoji: "💻", label: "Freelance", color: "#2ECC71" },
  savings: { emoji: "🐷", label: "Tabungan", color: "#3B82F6" },
  other: { emoji: "📦", label: "Lainnya", color: "#95A5A6" },
};

export function resolveTransactionCategory(tx, { categories = [], goals = [] } = {}) {
  // 1. Savings — label always "Tabungan", icon from goal if linked
  if (tx.type === "savings") {
    if (tx.goal_id) {
      const g = goals.find(x => x.id === tx.goal_id);
      if (g) return { emoji: g.icon || "🐷", label: "Tabungan", color: "#3B82F6" };
    }
    return { emoji: "🐷", label: "Tabungan", color: "#3B82F6" };
  }

  // 2. Match against passed categories list
  const cat = categories.find(
    c => c.id === tx.category || c.name?.toLowerCase() === tx.category?.toLowerCase()
  );
  if (cat) return { emoji: cat.emoji, label: cat.name, color: cat.color };

  // 3. Legacy default keys
  if (tx.category && LEGACY_MAP[tx.category]) return LEGACY_MAP[tx.category];

  // 4. Custom category by id
  if (tx.category?.startsWith("custom_")) {
    const id = tx.category.replace("custom_", "");
    const custom = categories.find(c => c.id === id);
    if (custom) return { emoji: custom.emoji, label: custom.name, color: custom.color };
  }

  // 5. Fallback by type when category empty
  if (!tx.category) {
    if (tx.type === "income") return { emoji: "💼", label: "Pemasukan", color: "#27AE60" };
  }

  return { emoji: "📦", label: tx.category || "Lainnya", color: "#95A5A6" };
}