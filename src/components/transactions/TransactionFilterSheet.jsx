import { X } from "lucide-react";

const PRESETS = [
  ["today", "Hari ini"],
  ["7d", "7 Hari"],
  ["month", "Bulan ini"],
  ["lastmonth", "Bulan lalu"],
];

export default function TransactionFilterSheet({ open, onClose, dateFrom, dateTo, setDateFrom, setDateTo, onApplyPreset, hasActiveFilter, onReset }) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Bottom sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[70vh] overflow-y-auto">
        <div className="w-10 h-1 bg-[#E2E8F0] rounded-full mx-auto mt-3 mb-4" />

        <div className="px-5 pb-8 space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-base font-bold text-[#1A1A1A]">Filter Transaksi</p>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#F2F4F7] flex items-center justify-center tap-highlight-fix">
              <X className="w-4 h-4 text-[#8FA4C8]" />
            </button>
          </div>

          {/* Quick presets */}
          <div>
            <p className="text-[11px] font-semibold text-[#8FA4C8] uppercase tracking-widest mb-2">Periode Cepat</p>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => { onApplyPreset(key); onClose(); }}
                  className="py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-sm font-medium text-[#4A5568] hover:border-[#F97316] hover:text-[#F97316] transition-colors tap-highlight-fix"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom date range */}
          <div>
            <p className="text-[11px] font-semibold text-[#8FA4C8] uppercase tracking-widest mb-2">Rentang Kustom</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[11px] text-[#8FA4C8] mb-1">Dari Tanggal</p>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-[#F8FAFC]"
                />
              </div>
              <div>
                <p className="text-[11px] text-[#8FA4C8] mb-1">Sampai Tanggal</p>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-[#F8FAFC]"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {hasActiveFilter && (
              <button
                onClick={() => { onReset(); onClose(); }}
                className="flex-1 py-3 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-[#8FA4C8] tap-highlight-fix"
              >
                Reset
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-[#F97316] text-white text-sm font-bold tap-highlight-fix"
            >
              Terapkan
            </button>
          </div>
        </div>
      </div>
    </>
  );
}