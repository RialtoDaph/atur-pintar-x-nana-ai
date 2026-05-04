import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import PremiumBlurCard from "@/components/subscription/PremiumBlurCard";
import { Plus, Trash2, TrendingUp, ShoppingCart, TrendingDown, Wallet } from "lucide-react";
import { useAppSettings } from "@/components/utils/useAppSettings";
import { INVESTMENT_TYPES_MAP } from "@/components/investments/investmentConstants";
import AddInvestmentModal from "@/components/investments/AddInvestmentModal.jsx";
import InvestmentTransactionModal from "@/components/investments/InvestmentTransactionModal.jsx";
import EducationResources from "@/components/investments/EducationResources";
import InvestmentNanaPanel from "@/components/investments/InvestmentNanaPanel";
import RiskProfileRecommendation from "@/components/investments/RiskProfileRecommendation";
import PortfolioSummaryChart from "@/components/investments/PortfolioSummaryChart";
import { syncAccountBalance } from "@/components/utils/accountSync";

export default function InvestmentsPage() {
  const { formatCurrency, t, settings } = useAppSettings();
  const [investments, setInvestments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [txModal, setTxModal] = useState(null); // { inv, type: "buy"|"sell" }
  const [accounts, setAccounts] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => setUser(u)).catch(() => {});
  }, []);

  useEffect(() => { if (user) loadData(); }, [user]);

  async function loadData() {
    setLoading(true);
    try {
      const [inv, txs, accs] = await Promise.all([
        base44.entities.Investment.filter({ created_by: user.email }, "-created_date"),
        base44.entities.InvestmentTransaction.filter({ created_by: user.email }).catch(() => []),
        base44.entities.Account.filter({ created_by: user.email }).catch(() => []),
      ]);
      setInvestments(inv);
      setTransactions(txs || []);
      setAccounts(accs || []);
    } finally {
      setLoading(false);
    }
  }

  function getMetrics(invId) {
    const invTxs = transactions.filter(tx => tx.investment_id === invId);
    const totalBeli = invTxs.filter(tx => tx.type === "buy").reduce((s, tx) => s + (tx.total_amount || 0), 0);
    const totalJual = invTxs.filter(tx => tx.type === "sell").reduce((s, tx) => s + (tx.total_amount || 0), 0);
    const saldoAktif = totalBeli - totalJual;
    const untungRugi = totalJual - totalBeli;
    return { totalBeli, totalJual, saldoAktif, untungRugi };
  }

  const portfolioTotalBeli = transactions.filter(tx => tx.type === "buy").reduce((s, tx) => s + (tx.total_amount || 0), 0);
  const portfolioTotalJual = transactions.filter(tx => tx.type === "sell").reduce((s, tx) => s + (tx.total_amount || 0), 0);
  const portfolioSaldoAktif = portfolioTotalBeli - portfolioTotalJual;

  const [deleteConfirm, setDeleteConfirm] = useState(null);

  async function confirmDelete(id) {
    const inv = investments.find(i => i.id === id);
    if (!inv) { setDeleteConfirm(null); return; }
    // Reverse account balance for all linked investment transactions in parallel
    const invTxs = transactions.filter(tx => tx.investment_id === id);
    if (inv.account_id) {
      await Promise.all(invTxs.map(tx => {
        const txType = tx.type === "buy" ? "expense" : "income";
        return syncAccountBalance(inv.account_id, tx.total_amount || 0, txType, -1).catch(() => {});
      }));
    }
    // Delete all linked investment transactions, then the investment itself
    await Promise.all(invTxs.map(tx => base44.entities.InvestmentTransaction.delete(tx.id).catch(() => {})));
    await base44.entities.Investment.delete(id);
    setDeleteConfirm(null);
    loadData();
  }

  async function handleSaveInvestment(data) {
    await base44.entities.Investment.create(data);
    setShowAdd(false);
    loadData();
  }

  async function handleSaveTransaction(invId, type, amount, date) {
    await base44.entities.InvestmentTransaction.create({
      investment_id: invId,
      type,
      total_amount: amount,
      transaction_date: date || new Date().toISOString().split("T")[0],
    });

    // Sinkron saldo account: beli = keluar (expense), jual = masuk (income)
    const inv = investments.find(i => i.id === invId);
    if (inv?.account_id) {
      const txType = type === "buy" ? "expense" : "income";
      await syncAccountBalance(inv.account_id, amount, txType, 1).catch(() => {});
    }

    setTxModal(null);
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
                {["Reksa Dana", "Saham BBCA", "Emas Digital"].map((n, i) => (
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

  return (
    <div className="min-h-screen bg-[#F2F4F7] pb-8">
      {/* Header */}
      <div className="bg-[#0A0A0A] px-5 pt-10 pb-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[#8FA4C8] text-sm font-medium">Portofolio</p>
              <h1 className="text-white text-2xl font-bold mt-0.5">Investasi</h1>
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="h-10 px-4 rounded-full bg-[#FF6A00] flex items-center gap-1.5 shadow-lg hover:bg-[#e05e00] transition-colors"
            >
              <Plus className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-semibold">Invest</span>
            </button>
          </div>

          {/* Portfolio Chart */}
          <PortfolioSummaryChart
            totalBeli={portfolioTotalBeli}
            totalJual={portfolioTotalJual}
            saldoAktif={portfolioSaldoAktif}
            transactions={transactions}
            formatCurrency={formatCurrency}
          />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 mt-4 space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-28 animate-pulse" />)
        ) : investments.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <TrendingUp className="w-10 h-10 text-[#8FA4C8] mx-auto mb-3" />
            <p className="text-[#4A5568] font-semibold">Belum ada investasi</p>
            <p className="text-[#8FA4C8] text-sm mt-1">Tap + untuk menambah investasi</p>
          </div>
        ) : (
          investments.map(inv => {
            const invType = INVESTMENT_TYPES_MAP[inv.type] || INVESTMENT_TYPES_MAP.lainnya;
            const typeLabel = settings.language === 'en' ? invType.label_en : invType.label_id;
            const { totalBeli, totalJual, saldoAktif, untungRugi } = getMetrics(inv.id);
            const walletAccount = accounts.find(a => a.id === inv.account_id);
            const isProfit = untungRugi >= 0;

            return (
              <div key={inv.id} className="bg-white rounded-2xl p-4 shadow-sm">
                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {/* Logo: wallet account logo or fallback emoji */}
                    <div className="w-11 h-11 rounded-2xl bg-[#F2F4F7] flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {walletAccount?.logo_url ? (
                        <img src={walletAccount.logo_url} alt={walletAccount.name} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-2xl">{walletAccount?.icon || invType.emoji}</span>
                      )}
                    </div>
                    <div>
                      {/* Title: platform/wallet name or investment name */}
                      <p className="font-bold text-[#1A1A1A] leading-tight">
                        {walletAccount ? walletAccount.name : inv.name}
                      </p>
                      {/* Sub: nama aset · tipe — satu baris */}
                      <p className="text-xs text-[#8FA4C8] mt-0.5">
                        {walletAccount ? `${inv.name} · ${typeLabel}` : typeLabel}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setDeleteConfirm(inv.id)} className="text-[#CBD5E0] hover:text-[#FF6B6B] transition-colors p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-[#F8FAFC] rounded-xl p-2.5">
                    <p className="text-[10px] text-[#8FA4C8] mb-0.5">Saldo Aktif</p>
                    <p className="text-sm font-bold text-[#1A1A1A]">{formatCurrency(saldoAktif)}</p>
                  </div>
                  <div className="bg-[#F8FAFC] rounded-xl p-2.5">
                    <p className="text-[10px] text-[#8FA4C8] mb-0.5">Total Beli</p>
                    <p className="text-sm font-semibold text-[#4A5568]">{formatCurrency(totalBeli)}</p>
                  </div>
                  <div className="bg-[#F8FAFC] rounded-xl p-2.5">
                    <p className="text-[10px] text-[#8FA4C8] mb-0.5">Realisasi</p>
                    <p className={`text-sm font-bold ${totalJual > 0 ? (isProfit ? "text-[#00C9A7]" : "text-[#FF6B6B]") : "text-[#CBD5E0]"}`}>
                      {totalJual > 0 ? (isProfit ? "+" : "") + formatCurrency(untungRugi) : "-"}
                    </p>
                  </div>
                </div>

                {inv.notes && <p className="text-xs text-[#8FA4C8] italic mb-3">{inv.notes}</p>}

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setTxModal({ inv, type: "buy" })}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#00C9A7]/10 text-[#00C9A7] font-semibold text-sm hover:bg-[#00C9A7]/20 transition-colors"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Beli
                  </button>
                  <button
                    onClick={() => setTxModal({ inv, type: "sell" })}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#FF6B6B]/10 text-[#FF6B6B] font-semibold text-sm hover:bg-[#FF6B6B]/20 transition-colors"
                  >
                    <TrendingDown className="w-4 h-4" />
                    Jual
                  </button>
                </div>
              </div>
            );
          })
        )}

        <InvestmentNanaPanel investments={investments} />
        <RiskProfileRecommendation investments={investments} />
        <EducationResources />
      </div>

      {showAdd && (
        <AddInvestmentModal
          onClose={() => setShowAdd(false)}
          onSave={handleSaveInvestment}
        />
      )}

      {txModal && (
        <InvestmentTransactionModal
          investment={txModal.inv}
          type={txModal.type}
          onClose={() => setTxModal(null)}
          onSave={(amount, date) => handleSaveTransaction(txModal.inv.id, txModal.type, amount, date)}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <p className="text-sm font-semibold text-[#1A1A1A] mb-1">Hapus Investasi?</p>
            <p className="text-xs text-[#8FA4C8] mb-4">Semua transaksi beli/jual terkait juga akan dihapus dan saldo akun akan disesuaikan.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-lg text-sm font-semibold text-[#8FA4C8] hover:bg-[#F2F4F7] transition-colors">
                Batal
              </button>
              <button onClick={() => confirmDelete(deleteConfirm)} className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#FF6B6B] hover:bg-[#FF5252] transition-colors">
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}