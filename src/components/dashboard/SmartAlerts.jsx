import { AlertTriangle, TrendingUp, Info } from "lucide-react";
import { useAppSettings } from "@/components/utils/useAppSettings";

export default function SmartAlerts({ transactions, loading }) {
  const { t } = useAppSettings();
  if (loading) return null;

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

  const alerts = [];

  if (lastExpense > 0 && thisExpense > lastExpense) {
    const pct = Math.round(((thisExpense - lastExpense) / lastExpense) * 100);
    alerts.push({
      icon: TrendingUp,
      color: "text-red-500",
      bg: "bg-red-50",
      border: "border-red-100",
      text: `Pengeluaran naik ${pct}% dibanding bulan lalu`,
    });
  }

  // High single expense
  const highTx = thisMonth.filter(t => t.type === "expense" && t.amount > 500000);
  if (highTx.length > 0) {
    alerts.push({
      icon: AlertTriangle,
      color: "text-orange-500",
      bg: "bg-orange-50",
      border: "border-orange-100",
      text: `${highTx.length} transaksi besar (>Rp 500rb) bulan ini`,
    });
  }

  const thisIncome = thisMonth.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  if (thisIncome > 0 && thisExpense / thisIncome > 0.8) {
    alerts.push({
      icon: Info,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
      border: "border-yellow-100",
      text: `Kamu sudah pakai ${Math.round((thisExpense / thisIncome) * 100)}% dari pemasukan bulan ini`,
    });
  }

  if (alerts.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 space-y-1.5">
      <h2 className="font-bold text-[#0A0A0A] text-sm mb-2">{t('smart_alerts_title')}</h2>
      {alerts.map((a, i) => (
        <div key={i} className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 border ${a.bg} ${a.border}`}>
          <a.icon className={`w-3.5 h-3.5 flex-shrink-0 ${a.color}`} />
          <p className="text-xs text-[#1A1A1A] font-medium">{a.text}</p>
        </div>
      ))}
    </div>
  );
}