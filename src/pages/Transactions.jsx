import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Pencil, CheckSquare, Square, X, Repeat2, Target, Search, Upload, ChevronDown } from "lucide-react";
import { useAppSettings } from "@/components/utils/useAppSettings";
import { toast } from "sonner";
import AddTransactionModal from "@/components/transactions/AddTransactionModal";
import EditTransactionModal from "@/components/transactions/EditTransactionModal";
import CSVImportModal from "@/components/transactions/CSVImportModal";
import RecurringTransactionManager from "@/components/transactions/RecurringTransactionManager";
import PullToRefresh from "@/components/utils/PullToRefresh";
import DashboardInsights from "@/components/dashboard/DashboardInsights";

const DEFAULT_CATEGORIES = {
  housing: { emoji: "🏠", key: "cat_housing", color: "#4F7CFF" },
  food: { emoji: "🍔", key: "cat_food", color: "#00C9A7" },
  transport: { emoji: "🚗", key: "cat_transport", color: "#F5A623" },
  health: { emoji: "❤️", key: "cat_health", color: "#FF6B6B" },
  entertainment: { emoji: "🎬", key: "cat_entertainment", color: "#9B59B6" },
  shopping: { emoji: "🛍️", key: "cat_shopping", color: "#E91E8C" },
  subscriptions: { emoji: "📱", key: "cat_subscriptions", color: "#1ABC9C" },
  salary: { emoji: "💼", key: "cat_salary", color: "#27AE60" },
  freelance: { emoji: "💻", key: "cat_freelance", color: "#2ECC71" },
  savings: { emoji: "💰", key: "cat_savings", color: "#3498DB" },
  other: { emoji: "📦", key: "cat_other", color: "#95A5A6" },
};

