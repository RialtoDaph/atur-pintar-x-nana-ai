import { useState, useEffect } from 'react';
import { Crown, Zap, Check, X, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAppConfig } from '@/components/utils/useAppConfig';

const MONTHLY_FEATURES = [
  "Anggaran & Goals unlimited",
  "Nana AI chat unlimited",
  "Fitur Investasi penuh",
  "Analitik lanjutan",
  "Export PDF & Google Sheets",
];

function formatRp(n) {
  return "Rp " + (n || 0).toLocaleString("id-ID");
}

export function PremiumUpgradeModal({ onClose, onSuccess }) {
  const { config } = useAppConfig();
  const [selectedPlan, setSelectedPlan] = useState('premium_monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const monthlyPrice = config?.premium_price_monthly || 49000;
  const yearlyPrice = config?.premium_price_yearly || 490000;
  const yearlyDiscount = monthlyPrice > 0 ? Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100) : 0;

  // Load Midtrans snap
  useEffect(() => {
    if (document.querySelector('script[src*="snap.midtrans.com"]')) return;
    const script = document.createElement("script");
    script.src = "https://app.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", "Mid-client-DbRxTJwt9Fuh-xM6");
    document.head.appendChild(script);
  }, []);

  async function handleBuy() {
    setError(null);
    setLoading(true);
    try {
      const res = await base44.functions.invoke('createMidtransTransaction', { plan: selectedPlan });
      const { token } = res.data;
      setLoading(false);

      window.snap.pay(token, {
        onSuccess: async () => {
          const endDate = new Date();
          if (selectedPlan === 'premium_monthly') endDate.setMonth(endDate.getMonth() + 1);
          else endDate.setFullYear(endDate.getFullYear() + 1);
          const endDateStr = endDate.toISOString().split('T')[0];
          await base44.auth.updateMe({
            subscription_status: 'active',
            subscription_plan: selectedPlan,
            subscription_end_date: endDateStr,
          });
          setSuccess(selectedPlan);
          onSuccess?.({ plan: selectedPlan, end_date: endDateStr });
        },
        onPending: async () => {
          await base44.auth.updateMe({ subscription_status: 'pending', subscription_plan: selectedPlan });
          setSuccess('pending');
        },
        onError: () => {
          setError('Pembayaran gagal. Silakan coba lagi.');
        },
      });
    } catch (e) {
      setLoading(false);
      setError('Terjadi kesalahan. Coba lagi.');
    }
  }

  if (success && success !== 'pending') {
    return (
      <div className="fixed inset-0 bg-black/60 z-[100] flex items-end sm:items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-9 h-9 text-green-500" />
          </div>
          <p className="text-xl font-bold text-[#1A1A1A] mb-1">Pembayaran Berhasil! 🎉</p>
          <p className="text-sm text-[#8FA4C8] mb-5">Akses premium kamu sudah aktif sekarang.</p>
          <button
            onClick={onClose}
            className="w-full py-3 bg-[#FF6A00] text-white rounded-xl font-semibold text-sm hover:bg-[#e05e00] transition-colors"
          >
            Mulai Gunakan Fitur Premium
          </button>
        </div>
      </div>
    );
  }

  if (success === 'pending') {
    return (
      <div className="fixed inset-0 bg-black/60 z-[100] flex items-end sm:items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-8 text-center">
          <Clock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <p className="text-xl font-bold text-[#1A1A1A] mb-1">Pembayaran Diproses</p>
          <p className="text-sm text-[#8FA4C8] mb-5">Akses premium aktif setelah konfirmasi (maks 1×24 jam).</p>
          <button onClick={onClose} className="w-full py-3 bg-[#FF6A00] text-white rounded-xl font-semibold text-sm hover:bg-[#e05e00] transition-colors">OK</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-[#FF6A00] to-[#FF8C42] p-5 relative">
          <button onClick={onClose} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <Crown className="w-5 h-5 text-white" />
            <p className="text-white font-bold text-base">Upgrade ke Premium</p>
          </div>
          <p className="text-white/80 text-xs">Buka semua fitur tanpa batas</p>
        </div>

        <div className="p-5">
          {/* Features */}
          <ul className="space-y-2 mb-4">
            {MONTHLY_FEATURES.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-[#1A1A1A]">
                <Check className="w-4 h-4 text-[#FF6A00] flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          {/* Plan Selector */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => setSelectedPlan('premium_monthly')}
              className={`p-3 rounded-xl border-2 text-left transition-all ${selectedPlan === 'premium_monthly' ? 'border-[#FF6A00] bg-[#FF6A00]/5' : 'border-[#E2E8F0]'}`}
            >
              <p className="text-xs text-[#8FA4C8] font-medium">Bulanan</p>
              <p className="text-base font-bold text-[#1A1A1A]">{formatRp(monthlyPrice)}</p>
              <p className="text-[10px] text-[#8FA4C8]">/bulan</p>
            </button>
            <button
              onClick={() => setSelectedPlan('premium_yearly')}
              className={`p-3 rounded-xl border-2 text-left relative transition-all ${selectedPlan === 'premium_yearly' ? 'border-purple-500 bg-purple-50' : 'border-[#E2E8F0]'}`}
            >
              {yearlyDiscount > 0 && (
                <span className="absolute -top-2 -right-1 bg-purple-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  Hemat {yearlyDiscount}%
                </span>
              )}
              <p className="text-xs text-[#8FA4C8] font-medium">Tahunan</p>
              <p className="text-base font-bold text-[#1A1A1A]">{formatRp(yearlyPrice)}</p>
              <p className="text-[10px] text-[#8FA4C8]">/tahun</p>
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-200 mb-3">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          <button
            onClick={handleBuy}
            disabled={loading}
            className="w-full py-3 bg-[#FF6A00] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#e05e00] transition-colors disabled:opacity-60"
          >
            {loading
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Memuat...</>
              : <><Zap className="w-4 h-4" /> Bayar Sekarang</>
            }
          </button>
          <p className="text-[10px] text-[#8FA4C8] text-center mt-2">Pembayaran aman via Midtrans</p>
        </div>
      </div>
    </div>
  );
}

// Simple gate component — shows upgrade prompt in-place
export default function PremiumGate({ user, featureName }) {
  const [showModal, setShowModal] = useState(false);
  const { config } = useAppConfig();

  const isPremium = user?.subscription_plan && ['premium_monthly', 'premium_yearly'].includes(user.subscription_plan) && user?.subscription_status === 'active';
  if (isPremium) return null;

  const monthlyPrice = config?.premium_price_monthly || 49000;

  return (
    <>
      <div className="bg-gradient-to-br from-[#FF6A00]/8 to-[#FF8C42]/5 border border-[#FF6A00]/20 rounded-2xl p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#FF6A00]/10 flex items-center justify-center mx-auto mb-3">
          <Crown className="w-6 h-6 text-[#FF6A00]" />
        </div>
        <p className="text-sm font-bold text-[#1A1A1A] mb-1">
          {featureName || "Fitur Premium"}
        </p>
        <p className="text-xs text-[#8FA4C8] mb-1">Mulai dari {formatRp(monthlyPrice)}/bulan</p>
        <p className="text-xs text-[#8FA4C8] mb-4">Upgrade sekarang untuk membuka akses penuh!</p>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-2.5 bg-[#FF6A00] text-white rounded-xl text-sm font-bold hover:bg-[#e05e00] transition-colors"
        >
          Upgrade Sekarang
        </button>
      </div>

      {showModal && (
        <PremiumUpgradeModal
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); window.location.reload(); }}
        />
      )}
    </>
  );
}