import { useState } from "react";
import { X, ShieldAlert, Loader2 } from "lucide-react";
import useLockBodyScroll from "@/hooks/useLockBodyScroll";
import { base44 } from "@/api/base44Client";
import { useAppSettings } from "@/components/utils/useAppSettings";

export default function AnomalySecurityModal({ anomaly, transactions, onClose, onConfirm }) {
  useLockBodyScroll();
  const { formatCurrency } = useAppSettings();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Find recent transactions in this category
  const now = new Date();
  const recentTxs = (transactions || [])
    .filter(t => {
      if (t.type !== "expense" || t.category !== anomaly.category) return false;
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await base44.functions.invoke("alertSensitiveAccess", {
        type: "anomaly_flagged",
        category: anomaly.label,
        amount: anomaly.current,
        pctIncrease: anomaly.pctIncrease,
      }).catch(() => {});
      setSubmitted(true);
      setTimeout(() => {
        onConfirm?.();
        onClose();
      }, 1500);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl overflow-y-auto overscroll-contain" style={{ maxHeight: "92dvh" }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#F2F4F7]">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#FF6B6B]" />
            <p className="font-bold text-[#1A1A1A] text-sm">Tinjau Anomali</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-[#F2F4F7] rounded-lg"><X className="w-4 h-4 text-[#8FA4C8]" /></button>
        </div>

        <div className="px-5 py-5 space-y-4">
          <div className="bg-[#FFF5F0] rounded-xl p-4 border border-[#FF6A00]/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{anomaly.emoji}</span>
              <p className="text-sm font-bold text-[#1A1A1A]">{anomaly.label}</p>
            </div>
            <p className="text-xs text-[#8FA4C8]">
              Pengeluaran bulan ini <span className="font-semibold text-[#FF6B6B]">{formatCurrency(anomaly.current)}</span>
              {!anomaly.isNew && (
                <> — naik <span className="font-semibold text-[#FF6A00]">{anomaly.pctIncrease}%</span> dari rata-rata.</>
              )}
            </p>
          </div>

          {recentTxs.length > 0 && (
            <div>
              <p className="text-[11px] text-[#8FA4C8] mb-2 font-semibold uppercase tracking-wide">Transaksi terbaru di kategori ini</p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {recentTxs.map(t => (
                  <div key={t.id} className="flex items-center justify-between bg-[#F8FAFC] rounded-lg px-3 py-2 border border-[#E2E8F0]">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#1A1A1A] truncate">{t.note || "Tanpa catatan"}</p>
                      <p className="text-[10px] text-[#8FA4C8]">{t.date}</p>
                    </div>
                    <p className="text-xs font-bold text-[#FF6B6B]">{formatCurrency(t.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {submitted ? (
            <div className="flex items-center justify-center gap-2 py-3 text-sm text-[#00C9A7] font-semibold">
              ✅ Laporan terkirim. Tim Atur Pintar akan meninjau.
            </div>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-[#FF6B6B] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#E55050] transition-colors"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
              {submitting ? "Mengirim laporan..." : "Lapor sebagai mencurigakan"}
            </button>
          )}

          <p className="text-[10px] text-[#8FA4C8] text-center">
            Jika kamu yakin transaksi-transaksi di atas BUKAN milikmu, segera ubah password & cek rekening.
          </p>
        </div>
      </div>
    </div>
  );
}