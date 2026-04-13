import { useNavigate } from "react-router-dom";
import { usePremiumUser } from "@/hooks/usePremiumUser";
import { Crown, Loader2 } from "lucide-react";
import { createPageUrl } from "@/utils";

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
        <Loader2 className="w-8 h-8 text-[#FF6A00] animate-spin" />
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="min-h-screen bg-[#F2F4F7] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-[#FF6A00]/10 flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-[#FF6A00]" />
          </div>
          <h2 className="text-lg font-bold text-[#1A1A1A] mb-2">Fitur Premium</h2>
          <p className="text-sm text-[#8FA4C8] mb-6">
            Fitur ini tersedia untuk pengguna Premium. Upgrade sekarang untuk mengakses semua fitur unggulan Atur Pintar!
          </p>
          <button
            onClick={() => navigate(createPageUrl("Subscription"))}
            className="w-full py-3 rounded-xl bg-[#FF6A00] text-white font-bold text-sm hover:bg-[#e05e00] transition-colors">
            Upgrade ke Premium
          </button>
          <button
            onClick={() => navigate(-1)}
            className="w-full py-2.5 mt-2 rounded-xl text-[#8FA4C8] text-sm hover:text-[#1A1A1A] transition-colors">
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return children;
}