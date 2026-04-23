import { TrendingUp, TrendingDown, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useAppSettings } from "@/components/utils/useAppSettings";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

function formatNetWorth(value, formatCurrency, formatShortNumber) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return formatShortNumber(value);
  return (value < 0 ? "-" : "") + formatCurrency(abs);
}

export default function NetWorthCard({ goals, investments, debts, transactions, periodSubtitle }) {
  const { formatCurrency, formatShortNumber } = useAppSettings();
  const [expanded, setExpanded] = useState(true);

  // Assets
  const totalSavings = goals.reduce((s, g) => s + (g.current_amount || 0), 0);
  const totalInvestments = investments.reduce((s, i) => s + (i.current_value || 0), 0);

  const allIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const allExpenses = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const cashBalance = Math.max(allIncome - allExpenses, 0);

  const totalAssets = Math.max(cashBalance, 0) + totalSavings + totalInvestments;
  const totalDebts = debts.filter(d => d.status === "active").reduce((s, d) => s + (d.remaining_amount || 0), 0);
  const netWorth = totalAssets - totalDebts;
  const isPositive = netWorth >= 0;

  const isEmpty = totalAssets === 0 && totalDebts === 0;

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
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-5 pr-14">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4F7CFF] to-[#9B59B6] flex items-center justify-center flex-shrink-0">
            {isPositive
              ? <TrendingUp className="w-4 h-4 text-white" />
              : <TrendingDown className="w-4 h-4 text-white" />
            }
          </div>
          <div>
            <p className="text-sm font-bold text-[#1A1A1A]">Kekayaan Bersih</p>
            <p className="text-xs text-[#8FA4C8]">{periodSubtitle || "Aset dikurangi utang aktif"}</p>
          </div>
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-[#8FA4C8] hover:text-[#1A1A1A] transition-colors tap-highlight-fix"
        >
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {expanded && (
        isEmpty ? (
          <div className="flex flex-col items-center justify-center px-6 py-8 text-center">
            <span className="text-4xl mb-3">🏦</span>
            <p className="font-semibold text-[#1A1A1A] text-sm mb-1">Kekayaan bersihmu masih misterius nih!</p>
            <p className="text-xs text-[#8FA4C8] mb-4">Tambahkan rekening dan tabungan kamu biar kita bisa hitung bareng</p>
            <Link
              to={createPageUrl("Accounts")}
              className="px-4 py-2 bg-[#FF6A00] text-white text-xs font-semibold rounded-xl hover:bg-[#e55f00] transition-colors"
            >
              Tambah Rekening
            </Link>
          </div>
        ) : (
          <div className="px-4 sm:px-5 pb-5 space-y-4">
            {/* Net Worth Big Number */}
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1.5 rounded-full text-xs font-bold`} style={{ backgroundColor: scoreLabel.color + "20", color: scoreLabel.color }}>
                Skor {score} · {scoreLabel.label}
              </div>
              <p className={`text-xl font-bold ${isPositive ? "text-[#00C9A7]" : "text-[#FF6B6B]"}`}>
                {netWorth < 0 ? "-" : ""}{formatShortNumber(Math.abs(netWorth))}
              </p>
            </div>

            {/* Health score bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#8FA4C8]">Kesehatan Finansial</p>
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
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[#F2F4F7] rounded-xl p-2.5 text-center">
                <p className="text-[9px] text-[#8FA4C8] mb-1 font-medium">Tabungan</p>
                <p className="text-xs font-bold text-[#1A1A1A]">{formatCurrency(totalSavings)}</p>
              </div>
              <div className="bg-[#F2F4F7] rounded-xl p-2.5 text-center">
                <p className="text-[9px] text-[#8FA4C8] mb-1 font-medium">Investasi</p>
                <p className="text-xs font-bold text-[#1A1A1A]">{formatCurrency(totalInvestments)}</p>
              </div>
              <div className="bg-[#FF6B6B]/10 rounded-xl p-2.5 text-center">
                <p className="text-[9px] text-[#8FA4C8] mb-1 font-medium">Utang</p>
                <p className="text-xs font-bold text-[#FF6B6B]">-{formatCurrency(totalDebts)}</p>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}