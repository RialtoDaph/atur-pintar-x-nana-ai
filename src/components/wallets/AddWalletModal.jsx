import { useState } from "react";
import { X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAppSettings } from "@/components/utils/AppSettingsContext";

const WALLET_TYPES = [
  { value: "bank", label: "Bank", emoji: "🏦" },
  { value: "e_wallet", label: "E-Wallet", emoji: "📱" },
  { value: "cash", label: "Tunai", emoji: "💵" },
  { value: "lainnya", label: "Lainnya", emoji: "💼" },
];

const ICONS = ["🏦", "💳", "📱", "💵", "💰", "🏧", "💼", "🪙", "🤑", "💸"];
const COLORS = ["#FF6A00", "#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444", "#06B6D4", "#84CC16"];

export default function AddWalletModal({ onClose, onSaved, wallet }) {
  const { formatCurrency } = useAppSettings();
  const isEdit = !!wallet;
  const [form, setForm] = useState({
    name: wallet?.name || "",
    type: wallet?.type || "bank",
    balance: wallet?.balance || 0,
    icon: wallet?.icon || "🏦",
    color: wallet?.color || "#FF6A00",
    description: wallet?.description || "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (isEdit) {
      await base44.entities.Wallet.update(wallet.id, form);
    } else {
      await base44.entities.Wallet.create({ ...form, is_active: true });
    }
    setLoading(false);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl" style={{ maxHeight: "100dvh", overflowY: "auto" }}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-[#1A1A1A]">{isEdit ? "Edit Dompet" : "Tambah Dompet"}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Icon & Color */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Ikon</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setForm({ ...form, icon: ic })}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center border-2 transition-all ${
                    form.icon === ic ? "border-[#FF6A00] bg-orange-50" : "border-gray-100 bg-gray-50"
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Nama Dompet</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Contoh: BCA, GoPay, Kas Tunai"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6A00]"
            />
          </div>

          {/* Type */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Jenis</label>
            <div className="grid grid-cols-4 gap-2">
              {WALLET_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm({ ...form, type: t.value })}
                  className={`py-2.5 px-1 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${
                    form.type === t.value ? "border-[#FF6A00] bg-orange-50" : "border-gray-100"
                  }`}
                >
                  <span className="text-lg">{t.emoji}</span>
                  <span className="text-[10px] font-semibold text-gray-600">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Balance */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Saldo</label>
            <input
              type="number"
              value={form.balance}
              onChange={(e) => setForm({ ...form, balance: parseFloat(e.target.value) || 0 })}
              placeholder="0"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6A00]"
            />
          </div>

          {/* Color */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Warna</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${form.color === c ? "border-gray-800 scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Catatan (opsional)</label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Contoh: Rekening utama"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6A00]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#FF6A00] text-white font-bold text-sm disabled:opacity-60"
          >
            {loading ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Dompet"}
          </button>
        </form>
      </div>
    </div>
  );
}