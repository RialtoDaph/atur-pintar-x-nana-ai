import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import AccountPickerModal from "./AccountPickerModal";
import { Plus, X } from "lucide-react";

function formatIDR(n) { return "Rp" + Math.round(n || 0).toLocaleString("id-ID"); }
function today() { return new Date().toLocaleDateString("en-CA"); }
function addMonths(dateStr, n) {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + n);
  return d.toLocaleDateString("en-CA");
}

const CYCLE_LABELS = { monthly: "Bulanan", quarterly: "3 Bulanan", yearly: "Tahunan" };
const CYCLE_MONTHS = { monthly: 1, quarterly: 3, yearly: 12 };

function monthlyAmount(sub) {
  if (sub.billing_cycle === "quarterly") return sub.amount / 3;
  if (sub.billing_cycle === "yearly") return sub.amount / 12;
  return sub.amount || 0;
}

function daysUntil(dateStr) {
  if (!dateStr) return 999;
  return Math.ceil((new Date(dateStr) - new Date(today())) / 86400000);
}

function cycleProgress(sub) {
  if (!sub.next_due_date) return 0;
  const months = CYCLE_MONTHS[sub.billing_cycle] || 1;
  const totalDays = months * 30;
  const start = new Date(sub.next_due_date);
  start.setMonth(start.getMonth() - months);
  const elapsed = Math.ceil((new Date(today()) - start) / 86400000);
  return Math.min(100, Math.max(0, (elapsed / totalDays) * 100));
}

