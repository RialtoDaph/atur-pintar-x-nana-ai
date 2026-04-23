import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAppSettings } from "@/components/utils/useAppSettings";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Flame, TrendingUp, TrendingDown, Wallet, Target, ArrowUp, ArrowDown } from "lucide-react";

function DeltaBadge({ current, prev, higherIsBetter = true }) {
  if (prev == null || prev === 0) return null;
  const diff = current - prev;
  const pct = Math.abs((diff / prev) * 100).toFixed(1);
  if (Math.abs(diff) < 0.01) return null;
  const isPositive = diff > 0;
  // good = green, bad = red
  const isGood = higherIsBetter ? isPositive : !isPositive;
  return (
    <span className={`flex items-center gap-0.5 text-[9px] font-semibold ${isGood ? "text-[#00C9A7]" : "text-[#FF6B6B]"}`}>
      {isPositive ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
      {pct}% <span className="font-normal text-[#8FA4C8]">vs lalu</span>
    </span>
  );
}

export default function HeroSummaryCard({ goals, investments, debts, transactions, user, hasPrevData, prevIncome, prevExpenses, prevSavingsRate }) {
  const { formatShortNumber, formatCurrency } = useAppSettings();
  const [gamification, setGamification] = useState(null);
  const [healthScore, setHealthScore] = useState(null);

  useEffect(() => {
    if (!user?.email) return;
    base44.entities.GamificationProfile.filter({ created_by: user.email })
      .then(data => { if (data.length > 0) setGamification(data[0]); })
      .catch(() => {});

    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    base44.entities.FinancialHealthScore.filter({ created_by: user.email, month: monthStr })
      .then(data => { if (data.length > 0) setHealthScore(data[0]); })
      .catch(() => {});
  }, [user?.email]);

  const now = new Date();

  // Kekayaan bersih: savings + investasi - utang aktif
  const totalSavings = goals.reduce((s, g) => s + (g.current_amount || 0), 0);
  const totalInvestments = investments.reduce((s, i) => s + (i.current_value || 0), 0);
  const totalDebts = debts.filter(d => d.status === "active").reduce((s, d) => s + (d.remaining_amount || 0), 0);
  const netWorth = totalSavings + totalInvestments - totalDebts;
  const netWorthPositive = netWorth >= 0;

  // Saving rate bulan ini
  const thisMonthTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const thisMonthIncome = thisMonthTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const thisMonthExpense = thisMonthTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const savingRate = thisMonthIncome > 0 ? ((thisMonthIncome - thisMonthExpense) / thisMonthIncome) * 100 : null;

  const savingRateColor = savingRate === null ? "text-[#8FA4C8]"
    : savingRate >= 20 ? "text-[#00C9A7]"
    : savingRate >= 10 ? "text-[#F5A623]"
    : "text-[#FF6B6B]";

  // Streak
  const streak = gamification?.daily_streak || 0;

  const metrics = [
    {
      icon: netWorthPositive ? TrendingUp : TrendingDown,
      iconBg: netWorthPositive ? "bg-[#00C9A7]/15" : "bg-[#FF6B6B]/15",
      iconColor: netWorthPositive ? "text-[#00C9A7]" : "text-[#FF6B6B]",
      label: "Kekayaan Bersih",
      value: (netWorth < 0 ? "-" : "") + formatShortNumber(Math.abs(netWorth)),
      valueColor: netWorthPositive ? "text-[#00C9A7]" : "text-[#FF6B6B]",
      delta: null, // net worth delta tidak bisa dihitung dari tx saja
    },
    {
      icon: Target,
      iconBg: savingRate === null ? "bg-[#8FA4C8]/15" : savingRate >= 20 ? "bg-[#00C9A7]/15" : savingRate >= 10 ? "bg-[#F5A623]/15" : "bg-[#FF6B6B]/15",
      iconColor: savingRate === null ? "text-[#8FA4C8]" : savingRate >= 20 ? "text-[#00C9A7]" : savingRate >= 10 ? "text-[#F5A623]" : "text-[#FF6B6B]",
      label: "Saving Rate",
      value: savingRate !== null ? `${savingRate.toFixed(1)}%` : "0%",
      valueColor: savingRateColor,
      deltaProps: hasPrevData && prevSavingsRate != null ? { current: savingRate ?? 0, prev: prevSavingsRate, higherIsBetter: true } : null,
    },
    {
      icon: Wallet,
      iconBg: "bg-[#FF6B6B]/15",
      iconColor: "text-[#FF6B6B]",
      label: "Pengeluaran Bulan Ini",
      value: formatShortNumber(thisMonthExpense),
      valueColor: "text-[#FF6B6B]",
      deltaProps: hasPrevData && prevExpenses != null ? { current: thisMonthExpense, prev: prevExpenses, higherIsBetter: false } : null,
    },
    {
      icon: Flame,
      iconBg: streak > 0 ? "bg-[#FF6A00]/15" : "bg-[#8FA4C8]/15",
      iconColor: streak > 0 ? "text-[#FF6A00]" : "text-[#8FA4C8]",
      label: "Streak Aktif",
      value: streak > 0 ? `${streak} Hari` : "Mulai Streak!",
      valueColor: streak > 0 ? "text-[#FF6A00]" : "text-[#8FA4C8]",
      deltaProps: null,
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-5 pr-14">
      <div className="grid grid-cols-2 gap-3 mb-3">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="bg-[#F2F4F7] rounded-xl p-3 flex flex-col gap-2">
              <div className={`w-8 h-8 rounded-full ${m.iconBg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${m.iconColor}`} />
              </div>
              <p className="text-[10px] text-[#8FA4C8] font-medium leading-tight">{m.label}</p>
              <p className={`text-sm font-bold ${m.valueColor} leading-tight`}>{m.value}</p>
              {m.deltaProps && <DeltaBadge {...m.deltaProps} />}
            </div>
          );
        })}
      </div>

      {/* Financial Health Score footer */}
      <div className="flex items-center justify-between pt-3 border-t border-[#F2F4F7]">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#4A5568]">Skor Finansial:</span>
          <span className="text-xs font-bold text-[#FF6A00]">
            {healthScore?.total_score != null ? `${healthScore.total_score}/1000` : "Belum dihitung"}
          </span>
        </div>
        <Link
          to={createPageUrl("Gamifikasi")}
          className="text-[10px] text-[#FF6A00] font-semibold hover:opacity-75 transition-opacity"
        >
          Lihat detail →
        </Link>
      </div>
    </div>
  );
}