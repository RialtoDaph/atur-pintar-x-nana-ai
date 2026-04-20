import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, Filter, Search, X, SlidersHorizontal } from "lucide-react";
import { useAppSettings } from "@/components/utils/useAppSettings";
import { toast } from "sonner";
import EditTransactionModal from "@/components/transactions/EditTransactionModal";
import CSVImportModal from "@/components/transactions/CSVImportModal";
import RecurringTab from "@/components/transactions/RecurringTab";
import SubscriptionTab from "@/components/transactions/SubscriptionTab";
import PullToRefresh from "@/components/utils/PullToRefresh";
import TxItem from "@/components/transactions/TxItem";
import TxDetailSheet from "@/components/transactions/TxDetailSheet";
import TxFilterSheet from "@/components/transactions/TxFilterSheet";

const PAGE_SIZE = 30;

const SESSION_KEY = "tx_filters_v1";

function getDefaultFilters() {
  try {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { type: "all", month: null, categoryIds: [], accountIds: [] };
}

function getDateLabel(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const diffMs = today - d;
  const diffDays = Math.round(diffMs / 86400000);
  if (diffDays === 0) return "Hari Ini";
  if (diffDays === 1) return "Kemarin";
  if (diffDays <= 6) return "Minggu Ini";
  return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function groupKey(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today - d) / 86400000);
  if (diffDays === 0) return "__today__";
  if (diffDays === 1) return "__yesterday__";
  if (diffDays <= 6) return "__thisweek__";
  return dateStr.slice(0, 10);
}