export default function Transactions() {
  const { formatCurrency, t, settings } = useAppSettings();
  const FILTER_TABS = [
    { key: "all", label: t('tx_filter_all') },
    { key: "expense", label: t('tx_filter_expense') },
    { key: "income", label: t('tx_filter_income') },
  ];
  const [transactions, setTransactions] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [goalFilter, setGoalFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddTx, setShowAddTx] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [user, setUser] = useState(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [showRecurringManager, setShowRecurringManager] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
    }).catch((err) => {
      console.error("Failed to authenticate user:", err);
    });
  }, []);

  useEffect(() => { if (user) loadData(); }, [user]);

  async function loadData() {
    setLoading(true);
    try {
      const [txs, cats, gls] = await Promise.all([
        base44.entities.Transaction.filter({ created_by: user.email }, "-date", 200),
        base44.entities.CustomCategory.list("-created_date").catch(err => {
          console.error("Failed to load custom categories:", err);
          return [];
        }),
        base44.entities.SavingsGoal.filter({ created_by: user.email }, "-created_date"),
      ]);
      setTransactions(txs);
      setCustomCategories(cats);
      setGoals(gls);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error(t('error_loading_data'));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm(t('tx_confirm_delete'))) return;
    setDeleting(true);
    setTransactions(prev => prev.filter(t => t.id !== id));
    try {
      await base44.entities.Transaction.delete(id);
      toast.success(t('tx_delete_success'));
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error(t('tx_delete_error'));
      loadData();
    } finally {
      setDeleting(false);
    }
  }

  async function handleEdit(id, data) {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
    try {
      await base44.entities.Transaction.update(id, data);
      toast.success(t('tx_update_success'));
      setEditingTx(null);
    } catch (error) {
      console.error("Update failed:", error);
      toast.error(t('tx_update_error'));
      loadData();
    }
  }

  function toggleSelect(id) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (filtered.length === 0) return;
    setSelectedIds(new Set(filtered.map(t => t.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
    setSelectMode(false);
  }

  async function handleDeleteSelected() {
    if (selectedIds.size === 0) return;
    if (!confirm(t('tx_confirm_delete_selected', { count: selectedIds.size }))) return;
    setDeleting(true);
    try {
      await Promise.all([...selectedIds].map(id => base44.entities.Transaction.delete(id)));
      toast.success(t('tx_delete_success'));
      clearSelection();
      loadData();
    } catch (error) {
      console.error("Bulk delete failed:", error);
      toast.error(t('tx_delete_error'));
      setDeleting(false);
    }
  }

  async function handleDeleteAll() {
    if (!confirm(t('tx_confirm_delete_all', { count: filtered.length }))) return;
    setDeleting(true);
    try {
      await Promise.all(filtered.map(t => base44.entities.Transaction.delete(t.id)));
      toast.success(t('tx_delete_success'));
      clearSelection();
      loadData();
    } catch (error) {
      console.error("Delete all failed:", error);
      toast.error(t('tx_delete_error'));
      setDeleting(false);
    }
  }

  // Get category config (default + custom)
  const getCategoryConfig = (key) => {
    if (key && key.startsWith('custom_')) {
      const customId = key.substring(7);
      const cat = customCategories.find(c => c.id === customId);
      if (cat) return { emoji: cat.emoji, label: cat.name, color: cat.color || "#888" };
    }
    const defaultCat = DEFAULT_CATEGORIES[key] || DEFAULT_CATEGORIES.other;
    return { ...defaultCat, label: t(defaultCat.key) };
  };

  // Filter logic
  let filtered = filter === "all" ? transactions : transactions.filter(tx => tx.type === filter);
  if (goalFilter) {
    filtered = filtered.filter(tx => tx.goal_id === goalFilter);
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(tx => 
      (tx.note || "").toLowerCase().includes(q) ||
      getCategoryConfig(tx.category).label.toLowerCase().includes(q)
    );
  }

  // Reset page when filter changes
  useEffect(() => { setPage(1); }, [filter, goalFilter, searchQuery]);

  // Paginate
  const paginatedFiltered = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = filtered.length > page * PAGE_SIZE;

  // Group by month
  const grouped = {};
  const locale = settings.language === 'en' ? 'en-US' : settings.language === 'de' ? 'de-DE' : 'id-ID';
  paginatedFiltered.forEach(tx => {
    const d = new Date(tx.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString(locale, { month: "long", year: "numeric" });
    if (!grouped[key]) grouped[key] = { label, items: [] };
    grouped[key].items.push(tx);
  });

  const sortedGroups = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <PullToRefresh onRefresh={loadData}>
      <div className="min-h-screen bg-[#F2F4F7] pb-8">
        {/* Header */}
        <div className="bg-[#0A0A0A] px-5 pt-10 pb-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[#8FA4C8] text-sm font-medium">{t('tx_history')}</p>
            <h1 className="text-white text-2xl font-bold mt-0.5">{t('tx_title')}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setSelectMode(s => !s); setSelectedIds(new Set()); }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors tap-highlight-fix ${selectMode ? "bg-white text-[#0A0A0A]" : "bg-white/10 text-white hover:bg-white/20"}`}
            >
              {selectMode ? t('tx_cancel') : t('tx_select')}
            </button>
            <button
              onClick={() => setShowRecurringManager(true)}
              aria-label="Kelola transaksi berulang"
              className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 tap-highlight-fix"
              title="Transaksi berulang"
            >
              <Repeat2 className="w-4 h-4 text-white" aria-hidden="true" />
            </button>
            <button
              onClick={() => setShowCSVImport(true)}
              aria-label="Import dari file CSV"
              className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 tap-highlight-fix"
            >
              <Upload className="w-4 h-4 text-white" aria-hidden="true" />
            </button>
            <button
              onClick={() => setShowAddTx(true)}
              aria-label="Tambah transaksi baru"
              className="w-10 h-10 rounded-full bg-[#FF6A00] flex items-center justify-center shadow-lg hover:bg-[#e05e00] transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF6A00] focus:ring-offset-2 focus:ring-offset-[#0A0A0A] tap-highlight-fix"
            >
              <Plus className="w-5 h-5 text-white" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 mt-4 space-y-3">
        {/* AI Insights */}
        {!loading && transactions.length > 0 && (
          <DashboardInsights transactions={transactions} goals={goals} />
        )}

        {/* Recurring Transactions Card */}
        <button
          onClick={() => setShowRecurringManager(true)}
          className="w-full bg-white rounded-xl shadow-sm p-3 hover:shadow-md transition-shadow text-left tap-highlight-fix"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#4F7CFF]/10 flex items-center justify-center flex-shrink-0">
                <Repeat2 className="w-4 h-4 text-[#4F7CFF]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1A1A1A]">{t('recurring_transactions')}</p>
                <p className="text-xs text-[#8FA4C8]">{t('manage_income_expenses')}</p>
              </div>
            </div>
            <div className="text-[#8FA4C8] hover:text-[#4F7CFF] transition-colors">
              <Plus className="w-4 h-4" />
            </div>
          </div>
        </button>

        {/* Collapsible Filters Section */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full bg-white rounded-xl shadow-sm px-4 py-3 hover:shadow-md transition-all text-left flex items-center justify-between tap-highlight-fix"
        >
          <p className="text-sm font-semibold text-[#1A1A1A]">{t('tx_title')}</p>
          <ChevronDown className={`w-4 h-4 text-[#8FA4C8] transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>

        {/* Filters - Collapsible */}
        {showFilters && (
          <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
            {/* Select mode action bar */}
            {selectMode && (
              <div className="px-2 py-2 flex items-center justify-between border-b border-[#E2E8F0]">
                <div className="flex items-center gap-2">
                  <button onClick={selectAll} className="text-xs font-semibold text-[#FF6A00]">{t('tx_select_all')}</button>
                  {selectedIds.size > 0 && <span className="text-xs text-[#8FA4C8]">({selectedIds.size} {t('tx_selected')})</span>}
                </div>
                <div className="flex items-center gap-2">
                  {selectedIds.size > 0 && (
                    <button
                      onClick={handleDeleteSelected}
                      disabled={deleting}
                      className="px-3 py-1.5 rounded-lg bg-[#FF6B6B] text-white text-xs font-bold disabled:opacity-50"
                    >
                      {deleting ? t('tx_deleting') : `${t('tx_delete_selected')} (${selectedIds.size})`}
                    </button>
                  )}
                  <button
                    onClick={handleDeleteAll}
                    disabled={deleting || filtered.length === 0}
                    className="px-3 py-1.5 rounded-lg bg-[#0A0A0A] text-white text-xs font-bold disabled:opacity-50"
                  >
                    {t('tx_delete_all')}
                  </button>
                </div>
              </div>
            )}

            {/* Filter tabs */}
            <div className="flex bg-[#F8FAFC] rounded-lg p-0.5" role="tablist" aria-label="Filter transaksi">
              {FILTER_TABS.map(tab => (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={filter === tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`flex-1 py-1.5 rounded text-xs font-semibold capitalize transition-all focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#FF6A00] tap-highlight-fix ${
                      filter === tab.key ? "bg-white text-[#0A0A0A] shadow-sm" : "text-[#8FA4C8] hover:text-[#0A0A0A]"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8FA4C8]" aria-hidden="true" />
              <input
                type="search"
                aria-label={t('search_transactions')}
                placeholder={t('search_transactions')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-[#E2E8F0] rounded-lg pl-10 pr-4 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-white tap-highlight-fix"
              />
            </div>

            {/* Goal filter */}
            {goals.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                <button
                  onClick={() => setGoalFilter(null)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors tap-highlight-fix ${
                    !goalFilter ? "bg-[#0A0A0A] text-white" : "bg-[#F8FAFC] border border-[#E2E8F0] text-[#8FA4C8] hover:border-[#CBD5E0]"
                  }`}
                >
                  {t('all_goals')}
                </button>
                {goals.map(goal => (
                  <button
                    key={goal.id}
                    onClick={() => setGoalFilter(goal.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1 tap-highlight-fix ${
                      goalFilter === goal.id ? "bg-[#FF6A00] text-white" : "bg-[#F8FAFC] border border-[#E2E8F0] text-[#8FA4C8] hover:border-[#CBD5E0]"
                    }`}
                  >
                    {goal.icon} {goal.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-white rounded-2xl animate-pulse" />)}
          </div>
        ) : sortedGroups.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center" role="status" aria-live="polite">
            <p className="text-4xl mb-3" aria-hidden="true">📭</p>
            <p className="text-[#1A1A1A] font-semibold mb-1">{t('tx_empty_title')}</p>
            <p className="text-[#8FA4C8] text-sm mb-4">{t('tx_empty_desc')}</p>
            {!searchQuery && (
              <button
                onClick={() => setShowAddTx(true)}
                className="px-5 py-2.5 rounded-xl bg-[#FF6A00] text-white text-sm font-semibold hover:bg-[#e05e00] transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF6A00] focus:ring-offset-2 tap-highlight-fix"
              >
                + Tambah Transaksi
              </button>
            )}
          </div>
        ) : (
          sortedGroups.map(key => {
            const group = grouped[key];
            const monthIncome = group.items.filter(t => t.type === "income").reduce((s,t) => s + t.amount, 0);
            const monthExpense = group.items.filter(t => t.type === "expense").reduce((s,t) => s + t.amount, 0);

            return (
              <div key={key} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-[#F2F4F7] flex items-center justify-between">
                  <p className="text-sm font-bold text-[#1A1A1A]">{group.label}</p>
                  <div className="flex gap-3 text-xs">
                    {monthIncome > 0 && <span className="text-[#00C9A7] font-semibold">+{formatCurrency(monthIncome)}</span>}
                    {monthExpense > 0 && <span className="text-[#FF6B6B] font-semibold">−{formatCurrency(monthExpense)}</span>}
                  </div>
                </div>
                {group.items.map(tx => {
                   const cat = getCategoryConfig(tx.category);
                   const isIncome = tx.type === "income";
                   const linkedGoal = goals.find(g => g.id === tx.goal_id);
                   return (
                     <div
                       key={tx.id}
                       className={`flex items-center gap-3 px-4 py-3 hover:bg-[#F8FAFC] transition-colors group ${selectMode ? "cursor-pointer" : ""} ${selectedIds.has(tx.id) ? "bg-[#FF6A00]/5" : ""}`}
                       onClick={selectMode ? () => toggleSelect(tx.id) : undefined}
                     >
                       {selectMode && (
                         <div className="flex-shrink-0">
                           {selectedIds.has(tx.id)
                             ? <CheckSquare className="w-5 h-5 text-[#FF6A00]" />
                             : <Square className="w-5 h-5 text-[#CBD5E0]" />}
                         </div>
                       )}
                       <div
                         className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0"
                         style={{ backgroundColor: cat.color + "18" }}
                       >
                         {cat.emoji}
                       </div>
                       <div className="flex-1 min-w-0">
                         <div className="flex items-center gap-2">
                           <p className="text-sm font-medium text-[#1A1A1A] truncate">
                             {tx.note || cat.label}
                           </p>
                           <div className="flex gap-1 flex-shrink-0">
                             {tx.is_recurring && (
                               <div title={t('tx_recurring')} className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#4F7CFF]/10">
                                 <Repeat2 className="w-3 h-3 text-[#4F7CFF]" />
                               </div>
                             )}
                             {linkedGoal && (
                               <div title={linkedGoal.name} className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#FF6A00]/10">
                                 <Target className="w-3 h-3 text-[#FF6A00]" />
                               </div>
                             )}
                           </div>
                         </div>
                         <p className="text-xs text-[#8FA4C8]">
                           {new Date(tx.date).toLocaleDateString(locale, { month: "short", day: "numeric" })} · {cat.label}
                         </p>
                       </div>
                       <div className="flex items-center gap-1.5">
                         <span className="text-sm font-bold" style={{ color: isIncome ? "#00C9A7" : "#FF6B6B" }}>
                           {isIncome ? "+" : "−"}{formatCurrency(tx.amount)}
                         </span>
                         {!selectMode && (
                           <>
                             <button
                               onClick={() => setEditingTx(tx)}
                               className="opacity-0 group-hover:opacity-100 transition-opacity text-[#CBD5E0] hover:text-[#4F7CFF] ml-1"
                             >
                               <Pencil className="w-3.5 h-3.5" />
                             </button>
                             <button
                               onClick={() => handleDelete(tx.id)}
                               disabled={deleting}
                               className="opacity-0 group-hover:opacity-100 transition-opacity text-[#CBD5E0] hover:text-[#FF6B6B] disabled:opacity-50"
                             >
                               <Trash2 className="w-3.5 h-3.5" />
                             </button>
                           </>
                         )}
                       </div>
                     </div>
                   );
                 })}
              </div>
            );
          })
        )}

        {/* Load More */}
        {hasMore && (
          <div className="text-center py-2">
            <button
              onClick={() => setPage(p => p + 1)}
              className="px-6 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-sm font-semibold text-[#4A5568] hover:bg-[#F2F4F7] transition-colors shadow-sm tap-highlight-fix"
            >
              Muat lebih banyak ({filtered.length - paginatedFiltered.length} lagi)
            </button>
          </div>
        )}
      </div>

      {showAddTx && (
         <AddTransactionModal
           goals={goals}
           onClose={() => setShowAddTx(false)}
           onSave={async (data) => {
             const tempId = `temp_${Date.now()}`;
             const optimisticTx = { ...data, id: tempId, created_date: new Date().toISOString() };
             setTransactions(prev => [optimisticTx, ...prev]);
             setShowAddTx(false);
             try {
               if (!data || !data.amount || data.amount <= 0 || !data.type) {
                 throw new Error("Invalid transaction data");
               }
               await base44.entities.Transaction.create(data);
               toast.success(t('tx_create_success'));
               setTransactions(prev => prev.filter(t => t.id !== tempId));
               loadData();
             } catch (error) {
               console.error("Create transaction failed:", error);
               toast.error(t('tx_create_error'));
               setTransactions(prev => prev.filter(t => t.id !== tempId));
             }
           }}
         />
       )}

      {editingTx && (
        <EditTransactionModal
          transaction={editingTx}
          goals={goals}
          onClose={() => setEditingTx(null)}
          onSave={handleEdit}
        />
      )}

      {showCSVImport && (
        <CSVImportModal
          onClose={() => setShowCSVImport(false)}
          onSuccess={loadData}
        />
      )}

      {showRecurringManager && (
        <RecurringTransactionManager
          onClose={() => setShowRecurringManager(false)}
          onRefresh={loadData}
        />
      )}
      </div>
    </PullToRefresh>
  );
}