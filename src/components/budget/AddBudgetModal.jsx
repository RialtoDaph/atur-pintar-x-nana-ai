import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAppSettings } from "@/components/utils/useAppSettings";

const DEFAULT_CATEGORIES = [
{ key: "housing", label_id: "Rumah/Sewa", label_en: "Housing/Rent", emoji: "🏠", color: "#4F7CFF" },
{ key: "food", label_id: "Makanan & Minuman", label_en: "Food & Drinks", emoji: "🍔", color: "#00C9A7" },
{ key: "transport", label_id: "Transportasi", label_en: "Transport", emoji: "🚗", color: "#F5A623" },
{ key: "health", label_id: "Kesehatan", label_en: "Health", emoji: "❤️", color: "#FF6B6B" },
{ key: "entertainment", label_id: "Hiburan", label_en: "Entertainment", emoji: "🎬", color: "#9B59B6" },
{ key: "shopping", label_id: "Belanja", label_en: "Shopping", emoji: "🛍️", color: "#E91E8C" },
{ key: "subscriptions", label_id: "Langganan", label_en: "Subscriptions", emoji: "📱", color: "#1ABC9C" },
{ key: "other", label_id: "Lainnya", label_en: "Other", emoji: "📦", color: "#95A5A6" }];


export default function AddBudgetModal({ onClose, onSave, existingCategories, editBudget, existingBudgets = [], month }) {
  const { t, settings, formatCurrency } = useAppSettings();
  const lang = settings.language || "id";

  const [category, setCategory] = useState(editBudget?.category || "");
  const [rawAmount, setRawAmount] = useState(editBudget?.amount ? String(editBudget.amount) : "");
  const [saving, setSaving] = useState(false);
  const [customCategories, setCustomCategories] = useState([]);
  const [error, setError] = useState(null);

  // Merge default + custom
  const allCategories = [
  ...DEFAULT_CATEGORIES.map((c) => ({
    key: c.key,
    label: lang === "id" ? c.label_id : c.label_en,
    emoji: c.emoji,
    color: c.color
  })),
  ...customCategories.map((c) => ({
    key: `custom_${c.id}`,
    label: c.name,
    emoji: c.emoji,
    color: c.color || "#95A5A6"
  }))];


  // Filter out already-budgeted categories (except the one being edited)
  const available = allCategories.filter(
    (c) => !existingCategories.includes(c.key) || c.key === editBudget?.category
  );

  const isEditing = !!editBudget;

  async function handleSave() {
    if (!category || !rawAmount) return;
    setError(null);

    // Check for duplicate budget (same category + month, excluding current edit)
    if (month) {
      const isDuplicate = existingBudgets.some(
        (b) => b.category === category && b.month === month && b.id !== editBudget?.id
      );
      if (isDuplicate) {
        setError(`Budget untuk kategori ini di bulan ${month} sudah ada.`);
        return;
      }
    }

    setSaving(true);
    try {
      await onSave({ category, amount: parseFloat(rawAmount.replace(/\./g, "").replace(",", ".")) });
    } catch (err) {
      setError(err.message || "Gagal menyimpan budget.");
    } finally {
      setSaving(false);
    }
  }

  // Format rupiah on-the-fly while typing (integer only)
  function handleAmountChange(e) {
    const raw = e.target.value.replace(/\D/g, "");
    setRawAmount(raw);
  }

  const displayAmount = rawAmount ?
  Number(rawAmount).toLocaleString("id-ID") :
  "";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white my-20 p-6 rounded-3xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#1A1A1A]">
            {isEditing ? t("budget_edit_title") : t("budget_add_title")}
          </h2>
          <button onClick={onClose} className="text-[#9B9B9B] hover:text-[#1A1A1A]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mb-4">
            <p className="text-xs font-semibold text-red-600">{error}</p>
          </div>
        )}

        {/* Category picker */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-2 block">
            {t("category")}
          </label>
          {available.length === 0 ?
          <p className="text-sm text-[#8FA4C8] text-center py-4">{t("budget_all_set")}</p> :

          <div className="grid grid-cols-4 gap-2 max-h-56 overflow-y-auto">
              {available.map((c) =>
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
              category === c.key ?
              "border-[#FF6A00] bg-[#FF6A00]/10" :
              "border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#CBD5E0]"}`
              }>
              
                  <span className="text-xl">{c.emoji}</span>
                  <span className="text-[10px] font-medium text-[#4A5568] text-center leading-tight">{c.label}</span>
                </button>
            )}
            </div>
          }
        </div>

        {/* Amount input */}
        <div className="mb-6">
          <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">
            {t("budget_limit_label")}
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8FA4C8] font-medium">Rp</span>
            <input
              type="text"
              inputMode="numeric"
              className="w-full border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-3.5 text-xl font-bold text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]"
              placeholder="0"
              value={displayAmount}
              onChange={handleAmountChange} />
            
          </div>
        </div>


      </div>
    </div>);

}