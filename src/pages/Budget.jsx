import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, TrendingUp } from "lucide-react";
import AddBudgetModal from "@/components/budget/AddBudgetModal.jsx";
import { useAppSettings } from "@/components/utils/useAppSettings";

const DEFAULT_CATEGORIES = {
  housing: { label: "Housing", emoji: "🏠", color: "#4F7CFF" },
  food: { label: "Food", emoji: "🍔", color: "#00C9A7" },
  transport: { label: "Transport", emoji: "🚗", color: "#F5A623" },
  health: { label: "Health", emoji: "❤️", color: "#FF6B6B" },
  entertainment: { label: "Entertainment", emoji: "🎬", color: "#9B59B6" },
  shopping: { label: "Shopping", emoji: "🛍️", color: "#E91E8C" },
  subscriptions: { label: "Subscriptions", emoji: "📱", color: "#1ABC9C" },
  other: { label: "Other", emoji: "📦", color: "#95A5A6" },
};

export default function BudgetPage() {
  const { t, formatCurrency } = useAppSettings();
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [user, setUser] = useState(null);
  const [currentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
    }).catch(() => {});
  }, []);

  useEffect(() => { if (user) loadData(); }, [user]);

  async function loadData() {
    setLoading(true);
    const [b, t] = await Promise.all([
      base44.entities.Budget.filter({ month: currentMonth, created_by: user.email }),
      base44.entities.Transaction.filter({ created_by: user.email }, "-date", 200),
    ]);
    setBudgets(b);
    setTransactions(t);
    setLoading(false);
  }

  async function handleDelete(id) {
    if (!window.confirm(t('budget_confirm_delete'))) return;
    await base44.entities.Budget.delete(id);
    loadData();
  }

  const thisMonthTx = transactions.filter(t => {
    const d = new Date(t.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.type === "expense";
  });

  const spendingByCategory = {};
  thisMonthTx.forEach(tx => {
    const key = tx.category || "other";
    spendingByCategory[key] = (spendingByCategory[key] || 0) + tx.amount;
  });

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + (spendingByCategory[b.category] || 0), 0);
  const overallPercent = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  const monthLabel = new Date(currentMonth + "-01").toLocaleString(navigator.language, { month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-[#F2F4F7] pb-8">
      <div className="bg-[#0A0A0A] px-5 pt-10 pb-20">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[#8FA4C8] text-sm font-medium">{monthLabel}</p>
              <h1 className="text-white text-2xl font-bold mt-0.5">{t('budget_subtitle')}</h1>
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="w-10 h-10 rounded-full bg-[#FF6A00] flex items-center justify-center shadow-lg hover:bg-[#e05e00] transition-colors"
            >
              <Plus className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Overview Card */}
          <div className="bg-white/10 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-3">
              <span className="text-white/70 text-sm">{t('budget_total')}</span>
              <span className="text-white font-bold text-lg">{formatCurrency(totalBudget)}</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3 mb-2">
              <div
                className="h-3 rounded-full transition-all"
                style={{
                  width: `${overallPercent}%`,
                  backgroundColor: overallPercent > 90 ? "#FF6B6B" : overallPercent > 70 ? "#F5A623" : "#00C9A7"
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-white/60">
              <span>{t('budget_spent')}: {formatCurrency(totalSpent)}</span>
              <span>{t('budget_remaining')}: {formatCurrency(Math.max(totalBudget - totalSpent, 0))}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 -mt-10 space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />
          ))
        ) : budgets.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <TrendingUp className="w-10 h-10 text-[#8FA4C8] mx-auto mb-3" />
            <p className="text-[#4A5568] font-semibold">{t('budget_empty_title')}</p>
            <p className="text-[#8FA4C8] text-sm mt-1">{t('budget_empty_desc')}</p>
          </div>
        ) : (
          budgets.map(budget => {
            const cat = DEFAULT_CATEGORIES[budget.category] || { label: budget.category, emoji: "📦", color: "#95A5A6" };
            const spent = spendingByCategory[budget.category] || 0;
            const percent = Math.min((spent / budget.amount) * 100, 100);
            const isOver = spent > budget.amount;
            return (
              <div key={budget.id} className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ backgroundColor: cat.color + "20" }}>
                      {cat.emoji}
                    </div>
                    <div>
                      <p className="font-semibold text-[#1A1A1A]">{cat.label}</p>
                      <p className="text-xs text-[#8FA4C8]">{formatCurrency(spent)} / {formatCurrency(budget.amount)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${isOver ? "text-[#FF6B6B]" : "text-[#1A1A1A]"}`}>
                      {Math.round(percent)}%
                    </span>
                    <button onClick={() => handleDelete(budget.id)} className="text-[#CBD5E0] hover:text-[#FF6B6B] transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="w-full bg-[#F2F4F7] rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: isOver ? "#FF6B6B" : percent > 70 ? "#F5A623" : cat.color
                    }}
                  />
                </div>
                {isOver && (
                  <p className="text-xs text-[#FF6B6B] mt-1.5 font-medium">⚠️ {t('budget_over')} {formatCurrency(spent - budget.amount)}</p>
                )}
              </div>
            );
          })
        )}
      </div>

      {showAdd && (
        <AddBudgetModal
          existingCategories={budgets.map(b => b.category)}
          currentMonth={currentMonth}
          onClose={() => setShowAdd(false)}
          onSave={async (data) => {
            await base44.entities.Budget.create({ ...data, month: currentMonth });
            setShowAdd(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}