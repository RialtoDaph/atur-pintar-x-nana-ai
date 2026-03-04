import { TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import { formatRupiah } from "@/components/utils/formatRupiah";

export default function BalanceCard({ income, expense, savings, loading }) {
  const balance = income - expense;

  if (loading) {
    return (
      <div className="bg-[#0A0A0A] rounded-2xl p-5 animate-pulse h-36" />
    );
  }

  return (
    <div className="bg-[#161616] rounded-2xl p-4 border border-[#222]">
      <p className="text-[#8FA4C8] text-[10px] font-semibold uppercase tracking-widest mb-0.5">Bulan Ini</p>
      <p className="text-white text-2xl font-bold mb-3">
        {balance >= 0 ? "+" : "-"}{formatRupiah(Math.abs(balance))}
      </p>
      <div className="grid grid-cols-3 gap-2">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-[#FF6A00]/20 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-3 h-3 text-[#FF6A00]" />
          </div>
          <div>
            <p className="text-[#8FA4C8] text-[9px]">Pemasukan</p>
            <p className="text-white text-xs font-semibold">{formatRupiah(income)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-[#FF6B6B]/20 flex items-center justify-center flex-shrink-0">
            <TrendingDown className="w-3 h-3 text-[#FF6B6B]" />
          </div>
          <div>
            <p className="text-[#8FA4C8] text-[9px]">Pengeluaran</p>
            <p className="text-white text-xs font-semibold">{formatRupiah(expense)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-[#4F7CFF]/20 flex items-center justify-center flex-shrink-0">
            <PiggyBank className="w-3 h-3 text-[#4F7CFF]" />
          </div>
          <div>
            <p className="text-[#8FA4C8] text-[9px]">Tabungan</p>
            <p className="text-white text-xs font-semibold">{formatRupiah(savings)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}