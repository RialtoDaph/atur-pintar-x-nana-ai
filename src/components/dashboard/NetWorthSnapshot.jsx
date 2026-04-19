import { useAppSettings } from "@/components/utils/useAppSettings";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function NetWorthSnapshot({ accounts, transactions, loading }) {
  const { formatCurrency } = useAppSettings();

  const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);

  // Calculate last month net cashflow
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}`;

  const lastMonthTx = (transactions || []).filter(t => {
    const d = t.date?.slice(0, 7);
    return d === lastMonthStr && !(t.is_recurring && !t.is_recurring_child);
  });
  const lastIncome = lastMonthTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const lastExpense = lastMonthTx.filter(t => t.type === "expense" || t.type === "savings").reduce((s, t) => s + t.amount, 0);
  const lastMonthNet = lastIncome - lastExpense;
  const hasLastMonth = lastMonthTx.length > 0;

  if (loading) {
    return <div className="mx-4 -mt-5 bg-white rounded-2xl shadow-lg h-28 animate-pulse" />;
  }

  return (
    <div className="mx-4 -mt-5 bg-white rounded-2xl shadow-lg p-5">
      <p className="text-xs text-[#8FA4C8] font-medium mb-1">Total Kekayaan Bersih</p>
      <p className="text-3xl font-black text-[#1A1A1A] leading-tight">{formatCurrency(totalBalance)}</p>
      {hasLastMonth && (
        <div className="flex items-center gap-1.5 mt-2">
          {lastMonthNet >= 0
            ? <TrendingUp className="w-3.5 h-3.5 text-[#16A34A]" />
            : <TrendingDown className="w-3.5 h-3.5 text-[#DC2626]" />
          }
          <span className={`text-xs font-semibold ${lastMonthNet >= 0 ? "text-[#16A34A]" : "text-[#DC2626]"}`}>
            {lastMonthNet >= 0 ? "+" : ""}{formatCurrency(lastMonthNet)} bulan lalu
          </span>
        </div>
      )}
      {!hasLastMonth && (
        <p className="text-xs text-[#CBD5E0] mt-1">Dari {accounts.length} rekening</p>
      )}
    </div>
  );
}