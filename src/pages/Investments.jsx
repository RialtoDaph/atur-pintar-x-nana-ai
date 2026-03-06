import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, TrendingUp, TrendingDown, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import AddInvestmentModal from "@/components/investments/AddInvestmentModal.jsx";
import PerformanceMetrics from "@/components/investments/PerformanceMetrics";
import DiversificationChart from "@/components/investments/DiversificationChart";
import RiskProfileRecommendation from "@/components/investments/RiskProfileRecommendation";
import EducationResources from "@/components/investments/EducationResources";
import { useAppSettings } from "@/components/utils/useAppSettings";

const INVESTMENT_TYPES = {
  saham: { label: "Saham", emoji: "📈" },
  reksa_dana: { label: "Reksa Dana", emoji: "💰" },
  crypto: { label: "Crypto", emoji: "₿" },
  deposito: { label: "Deposito", emoji: "🏦" },
  obligasi: { label: "Obligasi", emoji: "📄" },
  emas: { label: "Emas", emoji: "🥇" },
  lainnya: { label: "Lainnya", emoji: "💼" },
};

export default function InvestmentsPage() {
  const { formatCurrency, t } = useAppSettings();
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingInv, setEditingInv] = useState(null);
  const [user, setUser] = useState(null);
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [watchlist, setWatchlist] = useState([]);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
    }).catch(() => {});
  }, []);

  useEffect(() => { if (user) loadData(); }, [user]);

  async function loadData() {
    setLoading(true);
    const [inv, watch] = await Promise.all([
      base44.entities.Investment.filter({ created_by: user.email }, "-created_date"),
      base44.entities.InvestmentWatchlist.filter({ created_by: user.email }, "-created_date").catch(() => []),
    ]);
    setInvestments(inv);
    setWatchlist(watch);
    setLoading(false);
  }

  async function handleDelete(id) {
    await base44.entities.Investment.delete(id);
    loadData();
  }

  function handleEdit(inv) {
    setEditingInv(inv);
    setShowAdd(true);
  }

  async function handleSave(data) {
    if (editingInv) {
      await base44.entities.Investment.update(editingInv.id, data);
    } else {
      await base44.entities.Investment.create(data);
    }
    setShowAdd(false);
    setEditingInv(null);
    loadData();
  }

  const totalInvested = investments.reduce((s, i) => s + i.initial_amount, 0);
  const totalValue = investments.reduce((s, i) => s + i.current_value, 0);
  const totalGain = totalValue - totalInvested;
  const gainPercent = totalInvested > 0 ? ((totalGain / totalInvested) * 100).toFixed(2) : 0;

  return (
    <div className="min-h-screen bg-[#F2F4F7] pb-8">
      <div className="bg-[#0A0A0A] px-5 pt-10 pb-20">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[#8FA4C8] text-sm font-medium">{t('investments_portfolio')}</p>
              <h1 className="text-white text-2xl font-bold mt-0.5">{t('investments_title')}</h1>
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="w-10 h-10 rounded-full bg-[#FF6A00] flex items-center justify-center shadow-lg hover:bg-[#e05e00] transition-colors"
            >
              <Plus className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="bg-white/10 rounded-2xl p-5 mb-4">
            <p className="text-white/60 text-sm mb-1">{t('total_portfolio')}</p>
            <p className="text-white font-bold text-3xl mb-2">{formatCurrency(totalValue)}</p>
            <div className="flex items-center gap-1">
              {totalGain >= 0 ? <TrendingUp className="w-4 h-4 text-[#00C9A7]" /> : <TrendingDown className="w-4 h-4 text-[#FF6B6B]" />}
              <span className={`text-sm font-semibold ${totalGain >= 0 ? "text-[#00C9A7]" : "text-[#FF6B6B]"}`}>
                {totalGain >= 0 ? "+" : ""}{formatCurrency(totalGain)} ({gainPercent}%)
              </span>
              <span className="text-white/40 text-xs ml-1">{t('investments_from_capital')} {formatCurrency(totalInvested)}</span>
            </div>
          </div>

          <PerformanceMetrics investments={investments} totalValue={totalValue} totalInvested={totalInvested} formatCurrency={formatCurrency} />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 -mt-10 space-y-4">
        <DiversificationChart investments={investments} totalValue={totalValue} formatCurrency={formatCurrency} />

        <RiskProfileRecommendation investments={investments} />

        <EducationResources />
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />)
        ) : investments.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <TrendingUp className="w-10 h-10 text-[#8FA4C8] mx-auto mb-3" />
            <p className="text-[#4A5568] font-semibold">{t('investments_empty_title')}</p>
            <p className="text-[#8FA4C8] text-sm mt-1">{t('investments_empty_desc')}</p>
          </div>
        ) : (
          investments.map(inv => {
            const type = INVESTMENT_TYPES[inv.type] || INVESTMENT_TYPES.lainnya;
            const gain = inv.current_value - inv.initial_amount;
            const gainPct = inv.initial_amount > 0 ? ((gain / inv.initial_amount) * 100).toFixed(2) : 0;
            const isPositive = gain >= 0;
            const portfolioWeight = totalValue > 0 ? ((inv.current_value / totalValue) * 100).toFixed(1) : 0;
            return (
              <Link
                key={inv.id}
                to={`${createPageUrl("InvestmentDetail")}?id=${inv.id}`}
                className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow block"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#4F7CFF]/10 flex items-center justify-center text-xl">
                      {inv.icon || type.emoji}
                    </div>
                    <div>
                      <p className="font-semibold text-[#1A1A1A]">{inv.name}</p>
                      <p className="text-xs text-[#8FA4C8]">{type.label} · {portfolioWeight}{t('investments_portfolio_weight')}</p>
                    </div>
                  </div>
                  <div className="flex gap-2" onClick={(e) => e.preventDefault()}>
                   <button onClick={() => handleEdit(inv)} className="text-[#CBD5E0] hover:text-[#FF6A00] transition-colors">
                     ✏️
                   </button>
                   <button onClick={() => handleDelete(inv.id)} className="text-[#CBD5E0] hover:text-[#FF6B6B] transition-colors">
                     <Trash2 className="w-4 h-4" />
                   </button>
                  </div>
                </div>
                <div className="mt-3 flex justify-between items-end">
                  <div>
                     <p className="text-xs text-[#8FA4C8]">{t('current_value')}</p>
                     <p className="font-bold text-[#1A1A1A] text-lg">{formatCurrency(inv.current_value)}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-xs text-[#8FA4C8]">{t('profit_loss')}</p>
                     <p className={`font-bold text-base ${isPositive ? "text-[#00C9A7]" : "text-[#FF6B6B]"}`}>
                       {isPositive ? "+" : ""}{formatCurrency(gain)} ({isPositive ? "+" : ""}{gainPct}%)
                     </p>
                   </div>
                </div>
                {inv.notes && <p className="text-xs text-[#8FA4C8] mt-2 italic">{inv.notes}</p>}
              </Link>
            );
          })
        )}

        {watchlist.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-[#1A1A1A] text-base">{t('investments_watchlist_title')}</h2>
              <button onClick={() => setShowWatchlist(!showWatchlist)} className="text-xs text-[#FF6A00] font-medium">
                {showWatchlist ? t('investments_watchlist_hide') : t('investments_watchlist_show')}
              </button>
            </div>
            {showWatchlist && (
              <div className="space-y-2">
                {watchlist.map((item) => (
                  <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-[#1A1A1A]">{item.name}</p>
                      <p className="text-xs text-[#8FA4C8]">{item.symbol || item.type}</p>
                    </div>
                    {item.current_price && (
                      <div className="text-right">
                        <p className="font-bold text-[#1A1A1A]">{formatCurrency(item.current_price)}</p>
                        {item.target_price && (
                          <p className="text-xs text-[#8FA4C8]">{t('investments_target')}: {formatCurrency(item.target_price)}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showAdd && (
        <AddInvestmentModal
          investment={editingInv}
          onClose={() => {
            setShowAdd(false);
            setEditingInv(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}