import { useState } from "react";
import { X, Check, Loader2 } from "lucide-react";

export default function AddSharedTxModal({ wallet, user, onClose, onSave }) {
  const [form, setForm] = useState({ type: "expense", amount: "", note: "", date: new Date().toISOString().split("T")[0] });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form.amount || isNaN(parseFloat(form.amount))) return;
    setSaving(true);
    const amount = parseFloat(form.amount);
    await onSave({
      wallet_id: wallet.id,
      type: form.type,
      amount,
      note: form.note,
      date: form.date,
      paid_by_email: user.email,
      paid_by_name: user.full_name || user.email.split("@")[0]
    });
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#F2F4F7]">
          <p className="font-bold text-[#1A1A1A]">Tambah Transaksi</p>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[#F2F4F7]"><X className="w-5 h-5 text-[#8FA4C8]" /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {["expense", "income"].map((tp) => (
              <button
                key={tp}
                onClick={() => setForm((f) => ({ ...f, type: tp }))}
                className={`py-2.5 rounded-xl text-sm font-bold transition-colors ${form.type === tp ?
                  tp === "income" ? "bg-green-500 text-white" : "bg-red-500 text-white" :
                  "bg-[#F2F4F7] text-[#8FA4C8]"}`}>
                {tp === "income" ? "💰 Pemasukan" : "💸 Pengeluaran"}
              </button>
            ))}
          </div>
          <input
            type="number"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            placeholder="Jumlah (Rp)"
            className="w-full px-4 py-3 bg-[#F2F4F7] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#F97316]/30" />
          <input
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            placeholder="Catatan (opsional)"
            className="w-full px-4 py-3 bg-[#F2F4F7] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#F97316]/30" />
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className="w-full px-4 py-3 bg-[#F2F4F7] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#F97316]/30" />
        </div>
        <div className="px-5 pb-6" style={{ paddingBottom: 'calc(1.5rem + max(0px, env(safe-area-inset-bottom)))' }}>
          <button
            onClick={handleSave}
            disabled={saving || !form.amount}
            className="w-full py-3.5 bg-[#F97316] text-white rounded-2xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Simpan Transaksi
          </button>
        </div>
      </div>
    </div>
  );
}