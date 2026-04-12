import { useState, useEffect, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Pencil, CheckSquare, Square, Repeat2, Target, Search, Upload, ChevronDown, Filter, X } from "lucide-react";
import { useAppSettings } from "@/components/utils/useAppSettings";
import { toast } from "sonner";
import AddTransactionModal from "@/components/transactions/AddTransactionModal";
import EditTransactionModal from "@/components/transactions/EditTransactionModal";
import CSVImportModal from "@/components/transactions/CSVImportModal";
import PullToRefresh from "@/components/utils/PullToRefresh";
import DashboardInsights from "@/components/dashboard/DashboardInsights";
import ContractPaymentsCard from "@/components/dashboard/ContractPaymentsCard";
import SubscriptionCard from "@/components/dashboard/SubscriptionCard";
import ReminderWidget from "@/components/reminders/ReminderWidget";
import { DEFAULT_CATEGORIES } from "@/components/utils/categoryConfig";

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
  const [page, setPage] = useState(1);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [globalCategories, setGlobalCategories] = useState([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const PAGE_SIZE = 50;

  useEffect(() => {
    let isMounted = true;
    base44.auth.me().then(u => {
      if (isMounted) setUser(u);
    }).catch((err) => {
      if (isMounted) console.error("Failed to authenticate user:", err);
    });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => { if (user) loadData(); }, [user]);

  useEffect(() => {
    const handler = () => { if (user) loadData(); };
    window.addEventListener("refresh-dashboard", handler);
    return () => window.removeEventListener("refresh-dashboard", handler);
  }, [user]);

  useEffect(() => {
    if (!user?.email) return;
    const unsub = base44.entities.Transaction.subscribe(() => loadData());
    return unsub;
  }, [user?.email]);

  useEffect(() => {
    base44.entities.GlobalCategory.list("sort_order").then(res => {
      setGlobalCategories((res || []).filter(c => c.is_active !== false));
    }).catch(() => {});
  }, []);

  function applyPreset(preset) {
    const today = new Date().toISOString().split("T")[0];
    const now = new Date();
    if (preset === "today") { setDateFrom(today); setDateTo(today); }
    else if (preset === "7d") {
      const d = new Date(); d.setDate(d.getDate() - 7);
      setDateFrom(d.toISOString().split("T")[0]); setDateTo(today);
    } else if (preset === "month") {
      setDateFrom(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-01`); setDateTo(today);
    } else if (preset === "lastmonth") {
      const lm = new Date(now.getFullYear(), now.getMonth()-1, 1);
      const lmEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      setDateFrom(lm.toISOString().split("T")[0]); setDateTo(lmEnd.toISOString().split("T")[0]);
    }
  }

  async function loadData() {
    setLoading(true);
    try {
      const [txs, cats, gls] = await Promise.all([
        base44.entities.Transaction.filter({ created_by: user.email }, "-date", 200),
        base44.entities.CustomCategory.list("-created_date").catch(() => []),
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
    const tx = transactions.find(t => t.id === id);
    setTransactions(prev => prev.filter(t => t.id !== id));
    try {
      await base44.entities.Transaction.delete(id);
      await base44.functions.invoke("syncTransactionChanges", { action: "delete", oldTransaction: tx });
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
    const oldTx = transactions.find(t => t.id === id);
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
    try {
      await base44.entities.Transaction.update(id, data);
      await base44.functions.invoke("syncTransactionChanges", { action: "update", transaction: data, oldTransaction: oldTx });
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
    if (paginatedFiltered.length === 0) return;
    setSelectedIds(new Set(paginatedFiltered.map(t => t.id)));
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

  const getCategoryConfig = useCallback((key) => {
    if (key && key.startsWith('custom_')) {
      const customId = key.substring(7);
      const cat = customCategories.find(c => c.id === customId);
      if (cat) return { emoji: cat.emoji, label: cat.name, color: cat.color || "#888" };
    }
    const allCats = [...DEFAULT_CATEGORIES.expense, ...DEFAULT_CATEGORIES.income];
    const defaultCat = allCats.find(c => c.key === key) || { key: "other", i18nKey: "cat_other", emoji: "📦", color: "#95A5A6" };
    return { ...defaultCat, label: t(defaultCat.i18nKey) };
  }, [customCategories, t]);

  const locale = useMemo(() =>
    settings.language === 'en' ? 'en-US' : settings.language === 'de' ? 'de-DE' : 'id-ID',
    [settings.language]
  );

  const hasActiveFilter = !!(dateFrom || dateTo || categoryFilter);

  const filtered = useMemo(() => {
    const now = new Date();
    const currentMonthChildParentIds = new Set(
      transactions
        .filter(tx => tx.is_recurring_child && (() => { const d = new Date(tx.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })())
        .map(tx => tx.recurring_parent_id)
        .filter(Boolean)
    );

    let result = transactions.filter(tx => {
      if (tx.is_recurring && !tx.is_recurring_child) {
        return !currentMonthChildParentIds.has(tx.id);
      }
      return true;
    });

    if (filter !== "all") result = result.filter(tx => tx.type === filter);
    if (goalFilter) result = result.filter(tx => tx.goal_id === goalFilter);
    if (dateFrom) result = result.filter(tx => tx.date >= dateFrom);
    if (dateTo) result = result.filter(tx => tx.date <= dateTo);
    if (categoryFilter) result = result.filter(tx => tx.category === categoryFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(tx =>
        (tx.note || "").toLowerCase().includes(q) ||
        getCategoryConfig(tx.category).label.toLowerCase().includes(q)
      );
    }
    return result;
  }, [transactions, filter, goalFilter, searchQuery, dateFrom, dateTo, categoryFilter, customCategories, settings.language]);

  useEffect(() => { setPage(1); }, [filter, goalFilter, searchQuery, dateFrom, dateTo, categoryFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginatedFiltered = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  const { grouped, sortedGroups } = useMemo(() => {
    const g = {};
    paginatedFiltered.forEach(tx => {
      const d = new Date(tx.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString(locale, { month: "long", year: "numeric" });
      if (!g[key]) g[key] = { label, items: [] };
      g[key].items.push(tx);
    });
    return { grouped: g, sortedGroups: Object.keys(g).sort((a, b) => b.localeCompare(a)) };
  }, [paginatedFiltered, locale]);

  return (
    <PullToRefresh onRefresh={loadData}>
      <div className="min-h-screen bg-[#F2F4F7] pb-8">
        {/* Header */}
        <div className="bg-gradient-to-b from-[#0A0A0A] to-[#0d0d0d] px-5 pt-10 pb-6">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-[#8FA4C8] text-sm font-medium">{t('tx_history')}</p>
              <h1 className="text-white text-2xl font-bold mt-0.5">{t('tx_title')}</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCSVImport(true)}
                className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all tap-highlight-fix"
              >
                <Upload className="w-4 h-4 text-white" />
              </button>
              <button
                data-tour="add-transaction-btn"
                onClick={() => setShowAddTx(true)}
                className="w-11 h-11 rounded-full bg-[#FF6A00] flex items-center justify-center shadow-lg hover:bg-[#e05e00] active:scale-95 transition-all tap-highlight-fix"
                style={{boxShadow: '0 4px 16px rgba(255,106,0,0.45)'}}
              >
                <Plus className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-5 mt-4 space-y-4">
          {user && <ReminderWidget user={user} />}

          {!loading && transactions.length > 0 && (
            <DashboardInsights transactions={transactions} goals={goals} />
          )}

          {user && (
            <>
              <ContractPaymentsCard user={user} />
              <SubscriptionCard user={user} />
            </>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-start gap-3">
            <span className="text-base">🔄</span>
            <div>
              <p className="text-xs font-bold text-amber-800">Transaksi Berulang (Recurring)</p>
              <p className="text-xs text-amber-700 mt-0.5">Transaksi recurring tidak diproses otomatis. Buka halaman ini secara berkala untuk mengonfirmasi transaksi yang perlu diulang.</p>
            </div>
          </div>

          <div data-tour="tx-history-card" className="bg-white rounded-2xl shadow-md overflow-hidden border border-[#F0F2F5]">
            <div className="flex items-center justify-between px-4 py-3.5">
              <button
                onClick={() => setHistoryOpen(o => !o)}
                className="flex items-center gap-2 flex-1 tap-highlight-fix"
              >
                <p className="text-sm font-bold text-[#1A1A1A]">{t('tx_history')} {t('tx_title')}</p>
                <ChevronDown className={`w-4 h-4 text-[#8FA4C8] transition-transform ${historyOpen ? "rotate-180" : ""}`} />
              </button>
              {selectMode && selectedIds.size > 0 && (
                <button onClick={handleDeleteSelected} disabled={deleting}
                  className="px-3 py-1.5 rounded-lg bg-[#FF6B6B] text-white text-xs font-bold disabled:opacity-50 tap-highlight-fix">
                  {deleting ? t('tx_deleting') : `Hapus (${selectedIds.size})`}
                </button>
              )}
              {selectMode && (
                <button onClick={selectAll}
                  className="px-3 py-1.5 rounded-lg bg-[#F2F4F7] text-[#4A5568] text-xs font-semibold tap-highlight-fix">
                  Pilih Semua
                </button>
              )}
              <button
                onClick={() => { setSelectMode(s => !s); setSelectedIds(new Set()); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors tap-highlight-fix ${selectMode ? "bg-[#0A0A0A] text-white" : "bg-[#F2F4F7] text-[#4A5568]"}`}
              >
                {selectMode ? t('tx_cancel') : t('tx_select')}
              </button>
            </div>

            {historyOpen && (
              <>
                <div className="px-4 pt-2 pb-2 space-y-2 border-t border-[#F2F4F7]">
                  <div className="flex bg-[#F2F4F7] rounded-lg p-0.5" role="tablist">
                    {FILTER_TABS.map(tab => (
                      <button key={tab.key} role="tab" aria-selected={filter === tab.key}
                        onClick={() => setFilter(tab.key)}
                        className={`flex-1 py-1.5 rounded-md text-xs font-semibold capitalize transition-all tap-highlight-fix ${filter === tab.key ? "bg-[#0A0A0A] text-white shadow-sm" : "text-[#8FA4C8]"}`}>
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8FA4C8]" />
                      <input
                        type="search"
                        placeholder={t('search_transactions')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full border border-[#E2E8F0] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#FF6A00] bg-[#F8FAFC] tap-highlight-fix"
                      />
                    </div>
                    <button
                      onClick={() => setShowFilterPanel(v => !v)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold tap-highlight-fix transition-colors ${showFilterPanel || hasActiveFilter ? "bg-[#FF6A00] text-white" : "bg-[#F2F4F7] text-[#4A5568]"}`}
                    >
                      <Filter className="w-3 h-3" />
                      {hasActiveFilter ? "Aktif" : "Filter"}
                    </button>
                  </div>

                  {showFilterPanel && (
                    <div className="bg-[#F8FAFC] rounded-xl p-3 space-y-3 border border-[#E2E8F0]">
                      <div>
                        <p className="text-[10px] font-semibold text-[#8FA4C8] uppercase mb-1.5">Periode Cepat</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {[["today","Hari ini"],["7d","7 Hari"],["month","Bulan ini"],["lastmonth","Bulan lalu"]].map(([key, label]) => (
                            <button key={key} onClick={() => applyPreset(key)}
                              className="px-2.5 py-1 rounded-lg bg-white border border-[#E2E8F0] text-xs font-medium text-[#4A5568] hover:border-[#FF6A00] hover:text-[#FF6A00] transition-colors tap-highlight-fix">
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[10px] font-semibold text-[#8FA4C8] mb-1">Dari Tanggal</p>
                          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                            className="w-full border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-xs text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#FF6A00] bg-white" />
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-[#8FA4C8] mb-1">Sampai Tanggal</p>
                          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                            className="w-full border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-xs text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#FF6A00] bg-white" />
                        </div>
                      </div>
                      {globalCategories.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold text-[#8FA4C8] mb-1.5">Kategori</p>
                          <div className="flex flex-wrap gap-1.5">
                            <button onClick={() => setCategoryFilter("")}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium tap-highlight-fix transition-colors ${!categoryFilter ? "bg-[#0A0A0A] text-white" : "bg-white border border-[#E2E8F0] text-[#4A5568]"}`}>
                              Semua
                            </button>
                            {globalCategories.map(cat => {
                              const key = cat.id ? `global_${cat.id}` : cat.key;
                              return (
                                <button key={key} onClick={() => setCategoryFilter(categoryFilter === key ? "" : key)}
                                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium tap-highlight-fix transition-colors ${categoryFilter === key ? "bg-[#FF6A00] text-white" : "bg-white border border-[#E2E8F0] text-[#4A5568]"}`}>
                                  {cat.emoji} {cat.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {hasActiveFilter && (
                        <button onClick={() => { setDateFrom(""); setDateTo(""); setCategoryFilter(""); }}
                          className="flex items-center gap-1 text-xs text-red-500 font-medium hover:text-red-700 tap-highlight-fix">
                          <X className="w-3 h-3" /> Reset Filter
                        </button>
                      )}
                    </div>
                  )}

                  {goals.length > 0 && (
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      <button onClick={() => setGoalFilter(null)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors tap-highlight-fix ${!goalFilter ? "bg-[#0A0A0A] text-white" : "bg-[#F2F4F7] text-[#8FA4C8]"}`}>
                        {t('all_goals')}
                      </button>
                      {goals.map(goal => (
                        <button key={goal.id} onClick={() => setGoalFilter(goal.id)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors flex items-center gap-1 tap-highlight-fix ${goalFilter === goal.id ? "bg-[#FF6A00] text-white" : "bg-[#F2F4F7] text-[#8FA4C8]"}`}>
                          {goal.icon} {goal.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {loading ? (
                  <div className="p-4 space-y-2">
                    {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-[#F2F4F7] rounded-xl animate-pulse" />)}
                  </div>
                ) : sortedGroups.length === 0 ? (
                  <div className="p-10 text-center">
                    <p className="text-3xl mb-2">📭</p>
                    <p className="text-[#1A1A1A] font-semibold text-sm mb-1">{t('tx_empty_title')}</p>
                    <p className="text-[#8FA4C8] text-xs mb-4">{t('tx_empty_desc')}</p>
                    {!searchQuery && (
                      <button onClick={() => setShowAddTx(true)}
                        className="px-4 py-2 rounded-xl bg-[#FF6A00] text-white text-xs font-semibold hover:bg-[#e05e00] transition-colors tap-highlight-fix">
                        + {t('add_transaction')}
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {sortedGroups.map(key => {
                      const group = grouped[key];
                      const monthIncome = group.items.filter(t => t.type === "income").reduce((s,t) => s + t.amount, 0);
                      const monthExpense = group.items.filter(t => t.type === "expense").reduce((s,t) => s + t.amount, 0);
                      return (
                        <div key={key}>
                          <div className="px-4 py-2 bg-[#F8FAFC] border-b border-[#F2F4F7] flex items-center justify-between">
                            <p className="text-xs font-bold text-[#1A1A1A]">{group.label}</p>
                            <div className="flex gap-2 text-[11px]">
                              {monthIncome > 0 && <span className="text-[#00C9A7] font-semibold">+{formatCurrency(monthIncome)}</span>}
                              {monthExpense > 0 && <span className="text-[#FF6B6B] font-semibold">−{formatCurrency(monthExpense)}</span>}
                            </div>
                          </div>
                          {group.items.sort((a, b) => new Date(b.date) - new Date(a.date)).map(tx => {
                            const cat = getCategoryConfig(tx.category);
                            const isIncome = tx.type === "income";
                            const linkedGoal = goals.find(g => g.id === tx.goal_id);
                            return (
                              <div key={tx.id}
                                className={`flex items-center gap-3 px-4 py-3 hover:bg-[#F8FAFC] active:bg-[#F2F4F7] transition-all duration-150 border-b border-[#F2F4F7] last:border-b-0 ${selectMode ? "cursor-pointer" : ""} ${selectedIds.has(tx.id) ? "bg-[#FF6A00]/5" : ""}`}
                                onClick={selectMode ? () => toggleSelect(tx.id) : undefined}
                              >
                                {selectMode && (
                                  <div className="flex-shrink-0">
                                    {selectedIds.has(tx.id)
                                      ? <CheckSquare className="w-4 h-4 text-[#FF6A00]" />
                                      : <Square className="w-4 h-4 text-[#CBD5E0]" />}
                                  </div>
                                )}
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                                  style={{ backgroundColor: cat.color + "18" }}>
                                  {cat.emoji}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-xs font-medium text-[#1A1A1A] truncate">{tx.note || cat.label}</p>
                                    {tx.is_recurring && <Repeat2 className="w-3 h-3 text-[#4F7CFF] flex-shrink-0" />}
                                    {linkedGoal && <Target className="w-3 h-3 text-[#FF6A00] flex-shrink-0" />}
                                  </div>
                                  <p className="text-[11px] text-[#8FA4C8]">
                                    {new Date(tx.date).toLocaleDateString(locale, { month: "short", day: "numeric" })} · {cat.label}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs font-bold" style={{ color: isIncome ? "#00C9A7" : "#FF6B6B" }}>
                                    {isIncome ? "+" : "−"}{formatCurrency(tx.amount)}
                                  </span>
                                  {!selectMode && (
                                    <>
                                      <button onClick={() => setEditingTx(tx)} className="text-[#CBD5E0] hover:text-[#4F7CFF] p-1 tap-highlight-fix">
                                        <Pencil className="w-3.5 h-3.5" />
                                      </button>
                                      <button onClick={() => handleDelete(tx.id)} disabled={deleting} className="text-[#CBD5E0] hover:text-[#FF6B6B] p-1 disabled:opacity-50 tap-highlight-fix">
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
                    })}
                    {totalPages > 1 && (
                      <div className="p-3 flex items-center justify-center gap-1 border-t border-[#F2F4F7]">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                          className="px-3 py-1.5 rounded-lg bg-[#F2F4F7] text-xs font-semibold text-[#4A5568] hover:bg-[#E2E8F0] disabled:opacity-40 transition-colors tap-highlight-fix">‹</button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                          .reduce((acc, p, idx, arr) => {
                            if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                            acc.push(p);
                            return acc;
                          }, [])
                          .map((p, idx) =>
                            p === '...' ? (
                              <span key={`ellipsis-${idx}`} className="px-1 text-xs text-[#8FA4C8]">…</span>
                            ) : (
                              <button key={p} onClick={() => setPage(p)}
                                className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors tap-highlight-fix ${page === p ? "bg-[#0A0A0A] text-white" : "bg-[#F2F4F7] text-[#4A5568] hover:bg-[#E2E8F0]"}`}>
                                {p}
                              </button>
                            )
                          )}
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                          className="px-3 py-1.5 rounded-lg bg-[#F2F4F7] text-xs font-semibold text-[#4A5568] hover:bg-[#E2E8F0] disabled:opacity-40 transition-colors tap-highlight-fix">›</button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {showAddTx && (
          <AddTransactionModal
            goals={goals}
            onClose={() => setShowAddTx(false)}
            onSave={async (data) => {
              const tempId = `temp_${Date.now()}`;
              setTransactions(prev => [{ ...data, id: tempId, created_date: new Date().toISOString() }, ...prev]);
              setShowAddTx(false);
              try {
                if (!data || !data.amount || data.amount <= 0 || !data.type) throw new Error("Invalid transaction data");
                await base44.entities.Transaction.create(data);
                await base44.functions.invoke("syncTransactionChanges", { action: "create", transaction: data });
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
      </div>
    </PullToRefresh>
  );
}