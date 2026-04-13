import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import AccountPickerModal from "./AccountPickerModal";
import { Pencil, SkipForward, CreditCard, ChevronRight } from "lucide-react";

function formatIDR(n) { return "Rp" + Math.round(n || 0).toLocaleString("id-ID"); }
function today() { return new Date().toLocaleDateString("en-CA"); }
function thisMonth() { return today().substring(0, 7); }

function calcDueDate(tx) {
  if (!tx.date) return null;
  const base = new Date(tx.date);
  const interval = tx.recurring_interval || "monthly";
  if (interval === "daily") base.setDate(base.getDate() + 1);
  else if (interval === "weekly") base.setDate(base.getDate() + 7);
  else if (interval === "monthly") base.setMonth(base.getMonth() + 1);
  else if (interval === "yearly") base.setFullYear(base.getFullYear() + 1);
  return base.toLocaleDateString("en-CA");
}

function urgencyBadge(dueDate) {
  if (!dueDate) return null;
  const diff = Math.ceil((new Date(dueDate) - new Date(today())) / 86400000);
  if (diff <= 0) return { text: "Hari ini!", color: "#EF4444", border: "#EF4444" };
  if (diff <= 3) return { text: `${diff} hari lagi`, color: "#F59E0B", border: "#F59E0B" };
  return null;
}

const INTERVAL_LABELS = { daily: "Harian", weekly: "Mingguan", monthly: "Bulanan", yearly: "Tahunan" };

