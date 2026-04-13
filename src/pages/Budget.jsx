import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, ChevronLeft, ChevronRight, TrendingUp, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import AddBudgetModal from "@/components/budget/AddBudgetModal";
import BudgetCard from "@/components/budget/BudgetCard";
import SavingsRecommendationWidget from "@/components/budget/SavingsRecommendationWidget";
import BudgetNanaPanel from "@/components/budget/BudgetNanaPanel";
import BudgetAlertChecker from "@/components/budget/BudgetAlertChecker";
import { useAppSettings } from "@/components/utils/useAppSettings";

const DEFAULT_CATEGORIES = [
  { key: "housing",       label_id: "Rumah/Sewa",         label_en: "Housing/Rent",    emoji: "🏠", color: "#4F7CFF" },
  { key: "food",          label_id: "Makanan & Minuman",   label_en: "Food & Drinks",   emoji: "🍔", color: "#00C9A7" },
  { key: "transport",     label_id: "Transportasi",        label_en: "Transport",       emoji: "🚗", color: "#F5A623" },
  { key: "health",        label_id: "Kesehatan",           label_en: "Health",          emoji: "❤️", color: "#FF6B6B" },
  { key: "entertainment", label_id: "Hiburan",             label_en: "Entertainment",   emoji: "🎬", color: "#9B59B6" },
  { key: "shopping",      label_id: "Belanja",             label_en: "Shopping",        emoji: "🛍️", color: "#E91E8C" },
  { key: "subscriptions", label_id: "Langganan",           label_en: "Subscriptions",   emoji: "📱", color: "#1ABC9C" },
  { key: "other",         label_id: "Lainnya",             label_en: "Other",           emoji: "📦", color: "#95A5A6" },
];

function getMonthKey(offset = 0) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const FREE_BUDGET_LIMIT = 2;

