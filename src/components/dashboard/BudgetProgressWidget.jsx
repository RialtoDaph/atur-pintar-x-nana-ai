import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAppSettings } from "@/components/utils/useAppSettings";
import { base44 } from "@/api/base44Client";
import { useState, useEffect } from "react";
import { PlusCircle } from "lucide-react";

export default function BudgetProgressWidget({ budgets, transactions, loading, user }) {
  const { formatCurrency } = useAppSettings();
  const [globalCats, setGlobalCats] = useState([]);

  useEffect(() => {
    base44.entities.GlobalCategory.list("sort_order").then(cats => setGlobalCats(cats || [])).catch(() => {});
  }, []);

  const now = new Date();
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const thisMonthBudgets = budgets.filter(b => b.month === thisMonthKey);

  const thisMonthTx = (transactions || []).filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      && t.type === "expense" && !(t.is_recurring && !t.is_recurring_child);
  });

  function getCatInfo(catKey) {
    const gc = globalCats.find(c => c.id === catKey);
    if (gc) return { name: gc.name, emoji: gc.emoji || "📦" };
    const defaults = { housing: { name: "Tempat Tinggal", emoji: "🏠" }, food: { name: "Makanan", emoji: "🍔" }, transport: { name: "Transportasi", emoji: "🚗" }, health: { name: "Kesehatan", emoji: "❤️" }, entertainment: { name: "Hiburan", emoji: "🎬" }, shopping: { name: "Belanja", emoji: "🛍️" }, subscriptions: { name: "Langganan", emoji: "📱" }, other: { name: "Lainnya", emoji: "📦" } };
    return defaults[catKey] || { name: catKey, emoji: "📦" };
  }

  if (loading) return <div className="bg-white rounded-2xl shadow-sm h-32 animate-pulse" />;

  if (thisMonthBudgets.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-5 text-center">
        <p className="text-2xl mb-2">💰</p>
        <p className="text-sm font-semibold text-[#1A1A1A] mb-1">Belum ada anggaran</p>
        <p className="text-xs text-[#8FA4C8] mb-3">Buat anggaran untuk mengontrol pengeluaran bulananmu</p>
        <Link to={createPageUrl("Budget")} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F97316] text-white text-xs font-bold">
          <PlusCircle className="w-3.5 h-3.5" /> Buat Anggaran Pertama
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-[#1A1A1A]">Budget Bulan Ini 📊</h3>
        <Link to={createPageUrl("Budget")} className="text-xs text-[#F97316] font-semibold">Lihat Semua</Link>
      </div>
      <div className="space-y-3">
        {thisMonthBudgets.map(budget => {
          const spent = thisMonthTx.filter(t => t.category === budget.category).reduce((s, t) => s + t.amount, 0);
          const pct = budget.amount > 0 ? Math.min((spent / budget.amount) * 100, 100) : 0;
          const barColor = pct > 90 ? "#DC2626" : pct > 70 ? "#D97706" : "#16A34A";
          const { name, emoji } = getCatInfo(budget.category);
          return (
            <div key={budget.id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[#1A1A1A] flex items-center gap-1.5">
                  <span>{emoji}</span>{name}
                </span>
                <span className="text-xs text-[#8FA4C8]">
                  {formatCurrency(spent)} / {formatCurrency(budget.amount)}
                </span>
              </div>
              <div className="h-2 bg-[#F2F4F7] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: barColor }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}