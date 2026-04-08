import { useState } from "react";
import { Trash2 } from "lucide-react";

const COMMON_ICONS = ["📦", "🎵", "🎬", "📺", "🎮", "☁️", "📰", "🏋️", "🍕", "💻", "📱", "🔒", "🛒", "✈️", "🎓", "💡", "🏠", "🚗", "💊", "🎨"];

export default function EditSubscriptionModal({ sub, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({
    name: sub.name || "",
    icon: sub.icon || "📦",
    amount: sub.amount || "",
    billing_cycle: sub.billing_cycle || "monthly",
    next_due_date: sub.next_due_date || "",
    notes: sub.notes || "",
    status: sub.status || "active",
  });
  const [saving, setSaving] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    await onSave(sub.id, { ...form, amount: parseFloat(form.amount) });
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm("Hapus langganan ini?")) return;
    await onDelete(sub.id);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4 pb-6 sm:pb-0" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h2 className="text-sm font-bold text-[#1A1A1A]">Edit Langganan</h2>
          <button onClick={handleDelete} className="p-1.5 rounded-lg text-[#CBD5E0] hover:text-[#FF6B6B] hover:bg-[#FFF5F5] transition-colors tap-highlight-fix">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 pb-4 space-y-2.5">
          {/* Icon + Name */}
          <div className="flex gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowIconPicker((v) => !v)}
                className="w-12 h-10 border border-[#E2E8F0] rounded-xl text-lg flex items-center justify-center hover:border-[#FF6A00] transition-colors tap-highlight-fix"
              >
                {form.icon}
              </button>
              {showIconPicker && (
                <div className="absolute top-12 left-0 z-10 bg-white border border-[#E2E8F0] rounded-xl p-2 shadow-lg grid grid-cols-5 gap-1 w-44">
                  {COMMON_ICONS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => { set("icon", ic); setShowIconPicker(false); }}
                      className={`w-8 h-8 rounded-lg text-base flex items-center justify-center hover:bg-[#F2F4F7] transition-colors tap-highlight-fix ${form.icon === ic ? "bg-[#FF6A00]/10" : ""}`}
                    >{ic}</button>
                  ))}
                </div>
              )}
            </div>
            <input
              type="text"
              placeholder="Nama layanan"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
              className="flex-1 border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/30 focus:border-[#FF6A00]"
            />
          </div>

          <input
            type="number"
            placeholder="Jumlah tagihan"
            value={form.amount}
            onChange={(e) => set("amount", e.target.value)}
            required
            className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/30 focus:border-[#FF6A00]"
          />

          <select
            value={form.billing_cycle}
            onChange={(e) => set("billing_cycle", e.target.value)}
            className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/30 focus:border-[#FF6A00]"
          >
            <option value="monthly">Bulanan</option>
            <option value="quarterly">Triwulanan</option>
            <option value="yearly">Tahunan</option>
          </select>

          <input
            type="date"
            value={form.next_due_date}
            onChange={(e) => set("next_due_date", e.target.value)}
            required
            className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/30 focus:border-[#FF6A00]"
          />

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-[#8FA4C8] tap-highlight-fix">Batal</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 rounded-xl bg-[#FF6A00] text-white text-sm font-bold disabled:opacity-60 tap-highlight-fix">
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}