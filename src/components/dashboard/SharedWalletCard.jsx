import { Link } from "react-router-dom";
import { Users, ArrowRight } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function SharedWalletCard() {
  return (
    <Link
      to={createPageUrl("SharedFinance")}
      className="block bg-gradient-to-br from-[#FF6A00]/90 to-[#e05e00] rounded-2xl p-5 shadow-md hover:shadow-lg transition-all"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-white" />
            <p className="text-white font-bold text-sm">Dompet Bersama</p>
          </div>
          <p className="text-white/80 text-xs">Kelola keuangan bersama keluarga atau teman</p>
        </div>
        <ArrowRight className="w-4 h-4 text-white flex-shrink-0" />
      </div>
    </Link>
  );
}