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
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          {hasAlert && <AlertTriangle className="w-4 h-4 text-[#F5A623]" />}
          {!hasAlert && <CheckCircle className="w-4 h-4 text-[#00C9A7]" />}
          <h2 className="font-bold text-[#0A0A0A] text-sm">{t('budget_alert_title')}</h2>
        </div>
        <Link to={createPageUrl("Budget")} className="text-xs text-[#FF6A00] font-semibold flex items-center gap-0.5">
          Lihat semua <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="px-4 pb-4 flex gap-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {allBudgets.map(b => {
          const cat = DEFAULT_CATEGORIES[b.category] || { label: b.category, emoji: "📦", color: "#95A5A6" };
          const isOver = b.percent > 100;
          const isNear = b.percent >= 80 && !isOver;

          let riskColor;
          if (isOver) riskColor = "#FF6B6B";
          else if (b.percent >= 90) riskColor = "#FF6B6B";
          else if (b.percent >= 60) riskColor = "#F5A623";
          else riskColor = "#00C9A7";

          const pieData = [
            { value: Math.min(b.spent, b.amount), color: riskColor },
            { value: Math.max(0, b.amount - b.spent), color: "transparent" }
          ];

          return (
            <Link
              key={b.id}
              to={createPageUrl("Budget")}
              className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
            >
              <div className="relative w-10 h-10 mb-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={12} outerRadius={20} startAngle={90} endAngle={-270} stroke="none">
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <span className={`absolute inset-0 flex items-center justify-center text-base font-bold ${isOver ? "text-[#FF6A00]" : ""}`}>
                  {isOver ? "!" : cat.emoji}
                </span>
              </div>
              </Link>
              );
        })}
        <Link
          to={createPageUrl("Budget")}
          className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-full bg-[#F2F4F7] group-hover:bg-[#E8EEF7] transition-colors flex items-center justify-center text-lg text-[#8FA4C8]">
            +
          </div>
        </Link>
      </div>
    </div>
  );
}