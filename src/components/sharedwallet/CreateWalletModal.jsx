import { useState } from "react";
import { X, Check, Loader2 } from "lucide-react";

const ICONS = ["👨‍👩‍👧", "💑", "👫", "🏠", "💍", "👨‍👩‍👧‍👦", "🤝", "❤️"];

export default function CreateWalletModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: "", description: "", icon: "👨‍👩‍👧", inviteEmail: "" });
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!form.name.trim()) return;
    setSaving(true);
    await onCreate(form);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#F2F4F7]">
          <p className="font-bold text-[#1A1A1A]">Buat Dompet Bersama</p>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[#F2F4F7]"><X className="w-5 h-5 text-[#8FA4C8]" /></button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div className="flex gap-2 flex-wrap">
            {ICONS.map((ic) => (
              <button key={ic} onClick={() => setForm((f) => ({ ...f, icon: ic }))}
                className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center ${form.icon === ic ? "ring-2 ring-[#F97316] bg-[#F97316]/10" : "bg-[#F2F4F7]"}`}>
                {ic}
              </button>
            ))}
          </div>
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Nama dompet (e.g., Keuangan Keluarga)"
            className="w-full px-4 py-3 bg-[#F2F4F7] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#F97316]/30" />
          <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Deskripsi (opsional)"
            className="w-full px-4 py-3 bg-[#F2F4F7] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#F97316]/30" />
          <input value={form.inviteEmail} onChange={(e) => setForm((f) => ({ ...f, inviteEmail: e.target.value }))}
            placeholder="Undang via email (opsional)" type="email"
            className="w-full px-4 py-3 bg-[#F2F4F7] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#F97316]/30" />
        </div>
        <div className="px-5 pb-6" style={{ paddingBottom: 'calc(1.5rem + max(0px, env(safe-area-inset-bottom)))' }}>
          <button onClick={handleCreate} disabled={saving || !form.name.trim()}
            className="w-full py-3.5 bg-[#F97316] text-white rounded-2xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Buat Dompet Bersama
          </button>
        </div>
      </div>
    </div>
  );
}