import { useState, useEffect, useCallback } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useAppSettings } from "@/components/utils/AppSettingsContext";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";

const PERIODS = [
  { key: "1M", label: "1B" },
  { key: "3M", label: "3B" },
  { key: "6M", label: "6B" },
  { key: "1Y", label: "1T" },
];

const PERIODS_EN = [
  { key: "1M", label: "1M" },
  { key: "3M", label: "3M" },
  { key: "6M", label: "6M" },
  { key: "1Y", label: "1Y" },
];

function CustomTooltip({ active, payload, formatCurrency }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-[#1A1A1A] text-white text-xs rounded-xl px-3 py-2 shadow-xl">
      <p className="font-bold">{formatCurrency(item.value)}</p>
      <p className="text-white/50 mt-0.5">{item.payload?.label}</p>
    </div>
  );
}

export default function PortfolioTrendChart({ investments, totalValue, totalInvested, darkMode = false }) {
  const { settings, formatCurrency } = useAppSettings();
  const lang = settings.language;
  const isEn = lang === "en";
  const [period, setPeriod] = useState("3M");
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const totalGain = totalValue - totalInvested;
  const gainPct = totalInvested > 0 ? ((totalGain / totalInvested) * 100).toFixed(2) : "0.00";
  const isPositive = totalGain >= 0;
  const color = isPositive ? "#00C9A7" : "#FF6B6B";
  const periods = isEn ? PERIODS_EN : PERIODS;
  const isDark = darkMode;

  const fetchHistory = useCallback(async () => {
    if (!investments || investments.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("getPortfolioHistory", { period });
      const data = res?.data?.data || [];
      setChartData(data);
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [period, investments]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  if (investments.length === 0) return null;

  return (
    <div className={isDark ? "px-0" : "bg-white rounded-2xl p-5 shadow-sm"}>
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <p className={`text-xs font-medium mb-0.5 ${isDark ? "text-white/40" : "text-[#8FA4C8]"}`}>
            {isEn ? "Portfolio Performance" : "Performa Portofolio"}
          </p>
          <p className={`text-2xl font-bold ${isDark ? "text-white" : "text-[#1A1A1A]"}`}>
            {formatCurrency(totalValue)}
          </p>
        </div>
        <div className="text-right">
          <span className={`text-sm font-bold ${isPositive ? "text-[#00C9A7]" : "text-[#FF6B6B]"}`}>
            {isPositive ? "+" : ""}{gainPct}%
          </span>
          <p className={`text-xs font-medium ${isPositive ? "text-[#00C9A7]" : "text-[#FF6B6B]"}`}>
            {isPositive ? "+" : ""}{formatCurrency(totalGain)}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="mt-3 -mx-2">
        {loading ? (
          <div className="flex items-center justify-center h-[150px]">
            <Loader2 className="w-5 h-5 animate-spin text-white/40" />
          </div>
        ) : error || chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[150px]">
            <p className={`text-xs ${isDark ? "text-white/30" : "text-[#8FA4C8]"}`}>
              {isEn ? "No data available" : "Data tidak tersedia"}
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={isDark ? 0.3 : 0.18} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: isDark ? "rgba(255,255,255,0.35)" : "#8FA4C8" }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis hide domain={["auto", "auto"]} />
              <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
              <Area
                type="monotoneX"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                fill="url(#portfolioGrad)"
                dot={false}
                activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Period selector */}
      <div className="flex gap-1 mt-2 justify-center">
        {periods.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            disabled={loading}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              period === p.key
                ? isDark
                  ? "bg-white/20 text-white"
                  : "bg-[#1A1A1A] text-white"
                : isDark
                  ? "text-white/40 hover:text-white"
                  : "text-[#8FA4C8] hover:text-[#1A1A1A]"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}