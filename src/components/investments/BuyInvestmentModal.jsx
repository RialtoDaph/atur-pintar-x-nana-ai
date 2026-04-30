import { useState } from "react";
import { X, ShoppingCart } from "lucide-react";

export default function BuyInvestmentModal({ investment, onClose, onSave }) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const val = parseFloat(amount);
    if (!val || val <= 0) return;
    setSaving(true);
    await onSave({
      investment_id: investment.id,
      type: "buy",
      total_amount: val,
      transaction_date: date,
    });
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#00C9A7]/10 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-[#00C9A7]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1A1A1A]">Beli</h2>
              <p className="text-xs text-[#8FA4C8]">{investment.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#9B9B9B] hover:text-[#1A1A1A]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">Nominal Beli (Rp)</label>
            <input
              type="number"
              min="0"
              placeholder="0"
              autoFocus
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#00C9A7] bg-[#F8FAFC]"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">Tanggal</label>
            <input
              type="date"
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#00C9A7] bg-[#F8FAFC]"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !parseFloat(amount) > 0}
          className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-[#00C9A7] disabled:opacity-40 hover:bg-[#00b094] transition-colors"
        >
          {saving ? "Menyimpan..." : "Catat Pembelian"}
        </button>
      </div>
    </div>
  );
}