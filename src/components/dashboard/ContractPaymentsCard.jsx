import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, ChevronDown, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAppSettings } from "@/components/utils/useAppSettings";
import EditContractModal from "./EditContractModal";

const INTERVAL_LABEL = {
  daily: "harian",
  weekly: "mingguan",
  monthly: "bulanan",
  yearly: "tahunan",
};

function calcMonthly(tx) {
  if (tx.recurring_interval === "yearly") return tx.amount / 12;
  if (tx.recurring_interval === "weekly") return tx.amount * 4.33;
  if (tx.recurring_interval === "daily") return tx.amount * 30;
  return tx.amount;
}

export default function ContractPaymentsCard({ user }) {
  const { formatCurrency } = useAppSettings();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(null);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (!user?.email) return;
    loadTemplates();
  }, [user?.email]);

  async function loadTemplates() {
    setLoading(true);
    const all = await base44.entities.Transaction.filter({ is_recurring: true, created_by: user.email });
    setTemplates(all.filter((t) => !t.is_recurring_child && t.category !== "subscriptions"));
    setLoading(false);
  }

  async function handleDelete(id) {
    if (!confirm("Hapus transaksi rutin ini?")) return;
    await base44.entities.Transaction.delete(id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }

  async function handleUpdate(data) {
    await base44.entities.Transaction.update(editingId, data);
    setEditingId(null);
    loadTemplates();
  }

  async function handleAdd(data) {
    await base44.entities.Transaction.create({ ...data, is_recurring: true, is_recurring_child: false });
    setShowAdd(null);
    loadTemplates();
  }

  const incomes = templates.filter((t) => t.type === "income");
  const expenses = templates.filter((t) => t.type === "expense");
  const totalIncome = incomes.reduce((s, t) => s + calcMonthly(t), 0);
  const totalExpense = expenses.reduce((s, t) => s + calcMonthly(t), 0);
  const net = totalIncome - totalExpense;
  const editingContract = editingId ? templates.find((t) => t.id === editingId) : null;

  return (
    <>
      <div data-tour="contract-payments-card" className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center gap-3 px-4 py-3.5 tap-highlight-fix"
        >
          <div className="w-9 h-9 rounded-xl bg-[#4F7CFF]/10 flex items-center justify-center flex-shrink-0">
            <RefreshCw className="w-4 h-4 text-[#4F7CFF]" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-bold text-[#1A1A1A]">Gaji & Transaksi Rutin</p>
            <p className="text-[11px] text-[#8FA4C8] truncate">
              {loading
                ? "Memuat..."
                : templates.length === 0
                ? "Belum ada transaksi rutin"
                : `${incomes.length} pemasukan · ${expenses.length} pengeluaran`}
            </p>
          </div>
          {!loading && templates.length > 0 && (
            <div className="text-right flex-shrink-0 mr-1">
              <p className={`text-xs font-bold ${net >= 0 ? "text-[#00C9A7]" : "text-[#FF6B6B]"}`}>
                {net >= 0 ? "+" : ""}{formatCurrency(net)}
              </p>
              <p className="text-[10px] text-[#8FA4C8]">/ bulan</p>
            </div>
          )}
          <ChevronDown className={`w-4 h-4 text-[#8FA4C8] transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="border-t border-[#F2F4F7]">
            {/* Net summary */}
            {templates.length > 0 && (
              <div className="grid grid-cols-3 divide-x divide-[#F2F4F7] bg-[#F8FAFC]">
                <div className="px-3 py-2.5 text-center">
                  <p className="text-[10px] text-[#8FA4C8] mb-0.5">Masuk / bln</p>
                  <p className="text-xs font-bold text-[#00C9A7]">+{formatCurrency(totalIncome)}</p>
                </div>
                <div className="px-3 py-2.5 text-center">
                  <p className="text-[10px] text-[#8FA4C8] mb-0.5">Keluar / bln</p>
                  <p className="text-xs font-bold text-[#FF6B6B]">−{formatCurrency(totalExpense)}</p>
                </div>
                <div className="px-3 py-2.5 text-center">
                  <p className="text-[10px] text-[#8FA4C8] mb-0.5">Net / bln</p>
                  <p className={`text-xs font-bold ${net >= 0 ? "text-[#00C9A7]" : "text-[#FF6B6B]"}`}>
                    {net >= 0 ? "+" : ""}{formatCurrency(net)}
                  </p>
                </div>
              </div>
            )}

            {loading ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-11 bg-[#F2F4F7] rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                <ItemSection
                  label="Pemasukan Rutin"
                  emoji="💰"
                  items={incomes}
                  isIncome
                  onEdit={setEditingId}
                  onDelete={handleDelete}
                  formatCurrency={formatCurrency}
                  onAdd={() => setShowAdd("income")}
                />
                <ItemSection
                  label="Pengeluaran Rutin"
                  emoji="📤"
                  items={expenses}
                  isIncome={false}
                  onEdit={setEditingId}
                  onDelete={handleDelete}
                  formatCurrency={formatCurrency}
                  onAdd={() => setShowAdd("expense")}
                />
              </>
            )}
          </div>
        )}
      </div>

      {showAdd && (
        <EditContractModal
          contract={{
            type: showAdd,
            recurring_interval: "monthly",
            date: new Date().toISOString().split("T")[0],
          }}
          onClose={() => setShowAdd(null)}
          onSave={handleAdd}
        />
      )}

      {editingContract && (
        <EditContractModal
          contract={editingContract}
          onClose={() => setEditingId(null)}
          onSave={handleUpdate}
        />
      )}
    </>
  );
}

function ItemSection({ label, emoji, items, isIncome, onEdit, onDelete, formatCurrency, onAdd }) {
  return (
    <div className="border-t border-[#F2F4F7]">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <p className="text-xs font-bold text-[#4A5568]">{emoji} {label}</p>
        <button
          onClick={onAdd}
          className="flex items-center gap-1 text-[11px] font-semibold text-[#FF6A00] hover:opacity-75 tap-highlight-fix"
        >
          <Plus className="w-3 h-3" /> Tambah
        </button>
      </div>

      {items.length === 0 ? (
        <button
          onClick={onAdd}
          className="mx-4 mb-3 w-[calc(100%-2rem)] flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-dashed border-[#E2E8F0] text-[11px] font-medium text-[#8FA4C8] hover:border-[#FF6A00] hover:text-[#FF6A00] transition-colors tap-highlight-fix"
        >
          <Plus className="w-3.5 h-3.5" />
          {isIncome ? "Tambah gaji / pendapatan rutin" : "Tambah tagihan / cicilan rutin"}
        </button>
      ) : (
        <div className="divide-y divide-[#F2F4F7] mb-1">
          {items.map((tx) => (
            <div key={tx.id} className="flex items-center gap-3 px-4 py-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                style={{ background: isIncome ? "#00C9A715" : "#FF6B6B15" }}
              >
                {isIncome ? "💰" : "📤"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#1A1A1A] truncate">
                  {tx.note || (isIncome ? "Pendapatan" : "Tagihan")}
                </p>
                <p className="text-[10px] text-[#8FA4C8] capitalize">
                  {INTERVAL_LABEL[tx.recurring_interval] || tx.recurring_interval}
                </p>
              </div>
              <span className={`text-xs font-bold flex-shrink-0 ${isIncome ? "text-[#00C9A7]" : "text-[#FF6B6B]"}`}>
                {isIncome ? "+" : "−"}{formatCurrency(tx.amount)}
              </span>
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <button
                  onClick={() => onEdit(tx.id)}
                  className="p-1.5 rounded-lg text-[#CBD5E0] hover:text-[#4F7CFF] hover:bg-[#F2F4F7] active:bg-[#E8EDFF] transition-colors tap-highlight-fix"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onDelete(tx.id)}
                  className="p-1.5 rounded-lg text-[#CBD5E0] hover:text-[#FF6B6B] hover:bg-[#FFF5F5] active:bg-[#FEE2E2] transition-colors tap-highlight-fix"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}