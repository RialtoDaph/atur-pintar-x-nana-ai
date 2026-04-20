import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { SlidersHorizontal, Search, X, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppSettings } from "@/components/utils/useAppSettings";
import SpendingBar from "@/components/transactions/SpendingBar";
import TxRiwayatTab from "@/components/transactions/TxRiwayatTab";
import TxRutinTab from "@/components/transactions/TxRutinTab";
import TxLanggananTab from "@/components/transactions/TxLanggananTab";
import TxFilterBottomSheet from "@/components/transactions/TxFilterBottomSheet";
import CSVImportModal from "@/components/transactions/CSVImportModal";

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

const TABS = [
  { key: "riwayat", label: "Riwayat", icon: "📋" },
  { key: "rutin", label: "Rutin", icon: "🔁" },
  { key: "langganan", label: "Langganan", icon: "💳" },
];

function getDefaultFilters() {
  const now = new Date();
  return { month: now.getMonth(), year: now.getFullYear(), type: "all", categories: [], accountId: "" };
}

function loadFilters() {
  try {
    const saved = sessionStorage.getItem("tx_filters");
    return saved ? JSON.parse(saved) : getDefaultFilters();
  } catch { return getDefaultFilters(); }
}

function saveFilters(f) {
  try { sessionStorage.setItem("tx_filters", JSON.stringify(f)); } catch {}
}

export default function Transactions() {
  const { settings } = useAppSettings();
  const [activeTab, setActiveTab] = useState("riwayat");
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [debts, setDebts] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [filters, setFilters] = useState(loadFilters);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [showCSV, setShowCSV] = useState(false);
  const [loading, setLoading] = useState(true);

  const formatCurrency = useCallback((amount) => {
    const sym = settings?.currency_symbol || "Rp";
    const thou = settings?.thousand_separator || ".";
    const num = Math.abs(Math.round(amount || 0));
    const formatted = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, thou);
    return `${sym}${formatted}`;
  }, [settings]);

  async function fetchData() {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      const [txs, cats, accs] = await Promise.all([
        base44.entities.Transaction.filter({ created_by: user.email, is_deleted: false }, "-date"),
        base44.entities.GlobalCategory.list("sort_order"),
        base44.entities.Account.filter({ created_by: user.email }, "name"),
      ]);
      setTransactions(txs || []);
      setCategories((cats || []).filter(c => c.is_active !== false));
      setAccounts(accs || []);

      // Fetch debts and subscriptions separately (can fail silently)
      const [dts, subs] = await Promise.all([
        base44.entities.Debt.filter({ created_by: user.email }).catch(() => []),
        base44.entities.Subscription.filter({ created_by: user.email }).catch(() => []),
      ]);
      setDebts((dts || []).filter(d => d.status === "active"));
      setSubscriptions((subs || []).filter(s => s.status !== "cancelled").sort((a, b) => {
        if (!a.next_due_date) return 1;
        if (!b.next_due_date) return -1;
        return new Date(a.next_due_date) - new Date(b.next_due_date);
      }));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  // Filtered transactions for Riwayat tab
  const filtered = transactions.filter(tx => {
    if (!tx.date) return false;
    const d = new Date(tx.date);
    if (d.getMonth() !== filters.month || d.getFullYear() !== filters.year) return false;
    if (filters.type !== "all" && tx.type !== filters.type) return false;
    if (filters.categories?.length > 0 && !filters.categories.includes(tx.category)) return false;
    if (filters.accountId && tx.account_id !== filters.accountId) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!tx.note?.toLowerCase().includes(q)) return false;
    }
    return true;
  }).sort((a, b) => {
    const dc = new Date(b.date) - new Date(a.date);
    if (dc !== 0) return dc;
    if (a.time && b.time) return b.time.localeCompare(a.time);
    return 0;
  });

  // Recurring transactions for Rutin tab
  const recurringTxs = transactions.filter(tx => tx.is_recurring && !tx.is_recurring_child);

  // Spending data for SpendingBar (current month expenses)
  const monthExpenses = transactions.filter(tx => {
    if (!tx.date || tx.type !== "expense") return false;
    const d = new Date(tx.date);
    return d.getMonth() === filters.month && d.getFullYear() === filters.year;
  });

  const activeFilterCount = [
    (filters.categories || []).length > 0,
    !!filters.accountId,
    filters.type !== "all",
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#F2F4F7]">
      {/* ===== HEADER ===== */}
      <div className="bg-[#0A0A0A] px-4 pt-3 pb-0">
        {/* Top row */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-white text-base font-bold">Transaksi</p>
            <p className="text-[#8FA4C8] text-xs">{MONTHS[filters.month]} {filters.year}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearch(s => !s)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors tap-highlight-fix ${showSearch ? "bg-[#F97316]" : "bg-white/10"} text-white`}
            >
              <Search className="w-4 h-4" />
            </button>
            <button onClick={() => setShowCSV(true)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white tap-highlight-fix">
              <Upload className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowFilter(true)}
              className="relative w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white tap-highlight-fix"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#F97316] text-white text-[9px] font-bold flex items-center justify-center">{activeFilterCount}</span>
              )}
            </button>
          </div>
        </div>

        {/* Search bar — animated slide down */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8FA4C8]" />
                <input
                  autoFocus
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Cari berdasarkan catatan..."
                  className="w-full bg-white/10 text-white placeholder-[#8FA4C8] rounded-xl pl-9 pr-9 py-2.5 text-sm focus:outline-none"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 tap-highlight-fix">
                    <X className="w-3.5 h-3.5 text-[#8FA4C8]" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Spending bar — only on Riwayat tab */}
        {activeTab === "riwayat" && monthExpenses.length > 0 && (
          <SpendingBar transactions={monthExpenses} categories={categories} />
        )}

        {/* Tabs */}
        <div className="flex mt-3">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors tap-highlight-fix border-b-2 ${
                activeTab === tab.key
                  ? "text-[#F97316] border-[#F97316]"
                  : "text-[#8FA4C8] border-transparent"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ===== TAB CONTENT ===== */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : activeTab === "riwayat" ? (
            <TxRiwayatTab
              transactions={filtered}
              categories={categories}
              accounts={accounts}
              formatCurrency={formatCurrency}
              onRefresh={fetchData}
            />
          ) : activeTab === "rutin" ? (
            <TxRutinTab
              debts={debts}
              recurringTxs={recurringTxs}
              categories={categories}
              formatCurrency={formatCurrency}
            />
          ) : (
            <TxLanggananTab
              subscriptions={subscriptions}
              formatCurrency={formatCurrency}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Filter sheet */}
      <TxFilterBottomSheet
        open={showFilter}
        filters={filters}
        onApply={f => { setFilters(f); saveFilters(f); }}
        onClose={() => setShowFilter(false)}
      />

      {/* CSV Import */}
      {showCSV && <CSVImportModal onClose={() => { setShowCSV(false); fetchData(); }} />}
    </div>
  );
}