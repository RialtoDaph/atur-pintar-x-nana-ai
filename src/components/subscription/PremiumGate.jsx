import { useState } from 'react';
import { Crown, Check, X } from 'lucide-react';
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

// Info-only modal — pembayaran akan tersedia via App Store In-App Purchase nantinya.
export function PremiumUpgradeModal({ onClose }) {
  const { config } = useAppConfig();
  const monthlyPrice = config?.premium_price_monthly || 49000;

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-[#F97316] to-[#FF8C42] p-5 relative">
          <button onClick={onClose} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <Crown className="w-5 h-5 text-white" />
            <p className="text-white font-bold text-base">Fitur Premium</p>
          </div>
          <p className="text-white/80 text-xs">Buka semua fitur tanpa batas</p>
        </div>

        <div className="p-5">
          <ul className="space-y-2 mb-4">
            {MONTHLY_FEATURES.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-[#1A1A1A]">
                <Check className="w-4 h-4 text-[#F97316] flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          <div className="bg-[#FFF7ED] border border-[#F97316]/20 rounded-xl p-4 text-center mb-4">
            <p className="text-sm font-semibold text-[#1A1A1A] mb-1">
              Segera tersedia via App Store
            </p>
            <p className="text-xs text-[#8FA4C8]">
              Mulai dari {formatRp(monthlyPrice)}/bulan. Pembelian akan diproses melalui In-App Purchase Apple.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-[#F97316] text-white rounded-xl font-bold text-sm hover:bg-[#e05e00] transition-colors"
          >
            Mengerti
          </button>
        </div>
      </div>
    </div>
  );
}

// Simple gate component — shows info card in-place (no payment CTA).
export default function PremiumGate({ user, featureName }) {
  const [showModal, setShowModal] = useState(false);
  const { config } = useAppConfig();

  // 🎁 Free access window — semua user dapat akses premium sampai tanggal ini
  const FREE_ACCESS_UNTIL = '2026-08-08';
  const todayStr = new Date().toISOString().split('T')[0];
  const inFreeWindow = todayStr <= FREE_ACCESS_UNTIL;
  const isPremium = inFreeWindow || (user?.subscription_plan && ['premium_monthly', 'premium_yearly'].includes(user.subscription_plan) && user?.subscription_status === 'active');
  if (isPremium) return null;

  const monthlyPrice = config?.premium_price_monthly || 49000;

  return (
    <>
      <div className="bg-gradient-to-br from-[#F97316]/8 to-[#FF8C42]/5 border border-[#F97316]/20 rounded-2xl p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#F97316]/10 flex items-center justify-center mx-auto mb-3">
          <Crown className="w-6 h-6 text-[#F97316]" />
        </div>
        <p className="text-sm font-bold text-[#1A1A1A] mb-1">
          {featureName || "Fitur Premium"}
        </p>
        <p className="text-xs text-[#8FA4C8] mb-1">Mulai dari {formatRp(monthlyPrice)}/bulan</p>
        <p className="text-xs text-[#8FA4C8] mb-4">Segera tersedia via App Store 🎁</p>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-2.5 bg-[#F97316] text-white rounded-xl text-sm font-bold hover:bg-[#e05e00] transition-colors"
        >
          Lihat Detail
        </button>
      </div>

      {showModal && (
        <PremiumUpgradeModal onClose={() => setShowModal(false)} />
      )}
    </>
  );
}