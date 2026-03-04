import { TrendingUp, TrendingDown, Calendar } from "lucide-react";

export default function CashflowForecast({ transactions, loading }) {
  if (loading) return null;

  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - dayOfMonth;

  const thisMonth = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const currentIncome = thisMonth.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const currentExpense = thisMonth.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  // Daily average expense so far
  const dailyExpenseAvg = dayOfMonth > 0 ? currentExpense / dayOfMonth : 0;
  const projectedExtraExpense = dailyExpenseAvg * daysLeft;
  const projectedTotalExpense = currentExpense + projectedExtraExpense;

  // Daily avg income
  const dailyIncomeAvg = dayOfMonth > 0 ? currentIncome / dayOfMonth : 0;
  const projectedExtraIncome = dailyIncomeAvg * daysLeft;
  const projectedTotalIncome = currentIncome + projectedExtraIncome;

  const projectedBalance = projectedTotalIncome - projectedTotalExpense;
  const isPositive = projectedBalance >= 0;

  const progressPct = daysInMonth > 0 ? Math.round((dayOfMonth / daysInMonth) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-4 h-4 text-[#FF6A00]" />
        <h2 className="font-bold text-[#0A0A0A] text-base">Cashflow Forecast</h2>
      </div>

      {/* Month progress */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-[#9B9B9B] mb-1">
          <span>Hari ke-{dayOfMonth}</span>
          <span>{daysLeft} hari lagi</span>
        </div>
        <div className="h-1.5 bg-[#F0F0EE] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-[#FF6A00] transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Prediction */}
      <div className={`rounded-xl px-4 py-3 mb-3 ${isPositive ? "bg-green-50 border border-green-100" : "bg-red-50 border border-red-100"}`}>
        <p className="text-xs text-[#9B9B9B] mb-0.5">Prediksi saldo akhir bulan</p>
        <p className={`text-2xl font-bold ${isPositive ? "text-green-600" : "text-red-500"}`}>
          {isPositive ? "+" : ""}${projectedBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-[#9B9B9B] mt-0.5">
          {isPositive ? "Keuanganmu aman bulan ini 🎉" : "Pengeluaran melebihi pemasukan ⚠️"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#F9F9F9] rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-green-500" />
            <p className="text-xs text-[#9B9B9B]">Estimasi Pemasukan</p>
          </div>
          <p className="text-sm font-bold text-[#1A1A1A]">${projectedTotalIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-[#F9F9F9] rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingDown className="w-3.5 h-3.5 text-red-400" />
            <p className="text-xs text-[#9B9B9B]">Estimasi Pengeluaran</p>
          </div>
          <p className="text-sm font-bold text-[#1A1A1A]">${projectedTotalExpense.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
        </div>
      </div>
    </div>
  );
}