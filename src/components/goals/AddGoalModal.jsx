import { useState } from "react";
import { X } from "lucide-react";
import useLockBodyScroll from "@/hooks/useLockBodyScroll";

const ICONS = ["💰", "🏠", "✈️", "🚗", "💍", "🎓", "🏖️", "💻", "🛍️", "🎯"];
const COLORS = [
  { name: "blue", hex: "#4F7CFF" },
  { name: "green", hex: "#34C87A" },
  { name: "orange", hex: "#F5A623" },
  { name: "purple", hex: "#9B59B6" },
  { name: "pink", hex: "#E91E8C" },
  { name: "teal", hex: "#1ABC9C" },
];

function parseNum(val) { return parseInt(String(val).replace(/\D/g, ""), 10) || 0; }
function fmtNum(val) {
  const n = parseNum(val);
  return n > 0 ? n.toLocaleString("id-ID") : "";
}

export default function AddGoalModal({ onClose, onSave, goal = null }) {
  useLockBodyScroll();
  const isEdit = !!goal;

  const [form, setForm] = useState(() => {
    if (!goal) return { name: "", target_amount: 0, current_amount: 0, icon: "💰", color: "blue", deadline: "", description: "" };
    return {
      name: goal.name || "",
      target_amount: goal.target_amount || 0,
      current_amount: goal.current_amount || 0,
      icon: goal.icon || "💰",
      color: goal.color || "blue",
      deadline: goal.deadline || "",
      description: goal.description || "",
    };
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSave() {
    setError(null);
    if (!form.name?.trim()) {
      setError("Nama tujuan wajib diisi.");
      return;
    }
    if (!form.target_amount || form.target_amount <= 0) {
      setError("Target jumlah wajib diisi.");
      return;
    }
    if (form.current_amount < 0) {
      setError("Jumlah yang sudah ditabung tidak boleh negatif.");
      return;
    }
    if (form.current_amount > form.target_amount) {
      setError("Jumlah yang sudah ditabung tidak boleh melebihi target.");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        ...form,
        target_amount: form.target_amount,
        current_amount: form.current_amount,
      });
    } catch (err) {
      setError(err.message || "Gagal menyimpan tujuan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" className="bg-white my-6 p-6 rounded-3xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto overscroll-contain">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#1A1A1A]">{isEdit ? "Edit Tujuan" : "Tambah Tujuan"}</h2>
          <button onClick={onClose} className="text-[#9B9B9B] hover:text-[#1A1A1A] tap-highlight-fix"><X className="w-5 h-5" /></button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mb-4">
            <p className="text-xs font-semibold text-red-600">{error}</p>
          </div>
        )}

        {/* Icon picker */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-2 block">Ikon</label>
          <div className="flex flex-wrap gap-2">
            {ICONS.map((icon) => (
              <button
                key={icon}
                onClick={() => setForm({ ...form, icon })}
                className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all tap-highlight-fix ${
                  form.icon === icon ? "bg-[#FF6A00] scale-110" : "bg-[#F2F4F7] hover:bg-[#E2E8F0]"
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Color picker */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-2 block">Warna</label>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c.name}
                onClick={() => setForm({ ...form, color: c.name })}
                className={`w-7 h-7 rounded-full transition-all tap-highlight-fix ${form.color === c.name ? "ring-2 ring-offset-2 ring-[#FF6A00] scale-110" : ""}`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-3 mb-6">
          <div>
            <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">Nama Tujuan</label>
            <input
              type="text"
              placeholder="e.g. Liburan Bali, Dana Darurat"
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC] tap-highlight-fix"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">Target Jumlah (Rp)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8FA4C8] text-sm">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                className="w-full border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC] tap-highlight-fix"
                value={fmtNum(form.target_amount)}
                onChange={(e) => setForm({ ...form, target_amount: parseNum(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">Sudah Ditabung (Rp)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8FA4C8] text-sm">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0 (opsional)"
                className="w-full border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC] tap-highlight-fix"
                value={fmtNum(form.current_amount)}
                onChange={(e) => setForm({ ...form, current_amount: parseNum(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">Deadline (opsional)</label>
            <input
              type="date"
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC] tap-highlight-fix"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">Deskripsi (opsional)</label>
            <textarea
              rows={2}
              placeholder="Catatan tambahan..."
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC] resize-none tap-highlight-fix"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 rounded-xl border border-[#E2E8F0] text-[#8FA4C8] font-semibold text-sm hover:bg-[#F8FAFC] transition-colors tap-highlight-fix"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.name || !form.target_amount}
            className="flex-1 py-3.5 rounded-xl bg-[#FF6A00] text-white font-bold text-sm hover:bg-[#e05e00] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 tap-highlight-fix"
          >
            {saving ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Menyimpan...</>
            ) : (
              isEdit ? "Simpan Perubahan" : "Simpan Tujuan"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}