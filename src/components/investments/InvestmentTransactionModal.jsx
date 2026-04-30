import { useState } from "react";
import { X, ShoppingCart, TrendingDown } from "lucide-react";

function formatRupiah(n) {
  if (!n) return "";
  return Number(n).toLocaleString("id-ID");
}

function parseNum(str) {
  return parseInt(String(str).replace(/[^0-9]/g, ""), 10) || 0;
}

export default function InvestmentTransactionModal({ investment, type, onClose, onSave }) {
  const [amountDisplay, setAmountDisplay] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);

  const isBuy = type === "buy";
  const color = isBuy ? "#00C9A7" : "#FF6B6B";
  const label = isBuy ? "Beli" : "Jual";
  const Icon = isBuy ? ShoppingCart : TrendingDown;

  async function handleSave() {
    const amount = parseNum(amountDisplay);
    if (!amount || amount <= 0) return;
    setSaving(true);
    try {
      await onSave(amount, date);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: color + "20" }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div>
              <p className="font-bold text-[#1A1A1A]">{label}</p>
              <p className="text-xs text-[#8FA4C8]">{investment.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#9B9B9B] hover:text-[#1A1A1A]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          {/* Amount */}
          <div>
            <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">
              Nominal (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#8FA4C8]">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                value={amountDisplay}
                onChange={e => {
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  setAmountDisplay(raw === "" ? "" : Number(raw).toLocaleString("id-ID"));
                }}
                placeholder="0"
                autoFocus
                className="w-full pl-10 pr-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm font-semibold text-[#1A1A1A] outline-none focus:ring-2 focus:ring-[#FF6A00]/30"
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">Tanggal Transaksi</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#1A1A1A] outline-none focus:ring-2 focus:ring-[#FF6A00]/30"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !parseNum(amountDisplay)}
          className="w-full py-3.5 rounded-xl font-bold text-sm text-white disabled:opacity-40 transition-colors"
          style={{ backgroundColor: color }}
        >
          {saving ? "Menyimpan..." : `${label} ${amountDisplay ? "Rp " + amountDisplay : ""}`}
        </button>
      </div>
    </div>
  );
}