export default function SubscriptionTab({ user }) {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pickerSub, setPickerSub] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", icon: "", amount: "", billing_cycle: "monthly", next_due_date: today(), notes: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user?.email) return;
    setLoading(true);
    const data = await base44.entities.Subscription.filter({ created_by: user.email }, "next_due_date");
    setSubs(data || []);
    setLoading(false);
  }, [user?.email]);

  useEffect(() => { load(); }, [load]);

  const active = subs.filter(s => s.status === "active");
  const totalMonthly = active.reduce((sum, s) => sum + monthlyAmount(s), 0);
  const dueCount = active.filter(s => daysUntil(s.next_due_date) <= 30).length;

  const dueSoon = active.filter(s => daysUntil(s.next_due_date) <= 30).sort((a, b) => daysUntil(a.next_due_date) - daysUntil(b.next_due_date));
  const activeLater = active.filter(s => daysUntil(s.next_due_date) > 30);
  const inactive = subs.filter(s => s.status !== "active");

  async function handlePay(sub, account) {
    try {
      await base44.entities.Account.update(account.id, { balance: (account.balance || 0) - sub.amount });
      await base44.entities.Transaction.create({
        type: "expense",
        amount: sub.amount,
        category: "69d6e270e0eba2b7f639b502",
        note: `${sub.name} (dibayar)`,
        account_id: account.id,
        date: today(),
      });
      const months = CYCLE_MONTHS[sub.billing_cycle] || 1;
      const newDue = addMonths(today(), months);
      await base44.entities.Subscription.update(sub.id, { next_due_date: newDue });
      toast.success(`Berhasil! ${sub.name} dibayar ${formatIDR(sub.amount)} dari ${account.name}`);
      load();
    } catch (e) {
      toast.error("Gagal: " + e.message);
    }
    setPickerSub(null);
  }

  async function handleDeactivate(sub) {
    if (!confirm(`Nonaktifkan ${sub.name}? Kamu bisa aktifkan lagi nanti.`)) return;
    await base44.entities.Subscription.update(sub.id, { status: "cancelled" });
    toast.success(`${sub.name} dinonaktifkan`);
    load();
  }

  async function handleAdd() {
    if (!addForm.name || !addForm.amount || !addForm.next_due_date) return;
    setSaving(true);
    await base44.entities.Subscription.create({
      name: addForm.name,
      icon: addForm.icon || undefined,
      amount: parseFloat(addForm.amount) || 0,
      billing_cycle: addForm.billing_cycle,
      next_due_date: addForm.next_due_date,
      notes: addForm.notes || undefined,
      status: "active",
    });
    toast.success(`${addForm.name} ditambahkan`);
    setShowAddForm(false);
    setAddForm({ name: "", icon: "", amount: "", billing_cycle: "monthly", next_due_date: today(), notes: "" });
    setSaving(false);
    load();
  }

  if (loading) return <div className="p-8 flex justify-center"><div className="w-6 h-6 border-2 border-[#FF6A00] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5 pb-8">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-xl p-3 shadow-sm border border-[#F0F2F5]">
          <p className="text-[10px] text-[#8FA4C8] font-medium leading-tight mb-1">Total/bulan</p>
          <p className="text-sm font-bold text-[#DC2626] truncate">{formatIDR(totalMonthly)}</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-[#F0F2F5]">
          <p className="text-[10px] text-[#8FA4C8] font-medium leading-tight mb-1">Aktif</p>
          <p className="text-sm font-bold text-[#1A1A1A]">{active.length}</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-[#F0F2F5]">
          <p className="text-[10px] text-[#8FA4C8] font-medium leading-tight mb-1">Jatuh tempo</p>
          <p className="text-sm font-bold text-[#F59E0B]">{dueCount}</p>
        </div>
      </div>

      {/* Due soon */}
      {dueSoon.length > 0 && (
        <SubSection title="Jatuh tempo bulan ini">
          {dueSoon.map(sub => <SubCard key={sub.id} sub={sub} onPay={() => setPickerSub(sub)} onDeactivate={() => handleDeactivate(sub)} />)}
        </SubSection>
      )}

      {/* Active later */}
      {activeLater.length > 0 && (
        <SubSection title="Aktif">
          {activeLater.map(sub => <SubCard key={sub.id} sub={sub} onPay={() => setPickerSub(sub)} onDeactivate={() => handleDeactivate(sub)} />)}
        </SubSection>
      )}

      {/* Inactive */}
      {inactive.length > 0 && (
        <SubSection title="Nonaktif">
          <div className="opacity-50 space-y-2">
            {inactive.map(sub => <SubCard key={sub.id} sub={sub} onPay={null} onDeactivate={null} />)}
          </div>
        </SubSection>
      )}

      {subs.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center">
          <p className="text-3xl mb-2">📱</p>
          <p className="text-xs text-[#8FA4C8]">Belum ada langganan tercatat.<br/>Tambah layanan yang kamu bayar rutin seperti streaming, software, dll.</p>
        </div>
      )}

      {/* Add button */}
      <button onClick={() => setShowAddForm(true)}
        className="w-full py-3.5 rounded-xl border-2 border-dashed border-[#E2E8F0] text-sm font-semibold text-[#8FA4C8] hover:border-[#FF6A00] hover:text-[#FF6A00] transition-colors flex items-center justify-center gap-2">
        <Plus className="w-4 h-4" /> Tambah Langganan
      </button>

      {/* Account Picker */}
      {pickerSub && (
        <AccountPickerModal
          isOpen
          onClose={() => setPickerSub(null)}
          title={`Bayar ${pickerSub.name}`}
          amount={pickerSub.amount}
          onConfirm={(acc) => handlePay(pickerSub, acc)}
        />
      )}

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <p className="text-base font-bold text-[#1A1A1A]">Tambah Langganan</p>
              <button onClick={() => setShowAddForm(false)} className="p-1.5 hover:bg-[#F2F4F7] rounded-lg"><X className="w-4 h-4 text-[#8FA4C8]" /></button>
            </div>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input className="w-14 border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-center text-lg" placeholder="📱"
                  value={addForm.icon} onChange={e => setAddForm(f => ({ ...f, icon: e.target.value }))} maxLength={2} />
                <input className="flex-1 border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#1A1A1A]" placeholder="Nama langganan *"
                  value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#8FA4C8]">Rp</span>
                <input type="number" className="w-full border border-[#E2E8F0] rounded-xl pl-9 pr-3 py-2.5 text-sm text-[#1A1A1A]"
                  placeholder="Nominal *" value={addForm.amount} onChange={e => setAddForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div className="flex gap-1.5">
                {["monthly", "quarterly", "yearly"].map(c => (
                  <button key={c} onClick={() => setAddForm(f => ({ ...f, billing_cycle: c }))}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${addForm.billing_cycle === c ? "bg-[#FF6A00] text-white border-[#FF6A00]" : "bg-[#F2F4F7] text-[#4A5568] border-transparent"}`}>
                    {CYCLE_LABELS[c]}
                  </button>
                ))}
              </div>
              <div>
                <p className="text-[10px] text-[#8FA4C8] mb-1">Jatuh tempo berikutnya *</p>
                <input type="date" className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#1A1A1A]"
                  value={addForm.next_due_date} onChange={e => setAddForm(f => ({ ...f, next_due_date: e.target.value }))} />
              </div>
              <input className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#1A1A1A]" placeholder="Catatan (opsional)"
                value={addForm.notes} onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <button onClick={handleAdd} disabled={saving || !addForm.name || !addForm.amount}
              className="w-full mt-5 py-3.5 rounded-xl bg-[#FF6A00] text-white font-bold text-sm disabled:opacity-40">
              {saving ? "Menyimpan..." : "Simpan Langganan"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SubSection({ title, children }) {
  return (
    <div>
      <p className="text-xs font-bold text-[#8FA4C8] uppercase tracking-widest mb-2 px-1">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function SubCard({ sub, onPay, onDeactivate }) {
  const days = daysUntil(sub.next_due_date);
  const pct = cycleProgress(sub);
  const barColor = pct < 70 ? "#22C55E" : pct < 90 ? "#F59E0B" : "#EF4444";
  return (
    <div className="bg-white rounded-2xl shadow-sm p-3.5">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xl">{sub.icon || "📱"}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#1A1A1A] truncate">{sub.name}</p>
          <p className="text-xs text-[#8FA4C8]">{CYCLE_LABELS[sub.billing_cycle]}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-[#1A1A1A]">{formatIDR(sub.amount)}</p>
          {sub.next_due_date && (
            <p className="text-[10px]" style={{ color: days <= 7 ? "#EF4444" : "#8FA4C8" }}>
              {days <= 0 ? "Hari ini" : `${days} hari lagi`}
            </p>
          )}
        </div>
      </div>
      <div className="h-1.5 bg-[#F2F4F7] rounded-full mb-2.5 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: barColor }} />
      </div>
      {(onPay || onDeactivate) && (
        <div className="flex gap-2">
          {days <= 7 && onPay && (
            <button onClick={onPay} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#EF4444]">Bayar</button>
          )}
          {onDeactivate && (
            <button onClick={onDeactivate} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#8FA4C8] bg-[#F2F4F7]">Nonaktifkan</button>
          )}
        </div>
      )}
    </div>
  );
}