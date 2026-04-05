import { useState } from "react";
import { X } from "lucide-react";
import { useAppSettings } from "@/components/utils/useAppSettings";
import { parseRupiah } from "@/components/utils/parseRupiah";

export default function AddTransactionModal({ type, onClose, onSave, maxWithdrawal }) {
  const { formatCurrency, settings } = useAppSettings();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const isDeposit = type === "deposit";
  const max = !isDeposit ? maxWithdrawal : Infinity;

  const sep = settings?.thousand_separator || ".";
  function formatAmount(val) {
    if (!val) return "";
    const cleaned = String(val).replace(/[^0-9]/g, "");
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
  }
  function handleAmountChange(e) {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setAmount(raw);
  }

  async function handleSave() {
    const val = parseFloat(amount.replace(/[^0-9]/g, ""));
    if (!val || val <= 0) return;
    if (!isDeposit && val > max) return;
    setSaving(true);
    await onSave(val, type, note);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm shadow-2xl p-6" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-[#1A1A1A]">
            {isDeposit ? "Tambah Dana" : "Tarik Dana"}
          </h2>
          <button onClick={onClose} className="text-[#9B9B9B] hover:text-[#1A1A1A] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount input */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-[#9B9B9B] uppercase tracking-widest mb-2 block">Nominal</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9B9B9B] font-medium text-sm">{settings?.currency_symbol || "Rp"}</span>
            <input
              autoFocus
              type="text"
              inputMode="numeric"
              min="0"
              className="w-full border border-[#EFEFED] rounded-xl pl-10 pr-4 py-3.5 text-xl font-bold text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] bg-[#F7F6F3]"
              placeholder="0"
              value={formatAmount(amount)}
              onChange={handleAmountChange} />
            
          </div>
          {!isDeposit &&
          <p className="text-xs text-[#9B9B9B] mt-1">Tersedia: {formatCurrency(maxWithdrawal)}</p>
          }
        </div>

        <div className="mb-6">
          <label className="text-xs font-semibold text-[#9B9B9B] uppercase tracking-widest mb-2 block">Catatan (opsional)</label>
          <input
            className="w-full border border-[#EFEFED] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] bg-[#F7F6F3]"
            placeholder={isDeposit ? "Misal: Tabungan bulanan" : "Misal: Pengeluaran darurat"}
            value={note}
            onChange={(e) => setNote(e.target.value)} />
          
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !amount || parseFloat(amount.replace(/[^0-9]/g, "")) <= 0 || !isDeposit && parseFloat(amount.replace(/[^0-9]/g, "")) > max}
          className="w-full py-3.5 rounded-xl font-semibold text-sm disabled:opacity-40 transition-colors"
          style={{
            backgroundColor: isDeposit ? "#1A1A1A" : "#FF5252",
            color: "white"
          }}>
          
          {saving ? "Menyimpan..." : isDeposit ? "Tambah Dana" : "Tarik Dana"}
        </button>
      </div>
    </div>);

}