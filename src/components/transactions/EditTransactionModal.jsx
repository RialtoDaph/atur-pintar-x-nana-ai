import { useState, useEffect } from "react";
import { X, Settings2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { parseRupiah } from "@/components/utils/parseRupiah";
import { useAppSettings } from "@/components/utils/useAppSettings";
import ManageCategoriesModal from "./ManageCategoriesModal";

const DEFAULT_CATEGORIES = {
  expense: [
    { key: "housing", i18nKey: "cat_housing", emoji: "🏠", color: "#4F7CFF" },
    { key: "food", i18nKey: "cat_food", emoji: "🍔", color: "#00C9A7" },
    { key: "transport", i18nKey: "cat_transport", emoji: "🚗", color: "#F5A623" },
    { key: "health", i18nKey: "cat_health", emoji: "❤️", color: "#FF6B6B" },
    { key: "entertainment", i18nKey: "cat_entertainment", emoji: "🎬", color: "#9B59B6" },
    { key: "shopping", i18nKey: "cat_shopping", emoji: "🛍️", color: "#E91E8C" },
    { key: "subscriptions", i18nKey: "cat_subscriptions", emoji: "📱", color: "#1ABC9C" },
    { key: "other", i18nKey: "cat_other", emoji: "📦", color: "#95A5A6" },
  ],
  income: [
    { key: "salary", i18nKey: "cat_salary", emoji: "💼", color: "#27AE60" },
    { key: "freelance", i18nKey: "cat_freelance", emoji: "💻", color: "#2ECC71" },
    { key: "other", i18nKey: "cat_other", emoji: "📦", color: "#95A5A6" },
  ],
};

export default function EditTransactionModal({ transaction, goals = [], onClose, onSave }) {
  const { t, settings } = useAppSettings();
  const [tab, setTab] = useState(transaction.type === "income" ? "income" : "expense");
  const [form, setForm] = useState({
    amount: String(transaction.amount || ""),
    category: transaction.category || "",
    note: transaction.note || "",
    date: transaction.date || new Date().toISOString().split("T")[0],
    goal_id: transaction.goal_id || "",
  });
  const [saving, setSaving] = useState(false);
  const [customCats, setCustomCats] = useState([]);
  const [showManage, setShowManage] = useState(false);

  useEffect(() => {
    base44.entities.CustomCategory.list("-created_date").then(setCustomCats);
  }, []);

  async function handleSave() {
    if (!form.amount || !form.category) return;
    setSaving(true);
    await onSave(transaction.id, {
      ...form,
      type: tab,
      amount: parseRupiah(form.amount),
      goal_id: form.goal_id || undefined,
    });
    setSaving(false);
  }

  const defaultCats = DEFAULT_CATEGORIES[tab] || [];
  const filteredCustom = customCats.filter(c => c.type === tab || c.type === "both");
  const allCats = [
    ...defaultCats.map(c => ({ ...c, label: t(c.i18nKey) })),
    ...filteredCustom.map(c => ({ key: `custom_${c.id}`, label: c.name, emoji: c.emoji, color: c.color || "#888" })),
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-lg font-bold text-[#1A1A1A]">{t('edit_transaction')}</h2>
             <div className="flex items-center gap-2">
               <button onClick={() => setShowManage(true)} className="text-[#9B9B9B] hover:text-[#1A1A1A]" title={t('manage_categories')}>
                 <Settings2 className="w-4 h-4" />
               </button>
               <button onClick={onClose} className="text-[#9B9B9B] hover:text-[#1A1A1A]">
                 <X className="w-5 h-5" />
               </button>
             </div>
           </div>

          {/* Type tabs */}
          <div className="flex bg-[#F2F4F7] rounded-xl p-1 mb-4">
            {["expense", "income"].map((tabKey) => (
              <button key={tabKey} onClick={() => { setTab(tabKey); setForm(f => ({ ...f, category: "" })); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  tab === tabKey
                    ? tabKey === "expense" ? "bg-[#FF6B6B] text-white shadow-sm" : "bg-[#00C9A7] text-white shadow-sm"
                    : "text-[#8FA4C8]"
                }`}>
                {tabKey === "expense" ? t('expense') : t('income')}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div className="mb-4">
            <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">{t('amount')}</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8FA4C8] font-medium text-lg">{settings.currency_symbol}</span>
              <input
                autoFocus type="text" inputMode="numeric"
                className="w-full border border-[#E2E8F0] rounded-xl pl-9 pr-4 py-3 text-2xl font-bold text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]"
                placeholder="0"
                value={form.amount}
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
                  setForm({ ...form, amount: grouped.reverse().join('') });
                }}
              />
            </div>
          </div>

          {/* Category */}
          <div className="mb-4">
            <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-2 block">{t('category')}</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {allCats.map((c) => (
                <button key={c.key} onClick={() => setForm({ ...form, category: c.key })}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                    form.category === c.key ? "border-[#FF6A00] bg-[#FF6A00]/10" : "border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#CBD5E0]"
                  }`}>
                  <span className="text-lg sm:text-xl">{c.emoji}</span>
                  <span className="text-[9px] sm:text-[10px] font-medium text-[#4A5568] text-center leading-tight">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Note & Date & Goal */}
          <div className="space-y-3 mb-5">
            <div>
              <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">{t('note_optional')}</label>
              <input
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]"
                placeholder={t('note_placeholder')}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">{t('date')}</label>
              <input type="date"
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            {goals && goals.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">{t('link_to_goal')}</label>
                <select
                  value={form.goal_id || ""}
                  onChange={(e) => setForm({ ...form, goal_id: e.target.value })}
                  className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]"
                >
                  <option value="">{t('no_goal')}</option>
                  {goals.map(goal => (
                    <option key={goal.id} value={goal.id}>{goal.icon} {goal.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <button onClick={handleSave} disabled={saving || !form.amount || !form.category}
            className="w-full py-3 rounded-xl font-bold text-sm text-white disabled:opacity-40 transition-colors"
            style={{ backgroundColor: tab === "expense" ? "#FF6B6B" : "#00C9A7" }}>
            {saving ? t('saving') : t('save_changes')}
          </button>
        </div>
      </div>

      {showManage && (
        <ManageCategoriesModal
          onClose={() => setShowManage(false)}
          onUpdated={() => base44.entities.CustomCategory.list("-created_date").then(setCustomCats)}
        />
      )}
    </>
  );
}