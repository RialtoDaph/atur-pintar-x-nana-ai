import { useNavigate } from "react-router-dom";
import { usePremiumUser } from "@/hooks/usePremiumUser";
import { Crown, Loader2 } from "lucide-react";

/**
 * Wraps premium-only content. Redirects/blocks free users.
 * Usage: <PremiumGuard><YourContent /></PremiumGuard>
 */
export default function PremiumGuard({ children }) {
  const { isPremium, loading } = usePremiumUser();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#F2F4F7]">
        <Loader2 className="w-8 h-8 text-[#F97316] animate-spin" />
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="min-h-screen bg-[#F2F4F7] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-[#F97316]/10 flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-[#F97316]" />
          </div>
          <h2 className="text-lg font-bold text-[#1A1A1A] mb-2">Fitur Premium</h2>
          <p className="text-sm text-[#8FA4C8] mb-6">
            Fitur ini akan segera tersedia untuk pengguna Premium melalui App Store.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="w-full py-3 rounded-xl bg-[#F97316] text-white font-bold text-sm hover:bg-[#e05e00] transition-colors">
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return children;
}