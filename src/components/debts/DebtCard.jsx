import { useState, useEffect, useRef } from "react";
import { MoreVertical, Pencil, Trash2, CheckCircle } from "lucide-react";
import { useAppSettings } from "@/components/utils/useAppSettings";

export default function DebtCard({ debt, type, onPay, onEdit, onMarkPaid, onDelete, onOpenDetail }) {
  const { t, formatCurrency } = useAppSettings();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const rawPercent = debt.total_amount > 0 ? ((debt.total_amount - debt.remaining_amount) / debt.total_amount) * 100 : 0;
  const percent = Math.min(Math.max(rawPercent, 0), 100);
  const monthsLeft = debt.monthly_payment > 0 ? Math.ceil(debt.remaining_amount / debt.monthly_payment) : null;

  // Color logic mirrors BudgetCard: green when on-track, yellow/orange when nearing
  const barColor = percent >= 85 ? "#22C55E" : percent >= 50 ? "#4F7CFF" : "#F97316";

  // Close popover on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [menuOpen]);

  const dueLabel = debt.due_date
    ? new Date(debt.due_date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
    : null;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-transparent">
      {/* Header: icon + name + actions */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => onOpenDetail(debt)}
          className="flex items-center gap-3 flex-1 min-w-0 text-left tap-highlight-fix"
        >
          <div className="w-10 h-10 rounded-full bg-[#FF6B6B]/10 flex items-center justify-center text-xl flex-shrink-0">
            {debt.icon || type.emoji}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-[#1A1A1A] truncate">{debt.name}</p>
            <p className="text-xs text-[#8FA4C8] truncate">
              {type.label}{debt.interest_rate ? ` · ${debt.interest_rate}% p.a.` : ""}
            </p>
          </div>
        </button>

        {/* Single overflow menu replaces 4 small icons */}
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#8FA4C8] hover:bg-[#F2F4F7] transition-colors tap-highlight-fix"
            aria-label="Menu"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-9 z-20 w-44 bg-white rounded-xl shadow-lg border border-[#E2E8F0] py-1 overflow-hidden">
              <button
                onClick={() => { setMenuOpen(false); onEdit(debt); }}
                className="w-full px-3 py-2 text-left text-sm text-[#1A1A1A] hover:bg-[#F8FAFC] flex items-center gap-2"
              >
                <Pencil className="w-4 h-4 text-[#8FA4C8]" /> Edit
              </button>
              <button
                onClick={() => { setMenuOpen(false); onMarkPaid(debt); }}
                className="w-full px-3 py-2 text-left text-sm text-[#1A1A1A] hover:bg-[#F8FAFC] flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4 text-[#00C9A7]" /> {t('debts_mark_paid_title')}
              </button>
              <button
                onClick={() => { setMenuOpen(false); onDelete(debt.id); }}
                className="w-full px-3 py-2 text-left text-sm text-[#FF6B6B] hover:bg-[#FFF5F5] flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> {t('alerts_delete')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Key info: sisa utang prominent + cicilan secondary (1 baris ringkas) */}
      <div className="flex items-end justify-between mb-3">
        <div className="min-w-0">
          <p className="text-[11px] text-[#8FA4C8] mb-0.5">{t('debts_remaining')}</p>
          <p className="font-bold text-lg text-[#1A1A1A] truncate">{formatCurrency(debt.remaining_amount)}</p>
          <p className="text-[11px] text-[#8FA4C8] mt-0.5">dari {formatCurrency(debt.total_amount)}</p>
        </div>
        {debt.monthly_payment > 0 && (
          <div className="text-right ml-3 flex-shrink-0">
            <p className="text-[11px] text-[#8FA4C8] mb-0.5">{t('debts_installment')}</p>
            <p className="font-semibold text-sm text-[#1A1A1A]">{formatCurrency(debt.monthly_payment)}<span className="text-[#8FA4C8] font-normal">/bln</span></p>
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="w-full bg-[#F2F4F7] rounded-full h-2 mb-1.5">
        <div className="h-2 rounded-full transition-all" style={{ width: `${percent}%`, backgroundColor: barColor }} />
      </div>
      <div className="flex justify-between items-center text-[11px] text-[#8FA4C8] mb-3">
        <span>{Math.round(rawPercent)}% terbayar{monthsLeft ? ` · ~${monthsLeft} bln lagi` : ""}</span>
        {dueLabel && <span>Jatuh tempo {dueLabel}</span>}
      </div>

      {/* Primary CTA — bayar cicilan */}
      <button
        onClick={() => onPay(debt.id)}
        className="w-full py-2.5 rounded-xl bg-[#F97316] text-white text-sm font-semibold hover:bg-[#EA580C] active:scale-[0.99] transition-all tap-highlight-fix"
      >
        Bayar Cicilan
      </button>
    </div>
  );
}