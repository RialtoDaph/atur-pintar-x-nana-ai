import { useState, useEffect } from "react";
import { X, TrendingDown, Calendar, CreditCard, History } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAppSettings } from "@/components/utils/useAppSettings";

export default function DebtDetailModal({ debt, onClose }) {
  const { formatCurrency } = useAppSettings();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Transaction.filter({ debt_id: debt.id }, "-date", 50)
      .then(txs => setPayments(txs || []))
      .finally(() => setLoading(false));
  }, [debt.id]);

  const paid = debt.total_amount - debt.remaining_amount;
  const progress = debt.total_amount > 0 ? Math.min((paid / debt.total_amount) * 100, 100) : 0;
  const monthsLeft = debt.monthly_payment > 0 ? Math.ceil(debt.remaining_amount / debt.monthly_payment) : null;
  const totalPaidViaHistory = payments.reduce((s, t) => s + (t.amount || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F2F4F7]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF6B6B]/10 flex items-center justify-center text-xl">
              {debt.icon || "💳"}
            </div>
            <div>
              <p className="font-bold text-[#1A1A1A]">{debt.name}</p>
              <p className="text-xs text-[#8FA4C8]">{debt.interest_rate ? `${debt.interest_rate}% p.a.` : "Tanpa bunga"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[#F2F4F7]">
            <X className="w-5 h-5 text-[#8FA4C8]" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Progress */}
          <div className="bg-[#F8FAFC] rounded-2xl p-4">
            <div className="flex justify-between text-xs text-[#8FA4C8] mb-2">
              <span>Progress Pelunasan</span>
              <span className="font-bold text-[#00C9A7]">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-[#E2E8F0] rounded-full h-3 mb-3">
              <div className="h-3 rounded-full bg-[#00C9A7] transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-[#8FA4C8]">Total Utang Awal</p>
                <p className="font-bold text-sm text-[#1A1A1A]">{formatCurrency(debt.total_amount)}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#8FA4C8]">Sudah Dibayar</p>
                <p className="font-bold text-sm text-[#00C9A7]">{formatCurrency(paid)}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#8FA4C8]">Sisa Utang</p>
                <p className="font-bold text-sm text-[#FF6B6B]">{formatCurrency(debt.remaining_amount)}</p>
              </div>
              {debt.monthly_payment > 0 && (
                <div>
                  <p className="text-[10px] text-[#8FA4C8]">Cicilan/Bulan</p>
                  <p className="font-bold text-sm text-[#1A1A1A]">{formatCurrency(debt.monthly_payment)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Est. payoff + due date */}
          {(monthsLeft || debt.due_date) && (
            <div className="grid grid-cols-2 gap-3">
              {monthsLeft && (
                <div className="bg-[#4F7CFF]/10 rounded-2xl p-3 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-[#4F7CFF] flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-[#4F7CFF]">Estimasi Lunas</p>
                    <p className="text-sm font-bold text-[#1A1A1A]">{monthsLeft} bulan lagi</p>
                  </div>
                </div>
              )}
              {debt.due_date && (
                <div className="bg-[#F5A623]/10 rounded-2xl p-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#F5A623] flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-[#F5A623]">Jatuh Tempo</p>
                    <p className="text-sm font-bold text-[#1A1A1A]">
                      {new Date(debt.due_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Payment history */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <History className="w-4 h-4 text-[#8FA4C8]" />
              <p className="text-sm font-bold text-[#1A1A1A]">Riwayat Pembayaran</p>
              <span className="ml-auto text-xs text-[#8FA4C8]">Total: {formatCurrency(totalPaidViaHistory)}</span>
            </div>
            {loading ? (
              <div className="space-y-2">
                {[1, 2].map(i => <div key={i} className="h-12 bg-[#F2F4F7] rounded-xl animate-pulse" />)}
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-6 text-[#8FA4C8] text-sm">
                <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-40" />
                Belum ada riwayat pembayaran
              </div>
            ) : (
              <div className="space-y-2">
                {payments.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between bg-[#F8FAFC] rounded-xl px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-[#1A1A1A]">{formatCurrency(tx.amount)}</p>
                      <p className="text-xs text-[#8FA4C8]">{tx.note || "Pembayaran cicilan"}</p>
                    </div>
                    <p className="text-xs text-[#8FA4C8]">
                      {new Date(tx.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}