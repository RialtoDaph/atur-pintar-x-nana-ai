import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Pencil } from "lucide-react";
import { formatRupiah } from "@/components/utils/formatRupiah";
import AddTransactionModal from "@/components/transactions/AddTransactionModal";
import EditTransactionModal from "@/components/transactions/EditTransactionModal";

const CATEGORY_CONFIG = {
  housing: { emoji: "🏠", label: "Housing", color: "#4F7CFF" },
  food: { emoji: "🍔", label: "Food", color: "#00C9A7" },
  transport: { emoji: "🚗", label: "Transport", color: "#F5A623" },
  health: { emoji: "❤️", label: "Health", color: "#FF6B6B" },
  entertainment: { emoji: "🎬", label: "Entertainment", color: "#9B59B6" },
  shopping: { emoji: "🛍️", label: "Shopping", color: "#E91E8C" },
  subscriptions: { emoji: "📱", label: "Subscriptions", color: "#1ABC9C" },
  salary: { emoji: "💼", label: "Salary", color: "#27AE60" },
  freelance: { emoji: "💻", label: "Freelance", color: "#2ECC71" },
  savings: { emoji: "💰", label: "Savings", color: "#3498DB" },
  other: { emoji: "📦", label: "Other", color: "#95A5A6" },
};

const FILTER_TABS = ["all", "expense", "income"];

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showAddTx, setShowAddTx] = useState(false);
  const [editingTx, setEditingTx] = useState(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const t = await base44.entities.Transaction.list("-date", 200);
    setTransactions(t);
    setLoading(false);
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this transaction?")) return;
    await base44.entities.Transaction.delete(id);
    loadData();
  }

  async function handleEdit(id, data) {
    await base44.entities.Transaction.update(id, data);
    setEditingTx(null);
    loadData();
  }

  const filtered = filter === "all" ? transactions : transactions.filter(t => t.type === filter);

  // Group by month
  const grouped = {};
  filtered.forEach(tx => {
    const d = new Date(tx.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
    if (!grouped[key]) grouped[key] = { label, items: [] };
    grouped[key].items.push(tx);
  });

  const sortedGroups = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="min-h-screen bg-[#F2F4F7] pb-8">
      {/* Header */}
      <div className="bg-[#1B2559] px-5 pt-10 pb-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-white text-2xl font-bold">Transactions</h1>
          <button
            onClick={() => setShowAddTx(true)}
            className="w-10 h-10 rounded-full bg-[#00C9A7] flex items-center justify-center shadow-lg hover:bg-[#00b596] transition-colors"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 mt-4 space-y-4">
        {/* Filter tabs */}
        <div className="flex bg-white rounded-xl p-1 shadow-sm">
          {FILTER_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                filter === tab ? "bg-[#1B2559] text-white shadow-sm" : "text-[#8FA4C8] hover:text-[#1B2559]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-white rounded-2xl animate-pulse" />)}
          </div>
        ) : sortedGroups.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-[#1B2559] font-semibold mb-1">No transactions yet</p>
            <p className="text-[#8FA4C8] text-sm">Tap + to add your first transaction</p>
          </div>
        ) : (
          sortedGroups.map(key => {
            const group = grouped[key];
            const monthIncome = group.items.filter(t => t.type === "income").reduce((s,t) => s + t.amount, 0);
            const monthExpense = group.items.filter(t => t.type === "expense").reduce((s,t) => s + t.amount, 0);

            return (
              <div key={key} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-[#F2F4F7] flex items-center justify-between">
                  <p className="text-sm font-bold text-[#1B2559]">{group.label}</p>
                  <div className="flex gap-3 text-xs">
                    {monthIncome > 0 && <span className="text-[#00C9A7] font-semibold">+{formatRupiah(monthIncome)}</span>}
                    {monthExpense > 0 && <span className="text-[#FF6B6B] font-semibold">−{formatRupiah(monthExpense)}</span>}
                  </div>
                </div>
                {group.items.map(tx => {
                  const cat = CATEGORY_CONFIG[tx.category] || CATEGORY_CONFIG.other;
                  const isIncome = tx.type === "income";
                  return (
                    <div key={tx.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#F8FAFC] transition-colors group">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0"
                        style={{ backgroundColor: cat.color + "18" }}
                      >
                        {cat.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1B2559] truncate">
                          {tx.note || cat.label}
                        </p>
                        <p className="text-xs text-[#8FA4C8]">
                          {new Date(tx.date).toLocaleDateString("id-ID", { month: "short", day: "numeric" })} · {cat.label}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold" style={{ color: isIncome ? "#00C9A7" : "#FF6B6B" }}>
                          {isIncome ? "+" : "−"}{formatRupiah(tx.amount)}
                        </span>
                        <button
                          onClick={() => setEditingTx(tx)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-[#CBD5E0] hover:text-[#4F7CFF] ml-1"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-[#CBD5E0] hover:text-[#FF6B6B]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>

      {showAddTx && (
        <AddTransactionModal
          onClose={() => setShowAddTx(false)}
          onSave={async (data) => {
            await base44.entities.Transaction.create(data);
            setShowAddTx(false);
            loadData();
          }}
        />
      )}

      {editingTx && (
        <EditTransactionModal
          transaction={editingTx}
          onClose={() => setEditingTx(null)}
          onSave={handleEdit}
        />
      )}
    </div>
  );
}