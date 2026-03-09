import { useState } from "react";
import { X } from "lucide-react";
import BottomSheetSelect from "@/components/ui/BottomSheetSelect";
import DateInput from "@/components/utils/DateInput";

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
  const [showTypeSelect, setShowTypeSelect] = useState(false);
  const isEdit = !!debt;

  async function handleSave() {
     if (!form.name?.trim()) return;

     const totalAmount = parseFloat(form.total_amount) || 0;
     const remainingAmount = parseFloat(form.remaining_amount) || 0;
     const monthlyPayment = parseFloat(form.monthly_payment) || 0;
     const interestRate = parseFloat(form.interest_rate) || 0;

     if (totalAmount <= 0 || remainingAmount <= 0) return;
     if (remainingAmount > totalAmount) return;
     if (monthlyPayment < 0 || interestRate < 0 || interestRate > 100) return;

     setSaving(true);
     try {
       await onSave({
         ...form,
         total_amount: totalAmount,
         remaining_amount: remainingAmount,
         interest_rate: interestRate > 0 ? interestRate : undefined,
         monthly_payment: monthlyPayment > 0 ? monthlyPayment : undefined,
       });
     } catch (error) {
       console.error("Save debt failed:", error);
       throw error;
     } finally {
       setSaving(false);
     }
   }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 max-h-[90vh] overflow-y-auto overscroll-contain">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-[#1A1A1A]">{isEdit ? "Edit Utang/Kredit" : "Tambah Utang/Kredit"}</h2>
            <button onClick={onClose} className="text-[#9B9B9B] hover:text-[#1A1A1A] tap-highlight-fix"><X className="w-5 h-5" /></button>
          </div>

          <div className="mb-4">
            <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-2 block">Jenis</label>
            <button
              onClick={() => setShowTypeSelect(true)}
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC] text-left transition-colors hover:border-[#CBD5E0] tap-highlight-fix flex items-center justify-between"
            >
              <span>{DEBT_TYPES.find(t => t.key === form.type)?.emoji} {DEBT_TYPES.find(t => t.key === form.type)?.label}</span>
              <span className="text-[#8FA4C8]">›</span>
            </button>
          </div>

          <div className="space-y-3 mb-6">
            {[
              { key: "name", label: "Nama Utang", placeholder: "e.g. KPR BCA, Kartu Kredit Mandiri", type: "text" },
              { key: "total_amount", label: "Total Utang (Rp)", placeholder: "0", type: "number" },
              { key: "remaining_amount", label: "Sisa Utang (Rp)", placeholder: "0", type: "number" },
              { key: "monthly_payment", label: "Cicilan/Bulan (Rp)", placeholder: "0 (opsional)", type: "number" },
              { key: "interest_rate", label: "Bunga per Tahun (%)", placeholder: "0 (opsional)", type: "number" },
            ].map(field => (
              <div key={field.key}>
                <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">{field.label}</label>
                <input type={field.type} placeholder={field.placeholder}
                  className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC] tap-highlight-fix"
                  value={form[field.key]}
                  onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                />
              </div>
            ))}
            <DateInput
              value={form.due_date}
              onChange={(date) => setForm(f => ({ ...f, due_date: date }))}
              label="Tanggal Jatuh Tempo"
            />
          </div>

          <button onClick={handleSave} disabled={saving || !form.name || !form.total_amount || !form.remaining_amount}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-[#FF6A00] disabled:opacity-40 hover:bg-[#e05e00] transition-colors tap-highlight-fix">
            {saving ? "Menyimpan..." : isEdit ? "Perbarui Utang" : "Simpan Utang"}
          </button>
        </div>
      </div>

      <BottomSheetSelect
        isOpen={showTypeSelect}
        onClose={() => setShowTypeSelect(false)}
        title="Jenis Utang"
        options={DEBT_TYPES}
        onSelect={(type) => setForm(f => ({ ...f, type }))}
        selectedValue={form.type}
      />
    </>
  );
}