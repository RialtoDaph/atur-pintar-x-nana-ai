import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useAppSettings } from "@/components/utils/useAppSettings";

export default function NetWorthCard({ accounts = [] }) {
  const { formatCurrency } = useAppSettings();
  const [investments, setInvestments] = useState([]);
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Investment.list().catch(() => []),
      base44.entities.Debt.filter({ status: "active" }).catch(() => []),
    ]).then(([inv, dbt]) => {
      setInvestments(inv);
      setDebts(dbt);
      setLoading(false);
    });
  }, []);

  const totalAccounts = accounts.reduce((s, a) => s + (a.balance || 0), 0);
  const totalInvestments = investments.reduce((s, i) => s + (i.current_value || 0), 0);
  const totalDebt = debts.reduce((s, d) => s + (d.remaining_amount || 0), 0);
  const netWorth = totalAccounts + totalInvestments - totalDebt;
  const isPositive = netWorth >= 0;

  if (loading) return <div className="bg-white rounded-2xl h-20 animate-pulse shadow-sm" />;

  return (
    <div className={`rounded-2xl p-4 shadow-sm border ${isPositive ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-0.5">Net Worth</p>
          <p className={`text-xl font-black ${isPositive ? "text-green-700" : "text-red-600"}`}>
            {isPositive ? "+" : ""}{formatCurrency(netWorth)}
          </p>
          <div className="flex gap-3 mt-1">
            <span className="text-[10px] text-gray-400">💰 {formatCurrency(totalAccounts)}</span>
            {totalInvestments > 0 && <span className="text-[10px] text-gray-400">📈 {formatCurrency(totalInvestments)}</span>}
            {totalDebt > 0 && <span className="text-[10px] text-red-400">🔴 -{formatCurrency(totalDebt)}</span>}
          </div>
        </div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isPositive ? "bg-green-100" : "bg-red-100"}`}>
          {isPositive
            ? <TrendingUp className="w-5 h-5 text-green-600" />
            : <TrendingDown className="w-5 h-5 text-red-500" />}
        </div>
      </div>
    </div>
  );
}