import { useMemo } from "react";
import { Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ComposedChart } from "recharts";
import { ChevronRight, TrendingUp, TrendingDown } from "lucide-react";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { formatRupiah } from "@/components/utils/formatRupiah";
import { useAppSettings } from "@/components/utils/useAppSettings";

export default function RestaurantBarSpendingCard({
  transactions,
  customCategories,
  filterPeriod,
  customDateRange,
  onNavigateToDetail
}) {
  const navigate = useNavigate();
  const { formatShortNumber } = useAppSettings();

  const { currentMonthlyData, currentDailyAvg, trendDiff, isTrendPositive } = useMemo(() => {
    const now = new Date();

    // Build category key sets
    const restaurantCats = customCategories.filter(
      c => c.name?.toLowerCase().includes("restoran") || c.name?.toLowerCase().includes("restaurant") ||
           c.name?.toLowerCase().includes("makan")
    );
    const barCats = customCategories.filter(
      c => c.name?.toLowerCase().includes("bar") || c.name?.toLowerCase().includes("minuman") ||
           c.name?.toLowerCase().includes("kafe") || c.name?.toLowerCase().includes("cafe") ||
           c.name?.toLowerCase().includes("coffee")
    );
    const foodSubCats = customCategories.filter(c => c.parent_category_key === "food");

    const restaurantKeys = new Set([
      ...restaurantCats.map(c => `custom_${c.id}`),
      ...foodSubCats.filter(c => c.name?.toLowerCase().match(/makan|restoran|restaurant/)).map(c => `custom_${c.id}`),
    ]);
    const barKeys = new Set([
      ...barCats.map(c => `custom_${c.id}`),
      ...foodSubCats.filter(c => c.name?.toLowerCase().match(/bar|minum|kafe|cafe|coffee/)).map(c => `custom_${c.id}`),
    ]);

    // Resolve range with NaN guard
    const monthRange = customDateRange || {
      start: new Date(now.getFullYear(), now.getMonth() - ((parseInt(filterPeriod) || 6) - 1), 1),
      end: now,
    };
    const monthDiff = Math.max(0,
      (monthRange.end.getFullYear() - monthRange.start.getFullYear()) * 12 +
      (monthRange.end.getMonth() - monthRange.start.getMonth())
    );

    // Build month buckets for current period (single pass)
    const currBuckets = {};
    for (let i = 0; i <= monthDiff; i++) {
      const d = new Date(monthRange.start.getFullYear(), monthRange.start.getMonth() + i, 1);
      const k = `${d.getFullYear()}-${d.getMonth()}`;
      currBuckets[k] = {
        name: d.toLocaleDateString("id-ID", { month: "short" }),
        restaurant: 0, bar: 0, total: 0,
        label: d.toLocaleDateString("id-ID", { month: "2-digit", year: "2-digit" }),
      };
    }

    // Previous period range
    const prevRange = {
      start: new Date(monthRange.start.getFullYear(), monthRange.start.getMonth() - (monthDiff + 1), 1),
      end: new Date(monthRange.start.getFullYear(), monthRange.start.getMonth(), 0),
    };
    const prevSet = new Set();
    for (let d = new Date(prevRange.start); d <= prevRange.end; d.setMonth(d.getMonth() + 1)) {
      prevSet.add(`${d.getFullYear()}-${d.getMonth()}`);
    }

    // Single pass through transactions
    let prevTotal = 0;
    for (const t of transactions) {
      if (t.type !== "expense") continue;
      const isResto = restaurantKeys.has(t.category);
      const isBarTx = barKeys.has(t.category);
      if (!isResto && !isBarTx) continue;
      const td = new Date(t.date);
      const k = `${td.getFullYear()}-${td.getMonth()}`;
      const amt = t.amount || 0;
      if (currBuckets[k]) {
        if (isResto) currBuckets[k].restaurant += amt;
        if (isBarTx) currBuckets[k].bar += amt;
        currBuckets[k].total += amt;
      } else if (prevSet.has(k)) {
        prevTotal += amt;
      }
    }

    const currentMonthlyArr = Object.values(currBuckets);
    const fullPeriodEnd = new Date(monthRange.end.getFullYear(), monthRange.end.getMonth() + 1, 0);
    const totalDays = Math.max(Math.ceil((fullPeriodEnd - monthRange.start) / (1000 * 60 * 60 * 24)) + 1, 1);
    const currTotal = currentMonthlyArr.reduce((s, m) => s + m.total, 0);
    const currAvg = currTotal / totalDays;

    const prevDays = Math.max(Math.ceil((prevRange.end - prevRange.start) / (1000 * 60 * 60 * 24)) + 1, 1);
    const prevAvg = prevTotal / prevDays;
    const diff = currAvg - prevAvg;

    return {
      currentMonthlyData: currentMonthlyArr,
      currentDailyAvg: currAvg,
      trendDiff: diff,
      isTrendPositive: diff >= 0,
    };
  }, [transactions, customCategories, filterPeriod, customDateRange]);

  const handleNavigate = () => {
    navigate(`${createPageUrl("SpendingDetail")}?type=restaurant_bar&period=${filterPeriod}`);
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
      <h2 className="font-bold text-[#0A0A0A] text-base mb-4">Restaurant & Bar</h2>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={180}>
        <ComposedChart data={currentMonthlyData}>
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#8FA4C8" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "#8FA4C8" }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(value) => [formatRupiah(value), undefined]}
            contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }}
          />
          <Bar dataKey="restaurant" fill="#FF6A00" radius={[6, 6, 0, 0]} />
          <Bar dataKey="bar" fill="#FF8C42" radius={[6, 6, 0, 0]} />
          <Line type="monotone" dataKey="total" stroke="#00C9A7" strokeWidth={2} dot={false} strokeDasharray="4 4" />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Summary */}
      <div className="mt-4 flex items-baseline gap-2">
        <p className="text-sm text-[#8FA4C8]">Ø</p>
        <p className="text-xl sm:text-2xl font-bold text-[#0A0A0A]">{formatShortNumber(currentDailyAvg)}</p>
        <p className="text-sm text-[#8FA4C8]">/Hari</p>
      </div>

      {/* Trend */}
      <div className="mt-2 flex items-center gap-2">
        <div className="flex items-center gap-1">
          {isTrendPositive ? (
            <TrendingUp className="w-4 h-4 text-[#FF6B6B]" />
          ) : (
            <TrendingDown className="w-4 h-4 text-[#00C9A7]" />
          )}
          <span className={`text-sm font-semibold ${isTrendPositive ? "text-[#FF6B6B]" : "text-[#00C9A7]"}`}>
            {isTrendPositive ? "+" : ""}{formatShortNumber(trendDiff)}
          </span>
        </div>
        <span className="text-xs text-[#8FA4C8]">vs periode sebelumnya</span>
      </div>

      {/* Button */}
      <button
        onClick={handleNavigate}
        className="mt-4 flex items-center gap-2 text-[#00C9A7] text-sm font-medium hover:opacity-80 transition-opacity"
      >
        Lihat Detail
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}