import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAppSettings } from "@/components/utils/AppSettingsContext";
import { Plus, Pencil, Trash2, RefreshCw, Wallet } from "lucide-react";
import AddWalletModal from "@/components/wallets/AddWalletModal";
import AdjustBalanceModal from "@/components/wallets/AdjustBalanceModal";

const TYPE_LABELS = {
  bank: { label: "Bank", emoji: "🏦" },
  e_wallet: { label: "E-Wallet", emoji: "📱" },
  cash: { label: "Tunai", emoji: "💵" },
  lainnya: { label: "Lainnya", emoji: "💼" },
};

export default function Wallets() {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editWallet, setEditWallet] = useState(null);
  const [adjustWallet, setAdjustWallet] = useState(null);
  const { formatCurrency } = useAppSettings();

  const loadWallets = async () => {
    setLoading(true);
    const data = await base44.entities.Wallet.list("-created_date");
    setWallets(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadWallets();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Hapus dompet ini?")) return;
    await base44.entities.Wallet.delete(id);
    loadWallets();
  };

  const activeWallets = wallets.filter((w) => w.is_active !== false);
  const total = activeWallets.reduce((sum, w) => sum + (w.balance || 0), 0);

  const grouped = {
    bank: activeWallets.filter((w) => w.type === "bank"),
    e_wallet: activeWallets.filter((w) => w.type === "e_wallet"),
    cash: activeWallets.filter((w) => w.type === "cash"),
    lainnya: activeWallets.filter((w) => w.type === "lainnya"),
  };

  return (
    <div className="min-h-screen bg-[#F2F4F7] p-4 sm:p-6">
      <div className="max-w-xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-[#1A1A1A]">Dompet Saya</h1>
            <p className="text-sm text-gray-500 mt-0.5">Kelola semua akun keuanganmu</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-[#FF6A00] text-white text-sm font-bold px-4 py-2.5 rounded-xl"
          >
            <Plus className="w-4 h-4" />
            Tambah
          </button>
        </div>

        {/* Total card */}
        <div className="rounded-2xl p-5 text-white" style={{ background: "linear-gradient(135deg, #FF6A00, #FF9A3C)" }}>
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-5 h-5 text-white/80" />
            <span className="text-sm font-semibold text-white/80">Total Saldo</span>
          </div>
          <p className="text-3xl font-black">{formatCurrency(total)}</p>
          <p className="text-sm text-white/70 mt-1">{activeWallets.length} akun aktif</p>
        </div>

        {/* Wallet groups */}
        {loading ? (
          <div className="text-center py-10 text-gray-400 text-sm">Memuat...</div>
        ) : activeWallets.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
            <p className="text-4xl mb-3">💼</p>
            <p className="text-base font-bold text-[#1A1A1A]">Belum ada dompet</p>
            <p className="text-sm text-gray-400 mt-1 mb-5">Tambahkan rekening bank, e-wallet, atau kas tunai</p>
            <button
              onClick={() => setShowAdd(true)}
              className="bg-[#FF6A00] text-white text-sm font-bold px-5 py-2.5 rounded-xl"
            >
              + Tambah Dompet
            </button>
          </div>
        ) : (
          Object.entries(grouped).map(([type, items]) => {
            if (items.length === 0) return null;
            const t = TYPE_LABELS[type];
            return (
              <div key={type}>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 px-1">{t.emoji} {t.label}</p>
                <div className="space-y-2">
                  {items.map((w) => (
                    <div key={w.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ backgroundColor: (w.color || "#FF6A00") + "20" }}
                      >
                        {w.icon || "💰"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#1A1A1A]">{w.name}</p>
                        {w.description && <p className="text-xs text-gray-400 truncate">{w.description}</p>}
                        <p className="text-base font-black text-[#1A1A1A] mt-0.5">{formatCurrency(w.balance || 0)}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => setAdjustWallet(w)}
                          className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-[#FF6A00]"
                          title="Update saldo"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditWallet(w)}
                          className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(w.id)}
                          className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {showAdd && (
        <AddWalletModal onClose={() => setShowAdd(false)} onSaved={loadWallets} />
      )}
      {editWallet && (
        <AddWalletModal wallet={editWallet} onClose={() => setEditWallet(null)} onSaved={loadWallets} />
      )}
      {adjustWallet && (
        <AdjustBalanceModal wallet={adjustWallet} onClose={() => setAdjustWallet(null)} onSaved={loadWallets} />
      )}
    </div>
  );
}