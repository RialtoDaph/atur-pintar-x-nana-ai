import { TrendingUp, TrendingDown, Calendar, RefreshCw } from "lucide-react";
import { useAppSettings } from "@/components/utils/useAppSettings";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

// Count how many times a recurring template will fire in the remaining days of this month
function countFutureOccurrences(template, today, daysInMonth) {
  const interval = template.recurring_interval;
  const templateDate = new Date(template.date);
  const templateDay = templateDate.getDate();
  const count = { income: 0, expense: 0 };

  // Already-generated child transactions in this month are counted in currentIncome/Expense
  // We only project FUTURE occurrences (after today)
  const futureStart = today.getDate() + 1;

  if (interval === "monthly") {
    // If the template's day-of-month falls after today in this month, count it once
    if (templateDay >= futureStart && templateDay <= daysInMonth) {
      count[template.type] = (count[template.type] || 0) + 1;
    }
  } else if (interval === "weekly") {
    // Count Wednesdays (or whatever weekday) remaining in the month
    const templateWeekday = templateDate.getDay();
    for (let d = futureStart; d <= daysInMonth; d++) {
      const wd = new Date(today.getFullYear(), today.getMonth(), d).getDay();
      if (wd === templateWeekday) count[template.type] = (count[template.type] || 0) + 1;
    }
  } else if (interval === "daily") {
    count[template.type] = (count[template.type] || 0) + (daysInMonth - today.getDate());
  } else if (interval === "yearly") {
    const sameMonth = templateDate.getMonth() === today.getMonth();
    if (sameMonth && templateDay >= futureStart) {
      count[template.type] = (count[template.type] || 0) + 1;
    }
  }

  return count;
}

