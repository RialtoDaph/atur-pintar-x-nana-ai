import { TrendingUp, TrendingDown } from "lucide-react";
import { useAppSettings } from "@/components/utils/AppSettingsContext";

export default function PerformanceMetrics({ investments, totalValue, totalInvested, formatCurrency }) {
  const { t } = useAppSettings();
  const totalGain = totalValue - totalInvested;
  const gainPercent = totalInvested > 0 ? ((totalGain / totalInvested) * 100).toFixed(2) : 0;
  
  // Annualized return — hanya pakai investasi yang punya purchase_date valid
  const validInvestments = investments.filter(inv => inv.purchase_date);
  const avgInvDate = validInvestments.length > 0 
    ? validInvestments.reduce((sum, inv) => sum + new Date(inv.purchase_date).getTime(), 0) / validInvestments.length
    : null;
  const daysInvested = avgInvDate ? (new Date().getTime() - avgInvDate) / (1000 * 60 * 60 * 24) : 0;
  const yearsInvested = Math.max(daysInvested / 365, 0.1);
  const annualizedReturn = totalInvested > 0 && avgInvDate
    ? (((totalValue / totalInvested) ** (1 / yearsInvested) - 1) * 100).toFixed(2)
    : null;

  // Diversification score by type (HHI-based: semakin merata semakin tinggi)
  const byType = {};
  investments.forEach(inv => {
    const key = inv.type || "lainnya";
    byType[key] = (byType[key] || 0) + (inv.current_value || 0);
  });
  const typeCount = Object.keys(byType).length;
  const diversificationScore = Math.min((typeCount / 7) * 100, 100).toFixed(0);

  const isPositive = totalGain >= 0;
  const isAnnualizedPositive = annualizedReturn !== null && parseFloat(annualizedReturn) >= 0;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/10 rounded-2xl p-4">
          <p className="text-white/60 text-xs font-medium mb-1">ROI</p>
          <div className="flex items-center gap-2">
            {isPositive ? <TrendingUp className="w-4 h-4 text-[#00C9A7]" /> : <TrendingDown className="w-4 h-4 text-[#FF6B6B]" />}
            <p className={`font-bold text-lg ${isPositive ? "text-[#00C9A7]" : "text-[#FF6B6B]"}`}>
              {isPositive ? "+" : ""}{gainPercent}%
            </p>
          </div>
        </div>

        <div className="bg-white/10 rounded-2xl p-4">
          <p className="text-white/60 text-xs font-medium mb-1">{t('annualized_return') || 'Annualized Return'}</p>
          {annualizedReturn !== null ? (
            <div className="flex items-center gap-2">
              {isAnnualizedPositive ? <TrendingUp className="w-4 h-4 text-[#00C9A7]" /> : <TrendingDown className="w-4 h-4 text-[#FF6B6B]" />}
              <p className={`font-bold text-lg ${isAnnualizedPositive ? "text-[#00C9A7]" : "text-[#FF6B6B]"}`}>
                {isAnnualizedPositive ? "+" : ""}{annualizedReturn}%
              </p>
            </div>
          ) : (
            <p className="text-white/40 text-sm">{t('no_purchase_date') || 'N/A'}</p>
          )}
        </div>

        <div className="bg-white/10 rounded-2xl p-4">
          <p className="text-white/60 text-xs font-medium mb-1">{t('diversification') || 'Diversifikasi'}</p>
          <div className="flex items-center gap-2">
            <p className="font-bold text-lg text-[#FF6A00]">{diversificationScore}%</p>
            <span className="text-xs text-white/60">({typeCount}/7)</span>
          </div>
        </div>

        <div className="bg-white/10 rounded-2xl p-4">
          <p className="text-white/60 text-xs font-medium mb-1">{t('profit_loss') || 'Total Gain/Loss'}</p>
          <p className={`font-bold text-lg ${isPositive ? "text-[#00C9A7]" : "text-[#FF6B6B]"}`}>
            {formatCurrency(totalGain)}
          </p>
        </div>
      </div>
    </div>
  );
}