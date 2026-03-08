import { useState } from "react";
import { X } from "lucide-react";
import { useAppSettings } from "@/components/utils/useAppSettings";
import { parseRupiah } from "@/components/utils/parseRupiah";

const ICONS = ["💰", "🏠", "✈️", "🚗", "💍", "🎓", "🏖️", "💻", "🛍️", "🎯"];
const COLORS = [
  { name: "blue", hex: "#4F7CFF" },
  { name: "green", hex: "#34C87A" },
  { name: "orange", hex: "#F5A623" },
  { name: "purple", hex: "#9B59B6" },
  { name: "pink", hex: "#E91E8C" },
  { name: "teal", hex: "#1ABC9C" },
];

export default function AddGoalModal({ onClose, onSave, goal = null }) {
  const { t, formatCurrency, settings } = useAppSettings();
  const [form, setForm] = useState(goal || {
    name: "",
    target_amount: "",
    current_amount: "",
    icon: "💰",
    color: "blue",
    deadline: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);

  const [errors, setErrors] = useState({});

  async function handleSave() {
    const newErrors = {};
    if (!form.name?.trim()) newErrors.name = "Nama tujuan wajib diisi";
    if (!form.target_amount || parseRupiah(form.target_amount) <= 0) newErrors.target_amount = "Target jumlah wajib diisi";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setSaving(true);
    await onSave({
      ...form,
      target_amount: parseRupiah(form.target_amount),
      current_amount: parseRupiah(form.current_amount) || 0,
    });
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-[#1A1A1A]">{goal ? t('edit_goal') : t('add_goal')}</h2>
          <button onClick={onClose} className="text-[#9B9B9B] hover:text-[#1A1A1A] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Icon picker */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-2">{t('icon')}</p>
          <div className="flex flex-wrap gap-2">
            {ICONS.map((icon) => (
              <button
                key={icon}
                onClick={() => setForm({ ...form, icon })}
                className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                  form.icon === icon ? "bg-[#FF6A00] scale-110" : "bg-[#F2F4F7] hover:bg-[#E2E8F0]"
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Color picker */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-2">{t('color')}</p>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c.name}
                onClick={() => setForm({ ...form, color: c.name })}
                className={`w-7 h-7 rounded-full transition-all ${form.color === c.name ? "ring-2 ring-offset-2 ring-[#FF6A00] scale-110" : ""}`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1 block">{t('goal_name')}</label>
            <input
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]"
              placeholder={t('goal_name_placeholder')}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1 block">{t('target_amount')}</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8FA4C8] font-medium text-sm">{settings.currency_symbol}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  className="w-full border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]"
                  placeholder="0"
                  value={form.target_amount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.,]/g, "");
                    const numStr = val.replace(new RegExp("\\" + settings.thousand_separator, "g"), "").replace(settings.decimal_separator, ".");
                    const num = parseFloat(numStr) || 0;
                    const intPart = Math.floor(num);
                    const intStr = intPart.toString().split('').reverse();
                    const grouped = [];
                    for (let i = 0; i < intStr.length; i++) {
                      if (i > 0 && i % 3 === 0) grouped.push(settings.thousand_separator);
                      grouped.push(intStr[i]);
                    }
                    const formatted = grouped.reverse().join('');
                    setForm({ ...form, target_amount: formatted });
                  }}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1 block">{t('already_saved')}</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8FA4C8] font-medium text-sm">{settings.currency_symbol}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  className="w-full border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]"
                  placeholder="0"
                  value={form.current_amount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.,]/g, "");
                    const numStr = val.replace(new RegExp("\\" + settings.thousand_separator, "g"), "").replace(settings.decimal_separator, ".");
                    const num = parseFloat(numStr) || 0;
                    const intPart = Math.floor(num);
                    const intStr = intPart.toString().split('').reverse();
                    const grouped = [];
                    for (let i = 0; i < intStr.length; i++) {
                      if (i > 0 && i % 3 === 0) grouped.push(settings.thousand_separator);
                      grouped.push(intStr[i]);
                    }
                    const formatted = grouped.reverse().join('');
                    setForm({ ...form, current_amount: formatted });
                  }}
                />
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1 block">{t('deadline_optional')}</label>
            <input
              type="date"
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1 block">{t('description_optional')}</label>
            <textarea
              rows={2}
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC] resize-none"
              placeholder={t('description_placeholder')}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !form.name || !form.target_amount}
          className="mt-6 w-full bg-[#FF6A00] text-white py-3.5 rounded-xl font-semibold text-sm disabled:opacity-40 hover:bg-[#e05e00] transition-colors"
        >
          {saving ? t('saving') : goal ? t('update_goal') : t('create_goal')}
        </button>
      </div>
    </div>
  );
}