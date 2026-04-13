import { useAppSettings } from "@/components/utils/useAppSettings";
import { TrendingUp, TrendingDown, ArrowRightLeft, PiggyBank } from "lucide-react";

export default function SummaryCards({ income, expense, savings }) {
  const { formatCurrency } = useAppSettings();
  const net = income - expense;
  const savingsRate = income > 0 ? ((savings / income) * 100).toFixed(1) : 0;

  const cards = [
    {
      label: "Total Pemasukan",
      value: formatCurrency(income),
      icon: TrendingUp,
      color: "#22C55E",
      bg: "#22C55E12",
    },
    {
      label: "Total Pengeluaran",
      value: formatCurrency(expense),
      icon: TrendingDown,
      color: "#EF4444",
      bg: "#EF444412",
    },
    {
      label: "Net Cash Flow",
      value: formatCurrency(Math.abs(net)),
      prefix: net >= 0 ? "+" : "-",
      icon: ArrowRightLeft,
      color: net >= 0 ? "#22C55E" : "#EF4444",
      bg: net >= 0 ? "#22C55E12" : "#EF444412",
    },
    {
      label: "Savings Rate",
      value: `${savingsRate}%`,
      icon: PiggyBank,
      color: parseFloat(savingsRate) >= 20 ? "#22C55E" : parseFloat(savingsRate) >= 10 ? "#F59E0B" : "#EF4444",
      bg: parseFloat(savingsRate) >= 20 ? "#22C55E12" : parseFloat(savingsRate) >= 10 ? "#F59E0B12" : "#EF444412",
      badge: parseFloat(savingsRate) >= 20 ? "Bagus!" : parseFloat(savingsRate) >= 10 ? "Cukup" : "Perlu ditingkatkan",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="bg-white rounded-2xl p-4 shadow-sm border border-[#F0F2F5]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-[#8FA4C8] font-medium leading-tight">{card.label}</p>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: card.bg }}>
              <card.icon className="w-4 h-4" style={{ color: card.color }} />
            </div>
          </div>
          <p className="text-lg font-bold" style={{ color: card.color }}>
            {card.prefix || ""}{card.value}
          </p>
          {card.badge && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block"
              style={{ backgroundColor: card.color + "20", color: card.color }}>
              {card.badge}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}