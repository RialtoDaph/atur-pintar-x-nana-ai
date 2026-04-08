import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function SharedWalletCard() {
  return (
    <Link
      to={createPageUrl("SharedFinance")}
      className="block bg-white rounded-xl p-4 border border-[#E2E8F0] hover:shadow-sm transition-all"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#FF6A00]/10 flex items-center justify-center">
          <Users className="w-5 h-5 text-[#FF6A00]" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[#0A0A0A]">Dompet Bersama</p>
        </div>
      </div>
    </Link>
  );
}