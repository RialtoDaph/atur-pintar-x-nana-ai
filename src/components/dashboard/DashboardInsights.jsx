import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Lightbulb } from "lucide-react";
import { formatRupiah } from "@/components/utils/formatRupiah";

export default function DashboardInsights({ transactions, goals }) {
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

  // Expense comparison
  if (lastExpense > 0) {
    if (expenseChange > 20) {
      insights.push({
        icon: <AlertTriangle className="w-4 h-4 text-[#FF6B6B]" />,
        color: "bg-[#FF6B6B]/10 border-[#FF6B6B]/20",
        textColor: "text-[#FF6B6B]",
        text: `Pengeluaran bulan ini naik ${expenseChange.toFixed(0)}% dibanding bulan lalu (${formatRupiah(lastExpense)} → ${formatRupiah(thisExpense)}).`,
      });
    } else if (expenseChange < -10) {
      insights.push({
        icon: <TrendingDown className="w-4 h-4 text-[#00C9A7]" />,
        color: "bg-[#00C9A7]/10 border-[#00C9A7]/20",
        textColor: "text-[#00C9A7]",
        text: `Hebat! Pengeluaran turun ${Math.abs(expenseChange).toFixed(0)}% dibanding bulan lalu.`,
      });
    }
  }

  // Savings rate
  if (thisIncome > 0) {
    if (savingsRate >= 20) {
      insights.push({
        icon: <CheckCircle className="w-4 h-4 text-[#00C9A7]" />,
        color: "bg-[#00C9A7]/10 border-[#00C9A7]/20",
        textColor: "text-[#00C9A7]",
        text: `Tingkat tabungan bulan ini ${savingsRate.toFixed(0)}% — di atas standar 20%. Pertahankan!`,
      });
    } else if (savingsRate < 10 && savingsRate > 0) {
      insights.push({
        icon: <Lightbulb className="w-4 h-4 text-[#F5A623]" />,
        color: "bg-[#F5A623]/10 border-[#F5A623]/20",
        textColor: "text-[#F5A623]",
        text: `Tingkat tabungan ${savingsRate.toFixed(0)}%. Idealnya minimal 20% dari pemasukan — coba kurangi 1-2 kategori pengeluaran.`,
      });
    }
  }

  // Urgent goals
  const urgentGoals = goals.filter(g => {
    if (!g.deadline || g.status === "completed") return false;
    const days = Math.ceil((new Date(g.deadline) - now) / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= 30;
  });

  if (urgentGoals.length > 0) {
    insights.push({
      icon: <AlertTriangle className="w-4 h-4 text-[#FF6A00]" />,
      color: "bg-[#FF6A00]/10 border-[#FF6A00]/20",
      textColor: "text-[#FF6A00]",
      text: `${urgentGoals.length} tujuan tabungan mendekati deadline — "${urgentGoals[0].name}" dalam ${Math.ceil((new Date(urgentGoals[0].deadline) - now) / (1000 * 60 * 60 * 24))} hari.`,
    });
  }

  if (insights.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-4 pt-4 pb-2 flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-[#FF6A00]" />
        <h2 className="font-bold text-[#0A0A0A] text-sm">Insight Bulan Ini</h2>
      </div>
      <div className="px-4 pb-4 space-y-2">
        {insights.map((ins, i) => (
          <div key={i} className={`flex items-start gap-3 rounded-xl px-3 py-2.5 border ${ins.color}`}>
            <div className="flex-shrink-0 mt-0.5">{ins.icon}</div>
            <p className={`text-xs leading-relaxed ${ins.textColor}`}>{ins.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}