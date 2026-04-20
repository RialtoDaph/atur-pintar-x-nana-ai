import { useState, useEffect, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, Filter, Search, CheckSquare } from "lucide-react";
import { useAppSettings } from "@/components/utils/useAppSettings";
import { toast } from "sonner";
import AddTransactionModal from "@/components/transactions/AddTransactionModal";
import EditTransactionModal from "@/components/transactions/EditTransactionModal";
import CSVImportModal from "@/components/transactions/CSVImportModal";
import RecurringTab from "@/components/transactions/RecurringTab";
import SubscriptionTab from "@/components/transactions/SubscriptionTab";
import PullToRefresh from "@/components/utils/PullToRefresh";
import DashboardInsights from "@/components/dashboard/DashboardInsights";
import ReminderWidget from "@/components/reminders/ReminderWidget";
import { DEFAULT_CATEGORIES } from "@/components/utils/categoryConfig";
import TransactionItem from "@/components/transactions/TransactionItem";
import TransactionFilterSheet from "@/components/transactions/TransactionFilterSheet";

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
  const [visibleCount, setVisibleCount] = useState(30);
  const [mainTab, setMainTab] = useState("history");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [globalCategories, setGlobalCategories] = useState([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  useEffect(() => {
    let isMounted = true;
    base44.auth.me().then(u => { if (isMounted) setUser(u); }).catch(() => {});
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
    const todayStr = new Date().toLocaleDateString("en-CA");
    const now = new Date();
    if (preset === "today") { setDateFrom(todayStr); setDateTo(todayStr); }
    else if (preset === "7d") {
      const d = new Date(); d.setDate(d.getDate() - 7);
      setDateFrom(d.toLocaleDateString("en-CA")); setDateTo(todayStr);
    } else if (preset === "month") {
      setDateFrom(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`);
      setDateTo(todayStr);
    } else if (preset === "lastmonth") {
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lmEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      setDateFrom(lm.toLocaleDateString("en-CA")); setDateTo(lmEnd.toLocaleDateString("en-CA"));
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
    } catch {
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
    } catch {
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
    } catch {
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

  async function handleDeleteSelected() {
    if (selectedIds.size === 0) return;
    if (!confirm(t('tx_confirm_delete_selected', { count: selectedIds.size }))) return;
    setDeleting(true);
    try {
      await Promise.all([...selectedIds].map(id => base44.entities.Transaction.delete(id)));
      toast.success(t('tx_delete_success'));
      setSelectedIds(new Set()); setSelectMode(false);
      loadData();
    } catch {
      toast.error(t('tx_delete_error'));
      setDeleting(false);
    }
  }

  const getCategoryConfig = useCallback((key) => {
    if (key && key.startsWith('custom_')) {
      const cat = customCategories.find(c => c.id === key.substring(7));
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
        .filter(tx => tx.is_recurring_child && (() => {
          const d = new Date(tx.date);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })())
        .map(tx => tx.recurring_parent_id).filter(Boolean)
    );
    let result = transactions.filter(tx => {
      if (tx.is_recurring && !tx.is_recurring_child) return !currentMonthChildParentIds.has(tx.id);
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

  useEffect(() => { setVisibleCount(30); }, [filter, goalFilter, searchQuery, dateFrom, dateTo, categoryFilter]);

  const visibleFiltered = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  const { grouped, sortedGroups } = useMemo(() => {
    const g = {};
    visibleFiltered.forEach(tx => {
      const d = new Date(tx.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString(locale, { month: "long", year: "numeric" });
      if (!g[key]) g[key] = { label, items: [] };
      g[key].items.push(tx);
    });
    return { grouped: g, sortedGroups: Object.keys(g).sort((a, b) => b.localeCompare(a)) };
  }, [visibleFiltered, locale]);

  // Summary strip values
  const summaryIncome = useMemo(() => filtered.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0), [filtered]);
  const summaryExpense = useMemo(() => filtered.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0), [filtered]);

  return (
    <PullToRefresh onRefresh={loadData}>
      <div className="min-h-screen bg-[#F2F4F7] pb-24">

        {/* Header */}
        <div className="bg-[#0A0A0A] px-5 pt-10 pb-0">
          <div className="max-w-2xl mx-auto flex items-center justify-between mb-5">
            <h1 className="text-white text-xl font-bold">Transaksi</h1>
            <button
              onClick={() => setShowCSVImport(true)}
              className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center tap-highlight-fix"
            >
              <Upload className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Main tabs */}
          <div className="max-w-2xl mx-auto flex">
            {[["history", "Riwayat"], ["recurring", "Rutin"], ["subscription", "Langganan"]].map(([key, label]) => (
              <button key={key} onClick={() => setMainTab(key)}
                className={`flex-1 py-3 text-xs font-semibold transition-all border-b-2 ${mainTab === key ? "text-[#F97316] border-[#F97316]" : "text-[#666] border-transparent"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 pt-4">
          {mainTab === "recurring" && <RecurringTab user={user} globalCategories={globalCategories} />}
          {mainTab === "subscription" && <SubscriptionTab user={user} />}

          {mainTab === "history" && (
            <div className="space-y-3">
              {user && <ReminderWidget user={user} />}

              {/* Search + Filter */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8FA4C8]" />
                  <input type="search" placeholder="Cari transaksi..." value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full border border-[#E2E8F0] rounded-xl pl-8 pr-3 py-2.5 text-xs text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#F97316] bg-white tap-highlight-fix" />
                </div>
                <button
                  onClick={() => setShowFilterPanel(v => !v)}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold tap-highlight-fix transition-colors flex-shrink-0 ${hasActiveFilter ? "bg-[#F97316] text-white" : "bg-white text-[#4A5568] border border-[#E2E8F0]"}`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  {hasActiveFilter ? "Aktif" : "Filter"}
                </button>
              </div>

              {/* Type filter tabs */}
              <div className="flex bg-white rounded-xl p-1 border border-[#F0F2F5]" role="tablist">
                {FILTER_TABS.map(tab => (
                  <button key={tab.key} role="tab" aria-selected={filter === tab.key}
                    onClick={() => setFilter(tab.key)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all tap-highlight-fix ${filter === tab.key ? "bg-[#F97316] text-white shadow-sm" : "text-[#8FA4C8]"}`}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Summary strip — only when filtered */}
              {!loading && filtered.length > 0 && (hasActiveFilter || searchQuery || filter !== "all") && (
                <div className="flex gap-2">
                  {summaryIncome > 0 && (
                    <div className="flex-1 bg-[#F0FDF4] rounded-xl px-3 py-2 text-center">
                      <p className="text-[10px] text-[#16A34A] font-medium">Masuk</p>
                      <p className="text-xs font-bold text-[#16A34A]">+{formatCurrency(summaryIncome)}</p>
                    </div>
                  )}
                  {summaryExpense > 0 && (
                    <div className="flex-1 bg-[#FEF2F2] rounded-xl px-3 py-2 text-center">
                      <p className="text-[10px] text-[#EF4444] font-medium">Keluar</p>
                      <p className="text-xs font-bold text-[#EF4444]">−{formatCurrency(summaryExpense)}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Transaction list */}
              <div data-tour="tx-history-card" className="bg-white rounded-2xl overflow-hidden border border-[#F0F2F5]">
                {/* Select mode toggle — only show if there are transactions */}
                {!loading && filtered.length > 0 && (
                  <div className="flex justify-end px-4 pt-3 pb-1">
                    <button
                      onClick={() => { setSelectMode(s => !s); setSelectedIds(new Set()); }}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors tap-highlight-fix ${selectMode ? "bg-[#F97316] text-white" : "text-[#8FA4C8]"}`}
                    >
                      {selectMode ? "Batal" : "Pilih"}
                    </button>
                  </div>
                )}

                {loading ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#F2F4F7] animate-pulse flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-[#F2F4F7] rounded-full animate-pulse w-3/4" />
                          <div className="h-2.5 bg-[#F2F4F7] rounded-full animate-pulse w-1/2" />
                        </div>
                        <div className="h-3 bg-[#F2F4F7] rounded-full animate-pulse w-16" />
                      </div>
                    ))}
                  </div>
                ) : sortedGroups.length === 0 ? (
                  <div className="p-10 text-center">
                    <p className="text-4xl mb-3">📭</p>
                    <p className="text-[#1A1A1A] font-semibold text-sm mb-1">{t('tx_empty_title')}</p>
                    <p className="text-[#8FA4C8] text-xs">{t('tx_empty_desc')}</p>
                  </div>
                ) : (
                  <>
                    {sortedGroups.map(key => {
                      const group = grouped[key];
                      const monthIncome = group.items.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
                      const monthExpense = group.items.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
                      return (
                        <div key={key}>
                          <div className="px-4 py-2 bg-[#F8FAFC] border-y border-[#F2F4F7] flex items-center justify-between">
                            <p className="text-xs font-bold text-[#1A1A1A]">{group.label}</p>
                            <div className="flex gap-2 text-[11px]">
                              {monthIncome > 0 && <span className="text-[#22C55E] font-semibold">+{formatCurrency(monthIncome)}</span>}
                              {monthExpense > 0 && <span className="text-[#EF4444] font-semibold">−{formatCurrency(monthExpense)}</span>}
                            </div>
                          </div>
                          {group.items.sort((a, b) => new Date(b.date) - new Date(a.date)).map(tx => {
                            const cat = getCategoryConfig(tx.category);
                            const linkedGoal = goals.find(g => g.id === tx.goal_id);
                            return (
                              <TransactionItem
                                key={tx.id}
                                tx={tx}
                                cat={cat}
                                linkedGoal={linkedGoal}
                                selectMode={selectMode}
                                selected={selectedIds.has(tx.id)}
                                onSelect={() => toggleSelect(tx.id)}
                                onEdit={() => setEditingTx(tx)}
                                onDelete={() => handleDelete(tx.id)}
                                formatCurrency={formatCurrency}
                                locale={locale}
                              />
                            );
                          })}
                        </div>
                      );
                    })}

                    {visibleCount < filtered.length && (
                      <div className="p-4 border-t border-[#F2F4F7]">
                        <button
                          onClick={() => setVisibleCount(c => c + 30)}
                          className="w-full py-3 rounded-xl bg-[#F2F4F7] text-sm font-semibold text-[#4A5568] transition-colors tap-highlight-fix"
                        >
                          Muat lebih ({filtered.length - visibleCount} lagi)
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sticky select action bar */}
        {selectMode && (
          <div className="fixed bottom-20 left-0 right-0 z-50 px-4">
            <div className="max-w-2xl mx-auto">
              <div className="bg-[#0A0A0A] rounded-2xl p-3 flex items-center gap-2 shadow-2xl">
                <button
                  onClick={() => setSelectedIds(new Set(visibleFiltered.map(t => t.id)))}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold tap-highlight-fix flex-shrink-0"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  Semua
                </button>
                <p className="text-white/60 text-xs flex-1 text-center">
                  {selectedIds.size > 0 ? `${selectedIds.size} dipilih` : "Ketuk untuk pilih"}
                </p>
                {selectedIds.size > 0 && (
                  <button
                    onClick={handleDeleteSelected}
                    disabled={deleting}
                    className="px-4 py-2 rounded-xl bg-[#FF6B6B] text-white text-xs font-bold disabled:opacity-50 tap-highlight-fix flex-shrink-0"
                  >
                    {deleting ? "Menghapus..." : `Hapus (${selectedIds.size})`}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {showAddTx && (
          <AddTransactionModal goals={goals} onClose={() => setShowAddTx(false)}
            onSave={async (data) => {
              setShowAddTx(false);
              try {
                await base44.entities.Transaction.create(data);
                loadData();
              } catch {
                toast.error(t('tx_create_error'));
              }
            }}
          />
        )}

        {editingTx && (
          <EditTransactionModal transaction={editingTx} goals={goals}
            onClose={() => setEditingTx(null)} onSave={handleEdit} />
        )}

        {showCSVImport && (
          <CSVImportModal onClose={() => setShowCSVImport(false)} onSuccess={loadData} />
        )}

        <TransactionFilterSheet
          open={showFilterPanel}
          onClose={() => setShowFilterPanel(false)}
          dateFrom={dateFrom}
          dateTo={dateTo}
          setDateFrom={setDateFrom}
          setDateTo={setDateTo}
          onApplyPreset={applyPreset}
          hasActiveFilter={hasActiveFilter}
          onReset={() => { setDateFrom(""); setDateTo(""); setCategoryFilter(""); }}
        />
      </div>
    </PullToRefresh>
  );
}