import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, CheckCircle, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAppSettings } from "@/components/utils/useAppSettings";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const DEFAULT_CATEGORIES = {
  housing: { label: "Housing", emoji: "🏠", color: "#4F7CFF" },
  food: { label: "Food", emoji: "🍔", color: "#00C9A7" },
  transport: { label: "Transport", emoji: "🚗", color: "#F5A623" },
  health: { label: "Health", emoji: "❤️", color: "#FF6B6B" },
  entertainment: { label: "Entertainment", emoji: "🎬", color: "#9B59B6" },
  shopping: { label: "Shopping", emoji: "🛍️", color: "#E91E8C" },
  subscriptions: { label: "Subscriptions", emoji: "📱", color: "#1ABC9C" },
  other: { label: "Other", emoji: "📦", color: "#95A5A6" },
};

export default function BudgetAlertWidget({ transactions = [], loading = false, budgets = [] }) {
  const { formatCurrency, t } = useAppSettings();
  const currentMonth = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  if (loading) {
    return <div className="bg-white rounded-2xl shadow-sm h-24 animate-pulse" />;
  }

  if (budgets.length === 0) return null;

  // Calculate spending per category for this month
  const now = new Date();
  const thisMonthExpenses = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.type === "expense";
  });

  const spendingByCategory = {};
  thisMonthExpenses.forEach(tx => {
    const key = tx.category || "other";
    spendingByCategory[key] = (spendingByCategory[key] || 0) + tx.amount;
  });

  // Only show budgets that are >= 70% used
  const alertBudgets = budgets
    .map(b => {
      const spent = spendingByCategory[b.category] || 0;
      const percent = b.amount > 0 ? (spent / b.amount) * 100 : 0;
      return { ...b, spent, percent };
    })
    .filter(b => b.percent >= 70)
    .sort((a, b) => b.percent - a.percent);

  // Map all budgets with spending info
  const allBudgets = budgets
    .map(b => {
      const spent = spendingByCategory[b.category] || 0;
      const percent = b.amount > 0 ? (spent / b.amount) * 100 : 0;
      return { ...b, spent, percent };
    })
    .sort((a, b) => b.percent - a.percent);

  if (allBudgets.length === 0) return null;

  const hasAlert = allBudgets.some(b => b.percent >= 70);

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <h2 className="font-bold text-[#0A0A0A] text-sm">{t('budget_alert_title')}</h2>
        <Link to={createPageUrl("Budget")} className="text-xs text-[#FF6A00] font-semibold flex items-center gap-0.5">
          {t('view_all')} <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="px-4 pb-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {allBudgets.map(b => {
          const cat = DEFAULT_CATEGORIES[b.category] || { label: b.category, emoji: "📦", color: "#95A5A6" };
          const isOver = b.percent > 100;
          const isNear = b.percent >= 80 && !isOver;
          const isSafe = !isOver && !isNear;

          const pieData = [
            { value: Math.min(b.spent, b.amount), color: isOver ? "#FF6B6B" : isNear ? "#F5A623" : cat.color },
            { value: Math.max(0, b.amount - b.spent), color: "#F2F4F7" }
          ];

          return (
            <Link
              key={b.id}
              to={createPageUrl("Budget")}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#F8FAFC] hover:bg-[#F2F4F7] transition-colors"
            >
              {/* Pie Chart */}
              <div className="w-12 h-12">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={14} outerRadius={24} startAngle={90} endAngle={-270}>
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Category Info */}
              <div className="text-center">
                <p className="text-xl">{cat.emoji}</p>
                <p className="text-[11px] font-semibold text-[#1A1A1A] mt-1 line-clamp-1">{cat.label}</p>
                <p className="text-[9px] text-[#8FA4C8] mt-0.5">
                  {isSafe && "Aman"}
                  {isNear && "Hampir"}
                  {isOver && "Lewat"}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}