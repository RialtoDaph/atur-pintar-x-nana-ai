import { TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { useAppSettings } from "@/components/utils/useAppSettings";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

function countFutureOccurrences(template, today, daysInMonth) {
  const interval = template.recurring_interval;
  const templateDate = new Date(template.date);
  const templateDay = templateDate.getDate();
  const count = { income: 0, expense: 0 };
  const futureStart = today.getDate() + 1;
  if (interval === "monthly") {
    if (templateDay >= futureStart && templateDay <= daysInMonth)
    count[template.type] = (count[template.type] || 0) + 1;
  } else if (interval === "weekly") {
    const templateWeekday = templateDate.getDay();
    for (let d = futureStart; d <= daysInMonth; d++) {
      const wd = new Date(today.getFullYear(), today.getMonth(), d).getDay();
      if (wd === templateWeekday) count[template.type] = (count[template.type] || 0) + 1;
    }
  } else if (interval === "daily") {
    count[template.type] = (count[template.type] || 0) + (daysInMonth - today.getDate());
  } else if (interval === "yearly") {
    if (templateDate.getMonth() === today.getMonth() && templateDay >= futureStart)
    count[template.type] = (count[template.type] || 0) + 1;
  }
  return count;
}

function getHistoricalMonthlyAverage(transactions, type, months = 3) {
  const now = new Date();
  let totalAmount = 0,monthCount = 0;
  for (let i = 1; i <= months; i++) {
    const pastMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonth = new Date(pastMonth.getFullYear(), pastMonth.getMonth() + 1, 1);
    const amount = transactions.
    filter((tx) => {const d = new Date(tx.date);return d >= pastMonth && d < nextMonth && tx.type === type;}).
    reduce((s, tx) => s + tx.amount, 0);
    if (amount > 0) {totalAmount += amount;monthCount++;}
  }
  return monthCount > 0 ? totalAmount / monthCount : 0;
}

export default function CashflowForecast({ transactions, loading, user }) {
  const { formatCurrency } = useAppSettings();
  const [recurringTemplates, setRecurringTemplates] = useState([]);
  const [recurringLoaded, setRecurringLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    base44.entities.Transaction.filter({ is_recurring: true, created_by: user.email }).
    then((data) => {setRecurringTemplates(data);setRecurringLoaded(true);}).
    catch(() => setRecurringLoaded(true));
  }, [user]);

  if (loading || !recurringLoaded) return null;

  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(0, daysInMonth - dayOfMonth);
  const progressPct = Math.round(dayOfMonth / daysInMonth * 100);

  const thisMonth = transactions.filter((tx) => {
    const d = new Date(tx.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const currentIncome = thisMonth.filter((tx) => tx.type === "income").reduce((s, tx) => s + tx.amount, 0);
  const currentExpense = thisMonth.filter((tx) => tx.type === "expense").reduce((s, tx) => s + tx.amount, 0);

  let scheduledFutureIncome = 0,scheduledFutureExpense = 0;
  const childParentIds = new Set(
    thisMonth.filter((tx) => tx.is_recurring_child && tx.recurring_parent_id).map((tx) => tx.recurring_parent_id)
  );
  for (const tpl of recurringTemplates) {
    const occ = countFutureOccurrences(tpl, now, daysInMonth);
    if (tpl.recurring_interval === "monthly" && childParentIds.has(tpl.id)) continue;
    scheduledFutureIncome += (occ.income || 0) * tpl.amount;
    scheduledFutureExpense += (occ.expense || 0) * tpl.amount;
  }

  const dailyExpense = getHistoricalMonthlyAverage(transactions, "expense", 3) / daysInMonth;
  const dailyIncome = getHistoricalMonthlyAverage(transactions, "income", 3) / daysInMonth;

  const projectedTotalExpense = currentExpense + dailyExpense * daysLeft + scheduledFutureExpense;
  const projectedTotalIncome = currentIncome + dailyIncome * daysLeft + scheduledFutureIncome;
  const projectedBalance = projectedTotalIncome - projectedTotalExpense;
  const isPositive = projectedBalance >= 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#FF6A00]" />
          <span className="text-sm font-bold text-[#0A0A0A]">Proyeksi Cash Flow</span>
        </div>
        <span className="text-xs text-[#8FA4C8]">{daysLeft} hari lagi</span>
      </div>

      {/* Month progress */}
      <div className="mb-3">
        <div className="h-1.5 bg-[#F2F4F7] rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-[#FF6A00] transition-all" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-[#8FA4C8]">Awal bulan</span>
          <span className="text-[10px] text-[#FF6A00] font-medium">{progressPct}%</span>
          <span className="text-[10px] text-[#8FA4C8]">Akhir bulan</span>
        </div>
      </div>

      {/* Projected balance */}
      <div className={`rounded-xl px-3.5 py-3 flex items-center justify-between mb-3 ${
      isPositive ? "bg-green-50 border border-green-100" : "bg-red-50 border border-red-100"}`
      }>
        <div>
          <p className="text-[10px] text-[#8FA4C8] mb-0.5">Estimasi saldo akhir bulan</p>
          <p className={`text-lg font-bold ${isPositive ? "text-green-600" : "text-red-500"}`}>
            {isPositive ? "+" : "-"}{formatCurrency(Math.abs(projectedBalance))}
          </p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
        isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`
        }>
          {isPositive ? "✅ Aman" : "⚠️ Defisit"}
        </span>
      </div>

      {/* Income / Expense row */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#F8FAFC] rounded-xl p-3">
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp className="w-3 h-3 text-green-500" />
            <span className="text-[10px] text-[#8FA4C8]">Est. Pemasukan</span>
          </div>
          <p className="text-sm font-bold text-green-600">{formatCurrency(projectedTotalIncome)}</p>
        </div>
        <div className="bg-[#F8FAFC] rounded-xl p-3">
          <div className="flex items-center gap-1 mb-1">
            <TrendingDown className="w-3 h-3 text-red-400" />
            <span className="text-[10px] text-[#8FA4C8]">Est. Pengeluaran</span>
          </div>
          <p className="text-sm font-bold text-red-500">{formatCurrency(projectedTotalExpense)}</p>
        </div>
      </div>

      <p className="text-[10px] text-[#8FA4C8] text-center mt-2.5">
        Berdasarkan rata-rata 3 bulan + transaksi recurring
      </p>
    </div>);

}