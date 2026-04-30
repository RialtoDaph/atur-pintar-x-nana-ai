import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import PremiumBlurCard from "@/components/subscription/PremiumBlurCard";
import { Plus, Trash2, TrendingUp, Pencil, ShoppingCart, DollarSign } from "lucide-react";
import AddInvestmentModal from "@/components/investments/AddInvestmentModal.jsx";
import DiversificationChart from "@/components/investments/DiversificationChart";
import EducationResources from "@/components/investments/EducationResources";
import { useAppSettings } from "@/components/utils/useAppSettings";
import { INVESTMENT_TYPES_MAP } from "@/components/investments/investmentConstants";
import InvestmentNanaPanel from "@/components/investments/InvestmentNanaPanel";
import BuyInvestmentModal from "@/components/investments/BuyInvestmentModal.jsx";
import SellInvestmentModal from "@/components/investments/SellInvestmentModal.jsx";

export default function InvestmentsPage() {
  const { formatCurrency, t, settings } = useAppSettings();
  const lang = settings.language === "en" ? "en" : "id";
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingInv, setEditingInv] = useState(null);
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState({});
  const [showBuy, setShowBuy] = useState(null);
  const [showSell, setShowSell] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => setUser(u)).catch(() => {});
  }, []);

  useEffect(() => { if (user) loadData(); }, [user]);

  useEffect(() => {
    if (!user?.email) return;
    const unsub = base44.entities.Investment.subscribe(() => loadData());
    return unsub;
  }, [user?.email]);

  async function loadData() {
    setLoading(true);
    try {
      const [inv, txs] = await Promise.all([
        base44.entities.Investment.filter({ created_by: user.email }, "-created_date"),
        base44.entities.InvestmentTransaction.list().catch(() => []),
      ]);
      setInvestments(inv);

      const txsByInv = {};
      (txs || []).forEach(tx => {
        if (!txsByInv[tx.investment_id]) txsByInv[tx.investment_id] = [];
        txsByInv[tx.investment_id].push(tx);
      });
      setTransactions(txsByInv);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function calcMetrics(invId) {
    const txs = transactions[invId] || [];
    const totalBeli = txs.filter(t => t.type === "buy").reduce((s, t) => s + (t.total_amount || 0), 0);
    const totalJual = txs.filter(t => t.type === "sell").reduce((s, t) => s + (t.total_amount || 0), 0);
    const saldoAktif = totalBeli - totalJual;
    const untungRugi = saldoAktif - totalBeli;
    return { totalBeli, totalJual, saldoAktif, untungRugi };
  }

  async function handleDelete(id) {
    if (!window.confirm("Hapus investasi ini?")) return;
    setInvestments(prev => prev.filter(inv => inv.id !== id));
    await base44.entities.Investment.delete(id);
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

  async function handleTx(txData) {
    await base44.entities.InvestmentTransaction.create(txData);
    setShowBuy(null);
    setShowSell(null);
    loadData();
  }

  const isPremium = user?.subscription_plan === "premium_monthly" || user?.subscription_plan === "premium_yearly";

  if (!loading && !isPremium) {
    return (
      <div className="min-h-screen bg-[#F2F4F7] pb-8">
        <div className="bg-[#0A0A0A] px-5 pt-10 pb-6">
          <div className="max-w-2xl mx-auto">
            <p className="text-[#8FA4C8] text-sm font-medium">Portofolio</p>
            <h1 className="text-white text-2xl font-bold mt-0.5">Investasi</h1>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-5 mt-6 space-y-4">
          <PremiumBlurCard>
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <p className="font-bold text-[#1A1A1A] mb-2">Portofolio Investasi</p>
              <div className="space-y-3">
                {["Reksa Dana - Pertumbuhan", "Saham BBCA", "Emas Digital"].map((n, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-[#F2F4F7] pb-2">
                    <span className="text-sm text-[#1A1A1A]">{n}</span>
                    <span className="text-sm font-bold text-[#00C9A7]">+{(i+1)*3}.{i+1}%</span>
                  </div>
                ))}
              </div>
            </div>
          </PremiumBlurCard>
        </div>
      </div>
    );
  }

  // Portfolio summary
  let portfolioTotalBeli = 0, portfolioTotalJual = 0;
  investments.forEach(inv => {
    const m = calcMetrics(inv.id);
    portfolioTotalBeli += m.totalBeli;
    portfolioTotalJual += m.totalJual;
  });
  const portfolioSaldoAktif = portfolioTotalBeli - portfolioTotalJual;

  return (
    <div className="min-h-screen bg-[#F2F4F7] pb-8">
      {/* Header */}
      <div className="bg-[#0A0A0A] px-5 pt-10 pb-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[#8FA4C8] text-sm font-medium">Portofolio</p>
              <h1 className="text-white text-2xl font-bold mt-0.5">Investasi</h1>
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="w-10 h-10 rounded-full bg-[#FF6A00] flex items-center justify-center shadow-lg hover:bg-[#e05e00] transition-colors"
            >
              <Plus className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Portfolio Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-[#8FA4C8] text-[10px] font-semibold uppercase mb-1">Total Beli</p>
              <p className="text-white text-sm font-bold">{formatCurrency(portfolioTotalBeli)}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-[#8FA4C8] text-[10px] font-semibold uppercase mb-1">Total Jual</p>
              <p className="text-white text-sm font-bold">{formatCurrency(portfolioTotalJual)}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-[#8FA4C8] text-[10px] font-semibold uppercase mb-1">Saldo Aktif</p>
              <p className="text-[#00C9A7] text-sm font-bold">{formatCurrency(portfolioSaldoAktif)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 mt-4 space-y-4">
        <DiversificationChart investments={investments} totalValue={portfolioSaldoAktif} formatCurrency={formatCurrency} />

        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />)
        ) : investments.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <TrendingUp className="w-10 h-10 text-[#8FA4C8] mx-auto mb-3" />
            <p className="text-[#4A5568] font-semibold">Belum ada investasi</p>
            <p className="text-[#8FA4C8] text-sm mt-1">Tap + untuk mulai mencatat</p>
          </div>
        ) : investments.map(inv => {
          const type = INVESTMENT_TYPES_MAP[inv.type] || INVESTMENT_TYPES_MAP.lainnya;
          const typeLabel = lang === "en" ? type.label_en : type.label_id;
          const { totalBeli, totalJual, saldoAktif, untungRugi } = calcMetrics(inv.id);
          const isPositive = untungRugi >= 0;

          return (
            <div key={inv.id} className="bg-white rounded-2xl p-5 shadow-sm">
              {/* Card header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#4F7CFF]/10 flex items-center justify-center text-xl">
                    {inv.icon || type.emoji}
                  </div>
                  <div>
                    <p className="font-semibold text-[#1A1A1A]">{inv.name}</p>
                    <p className="text-xs text-[#8FA4C8]">{typeLabel}{inv.purchase_date ? ` · ${inv.purchase_date}` : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setEditingInv(inv); setShowAdd(true); }} className="text-[#CBD5E0] hover:text-[#FF6A00] transition-colors p-2">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(inv.id)} className="text-[#CBD5E0] hover:text-[#FF6B6B] transition-colors p-2">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="p-3 bg-[#F8FAFC] rounded-xl">
                  <p className="text-[10px] text-[#8FA4C8] font-semibold uppercase">Total Beli</p>
                  <p className="text-sm font-bold text-[#1A1A1A] mt-0.5">{formatCurrency(totalBeli)}</p>
                </div>
                <div className="p-3 bg-[#F8FAFC] rounded-xl">
                  <p className="text-[10px] text-[#8FA4C8] font-semibold uppercase">Total Jual</p>
                  <p className="text-sm font-bold text-[#1A1A1A] mt-0.5">{formatCurrency(totalJual)}</p>
                </div>
                <div className="p-3 bg-[#F8FAFC] rounded-xl">
                  <p className="text-[10px] text-[#8FA4C8] font-semibold uppercase">Saldo Aktif</p>
                  <p className="text-sm font-bold text-[#1A1A1A] mt-0.5">{formatCurrency(saldoAktif)}</p>
                </div>
                <div className={`p-3 rounded-xl ${isPositive ? "bg-[#00C9A7]/10" : "bg-[#FF6B6B]/10"}`}>
                  <p className="text-[10px] text-[#8FA4C8] font-semibold uppercase">Untung/Rugi</p>
                  <p className={`text-sm font-bold mt-0.5 ${isPositive ? "text-[#00C9A7]" : "text-[#FF6B6B]"}`}>
                    {isPositive ? "+" : ""}{formatCurrency(untungRugi)}
                  </p>
                </div>
              </div>

              {inv.notes && <p className="text-xs text-[#8FA4C8] italic mb-3">{inv.notes}</p>}

              {/* Action buttons */}
              <div className="flex gap-2 border-t border-[#F2F4F7] pt-3">
                <button
                  onClick={() => setShowBuy(inv)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#00C9A7]/10 text-[#00C9A7] text-sm font-semibold hover:bg-[#00C9A7]/20 transition-colors"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Beli
                </button>
                <button
                  onClick={() => setShowSell(inv)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#FF6B6B]/10 text-[#FF6B6B] text-sm font-semibold hover:bg-[#FF6B6B]/20 transition-colors"
                >
                  <DollarSign className="w-4 h-4" />
                  Jual
                </button>
              </div>
            </div>
          );
        })}

        <InvestmentNanaPanel investments={investments} />
        <EducationResources />
      </div>

      {showAdd && (
        <AddInvestmentModal
          investment={editingInv}
          onClose={() => { setShowAdd(false); setEditingInv(null); }}
          onSave={handleSave}
        />
      )}

      {showBuy && (
        <BuyInvestmentModal
          investment={showBuy}
          onClose={() => setShowBuy(null)}
          onSave={handleTx}
        />
      )}

      {showSell && (
        <SellInvestmentModal
          investment={showSell}
          onClose={() => setShowSell(null)}
          onSave={handleTx}
        />
      )}
    </div>
  );
}