import { useState, useRef } from "react";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AccountAvatar from "@/components/ui/AccountAvatar";

function compactRupiah(value) {
  return Math.abs(value).toLocaleString('id-ID');
}

export default function BalanceCardCarousel({ income, expense, savings, accounts, loading }) {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

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
  const selisih = income - expense;
  const savingRate = income > 0 ? Math.round(selisih / income * 100) : 0;

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
                Rp {compactRupiah(selisih)}
              </p>
            </div>
            {income > 0 &&
        <div className="text-right">
                <p className="text-white/50 text-[10px] mb-0.5">Saving rate</p>
                <p className={`text-lg font-bold ${savingRate >= 0 ? "text-[#99ff80]" : "text-red-400"}`}>{savingRate}%</p>
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
                <p className="text-white text-xs font-bold">Rp {compactRupiah(income)}</p>
              </div>
            </div>
            <div className="flex-1 flex items-center gap-2 bg-white/8 rounded-xl px-3 py-2">
              <div className="w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center">
                <TrendingDown className="w-3.5 h-3.5 text-[#ff8080]" />
              </div>
              <div>
                <p className="text-white/50 text-[9px] uppercase tracking-wider">Keluar</p>
                <p className="text-white text-xs font-bold">Rp {compactRupiah(expense)}</p>
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
                Rp {compactRupiah(totalBalance)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/50 text-[10px] mb-0.5">{accounts.length} rekening</p>
              <Wallet className="w-5 h-5 text-white/40 ml-auto" />
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
            {[...accounts].sort((a, b) => (b.balance || 0) - (a.balance || 0)).map((a) =>
        <div key={a.id} className="flex items-center gap-1.5 bg-white/8 rounded-lg px-2.5 py-1.5">
                {a.logo_url ?
          <AccountAvatar logoUrl={a.logo_url} name={a.name} color={a.color || "#FF6A00"} size="h-5 w-5" /> :

          <span className="text-xs">{a.icon || "💳"}</span>
          }
                <div>
                  <p className="text-white/60 text-[9px]">{a.name}</p>
                  <p className="text-white text-[10px] font-bold">Rp {compactRupiah(a.balance || 0)}</p>
                </div>
              </div>
        )}

            {accounts.length === 0 &&
        <button
          onClick={() => navigate("/Accounts")}
          className="flex items-center gap-1.5 bg-[#FF6A00]/20 border border-[#FF6A00]/30 rounded-lg px-3 py-1.5 text-[#FF9A50] text-xs font-semibold">
          
                + Tambah Rekening
              </button>
        }
          </div>
        </div>

  }];


  return (
    <div data-tour="balance-card" className="relative">
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
          idx === currentSlide ? "w-5 h-1.5 bg-[#FF6A00]" : "w-1.5 h-1.5 bg-white/25"}`
          } />

        )}
      </div>
    </div>);

}