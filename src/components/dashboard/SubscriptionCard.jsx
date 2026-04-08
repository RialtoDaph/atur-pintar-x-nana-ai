import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, ChevronDown, Bell, CreditCard, CheckCircle2 } from "lucide-react";
import ConfirmMarkDoneModal from "./ConfirmMarkDoneModal";
import { useAppSettings } from "@/components/utils/useAppSettings";
import { syncAccountBalance } from "@/components/utils/accountSync";

const CYCLE_LABEL = { monthly: "/bln", quarterly: "/3bln", yearly: "/thn" };
const CYCLE_FACTOR = { monthly: 1, quarterly: 1 / 3, yearly: 1 / 12 };

function getDaysUntil(dateStr) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr); due.setHours(0, 0, 0, 0);
  return Math.round((due - today) / 86400000);
}

function AddSubscriptionModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: "", icon: "📦", amount: "", billing_cycle: "monthly", next_due_date: "", notes: "", status: "active" });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.amount || !form.next_due_date) return;
    setSaving(true);
    await onSave({ ...form, amount: parseFloat(form.amount) });
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4 pb-6 sm:pb-0" onClick={onClose}>
      <div className="bg-white my-24 p-4 rounded-2xl w-full max-w-sm space-y-3 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-sm font-bold text-[#1A1A1A]">Tambah Langganan</h2>
        <form onSubmit={handleSubmit} className="space-y-2.5">
          <div className="flex gap-2">
            <input type="text" value={form.icon} onChange={(e) => set("icon", e.target.value)}
              className="w-12 border border-[#E2E8F0] rounded-xl px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/30 focus:border-[#FF6A00]" />
            <input type="text" placeholder="Nama layanan" value={form.name} onChange={(e) => set("name", e.target.value)} required
              className="flex-1 border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/30 focus:border-[#FF6A00]" />
          </div>
          <input type="number" placeholder="Jumlah tagihan" value={form.amount} onChange={(e) => set("amount", e.target.value)} required
            className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/30 focus:border-[#FF6A00]" />
          <select value={form.billing_cycle} onChange={(e) => set("billing_cycle", e.target.value)}
            className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/30 focus:border-[#FF6A00]">
            <option value="monthly">Bulanan</option>
            <option value="quarterly">Triwulanan</option>
            <option value="yearly">Tahunan</option>
          </select>
          <input type="date" value={form.next_due_date} onChange={(e) => set("next_due_date", e.target.value)} required
            className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/30 focus:border-[#FF6A00]" />
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-[#8FA4C8]">Batal</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 rounded-xl bg-[#FF6A00] text-white text-sm font-bold disabled:opacity-60">
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SubscriptionCard({ user }) {
  const { formatCurrency } = useAppSettings();
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [confirmSub, setConfirmSub] = useState(null);

  useEffect(() => {
    if (!user) return;
    base44.entities.Subscription.filter({ created_by: user.email }, "next_due_date", 50)
      .then((data) => { setSubs(data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user]);

  async function handleAdd(data) {
    const created = await base44.entities.Subscription.create(data);
    setSubs((prev) => [...prev, created].sort((a, b) => new Date(a.next_due_date) - new Date(b.next_due_date)));
    setShowAdd(false);
  }

  async function doMarkDone(sub, accountId) {
    await base44.entities.Transaction.create({
      amount: sub.amount, type: "expense", category: "subscriptions",
      note: sub.name + " (selesai)", date: new Date().toISOString().split("T")[0],
      is_recurring: false, is_recurring_child: false,
      ...(accountId ? { account_id: accountId } : {})
    });
    if (accountId) await syncAccountBalance(accountId, sub.amount, "expense", 1);
    const next = new Date(sub.next_due_date);
    if (sub.billing_cycle === "monthly") next.setMonth(next.getMonth() + 1);
    else if (sub.billing_cycle === "quarterly") next.setMonth(next.getMonth() + 3);
    else if (sub.billing_cycle === "yearly") next.setFullYear(next.getFullYear() + 1);
    const nextStr = next.toISOString().split("T")[0];
    await base44.entities.Subscription.update(sub.id, { next_due_date: nextStr });
    setSubs((prev) => prev.map((s) => s.id === sub.id ? { ...s, next_due_date: nextStr } : s));
    window.dispatchEvent(new Event("refresh-dashboard"));
  }

  async function handleDelete(id) {
    if (!confirm("Hapus langganan ini?")) return;
    await base44.entities.Subscription.delete(id);
    setSubs((prev) => prev.filter((s) => s.id !== id));
  }

  const active = subs.filter((s) => s.status === "active");
  const totalMonthly = active.reduce((sum, s) => sum + s.amount * (CYCLE_FACTOR[s.billing_cycle] ?? 1), 0);
  const soonCount = active.filter((s) => { const d = getDaysUntil(s.next_due_date); return d >= 0 && d <= 3; }).length;

  return (
    <>
      <div data-tour="subscription-detector-card" className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-3 px-4 py-3 tap-highlight-fix">
          <div className="w-8 h-8 rounded-lg bg-[#FF6A00]/10 flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-3.5 h-3.5 text-[#FF6A00]" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-xs font-bold text-[#1A1A1A]">Langganan</p>
            <p className="text-[10px] text-[#8FA4C8]">
              {loading ? "Memuat..." : active.length === 0 ? "Belum ada aktif" : `${active.length} aktif · ${formatCurrency(totalMonthly)}/bln`}
            </p>
          </div>
          {soonCount > 0 && (
            <div className="flex items-center gap-1 bg-[#FF6A00]/10 text-[#FF6A00] text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
              <Bell className="w-2.5 h-2.5" />{soonCount} segera
            </div>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-[#8FA4C8] transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="border-t border-[#F2F4F7]">
            {loading ? (
              <div className="p-3 space-y-2">
                {[1, 2, 3].map((i) => <div key={i} className="h-9 bg-[#F2F4F7] rounded-lg animate-pulse" />)}
              </div>
            ) : subs.length === 0 ? (
              <div className="px-3 py-3">
                <button onClick={() => setShowAdd(true)} className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl border-2 border-dashed border-[#E2E8F0] text-xs text-[#8FA4C8] hover:border-[#FF6A00] hover:text-[#FF6A00] transition-colors tap-highlight-fix">
                  <Plus className="w-3.5 h-3.5" /> Tambah langganan pertama
                </button>
              </div>
            ) : (
              <>
                <div className="divide-y divide-[#F2F4F7]">
                  {active.map((sub) => {
                    const days = getDaysUntil(sub.next_due_date);
                    const isSoon = days >= 0 && days <= 3;
                    const isOverdue = days < 0;
                    return (
                      <div key={sub.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="w-9 h-9 rounded-xl bg-[#F8FAFC] border border-[#F0F2F5] flex items-center justify-center text-base flex-shrink-0">
                          {sub.icon || "📦"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[#1A1A1A] truncate">{sub.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] font-bold text-[#FF6A00]">
                              {formatCurrency(sub.amount)}
                              <span className="font-normal text-[#8FA4C8]">{CYCLE_LABEL[sub.billing_cycle]}</span>
                            </span>
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                              isOverdue ? "bg-[#FF6B6B]/10 text-[#FF6B6B]" :
                              isSoon ? "bg-[#FF6A00]/10 text-[#FF6A00]" :
                              "bg-[#F2F4F7] text-[#8FA4C8]"
                            }`}>
                              {isOverdue ? `${Math.abs(days)}h lalu` : days === 0 ? "Hari ini!" : `${days}h lagi`}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => setConfirmSub(sub)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#00C9A7]/10 text-[#00C9A7] hover:bg-[#00C9A7]/20 transition-colors tap-highlight-fix text-[10px] font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Bayar
                          </button>
                          <button onClick={() => handleDelete(sub.id)} className="p-1.5 rounded-lg text-[#CBD5E0] hover:text-[#FF6B6B] hover:bg-[#FFF5F5] transition-colors tap-highlight-fix">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {subs.filter(s => s.status === "cancelled").length > 0 && (
                    <div className="px-4 py-2 bg-[#F8FAFC]">
                      <p className="text-[10px] text-[#8FA4C8] font-semibold">DIBATALKAN</p>
                    </div>
                  )}
                  {subs.filter(s => s.status === "cancelled").map((sub) => (
                    <div key={sub.id} className="flex items-center gap-3 px-4 py-2.5 opacity-40">
                      <div className="w-8 h-8 rounded-xl bg-[#F2F4F7] flex items-center justify-center text-sm flex-shrink-0">{sub.icon || "📦"}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#1A1A1A] truncate">{sub.name}</p>
                        <p className="text-[10px] text-[#8FA4C8]">{formatCurrency(sub.amount)}{CYCLE_LABEL[sub.billing_cycle]}</p>
                      </div>
                      <button onClick={() => handleDelete(sub.id)} className="p-1.5 text-[#CBD5E0] hover:text-[#FF6B6B] tap-highlight-fix">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="px-3 py-2.5 border-t border-[#F2F4F7]">
                  <button onClick={() => setShowAdd(true)} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 border-dashed border-[#E2E8F0] text-[10px] text-[#8FA4C8] hover:border-[#FF6A00] hover:text-[#FF6A00] transition-colors tap-highlight-fix">
                    <Plus className="w-3 h-3" /> Tambah Langganan
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {showAdd && <AddSubscriptionModal onClose={() => setShowAdd(false)} onSave={handleAdd} />}
      {confirmSub && (
        <ConfirmMarkDoneModal
          title={confirmSub.name}
          amount={confirmSub.amount}
          formatCurrency={formatCurrency}
          onConfirm={(accountId) => doMarkDone(confirmSub, accountId)}
          onClose={() => setConfirmSub(null)}
        />
      )}
    </>
  );
}