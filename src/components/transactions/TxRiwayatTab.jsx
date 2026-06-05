import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import TxDetailSheet from "./TxDetailSheet";
import EditTransactionModal from "./EditTransactionModal";
import { syncAccountBalance } from "@/components/utils/accountSync";
import { recalcGoalAmount } from "@/components/utils/recalcGoalAmount";

const SUB_TABS = [
  { key: "all", label: "Semua" },
  { key: "income", label: "↑ Masuk" },
  { key: "expense", label: "↓ Keluar" },
];

const DAYS_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTHS_ID = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function formatDateHeader(dateStr) {
  const d = new Date(dateStr);
  return `${DAYS_ID[d.getDay()]}, ${d.getDate()} ${MONTHS_ID[d.getMonth()]}`.toUpperCase();
}

function resolveCategory(tx, categories, goals = []) {
  // Savings tx linked to a goal → use the goal's own icon + name as the badge
  if (tx.type === "savings" && tx.goal_id) {
    const g = goals.find(x => x.id === tx.goal_id);
    if (g) return { emoji: g.icon || "🐷", label: g.name || "Tabungan", color: "#3B82F6" };
  }
  const cat = categories.find(c => c.id === tx.category || c.name?.toLowerCase() === tx.category?.toLowerCase());
  if (cat) return { emoji: cat.emoji, label: cat.name, color: cat.color };
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
    const custom = categories.find(c => c.id === id);
    if (custom) return { emoji: custom.emoji, label: custom.name, color: custom.color };
  }
  // Fallback by type — transactions created from Goals page don't set `category`,
  // so a savings tx would otherwise show "Lainnya". Map by type so the badge
  // reads "Tabungan" 🐷 instead.
  if (!tx.category) {
    if (tx.type === "savings") return { emoji: "🐷", label: "Tabungan", color: "#3B82F6" };
    if (tx.type === "income")  return { emoji: "💼", label: "Pemasukan", color: "#27AE60" };
  }
  return { emoji: "📦", label: tx.category || "Lainnya", color: "#95A5A6" };
}

function SwipeItem({ tx, cat, accountName, formatCurrency, onTap, onDelete }) {
  const [swipeX, setSwipeX] = useState(0);
  const startX = useRef(null);
  const startY = useRef(null);
  const isScrolling = useRef(false);
  const REVEAL_WIDTH = 72;

  const isIncome = tx.type === "income";
  const amountColor = isIncome ? "#4ADE80" : tx.type === "savings" ? "#60A5FA" : "#F87171";
  const amountPrefix = isIncome ? "+" : "−";
  const dotColor = isIncome ? "#4ADE80" : "#F87171";

  function onTouchStart(e) {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isScrolling.current = false;
  }
  function onTouchMove(e) {
    if (startX.current === null) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;
    if (!isScrolling.current && Math.abs(dy) > Math.abs(dx)) { isScrolling.current = true; return; }
    if (isScrolling.current) return;
    if (dx < 0) { e.preventDefault(); setSwipeX(Math.max(dx, -REVEAL_WIDTH)); }
    else if (swipeX < 0) { e.preventDefault(); setSwipeX(Math.min(0, swipeX + dx)); }
  }
  function onTouchEnd() {
    if (isScrolling.current) { startX.current = null; return; }
    setSwipeX(swipeX < -REVEAL_WIDTH / 2 ? -REVEAL_WIDTH : 0);
    startX.current = null;
  }

  return (
    <div className="relative overflow-hidden">
      {/* Delete button */}
      <div className="absolute right-0 top-0 bottom-0 flex" style={{ width: REVEAL_WIDTH }}>
        <button
          onClick={() => { setSwipeX(0); onDelete(tx); }}
          className="w-full h-full flex flex-col items-center justify-center bg-[#EF4444] gap-0.5 tap-highlight-fix"
        >
          <span className="text-lg">🗑️</span>
          <span className="text-white text-[10px] font-semibold">Hapus</span>
        </button>
      </div>
      {/* Main row */}
      <div
        className="flex items-center gap-3 px-4 py-3 bg-white cursor-pointer active:bg-[#F8FAFC] tap-highlight-fix"
        style={{ transform: `translateX(${swipeX}px)`, transition: swipeX === 0 || swipeX === -REVEAL_WIDTH ? "transform 0.2s ease" : "none" }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={() => { if (swipeX !== 0) { setSwipeX(0); return; } onTap(tx); }}
      >
        {/* Category icon with dot */}
        <div className="relative flex-shrink-0">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
            style={{ backgroundColor: (cat?.color || "#888") + "20" }}
          >
            {cat?.emoji || "📦"}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white" style={{ backgroundColor: dotColor }} />
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#1A1A1A] truncate">{tx.note || cat?.label || "-"}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {cat && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ backgroundColor: (cat.color || "#888") + "20", color: cat.color || "#888" }}>
                {cat.label}
              </span>
            )}
            {accountName && <span className="text-[10px] text-[#B0BEC5]">{accountName}</span>}
          </div>
        </div>
        {/* Amount */}
        <span className="text-sm font-bold flex-shrink-0" style={{ color: amountColor }}>
          {amountPrefix}{formatCurrency(tx.amount)}
        </span>
      </div>
    </div>
  );
}

