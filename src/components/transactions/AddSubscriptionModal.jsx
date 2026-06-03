import { useState } from "react";
import { X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import useLockBodyScroll from "@/hooks/useLockBodyScroll";

const ICONS = ["💳", "🎬", "🎵", "📺", "📰", "☁️", "🎮", "📱", "🛒", "🏋️", "📚", "⭐"];
const CYCLES = [
  { key: "monthly", label: "Bulanan" },
  { key: "quarterly", label: "Triwulan" },
  { key: "yearly", label: "Tahunan" },
];

export default function AddSubscriptionModal({ onClose, onSaved }) {
  useLockBodyScroll();
  const [form, setForm] = useState({
    name: "",
    amount: "",
    icon: "💳",
    billing_cycle: "monthly",
    next_due_date: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      return d.toISOString().split("T")[0];
    })(),
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form.name.trim()) { toast.error("Nama langganan wajib diisi"); return; }
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) { toast.error("Nominal harus lebih dari 0"); return; }
    setSaving(true);
    try {
      await base44.entities.Subscription.create({
        name: form.name.trim(),
        amount: amt,
        icon: form.icon,
        billing_cycle: form.billing_cycle,
        next_due_date: form.next_due_date,
        status: "active",
      });
      toast.success("Langganan ditambahkan");
      onSaved?.();
      onClose();
    } catch (e) {
      toast.error("Gagal menyimpan langganan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 max-h-[85vh] overflow-y-auto overscroll-contain"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#1A1A1A]">Tambah Langganan</h2>
          <button onClick={onClose} className="text-[#9B9B9B] hover:text-[#1A1A1A]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Icon picker */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-2 block">Ikon</label>
          <div className="flex flex-wrap gap-2">
            {ICONS.map(ic => (
              <button
                key={ic}
                onClick={() => setForm(f => ({ ...f, icon: ic }))}
                className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center border transition-all ${
                  form.icon === ic ? "border-[#F97316] bg-[#F97316]/10" : "border-[#E2E8F0]"
                }`}
              >
                {ic}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">Nama Langganan</label>
          <input
            className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-[#F8FAFC]"
            placeholder="e.g. Netflix, Spotify..."
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />
        </div>

        {/* Amount */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">Nominal</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8FA4C8] font-medium text-sm">Rp</span>
            <input
              type="text"
              inputMode="numeric"
              className="w-full border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-3 text-lg font-bold text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-[#F8FAFC]"
              placeholder="0"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value.replace(/[^0-9]/g, "") }))}
            />
          </div>
        </div>

        {/* Billing cycle */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-2 block">Siklus</label>
          <div className="grid grid-cols-3 gap-2">
            {CYCLES.map(c => (
              <button
                key={c.key}
                onClick={() => setForm(f => ({ ...f, billing_cycle: c.key }))}
                className={`py-2.5 rounded-xl text-xs font-semibold border transition-all tap-highlight-fix ${
                  form.billing_cycle === c.key
                    ? "border-[#F97316] bg-[#F97316]/10 text-[#F97316]"
                    : "border-[#E2E8F0] bg-[#F8FAFC] text-[#1A1A1A]"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Next due date */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">Jatuh Tempo Berikutnya</label>
          <input
            type="date"
            min={new Date().toISOString().split("T")[0]}
            className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-[#F8FAFC]"
            value={form.next_due_date}
            onChange={e => setForm(f => ({ ...f, next_due_date: e.target.value }))}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !form.name.trim() || !form.amount}
          className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-[#F97316] hover:bg-[#ea6a0e] disabled:opacity-40 transition-colors tap-highlight-fix"
        >
          {saving ? "Menyimpan..." : "Tambah Langganan"}
        </button>
      </div>
    </div>
  );
}