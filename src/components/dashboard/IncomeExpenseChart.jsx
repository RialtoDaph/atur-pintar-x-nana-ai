import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChevronDown } from "lucide-react";
import { useAppSettings } from "@/components/utils/useAppSettings";

export default function IncomeExpenseChart({ transactions, loading }) {
  const { formatCurrency, t } = useAppSettings();
  const [months, setMonths] = useState(1);

  const chartData = useMemo(() => {
    if (!transactions.length) return [];

    const now = new Date();
    const data = {};

    // Initialize last N months
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString('id-ID', { month: 'short', year: '2-digit' });
      data[key] = { month: key, income: 0, expense: 0 };
    }

    // Aggregate transactions
    transactions.forEach(tx => {
      const d = new Date(tx.date);
      if (d >= new Date(now.getFullYear(), now.getMonth() - months + 1, 1)) {
        const key = d.toLocaleString('id-ID', { month: 'short', year: '2-digit' });
        if (data[key]) {
          if (tx.type === 'income') data[key].income += tx.amount;
          if (tx.type === 'expense') data[key].expense += tx.amount;
        }
      }
    });

    return Object.values(data);
  }, [transactions, months]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-4 h-80 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-64 bg-gray-100 rounded" />
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-4 h-80 flex items-center justify-center">
        <p className="text-[#8FA4C8] text-sm">{t('no_transaction_data')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <h2 className="font-bold text-[#0A0A0A] text-sm mb-4">{t('income_vs_expense')}</h2>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 5, right: 8, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#8FA4C8" />
          <YAxis tick={{ fontSize: 11 }} stroke="#8FA4C8" width={35} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1A1A1A',
              border: '1px solid #2D2D2D',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '11px'
            }}
            formatter={(value) => formatCurrency(value)}
            labelStyle={{ color: '#fff' }}
          />
          <Legend 
            wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
            formatter={(value) => value === 'income' ? t('income_legend') : t('expense_legend')}
          />
          <Bar dataKey="income" fill="#22C55E" radius={[6, 6, 0, 0]} />
          <Bar dataKey="expense" fill="#EF4444" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}