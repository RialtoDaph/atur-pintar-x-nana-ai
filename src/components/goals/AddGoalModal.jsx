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
{ name: "teal", hex: "#1ABC9C" }];


export default function AddGoalModal({ onClose, onSave, goal = null }) {
  const { t, settings } = useAppSettings();
  const [form, setForm] = useState(goal || {
    name: "",
    target_amount: "",
    current_amount: "",
    icon: "💰",
    color: "blue",
    deadline: "",
    description: ""
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  async function handleSave() {
    const newErrors = {};
    if (!form.name?.trim()) newErrors.name = t('goal_name_required') || "Nama tujuan wajib diisi";

    const targetAmount = parseRupiah(form.target_amount);
    if (!form.target_amount || targetAmount <= 0) {
      newErrors.target_amount = t('goal_amount_required') || "Target jumlah wajib diisi";
    }

    const currentAmount = parseRupiah(form.current_amount) || 0;
    if (currentAmount < 0) {
      newErrors.current_amount = t('goal_amount_positive') || "Jumlah yang sudah ditabung tidak boleh negatif";
    }

    if (currentAmount > targetAmount) {
      newErrors.current_amount = t('goal_amount_exceeds') || "Jumlah yang sudah ditabung tidak boleh melebihi target";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSaving(true);
    try {
      await onSave({
        ...form,
        target_amount: targetAmount,
        current_amount: currentAmount
      });
    } catch (error) {
      console.error("Save goal failed:", error);
      throw error;
    } finally {
      setSaving(false);
    }
  }

  function formatThousands(val) {
    const cleaned = val.replace(/[^0-9.,]/g, "");
    const numStr = cleaned.replace(new RegExp("\\" + settings.thousand_separator, "g"), "").replace(settings.decimal_separator, ".");
    const num = parseFloat(numStr) || 0;
    const intPart = Math.floor(num);
    const intStr = intPart.toString().split('').reverse();
    const grouped = [];
    for (let i = 0; i < intStr.length; i++) {
      if (i > 0 && i % 3 === 0) grouped.push(settings.thousand_separator);
      grouped.push(intStr[i]);
    }
    return grouped.reverse().join('');
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm p-4"
      onClick={(e) => {if (e.target === e.currentTarget) onClose();}}>
      
      <div className="bg-white my-8 p-6 rounded-3xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"

      role="dialog"
      aria-modal="true"
      aria-labelledby="goal-modal-title">
        
        <div className="flex items-center justify-between mb-6">
          <h2 id="goal-modal-title" className="text-lg font-bold text-[#1A1A1A]">
            {goal ? t('edit_goal') : t('add_goal')}
          </h2>
          <button
            onClick={onClose}
            aria-label="Tutup modal"
            className="text-[#9B9B9B] hover:text-[#1A1A1A] transition-colors rounded-lg p-1 focus:outline-none focus:ring-2 focus:ring-[#FF6A00]">
            
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Icon picker */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-2">{t('icon')}</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Pilih ikon tujuan">
            {ICONS.map((icon) =>
            <button
              key={icon}
              onClick={() => setForm({ ...form, icon })}
              aria-pressed={form.icon === icon}
              aria-label={`Ikon ${icon}`}
              className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-[#FF6A00] ${
              form.icon === icon ? "bg-[#FF6A00] scale-110" : "bg-[#F2F4F7] hover:bg-[#E2E8F0]"}`
              }>
              
                {icon}
              </button>
            )}
          </div>
        </div>

        {/* Color picker */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-2">{t('color')}</p>
          <div className="flex gap-2" role="group" aria-label="Pilih warna tujuan">
            {COLORS.map((c) =>
            <button
              key={c.name}
              onClick={() => setForm({ ...form, color: c.name })}
              aria-pressed={form.color === c.name}
              aria-label={`Warna ${c.name}`}
              className={`w-7 h-7 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6A00] ${form.color === c.name ? "ring-2 ring-offset-2 ring-[#FF6A00] scale-110" : ""}`}
              style={{ backgroundColor: c.hex }} />

            )}
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <div>
            <label htmlFor="goal-name" className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1 block">
              {t('goal_name')} <span className="text-red-400" aria-hidden="true">*</span>
            </label>
            <input
              id="goal-name"
              aria-required="true"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "goal-name-error" : undefined}
              className={`w-full border rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC] transition-colors ${errors.name ? "border-red-400" : "border-[#E2E8F0]"}`}
              placeholder={t('goal_name_placeholder')}
              value={form.name}
              onChange={(e) => {setForm({ ...form, name: e.target.value });setErrors((p) => ({ ...p, name: undefined }));}} />
            
            {errors.name &&
            <p id="goal-name-error" role="alert" className="text-xs text-red-400 mt-1">{errors.name}</p>
            }
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="goal-target" className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1 block">
                {t('target_amount')} <span className="text-red-400" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8FA4C8] font-medium text-sm" aria-hidden="true">{settings.currency_symbol}</span>
                <input
                  id="goal-target"
                  type="text"
                  inputMode="numeric"
                  aria-required="true"
                  aria-invalid={!!errors.target_amount}
                  aria-describedby={errors.target_amount ? "goal-target-error" : undefined}
                  className={`w-full border rounded-xl pl-10 pr-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC] transition-colors ${errors.target_amount ? "border-red-400" : "border-[#E2E8F0]"}`}
                  placeholder="0"
                  value={form.target_amount}
                  onChange={(e) => {
                    setForm({ ...form, target_amount: formatThousands(e.target.value) });
                    setErrors((p) => ({ ...p, target_amount: undefined }));
                  }} />
                
              </div>
              {errors.target_amount &&
              <p id="goal-target-error" role="alert" className="text-xs text-red-400 mt-1">{errors.target_amount}</p>
              }
            </div>
            <div>
              <label htmlFor="goal-current" className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1 block">{t('already_saved')}</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8FA4C8] font-medium text-sm" aria-hidden="true">{settings.currency_symbol}</span>
                <input
                  id="goal-current"
                  type="text"
                  inputMode="numeric"
                  className="w-full border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]"
                  placeholder="0"
                  value={form.current_amount}
                  onChange={(e) => setForm({ ...form, current_amount: formatThousands(e.target.value) })} />
                
              </div>
            </div>
          </div>
          <div>
            <label htmlFor="goal-deadline" className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1 block">{t('deadline_optional')}</label>
            <input
              id="goal-deadline"
              type="date"
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            
          </div>
          <div>
            <label htmlFor="goal-desc" className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1 block">{t('description_optional')}</label>
            <textarea
              id="goal-desc"
              rows={2}
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC] resize-none"
              placeholder={t('description_placeholder')}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
            
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          aria-busy={saving}
          className="mt-6 w-full bg-[#FF6A00] text-white py-3.5 rounded-xl font-semibold text-sm disabled:opacity-40 hover:bg-[#e05e00] transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF6A00] focus:ring-offset-2">
          
          {saving ? t('saving') : goal ? t('update_goal') : t('create_goal')}
        </button>
      </div>
    </div>);

}