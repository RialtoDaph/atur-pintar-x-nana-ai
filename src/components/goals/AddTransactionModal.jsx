import { useState } from "react";
import { X } from "lucide-react";

export default function AddTransactionModal({ type, onClose, onSave, maxWithdrawal }) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const isDeposit = type === "deposit";
  const max = !isDeposit ? maxWithdrawal : Infinity;

  async function handleSave() {
    const val = parseFloat(amount);
    if (!val || val <= 0) return;
    if (!isDeposit && val > max) return;
    setSaving(true);
    await onSave(val, type, note);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-[#1A1A1A]">
            {isDeposit ? "Add Money" : "Withdraw"}
          </h2>
          <button onClick={onClose} className="text-[#9B9B9B] hover:text-[#1A1A1A] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount input */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-[#9B9B9B] uppercase tracking-widest mb-2 block">Amount ($)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9B9B9B] font-medium">$</span>
            <input
              autoFocus
              type="number"
              min="0"
              max={!isDeposit ? maxWithdrawal : undefined}
              className="w-full border border-[#EFEFED] rounded-xl pl-8 pr-4 py-3.5 text-xl font-bold text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] bg-[#F7F6F3]"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          {!isDeposit && (
            <p className="text-xs text-[#9B9B9B] mt-1">Available: ${maxWithdrawal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
          )}
        </div>

        <div className="mb-6">
          <label className="text-xs font-semibold text-[#9B9B9B] uppercase tracking-widest mb-2 block">Note (optional)</label>
          <input
            className="w-full border border-[#EFEFED] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] bg-[#F7F6F3]"
            placeholder={isDeposit ? "e.g. Monthly savings" : "e.g. Emergency expense"}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !amount || parseFloat(amount) <= 0 || (!isDeposit && parseFloat(amount) > max)}
          className="w-full py-3.5 rounded-xl font-semibold text-sm disabled:opacity-40 transition-colors"
          style={{
            backgroundColor: isDeposit ? "#1A1A1A" : "#FF5252",
            color: "white",
          }}
        >
          {saving ? "Saving..." : isDeposit ? "Add Money" : "Withdraw"}
        </button>
      </div>
    </div>
  );
}