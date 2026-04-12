import { useState, useEffect } from "react";
import { X } from "lucide-react";
import BottomSheetSelect from "@/components/ui/BottomSheetSelect";

const TYPES = [
  { key: "tagihan", label: "Tagihan", emoji: "🧾" },
  { key: "lainnya", label: "Lainnya", emoji: "📌" },
];

const ICONS = ["🧾","🏦","🐷","📱","📌","💡","💧","📡","🚗","🏠","💳","📺","🎮","🍔","✈️","🏋️"];

export default function AddReminderModal({ reminder, onClose, onSave }) {
  const [form, setForm] = useState({
    title: "",
    type: "tagihan",
    amount: "",
    due_day: "1",
    icon: "",
    notes: "",
    is_active: true,
    create_recurring_tx: true,
  });
  const [saving, setSaving] = useState(false);
  const [showTypeSelect, setShowTypeSelect] = useState(false);
  const [showDaySelect, setShowDaySelect] = useState(false);

  useEffect(() => {
    if (reminder) {
      setForm({
        title: reminder.title || "",
        type: reminder.type || "tagihan",
        amount: reminder.amount ? String(reminder.amount) : "",
        due_day: String(reminder.due_day || 1),
        icon: reminder.icon || "",
        notes: reminder.notes || "",
        is_active: reminder.is_active !== false,
        create_recurring_tx: false, // editing existing — don't re-create
      });
    }
  }, [reminder]);

  async function handleSave() {
     if (!form.title?.trim()) return;

     const dueDay = parseInt(form.due_day);
     if (dueDay < 1 || dueDay > 31) return;

     const amount = form.amount ? parseFloat(form.amount) : 0;
     if (amount < 0) return;

     setSaving(true);
     try {
       await onSave({
         title: form.title.trim(),
         type: form.type,
         amount: amount > 0 ? amount : undefined,
         due_day: dueDay,
         icon: form.icon || undefined,
         notes: form.notes?.trim() || undefined,
         is_active: form.is_active,
         create_recurring_tx: form.create_recurring_tx && amount > 0,
       });
     } catch (error) {
       console.error("Save reminder failed:", error);
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
          <h2 className="text-lg font-bold text-[#1A1A1A]">{reminder ? "Edit Pengingat" : "Tambah Pengingat"}</h2>
          <button onClick={onClose} className="text-[#9B9B9B] hover:text-[#1A1A1A]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type */}
         <div className="mb-4">
           <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-2 block">Jenis</label>
           <button
             onClick={() => setShowTypeSelect(true)}
             className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC] text-left transition-colors hover:border-[#CBD5E0] tap-highlight-fix flex items-center justify-between"
           >
             <span>{TYPES.find(t => t.key === form.type)?.emoji} {TYPES.find(t => t.key === form.type)?.label}</span>
             <span className="text-[#8FA4C8]">›</span>
           </button>
         </div>

        {/* Title */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">Nama</label>
          <input
            className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]"
            placeholder="e.g. PLN, Cicilan Motor, Netflix..."
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          />
        </div>

        {/* Amount */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">Nominal (opsional)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8FA4C8] font-medium text-sm">Rp</span>
            <input
              type="number"
              className="w-full border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-3 text-lg font-bold text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]"
              placeholder="0"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
            />
          </div>
        </div>

        {/* Due Day */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">Tanggal Jatuh Tempo (tiap bulan)</label>
          <button
            onClick={() => setShowDaySelect(true)}
            className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC] text-left transition-colors hover:border-[#CBD5E0] tap-highlight-fix flex items-center justify-between"
          >
            <span>Tanggal {form.due_day}</span>
            <span className="text-[#8FA4C8]">›</span>
          </button>
        </div>

        {/* Icon picker */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-2 block">Ikon (opsional)</label>
          <div className="flex flex-wrap gap-2">
            {ICONS.map(ic => (
              <button key={ic} onClick={() => setForm(f => ({ ...f, icon: f.icon === ic ? "" : ic }))}
                className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center border transition-all ${
                  form.icon === ic ? "border-[#FF6A00] bg-[#FF6A00]/10" : "border-[#E2E8F0]"
                }`}>
                {ic}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">Catatan (opsional)</label>
          <input
            className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]"
            placeholder="e.g. Auto-debet BCA..."
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          />
        </div>

        {/* Auto recurring transaction toggle — only for new reminders with amount */}
        {!reminder && parseFloat(form.amount) > 0 && (
          <div className="mb-6 flex items-center justify-between bg-[#F8FAFC] rounded-xl px-4 py-3 border border-[#E2E8F0]">
            <div>
              <p className="text-sm font-semibold text-[#1A1A1A]">Buat transaksi otomatis 🔄</p>
              <p className="text-xs text-[#8FA4C8] mt-0.5">Catat sebagai pengeluaran berulang bulanan</p>
            </div>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, create_recurring_tx: !f.create_recurring_tx }))}
              className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 relative ${form.create_recurring_tx ? "bg-[#FF6A00]" : "bg-[#E2E8F0]"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.create_recurring_tx ? "translate-x-6" : "translate-x-0.5"}`} />
            </button>
          </div>
        )}

        <button onClick={handleSave} disabled={saving || !form.title || !form.due_day}
          className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-[#FF6A00] hover:bg-[#e05e00] disabled:opacity-40 transition-colors tap-highlight-fix">
          {saving ? "Menyimpan..." : reminder ? "Simpan Perubahan" : "Tambah Pengingat"}
        </button>
        </div>
        </div>

        <BottomSheetSelect
        isOpen={showTypeSelect}
        onClose={() => setShowTypeSelect(false)}
        title="Jenis Pengingat"
        options={TYPES}
        onSelect={(type) => setForm(f => ({ ...f, type }))}
        selectedValue={form.type}
        />

        <BottomSheetSelect
        isOpen={showDaySelect}
        onClose={() => setShowDaySelect(false)}
        title="Tanggal Jatuh Tempo"
        options={Array.from({ length: 28 }, (_, i) => ({
        key: String(i + 1),
        label: `Tanggal ${i + 1}`,
        }))}
        onSelect={(day) => setForm(f => ({ ...f, due_day: day }))}
        selectedValue={form.due_day}
        />
        </>
        );
        }