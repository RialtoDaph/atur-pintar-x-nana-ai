import { useState } from "react";
import { TrendingDown, AlertTriangle, CheckCircle, Lightbulb, X } from "lucide-react";
import { useAppSettings } from "@/components/utils/useAppSettings";

export default function DashboardInsights({ transactions, goals }) {
  const { formatCurrency } = useAppSettings();
  const [dismissedInsights, setDismissedInsights] = useState([]);

  const now = new Date();
  const thisMonth = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const lastMonth = transactions.filter(t => {
    const d = new Date(t.date);
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
  });

  const thisExpense = thisMonth.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const lastExpense = lastMonth.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const thisIncome = thisMonth.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);

  const savingsRate = thisIncome > 0 ? ((thisIncome - thisExpense) / thisIncome) * 100 : 0;
  const expenseChange = lastExpense > 0 ? ((thisExpense - lastExpense) / lastExpense) * 100 : 0;

  const insights = [];

  if (lastExpense > 0) {
    if (expenseChange > 20) {
      insights.push({
        id: "expense_increase",
        icon: <AlertTriangle className="w-4 h-4 text-[#FF6B6B]" />,
        color: "bg-[#FF6B6B]/15 border-[#FF6B6B]/50",
        textColor: "text-[#FF6B6B]",
        text: `Pengeluaran bulan ini naik ${expenseChange.toFixed(0)}% dibanding bulan lalu (${formatCurrency(lastExpense)} → ${formatCurrency(thisExpense)}).`,
      });
    } else if (expenseChange < -10) {
      insights.push({
        id: "expense_decrease",
        icon: <TrendingDown className="w-4 h-4 text-[#00C9A7]" />,
        color: "bg-[#00C9A7]/15 border-[#00C9A7]/50",
        textColor: "text-[#00C9A7]",
        text: `Hebat! Pengeluaran turun ${Math.abs(expenseChange).toFixed(0)}% dibanding bulan lalu.`,
      });
    }
  }

  if (thisIncome > 0) {
    if (savingsRate >= 20) {
      insights.push({
        id: "savings_good",
        icon: <CheckCircle className="w-4 h-4 text-[#00C9A7]" />,
        color: "bg-[#00C9A7]/15 border-[#00C9A7]/50",
        textColor: "text-[#00C9A7]",
        text: `Tingkat tabungan bulan ini ${savingsRate.toFixed(0)}% — di atas standar 20%. Pertahankan!`,
      });
    } else if (savingsRate < 10 && savingsRate > 0) {
      insights.push({
        id: "savings_low",
        icon: <Lightbulb className="w-4 h-4 text-[#F5A623]" />,
        color: "bg-[#F5A623]/15 border-[#F5A623]/50",
        textColor: "text-[#F5A623]",
        text: `Tingkat tabungan ${savingsRate.toFixed(0)}%. Idealnya minimal 20% dari pemasukan — coba kurangi 1-2 kategori pengeluaran.`,
      });
    }
  }

  const urgentGoals = goals.filter(g => {
    if (!g.deadline || g.status === "completed") return false;
    const days = Math.ceil((new Date(g.deadline) - now) / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= 30;
  });

  if (urgentGoals.length > 0) {
    insights.push({
      id: "urgent_goals",
      icon: <AlertTriangle className="w-4 h-4 text-[#F97316]" />,
      color: "bg-[#F97316]/15 border-[#F97316]/50",
      textColor: "text-[#F97316]",
      text: `${urgentGoals.length} tujuan tabungan mendekati deadline — "${urgentGoals[0].name}" dalam ${Math.ceil((new Date(urgentGoals[0].deadline) - now) / (1000 * 60 * 60 * 24))} hari.`,
    });
  }

  const filteredInsights = insights.filter(ins => !dismissedInsights.includes(ins.id));

  const handleDismiss = (id) => {
    setDismissedInsights(prev => [...prev, id]);
  };

  if (filteredInsights.length === 0) return null;

  return (
    <div className="space-y-2">
      {filteredInsights.map((ins) => (
        <div key={ins.id} className={`flex items-start gap-3 rounded-xl px-3 py-2.5 border ${ins.color}`}>
          <div className="flex-shrink-0 mt-0.5">{ins.icon}</div>
          <p className={`text-xs leading-relaxed flex-1 ${ins.textColor}`}>{ins.text}</p>
          <button
            onClick={() => handleDismiss(ins.id)}
            className="flex-shrink-0 ml-2 p-1 hover:bg-black/10 rounded-full transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5 opacity-60 hover:opacity-100" />
          </button>
        </div>
      ))}
    </div>
  );
}