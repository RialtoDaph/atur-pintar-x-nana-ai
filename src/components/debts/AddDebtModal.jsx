import { useState } from "react";
import { X } from "lucide-react";

const DEBT_TYPES = [
  { key: "kpr", label: "KPR", emoji: "🏠" },
  { key: "kendaraan", label: "Kendaraan", emoji: "🚗" },
  { key: "kartu_kredit", label: "Kartu Kredit", emoji: "💳" },
  { key: "pinjaman_pribadi", label: "Pinjaman Pribadi", emoji: "🤝" },
  { key: "lainnya", label: "Lainnya", emoji: "📋" },
];

export default function AddDebtModal({ onClose, onSave, debt }) {
  const [form, setForm] = useState({
    name: debt?.name || "", type: debt?.type || "lainnya",
    total_amount: debt?.total_amount || "", remaining_amount: debt?.remaining_amount || "",
    interest_rate: debt?.interest_rate || "", monthly_payment: debt?.monthly_payment || "",
    due_date: debt?.due_date || "", icon: debt?.icon || ""
  });
  const [saving, setSaving] = useState(false);
  const isEdit = !!debt;

  async function handleSave() {
    if (!form.name || !form.total_amount || !form.remaining_amount) return;
    setSaving(true);
    await onSave({
      ...form,
      total_amount: parseFloat(form.total_amount),
      remaining_amount: parseFloat(form.remaining_amount),
      interest_rate: form.interest_rate ? parseFloat(form.interest_rate) : undefined,
      monthly_payment: form.monthly_payment ? parseFloat(form.monthly_payment) : undefined,
    });
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#1A1A1A]">{isEdit ? "Edit Utang/Kredit" : "Tambah Utang/Kredit"}</h2>
          <button onClick={onClose} className="text-[#9B9B9B] hover:text-[#1A1A1A]"><X className="w-5 h-5" /></button>
        </div>

        <div className="mb-4">
          <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-2 block">Jenis</label>
          <div className="grid grid-cols-5 gap-2">
            {DEBT_TYPES.map(t => (
              <button key={t.key} onClick={() => setForm(f => ({ ...f, type: t.key }))}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                  form.type === t.key ? "border-[#FF6A00] bg-[#FF6A00]/10" : "border-[#E2E8F0] bg-[#F8FAFC]"
                }`}>
                <span className="text-lg">{t.emoji}</span>
                <span className="text-[9px] font-medium text-[#4A5568] text-center leading-tight">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {[
            { key: "name", label: "Nama Utang", placeholder: "e.g. KPR BCA, Kartu Kredit Mandiri", type: "text" },
            { key: "total_amount", label: "Total Utang (Rp)", placeholder: "0", type: "number" },
            { key: "remaining_amount", label: "Sisa Utang (Rp)", placeholder: "0", type: "number" },
            { key: "monthly_payment", label: "Cicilan/Bulan (Rp)", placeholder: "0 (opsional)", type: "number" },
            { key: "interest_rate", label: "Bunga per Tahun (%)", placeholder: "0 (opsional)", type: "number" },
            { key: "due_date", label: "Tanggal Jatuh Tempo", placeholder: "", type: "date" },
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

        <button onClick={handleSave} disabled={saving || !form.name || !form.total_amount || !form.remaining_amount}
          className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-[#FF6A00] disabled:opacity-40 hover:bg-[#e05e00] transition-colors">
          {saving ? "Menyimpan..." : isEdit ? "Perbarui Utang" : "Simpan Utang"}
        </button>
      </div>
    </div>
  );
}