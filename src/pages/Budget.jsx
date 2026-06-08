import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, ChevronLeft, ChevronRight, TrendingUp, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import AddBudgetModal from "@/components/budget/AddBudgetModal";
import BudgetCard from "@/components/budget/BudgetCard";
import BudgetNanaPanel from "@/components/budget/BudgetNanaPanel";
import BudgetAlertChecker from "@/components/budget/BudgetAlertChecker";
import BudgetChartSection from "@/components/budget/BudgetChartSection";
import { useAppSettings } from "@/components/utils/useAppSettings";
import { completeMission } from "@/hooks/useGamificationActions";
import { useToast } from "@/components/ui/use-toast";

function getMonthKey(offset = 0) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const FREE_BUDGET_LIMIT = 2;

export default function BudgetPage() {
  const { t, formatCurrency, settings } = useAppSettings();
  const { toast } = useToast();
  const lang = settings.language || "id";

  const [monthOffset, setMonthOffset] = useState(0);
  const currentMonth = getMonthKey(monthOffset);

  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [transactions3M, setTransactions3M] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [globalCategories, setGlobalCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [user, setUser] = useState(null);
  const [goals, setGoals] = useState([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const carryOverCheckedRef = useRef(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const debounceRef = useRef(null);
  const debouncedLoad = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadData(), 1500);
  }, []);

  useEffect(() => {
    if (user) loadData();
  }, [user, currentMonth]);

  useEffect(() => {
    if (!user?.email) return;
    const unsub1 = base44.entities.Budget.subscribe(() => debouncedLoad());
    const unsub2 = base44.entities.Transaction.subscribe(() => debouncedLoad());
    return () => { unsub1(); unsub2(); clearTimeout(debounceRef.current); };
  }, [user?.email, debouncedLoad]);

  async function loadData() {
    if (!user?.email) return;
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
      const [bRaw, txAll, cats, g, globalCats] = await Promise.all([
        base44.entities.Budget.filter({ month: currentMonth, created_by: user.email }, 'created_date'),
        base44.entities.Transaction.filter({ created_by: user.email }, "-date", 300),
        base44.entities.CustomCategory.list("-created_date"),
        base44.entities.SavingsGoal.filter({ created_by: user.email, status: "active" }),
        base44.entities.GlobalCategory.filter({ is_active: true }, "sort_order"),
      ]);

      // Dedup budgets: for each (category+month), keep only the OLDEST record
      const seenCats = new Set();
      const b = (bRaw || []).filter(bg => {
        const key = `${bg.category}_${bg.month}`;
        if (seenCats.has(key)) return false;
        seenCats.add(key);
        return true;
      });

      // Exclude soft-deleted records and recurring TEMPLATES (only generated children count toward spending)
      const isRealTx = (tx) => !tx.is_deleted && !(tx.is_recurring === true && !tx.is_recurring_child);
      const monthTx = txAll.filter(tx => isRealTx(tx) && tx.date >= monthStart && tx.date <= monthEnd && tx.type === "expense");
      const prev3Tx = txAll.filter(tx => isRealTx(tx) && tx.type === "expense" && tx.date >= threeMonthsAgo && tx.date < monthStart);

      setBudgets(b);
      setTransactions(monthTx);
      setTransactions3M(prev3Tx);
      setCustomCategories(cats);
      setGoals(g);
      setGlobalCategories(globalCats || []);

      // Mark "cek_budget" daily mission as complete (current month view only)
      if (monthOffset === 0 && user?.email) {
        completeMission(user.email, "cek_budget").catch(() => {});
      }

      // Budget carry-over: only check for current month (offset 0), only once per session
      if (monthOffset === 0 && !carryOverCheckedRef.current && b.length === 0) {
        carryOverCheckedRef.current = true;
        await tryCarryOverBudgets(currentMonth);
      }
    } finally {
      setLoading(false);
    }
  }

  async function tryCarryOverBudgets(thisMonth) {
    // Get previous month key
    const [y, m] = thisMonth.split("-").map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;

    const prevBudgets = await base44.entities.Budget.filter({
      month: prevMonth,
      created_by: user.email,
    }).catch(() => []);

    if (!prevBudgets || prevBudgets.length === 0) return;

    await Promise.all(
      prevBudgets.map(b =>
        base44.entities.Budget.create({ category: b.category, amount: b.amount, month: thisMonth, color: b.color })
      )
    );

    // Reload budgets after carry-over
    const freshBudgets = await base44.entities.Budget.filter({ month: thisMonth, created_by: user.email }, "created_date").catch(() => []);
    setBudgets(freshBudgets);

    toast({
      title: "Budget berhasil disalin! 🎉",
      description: `${prevBudgets.length} budget dari bulan lalu otomatis disalin ke bulan ini.`,
    });
  }

  // Build category metadata map — keyed by GlobalCategory.id
  const categoryMap = {};
  globalCategories.forEach(c => {
    categoryMap[c.id] = { label: c.name, emoji: c.emoji, color: c.color || "#95A5A6" };
  });
  customCategories.forEach(c => {
    categoryMap[`custom_${c.id}`] = { label: c.name, emoji: c.emoji, color: c.color || "#95A5A6" };
  });

  function getCategoryMeta(key) {
    return categoryMap[key] || { label: key, emoji: "📦", color: "#95A5A6" };
  }

  // Aggregate spending by category key (GlobalCategory.id or custom_<id>)
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
    setDeleteConfirmId(id);
  }

  async function confirmDelete() {
    if (!deleteConfirmId) return;
    await base44.entities.Budget.delete(deleteConfirmId);
    setDeleteConfirmId(null);
    loadData();
  }

  async function handleSave(data) {
    if (editingBudget) {
      await base44.entities.Budget.update(editingBudget.id, { amount: data.amount });
    } else {
      const existing = budgets.find(b => b.category === data.category && b.month === currentMonth);
      if (existing) {
        await base44.entities.Budget.update(existing.id, { amount: data.amount });
      } else {
        await base44.entities.Budget.create({ ...data, month: currentMonth });
        // Trigger gamification (handles XP, streak, achievements via backend)
        if (user?.email) base44.functions.invoke("processGamification", { trigger: "budget_created" }).catch(() => {});
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
      <div className="bg-[#0A0A0A] px-5 pt-10 pb-20">
        <div className="max-w-2xl mx-auto">
          {/* Row 1: Title + primary action */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[#8FA4C8] text-sm font-medium">Kategori</p>
              <h1 className="text-white text-2xl font-bold mt-0.5">{t("budget_subtitle")}</h1>
            </div>
            {budgetLimitReached ? (
              <Link
                to="/Subscription"
                data-tour="add-budget-btn"
                className="h-10 px-4 rounded-full bg-[#8FA4C8] flex items-center gap-1.5 shadow-lg hover:bg-[#7a93b5] active:scale-95 transition-all"
                title="Upgrade untuk tambah lebih banyak budget"
              >
                <Crown className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-semibold">Upgrade</span>
              </Link>
            ) : (
              <button
                data-tour="add-budget-btn"
                onClick={() => setShowAdd(true)}
                className="h-10 px-4 rounded-full bg-[#F97316] flex items-center shadow-lg hover:bg-[#EA580C] active:scale-95 transition-all"
              >
                <span className="text-white text-sm font-semibold">Tambah</span>
              </button>
            )}
          </div>

          {/* Row 2: Month navigator */}
          <div className="flex items-center justify-between bg-white/5 rounded-full px-2 py-1.5 border border-white/10">
            <button
              onClick={() => setMonthOffset(o => o - 1)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-white/10 active:scale-95 transition-all"
              aria-label="Bulan sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-white text-sm font-semibold capitalize">{monthLabel}</span>
            <button
              onClick={() => setMonthOffset(o => Math.min(o + 1, 0))}
              disabled={monthOffset === 0}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-white/10 active:scale-95 transition-all disabled:opacity-30"
              aria-label="Bulan berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Budget list */}
      <div className="max-w-2xl mx-auto px-5 -mt-14 space-y-3">
        {/* Nana AI Savings Recommendation */}
        {budgetLimitReached && (
          <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 border border-[#F97316]/20">
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
            categoryMap={Object.fromEntries(Object.entries(categoryMap).map(([k, v]) => [k, v.label]))}
          />
        )}

        {/* Visual Budget Chart */}
        {!loading && budgets.length > 0 && (
          <BudgetChartSection
            budgets={budgets}
            spendingByCategory={spendingByCategory}
            getCategoryMeta={getCategoryMeta}
            formatCurrency={formatCurrency}
            onEdit={openEdit}
            onDelete={handleDelete}
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
        ) : null}
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

       {deleteConfirmId && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
           <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
             <p className="font-bold text-[#1A1A1A] mb-2">Hapus Budget ini?</p>
             <p className="text-sm text-[#4A5568] mb-5">Transaksi yang sudah ada tidak ikut terhapus, hanya tracking budget kategori ini yang dihapus.</p>
             <div className="flex gap-2">
               <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-[#8FA4C8] hover:bg-[#F2F4F7]">Batal</button>
               <button onClick={confirmDelete} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600">Hapus</button>
             </div>
           </div>
         </div>
       )}
    </div>
  );
}