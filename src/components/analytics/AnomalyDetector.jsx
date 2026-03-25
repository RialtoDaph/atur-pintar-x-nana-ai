import { useState, useEffect } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, TrendingUp } from "lucide-react";
import { useAppSettings } from "@/components/utils/useAppSettings";

export default function AnomalyDetector({ transactions, allCategoriesConfig }) {
  const { formatCurrency } = useAppSettings();
  const [anomalies, setAnomalies] = useState([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!transactions || transactions.length === 0) return;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Get last 3 months (excluding current) for baseline
    const last3Months = [];
    for (let i = 1; i <= 3; i++) {
      let m = currentMonth - i;
      let y = currentYear;
      if (m < 0) { m += 12; y -= 1; }
      last3Months.push({ month: m, year: y });
    }

    const expenses = transactions.filter(t => t.type === "expense");

    // Current month spending per category
    const currentSpend = {};
    expenses.forEach(t => {
      const d = new Date(t.date);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        const cat = t.category || "other";
        currentSpend[cat] = (currentSpend[cat] || 0) + t.amount;
      }
    });

    // Average of last 3 months per category
    const avgSpend = {};
    last3Months.forEach(({ month, year }) => {
      expenses.forEach(t => {
        const d = new Date(t.date);
        if (d.getMonth() === month && d.getFullYear() === year) {
          const cat = t.category || "other";
          avgSpend[cat] = (avgSpend[cat] || 0) + t.amount / 3;
        }
      });
    });

    // Detect anomalies: current > avg * 1.5 AND absolute diff > 100k
    const detected = [];
    Object.entries(currentSpend).forEach(([cat, amount]) => {
      const avg = avgSpend[cat] || 0;
      if (avg > 0 && amount > avg * 1.5 && (amount - avg) > 100000) {
        const pctIncrease = ((amount - avg) / avg * 100).toFixed(0);
        const catInfo = allCategoriesConfig[cat] || {};
        detected.push({
          category: cat,
          label: catInfo.label || cat,
          emoji: catInfo.emoji || "📦",
          color: catInfo.color || "#8FA4C8",
          current: amount,
          average: avg,
          pctIncrease: parseInt(pctIncrease),
        });
      } else if (avg === 0 && amount > 500000) {
        // Category never spent before but now has large amount
        const catInfo = allCategoriesConfig[cat] || {};
        detected.push({
          category: cat,
          label: catInfo.label || cat,
          emoji: catInfo.emoji || "📦",
          color: catInfo.color || "#8FA4C8",
          current: amount,
          average: 0,
          pctIncrease: 999,
          isNew: true,
        });
      }
    });

    // Sort by % increase
    detected.sort((a, b) => b.pctIncrease - a.pctIncrease);
    setAnomalies(detected.slice(0, 5));
  }, [transactions, allCategoriesConfig]);

  if (anomalies.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF6A00] to-[#FF9A3C] flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#1A1A1A]">Deteksi Anomali Pengeluaran</p>
            <p className="text-xs text-[#8FA4C8]">{anomalies.length} kategori tidak biasa bulan ini</p>
          </div>
        </div>
        <button onClick={() => setExpanded(e => !e)} className="text-[#8FA4C8] hover:text-[#1A1A1A] transition-colors tap-highlight-fix">
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {expanded && (
        <div className="px-4 sm:px-5 pb-5 space-y-2.5">
          {anomalies.map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-[#FFF5F0] border border-[#FF6A00]/20 rounded-xl">
              <span className="text-2xl flex-shrink-0">{item.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-bold text-[#1A1A1A] truncate">{item.label}</p>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    <TrendingUp className="w-3 h-3 text-[#FF6A00]" />
                    <span className="text-xs font-bold text-[#FF6A00]">
                      {item.isNew ? "Baru!" : `+${item.pctIncrease}%`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#8FA4C8]">
                  <span>Bulan ini: <span className="font-semibold text-[#FF6B6B]">{formatCurrency(item.current)}</span></span>
                  {!item.isNew && (
                    <>
                      <span>•</span>
                      <span>Rata-rata: <span className="font-medium">{formatCurrency(item.average)}</span></span>
                    </>
                  )}
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-1.5 bg-[#F2F4F7] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#FF6A00] transition-all"
                    style={{ width: item.isNew ? "100%" : `${Math.min((item.current / (item.average * 2)) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
          <p className="text-[10px] text-[#8FA4C8] text-center pt-1">
            Dibandingkan rata-rata 3 bulan terakhir
          </p>
        </div>
      )}
    </div>
  );
}