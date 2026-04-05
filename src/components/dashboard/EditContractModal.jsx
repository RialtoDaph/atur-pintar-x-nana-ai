import { useState } from "react";
import { X } from "lucide-react";
import { useAppSettings } from "@/components/utils/useAppSettings";
import DateInput from "@/components/utils/DateInput";
import { parseRupiah } from "@/components/utils/parseRupiah";

const EXPENSE_CATS = [
  { key: "housing", emoji: "🏠", label: "Rumah" },
  { key: "food", emoji: "🍔", label: "Makan" },
  { key: "transport", emoji: "🚗", label: "Transport" },
  { key: "health", emoji: "❤️", label: "Kesehatan" },
  { key: "entertainment", emoji: "🎬", label: "Hiburan" },
  { key: "shopping", emoji: "🛍️", label: "Belanja" },
  { key: "subscriptions", emoji: "📱", label: "Langganan" },
  { key: "other", emoji: "📦", label: "Lainnya" },
];
const INCOME_CATS = [
  { key: "salary", emoji: "💼", label: "Gaji" },
  { key: "freelance", emoji: "💻", label: "Freelance" },
  { key: "other", emoji: "📦", label: "Lainnya" },
];
const ICONS = ["📱","🏠","🚗","🍔","💳","⚡","🎬","🛍️","💼","💻","❤️","📦","🎵","✈️","🐾"];

const INTERVALS = ["daily", "weekly", "monthly", "yearly"];

export default function EditContractModal({ contract, onClose, onSave }) {
  const { t, settings } = useAppSettings();
  const [data, setData] = useState(contract || { type: contract?.type || "expense" });
  const [saving, setSaving] = useState(false);

  const sep = settings?.thousand_separator || ".";

  function formatAmount(val) {
    if (!val && val !== 0) return "";
    const num = String(Math.round(Number(val)));
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
  }

  function handleAmountChange(e) {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setData({ ...data, amount: raw ? parseFloat(raw) : 0 });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(data);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white my-10 px-1 rounded-t-2xl sm:rounded-2xl w-full sm:w-96 max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-[#F2F4F7] px-5 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="font-bold text-[#1A1A1A]">Edit Kontrak</h2>
          <button onClick={onClose} className="p-1 hover:bg-[#F2F4F7] rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1A1A1A] mb-2">Jenis</label>
            <div className="flex gap-2 bg-[#F2F4F7] rounded-lg p-1 mb-4">
              {["expense", "income"].map((type) =>
              <button
                key={type}
                onClick={() => setData({ ...data, type })}
                className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
                data.type === type ?
                type === "expense" ?
                "bg-[#FF6B6B] text-white" :
                "bg-[#00C9A7] text-white" :
                "text-[#8FA4C8]"}`
                }>

                  {type === "expense" ? "- Pengeluaran" : "+ Pemasukan"}
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1A1A1A] mb-2">Nama</label>
            <input
              type="text"
              value={data.note || ""}
              onChange={(e) => setData({ ...data, note: e.target.value })} className="bg-white text-black px-3 py-2 text-sm rounded-lg w-full border border-[#E2E8F0] focus:outline-none focus:ring-1 focus:ring-[#FF6A00]"

              placeholder="Nama kontrak/tagihan" />

          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1A1A1A] mb-2">Nominal</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#8FA4C8] font-medium">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                value={formatAmount(data.amount)}
                onChange={handleAmountChange}
                className="bg-white text-black pl-9 pr-3 py-2 text-sm rounded-lg w-full border border-[#E2E8F0] focus:outline-none focus:ring-1 focus:ring-[#FF6A00]"
                placeholder="0" />
              
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1A1A1A] mb-2">Kategori</label>
            <div className="flex flex-wrap gap-1.5">
              {(data.type === "income" ? INCOME_CATS : EXPENSE_CATS).map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setData({ ...data, category: cat.key })}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    data.category === cat.key ? "bg-[#FF6A00] text-white border-[#FF6A00]" : "bg-[#F2F4F7] text-[#1A1A1A] border-transparent hover:bg-[#E2E8F0]"
                  }`}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1A1A1A] mb-2">Ikon</label>
            <div className="flex flex-wrap gap-1.5">
              {ICONS.map(icon => (
                <button
                  key={icon}
                  onClick={() => setData({ ...data, icon })}
                  className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                    data.icon === icon ? "bg-[#FF6A00] scale-110" : "bg-[#F2F4F7] hover:bg-[#E2E8F0]"
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1A1A1A] mb-2">Interval</label>
            <select
              value={data.recurring_interval || "monthly"}
              onChange={(e) => setData({ ...data, recurring_interval: e.target.value })}
              className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#FF6A00] capitalize bg-white text-black">

              {INTERVALS.map((i) =>
              <option key={i} value={i} className="capitalize">
                  {i}
                </option>
              )}
            </select>
          </div>

          {(data.recurring_interval === "monthly" || data.recurring_interval === "yearly") && (
            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-2">Tiap tanggal</label>
              <select
                value={data.date ? new Date(data.date + 'T12:00:00').getDate() : 1}
                onChange={(e) => {
                  const day = parseInt(e.target.value);
                  const d = new Date();
                  d.setDate(day);
                  setData({ ...data, date: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}` });
                }}
                className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#FF6A00] bg-white text-black">
                {Array.from({length:31},(_,i)=>i+1).map(d=><option key={d} value={d}>Tanggal {d}</option>)}
              </select>
            </div>
          )}

          <div className="flex gap-2 pt-4 sticky bottom-0 bg-white pb-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg bg-[#F2F4F7] text-[#1A1A1A] font-semibold text-sm hover:bg-[#E2E8F0] transition-colors">

              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-4 py-2 rounded-lg bg-[#FF6A00] text-white font-semibold text-sm hover:bg-[#e05e00] disabled:opacity-50 transition-colors">

              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      </div>
    </div>);

}