export default function BudgetPage() {
  const { t, formatCurrency, settings } = useAppSettings();
  const lang = settings.language || "id";

  const [monthOffset, setMonthOffset] = useState(0);
  const currentMonth = getMonthKey(monthOffset);

  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [transactions3M, setTransactions3M] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [user, setUser] = useState(null);
  const [goals, setGoals] = useState([]);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) loadData();
  }, [user, currentMonth]);

  useEffect(() => {
    if (!user?.email) return;
    const unsub1 = base44.entities.Budget.subscribe(() => loadData());
    const unsub2 = base44.entities.Transaction.subscribe(() => loadData());
    return () => { unsub1(); unsub2(); };
  }, [user?.email]);

  async function loadData() {
    setLoading(true);
    const monthStart = `${currentMonth}-01`;
    const [year, month] = currentMonth.split("-").map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    const monthEnd = `${currentMonth}-${String(lastDay).padStart(2, "0")}`;

    // Build 3-month range for context
    const threeMonthsAgo = (() => {
      const d = new Date(year, month - 4, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
    })();

    try {
      const [bRaw, txAll, cats, g] = await Promise.all([
        base44.entities.Budget.filter({ month: currentMonth, created_by: user.email }, 'created_date'),
        base44.entities.Transaction.filter({ created_by: user.email }, "-date", 300),
        base44.entities.CustomCategory.list("-created_date"),
        base44.entities.SavingsGoal.filter({ created_by: user.email, status: "active" }),
      ]);

      // Dedup budgets: for each (category+month), keep only the OLDEST record
      const seenCats = new Set();
      const b = (bRaw || []).filter(bg => {
        const key = `${bg.category}_${bg.month}`;
        if (seenCats.has(key)) return false;
        seenCats.add(key);
        return true;
      });

      const monthTx = txAll.filter(tx => tx.date >= monthStart && tx.date <= monthEnd && tx.type === "expense" && !tx.is_deleted);
      const prev3Tx = txAll.filter(tx => tx.date >= threeMonthsAgo && tx.date < monthStart);

      setBudgets(b);
      setTransactions(monthTx);
      setTransactions3M(prev3Tx);
      setCustomCategories(cats);
      setGoals(g);
    } finally {
      setLoading(false);
    }
  }

  // Merge default + custom category metadata
  const categoryMap = {};
  DEFAULT_CATEGORIES.forEach(c => {
    categoryMap[c.key] = { label: lang === "id" ? c.label_id : c.label_en, emoji: c.emoji, color: c.color };
  });
  customCategories.forEach(c => {
    categoryMap[`custom_${c.id}`] = { label: c.name, emoji: c.emoji, color: c.color || "#95A5A6" };
  });

  function getCategoryMeta(key) {
    return categoryMap[key] || { label: key, emoji: "📦", color: "#95A5A6" };
  }

  const spendingByCategory = {};
  transactions.forEach(tx => {
    const key = tx.category || "other";
    spendingByCategory[key] = (spendingByCategory[key] || 0) + tx.amount;
  });

  const isPremium = user?.subscription_plan === "premium_monthly" || user?.subscription_plan === "premium_yearly";
  const budgetLimitReached = !isPremium && budgets.length >= FREE_BUDGET_LIMIT;

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + (spendingByCategory[b.category] || 0), 0);
  const overallPercent = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  const monthLabel = new Date(currentMonth + "-01").toLocaleString(
    lang === "id" ? "id-ID" : "en-US",
    { month: "long", year: "numeric" }
  );

  async function handleDelete(id) {
    if (!window.confirm("Menghapus budget tidak akan menghapus transaksi terkait. Hanya tracking anggaran yang dihapus. Lanjutkan?")) return;
    await base44.entities.Budget.delete(id);
    loadData();
  }

  async function handleSave(data) {
    if (editingBudget) {
      await base44.entities.Budget.update(editingBudget.id, { amount: data.amount });
    } else {
      // Check for existing budget with same category+month before creating
      const existing = budgets.find(b => b.category === data.category && b.month === currentMonth);
      if (existing) {
        await base44.entities.Budget.update(existing.id, { amount: data.amount });
      } else {
        await base44.entities.Budget.create({ ...data, month: currentMonth });
      }
    }
    setShowAdd(false);
    setEditingBudget(null);
    loadData();
  }

  function openEdit(budget) {
    setEditingBudget(budget);
    setShowAdd(true);
  }

  function closeModal() {
    setShowAdd(false);
    setEditingBudget(null);
  }

  return (
    <div className="min-h-screen bg-[#F2F4F7] pb-8">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#0A0A0A] to-[#0d0d0d] px-5 pt-10 pb-20">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[#8FA4C8] text-sm font-medium">{monthLabel}</p>
              <h1 className="text-white text-2xl font-bold mt-0.5">{t("budget_subtitle")}</h1>
            </div>
            <div className="flex items-center gap-2">
              {/* Month navigator */}
              <button
                onClick={() => setMonthOffset(o => o - 1)}
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 active:scale-95 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setMonthOffset(o => Math.min(o + 1, 0))}
                disabled={monthOffset === 0}
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 active:scale-95 transition-all disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              {budgetLimitReached ? (
                <Link
                  to="/Subscription"
                  data-tour="add-budget-btn"
                  className="w-11 h-11 rounded-full bg-[#8FA4C8] flex items-center justify-center shadow-lg hover:bg-[#7a93b5] active:scale-95 transition-all"
                  title="Upgrade untuk tambah lebih banyak budget"
                >
                  <Crown className="w-5 h-5 text-white" />
                </Link>
              ) : (
                <button
                  data-tour="add-budget-btn"
                  onClick={() => setShowAdd(true)}
                  className="w-11 h-11 rounded-full bg-[#F97316] flex items-center justify-center shadow-lg hover:bg-[#EA580C] active:scale-95 transition-all"
                  style={{boxShadow: '0 4px 16px rgba(249,115,22,0.4)'}}
                >
                  <Plus className="w-5 h-5 text-white" />
                </button>
              )}
            </div>
          </div>

          {/* Overview card */}
          <div className="bg-white/10 rounded-2xl p-5 border border-white/5">
            <div className="flex justify-between items-center mb-3">
              <span className="text-white/70 text-sm">{t("budget_total")}</span>
              <span className="text-white font-bold text-lg">{formatCurrency(totalBudget)}</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3 mb-2">
              <div
                className="h-3 rounded-full transition-all"
                style={{
                  width: `${overallPercent}%`,
                  backgroundColor:
                    overallPercent > 90 ? "#FF6B6B" : overallPercent > 70 ? "#F5A623" : "#00C9A7",
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-white/60">
              <span>{t("budget_spent")}: {formatCurrency(totalSpent)}</span>
              <span>{t("budget_remaining")}: {formatCurrency(Math.max(totalBudget - totalSpent, 0))}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Budget list */}
      <div className="max-w-2xl mx-auto px-5 -mt-10 space-y-3">
        {/* Nana AI Savings Recommendation */}
        {budgetLimitReached && (
          <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 border border-[#FF6A00]/20">
            <Crown className="w-5 h-5 text-[#F97316] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#1A1A1A]">Batas {FREE_BUDGET_LIMIT} budget tercapai</p>
              <p className="text-xs text-[#8FA4C8]">Upgrade Premium untuk budget unlimited.</p>
            </div>
            <Link to="/Subscription" className="px-3 py-1.5 bg-[#F97316] text-white rounded-xl text-xs font-semibold hover:bg-[#EA580C] transition-colors flex-shrink-0">Upgrade</Link>
          </div>
        )}
        {/* Proactive Nana AI Budget Alerts */}
        {!loading && budgets.length > 0 && (
          <BudgetNanaPanel
            budgets={budgets}
            spendingByCategory={spendingByCategory}
            goals={goals}
          />
        )}

        {/* Background alert checker */}
        {!loading && monthOffset === 0 && (
          <BudgetAlertChecker
            user={user}
            budgets={budgets}
            spendingByCategory={spendingByCategory}
          />
        )}

        {!loading && Object.keys(spendingByCategory).length > 0 && (
          <SavingsRecommendationWidget
            spendingByCategory={spendingByCategory}
            budgets={budgets}
            transactions3M={transactions3M}
          />
        )}
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />
          ))
        ) : budgets.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
            <div className="text-5xl mb-4">📊</div>
            <p className="text-[#1A1A1A] font-bold text-base">Belum ada budget</p>
            <p className="text-[#8FA4C8] text-sm mt-1 mb-5">Buat budget untuk mulai tracking pengeluaranmu tiap bulan!</p>
            <button
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F97316] text-white rounded-xl font-bold text-sm hover:bg-[#EA580C] transition-colors">
              <Plus className="w-4 h-4" /> Buat Budget Pertama
            </button>
          </div>
        ) : (
          budgets.map(budget => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              categoryMeta={getCategoryMeta(budget.category)}
              spent={spendingByCategory[budget.category] || 0}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Modal */}
       {showAdd && (
         <AddBudgetModal
           existingCategories={budgets.map(b => b.category)}
           existingBudgets={budgets}
           month={currentMonth}
           editBudget={editingBudget}
           onClose={closeModal}
           onSave={handleSave}
         />
       )}
      </div>
      );
      }