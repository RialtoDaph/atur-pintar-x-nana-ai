import { useState, useEffect, useRef } from "react";
import { Search, X, ArrowLeftRight, Target, CreditCard, TrendingUp, PiggyBank } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { formatRupiah } from "@/components/utils/formatRupiah";

const CATEGORY_CONFIG = {
  housing: { label: "Housing", emoji: "🏠" },
  food: { label: "Makanan", emoji: "🍔" },
  transport: { label: "Transport", emoji: "🚗" },
  health: { label: "Kesehatan", emoji: "❤️" },
  entertainment: { label: "Hiburan", emoji: "🎬" },
  shopping: { label: "Belanja", emoji: "🛍️" },
  subscriptions: { label: "Langganan", emoji: "📱" },
  salary: { label: "Gaji", emoji: "💼" },
  freelance: { label: "Freelance", emoji: "💻" },
  savings: { label: "Tabungan", emoji: "🐷" },
  other: { label: "Lainnya", emoji: "📦" },
};

export default function GlobalSearch({ onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ transactions: [], goals: [], debts: [], investments: [] });
  const [loading, setLoading] = useState(false);
  const [allData, setAllData] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    // Load all data once
    setLoading(true);
    Promise.all([
      base44.entities.Transaction.list("-date", 200),
      base44.entities.SavingsGoal.list("-created_date"),
      base44.entities.Debt.list("-created_date"),
      base44.entities.Investment.list("-created_date"),
    ]).then(([t, g, d, i]) => {
      setAllData({ transactions: t, goals: g, debts: d, investments: i });
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!allData || !query.trim()) {
      setResults({ transactions: [], goals: [], debts: [], investments: [] });
      return;
    }
    const q = query.toLowerCase();
    setResults({
      transactions: allData.transactions.filter(t =>
        (t.note || "").toLowerCase().includes(q) ||
        (CATEGORY_CONFIG[t.category]?.label || t.category || "").toLowerCase().includes(q) ||
        String(t.amount).includes(q)
      ).slice(0, 5),
      goals: allData.goals.filter(g =>
        g.name.toLowerCase().includes(q) || (g.description || "").toLowerCase().includes(q)
      ).slice(0, 3),
      debts: allData.debts.filter(d =>
        d.name.toLowerCase().includes(q)
      ).slice(0, 3),
      investments: allData.investments.filter(i =>
        i.name.toLowerCase().includes(q) || (i.notes || "").toLowerCase().includes(q)
      ).slice(0, 3),
    });
  }, [query, allData]);

  const hasResults =
    results.transactions.length > 0 ||
    results.goals.length > 0 ||
    results.debts.length > 0 ||
    results.investments.length > 0;

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-16 px-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#F2F4F7]">
          <Search className="w-5 h-5 text-[#8FA4C8] flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Cari transaksi, tujuan, utang, investasi..."
            className="flex-1 text-[#1A1A1A] text-sm placeholder-[#8FA4C8] focus:outline-none bg-transparent"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-[#8FA4C8] hover:text-[#1A1A1A]">
              <X className="w-4 h-4" />
            </button>
          )}
          <button onClick={onClose} className="text-[#8FA4C8] hover:text-[#1A1A1A] text-xs font-medium ml-1">
            Tutup
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 rounded-full border-2 border-[#FF6A00] border-t-transparent animate-spin" />
            </div>
          )}

          {!loading && !query && (
            <div className="px-5 py-8 text-center">
              <Search className="w-8 h-8 text-[#E2E8F0] mx-auto mb-3" />
              <p className="text-[#8FA4C8] text-sm">Ketik untuk mencari di seluruh data keuangan Anda</p>
            </div>
          )}

          {!loading && query && !hasResults && (
            <div className="px-5 py-8 text-center">
              <p className="text-[#4A5568] font-semibold text-sm">Tidak ditemukan</p>
              <p className="text-[#8FA4C8] text-xs mt-1">Coba kata kunci lain</p>
            </div>
          )}

          {/* Transactions */}
          {results.transactions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 px-4 pt-4 pb-2">
                <ArrowLeftRight className="w-3.5 h-3.5 text-[#8FA4C8]" />
                <p className="text-xs font-bold text-[#8FA4C8] uppercase tracking-widest">Transaksi</p>
              </div>
              {results.transactions.map(tx => (
                <Link
                  key={tx.id}
                  to={createPageUrl("Transactions")}
                  onClick={onClose}
                  className="flex items-center justify-between px-4 py-3 hover:bg-[#F8FAFC] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{CATEGORY_CONFIG[tx.category]?.emoji || "📦"}</span>
                    <div>
                      <p className="text-sm font-medium text-[#1A1A1A]">{tx.note || CATEGORY_CONFIG[tx.category]?.label || tx.category}</p>
                      <p className="text-xs text-[#8FA4C8]">{tx.date} · {CATEGORY_CONFIG[tx.category]?.label || tx.category}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${tx.type === "income" ? "text-[#00C9A7]" : "text-[#FF6B6B]"}`}>
                    {tx.type === "income" ? "+" : "-"}{formatRupiah(tx.amount)}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {/* Goals */}
          {results.goals.length > 0 && (
            <div>
              <div className="flex items-center gap-2 px-4 pt-4 pb-2">
                <Target className="w-3.5 h-3.5 text-[#8FA4C8]" />
                <p className="text-xs font-bold text-[#8FA4C8] uppercase tracking-widest">Tujuan</p>
              </div>
              {results.goals.map(g => (
                <Link
                  key={g.id}
                  to={createPageUrl(`Goals?id=${g.id}`)}
                  onClick={onClose}
                  className="flex items-center justify-between px-4 py-3 hover:bg-[#F8FAFC] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{g.icon || "🎯"}</span>
                    <div>
                      <p className="text-sm font-medium text-[#1A1A1A]">{g.name}</p>
                      <p className="text-xs text-[#8FA4C8]">{Math.round(((g.current_amount || 0) / (g.target_amount || 1)) * 100)}% tercapai</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-[#4A5568]">{formatRupiah(g.target_amount)}</span>
                </Link>
              ))}
            </div>
          )}

          {/* Debts */}
          {results.debts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 px-4 pt-4 pb-2">
                <CreditCard className="w-3.5 h-3.5 text-[#8FA4C8]" />
                <p className="text-xs font-bold text-[#8FA4C8] uppercase tracking-widest">Utang</p>
              </div>
              {results.debts.map(d => (
                <Link
                  key={d.id}
                  to={createPageUrl("Debts")}
                  onClick={onClose}
                  className="flex items-center justify-between px-4 py-3 hover:bg-[#F8FAFC] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">💳</span>
                    <div>
                      <p className="text-sm font-medium text-[#1A1A1A]">{d.name}</p>
                      <p className="text-xs text-[#8FA4C8]">{d.status === "paid" ? "Lunas" : "Aktif"}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-[#FF6B6B]">{formatRupiah(d.remaining_amount)}</span>
                </Link>
              ))}
            </div>
          )}

          {/* Investments */}
          {results.investments.length > 0 && (
            <div className="pb-2">
              <div className="flex items-center gap-2 px-4 pt-4 pb-2">
                <TrendingUp className="w-3.5 h-3.5 text-[#8FA4C8]" />
                <p className="text-xs font-bold text-[#8FA4C8] uppercase tracking-widest">Investasi</p>
              </div>
              {results.investments.map(inv => (
                <Link
                  key={inv.id}
                  to={createPageUrl("Investments")}
                  onClick={onClose}
                  className="flex items-center justify-between px-4 py-3 hover:bg-[#F8FAFC] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{inv.icon || "📈"}</span>
                    <div>
                      <p className="text-sm font-medium text-[#1A1A1A]">{inv.name}</p>
                      <p className="text-xs text-[#8FA4C8]">{inv.type}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-[#1A1A1A]">{formatRupiah(inv.current_value)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}