import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Plus, Trash2, Pencil } from "lucide-react";
import { useAppSettings } from "@/components/utils/useAppSettings";
import { toast } from "sonner";

const DEFAULT_CATEGORIES = {
  housing: { emoji: "🏠", key: "cat_housing", color: "#4F7CFF" },
  food: { emoji: "🍔", key: "cat_food", color: "#00C9A7" },
  transport: { emoji: "🚗", key: "cat_transport", color: "#F5A623" },
  health: { emoji: "❤️", key: "cat_health", color: "#FF6B6B" },
  entertainment: { emoji: "🎬", key: "cat_entertainment", color: "#9B59B6" },
  shopping: { emoji: "🛍️", key: "cat_shopping", color: "#E91E8C" },
  subscriptions: { emoji: "📱", key: "cat_subscriptions", color: "#1ABC9C" },
  salary: { emoji: "💼", key: "cat_salary", color: "#27AE60" },
  freelance: { emoji: "💻", key: "cat_freelance", color: "#2ECC71" },
  savings: { emoji: "💰", key: "cat_savings", color: "#3498DB" },
  other: { emoji: "📦", key: "cat_other", color: "#95A5A6" },
};

export default function RecurringTransactionManager({ onClose, onRefresh }) {
  const { t, formatCurrency, settings } = useAppSettings();
  const [recurring, setRecurring] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    amount: "",
    category: "",
    note: "",
    type: "expense",
    recurring_interval: "monthly",
  });
  const [saving, setSaving] = useState(false);
  const [customCategories, setCustomCategories] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [txs, cats] = await Promise.all([
        base44.entities.Transaction.filter({ is_recurring: true }, "-created_date"),
        base44.entities.CustomCategory.list("-created_date").catch(() => []),
      ]);
      setRecurring(txs);
      setCustomCategories(cats);
    } catch (error) {
      console.error("Failed to load recurring transactions:", error);
      toast.error(t('error_loading_data'));
    } finally {
      setLoading(false);
    }
  }

  const getCategoryConfig = (key) => {
    if (key && key.startsWith('custom_')) {
      const customId = key.substring(7);
      const cat = customCategories.find(c => c.id === customId);
      if (cat) return { emoji: cat.emoji, label: cat.name, color: cat.color || "#888" };
    }
    const defaultCat = DEFAULT_CATEGORIES[key] || DEFAULT_CATEGORIES.other;
    return { ...defaultCat, label: t(defaultCat.key) };
  };

  async function handleSave() {
    if (!form.amount || !form.category) return;
    setSaving(true);
    try {
      const data = {
        type: form.type,
        amount: parseInt(form.amount.replace(/[^0-9]/g, '')) || 0,
        category: form.category,
        note: form.note,
        is_recurring: true,
        recurring_interval: form.recurring_interval,
        date: new Date().toISOString().split("T")[0],
        recurring_last_generated: new Date().toISOString().split("T")[0],
      };

      if (editingId) {
        await base44.entities.Transaction.update(editingId, data);
        toast.success(t('tx_update_success'));
      } else {
        await base44.entities.Transaction.create(data);
        toast.success(t('tx_create_success'));
      }

      setForm({
        amount: "",
        category: "",
        note: "",
        type: "expense",
        recurring_interval: "monthly",
      });
      setEditingId(null);
      setShowForm(false);
      loadData();
      onRefresh?.();
    } catch (error) {
      console.error("Save failed:", error);
      toast.error(editingId ? t('tx_update_error') : t('tx_create_error'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm(t('tx_confirm_delete'))) return;
    try {
      await base44.entities.Transaction.delete(id);
      toast.success(t('tx_delete_success'));
      loadData();
      onRefresh?.();
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error(t('tx_delete_error'));
    }
  }

  function handleEdit(tx) {
    setForm({
      amount: String(tx.amount),
      category: tx.category,
      note: tx.note || "",
      type: tx.type,
      recurring_interval: tx.recurring_interval || "monthly",
    });
    setEditingId(tx.id);
    setShowForm(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#1A1A1A]">{t('recurring_transactions') || 'Transaksi Berulang'}</h2>
          <button onClick={onClose} className="text-[#9B9B9B] hover:text-[#1A1A1A]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!showForm ? (
          <>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-[#F2F4F7] rounded-xl animate-pulse" />)}
              </div>
            ) : recurring.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-[#8FA4C8] text-sm mb-3">Belum ada transaksi berulang</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 rounded-xl bg-[#FF6A00] text-white text-sm font-semibold hover:bg-[#e05e00]"
                >
                  + Tambah Transaksi Berulang
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {recurring.map(tx => {
                    const cat = getCategoryConfig(tx.category);
                    const isIncome = tx.type === "income";
                    return (
                      <div key={tx.id} className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-xl hover:bg-[#F2F4F7] transition-colors group">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                          style={{ backgroundColor: cat.color + "18" }}
                        >
                          {cat.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1A1A1A] truncate">{tx.note || cat.label}</p>
                          <p className="text-xs text-[#8FA4C8]">
                            {t(tx.recurring_interval) || tx.recurring_interval}
                          </p>
                        </div>
                        <span className="text-sm font-bold" style={{ color: isIncome ? "#00C9A7" : "#FF6B6B" }}>
                          {isIncome ? "+" : "−"}{formatCurrency(tx.amount)}
                        </span>
                        <button
                          onClick={() => handleEdit(tx)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-[#CBD5E0] hover:text-[#4F7CFF]"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-[#CBD5E0] hover:text-[#FF6B6B]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full py-2.5 rounded-xl border border-[#E2E8F0] text-[#FF6A00] text-sm font-semibold hover:bg-[#FF6A00]/5"
                >
                  + Tambah Transaksi Berulang
                </button>
              </>
            )}
          </>
        ) : (
          <>
            {/* Form untuk add/edit */}
            <div className="space-y-4 mb-4">
              {/* Type */}
              <div>
                <label className="text-xs font-semibold text-[#8FA4C8] uppercase mb-2 block">Tipe</label>
                <div className="flex gap-2">
                  {["expense", "income"].map(type => (
                    <button
                      key={type}
                      onClick={() => setForm({ ...form, type })}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                        form.type === type
                          ? type === "expense"
                            ? "bg-[#FF6B6B] text-white"
                            : "bg-[#00C9A7] text-white"
                          : "border border-[#E2E8F0] text-[#8FA4C8] hover:border-[#CBD5E0]"
                      }`}
                    >
                      {type === "expense" ? t('expense') : t('income')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="text-xs font-semibold text-[#8FA4C8] uppercase mb-1.5 block">Jumlah</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8FA4C8]">{settings.currency_symbol}</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="w-full border border-[#E2E8F0] rounded-xl pl-8 pr-4 py-3 text-lg font-bold text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]"
                    placeholder="0"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value.replace(/[^0-9]/g, '') })}
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-semibold text-[#8FA4C8] uppercase mb-2 block">Kategori</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]"
                >
                  <option value="">Pilih kategori</option>
                  {Object.entries(DEFAULT_CATEGORIES).map(([key, cat]) => (
                    <option key={key} value={key}>
                      {cat.emoji} {t(cat.key)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Interval */}
              <div>
                <label className="text-xs font-semibold text-[#8FA4C8] uppercase mb-2 block">Frekuensi</label>
                <div className="grid grid-cols-2 gap-2">
                  {["daily", "weekly", "monthly", "yearly"].map(interval => (
                    <button
                      key={interval}
                      onClick={() => setForm({ ...form, recurring_interval: interval })}
                      className={`py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                        form.recurring_interval === interval
                          ? "bg-[#0A0A0A] text-white"
                          : "border border-[#E2E8F0] text-[#8FA4C8] hover:border-[#CBD5E0]"
                      }`}
                    >
                      {t(interval) || interval}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="text-xs font-semibold text-[#8FA4C8] uppercase mb-1.5 block">Keterangan (opsional)</label>
                <input
                  type="text"
                  className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]"
                  placeholder="Nama transaksi..."
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setForm({
                    amount: "",
                    category: "",
                    note: "",
                    type: "expense",
                    recurring_interval: "monthly",
                  });
                }}
                className="flex-1 py-2.5 rounded-xl border border-[#E2E8F0] text-[#1A1A1A] text-sm font-semibold hover:bg-[#F8FAFC]"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.amount || !form.category}
                className="flex-1 py-2.5 rounded-xl bg-[#FF6A00] text-white text-sm font-semibold hover:bg-[#e05e00] disabled:opacity-40"
              >
                {saving ? t('saving') : editingId ? t('update') : t('add')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}