import { useAppSettings } from "@/components/utils/useAppSettings";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function MonthOverMonthComparison({ transactions }) {
  const { formatCurrency } = useAppSettings();
  const now = new Date();
  
  // Current month
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  
  // Previous month
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];

  const currentTx = transactions.filter(t => t.date >= currentMonthStart && t.date <= currentMonthEnd);
  const prevTx = transactions.filter(t => t.date >= prevMonthStart && t.date <= prevMonthEnd);

  const currentIncome = currentTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const currentExpense = currentTx.filter(t => t.type === 'expense' || t.type === 'savings').reduce((s, t) => s + t.amount, 0);
  const currentSaved = currentTx.filter(t => t.type === 'savings').reduce((s, t) => s + t.amount, 0);

  const prevIncome = prevTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const prevExpense = prevTx.filter(t => t.type === 'expense' || t.type === 'savings').reduce((s, t) => s + t.amount, 0);
  const prevSaved = prevTx.filter(t => t.type === 'savings').reduce((s, t) => s + t.amount, 0);

  function calcChange(current, prev) {
    if (prev === 0) return current > 0 ? 100 : 0;
    return ((current - prev) / prev) * 100;
  }

  const incomeChange = calcChange(currentIncome, prevIncome);
  const expenseChange = calcChange(currentExpense, prevExpense);
  const savingsChange = calcChange(currentSaved, prevSaved);

  function ComparisonItem({ label, current, prev, change, isSavings = false }) {
    const isGood = isSavings ? change >= 0 : change <= 0; // For savings, up is good. For expense, down is good.
    const color = isGood ? '#00C9A7' : '#FF6B6B';
    
    return (
      <div className="bg-[#F8FAFC] rounded-xl p-3">
        <p className="text-xs text-[#8FA4C8] mb-1">{label}</p>
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-[11px] text-[#8FA4C8]">Bulan ini</p>
            <p className="font-bold text-sm text-[#1A1A1A]">{formatCurrency(current)}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-[#8FA4C8]">Bulan lalu</p>
            <p className="font-bold text-[11px] text-[#8FA4C8]">{formatCurrency(prev)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1" style={{ color }}>
          {Math.abs(change) > 0.1 ? (
            <>
              {isGood ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span className="text-xs font-semibold">{Math.abs(change).toFixed(1)}%</span>
            </>
          ) : (
            <span className="text-xs font-semibold">—</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <h3 className="text-sm font-bold text-[#1A1A1A] mb-3">Bandingkan Bulan</h3>
      <div className="space-y-2">
        <ComparisonItem label="Pendapatan" current={currentIncome} prev={prevIncome} change={incomeChange} />
        <ComparisonItem label="Pengeluaran" current={currentExpense} prev={prevExpense} change={expenseChange} />
        <ComparisonItem label="Tabungan" current={currentSaved} prev={prevSaved} change={savingsChange} isSavings={true} />
      </div>
    </div>
  );
}