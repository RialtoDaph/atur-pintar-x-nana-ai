import { Crown } from "lucide-react";
import { usePremiumUser } from "@/hooks/usePremiumUser";

/**
 * Small "PRO" badge — dipakai inline di header/nama user.
 * Otomatis hilang kalau user free.
 */
export default function PremiumBadge({ className = "" }) {
  const { isPremium, user, loading } = usePremiumUser();
  if (loading || !isPremium) return null;

  const label = user?.role === "admin" ? "ADMIN" : "PRO";

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#F97316] to-[#FF8C42] text-white text-[10px] font-bold uppercase tracking-widest ${className}`}
    >
      <Crown className="w-2.5 h-2.5" />
      {label}
    </span>
  );
}