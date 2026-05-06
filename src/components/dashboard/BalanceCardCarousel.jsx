import { useState, useRef, useEffect } from "react";
import { TrendingUp, TrendingDown, Wallet, Eye, EyeOff, Users, LineChart, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AccountAvatar from "@/components/ui/AccountAvatar";
import { base44 } from "@/api/base44Client";

function compactRupiah(value) {
  return Math.abs(value).toLocaleString('id-ID');
}

const HIDDEN = "••••••";

export default function BalanceCardCarousel({ income, expense, savings, accounts, loading }) {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [storageKey, setStorageKey] = useState(null);
  const [hidden, setHidden] = useState(false);
  const [sharedWallets, setSharedWallets] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [investmentTxs, setInvestmentTxs] = useState([]);
  const [debts, setDebts] = useState([]);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  // Scope hidden state per user + load shared wallets + investments
  useEffect(() => {
    base44.auth.me().then((u) => {
      if (!u?.email) return;
      const key = `balance_hidden::${u.email}`;
      setStorageKey(key);
      setHidden(localStorage.getItem(key) === "1");
      // Load shared wallets where user is owner or member
      base44.entities.SharedWallet.list().then((all) => {
        const mine = (all || []).filter(w =>
          w.owner_email === u.email || (w.members || []).includes(u.email)
        );
        setSharedWallets(mine);
      }).catch(() => {});
      // Load investments + transactions
      base44.entities.Investment.filter({ created_by: u.email }).then(setInvestments).catch(() => {});
      base44.entities.InvestmentTransaction.filter({ created_by: u.email }).then(setInvestmentTxs).catch(() => {});
      // Load active debts
      base44.entities.Debt.filter({ created_by: u.email, status: "active" }).then(setDebts).catch(() => {});
    }).catch(() => {});
  }, []);

  function toggleHidden(e) {
    e.stopPropagation();
    const next = !hidden;
    setHidden(next);
    if (storageKey) localStorage.setItem(storageKey, next ? "1" : "0");
  }

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
  }
  function handleTouchMove(e) {
    touchEndX.current = e.touches[0].clientX;
  }
  function handleTouchEnd() {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) setCurrentSlide((s) => (s + 1) % slides.length);else
      setCurrentSlide((s) => (s - 1 + slides.length) % slides.length);
    }
    touchStartX.current = null;
    touchEndX.current = null;
  }

  const now = new Date();
  const monthName = now.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
  const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);
  const totalShared = sharedWallets.reduce((s, w) => s + (w.balance || 0), 0);
  const selisih = income - expense;
  const savingRate = income > 0 ? Math.round(selisih / income * 100) : 0;

  // Investment metrics — sama seperti page Investments
  const invTotalBeli = investmentTxs.filter(tx => tx.type === "buy").reduce((s, tx) => s + (tx.total_amount || 0), 0);
  const invTotalJual = investmentTxs.filter(tx => tx.type === "sell").reduce((s, tx) => s + (tx.total_amount || 0), 0);
  const invSaldoAktif = invTotalBeli - invTotalJual;
  const invRealisasi = invTotalJual - invTotalBeli;
  const isProfit = invRealisasi >= 0;

  // Debt metrics
  const totalDebtRemaining = debts.reduce((s, d) => s + (d.remaining_amount || 0), 0);
  const totalDebtOriginal = debts.reduce((s, d) => s + (d.total_amount || 0), 0);
  const totalMonthlyPayment = debts.reduce((s, d) => s + (d.monthly_payment || 0), 0);
  const debtPaidPercent = totalDebtOriginal > 0 ? Math.round(((totalDebtOriginal - totalDebtRemaining) / totalDebtOriginal) * 100) : 0;

  if (loading) {
    return <div className="rounded-2xl animate-pulse h-36 bg-white/10" />;
  }

  const slides = [
  {
    key: "monthly",
    content:
    <div>
          <p className="text-white/50 text-[10px] font-semibold uppercase tracking-widest mb-1">Bulan Ini · {monthName}</p>
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className={`text-3xl font-black tracking-tight ${selisih >= 0 ? "text-white" : "text-red-400"}`}>
                {hidden ? <span className="tracking-[0.2em]">{HIDDEN}</span> : `Rp ${compactRupiah(selisih)}`}
              </p>
            </div>
            {income > 0 &&
        <div className="text-right">
                <p className="text-white/50 text-[10px] mb-0.5">Saving rate</p>
                <p className={`text-lg font-bold ${savingRate >= 0 ? "text-[#99ff80]" : "text-red-400"}`}>{hidden ? "—" : `${savingRate}%`}</p>
              </div>
        }
          </div>
          <div className="flex gap-3">
            <div className="flex-1 flex items-center gap-2 bg-white/8 rounded-xl px-3 py-2">
              <div className="w-7 h-7 rounded-full bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-[#99ff80]" />
              </div>
              <div>
                <p className="text-white/50 text-[9px] uppercase tracking-wider">Masuk</p>
                <p className="text-white text-xs font-bold">{hidden ? HIDDEN : `Rp ${compactRupiah(income)}`}</p>
              </div>
            </div>
            <div className="flex-1 flex items-center gap-2 bg-white/8 rounded-xl px-3 py-2">
              <div className="w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center">
                <TrendingDown className="w-3.5 h-3.5 text-[#ff8080]" />
              </div>
              <div>
                <p className="text-white/50 text-[9px] uppercase tracking-wider">Keluar</p>
                <p className="text-white text-xs font-bold">{hidden ? HIDDEN : `Rp ${compactRupiah(expense)}`}</p>
              </div>
            </div>
          </div>
        </div>

  },
  {
    key: "total",
    content:
    <div>
          <p className="text-white/50 text-[10px] font-semibold uppercase tracking-widest mb-1">Semua Rekening</p>
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-white/60 text-xs mb-0.5">Total Saldo</p>
              <p className={`text-3xl font-black tracking-tight ${totalBalance >= 0 ? "text-white" : "text-red-400"}`}>
                {hidden ? <span className="tracking-[0.2em]">{HIDDEN}</span> : `Rp ${compactRupiah(totalBalance)}`}
              </p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); navigate("/Accounts"); }}
              className="text-right tap-highlight-fix"
              title="Buka Rekening"
            >
              <p className="text-white/50 text-[10px] mb-0.5">{accounts.length} rekening</p>
              <Wallet className="w-5 h-5 text-white/40 ml-auto hover:text-white/70 transition-colors" />
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
            {[...accounts].sort((a, b) => (b.balance || 0) - (a.balance || 0)).map((a) =>
        <div key={a.id} className="flex-shrink-0 flex items-center gap-1.5 bg-white/8 rounded-lg px-2.5 h-10 w-[128px]">
                <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                  {a.logo_url ?
            <AccountAvatar logoUrl={a.logo_url} name={a.name} color={a.color || "#FF6A00"} size="h-5 w-5" /> :
            <span className="text-xs leading-none">{a.icon || "💳"}</span>
            }
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white/60 text-[9px] truncate leading-tight">{a.name}</p>
                  <p className="text-white text-[10px] font-bold truncate leading-tight">{hidden ? HIDDEN : `Rp ${compactRupiah(a.balance || 0)}`}</p>
                </div>
              </div>
        )}

            {accounts.length === 0 &&
        <button
          onClick={() => navigate("/Accounts")}
          className="flex-shrink-0 flex items-center gap-1.5 bg-[#FF6A00]/20 border border-[#FF6A00]/30 rounded-lg px-3 h-10 text-[#FF9A50] text-xs font-semibold">
          
                + Tambah Rekening
              </button>
        }
          </div>
        </div>

  },
  {
    key: "investments",
    content:
    <div>
          <p className="text-white/50 text-[10px] font-semibold uppercase tracking-widest mb-1">Investasi</p>
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-white/60 text-xs mb-0.5">Saldo Aktif</p>
              <p className={`text-3xl font-black tracking-tight ${invSaldoAktif >= 0 ? "text-white" : "text-red-400"}`}>
                {hidden ? <span className="tracking-[0.2em]">{HIDDEN}</span> : `Rp ${compactRupiah(invSaldoAktif)}`}
              </p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); navigate("/Investments"); }}
              className="text-right tap-highlight-fix"
              title="Buka Investasi"
            >
              <p className="text-white/50 text-[10px] mb-0.5">{investments.length} aset</p>
              <LineChart className="w-5 h-5 text-white/40 ml-auto hover:text-white/70 transition-colors" />
            </button>
          </div>
          {investments.length === 0 ? (
            <button
              onClick={(e) => { e.stopPropagation(); navigate("/Investments"); }}
              className="w-full flex items-center justify-center gap-1.5 bg-[#FF6A00]/20 border border-[#FF6A00]/30 rounded-lg px-3 h-10 text-[#FF9A50] text-xs font-semibold">
              + Mulai Investasi
            </button>
          ) : (
            <div className="flex gap-3">
              <div className="flex-1 flex items-center gap-2 bg-white/8 rounded-xl px-3 py-2">
                <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-[#80b3ff]" />
                </div>
                <div className="min-w-0">
                  <p className="text-white/50 text-[9px] uppercase tracking-wider">Total Beli</p>
                  <p className="text-white text-xs font-bold truncate">{hidden ? HIDDEN : `Rp ${compactRupiah(invTotalBeli)}`}</p>
                </div>
              </div>
              <div className="flex-1 flex items-center gap-2 bg-white/8 rounded-xl px-3 py-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${invTotalJual > 0 ? (isProfit ? "bg-green-500/20" : "bg-red-500/20") : "bg-white/10"}`}>
                  {isProfit ? <TrendingUp className="w-3.5 h-3.5 text-[#99ff80]" /> : <TrendingDown className="w-3.5 h-3.5 text-[#ff8080]" />}
                </div>
                <div className="min-w-0">
                  <p className="text-white/50 text-[9px] uppercase tracking-wider">Realisasi</p>
                  <p className={`text-xs font-bold truncate ${invTotalJual > 0 ? (isProfit ? "text-[#99ff80]" : "text-[#ff8080]") : "text-white/60"}`}>
                    {hidden ? HIDDEN : (invTotalJual > 0 ? `${isProfit ? "+" : ""}Rp ${compactRupiah(invRealisasi)}` : "—")}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

  },
  {
    key: "debts",
    content:
    <div>
          <p className="text-white/50 text-[10px] font-semibold uppercase tracking-widest mb-1">Utang & Cicilan</p>
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-white/60 text-xs mb-0.5">Total Sisa Utang</p>
              <p className={`text-3xl font-black tracking-tight ${totalDebtRemaining > 0 ? "text-[#ff8080]" : "text-white"}`}>
                {hidden ? <span className="tracking-[0.2em]">{HIDDEN}</span> : `Rp ${compactRupiah(totalDebtRemaining)}`}
              </p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); navigate("/Debts"); }}
              className="text-right tap-highlight-fix"
              title="Buka Utang"
            >
              <p className="text-white/50 text-[10px] mb-0.5">{debts.length} aktif</p>
              <CreditCard className="w-5 h-5 text-white/40 ml-auto hover:text-white/70 transition-colors" />
            </button>
          </div>
          {debts.length === 0 ? (
            <button
              onClick={(e) => { e.stopPropagation(); navigate("/Debts"); }}
              className="w-full flex items-center justify-center gap-1.5 bg-[#FF6A00]/20 border border-[#FF6A00]/30 rounded-lg px-3 h-10 text-[#FF9A50] text-xs font-semibold">
              + Catat Utang
            </button>
          ) : (
            <div className="flex gap-3">
              <div className="flex-1 flex items-center gap-2 bg-white/8 rounded-xl px-3 py-2">
                <div className="w-7 h-7 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <TrendingDown className="w-3.5 h-3.5 text-[#FF9A50]" />
                </div>
                <div className="min-w-0">
                  <p className="text-white/50 text-[9px] uppercase tracking-wider">Cicilan/Bln</p>
                  <p className="text-white text-xs font-bold truncate">{hidden ? HIDDEN : `Rp ${compactRupiah(totalMonthlyPayment)}`}</p>
                </div>
              </div>
              <div className="flex-1 flex items-center gap-2 bg-white/8 rounded-xl px-3 py-2">
                <div className="w-7 h-7 rounded-full bg-green-500/20 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-[#99ff80]" />
                </div>
                <div className="min-w-0">
                  <p className="text-white/50 text-[9px] uppercase tracking-wider">Terbayar</p>
                  <p className="text-[#99ff80] text-xs font-bold truncate">{hidden ? HIDDEN : `${debtPaidPercent}%`}</p>
                </div>
              </div>
            </div>
          )}
        </div>

  },
  {
    key: "shared",
    content:
    <div>
          <p className="text-white/50 text-[10px] font-semibold uppercase tracking-widest mb-1">Keuangan Bersama</p>
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-white/60 text-xs mb-0.5">Total Saldo Bersama</p>
              <p className={`text-3xl font-black tracking-tight ${totalShared >= 0 ? "text-white" : "text-red-400"}`}>
                {hidden ? <span className="tracking-[0.2em]">{HIDDEN}</span> : `Rp ${compactRupiah(totalShared)}`}
              </p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); navigate("/SharedFinance"); }}
              className="text-right tap-highlight-fix"
              title="Buka Keuangan Bersama"
            >
              <p className="text-white/50 text-[10px] mb-0.5">{sharedWallets.length} dompet</p>
              <Users className="w-5 h-5 text-white/40 ml-auto hover:text-white/70 transition-colors" />
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
            {[...sharedWallets].sort((a, b) => (b.balance || 0) - (a.balance || 0)).map((w) =>
        <div key={w.id} className="flex-shrink-0 flex items-center gap-1.5 bg-white/8 rounded-lg px-2.5 h-10 w-[128px]">
                <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs leading-none">{w.icon || "👨‍👩‍👧"}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white/60 text-[9px] truncate leading-tight">{w.name}</p>
                  <p className="text-white text-[10px] font-bold truncate leading-tight">{hidden ? HIDDEN : `Rp ${compactRupiah(w.balance || 0)}`}</p>
                </div>
              </div>
        )}

            {sharedWallets.length === 0 &&
        <button
          onClick={(e) => { e.stopPropagation(); navigate("/SharedFinance"); }}
          className="flex-shrink-0 flex items-center gap-1.5 bg-[#FF6A00]/20 border border-[#FF6A00]/30 rounded-lg px-3 h-10 text-[#FF9A50] text-xs font-semibold">
          
                + Buat Dompet Bersama
              </button>
        }
          </div>
        </div>

  }];


  return (
    <div data-tour="balance-card" className="relative">
      {/* Eye toggle button */}
      <button
        onClick={toggleHidden}
        className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 hover:text-white transition-all tap-highlight-fix"
        title={hidden ? "Tampilkan saldo" : "Sembunyikan saldo"}
      >
        {hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
      </button>

      {/* Card */}
      <div
        className="rounded-2xl p-4 relative overflow-hidden cursor-grab active:cursor-grabbing select-none"
        style={{
          background: 'linear-gradient(135deg, #1e1e1e 0%, #161616 50%, #0f0f0f 100%)',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,106,0,0.06)'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => setCurrentSlide((s) => (s + 1) % slides.length)}>
        
        {/* Subtle orange glow top-right */}
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #FF6A00 0%, transparent 70%)' }} />

        {/* Content */}
        {slides[currentSlide].content}
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 mt-2">
        {slides.map((_, idx) =>
        <button
          key={idx}
          onClick={() => setCurrentSlide(idx)}
          className={`rounded-full transition-all duration-200 ${
          idx === currentSlide ? "w-5 h-1.5 bg-[#FF6A00]" : "w-1.5 h-1.5 bg-white/25 sm:bg-black/20 dark:sm:bg-white/25"}`
          } />

        )}
      </div>
    </div>);

}