export default function Transactions() {
  const { formatCurrency, t, settings } = useAppSettings();

  const [transactions, setTransactions] = useState([]);
  const [globalCategories, setGlobalCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [user, setUser] = useState(null);

  const [filters, setFilters] = useState(getDefaultFilters);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [detailTx, setDetailTx] = useState(null);
  const [mainTab, setMainTab] = useState("history");

  const searchRef = useRef(null);
  const bottomRef = useRef(null);

  // Persist filters
  useEffect(() => {
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(filters)); } catch {}
  }, [filters]);

  useEffect(() => {
    base44.auth.me().then(u => setUser(u)).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

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

  useEffect(() => {
    if (!user?.email) return;
    base44.entities.Account.filter({ created_by: user.email }, "name").then(res => {
      setAccounts(res || []);
    }).catch(() => {});
  }, [user?.email]);

  // Infinite scroll observer
  useEffect(() => {
    if (!bottomRef.current) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loadingMore && hasMore) {
        setVisibleCount(c => c + PAGE_SIZE);
      }
    }, { threshold: 0.1 });
    obs.observe(bottomRef.current);
    return () => obs.disconnect();
  }, [loadingMore, hasMore]);

  // Focus search when opened
  useEffect(() => {
    if (showSearch) setTimeout(() => searchRef.current?.focus(), 100);
  }, [showSearch]);

  async function loadData() {
    setLoading(true);
    try {
      const txs = await base44.entities.Transaction.filter({ created_by: user.email }, "-date", 500);
      setTransactions(txs || []);
    } catch {
      toast.error("Gagal memuat transaksi");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Hapus transaksi ini?")) return;
    setTransactions(prev => prev.filter(tx => tx.id !== id));
    try {
      await base44.entities.Transaction.update(id, { is_deleted: true });
      await base44.functions.invoke("syncTransactionChanges", { action: "delete", oldTransaction: transactions.find(tx => tx.id === id) });
      toast.success("Transaksi dihapus");
    } catch {
      toast.error("Gagal menghapus");
      loadData();
    }
  }

  async function handleEdit(id, data) {
    const oldTx = transactions.find(tx => tx.id === id);
    setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, ...data } : tx));
    try {
      await base44.entities.Transaction.update(id, data);
      await base44.functions.invoke("syncTransactionChanges", { action: "update", transaction: data, oldTransaction: oldTx });
      toast.success("Transaksi diperbarui");
      setEditingTx(null);
    } catch {
      toast.error("Gagal memperbarui");
      loadData();
    }
  }

  const getCategoryConfig = useCallback((key) => {
    // Try by ID first (GlobalCategory)
    const byId = globalCategories.find(c => c.id === key);
    if (byId) return { id: byId.id, emoji: byId.emoji, name: byId.name, label: byId.name, color: byId.color || "#F97316" };
    // Fallback: match by name or key
    const byName = globalCategories.find(c => c.name?.toLowerCase() === key?.toLowerCase());
    if (byName) return { id: byName.id, emoji: byName.emoji, name: byName.name, label: byName.name, color: byName.color || "#F97316" };
    return { emoji: "📦", name: key || "Lainnya", label: key || "Lainnya", color: "#95A5A6" };
  }, [globalCategories]);

  const getAccountName = useCallback((accountId) => {
    const acc = accounts.find(a => a.id === accountId);
    return acc ? `${acc.icon || "💳"} ${acc.name}` : null;
  }, [accounts]);

  // Filter logic
  const filtered = useMemo(() => {
    let result = transactions.filter(tx => tx.is_deleted !== true);

    // Hide recurring parent if child exists this month
    const now = new Date();
    const currentMonthChildParentIds = new Set(
      result
        .filter(tx => tx.is_recurring_child && (() => {
          const d = new Date(tx.date);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })())
        .map(tx => tx.recurring_parent_id).filter(Boolean)
    );
    result = result.filter(tx => {
      if (tx.is_recurring && !tx.is_recurring_child) return !currentMonthChildParentIds.has(tx.id);
      return true;
    });

    // Type filter
    if (filters.type && filters.type !== "all") {
      result = result.filter(tx => tx.type === filters.type);
    }

    // Month filter
    if (filters.month) {
      result = result.filter(tx => tx.date && tx.date.startsWith(filters.month));
    }

    // Category filter
    if ((filters.categoryIds || []).length > 0) {
      result = result.filter(tx => filters.categoryIds.includes(tx.category));
    }

    // Account filter
    if ((filters.accountIds || []).length > 0) {
      result = result.filter(tx => filters.accountIds.includes(tx.account_id));
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(tx =>
        (tx.note || "").toLowerCase().includes(q) ||
        String(tx.amount).includes(q) ||
        getCategoryConfig(tx.category).name.toLowerCase().includes(q)
      );
    }

    return result;
  }, [transactions, filters, searchQuery, globalCategories]);

  // Monthly summary (current month, no filters)
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const { summaryIncome, summaryExpense } = useMemo(() => {
    const monthTxs = transactions.filter(tx => tx.is_deleted !== true && tx.date?.startsWith(currentMonth));
    return {
      summaryIncome: monthTxs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0),
      summaryExpense: monthTxs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    };
  }, [transactions, currentMonth]);

  const visibleFiltered = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  // Group by date
  const { groups, sortedGroupKeys } = useMemo(() => {
    const g = {};
    visibleFiltered.forEach(tx => {
      const key = groupKey(tx.date);
      if (!g[key]) g[key] = { label: getDateLabel(tx.date), rawDate: tx.date, items: [] };
      g[key].items.push(tx);
    });
    // Sort groups: today first, then yesterday, then thisweek, then by date desc
    const order = { "__today__": 0, "__yesterday__": 1, "__thisweek__": 2 };
    const sorted = Object.keys(g).sort((a, b) => {
      const oa = order[a] !== undefined ? order[a] : 100;
      const ob = order[b] !== undefined ? order[b] : 100;
      if (oa !== ob) return oa - ob;
      return b.localeCompare(a);
    });
    return { groups: g, sortedGroupKeys: sorted };
  }, [visibleFiltered]);

  const activeFilterCount = [
    filters.month,
    filters.type && filters.type !== "all",
    (filters.categoryIds || []).length > 0,
    (filters.accountIds || []).length > 0,
  ].filter(Boolean).length;

  const isSearchEmpty = searchQuery.trim() && filtered.length === 0;
  const isEmpty = !loading && !searchQuery.trim() && filtered.length === 0;

  return (
    <PullToRefresh onRefresh={loadData}>
      <div className="min-h-screen pb-24 bg-[#0F1114]">

        {/* Header */}
        <div className="sticky top-0 z-30 bg-[#0A0A0A]">
          {/* Top bar */}
          <div className="px-5 pt-4 pb-3 flex items-center justify-between">
            {/* Filter icon with badge */}
            <button
              onClick={() => setShowFilterSheet(true)}
              className="relative w-9 h-9 rounded-xl flex items-center justify-center tap-highlight-fix"
              style={{ backgroundColor: activeFilterCount > 0 ? "#F97316" : "rgba(255,255,255,0.08)" }}
            >
              <SlidersHorizontal className="w-4 h-4 text-white" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white text-[#F97316] text-[9px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <h1 className="text-white text-base font-bold">Transaksi</h1>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSearch(s => !s)}
                className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center tap-highlight-fix"
                style={{ backgroundColor: showSearch ? "#F97316" : "rgba(255,255,255,0.08)" }}
              >
                <Search className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={() => setShowCSVImport(true)}
                className="w-9 h-9 rounded-xl flex items-center justify-center tap-highlight-fix"
                style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
              >
                <Upload className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Search bar */}
          {showSearch && (
            <div className="px-4 pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  ref={searchRef}
                  type="search"
                  placeholder="Cari catatan atau nominal..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[#F97316] tap-highlight-fix"
                  style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 tap-highlight-fix"
                  >
                    <X className="w-4 h-4 text-white/40" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Main tabs */}
          <div className="flex border-b border-white/10">
            {[["history", "Riwayat"], ["recurring", "Rutin"], ["subscription", "Langganan"]].map(([key, label]) => (
              <button key={key} onClick={() => setMainTab(key)}
                className={`flex-1 py-3 text-xs font-semibold transition-all border-b-2 tap-highlight-fix ${mainTab === key ? "text-[#F97316] border-[#F97316]" : "text-white/40 border-transparent"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="max-w-2xl mx-auto px-4 pt-4">
          {mainTab === "recurring" && <RecurringTab user={user} globalCategories={globalCategories} />}
          {mainTab === "subscription" && <SubscriptionTab user={user} />}

          {mainTab === "history" && (
            <div className="space-y-3">

              {/* Filter pills */}
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {[["all", "Semua"], ["income", "Pemasukan"], ["expense", "Pengeluaran"]].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setFilters(f => ({ ...f, type: key }))}
                    className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all tap-highlight-fix"
                    style={{
                      backgroundColor: filters.type === key || (!filters.type && key === "all") ? "#F97316" : "transparent",
                      borderColor: filters.type === key || (!filters.type && key === "all") ? "#F97316" : "rgba(255,255,255,0.2)",
                      color: filters.type === key || (!filters.type && key === "all") ? "white" : "rgba(255,255,255,0.5)"
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Monthly summary */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-2xl p-3" style={{ backgroundColor: "rgba(34,197,94,0.1)" }}>
                  <p className="text-[10px] font-medium mb-1" style={{ color: "#22C55E" }}>Pemasukan Bulan Ini</p>
                  <p className="text-sm font-bold" style={{ color: "#22C55E" }}>+{formatCurrency(summaryIncome)}</p>
                </div>
                <div className="rounded-2xl p-3" style={{ backgroundColor: "rgba(239,68,68,0.1)" }}>
                  <p className="text-[10px] font-medium mb-1" style={{ color: "#EF4444" }}>Pengeluaran Bulan Ini</p>
                  <p className="text-sm font-bold" style={{ color: "#EF4444" }}>−{formatCurrency(summaryExpense)}</p>
                </div>
              </div>

              {/* Transaction list */}
              {loading ? (
                <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#262C35" }}>
                  <div className="p-4 space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full animate-pulse" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 rounded-full animate-pulse w-3/4" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />
                          <div className="h-2.5 rounded-full animate-pulse w-1/2" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />
                        </div>
                        <div className="h-3 rounded-full animate-pulse w-16" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : isEmpty ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-5xl mb-4">📭</p>
                  <p className="text-white font-semibold text-sm mb-1">Belum ada transaksi</p>
                  <p className="text-white/40 text-xs">Tambahkan transaksi pertama kamu</p>
                </div>
              ) : isSearchEmpty ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-5xl mb-4">🔍</p>
                  <p className="text-white font-semibold text-sm mb-1">Transaksi tidak ditemukan</p>
                  <p className="text-white/40 text-xs">Coba kata kunci lain</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedGroupKeys.map(key => {
                    const group = groups[key];
                    const groupIncome = group.items.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
                    const groupExpense = group.items.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

                    return (
                      <div key={key}>
                        {/* Group header */}
                        <div className="flex items-center justify-between px-1 mb-1.5">
                          <p className="text-[11px] font-semibold text-white/40">{group.label}</p>
                          <div className="flex gap-2 text-[11px]">
                            {groupIncome > 0 && <span style={{ color: "#22C55E" }}>+{formatCurrency(groupIncome)}</span>}
                            {groupExpense > 0 && <span style={{ color: "#EF4444" }}>−{formatCurrency(groupExpense)}</span>}
                          </div>
                        </div>

                        {/* Items */}
                        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#262C35" }}>
                          {group.items
                            .sort((a, b) => {
                              const dateCmp = new Date(b.date) - new Date(a.date);
                              if (dateCmp !== 0) return dateCmp;
                              if (a.time && b.time) return b.time.localeCompare(a.time);
                              return 0;
                            })
                            .map((tx, idx) => (
                              <div key={tx.id}>
                                {idx > 0 && <div className="mx-4" style={{ height: 1, backgroundColor: "rgba(255,255,255,0.05)" }} />}
                                <TxItem
                                  tx={tx}
                                  cat={getCategoryConfig(tx.category)}
                                  accountName={getAccountName(tx.account_id)}
                                  onEdit={() => setEditingTx(tx)}
                                  onDelete={() => handleDelete(tx.id)}
                                  onTap={() => setDetailTx(tx)}
                                  formatCurrency={formatCurrency}
                                />
                              </div>
                            ))}
                        </div>
                      </div>
                    );
                  })}

                  {/* Load more trigger */}
                  {visibleCount < filtered.length && (
                    <div ref={bottomRef} className="py-4 flex justify-center">
                      <div className="w-6 h-6 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}

                  {/* Count info */}
                  {!loading && filtered.length > 0 && (
                    <p className="text-center text-[11px] text-white/30 pb-2">
                      {Math.min(visibleCount, filtered.length)} dari {filtered.length} transaksi
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modals */}
        {editingTx && (
          <EditTransactionModal
            transaction={editingTx}
            goals={[]}
            onClose={() => setEditingTx(null)}
            onSave={handleEdit}
          />
        )}

        {showCSVImport && (
          <CSVImportModal onClose={() => setShowCSVImport(false)} onSuccess={loadData} />
        )}

        <TxFilterSheet
          open={showFilterSheet}
          onClose={() => setShowFilterSheet(false)}
          filters={filters}
          onApply={setFilters}
          onReset={() => setFilters({ type: "all", month: null, categoryIds: [], accountIds: [] })}
        />

        {detailTx && (
          <TxDetailSheet
            tx={detailTx}
            cat={getCategoryConfig(detailTx.category)}
            accountName={getAccountName(detailTx.account_id)}
            onClose={() => setDetailTx(null)}
            onEdit={() => { setDetailTx(null); setEditingTx(detailTx); }}
            onDelete={() => { setDetailTx(null); handleDelete(detailTx.id); }}
            formatCurrency={formatCurrency}
          />
        )}
      </div>
    </PullToRefresh>
  );
}