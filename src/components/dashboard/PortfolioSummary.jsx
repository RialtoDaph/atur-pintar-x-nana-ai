import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { TrendingUp, TrendingDown, ChevronRight } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { useAppSettings } from "@/components/utils/useAppSettings";

const INVESTMENT_TYPES = {
  saham: { label: "Saham", emoji: "📈", color: "#4F7CFF" },
  reksa_dana: { label: "Reksa Dana", emoji: "💰", color: "#00C9A7" },
  crypto: { label: "Crypto", emoji: "₿", color: "#F5A623" },
  deposito: { label: "Deposito", emoji: "🏦", color: "#9B59B6" },
  obligasi: { label: "Obligasi", emoji: "📄", color: "#3498DB" },
  emas: { label: "Emas", emoji: "🥇", color: "#F1C40F" },
  lainnya: { label: "Lainnya", emoji: "💼", color: "#95A5A6" },
};

export default function PortfolioSummary({ user, periodSubtitle }) {
  const { formatCurrency, t } = useAppSettings();
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.email) {
      base44.entities.Investment.filter({ created_by: user.email }, "-created_date", 50)
        .then(data => { setInvestments(data); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [user?.email]);

  if (loading) {
    return <div className="bg-white rounded-2xl shadow-sm h-36 animate-pulse" />;
  }

  if (investments.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-2 pr-14">
          <div>
            <h2 className="font-bold text-[#0A0A0A] text-sm">{t('portfolio_title')}</h2>
            {periodSubtitle && <p className="text-xs text-[#8FA4C8] mt-0.5">{periodSubtitle}</p>}
          </div>
          <Link to={createPageUrl("Investments")} className="text-xs text-[#FF6A00] font-semibold flex items-center gap-0.5">
            {t('view_all')} <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center px-6 py-8 text-center">
          <span className="text-4xl mb-3">💼</span>
          <p className="font-semibold text-[#1A1A1A] text-sm mb-1">Portofoliomu masih kosong!</p>
          <p className="text-xs text-[#8FA4C8] mb-4">Tambahkan investasi pertamamu dan pantau performanya dari sini</p>
          <Link
            to={createPageUrl("Investments")}
            className="px-4 py-2 bg-[#FF6A00] text-white text-xs font-semibold rounded-xl hover:bg-[#e55f00] transition-colors"
          >
            Tambah Investasi
          </Link>
        </div>
      </div>
    );
  }

  const totalInvested = investments.reduce((s, i) => s + (i.initial_amount || 0), 0);
  const totalValue = investments.reduce((s, i) => s + (i.current_value || 0), 0);
  const totalGain = totalValue - totalInvested;

  // ROI: hanya hitung dari investasi yang sudah ada current_value > 0
  const investmentsWithPrice = investments.filter(i => (i.current_value || 0) > 0);
  const investedWithPrice = investmentsWithPrice.reduce((s, i) => s + (i.initial_amount || 0), 0);
  const valueWithPrice = investmentsWithPrice.reduce((s, i) => s + (i.current_value || 0), 0);
  const gainWithPrice = valueWithPrice - investedWithPrice;
  const gainPercent = investedWithPrice > 0 ? ((gainWithPrice / investedWithPrice) * 100).toFixed(2) : 0;
  const isPositive = totalGain >= 0;

  // Pie chart — include semua investasi, gunakan initial_amount sebagai fallback jika current_value = 0
  const byType = {};
  investments.forEach(inv => {
    const invType = inv.type || "lainnya";
    if (!byType[invType]) byType[invType] = 0;
    byType[invType] += (inv.current_value > 0 ? inv.current_value : inv.initial_amount) || 0;
  });
  const pieData = Object.entries(byType).map(([key, value]) => ({
    name: INVESTMENT_TYPES[key]?.label || key,
    value,
    color: INVESTMENT_TYPES[key]?.color || "#95A5A6",
    emoji: INVESTMENT_TYPES[key]?.emoji || "💼",
  }));

  const totalPieValue = pieData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-2 pr-14">
        <div>
          <h2 className="font-bold text-[#0A0A0A] text-sm">{t('portfolio_title')}</h2>
          {periodSubtitle && <p className="text-xs text-[#8FA4C8] mt-0.5">{periodSubtitle}</p>}
        </div>
        <Link to={createPageUrl("Investments")} className="text-xs text-[#FF6A00] font-semibold flex items-center gap-0.5">
          {t('view_all')} <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="px-4 pb-4">
        {/* Summary row */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[#8FA4C8] text-[10px] font-semibold uppercase tracking-widest">{t('total_value')}</p>
            <p className="text-[#1A1A1A] font-bold text-xl">{formatCurrency(totalValue)}</p>
          </div>
          <div className={`flex flex-col items-end px-3 py-1.5 rounded-xl ${isPositive ? "bg-[#00C9A7]/10" : "bg-[#FF6B6B]/10"}`}>
            <div className="flex items-center gap-1">
              {isPositive ? <TrendingUp className="w-3.5 h-3.5 text-[#00C9A7]" /> : <TrendingDown className="w-3.5 h-3.5 text-[#FF6B6B]" />}
              <span className={`text-sm font-bold ${isPositive ? "text-[#00C9A7]" : "text-[#FF6B6B]"}`}>
                {isPositive ? "+" : ""}{gainPercent}% ROI
              </span>
            </div>
            <span className={`text-xs font-medium ${isPositive ? "text-[#00C9A7]" : "text-[#FF6B6B]"}`}>
              {isPositive ? "+" : ""}{formatCurrency(totalGain)}
            </span>
          </div>
        </div>

        {/* Pie chart + legend */}
        <div className="flex items-center gap-4">
          <div className="w-28 h-28 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={28} outerRadius={48} paddingAngle={3}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [formatCurrency(value), ""]}
                  contentStyle={{ background: "#1A1A1A", border: "none", borderRadius: 8, color: "#fff", fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 space-y-1.5">
            {investments.map((inv, i) => {
              const hasPrice = (inv.current_value || 0) > 0;
              const typeConfig = INVESTMENT_TYPES[inv.type || "lainnya"] || { emoji: "💼", color: "#95A5A6" };
              return (
                <div key={inv.id || i} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: typeConfig.color }} />
                    <span className="text-[11px] text-[#4A5568] truncate">{typeConfig.emoji} {inv.name}</span>
                    {!hasPrice && (
                      <span className="text-[9px] text-[#8FA4C8] flex-shrink-0 ml-0.5">· Belum update harga</span>
                    )}
                  </div>
                  <span className="text-[11px] font-semibold text-[#1A1A1A] flex-shrink-0 ml-1">
                    {totalPieValue > 0 ? (((hasPrice ? inv.current_value : inv.initial_amount) / totalPieValue) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}