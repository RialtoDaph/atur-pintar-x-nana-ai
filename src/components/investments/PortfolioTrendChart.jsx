import { useMemo, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useAppSettings } from "@/components/utils/AppSettingsContext";

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

function generateTrendData(investments, period) {
  const now = new Date();
  const months = period === "1M" ? 1 : period === "3M" ? 3 : period === "6M" ? 6 : 12;
  const points = period === "1M" ? 30 : period === "3M" ? 12 : period === "6M" ? 6 : 12;
  const intervalDays = (months * 30) / points;

  const totalInvested = investments.reduce((s, i) => s + (i.initial_amount || 0), 0);
  const totalCurrent = investments.reduce((s, i) => s + (i.current_value || 0), 0);

  if (totalInvested === 0) return [];

  const growthRate = totalInvested > 0 ? (totalCurrent - totalInvested) / totalInvested : 0;

  return Array.from({ length: points + 1 }, (_, idx) => {
    const daysBack = (points - idx) * intervalDays;
    const d = new Date(now);
    d.setDate(d.getDate() - Math.round(daysBack));

    // Simulate progressive growth curve
    const progress = idx / points;
    const randomNoise = (Math.random() - 0.48) * 0.015;
    const smoothed = progress + randomNoise;
    const value = totalInvested + (totalCurrent - totalInvested) * Math.max(0, smoothed);

    return {
      date: d,
      value: Math.round(value),
      label: period === "1M"
        ? d.toLocaleDateString("id-ID", { day: "numeric", month: "short" })
        : d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" }),
    };
  });
}

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

export default function PortfolioTrendChart({ investments, totalValue, totalInvested }) {
  const { settings, formatCurrency, formatShortNumber } = useAppSettings();
  const lang = settings.language;
  const isEn = lang === "en";
  const [period, setPeriod] = useState("6M");

  const totalGain = totalValue - totalInvested;
  const gainPct = totalInvested > 0 ? ((totalGain / totalInvested) * 100).toFixed(2) : "0.00";
  const isPositive = totalGain >= 0;
  const color = isPositive ? "#00C9A7" : "#FF6B6B";

  const data = useMemo(() => generateTrendData(investments, period), [investments, period]);

  const periods = isEn ? PERIODS_EN : PERIODS;

  if (investments.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <p className="text-xs text-[#8FA4C8] font-medium mb-0.5">
            {isEn ? "Portfolio Performance" : "Performa Portofolio"}
          </p>
          <p className="text-2xl font-bold text-[#1A1A1A]">{formatCurrency(totalValue)}</p>
        </div>
        <div className={`text-right`}>
          <span className={`text-sm font-bold ${isPositive ? "text-[#00C9A7]" : "text-[#FF6B6B]"}`}>
            {isPositive ? "+" : ""}{gainPct}%
          </span>
          <p className={`text-xs font-medium ${isPositive ? "text-[#00C9A7]" : "text-[#FF6B6B]"}`}>
            {isPositive ? "+" : ""}{formatCurrency(totalGain)}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="mt-4 -mx-2">
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.18} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#8FA4C8" }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis hide domain={["auto", "auto"]} />
            <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2.5}
              fill="url(#portfolioGrad)"
              dot={false}
              activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Period selector */}
      <div className="flex gap-1 mt-3 justify-center">
        {periods.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              period === p.key
                ? "bg-[#1A1A1A] text-white"
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