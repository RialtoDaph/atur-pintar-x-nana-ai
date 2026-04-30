import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import PremiumBlurCard from "@/components/subscription/PremiumBlurCard";
import { Plus, Trash2, TrendingUp, ArrowUp, ArrowDown } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import AddInvestmentModal from "@/components/investments/AddInvestmentModal.jsx";
import AddInvestmentTransactionModal from "@/components/investments/AddInvestmentTransactionModal.jsx";
import DiversificationChart from "@/components/investments/DiversificationChart";
import PortfolioTrendChart from "@/components/investments/PortfolioTrendChart";
import RiskProfileRecommendation from "@/components/investments/RiskProfileRecommendation";
import EducationResources from "@/components/investments/EducationResources";
import { useAppSettings } from "@/components/utils/useAppSettings";
import { INVESTMENT_TYPES_MAP } from "@/components/investments/investmentConstants";
import { Pencil } from "lucide-react";
import InvestmentNanaPanel from "@/components/investments/InvestmentNanaPanel";

export default function InvestmentsPage() {
  const { formatCurrency, t, settings } = useAppSettings();
  const lang = settings.language === "en" ? "en" : "id";
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingInv, setEditingInv] = useState(null);
  const [user, setUser] = useState(null);
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [watchlist, setWatchlist] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [showAddTx, setShowAddTx] = useState(null);
  const [transactions, setTransactions] = useState({});

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
    }).catch(() => {});
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
        const [inv, watch, accs, txs] = await Promise.all([
          base44.entities.Investment.filter({ created_by: user.email }, "-created_date"),
          base44.entities.InvestmentWatchlist.filter({ created_by: user.email }, "-created_date").catch(() => []),
          base44.entities.Account.filter({ created_by: user.email }).catch(() => []),
          base44.entities.InvestmentTransaction.list().catch(() => []),
        ]);
        setInvestments(inv);
        setWatchlist(watch);
        setAccounts(accs || []);

        // Group transactions by investment_id
        const txsByInv = {};
        (txs || []).forEach(tx => {
          if (!txsByInv[tx.investment_id]) {
            txsByInv[tx.investment_id] = [];
          }
          txsByInv[tx.investment_id].push(tx);
        });
        setTransactions(txsByInv);
      } catch (error) {
        console.error("Failed to load investments:", error);
      } finally {
        setLoading(false);
      }
    }

  async function handleDelete(id) {
     if (!window.confirm(t('investments_delete_confirm') || "Hapus investasi ini?")) return;
     try {
       const investmentToDelete = investments.find(inv => inv.id === id);

       // Sync back to account if account_id exists
       if (investmentToDelete?.account_id && investmentToDelete?.current_value) {
         const account = accounts.find(a => a.id === investmentToDelete.account_id);
         if (account) {
           const newBalance = (account.balance || 0) - investmentToDelete.current_value;
           await base44.entities.Account.update(investmentToDelete.account_id, { balance: newBalance });
         }
       }

       setInvestments(prev => prev.filter(inv => inv.id !== id));
       await base44.entities.Investment.delete(id);
     } catch (error) {
       console.error("Delete investment failed:", error);
       loadData();
     }
   }

  function handleEdit(inv) {
    setEditingInv(inv);
    setShowAdd(true);
  }

  async function handleSave(data) {
     try {
       if (editingInv) {
         await base44.entities.Investment.update(editingInv.id, data);
       } else {
         await base44.entities.Investment.create(data);
       }
       setShowAdd(false);
       setEditingInv(null);
       loadData();
     } catch (error) {
       console.error("Save investment failed:", error);
       throw error;
     }
   }

  async function handleAddTransaction(txData) {
     try {
       await base44.entities.InvestmentTransaction.create(txData);
       // Recalculate investment value
       await base44.functions.invoke('recalculateInvestmentValue', {
         investment_id: txData.investment_id,
       });
       setShowAddTx(null);
       loadData();
     } catch (error) {
       console.error("Save transaction failed:", error);
       throw error;
     }
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
          <PremiumBlurCard>
            <div className="bg-white rounded-2xl p-6 shadow-sm h-40" />
          </PremiumBlurCard>
        </div>
      </div>
    );
  }

  const totalInvested = investments.reduce((s, i) => s + i.initial_amount, 0);
  const totalValue = investments.reduce((s, i) => s + i.current_value, 0);
  const totalGain = totalValue - totalInvested;
  const gainPercent = totalInvested > 0 ? ((totalGain / totalInvested) * 100).toFixed(2) : 0;

  return (
    <div className="min-h-screen bg-[#F2F4F7] pb-8">
      <div className="bg-[#0A0A0A] px-5 pt-10 pb-6">
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

          {/* Portfolio trend chart embedded in dark header */}
          <PortfolioTrendChart
            investments={investments}
            totalValue={totalValue}
            totalInvested={totalInvested}
            darkMode={true}
          />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 mt-4 space-y-4">
        {/* Diversification and assets below */}

        {/* Diversification pie */}
        <DiversificationChart investments={investments} totalValue={totalValue} formatCurrency={formatCurrency} />

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
           const type = INVESTMENT_TYPES_MAP[inv.type] || INVESTMENT_TYPES_MAP.lainnya;
           const typeLabel = settings.language === 'en' ? type.label_en : type.label_id;
           const gain = inv.current_value - inv.initial_amount;
           const gainPct = inv.initial_amount > 0 ? ((gain / inv.initial_amount) * 100).toFixed(2) : 0;
           const isPositive = gain >= 0;
           const portfolioWeight = totalValue > 0 ? ((inv.current_value / totalValue) * 100).toFixed(1) : 0;
           const walletAccount = accounts.find(a => a.id === inv.account_id);

           // Calculate 1-month ago value (sum of transactions before 30 days)
           const thirtyDaysAgo = new Date();
           thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
           const txsBefore30days = (transactions[inv.id] || [])
             .filter(tx => new Date(tx.transaction_date) < thirtyDaysAgo)
             .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))[0];

           let valueMonth = inv.initial_amount;
           if (txsBefore30days) {
             // Recalculate from initial to that point
             const relevantTxs = (transactions[inv.id] || [])
               .filter(tx => new Date(tx.transaction_date) <= new Date(txsBefore30days.transaction_date));
             valueMonth = inv.initial_amount;
             for (const tx of relevantTxs) {
               if (tx.type === 'buy') valueMonth += tx.total_amount || 0;
               else if (tx.type === 'sell') valueMonth -= tx.total_amount || 0;
               else if (tx.type === 'dividend') valueMonth += tx.total_amount || 0;
               else if (tx.type === 'adjustment') valueMonth = tx.total_amount || 0;
             }
           }

           const fluktuasi = inv.current_value - valueMonth;
           const fluktuasiPct = valueMonth > 0 ? ((fluktuasi / valueMonth) * 100).toFixed(2) : 0;
           const flukPositive = fluktuasi >= 0;

           return (
             <div key={inv.id} className="bg-white rounded-2xl p-5 shadow-sm">
               <div className="flex items-start justify-between mb-3">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-[#4F7CFF]/10 flex items-center justify-center text-xl">
                     {inv.icon || type.emoji}
                   </div>
                   <div>
                     <p className="font-semibold text-[#1A1A1A]">{inv.name}</p>
                     <p className="text-xs text-[#8FA4C8]">
                       {typeLabel} · {portfolioWeight}%
                       {walletAccount && <span className="ml-1">· {walletAccount.icon || "💼"} {walletAccount.name}</span>}
                     </p>
                   </div>
                 </div>
                 <div className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
                   <button onClick={() => { setEditingInv(inv); setShowAdd(true); }} className="text-[#CBD5E0] hover:text-[#FF6A00] transition-colors p-2">
                     <Pencil className="w-4 h-4" />
                   </button>
                   <button onClick={() => handleDelete(inv.id)} className="text-[#CBD5E0] hover:text-[#FF6B6B] transition-colors p-2">
                     <Trash2 className="w-4 h-4" />
                   </button>
                 </div>
               </div>

               {/* Metrics grid */}
               <div className="grid grid-cols-2 gap-3 mb-4">
                 <div className="p-3 bg-[#F8FAFC] rounded-lg">
                   <p className="text-[10px] text-[#8FA4C8] font-semibold uppercase">{lang === "en" ? "Modal Awal" : "Modal Awal"}</p>
                   <p className="text-sm font-bold text-[#1A1A1A] mt-1">{formatCurrency(inv.initial_amount)}</p>
                 </div>
                 <div className="p-3 bg-[#F8FAFC] rounded-lg">
                   <p className="text-[10px] text-[#8FA4C8] font-semibold uppercase">{lang === "en" ? "Value Now" : "Nilai Sekarang"}</p>
                   <p className="text-sm font-bold text-[#1A1A1A] mt-1">{formatCurrency(inv.current_value)}</p>
                 </div>
                 <div className="p-3 bg-[#F8FAFC] rounded-lg">
                   <p className="text-[10px] text-[#8FA4C8] font-semibold uppercase">{lang === "en" ? "Return (Rp)" : "Return (Rp)"}</p>
                   <p className={`text-sm font-bold mt-1 ${isPositive ? "text-[#00C9A7]" : "text-[#FF6B6B]"}`}>
                     {isPositive ? "+" : ""}{formatCurrency(gain)}
                   </p>
                 </div>
                 <div className="p-3 bg-[#F8FAFC] rounded-lg">
                   <p className="text-[10px] text-[#8FA4C8] font-semibold uppercase">{lang === "en" ? "Return (%)" : "Return (%)"}</p>
                   <p className={`text-sm font-bold mt-1 ${isPositive ? "text-[#00C9A7]" : "text-[#FF6B6B]"}`}>
                     {isPositive ? "+" : ""}{gainPct}%
                   </p>
                 </div>
                 <div className="p-3 bg-[#F8FAFC] rounded-lg col-span-2">
                   <p className="text-[10px] text-[#8FA4C8] font-semibold uppercase">{lang === "en" ? "30-Day Change" : "Perubahan 30 Hari"}</p>
                   <div className="flex items-center gap-1 mt-1">
                     {flukPositive ? (
                       <ArrowUp className="w-4 h-4 text-[#00C9A7]" />
                     ) : (
                       <ArrowDown className="w-4 h-4 text-[#FF6B6B]" />
                     )}
                     <p className={`text-sm font-bold ${flukPositive ? "text-[#00C9A7]" : "text-[#FF6B6B]"}`}>
                       {flukPositive ? "+" : ""}{formatCurrency(fluktuasi)} ({flukPositive ? "+" : ""}{fluktuasiPct}%)
                     </p>
                   </div>
                 </div>
               </div>

               {/* Transaction history & add button */}
               <div className="border-t border-[#F2F4F7] pt-3">
                 <button
                   onClick={() => setShowAddTx(inv.id)}
                   className="text-xs font-semibold text-[#FF6A00] hover:text-[#e05e00]"
                 >
                   + {lang === "en" ? "Add Transaction" : "Tambah Transaksi"}
                 </button>
               </div>

               {/* Detail link */}
               <Link
                 to={`${createPageUrl("InvestmentDetail")}?id=${inv.id}`}
                 className="text-xs font-semibold text-[#8FA4C8] hover:text-[#1A1A1A] block mt-2"
               >
                 {lang === "en" ? "View Details →" : "Lihat Detail →"}
               </Link>

               {inv.notes && <p className="text-xs text-[#8FA4C8] mt-2 italic">{inv.notes}</p>}
             </div>
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

        <InvestmentNanaPanel investments={investments} />

        <RiskProfileRecommendation investments={investments} />

        {/* Education resources — minimized at the bottom */}
        <EducationResources />
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

      {showAddTx && (
        <AddInvestmentTransactionModal
          investment={investments.find(i => i.id === showAddTx)}
          onClose={() => setShowAddTx(null)}
          onSave={handleAddTransaction}
        />
      )}
    </div>
  );
}