export default function TxRiwayatTab({ transactions, categories, accounts, goals = [], formatCurrency, onRefresh, onAdd }) {
  const [subTab, setSubTab] = useState("all");
  const [selectedTx, setSelectedTx] = useState(null);
  const [editingTx, setEditingTx] = useState(null);

  const filtered = transactions.filter(tx => {
    if (subTab === "income") return tx.type === "income";
    if (subTab === "expense") return tx.type === "expense";
    return true;
  });

  // Group by date
  const groups = [];
  let lastDate = null;
  filtered.forEach(tx => {
    if (tx.date !== lastDate) { groups.push({ date: tx.date, items: [] }); lastDate = tx.date; }
    groups[groups.length - 1].items.push(tx);
  });

  async function handleDelete(tx) {
    await base44.entities.Transaction.update(tx.id, { is_deleted: true });
    // Reverse account balance impact (only for non-recurring templates)
    if (tx.account_id && !tx.is_recurring) {
      await syncAccountBalance(tx.account_id, tx.amount, tx.type, -1);
    }
    // If this was a savings tx linked to a goal, recalc goal current_amount (sum decreases)
    if (tx.type === "savings" && tx.goal_id) {
      await recalcGoalAmount(tx.goal_id);
    }
    onRefresh();
  }

  async function handleSaveEdit(id, data) {
    // Find the original transaction to compute balance delta
    const oldTx = transactions.find(t => t.id === id);
    await base44.entities.Transaction.update(id, data);
    // Reverse old impact, apply new impact (skip recurring templates)
    if (oldTx && !oldTx.is_recurring) {
      if (oldTx.account_id) {
        await syncAccountBalance(oldTx.account_id, oldTx.amount, oldTx.type, -1);
      }
      const newAccountId = data.account_id || oldTx.account_id;
      const newAmount = data.amount ?? oldTx.amount;
      const newType = data.type || oldTx.type;
      if (newAccountId) {
        await syncAccountBalance(newAccountId, newAmount, newType, 1);
      }
    }
    // Recalc any goal that was/is linked — covers all 4 cases:
    // goal_id added, removed, swapped, or amount/type changed on the same goal.
    const oldGoalId = oldTx?.goal_id;
    const newGoalId = data.goal_id ?? oldGoalId;
    if (oldGoalId) await recalcGoalAmount(oldGoalId);
    if (newGoalId && newGoalId !== oldGoalId) await recalcGoalAmount(newGoalId);
    setEditingTx(null);
    onRefresh();
  }

  return (
    <div className="pb-4">
      {/* Sub-tabs */}
      <div className="flex gap-2 px-4 py-3">
        {SUB_TABS.map(s => (
          <button
            key={s.key}
            onClick={() => setSubTab(s.key)}
            className={`flex-1 py-2 rounded-full text-xs font-semibold transition-all tap-highlight-fix ${
              subTab === s.key ? "bg-[#F97316] text-white" : "bg-white text-[#8FA4C8] border border-[#E2E8F0]"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 px-6">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-sm font-semibold text-[#4A5568]">Tidak ada transaksi</p>
          <p className="text-xs text-[#8FA4C8] mt-1">Tap + untuk tambah transaksi baru</p>
        </div>
      ) : (
        <div className="mx-3 space-y-3">
          {groups.map((group, gIdx) => (
            <motion.div
              key={group.date}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: gIdx * 0.06, duration: 0.3 }}
            >
              <p className="text-[11px] font-bold text-[#8FA4C8] uppercase tracking-wider px-1 mb-1">
                {formatDateHeader(group.date)}
              </p>
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm divide-y divide-[#F2F4F7]">
                {group.items.map(tx => {
                  const cat = resolveCategory(tx, categories, goals);
                  const acc = accounts.find(a => a.id === tx.account_id);
                  return (
                    <SwipeItem
                      key={tx.id}
                      tx={tx}
                      cat={cat}
                      accountName={acc?.name}
                      formatCurrency={formatCurrency}
                      onTap={setSelectedTx}
                      onDelete={handleDelete}
                    />
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Detail sheet */}
      {selectedTx && (
        <TxDetailSheet
          tx={selectedTx}
          cat={resolveCategory(selectedTx, categories, goals)}
          accountName={accounts.find(a => a.id === selectedTx?.account_id)?.name}
          formatCurrency={formatCurrency}
          onClose={() => setSelectedTx(null)}
          onEdit={() => setEditingTx(selectedTx)}
        />
      )}

      {/* Edit modal */}
      {editingTx && (
        <EditTransactionModal
          transaction={editingTx}
          onClose={() => setEditingTx(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}