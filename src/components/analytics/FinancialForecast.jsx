import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { TrendingUp, Loader2, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts";
import { useAppSettings } from "@/components/utils/useAppSettings";

export default function FinancialForecast({ trendData, totalIncome, totalExpenses, savingsRate }) {
  const { formatCurrency, formatShortNumber } = useAppSettings();
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);

  async function generateForecast() {
    setLoading(true);
    setForecast(null);

    const historyText = trendData.map(d =>
      `${d.name}: Pemasukan ${Math.round(d.Income || 0).toLocaleString("id-ID")}, Pengeluaran ${Math.round(d.Expenses || 0).toLocaleString("id-ID")}`
    ).join("\n");

    const prompt = `Kamu adalah analis keuangan. Berdasarkan data historis berikut, prediksi 3 bulan ke depan (bulan 1, 2, 3 setelah data terakhir).

DATA HISTORIS (Rupiah):
${historyText}

Kembalikan HANYA JSON berikut (tanpa markdown):
{
  "months": [
    {"name": "Bulan +1", "income": 0, "expenses": 0},
    {"name": "Bulan +2", "income": 0, "expenses": 0},
    {"name": "Bulan +3", "income": 0, "expenses": 0}
  ],
  "insight": "Satu kalimat insight singkat tentang tren keuangan ke depan",
  "risk": "low|medium|high"
}`;

    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            months: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  income: { type: "number" },
                  expenses: { type: "number" }
                }
              }
            },
            insight: { type: "string" },
            risk: { type: "string" }
          }
        }
      });
      setForecast(res);
    } catch (e) {
      setForecast({ error: true });
    }
    setLoading(false);
  }

  const chartData = [
    ...trendData.map(d => ({ name: d.name, income: d.Income, expenses: d.Expenses, type: "actual" })),
    ...(forecast?.months || []).map(d => ({ name: d.name, forecastIncome: d.income, forecastExpenses: d.expenses, type: "forecast" }))
  ];

  const riskColor = { low: "#00C9A7", medium: "#F5A623", high: "#FF6B6B" };
  const riskLabel = { low: "Rendah ✅", medium: "Sedang ⚠️", high: "Tinggi 🔴" };

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">

    </div>
  );
}