export default function CashflowForecast({ transactions, loading, user }) {
  const { formatCurrency, t } = useAppSettings();
  const [recurringTemplates, setRecurringTemplates] = useState([]);
  const [recurringLoaded, setRecurringLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    base44.entities.Transaction.filter({ is_recurring: true, created_by: user.email })
      .then(data => { setRecurringTemplates(data); setRecurringLoaded(true); })
      .catch(() => setRecurringLoaded(true));
  }, [user]);

  if (loading || !recurringLoaded) return null;

  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(0, daysInMonth - dayOfMonth);

  const thisMonth = transactions.filter(tx => {
    const d = new Date(tx.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const currentIncome = thisMonth.filter(tx => tx.type === "income").reduce((s, tx) => s + tx.amount, 0);
  const currentExpense = thisMonth.filter(tx => tx.type === "expense").reduce((s, tx) => s + tx.amount, 0);

  // --- Recurring-aware projection ---
  // For each recurring template, estimate how many more times it fires this month
  let scheduledFutureIncome = 0;
  let scheduledFutureExpense = 0;

  // Collect parent IDs that already have a child this month (so we don't double-count)
  const childParentIdsThisMonth = new Set(
    thisMonth.filter(tx => tx.is_recurring_child && tx.recurring_parent_id).map(tx => tx.recurring_parent_id)
  );

  for (const tpl of recurringTemplates) {
    const occurrences = countFutureOccurrences(tpl, now, daysInMonth);
    // If monthly and already generated this month, skip
    if (tpl.recurring_interval === "monthly" && childParentIdsThisMonth.has(tpl.id)) continue;
    scheduledFutureIncome += (occurrences.income || 0) * tpl.amount;
    scheduledFutureExpense += (occurrences.expense || 0) * tpl.amount;
  }

  // For non-recurring spend, use daily average for the remainder
  // Exclude recurring-child and salary/freelance income from daily avg (one-time income like salary should not be projected forward)
  const ONE_TIME_INCOME_CATEGORIES = ["salary", "freelance", "bonus", "dividend", "reimbursement"];
  const nonRecurringExpense = thisMonth.filter(tx => tx.type === "expense" && !tx.is_recurring_child).reduce((s, tx) => s + tx.amount, 0);
  // Only average irregular/daily income, not large one-time salary entries
  const nonRecurringIncome = thisMonth.filter(tx =>
    tx.type === "income" &&
    !tx.is_recurring_child &&
    !ONE_TIME_INCOME_CATEGORIES.includes(tx.category)
  ).reduce((s, tx) => s + tx.amount, 0);
  // One-time income (salary etc) is already counted in currentIncome — no need to project forward
  const oneTimeIncome = thisMonth.filter(tx =>
    tx.type === "income" &&
    ONE_TIME_INCOME_CATEGORIES.includes(tx.category)
  ).reduce((s, tx) => s + tx.amount, 0);

  // Use at least 1 day as denominator; more conservative early-month projections
  const daysElapsed = Math.max(1, dayOfMonth - 1);
  const dailyExpenseAvg = daysElapsed > 0 ? nonRecurringExpense / daysElapsed : 0;
  // Only project daily avg for non-salary income; salary already captured in currentIncome
  const dailyIncomeAvg = daysElapsed > 0 ? nonRecurringIncome / daysElapsed : 0;

  const projectedExtraExpense = dailyExpenseAvg * daysLeft + scheduledFutureExpense;
  const projectedExtraIncome = dailyIncomeAvg * daysLeft + scheduledFutureIncome;

  const projectedTotalExpense = currentExpense + projectedExtraExpense;
  const projectedTotalIncome = currentIncome + projectedExtraIncome;

  const projectedBalance = projectedTotalIncome - projectedTotalExpense;
  const isPositive = projectedBalance >= 0;
  const hasScheduled = scheduledFutureIncome > 0 || scheduledFutureExpense > 0;

  const progressPct = daysInMonth > 0 ? Math.round((dayOfMonth / daysInMonth) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex items-center gap-2 mb-2.5">
        <Calendar className="w-4 h-4 text-[#FF6A00]" />
        <h2 className="font-bold text-[#0A0A0A] text-sm">{t('cashflow_title')}</h2>
        {hasScheduled && (
          <span className="ml-auto flex items-center gap-1 text-[9px] text-[#FF6A00] font-semibold bg-[#FF6A00]/10 px-2 py-0.5 rounded-full">
            <RefreshCw className="w-2.5 h-2.5" />
            {t('recurring') || 'Recurring'}
          </span>
        )}
      </div>

      {/* Month progress */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-[#9B9B9B] mb-1">
          <span>{t('day_progress')}{dayOfMonth}</span>
          <span>{daysLeft} {t('days_left')}</span>
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
            <p className="text-[10px] text-[#9B9B9B]">{t('end_of_month_prediction')}</p>
            <p className={`text-base font-bold ${isPositive ? "text-green-600" : "text-red-500"}`}>
              {isPositive ? "+" : "-"}{formatCurrency(Math.abs(projectedBalance))}
            </p>
          </div>
          <p className="text-xs text-[#9B9B9B]">{isPositive ? t('safe') : t('warning')}</p>
        </div>
        <div className="col-span-1 bg-[#F9F9F9] rounded-xl p-2.5">
          <div className="flex items-center gap-1 mb-0.5">
            <TrendingUp className="w-3 h-3 text-green-500" />
            <p className="text-[10px] text-[#9B9B9B]">{t('est_income')}</p>
          </div>
          <p className="text-xs font-bold text-[#1A1A1A]">{formatCurrency(projectedTotalIncome)}</p>
        </div>
        <div className="col-span-2 bg-[#F9F9F9] rounded-xl p-2.5">
          <div className="flex items-center gap-1 mb-0.5">
            <TrendingDown className="w-3 h-3 text-red-400" />
            <p className="text-[10px] text-[#9B9B9B]">{t('est_expense')}</p>
          </div>
          <p className="text-xs font-bold text-[#1A1A1A]">{formatCurrency(projectedTotalExpense)}</p>
        </div>
      </div>
    </div>
  );
}