import { Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PremiumGate({ user }) {
  const navigate = useNavigate();
  const isPremium = user?.subscription_plan && ['premium_monthly', 'premium_yearly'].includes(user.subscription_plan) && user?.subscription_status === 'active';

  if (isPremium) return null;

  return (
    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-6 text-center">
      <div className="flex justify-center mb-3">
        <Zap className="w-8 h-8 text-orange-600" />
      </div>
      <p className="text-sm font-semibold text-orange-900 mb-2">Fitur Premium</p>
      <p className="text-sm text-orange-700 mb-4">Fitur ini khusus untuk pengguna Premium. Upgrade sekarang untuk membuka akses penuh!</p>
      <button
        onClick={() => navigate('/Subscription')}
        className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-bold hover:bg-orange-700 transition-colors"
      >
        Upgrade Sekarang
      </button>
    </div>
  );
}