import { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAppSettings } from "@/components/utils/useAppSettings";

const PALETTE = ["#FF6A00","#4F7CFF","#00C9A7","#FF6B6B","#9B59B6","#E91E8C","#F5A623","#1ABC9C","#27AE60","#3498DB","#E67E22","#2C3E50"];
const EMOJIS = ["📦","🏠","🍔","🚗","❤️","🎬","🛍️","📱","💼","💻","✈️","🎓","🐾","🧴","🎁","⚡","🍕","☕","🏋️","🎮"];

const DEFAULT_CATEGORIES = [
  { key: "housing", label: "🏠 Rumah" },
  { key: "food", label: "🍔 Makanan" },
  { key: "transport", label: "🚗 Transport" },
  { key: "health", label: "❤️ Kesehatan" },
  { key: "entertainment", label: "🎬 Hiburan" },
  { key: "shopping", label: "🛍️ Belanja" },
  { key: "subscriptions", label: "📱 Langganan" },
  { key: "other", label: "📦 Lainnya" },
  { key: "salary", label: "💼 Gaji" },
  { key: "freelance", label: "💻 Freelance" },
];

export default function ManageCategoriesModal({ onClose, onUpdated }) {
  const { t } = useAppSettings();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: "", emoji: "📦", color: "#FF6A00", type: "expense", parent_category_key: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const cats = await base44.entities.CustomCategory.list("-created_date");
    setCategories(cats);
    setLoading(false);
  }

  async function handleAdd() {
    if (!form.name.trim()) return;
    setSaving(true);
    const data = { ...form };
    if (!data.parent_category_key) delete data.parent_category_key;
    await base44.entities.CustomCategory.create(data);
    setForm({ name: "", emoji: "📦", color: "#FF6A00", type: "expense", parent_category_key: "" });
    await load();
    onUpdated();
    setSaving(false);
  }

  async function handleDelete(id) {
    await base44.entities.CustomCategory.delete(id);
    await load();
    onUpdated();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#1A1A1A]">{t('manage_categories')}</h2>
          <button onClick={onClose} className="text-[#9B9B9B] hover:text-[#1A1A1A] tap-highlight-fix">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add new */}
        <div className="bg-[#F8FAFC] rounded-2xl p-4 mb-5">
          <p className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-3">{t('new_category')}</p>

          {/* Emoji picker */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {EMOJIS.map(e => (
              <button key={e} onClick={() => setForm(f => ({ ...f, emoji: e }))}
                className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all ${form.emoji === e ? "bg-[#0A0A0A] scale-110" : "bg-white hover:bg-[#EFEFED]"}`}>
                {e}
              </button>
            ))}
          </div>

          {/* Color picker */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {PALETTE.map(c => (
              <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                className={`w-6 h-6 rounded-full transition-all ${form.color === c ? "ring-2 ring-offset-1 ring-[#0A0A0A] scale-110" : ""}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>

          <div className="flex gap-2 mb-3">
            <input
              placeholder={t('category_name')}
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="flex-1 border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-white tap-highlight-fix"
            />
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-white tap-highlight-fix"
            >
              <option value="expense">{t('expense')}</option>
              <option value="income">{t('income')}</option>
              <option value="both">{t('both')}</option>
            </select>
          </div>

          {/* Parent category picker */}
          <div className="mb-3">
            <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">{t('sub_category_optional')}</label>
            <select
              value={form.parent_category_key}
              onChange={e => setForm(f => ({ ...f, parent_category_key: e.target.value }))}
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-white tap-highlight-fix"
            >
              <option value="">— {t('main_category')} —</option>
              <optgroup label={t('default_categories')}>
                {DEFAULT_CATEGORIES.map(c => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </optgroup>
              {categories.filter(c => !c.parent_category_key).length > 0 && (
                <optgroup label={t('custom_categories')}>
                  {categories.filter(c => !c.parent_category_key).map(c => (
                    <option key={c.id} value={`custom_${c.id}`}>{c.emoji} {c.name}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <button onClick={handleAdd} disabled={saving || !form.name.trim()}
            className="w-full py-3 rounded-xl bg-[#0A0A0A] text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 hover:bg-[#333] transition-colors tap-highlight-fix">
            <Plus className="w-4 h-4" /> {t('add_category')}
          </button>
        </div>

        {/* Existing custom categories */}
        {loading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-[#F7F6F3] rounded-xl animate-pulse" />)}</div>
        ) : categories.length === 0 ? (
          <p className="text-center text-sm text-[#8FA4C8] py-4">{t('no_custom_categories')}</p>
        ) : (
          <div className="space-y-2">
            {/* Top-level categories first */}
            {categories.filter(c => !c.parent_category_key).map(cat => (
              <div key={cat.id}>
                <div className="flex items-center justify-between bg-[#F8FAFC] rounded-xl px-4 py-3 border border-[#E2E8F0]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-base" style={{ backgroundColor: (cat.color || "#888") + "22" }}>
                      {cat.emoji}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1A1A1A]">{cat.name}</p>
                      <p className="text-[10px] text-[#8FA4C8] capitalize">{cat.type}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(cat.id)} className="text-[#8FA4C8] hover:text-red-500 transition-colors tap-highlight-fix">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {/* Sub-categories under this parent */}
                {categories.filter(c => c.parent_category_key === `custom_${cat.id}`).map(sub => (
                  <div key={sub.id} className="flex items-center justify-between bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 ml-6 mt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[#CBD5E0] text-xs">↳</span>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: (sub.color || "#888") + "22" }}>
                        {sub.emoji}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#1A1A1A]">{sub.name}</p>
                        <p className="text-[9px] text-[#8FA4C8] capitalize">{sub.type}</p>
                      </div>
                    </div>
                    <button onClick={() => handleDelete(sub.id)} className="text-[#8FA4C8] hover:text-red-500 transition-colors tap-highlight-fix">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ))}
            {/* Sub-categories under default parents */}
            {categories.filter(c => c.parent_category_key && !c.parent_category_key.startsWith("custom_")).map(cat => (
              <div key={cat.id} className="flex items-center justify-between bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 ml-6">
                <div className="flex items-center gap-2">
                  <span className="text-[#CBD5E0] text-xs">↳</span>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: (cat.color || "#888") + "22" }}>
                    {cat.emoji}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#1A1A1A]">{cat.name}</p>
                    <p className="text-[9px] text-[#8FA4C8] capitalize">Sub dari: {cat.parent_category_key} · {cat.type}</p>
                  </div>
                </div>
                <button onClick={() => handleDelete(cat.id)} className="text-[#8FA4C8] hover:text-red-500 transition-colors tap-highlight-fix">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}