import { useState, useEffect } from "react";
import { X, PiggyBank } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAppSettings } from "@/components/utils/useAppSettings";
import useLockBodyScroll from "@/hooks/useLockBodyScroll";

export default function AddSavingsModal({ goal, onClose, onSave }) {
  useLockBodyScroll();
  const { formatCurrency } = useAppSettings();
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState(`Tabungan ${goal.name}`);
  const [accounts, setAccounts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    base44.auth.me().then(u =>
      base44.entities.Account.filter({ created_by: u.email }).then(list => {
        setAccounts(list || []);
        const def = (list || []).find(a => a.is_default) || (list || [])[0];
        if (def) setAccountId(def.id);
      })
    ).catch(() => {});
  }, []);

  function parseAmt(val) { return parseInt(String(val).replace(/\D/g, ""), 10) || 0; }
  function fmtAmt(val) { const n = parseAmt(val); return n > 0 ? n.toLocaleString("id-ID") : ""; }

  async function handleSave() {
    const parsed = parseAmt(amount);
    if (!parsed || parsed <= 0) { setError("Masukkan nominal yang valid."); return; }
    if (!accountId) { setError("Pilih rekening sumber."); return; }
    const acc = accounts.find(a => a.id === accountId);
    if (acc && (acc.balance || 0) < parsed) {
      const ok = window.confirm(`⚠️ Saldo ${acc.name} tidak mencukupi (${formatCurrency(acc.balance || 0)}). Tetap lanjutkan?`);
      if (!ok) return;
    }
    setSaving(true);
    setError("");
    await onSave({ amount: parsed, accountId, date, note });
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-sm shadow-2xl p-6 max-h-[88vh] sm:max-h-[90vh] overflow-y-auto overscroll-contain animate-slide-up-sheet" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00C9A7]/10 flex items-center justify-center text-xl">
              {goal.icon || "💰"}
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1A1A1A]">Tambah Dana</h2>
              <p className="text-xs text-[#8FA4C8]">{goal.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[#F2F4F7]">
            <X className="w-5 h-5 text-[#8FA4C8]" />
          </button>
        </div>

        <div className="bg-[#F8FAFC] rounded-2xl p-3 mb-4 flex justify-between text-xs text-[#8FA4C8]">
          <span>Sudah terkumpul</span>
          <span className="font-bold text-[#00C9A7]">{formatCurrency(goal.current_amount || 0)} / {formatCurrency(goal.target_amount)}</span>
        </div>

        {error && <p className="text-xs text-red-500 mb-3 font-medium">{error}</p>}

        <div className="space-y-3 mb-5">
          <div>
            <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">Nominal (Rp)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8FA4C8]">Rp</span>
              <input type="text" inputMode="numeric" placeholder="0"
                className="w-full border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-3 text-lg font-bold text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]"
                value={fmtAmt(amount)}
                onChange={e => setAmount(parseAmt(e.target.value))} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">Rekening Sumber</label>
            {accounts.length === 0 ? (
              <p className="text-xs text-[#8FA4C8] italic">Belum ada rekening. Tambahkan di halaman Rekening.</p>
            ) : (
              <div className="flex gap-2 flex-wrap">
                {accounts.map(acc => (
                  <button key={acc.id} onClick={() => setAccountId(acc.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      accountId === acc.id ? "bg-[#FF6A00] text-white border-[#FF6A00]" : "bg-[#F2F4F7] text-[#4A5568] border-transparent"
                    }`}>
                    {acc.icon || "💳"} {acc.name}
                    <span className={accountId === acc.id ? "text-white/80" : "text-[#8FA4C8]"}>
                      ({formatCurrency(acc.balance || 0)})
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">Tanggal</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]" />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">Catatan</label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)}
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]" />
          </div>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-[#00C9A7] hover:bg-[#00b395] transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
          <PiggyBank className="w-4 h-4" />
          {saving ? "Menyimpan..." : "Tambah Dana"}
        </button>
      </div>
    </div>
  );
}