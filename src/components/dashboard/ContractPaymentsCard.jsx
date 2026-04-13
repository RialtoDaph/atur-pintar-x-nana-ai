import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, ChevronDown, RefreshCw, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAppSettings } from "@/components/utils/useAppSettings";
import { toast } from "sonner";
import EditContractModal from "./EditContractModal";
import ConfirmMarkDoneModal from "./ConfirmMarkDoneModal";

const INTERVAL_LABEL = { daily: "harian", weekly: "mingguan", monthly: "bulanan", yearly: "tahunan" };

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
  const [open, setOpen] = useState(true);
  const [showAdd, setShowAdd] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [confirmTx, setConfirmTx] = useState(null);

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

  async function doMarkDone(tx, accountId) {
    const today = new Date().toISOString().split("T")[0];
    // Cek apakah sudah ada child transaction hari ini dari parent ini
    const existing = await base44.entities.Transaction.filter({
      recurring_parent_id: tx.id,
      is_recurring_child: true,
      date: today,
    });
    if (existing && existing.length > 0) {
      window.dispatchEvent(new Event("refresh-dashboard"));
      return;
    }
    const newTx = {
      amount: tx.amount,
      type: tx.type,
      category: tx.category,
      note: (tx.note || "Transaksi rutin") + " (selesai)",
      date: today,
      is_recurring: false,
      is_recurring_child: true,
      recurring_parent_id: tx.id,
      ...(accountId ? { account_id: accountId } : {}),
    };
    await base44.entities.Transaction.create(newTx);
    await base44.functions.invoke("syncTransactionChanges", { action: "create", transaction: newTx });
    // Update recurring_last_generated agar RecurringManager tidak generate duplikat
    try { await base44.entities.Transaction.update(tx.id, { recurring_last_generated: today }); } catch (_) {}
    window.dispatchEvent(new Event("refresh-dashboard"));
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
        <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-3 px-4 py-3 tap-highlight-fix">
          <div className="w-8 h-8 rounded-lg bg-[#4F7CFF]/10 flex items-center justify-center flex-shrink-0">
            <RefreshCw className="w-3.5 h-3.5 text-[#4F7CFF]" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-xs font-bold text-[#1A1A1A]">Transaksi Rutin</p>
            <p className="text-[10px] text-[#8FA4C8]">
              {loading ? "Memuat..." : templates.length === 0 ? "Belum ada" : `${incomes.length} masuk · ${expenses.length} keluar`}
            </p>
          </div>
          {!loading && templates.length > 0 && (
            <span className={`text-xs font-bold flex-shrink-0 mr-1 ${net >= 0 ? "text-[#00C9A7]" : "text-[#FF6B6B]"}`}>
              {net >= 0 ? "+" : ""}{formatCurrency(net)}<span className="text-[9px] font-normal text-[#8FA4C8]">/bln</span>
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-[#8FA4C8] transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="border-t border-[#F2F4F7]">
            {/* Summary strip */}
            {templates.length > 0 && (
              <div className="grid grid-cols-2 divide-x divide-[#F2F4F7] bg-[#F8FAFC]">
                {[
                  { label: "Masuk/bln", val: `+${formatCurrency(totalIncome)}`, color: "text-[#00C9A7]" },
                  { label: "Keluar/bln", val: `−${formatCurrency(totalExpense)}`, color: "text-[#FF6B6B]" },
                ].map(({ label, val, color }) => (
                  <div key={label} className="py-2 text-center">
                    <p className="text-[9px] text-[#8FA4C8]">{label}</p>
                    <p className={`text-[11px] font-bold ${color}`}>{val}</p>
                  </div>
                ))}
              </div>
            )}

            {loading ? (
              <div className="p-3 space-y-2">{[1,2,3].map(i => <div key={i} className="h-9 bg-[#F2F4F7] rounded-lg animate-pulse" />)}</div>
            ) : (
              <>
                <Section label="💰 Pemasukan" items={incomes} isIncome onMarkDone={setConfirmTx} onEdit={setEditingId} onDelete={handleDelete} formatCurrency={formatCurrency} onAdd={() => setShowAdd("income")} />
                <Section label="📤 Pengeluaran" items={expenses} isIncome={false} onMarkDone={setConfirmTx} onEdit={setEditingId} onDelete={handleDelete} formatCurrency={formatCurrency} onAdd={() => setShowAdd("expense")} />
              </>
            )}
          </div>
        )}
      </div>

      {showAdd && (
        <EditContractModal
          contract={{ type: showAdd, recurring_interval: "monthly", date: new Date().toISOString().split("T")[0] }}
          onClose={() => setShowAdd(null)}
          onSave={handleAdd}
        />
      )}
      {editingContract && (
        <EditContractModal contract={editingContract} onClose={() => setEditingId(null)} onSave={handleUpdate} />
      )}
      {confirmTx && (
        <ConfirmMarkDoneModal
          title={confirmTx.note || "Transaksi Rutin"}
          amount={confirmTx.amount}
          formatCurrency={formatCurrency}
          onConfirm={(accountId) => doMarkDone(confirmTx, accountId)}
          onClose={() => setConfirmTx(null)}
        />
      )}
    </>
  );
}

function ItemPopup({ tx, isIncome, onEdit, onDelete, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-xs shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-4 py-3 border-b border-[#F2F4F7]">
          <p className="text-sm font-bold text-[#1A1A1A] truncate">{tx.note || (isIncome ? "Pendapatan" : "Tagihan")}</p>
          <p className="text-[10px] text-[#8FA4C8] capitalize">{INTERVAL_LABEL[tx.recurring_interval] || tx.recurring_interval}</p>
        </div>
        <div className="flex gap-2 p-3">
          <button onClick={() => { onEdit(tx.id); onClose(); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#4F7CFF]/10 text-[#4F7CFF] text-xs font-bold tap-highlight-fix">
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
          <button onClick={() => { onDelete(tx.id); onClose(); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#FF6B6B]/10 text-[#FF6B6B] text-xs font-bold tap-highlight-fix">
            <Trash2 className="w-3.5 h-3.5" /> Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ label, items, isIncome, onMarkDone, onEdit, onDelete, formatCurrency, onAdd }) {
  const [popupTx, setPopupTx] = useState(null);
  return (
    <div className="border-t border-[#F2F4F7]">
      <div className="flex items-center justify-between px-4 py-2">
        <p className="text-[10px] font-bold text-[#8FA4C8] uppercase tracking-wide">{label}</p>
        <button onClick={onAdd} className="flex items-center gap-0.5 text-[10px] font-semibold text-[#FF6A00] tap-highlight-fix">
          <Plus className="w-3 h-3" /> Tambah
        </button>
      </div>

      {items.length === 0 ? (
        <button onClick={onAdd} className="mx-3 mb-2.5 w-[calc(100%-1.5rem)] flex items-center justify-center gap-1 py-2 rounded-xl border-2 border-dashed border-[#E2E8F0] text-[10px] text-[#8FA4C8] hover:border-[#FF6A00] hover:text-[#FF6A00] transition-colors tap-highlight-fix">
          <Plus className="w-3 h-3" />
          {isIncome ? "Tambah gaji/pendapatan rutin" : "Tambah tagihan/cicilan rutin"}
        </button>
      ) : (
        <div className="pb-1">
          {items.map((tx) => (
            <div key={tx.id}
              className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-[#F8FAFC] transition-colors cursor-pointer"
              onClick={() => setPopupTx(tx)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[#1A1A1A] truncate">{tx.note || (isIncome ? "Pendapatan" : "Tagihan")}</p>
                <p className="text-[9px] text-[#8FA4C8] capitalize">
                  {INTERVAL_LABEL[tx.recurring_interval] || tx.recurring_interval}
                  {(tx.recurring_interval === 'monthly' || tx.recurring_interval === 'yearly') && tx.date
                    ? ` · tgl ${new Date(tx.date + 'T12:00:00').getDate()}`
                    : ''}
                </p>
              </div>
              <span className={`text-xs font-bold flex-shrink-0 ${isIncome ? "text-[#00C9A7]" : "text-[#FF6B6B]"}`}>
                {isIncome ? "+" : "−"}{formatCurrency(tx.amount)}
              </span>
              <button
                onClick={e => { e.stopPropagation(); onMarkDone(tx); }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex-shrink-0 transition-colors tap-highlight-fix ${
                  isIncome
                    ? "bg-[#00C9A7]/10 text-[#00C9A7] hover:bg-[#00C9A7]/20"
                    : "bg-[#FF6B6B]/10 text-[#FF6B6B] hover:bg-[#FF6B6B]/20"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isIncome ? "Terima" : "Bayar"}
              </button>
            </div>
          ))}
        </div>
      )}

      {popupTx && (
        <ItemPopup tx={popupTx} isIncome={isIncome} onEdit={onEdit} onDelete={onDelete} onClose={() => setPopupTx(null)} />
      )}
    </div>
  );
}