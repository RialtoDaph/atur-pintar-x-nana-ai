import { TrendingUp, TrendingDown, PiggyBank } from "lucide-react";

export default function BalanceCard({ income, expense, savings, loading }) {
  const balance = income - expense;

  if (loading) {
    return (
      <div className="bg-white/10 rounded-2xl p-5 animate-pulse h-36" />
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
      <p className="text-[#8FA4C8] text-xs font-semibold uppercase tracking-widest mb-1">This Month</p>
      <p className="text-white text-4xl font-bold mb-5">
        {balance >= 0 ? "+" : ""}${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
      <div className="grid grid-cols-3 gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#FF6A00]/20 flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5 text-[#00C9A7]" />
          </div>
          <div>
            <p className="text-[#8FA4C8] text-[10px]">Income</p>
            <p className="text-white text-sm font-semibold">${income.toLocaleString("en-US", { minimumFractionDigits: 0 })}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#FF6B6B]/20 flex items-center justify-center">
            <TrendingDown className="w-3.5 h-3.5 text-[#FF6B6B]" />
          </div>
          <div>
            <p className="text-[#8FA4C8] text-[10px]">Expenses</p>
            <p className="text-white text-sm font-semibold">${expense.toLocaleString("en-US", { minimumFractionDigits: 0 })}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#4F7CFF]/20 flex items-center justify-center">
            <PiggyBank className="w-3.5 h-3.5 text-[#4F7CFF]" />
          </div>
          <div>
            <p className="text-[#8FA4C8] text-[10px]">Saved</p>
            <p className="text-white text-sm font-semibold">${savings.toLocaleString("en-US", { minimumFractionDigits: 0 })}</p>
          </div>
        </div>
      </div>
    </div>
  );
}