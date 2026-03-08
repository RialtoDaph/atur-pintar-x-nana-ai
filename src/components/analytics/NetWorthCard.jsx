import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useAppSettings } from "@/components/utils/useAppSettings";

export default function NetWorthCard({ goals, investments, debts, transactions }) {
  const { formatCurrency } = useAppSettings();

  // Assets
  const totalSavings = goals.reduce((s, g) => s + (g.current_amount || 0), 0);
  const totalInvestments = investments.reduce((s, i) => s + (i.current_value || 0), 0);

  // Cash on hand: sum of all income - expenses
  const cashBalance = transactions.reduce((s, tx) => {
    if (tx.type === "income") return s + tx.amount;
    if (tx.type === "expense") return s - tx.amount;
    return s;
  }, 0);

  const totalAssets = Math.max(cashBalance, 0) + totalSavings + totalInvestments;

  // Liabilities
  const totalDebts = debts.filter(d => d.status === "active").reduce((s, d) => s + (d.remaining_amount || 0), 0);

  const netWorth = totalAssets - totalDebts;
  const isPositive = netWorth >= 0;

  // Financial Health Score (0-100)
  let score = 50;
  if (totalAssets > 0) {
    const debtRatio = totalDebts / totalAssets;
    if (debtRatio < 0.2) score += 20;
    else if (debtRatio < 0.4) score += 10;
    else if (debtRatio > 0.8) score -= 20;

    const invRatio = totalInvestments / totalAssets;
    if (invRatio > 0.3) score += 15;
    else if (invRatio > 0.1) score += 7;

    if (totalSavings > 0) score += 10;
    if (cashBalance > 0) score += 5;
  }
  score = Math.max(10, Math.min(100, score));

  const scoreLabel = score >= 80 ? { label: "Sangat Baik", color: "#00C9A7" }
    : score >= 60 ? { label: "Baik", color: "#4F7CFF" }
    : score >= 40 ? { label: "Cukup", color: "#F5A623" }
    : { label: "Perlu Perhatian", color: "#FF6B6B" };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-bold text-[#0A0A0A] text-base">Kekayaan Bersih</h2>
          <p className="text-xs text-[#8FA4C8] mt-0.5">Aset dikurangi utang aktif</p>
        </div>
        <div className="text-right">
          <div className={`text-xs font-bold px-3 py-1.5 rounded-full`} style={{ backgroundColor: scoreLabel.color + "20", color: scoreLabel.color }}>
            Skor {score} · {scoreLabel.label}
          </div>
        </div>
      </div>

      {/* Net Worth Big Number */}
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${isPositive ? "bg-[#00C9A7]/10" : "bg-[#FF6B6B]/10"}`}>
          {isPositive
            ? <TrendingUp className="w-6 h-6 text-[#00C9A7]" />
            : <TrendingDown className="w-6 h-6 text-[#FF6B6B]" />
          }
        </div>
        <div>
          <p className="text-xs text-[#8FA4C8] font-medium">Total Kekayaan Bersih</p>
          <p className={`text-2xl font-bold ${isPositive ? "text-[#00C9A7]" : "text-[#FF6B6B]"}`}>
            {isPositive ? "" : "-"}{formatCurrency(Math.abs(netWorth))}
          </p>
        </div>
      </div>

      {/* Health score bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs text-[#8FA4C8]">Skor Kesehatan Finansial</p>
          <p className="text-xs font-bold" style={{ color: scoreLabel.color }}>{score}/100</p>
        </div>
        <div className="h-2 bg-[#F2F4F7] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${score}%`, backgroundColor: scoreLabel.color }}
          />
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#F8FAFC] rounded-xl p-3 text-center">
          <p className="text-[10px] text-[#8FA4C8] mb-1">Tabungan</p>
          <p className="text-xs font-bold text-[#1A1A1A]">{formatCurrency(totalSavings)}</p>
        </div>
        <div className="bg-[#F8FAFC] rounded-xl p-3 text-center">
          <p className="text-[10px] text-[#8FA4C8] mb-1">Investasi</p>
          <p className="text-xs font-bold text-[#1A1A1A]">{formatCurrency(totalInvestments)}</p>
        </div>
        <div className="bg-[#FF6B6B]/5 rounded-xl p-3 text-center">
          <p className="text-[10px] text-[#8FA4C8] mb-1">Utang Aktif</p>
          <p className="text-xs font-bold text-[#FF6B6B]">-{formatCurrency(totalDebts)}</p>
        </div>
      </div>
    </div>
  );
}