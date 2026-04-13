import { useMemo } from "react";
import { useAppSettings } from "@/components/utils/useAppSettings";
import { AlertTriangle, TrendingUp, Target, PiggyBank } from "lucide-react";

export default function SmartInsights({ transactions, budgets, goals, allCategoriesConfig }) {
  const { formatCurrency } = useAppSettings();

  const insights = useMemo(() => {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthKey = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, "0")}`;

    const curMonthTx = transactions.filter(tx => tx.date?.startsWith(currentMonthKey) && !tx.is_deleted);
    const prevMonthTx = transactions.filter(tx => tx.date?.startsWith(prevMonthKey) && !tx.is_deleted);

    const list = [];

    // 1. Spending spike per category vs last month
    const curBycat = {};
    curMonthTx.filter(t => t.type === "expense").forEach(t => {
      curBycat[t.category || "other"] = (curBycat[t.category || "other"] || 0) + t.amount;
    });
    const prevBycat = {};
    prevMonthTx.filter(t => t.type === "expense").forEach(t => {
      prevBycat[t.category || "other"] = (prevBycat[t.category || "other"] || 0) + t.amount;
    });
    Object.entries(curBycat).forEach(([cat, cur]) => {
      const prev = prevBycat[cat] || 0;
      if (prev > 0 && cur > prev * 1.2) {
        const catCfg = allCategoriesConfig[cat] || { label: cat, emoji: "📦" };
        const pct = Math.round(((cur - prev) / prev) * 100);
        list.push({
          type: "warning",
          icon: TrendingUp,
          color: "#F59E0B",
          bg: "#FEF3C7",
          title: `Pengeluaran ${catCfg.emoji} ${catCfg.label} naik ${pct}%`,
          desc: `Bulan ini: ${formatCurrency(cur)} vs bulan lalu: ${formatCurrency(prev)}`,
        });
      }
    });

    // 2. Budget > 80%
    const curBudgets = budgets.filter(b => b.month === currentMonthKey);
    curBudgets.forEach(b => {
      const spent = curBycat[b.category] || 0;
      const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0;
      if (pct > 80) {
        const catCfg = allCategoriesConfig[b.category] || { label: b.category, emoji: "📦" };
        list.push({
          type: pct > 100 ? "danger" : "alert",
          icon: AlertTriangle,
          color: pct > 100 ? "#EF4444" : "#F97316",
          bg: pct > 100 ? "#FEE2E2" : "#FFF7ED",
          title: `Budget ${catCfg.emoji} ${catCfg.label} ${pct > 100 ? "melebihi batas!" : "hampir habis ("+Math.round(pct)+"%)"}`,
          desc: `Terpakai ${formatCurrency(spent)} dari ${formatCurrency(b.amount)}`,
        });
      }
    });

    // 3. Savings rate < 10%
    const curIncome = curMonthTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const curSavings = curMonthTx.filter(t => t.type === "savings").reduce((s, t) => s + t.amount, 0);
    if (curIncome > 0 && curSavings / curIncome < 0.1) {
      list.push({
        type: "tip",
        icon: PiggyBank,
        color: "#3B82F6",
        bg: "#EFF6FF",
        title: "Savings rate rendah (<10%)",
        desc: `Coba sisihkan minimal ${formatCurrency(curIncome * 0.1)} per bulan untuk tabungan.`,
      });
    }

    // 4. Goal deadline approaching
    goals.filter(g => g.status === "active" && g.deadline).forEach(g => {
      const daysLeft = Math.ceil((new Date(g.deadline) - now) / 86400000);
      const progress = g.target_amount > 0 ? (g.current_amount || 0) / g.target_amount : 0;
      if (daysLeft > 0 && daysLeft <= 30 && progress < 0.8) {
        list.push({
          type: "goal",
          icon: Target,
          color: "#8B5CF6",
          bg: "#F5F3FF",
          title: `Goal "${g.name}" deadline dalam ${daysLeft} hari`,
          desc: `Progres ${Math.round(progress * 100)}% — masih kurang ${formatCurrency(g.target_amount - (g.current_amount || 0))}`,
        });
      }
    });

    return list.slice(0, 5);
  }, [transactions, budgets, goals, allCategoriesConfig, formatCurrency]);

  if (insights.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#F0F2F5]">
      <p className="text-sm font-bold text-[#1A1A1A] mb-3">💡 Smart Insights</p>
      <div className="space-y-2.5">
        {insights.map((ins, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: ins.bg }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ backgroundColor: ins.color + "25" }}>
              <ins.icon className="w-3.5 h-3.5" style={{ color: ins.color }} />
            </div>
            <div>
              <p className="text-xs font-semibold" style={{ color: ins.color }}>{ins.title}</p>
              <p className="text-[11px] text-[#4A5568] mt-0.5">{ins.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}