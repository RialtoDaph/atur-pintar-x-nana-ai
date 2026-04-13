import { useAppSettings } from "@/components/utils/useAppSettings";
import { Building2, TrendingUp, CreditCard } from "lucide-react";

export default function NetWorthSnapshot({ accounts, investments, debts }) {
  const { formatCurrency } = useAppSettings();

  const totalCash = accounts.reduce((s, a) => s + (a.balance || 0), 0);
  const totalInvest = investments.reduce((s, i) => s + (i.current_value || 0), 0);
  const totalDebt = debts.filter(d => d.status === "active").reduce((s, d) => s + (d.remaining_amount || 0), 0);
  const netWorth = totalCash + totalInvest - totalDebt;

  const items = [
    { label: "Saldo Rekening", value: totalCash, icon: Building2, color: "#3B82F6", positive: true },
    { label: "Nilai Investasi", value: totalInvest, icon: TrendingUp, color: "#22C55E", positive: true },
    { label: "Total Utang Aktif", value: totalDebt, icon: CreditCard, color: "#EF4444", positive: false },
  ];

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#F0F2F5]">
      <p className="text-sm font-bold text-[#1A1A1A] mb-1">🏦 Net Worth Snapshot</p>
      <div className="flex items-baseline gap-2 mb-4">
        <p className="text-2xl font-black" style={{ color: netWorth >= 0 ? "#22C55E" : "#EF4444" }}>
          {netWorth < 0 ? "-" : ""}{formatCurrency(Math.abs(netWorth))}
        </p>
        <span className="text-xs text-[#8FA4C8]">kekayaan bersih</span>
      </div>
      <div className="space-y-3">
        {items.map(item => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: item.color + "15" }}>
                <item.icon className="w-4 h-4" style={{ color: item.color }} />
              </div>
              <span className="text-xs font-medium text-[#4A5568]">{item.label}</span>
            </div>
            <span className="text-xs font-bold" style={{ color: item.positive ? "#1A1A1A" : item.color }}>
              {item.positive ? "" : "-"}{formatCurrency(item.value)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-[#F2F4F7] flex justify-between items-center">
        <span className="text-xs font-semibold text-[#8FA4C8]">Total Aset</span>
        <span className="text-sm font-bold text-[#1A1A1A]">{formatCurrency(totalCash + totalInvest)}</span>
      </div>
    </div>
  );
}