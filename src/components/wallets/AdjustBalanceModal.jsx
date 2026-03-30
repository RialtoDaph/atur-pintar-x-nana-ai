import { useState } from "react";
import { X, Plus, Minus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAppSettings } from "@/components/utils/AppSettingsContext";

export default function AdjustBalanceModal({ wallet, onClose, onSaved }) {
  const { formatCurrency } = useAppSettings();
  const [mode, setMode] = useState("set"); // set | add | subtract
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const val = parseFloat(amount) || 0;
    let newBalance = wallet.balance;
    if (mode === "set") newBalance = val;
    else if (mode === "add") newBalance = wallet.balance + val;
    else if (mode === "subtract") newBalance = wallet.balance - val;

    await base44.entities.Wallet.update(wallet.id, { balance: newBalance });
    setLoading(false);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-[#1A1A1A]">Update Saldo</h2>
            <p className="text-xs text-gray-500">{wallet.icon} {wallet.name} · Saldo: {formatCurrency(wallet.balance)}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Mode selector */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { value: "set", label: "Set Saldo" },
            { value: "add", label: "Tambah", icon: <Plus className="w-3 h-3" /> },
            { value: "subtract", label: "Kurang", icon: <Minus className="w-3 h-3" /> },
          ].map((m) => (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border-2 transition-all ${
                mode === m.value ? "border-[#FF6A00] bg-orange-50 text-[#FF6A00]" : "border-gray-100 text-gray-500"
              }`}
            >
              {m.icon}{m.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="number"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Masukkan nominal"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6A00]"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#FF6A00] text-white font-bold text-sm disabled:opacity-60"
          >
            {loading ? "Menyimpan..." : "Simpan"}
          </button>
        </form>
      </div>
    </div>
  );
}