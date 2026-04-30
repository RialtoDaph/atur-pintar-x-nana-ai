import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

function CustomTooltip({ active, payload, formatCurrency }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1A1A1A] text-white text-xs rounded-xl px-3 py-2 shadow-xl">
      <p className="font-bold">{formatCurrency(payload[0].value)}</p>
      <p className="text-white/50 mt-0.5">{payload[0].payload?.label}</p>
    </div>
  );
}

export default function PortfolioSummaryChart({ totalBeli, totalJual, saldoAktif, transactions, formatCurrency }) {
  // Build cumulative saldo aktif over time from transactions
  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    const sorted = [...transactions]
      .filter(tx => tx.transaction_date && tx.total_amount)
      .sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date));

    if (sorted.length === 0) return [];

    let running = 0;
    const points = sorted.map(tx => {
      if (tx.type === "buy") running += tx.total_amount;
      else if (tx.type === "sell") running -= tx.total_amount;
      const d = new Date(tx.transaction_date);
      return {
        value: running,
        label: d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
      };
    });

    return points;
  }, [transactions]);

  const isPositive = saldoAktif >= 0;
  const color = "#00C9A7";

  return (
    <div>
      {/* Numbers + Chart menyatu */}
      <div className="relative">
        {/* Overlay info di atas chart */}
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-white/40 text-xs mb-0.5">Saldo Aktif</p>
            <p className="text-white text-3xl font-bold leading-none">{formatCurrency(saldoAktif)}</p>
          </div>
          <div className="flex gap-4 text-right pb-1">
            <div>
              <p className="text-white/40 text-[10px]">Total Beli</p>
              <p className="text-white/80 text-xs font-semibold">{formatCurrency(totalBeli)}</p>
            </div>
            <div>
              <p className="text-white/40 text-[10px]">Total Jual</p>
              <p className="text-white/80 text-xs font-semibold">{formatCurrency(totalJual)}</p>
            </div>
          </div>
        </div>

        {/* Chart langsung di bawah tanpa jarak */}
        {chartData.length >= 2 ? (
          <div className="-mx-2">
            <ResponsiveContainer width="100%" height={110}>
              <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="saldoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "rgba(255,255,255,0.35)" }}
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
                  strokeWidth={2}
                  fill="url(#saldoGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[60px] flex items-center justify-center">
            <p className="text-white/25 text-xs">Tambah transaksi untuk melihat tren</p>
          </div>
        )}
      </div>
    </div>
  );
}