import { useState } from "react";
import { X } from "lucide-react";

const INVESTMENT_TYPES = [
  { key: "saham", label: "Saham", emoji: "📈" },
  { key: "reksa_dana", label: "Reksa Dana", emoji: "💰" },
  { key: "crypto", label: "Crypto", emoji: "₿" },
  { key: "deposito", label: "Deposito", emoji: "🏦" },
  { key: "obligasi", label: "Obligasi", emoji: "📄" },
  { key: "emas", label: "Emas", emoji: "🥇" },
  { key: "lainnya", label: "Lainnya", emoji: "💼" },
];

export default function AddInvestmentModal({ onClose, onSave, investment = null }) {
  const [form, setForm] = useState(investment || {
    name: "", type: "reksa_dana", initial_amount: "", current_value: "", purchase_date: "", quantity: "", notes: ""
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form.name || !form.initial_amount || !form.current_value) return;
    setSaving(true);
    await onSave({
      ...form,
      initial_amount: parseFloat(form.initial_amount),
      current_value: parseFloat(form.current_value),
      quantity: form.quantity ? parseFloat(form.quantity) : undefined,
    });
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#1A1A1A]">{investment ? "Edit Investasi" : "Tambah Investasi"}</h2>
          <button onClick={onClose} className="text-[#9B9B9B] hover:text-[#1A1A1A]"><X className="w-5 h-5" /></button>
        </div>

        <div className="mb-4">
          <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-2 block">Jenis Investasi</label>
          <div className="grid grid-cols-4 gap-2">
            {INVESTMENT_TYPES.map(t => (
              <button key={t.key} onClick={() => setForm(f => ({ ...f, type: t.key }))}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                  form.type === t.key ? "border-[#FF6A00] bg-[#FF6A00]/10" : "border-[#E2E8F0] bg-[#F8FAFC]"
                }`}>
                <span className="text-xl">{t.emoji}</span>
                <span className="text-[10px] font-medium text-[#4A5568] text-center leading-tight">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {[
            { key: "name", label: "Nama Investasi", placeholder: "e.g. BBCA, Bitcoin, Reksa Dana Manulife", type: "text" },
            { key: "initial_amount", label: "Modal Awal (Rp)", placeholder: "0", type: "number" },
            { key: "current_value", label: "Nilai Saat Ini (Rp)", placeholder: "0", type: "number" },
            { key: "quantity", label: "Jumlah Unit/Lembar", placeholder: "0 (opsional)", type: "number" },
            { key: "purchase_date", label: "Tanggal Beli", placeholder: "", type: "date" },
            { key: "notes", label: "Catatan", placeholder: "Catatan opsional", type: "text" },
          ].map(field => (
            <div key={field.key}>
              <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">{field.label}</label>
              <input type={field.type} placeholder={field.placeholder}
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]"
                value={form[field.key]}
                onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>

        <button onClick={handleSave} disabled={saving || !form.name || !form.initial_amount || !form.current_value}
          className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-[#FF6A00] disabled:opacity-40 hover:bg-[#e05e00] transition-colors">
          {saving ? "Menyimpan..." : investment ? "Update Investasi" : "Simpan Investasi"}
        </button>
      </div>
    </div>
  );
}