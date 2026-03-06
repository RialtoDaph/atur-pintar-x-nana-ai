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

// Calculate historical average spending from past 3 months
function getHistoricalMonthlyAverage(transactions, type, months = 3) {
  const now = new Date();
  let totalAmount = 0;
  let monthCount = 0;

  for (let i = 1; i <= months; i++) {
    const pastMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonth = new Date(pastMonth.getFullYear(), pastMonth.getMonth() + 1, 1);

    const monthTransactions = transactions.filter(tx => {
      const d = new Date(tx.date);
      return d >= pastMonth && d < nextMonth && tx.type === type;
    });

    const monthAmount = monthTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    if (monthAmount > 0) {
      totalAmount += monthAmount;
      monthCount++;
    }
  }

  return monthCount > 0 ? totalAmount / monthCount : 0;
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
  let scheduledFutureIncome = 0;
  let scheduledFutureExpense = 0;

  const childParentIdsThisMonth = new Set(
    thisMonth.filter(tx => tx.is_recurring_child && tx.recurring_parent_id).map(tx => tx.recurring_parent_id)
  );

  for (const tpl of recurringTemplates) {
    const occurrences = countFutureOccurrences(tpl, now, daysInMonth);
    if (tpl.recurring_interval === "monthly" && childParentIdsThisMonth.has(tpl.id)) continue;
    scheduledFutureIncome += (occurrences.income || 0) * tpl.amount;
    scheduledFutureExpense += (occurrences.expense || 0) * tpl.amount;
  }

  // Use historical data for conservative forecasting
  const ONE_TIME_INCOME_CATEGORIES = ["salary", "freelance", "bonus", "dividend", "reimbursement"];
  
  // Get historical average for remaining days - more conservative approach
  const historicalMonthlyExpense = getHistoricalMonthlyAverage(transactions, "expense", 3);
  const historicalDailyExpense = historicalMonthlyExpense / daysInMonth;

  // Use only historical average for projection - this is more stable and less likely to overestimate
  const projectedExtraExpense = (historicalDailyExpense * daysLeft) + scheduledFutureExpense;

  // Similar logic for income
  const historicalMonthlyIncome = getHistoricalMonthlyAverage(transactions, "income", 3);
  const historicalDailyIncome = historicalMonthlyIncome / daysInMonth;

  const projectedExtraIncome = (historicalDailyIncome * daysLeft) + scheduledFutureIncome;

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