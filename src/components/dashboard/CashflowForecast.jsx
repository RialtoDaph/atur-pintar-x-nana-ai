import { TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { useAppSettings } from "@/components/utils/useAppSettings";

export default function CashflowForecast({ transactions, loading }) {
  const { formatCurrency } = useAppSettings();
  if (loading) return null;

  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(0, daysInMonth - dayOfMonth);

  const thisMonth = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const currentIncome = thisMonth.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const currentExpense = thisMonth.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  // Only project if we have actual data (not first day)
  const daysElapsed = dayOfMonth - 1;
  const dailyExpenseAvg = daysElapsed > 0 ? currentExpense / daysElapsed : currentExpense;
  const projectedExtraExpense = daysLeft > 0 ? dailyExpenseAvg * daysLeft : 0;
  const projectedTotalExpense = currentExpense + projectedExtraExpense;

  // Daily avg income
  const dailyIncomeAvg = daysElapsed > 0 ? currentIncome / daysElapsed : currentIncome;
  const projectedExtraIncome = daysLeft > 0 ? dailyIncomeAvg * daysLeft : 0;
  const projectedTotalIncome = currentIncome + projectedExtraIncome;

  const projectedBalance = projectedTotalIncome - projectedTotalExpense;
  const isPositive = projectedBalance >= 0;

  const progressPct = daysInMonth > 0 ? Math.round((dayOfMonth / daysInMonth) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex items-center gap-2 mb-2.5">
        <Calendar className="w-4 h-4 text-[#FF6A00]" />
        <h2 className="font-bold text-[#0A0A0A] text-sm">Proyeksi Cashflow</h2>
      </div>

      {/* Month progress */}
      <div className="mb-3">
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

      {/* Prediction + grid combined */}
      <div className="grid grid-cols-3 gap-2">
        <div className={`col-span-3 rounded-xl px-3 py-2.5 flex items-center justify-between ${isPositive ? "bg-green-50 border border-green-100" : "bg-red-50 border border-red-100"}`}>
          <div>
            <p className="text-[10px] text-[#9B9B9B]">Prediksi akhir bulan</p>
            <p className={`text-base font-bold ${isPositive ? "text-green-600" : "text-red-500"}`}>
              {isPositive ? "+" : "-"}{formatRupiah(Math.abs(projectedBalance))}
            </p>
          </div>
          <p className="text-xs text-[#9B9B9B]">{isPositive ? "Aman 🎉" : "Awas ⚠️"}</p>
        </div>
        <div className="col-span-1 bg-[#F9F9F9] rounded-xl p-2.5">
          <div className="flex items-center gap-1 mb-0.5">
            <TrendingUp className="w-3 h-3 text-green-500" />
            <p className="text-[10px] text-[#9B9B9B]">Est. Masuk</p>
          </div>
          <p className="text-xs font-bold text-[#1A1A1A]">{formatRupiah(projectedTotalIncome)}</p>
        </div>
        <div className="col-span-2 bg-[#F9F9F9] rounded-xl p-2.5">
          <div className="flex items-center gap-1 mb-0.5">
            <TrendingDown className="w-3 h-3 text-red-400" />
            <p className="text-[10px] text-[#9B9B9B]">Est. Keluar</p>
          </div>
          <p className="text-xs font-bold text-[#1A1A1A]">{formatRupiah(projectedTotalExpense)}</p>
        </div>
      </div>
    </div>
  );
}