import { useState, useEffect } from "react";
import { X } from "lucide-react";

const TYPES = [
  { key: "tagihan",   label: "Tagihan",   emoji: "🧾" },
  { key: "cicilan",   label: "Cicilan",   emoji: "🏦" },
  { key: "tabungan",  label: "Tabungan",  emoji: "🐷" },
  { key: "langganan", label: "Langganan", emoji: "📱" },
  { key: "lainnya",   label: "Lainnya",   emoji: "📌" },
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
  });
  const [saving, setSaving] = useState(false);

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
      });
    }
  }, [reminder]);

  async function handleSave() {
    if (!form.title || !form.due_day) return;
    setSaving(true);
    await onSave({
      title: form.title,
      type: form.type,
      amount: form.amount ? parseFloat(form.amount) : undefined,
      due_day: parseInt(form.due_day),
      icon: form.icon || undefined,
      notes: form.notes || undefined,
      is_active: form.is_active,
    });
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#1A1A1A]">{reminder ? "Edit Pengingat" : "Tambah Pengingat"}</h2>
          <button onClick={onClose} className="text-[#9B9B9B] hover:text-[#1A1A1A]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-2 block">Jenis</label>
          <div className="grid grid-cols-5 gap-1.5">
            {TYPES.map(t => (
              <button key={t.key} onClick={() => setForm(f => ({ ...f, type: t.key }))}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs font-medium transition-all ${
                  form.type === t.key ? "border-[#FF6A00] bg-[#FF6A00]/10 text-[#FF6A00]" : "border-[#E2E8F0] text-[#4A5568]"
                }`}>
                <span className="text-lg">{t.emoji}</span>
                {t.label}
              </button>
            ))}
          </div>
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
          <select
            className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]"
            value={form.due_day}
            onChange={e => setForm(f => ({ ...f, due_day: e.target.value }))}
          >
            {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
              <option key={d} value={d}>Tanggal {d}</option>
            ))}
          </select>
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
        <div className="mb-6">
          <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">Catatan (opsional)</label>
          <input
            className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]"
            placeholder="e.g. Auto-debet BCA..."
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          />
        </div>

        <button onClick={handleSave} disabled={saving || !form.title || !form.due_day}
          className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-[#FF6A00] hover:bg-[#e05e00] disabled:opacity-40 transition-colors">
          {saving ? "Menyimpan..." : reminder ? "Simpan Perubahan" : "Tambah Pengingat"}
        </button>
      </div>
    </div>
  );
}