export default function RecurringTab({ user, globalCategories }) {
  const [recurring, setRecurring] = useState([]);
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pickerState, setPickerState] = useState(null); // { tx, action }
  const [accounts, setAccounts] = useState([]);

  const load = useCallback(async () => {
    if (!user?.email) return;
    setLoading(true);
    const [txs, dts, accs] = await Promise.all([
      base44.entities.Transaction.filter({ created_by: user.email, is_recurring: true }, "-date"),
      base44.entities.Debt.filter({ created_by: user.email, status: "active" }),
      base44.entities.Account.filter({ created_by: user.email }),
    ]);
    setRecurring((txs || []).filter(t => !t.is_recurring_child));
    setDebts(dts || []);
    setAccounts(accs || []);
    setLoading(false);
  }, [user?.email]);

  useEffect(() => { load(); }, [load]);

  const pending = recurring.filter(tx => {
    const lastGen = tx.recurring_last_generated;
    return !lastGen || lastGen.substring(0, 7) < thisMonth();
  });
  const done = recurring.filter(tx => {
    const lastGen = tx.recurring_last_generated;
    return lastGen && lastGen.substring(0, 7) >= thisMonth();
  });

  const totalOut = recurring.filter(t => t.type === "expense").reduce((s, t) => s + (t.amount || 0), 0);
  const totalIn = recurring.filter(t => t.type === "income").reduce((s, t) => s + (t.amount || 0), 0);
  const totalDebt = debts.reduce((s, d) => s + (d.monthly_payment || 0), 0);

  function getCatEmoji(catId) {
    const cat = (globalCategories || []).find(c => c.id === catId);
    return cat?.emoji || "📋";
  }
  function getAccName(accId) {
    const acc = accounts.find(a => a.id === accId);
    return acc?.name || null;
  }

  async function handlePayReceive(tx, account) {
    const action = tx.type === "expense" ? "Bayar" : "Terima";
    try {
      // Update account balance
      const acc = accounts.find(a => a.id === account.id);
      const newBal = tx.type === "expense"
        ? (acc?.balance || 0) - tx.amount
        : (acc?.balance || 0) + tx.amount;
      await base44.entities.Account.update(account.id, { balance: newBal });

      // Create child transaction
      await base44.entities.Transaction.create({
        is_recurring_child: true,
        recurring_parent_id: tx.id,
        account_id: account.id,
        type: tx.type,
        amount: tx.amount,
        category: tx.category,
        note: `${tx.note || ""} (${tx.type === "expense" ? "dibayar" : "diterima"})`,
        date: today(),
        is_recurring: false,
      });

      // Update parent last generated
      await base44.entities.Transaction.update(tx.id, { recurring_last_generated: today() });

      toast.success(`Berhasil! Saldo ${account.name} ${tx.type === "expense" ? "berkurang" : "bertambah"} ${formatIDR(tx.amount)}`);
      load();
    } catch (e) {
      toast.error("Gagal: " + e.message);
    }
    setPickerState(null);
  }

  async function handleSkip(tx) {
    await base44.entities.Transaction.update(tx.id, { recurring_last_generated: today() });
    toast.success("Dilewati. Akan muncul lagi bulan depan.");
    load();
  }

  async function handlePayDebt(debt, account) {
    try {
      const acc = accounts.find(a => a.id === account.id);
      const newBal = (acc?.balance || 0) - debt.monthly_payment;
      await base44.entities.Account.update(account.id, { balance: newBal });

      const newRemaining = Math.max(0, (debt.remaining_amount || 0) - debt.monthly_payment);
      const updates = { remaining_amount: newRemaining };
      if (newRemaining <= 0) updates.status = "paid";

      await base44.entities.Debt.update(debt.id, updates);
      await base44.entities.Transaction.create({
        type: "expense",
        amount: debt.monthly_payment,
        category: "69d6e3e6b29d5e2cbf44496a",
        debt_id: debt.id,
        account_id: account.id,
        note: `Cicilan ${debt.name}`,
        date: today(),
      });

      if (newRemaining <= 0) {
        toast.success(`🎉 Selamat! Utang ${debt.name} telah lunas!`);
      } else {
        toast.success(`Cicilan dibayar! Sisa ${formatIDR(newRemaining)}`);
      }
      load();
    } catch (e) {
      toast.error("Gagal: " + e.message);
    }
    setPickerState(null);
  }

  if (loading) return <div className="p-8 flex justify-center"><div className="w-6 h-6 border-2 border-[#FF6A00] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5 pb-8">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        <MetricCard label="Rutin Keluar/bln" value={formatIDR(totalOut)} color="#DC2626" />
        <MetricCard label="Rutin Masuk/bln" value={formatIDR(totalIn)} color="#16A34A" />
        <MetricCard label="Cicilan/bln" value={formatIDR(totalDebt)} color="#3B82F6" />
      </div>

      {/* Pending */}
      <Section title="Menunggu konfirmasi">
        {pending.length === 0 ? (
          <EmptyState icon="✅" text="Semua transaksi rutin sudah dikonfirmasi bulan ini. Bagus!" />
        ) : (
          <div className="space-y-2">
            {pending.sort((a, b) => (calcDueDate(a) || "").localeCompare(calcDueDate(b) || "")).map(tx => {
              const due = calcDueDate(tx);
              const urgency = urgencyBadge(due);
              const isExpense = tx.type === "expense";
              return (
                <div key={tx.id}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden"
                  style={{ borderLeft: urgency ? `3px solid ${urgency.border}` : undefined }}>
                  <div className="flex items-center gap-3 p-3.5">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                      style={{ backgroundColor: isExpense ? "#EF444420" : "#22C55E20" }}>
                      {getCatEmoji(tx.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-[#1A1A1A] truncate">{tx.note || "Transaksi Rutin"}</p>
                        {urgency && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: urgency.color + "20", color: urgency.color }}>
                            {urgency.text}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#8FA4C8]">
                        {INTERVAL_LABELS[tx.recurring_interval] || "Bulanan"}
                        {tx.account_id ? ` · ${getAccName(tx.account_id)}` : " · belum ada rekening"}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold" style={{ color: isExpense ? "#EF4444" : "#22C55E" }}>
                        {isExpense ? "−" : "+"}{formatIDR(tx.amount)}
                      </p>
                      {due && <p className="text-[10px] text-[#8FA4C8]">{new Date(due).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-3.5 pb-3">
                    <button
                      onClick={() => setPickerState({ tx, action: isExpense ? "pay" : "receive" })}
                      className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-colors"
                      style={{ backgroundColor: isExpense ? "#EF4444" : "#22C55E" }}>
                      {isExpense ? "Bayar" : "Terima"}
                    </button>
                    <button onClick={() => handleSkip(tx)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#8FA4C8] bg-[#F2F4F7] hover:bg-[#E2E8F0] transition-colors">
                      <SkipForward className="w-3 h-3" /> Lewati
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* Debts */}
      {debts.length > 0 && (
        <Section title="Cicilan utang aktif">
          <div className="space-y-2">
            {debts.map(debt => {
              const pct = Math.min(100, ((debt.total_amount - debt.remaining_amount) / debt.total_amount) * 100) || 0;
              const barColor = pct < 50 ? "#22C55E" : pct < 80 ? "#F59E0B" : "#EF4444";
              return (
                <div key={debt.id} className="bg-white rounded-2xl shadow-sm p-3.5">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">🚗</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1A1A1A] truncate">{debt.name}</p>
                      <p className="text-xs text-[#8FA4C8]">
                        Sisa {formatIDR(debt.remaining_amount)} / {formatIDR(debt.total_amount)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-[#3B82F6]">{formatIDR(debt.monthly_payment)}/bln</p>
                      {debt.due_date && <p className="text-[10px] text-[#8FA4C8]">{new Date(debt.due_date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</p>}
                    </div>
                  </div>
                  <div className="h-1.5 bg-[#F2F4F7] rounded-full mb-2.5 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setPickerState({ debt, action: "debt" })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#3B82F6] hover:bg-[#2563EB] transition-colors">
                      <CreditCard className="w-3 h-3" /> Bayar Cicilan
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Done this month */}
      {done.length > 0 && (
        <Section title="Sudah selesai bulan ini">
          <div className="space-y-1.5 opacity-55">
            {done.map(tx => (
              <div key={tx.id} className="bg-white rounded-xl p-3 flex items-center gap-3">
                <span className="text-lg">{getCatEmoji(tx.category)}</span>
                <p className="flex-1 text-xs font-medium text-[#1A1A1A] truncate">{tx.note || "Transaksi Rutin"}</p>
                <p className="text-xs font-bold" style={{ color: tx.type === "expense" ? "#EF4444" : "#22C55E" }}>
                  {tx.type === "expense" ? "−" : "+"}{formatIDR(tx.amount)}
                </p>
                {tx.recurring_last_generated && (
                  <p className="text-[10px] text-[#8FA4C8] flex-shrink-0">
                    {new Date(tx.recurring_last_generated).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {recurring.length === 0 && debts.length === 0 && (
        <EmptyState icon="🔄" text={"Belum ada transaksi rutin.\nTambah transaksi dan aktifkan toggle 'Berulang' untuk mulai."} />
      )}

      {/* Account Picker Modal */}
      {pickerState && !pickerState.debt && (
        <AccountPickerModal
          isOpen
          onClose={() => setPickerState(null)}
          title={`${pickerState.action === "pay" ? "Bayar" : "Terima"} — ${pickerState.tx?.note || "Transaksi Rutin"}`}
          amount={pickerState.tx?.amount}
          onConfirm={(acc) => handlePayReceive(pickerState.tx, acc)}
        />
      )}
      {pickerState?.debt && (
        <AccountPickerModal
          isOpen
          onClose={() => setPickerState(null)}
          title={`Bayar Cicilan ${pickerState.debt.name}`}
          amount={pickerState.debt.monthly_payment}
          onConfirm={(acc) => handlePayDebt(pickerState.debt, acc)}
        />
      )}
    </div>
  );
}

function MetricCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl p-3 shadow-sm border border-[#F0F2F5]">
      <p className="text-[10px] text-[#8FA4C8] font-medium leading-tight mb-1">{label}</p>
      <p className="text-sm font-bold truncate" style={{ color }}>{value}</p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <p className="text-xs font-bold text-[#8FA4C8] uppercase tracking-widest mb-2 px-1">{title}</p>
      {children}
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div className="bg-white rounded-2xl p-8 text-center">
      <p className="text-3xl mb-2">{icon}</p>
      <p className="text-xs text-[#8FA4C8] whitespace-pre-line">{text}</p>
    </div>
  );
}