import { TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import { useAppSettings } from "@/components/utils/useAppSettings";

export default function BalanceCard({ income, expense, savings, loading }) {
  const { formatCurrency, t } = useAppSettings();
  const balance = income - expense;

  if (loading) {
    return (
      <div className="bg-[#0A0A0A] rounded-2xl p-5 animate-pulse h-36" />
    );
  }

  return (
    <div data-tour="balance-card" className="bg-[#161616] rounded-2xl p-4 border border-[#222]">
      <p className="text-[#8FA4C8] text-xs font-semibold uppercase tracking-widest mb-1">{t('balance_card_title')}</p>
      <p className={`text-3xl font-bold mb-4 ${balance >= 0 ? "text-white" : "text-red-400"}`}>
        {balance >= 0 ? "" : "-"}{formatCurrency(Math.abs(balance))}
      </p>

      <div className="border-t border-[#2d2d2d] mb-3"></div>

      <div className="grid grid-cols-3 gap-2">
        <div className="flex items-center gap-2">
          <div className="bg-green-500/40 rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4 h-4 text-[#99ff80]" />
          </div>
          <div>
            <p className="text-[#8FA4C8] text-[9px]">{t('income_label')}</p>
            <p className="text-white text-xs font-semibold">{formatCurrency(income)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-red-500/40 rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0">
            <TrendingDown className="w-4 h-4 text-[#ff6666]" />
          </div>
          <div>
            <p className="text-[#8FA4C8] text-[9px]">{t('expense_label')}</p>
            <p className="text-white text-xs font-semibold">{formatCurrency(expense)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-blue-500/40 rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0">
            <PiggyBank className="w-4 h-4 text-[#80b3ff]" />
          </div>
          <div>
            <p className="text-[#8FA4C8] text-[9px]">{t('savings_label')}</p>
            <p className="text-white text-xs font-semibold">{formatCurrency(savings)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}