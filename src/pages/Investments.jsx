import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import AddInvestmentModal from "@/components/investments/AddInvestmentModal.jsx";

const INVESTMENT_TYPES = {
  saham: { label: "Saham", emoji: "📈" },
  reksa_dana: { label: "Reksa Dana", emoji: "💰" },
  crypto: { label: "Crypto", emoji: "₿" },
  deposito: { label: "Deposito", emoji: "🏦" },
  obligasi: { label: "Obligasi", emoji: "📄" },
  emas: { label: "Emas", emoji: "🥇" },
  lainnya: { label: "Lainnya", emoji: "💼" },
};

export default function InvestmentsPage() {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const inv = await base44.entities.Investment.list("-created_date");
    setInvestments(inv);
    setLoading(false);
  }

  async function handleDelete(id) {
    await base44.entities.Investment.delete(id);
    loadData();
  }

  const totalInvested = investments.reduce((s, i) => s + i.initial_amount, 0);
  const totalValue = investments.reduce((s, i) => s + i.current_value, 0);
  const totalGain = totalValue - totalInvested;
  const gainPercent = totalInvested > 0 ? ((totalGain / totalInvested) * 100).toFixed(2) : 0;

  return (
    <div className="min-h-screen bg-[#F2F4F7] pb-8">
      <div className="bg-[#0A0A0A] px-5 pt-10 pb-20">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[#8FA4C8] text-sm font-medium">Portofolio</p>
              <h1 className="text-white text-2xl font-bold mt-0.5">Investasi</h1>
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="w-10 h-10 rounded-full bg-[#FF6A00] flex items-center justify-center shadow-lg hover:bg-[#e05e00] transition-colors"
            >
              <Plus className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="bg-white/10 rounded-2xl p-5">
            <p className="text-white/60 text-sm mb-1">Total Nilai Portofolio</p>
            <p className="text-white font-bold text-3xl mb-2">Rp {totalValue.toLocaleString("id-ID")}</p>
            <div className="flex items-center gap-1">
              {totalGain >= 0 ? <TrendingUp className="w-4 h-4 text-[#00C9A7]" /> : <TrendingDown className="w-4 h-4 text-[#FF6B6B]" />}
              <span className={`text-sm font-semibold ${totalGain >= 0 ? "text-[#00C9A7]" : "text-[#FF6B6B]"}`}>
                {totalGain >= 0 ? "+" : ""}Rp {totalGain.toLocaleString("id-ID")} ({gainPercent}%)
              </span>
              <span className="text-white/40 text-xs ml-1">dari modal Rp {totalInvested.toLocaleString("id-ID")}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 -mt-10 space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />)
        ) : investments.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-[#E2E8F0]">
            <TrendingUp className="w-10 h-10 text-[#8FA4C8] mx-auto mb-3" />
            <p className="text-[#4A5568] font-semibold">Belum ada investasi</p>
            <p className="text-[#8FA4C8] text-sm mt-1">Tap + untuk mencatat investasi Anda</p>
          </div>
        ) : (
          investments.map(inv => {
            const type = INVESTMENT_TYPES[inv.type] || INVESTMENT_TYPES.lainnya;
            const gain = inv.current_value - inv.initial_amount;
            const gainPct = inv.initial_amount > 0 ? ((gain / inv.initial_amount) * 100).toFixed(2) : 0;
            const isPositive = gain >= 0;
            const portfolioWeight = totalValue > 0 ? ((inv.current_value / totalValue) * 100).toFixed(1) : 0;
            return (
              <div key={inv.id} className="bg-white rounded-2xl p-5 shadow-sm border border-[#E2E8F0]">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#4F7CFF]/10 flex items-center justify-center text-xl">
                      {inv.icon || type.emoji}
                    </div>
                    <div>
                      <p className="font-semibold text-[#1A1A1A]">{inv.name}</p>
                      <p className="text-xs text-[#8FA4C8]">{type.label} · {portfolioWeight}% portofolio</p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(inv.id)} className="text-[#CBD5E0] hover:text-[#FF6B6B] transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-3 flex justify-between items-end">
                  <div>
                    <p className="text-xs text-[#8FA4C8]">Nilai Saat Ini</p>
                    <p className="font-bold text-[#1A1A1A] text-lg">Rp {inv.current_value.toLocaleString("id-ID")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#8FA4C8]">Keuntungan/Rugi</p>
                    <p className={`font-bold text-base ${isPositive ? "text-[#00C9A7]" : "text-[#FF6B6B]"}`}>
                      {isPositive ? "+" : ""}Rp {gain.toLocaleString("id-ID")} ({isPositive ? "+" : ""}{gainPct}%)
                    </p>
                  </div>
                </div>
                {inv.notes && <p className="text-xs text-[#8FA4C8] mt-2 italic">{inv.notes}</p>}
              </div>
            );
          })
        )}
      </div>

      {showAdd && (
        <AddInvestmentModal
          onClose={() => setShowAdd(false)}
          onSave={async (data) => {
            await base44.entities.Investment.create(data);
            setShowAdd(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}