import { useState } from "react";
import { X, ShoppingCart, TrendingDown } from "lucide-react";
import useLockBodyScroll from "@/hooks/useLockBodyScroll";
import { useAppSettings } from "@/components/utils/useAppSettings";

function parseNum(str) {
  return parseInt(String(str).replace(/[^0-9]/g, ""), 10) || 0;
}

export default function InvestmentTransactionModal({ investment, type, onClose, onSave }) {
  useLockBodyScroll();
  const { settings, formatNumber, formatCurrency } = useAppSettings();
  const currencySymbol = settings?.currency_symbol || "Rp";
  const today = new Date().toISOString().split("T")[0];
  const [amountDisplay, setAmountDisplay] = useState("");
  const [date, setDate] = useState(today);
  const [saving, setSaving] = useState(false);

  const isBuy = type === "buy";
  const color = isBuy ? "#00C9A7" : "#FF6B6B";
  const label = isBuy ? "Beli" : "Jual";
  const Icon = isBuy ? ShoppingCart : TrendingDown;

  async function handleSave() {
    const amount = parseNum(amountDisplay);
    if (!amount || amount <= 0) return;
    if (date > today) return;
    setSaving(true);
    try {
      await onSave(amount, date);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[90] bg-black/50 sm:backdrop-blur-sm" onClick={onClose} />
      {/* Floating popup — same pattern as AddTransactionModal */}
      <div
        className="fixed z-[100] pointer-events-none flex justify-center sm:inset-0 sm:items-center"
        style={{
          left: 0,
          right: 0,
          bottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
          top: '64px'
        }}>
        <div role="dialog" aria-modal="true" className="bg-white rounded-3xl shadow-2xl p-6 overflow-y-auto overscroll-contain pointer-events-auto animate-slide-up-sheet w-[calc(100%-24px)] sm:w-full sm:max-w-md" style={{ maxHeight: '100%', paddingBottom: 'calc(1.5rem + max(16px, env(safe-area-inset-bottom)))' }} onClick={e => e.stopPropagation()}>
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
              Nominal ({currencySymbol})
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#8FA4C8]">{currencySymbol}</span>
              <input
                type="text"
                inputMode="numeric"
                value={amountDisplay}
                onChange={e => {
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  setAmountDisplay(raw === "" ? "" : formatNumber(Number(raw)));
                }}
                placeholder="0"
                autoFocus
                className="w-full pl-10 pr-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm font-semibold text-[#1A1A1A] outline-none focus:ring-2 focus:ring-[#F97316]/30"
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">Tanggal Transaksi</label>
            <input
              type="date"
              value={date}
              max={today}
              onChange={e => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#1A1A1A] outline-none focus:ring-2 focus:ring-[#F97316]/30"
            />
            {date > today && (
              <p className="text-xs text-[#FF6B6B] mt-1">Tanggal tidak boleh di masa depan</p>
            )}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !parseNum(amountDisplay) || date > today}
          className="w-full py-3.5 rounded-xl font-bold text-sm text-white disabled:opacity-40 transition-colors"
          style={{ backgroundColor: color }}
        >
          {saving ? "Menyimpan..." : `${label} ${amountDisplay ? formatCurrency(parseNum(amountDisplay)) : ""}`}
        </button>
        </div>
      </div>
    </>
  );
}