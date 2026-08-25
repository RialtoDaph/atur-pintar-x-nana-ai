import { Crown, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppConfig } from '@/components/utils/useAppConfig';
import { usePremiumUser } from '@/hooks/usePremiumUser';

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

// Simple gate component — shows info card in-place with CTA to /Subscription (Xendit).
export default function PremiumGate({ user: userProp, featureName }) {
  const navigate = useNavigate();
  const { config } = useAppConfig();
  const { isPremium, user: hookUser } = usePremiumUser();
  const user = userProp || hookUser;

  if (isPremium) return null;

  const monthlyPrice = config?.premium_price_monthly || 18000;

  return (
    <div className="bg-gradient-to-br from-[#F97316]/8 to-[#FF8C42]/5 border border-[#F97316]/20 rounded-2xl p-6 text-center">
      <div className="w-12 h-12 rounded-2xl bg-[#F97316]/10 flex items-center justify-center mx-auto mb-3">
        <Crown className="w-6 h-6 text-[#F97316]" />
      </div>
      <p className="text-sm font-bold text-[#1A1A1A] mb-1">
        {featureName || "Fitur Premium"}
      </p>
      <p className="text-xs text-[#8FA4C8] mb-4">Mulai dari {formatRp(monthlyPrice)}/bulan</p>

      <ul className="space-y-1.5 mb-4 text-left max-w-xs mx-auto">
        {MONTHLY_FEATURES.map((f, i) => (
          <li key={i} className="flex items-center gap-2 text-xs text-[#1A1A1A]">
            <Check className="w-3.5 h-3.5 text-[#F97316] flex-shrink-0" />
            {f}
          </li>
        ))}
      </ul>

      <button
        onClick={() => navigate('/Subscription')}
        className="w-full max-w-xs px-6 py-2.5 bg-[#F97316] text-white rounded-xl text-sm font-bold hover:bg-[#EA580C] transition-colors"
      >
        Upgrade Sekarang
      </button>
    </div>
  );
}