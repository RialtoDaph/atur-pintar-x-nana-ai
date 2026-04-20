import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { SlidersHorizontal, Search, X, Upload, Plus } from "lucide-react";
import TransactionItem from "@/components/transactions/TransactionItem";
import TransactionDetailSheet from "@/components/transactions/TransactionDetailSheet";
import TxFilterBottomSheet from "@/components/transactions/TxFilterBottomSheet";
import EditTransactionModal from "@/components/transactions/EditTransactionModal";
import CSVImportModal from "@/components/transactions/CSVImportModal";
import AddTransactionModal from "@/components/transactions/AddTransactionModal";
import { useAppSettings } from "@/components/utils/useAppSettings";

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

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
  const [transactions, setTransactions] = useState([]);
  const [globalCategories, setGlobalCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [filters, setFilters] = useState(loadFilters);
  const [search, setSearch] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [editingTx, setEditingTx] = useState(null);
  const [showCSV, setShowCSV] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
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
    const user = await base44.auth.me();
    const [txs, cats, accs] = await Promise.all([
      base44.entities.Transaction.filter({ created_by: user.email, is_deleted: false }, "-date"),
      base44.entities.GlobalCategory.list("sort_order"),
      base44.entities.Account.filter({ created_by: user.email }, "name"),
    ]);
    setTransactions(txs || []);
    setGlobalCategories((cats || []).filter(c => c.is_active !== false));
    setAccounts(accs || []);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  function handleApplyFilters(f) {
    setFilters(f);
    saveFilters(f);
  }

  // Resolve category for a transaction
  function resolveCategory(tx) {
    // Match by ID or by name (for legacy data)
    const cat = globalCategories.find(c => c.id === tx.category || c.name?.toLowerCase() === tx.category?.toLowerCase());
    if (cat) return { emoji: cat.emoji, label: cat.name, color: cat.color };
    // Fallbacks for legacy keys
    const legacyMap = {
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
    if (tx.category && legacyMap[tx.category]) return legacyMap[tx.category];
    if (tx.category?.startsWith("custom_")) {
      const id = tx.category.replace("custom_", "");
      const custom = globalCategories.find(c => c.id === id);
      if (custom) return { emoji: custom.emoji, label: custom.name, color: custom.color };
    }
    return { emoji: "📦", label: tx.category || "Lainnya", color: "#95A5A6" };
  }

  // Filter transactions
  const filtered = transactions.filter(tx => {
    if (!tx.date) return false;
    const d = new Date(tx.date);
    if (d.getMonth() !== filters.month || d.getFullYear() !== filters.year) return false;
    if (filters.type !== "all" && tx.type !== filters.type) return false;
    if (filters.categories?.length > 0 && !filters.categories.includes(tx.category)) return false;
    if (filters.accountId && tx.account_id !== filters.accountId) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const cat = resolveCategory(tx);
      if (!tx.note?.toLowerCase().includes(q) && !cat.label?.toLowerCase().includes(q)) return false;
    }
    return true;
  }).sort((a, b) => {
    const dateCompare = new Date(b.date) - new Date(a.date);
    if (dateCompare !== 0) return dateCompare;
    if (a.time && b.time) return b.time.localeCompare(a.time);
    return 0;
  });

  // Group by date label
  const grouped = [];
  let lastLabel = null;
  const now = new Date();
  const today = now.toLocaleDateString("en-CA");
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("en-CA");
  // Start of this week (Monday)
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Monday
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfWeekStr = startOfWeek.toLocaleDateString("en-CA");

  filtered.forEach(tx => {
    let label;
    if (tx.date === today) label = "Hari ini";
    else if (tx.date === yesterday) label = "Kemarin";
    else if (tx.date >= startOfWeekStr && tx.date < yesterday) label = "Minggu ini";
    else {
      const d = new Date(tx.date);
      label = d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
    }
    if (label !== lastLabel) { grouped.push({ type: "header", label }); lastLabel = label; }
    grouped.push({ type: "tx", tx });
  });

  // Summary
  const totalIncome = filtered.filter(t => t.type === "income").reduce((s, t) => s + (t.amount || 0), 0);
  const totalExpense = filtered.filter(t => t.type === "expense").reduce((s, t) => s + (t.amount || 0), 0);

  async function handleDelete(tx) {
    await base44.entities.Transaction.update(tx.id, { is_deleted: true });
    setTransactions(prev => prev.filter(t => t.id !== tx.id));
    setSelectedTx(null);
    // Reverse account balance
    if (tx.account_id) {
      const acc = accounts.find(a => a.id === tx.account_id);
      if (acc) {
        const newBal = tx.type === "expense" ? (acc.balance || 0) + tx.amount : (acc.balance || 0) - tx.amount;
        await base44.entities.Account.update(tx.account_id, { balance: newBal });
      }
    }
  }

  async function handleSaveEdit(id, data) {
    await base44.entities.Transaction.update(id, data);
    setEditingTx(null);
    fetchData();
  }

  const activeFilterCount = [
    (filters.categories || []).length > 0,
    !!filters.accountId,
    filters.type !== "all",
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#F2F4F7]">
      {/* Header */}
      <div className="bg-[#0A0A0A] px-4 pt-3 pb-3">
        {/* Top row: title + actions */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-white text-base font-bold">Transaksi</p>
            <p className="text-[#8FA4C8] text-xs">{MONTHS[filters.month]} {filters.year}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSearch(s => !s)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white tap-highlight-fix">
              <Search className="w-4 h-4" />
            </button>
            <button onClick={() => setShowCSV(true)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white tap-highlight-fix">
              <Upload className="w-4 h-4" />
            </button>
            <button onClick={() => setShowFilter(true)} className="relative w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white tap-highlight-fix">
              <SlidersHorizontal className="w-4 h-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#F97316] text-white text-[9px] font-bold flex items-center justify-center">{activeFilterCount}</span>
              )}
            </button>
          </div>
        </div>

        {/* Search bar */}
        {showSearch && (
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8FA4C8]" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari transaksi..."
              className="w-full bg-white/10 text-white placeholder-[#8FA4C8] rounded-xl pl-9 pr-9 py-2.5 text-sm focus:outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5 text-[#8FA4C8]" />
              </button>
            )}
          </div>
        )}

        {/* Month summary — 3 equal cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/10 rounded-xl px-2.5 py-2">
            <p className="text-[9px] text-[#8FA4C8] mb-0.5">Masuk</p>
            <p className="text-xs font-bold text-[#4ADE80] truncate">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="bg-white/10 rounded-xl px-2.5 py-2">
            <p className="text-[9px] text-[#8FA4C8] mb-0.5">Keluar</p>
            <p className="text-xs font-bold text-[#F87171] truncate">{formatCurrency(totalExpense)}</p>
          </div>
          <div className="bg-white/10 rounded-xl px-2.5 py-2">
            <p className="text-[9px] text-[#8FA4C8] mb-0.5">Selisih</p>
            <p className={`text-xs font-bold truncate ${totalIncome - totalExpense >= 0 ? "text-[#4ADE80]" : "text-[#F87171]"}`}>
              {formatCurrency(Math.abs(totalIncome - totalExpense))}
            </p>
          </div>
        </div>
      </div>

      {/* Transaction list */}
      <div className="pb-28">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 px-6">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-sm font-semibold text-[#4A5568]">Tidak ada transaksi</p>
            <p className="text-xs text-[#8FA4C8] mt-1">Coba ubah filter atau tambah transaksi baru</p>
            <button onClick={() => setShowAdd(true)} className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-[#F97316] text-white text-sm font-bold rounded-xl mx-auto tap-highlight-fix">
              <Plus className="w-4 h-4" /> Tambah Transaksi
            </button>
          </div>
        ) : (
          <div className="mt-3 mx-3 bg-white rounded-2xl overflow-hidden shadow-sm divide-y divide-[#F2F4F7]">
            {grouped.map((item, idx) => {
              if (item.type === "header") {
                return (
                  <div key={`h-${idx}`} className="px-4 py-2 bg-[#F8FAFC]">
                    <p className="text-[11px] font-bold text-[#8FA4C8] uppercase tracking-wider">{item.label}</p>
                  </div>
                );
              }
              const tx = item.tx;
              const cat = resolveCategory(tx);
              const acc = accounts.find(a => a.id === tx.account_id);
              return (
                <TransactionItem
                  key={tx.id}
                  tx={tx}
                  cat={cat}
                  accountName={acc?.name}
                  formatCurrency={formatCurrency}
                  onTap={() => setSelectedTx(tx)}
                  onEdit={() => setEditingTx(tx)}
                  onDelete={() => handleDelete(tx)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Detail sheet */}
      {selectedTx && (
        <TransactionDetailSheet
          tx={selectedTx}
          cat={resolveCategory(selectedTx)}
          accountName={accounts.find(a => a.id === selectedTx.account_id)?.name}
          formatCurrency={formatCurrency}
          onClose={() => setSelectedTx(null)}
          onEdit={() => { setEditingTx(selectedTx); setSelectedTx(null); }}
          onDelete={() => handleDelete(selectedTx)}
        />
      )}

      {/* Filter sheet */}
      <TxFilterBottomSheet open={showFilter} filters={filters} onApply={handleApplyFilters} onClose={() => setShowFilter(false)} />

      {/* Edit modal */}
      {editingTx && (
        <EditTransactionModal
          transaction={editingTx}
          onClose={() => setEditingTx(null)}
          onSave={handleSaveEdit}
        />
      )}

      {/* CSV Import */}
      {showCSV && <CSVImportModal onClose={() => { setShowCSV(false); fetchData(); }} />}

      {/* Add Transaction */}
      {showAdd && (
        <AddTransactionModal
          onClose={() => setShowAdd(false)}
          onSave={async (data) => {
            await base44.entities.Transaction.create(data);
            setShowAdd(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}