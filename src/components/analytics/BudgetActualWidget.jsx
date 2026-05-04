import { useAppSettings } from "@/components/utils/useAppSettings";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

const MONTHS_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export default function BudgetActualWidget({ budgets, transactions, periodSubtitle }) {
  const { formatCurrency, formatShortNumber } = useAppSettings();
  const now = new Date();

  // Build last 6 months of data: total budget vs total actual expense
  const chartData = useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = MONTHS_ID[d.getMonth()];

      // Total budget for this month
      const monthBudgets = budgets.filter(b => b.month === monthKey);
      const totalBudget = monthBudgets.reduce((s, b) => s + (b.amount || 0), 0);

      // Total actual expense for this month
      const totalActual = transactions
        .filter(t => {
          if (t.type !== "expense") return false;
          const td = new Date(t.date);
          return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
        })
        .reduce((s, t) => s + (t.amount || 0), 0);

      data.push({ name: label, Budget: totalBudget, Aktual: totalActual });
    }
    return data;
  }, [budgets, transactions]);

  const hasAnyBudget = chartData.some(d => d.Budget > 0);

  if (budgets.length === 0 || !hasAnyBudget) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="mb-3">
          <h2 className="font-bold text-[#1A1A1A] text-base">Budget vs Aktual</h2>
          {periodSubtitle && <p className="text-xs text-[#8FA4C8] mt-0.5">{periodSubtitle}</p>}
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <span className="text-4xl mb-3">💸</span>
          <p className="font-semibold text-[#1A1A1A] text-sm mb-1">Kamu belum punya budget nih!</p>
          <p className="text-xs text-[#8FA4C8] mb-4">Set budget bulananmu sekarang biar pengeluaran lebih terkontrol</p>
          <Link
            to={createPageUrl("Budget")}
            className="px-4 py-2 bg-[#FF6A00] text-white text-xs font-semibold rounded-xl hover:bg-[#e55f00] transition-colors"
          >
            Buat Budget
          </Link>
        </div>
      </div>
    );
  }

  // Footer logic: compare current month
  const current = chartData[chartData.length - 1];
  const diff = current.Aktual - current.Budget;
  let footerText, footerColor;
  if (current.Budget === 0) {
    footerText = "ℹ️ Belum ada budget untuk bulan ini";
    footerColor = "text-[#8FA4C8]";
  } else if (diff > 0) {
    footerText = `🚨 Bulan ini melebihi budget ${formatCurrency(diff)}`;
    footerColor = "text-[#FF6B6B]";
  } else {
    footerText = `✅ Bulan ini hemat ${formatCurrency(Math.abs(diff))} dari budget`;
    footerColor = "text-[#00C9A7]";
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <div className="mb-4">
        <h2 className="font-bold text-[#1A1A1A] text-base">Budget vs Aktual</h2>
        {periodSubtitle && <p className="text-xs text-[#8FA4C8] mt-0.5">Tren 6 bulan terakhir</p>}
      </div>

      <div className="h-56 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F2F4F7" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#8FA4C8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#8FA4C8" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatShortNumber(v)}
              width={45}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0A0A0A",
                border: "none",
                borderRadius: 12,
                fontSize: 12,
                color: "#fff",
              }}
              labelStyle={{ color: "#8FA4C8", fontSize: 11 }}
              formatter={(value) => formatCurrency(value)}
            />
            <Legend
              iconType="circle"
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            />
            <Line
              type="monotone"
              dataKey="Budget"
              stroke="#4F7CFF"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#4F7CFF" }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="Aktual"
              stroke="#FF6B6B"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#FF6B6B" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className={`mt-4 pt-3 border-t border-[#F2F4F7] text-xs font-medium ${footerColor}`}>
        {footerText}
      </div>
    </div>
  );
}