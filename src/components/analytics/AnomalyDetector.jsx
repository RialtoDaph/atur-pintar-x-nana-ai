import { useState, useMemo } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, TrendingUp, CheckCircle, HelpCircle } from "lucide-react";
import { useAppSettings } from "@/components/utils/useAppSettings";
import AnomalySecurityModal from "./AnomalySecurityModal";

export default function AnomalyDetector({ transactions, allCategoriesConfig = {} }) {
  const { formatCurrency } = useAppSettings();
  const [expanded, setExpanded] = useState(false);
  const [feedback, setFeedback] = useState({});
  const [securityModal, setSecurityModal] = useState(null);

  const anomalies = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const last3Set = new Set();
    for (let i = 1; i <= 3; i++) {
      let m = currentMonth - i;
      let y = currentYear;
      if (m < 0) { m += 12; y -= 1; }
      last3Set.add(`${y}-${m}`);
    }

    // Single pass through transactions
    const currentSpend = {};
    const avgSpend = {};
    for (const t of transactions) {
      if (t.type !== "expense") continue;
      const d = new Date(t.date);
      const cat = t.category || "other";
      const m = d.getMonth();
      const y = d.getFullYear();
      if (m === currentMonth && y === currentYear) {
        currentSpend[cat] = (currentSpend[cat] || 0) + (t.amount || 0);
      } else if (last3Set.has(`${y}-${m}`)) {
        avgSpend[cat] = (avgSpend[cat] || 0) + (t.amount || 0) / 3;
      }
    }

    const detected = [];
    Object.entries(currentSpend).forEach(([cat, amount]) => {
      const avg = avgSpend[cat] || 0;
      const catInfo = allCategoriesConfig[cat] || {};
      const base = {
        category: cat,
        label: catInfo.label || cat,
        emoji: catInfo.emoji || "📦",
        color: catInfo.color || "#8FA4C8",
        current: amount,
      };
      if (avg > 0 && amount > avg * 1.5 && (amount - avg) > 100000) {
        detected.push({ ...base, average: avg, pctIncrease: parseInt(((amount - avg) / avg * 100).toFixed(0)) });
      } else if (avg === 0 && amount > 500000) {
        detected.push({ ...base, average: 0, pctIncrease: 999, isNew: true });
      }
    });

    detected.sort((a, b) => b.pctIncrease - a.pctIncrease);
    return detected.slice(0, 5);
  }, [transactions, allCategoriesConfig]);

  if (anomalies.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-3.5 py-3 tap-highlight-fix"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FF6A00] to-[#FF9A3C] flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-[#1A1A1A]">Anomali Pengeluaran</p>
            <p className="text-[10px] text-[#8FA4C8]">{anomalies.length} kategori tidak biasa</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-[#8FA4C8]" /> : <ChevronDown className="w-4 h-4 text-[#8FA4C8]" />}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {anomalies.map((item, i) => {
            const fb = feedback[item.category];
            return (
              <div key={i} className={`flex flex-col gap-2 p-2.5 rounded-xl border ${
                fb === 'not_mine' ? 'bg-red-50 border-red-200' :
                fb === 'mine' ? 'bg-green-50 border-green-200' :
                'bg-[#FFF5F0] border-[#FF6A00]/20'
              }`}>
                {/* Row 1: emoji + info + badge */}
                <div className="flex items-center gap-2">
                  <span className="text-lg flex-shrink-0">{item.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-xs font-bold text-[#1A1A1A] truncate">{item.label}</p>
                      <div className="flex items-center gap-0.5 ml-1 flex-shrink-0">
                        <TrendingUp className="w-3 h-3 text-[#FF6A00]" />
                        <span className="text-[10px] font-bold text-[#FF6A00]">
                          {item.isNew ? "Baru!" : `+${item.pctIncrease}%`}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-[#8FA4C8] flex-wrap">
                      <span>Bulan ini: <span className="font-semibold text-[#FF6B6B]">{formatCurrency(item.current)}</span></span>
                      {!item.isNew && (
                        <>
                          <span>·</span>
                          <span>Avg: <span className="font-medium">{formatCurrency(item.average)}</span></span>
                        </>
                      )}
                    </div>
                    <div className="mt-1.5 h-1 bg-[#F2F4F7] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#FF6A00] transition-all"
                        style={{ width: item.isNew ? "100%" : `${Math.min((item.current / (item.average * 2)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Row 2: feedback */}
                {fb ? (
                  <div className={`flex items-center gap-1 text-[10px] font-medium ${
                    fb === 'mine' ? 'text-green-600' : 'text-red-500'
                  }`}>
                    <CheckCircle className="w-3 h-3" />
                    {fb === 'mine' ? 'Dikonfirmasi transaksimu' : 'Ditandai mencurigakan'}
                  </div>
                ) : (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setFeedback(prev => ({ ...prev, [item.category]: 'mine' }))}
                      className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg bg-green-100 text-green-700 text-[10px] font-semibold hover:bg-green-200 transition-colors tap-highlight-fix"
                    >
                      <CheckCircle className="w-3 h-3" />
                      Transaksi Saya
                    </button>
                    <button
                      onClick={() => setSecurityModal(item)}
                      className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg bg-red-100 text-red-600 text-[10px] font-semibold hover:bg-red-200 transition-colors tap-highlight-fix"
                    >
                      <HelpCircle className="w-3 h-3" />
                      Bukan Saya
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          <p className="text-[10px] text-[#8FA4C8] text-center">
            Dibandingkan rata-rata 3 bulan terakhir
          </p>
        </div>
      )}

      {securityModal && (
        <AnomalySecurityModal
          anomaly={securityModal}
          transactions={transactions}
          onClose={() => setSecurityModal(null)}
          onConfirm={() => {
            setFeedback(prev => ({ ...prev, [securityModal.category]: 'not_mine' }));
            setSecurityModal(null);
          }}
        />
      )}
    </div>
  );
}