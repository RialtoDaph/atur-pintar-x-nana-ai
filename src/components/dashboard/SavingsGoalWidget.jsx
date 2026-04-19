import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAppSettings } from "@/components/utils/useAppSettings";
import { PlusCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function SavingsGoalWidget({ goals, loading }) {
  const { formatCurrency } = useAppSettings();

  const activeGoals = (goals || [])
    .filter(g => g.status === "active")
    .sort((a, b) => {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline) - new Date(b.deadline);
    })
    .slice(0, 2);

  if (loading) return <div className="bg-white rounded-2xl shadow-sm h-24 animate-pulse" />;

  if (activeGoals.length === 0) return (
    <div className="bg-white rounded-2xl shadow-sm p-5 text-center">
      <p className="text-2xl mb-2">🎯</p>
      <p className="text-sm font-semibold text-[#1A1A1A] mb-1">Belum ada tujuan tabungan</p>
      <p className="text-xs text-[#8FA4C8] mb-3">Tetapkan tujuan untuk motivasi menabung</p>
      <Link to={createPageUrl("Goals")} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F97316] text-white text-xs font-bold">
        <PlusCircle className="w-3.5 h-3.5" /> Buat Tujuan Tabungan
      </Link>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-[#1A1A1A]">Tujuan Tabungan 🎯</h3>
        <Link to={createPageUrl("Goals")} className="text-xs text-[#F97316] font-semibold">Lihat Semua</Link>
      </div>
      <div className="space-y-4">
        {activeGoals.map(goal => {
          const pct = goal.target_amount > 0 ? Math.min((goal.current_amount / goal.target_amount) * 100, 100) : 0;
          const deadlineStr = goal.deadline ? new Date(goal.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : null;
          return (
            <Link key={goal.id} to={createPageUrl(`Goals?id=${goal.id}`)} className="block">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{goal.icon || "💰"}</span>
                  <span className="text-sm font-semibold text-[#1A1A1A] truncate max-w-[140px]">{goal.name}</span>
                </div>
                <span className="text-xs font-bold text-[#F97316]">{Math.round(pct)}%</span>
              </div>
              <div className="h-2.5 bg-[#F2F4F7] rounded-full overflow-hidden mb-1.5">
                <motion.div className="h-full rounded-full bg-[#F97316]" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: "easeOut" }} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-[#8FA4C8]">{formatCurrency(goal.current_amount || 0)} / {formatCurrency(goal.target_amount)}</span>
                {deadlineStr && <span className="text-[10px] text-[#8FA4C8]">📅 {deadlineStr}</span>}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}