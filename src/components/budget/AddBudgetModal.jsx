import { useState, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAppSettings } from "@/components/utils/useAppSettings";
import useLockBodyScroll from "@/hooks/useLockBodyScroll";

export default function AddBudgetModal({ onClose, onSave, existingCategories, editBudget, existingBudgets = [], month }) {
  useLockBodyScroll();
  const { t, formatCurrency } = useAppSettings();

  const [category, setCategory] = useState(editBudget?.category || "");
  const [rawAmount, setRawAmount] = useState(editBudget?.amount ? String(editBudget.amount) : "");
  const [saving, setSaving] = useState(false);
  const [globalCategories, setGlobalCategories] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [error, setError] = useState(null);
  const [openParent, setOpenParent] = useState(null);
  const [loadingCats, setLoadingCats] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      base44.entities.GlobalCategory.filter({ is_active: true }, "sort_order").catch(() => []),
      base44.entities.CustomCategory.list().catch(() => []),
    ]).then(([globals, customs]) => {
      if (cancelled) return;
      setGlobalCategories((globals || []).filter(c => c.type === 'expense' || c.type === 'both'));
      setCustomCategories((customs || []).filter(c => c.type === 'expense' || c.type === 'both' || !c.type));
      setLoadingCats(false);
    });
    return () => { cancelled = true; };
  }, []);

  // Parents = is_subcategory false, sorted by sort_order
  const parents = globalCategories.filter(c => !c.is_subcategory).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  // Subs = is_subcategory true
  const subs = globalCategories.filter(c => c.is_subcategory === true).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  // Custom categories as extra group
  const customCats = customCategories.map(c => ({ key: `custom_${c.id}`, label: c.name, emoji: c.emoji || '📦', color: c.color || '#95A5A6' }));

  // Check if a category key is already budgeted (exclude current edit)
  function isTaken(key) {
    return existingCategories.includes(key) && key !== editBudget?.category;
  }

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
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[90] bg-black/40 sm:backdrop-blur-sm" onClick={onClose} />
      {/* Floating popup — same pattern as AddTransactionModal */}
      <div
        className="fixed z-[100] pointer-events-none flex justify-center sm:inset-0 sm:items-center"
        style={{
          left: 0,
          right: 0,
          bottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
          top: '64px'
        }}>
        <div role="dialog" aria-modal="true" className="bg-white p-6 rounded-3xl shadow-2xl overflow-y-auto overscroll-contain pointer-events-auto animate-slide-up-sheet w-[calc(100%-24px)] sm:w-full sm:max-w-md" style={{ maxHeight: '100%', paddingBottom: 'calc(1.5rem + max(16px, env(safe-area-inset-bottom)))' }} onClick={e => e.stopPropagation()}>
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
          <div className="max-h-56 overflow-y-auto space-y-1 pr-0.5">
            {(() => {
              if (loadingCats) {
                return <p className="text-sm text-[#8FA4C8] text-center py-4">Memuat kategori…</p>;
              }
              const availableParents = parents.filter(p => {
                if (!isTaken(p.id)) return true;
                const kids = subs.filter(s => s.parent_category === p.name && !isTaken(s.id));
                return kids.length > 0;
              });
              const availableCustoms = customCats.filter(c => !isTaken(c.key));
              const totalParents = parents.length + customCats.length;

              if (totalParents === 0) {
                return <p className="text-sm text-[#8FA4C8] text-center py-4">Belum ada kategori tersedia. Tambahkan kategori dulu di menu Transaksi.</p>;
              }
              if (availableParents.length === 0 && availableCustoms.length === 0) {
                return <p className="text-sm text-[#8FA4C8] text-center py-4">{t("budget_all_set")}</p>;
              }
              return null;
            })()}
            {parents.map(parent => {
              const children = subs.filter(s => s.parent_category === parent.name && !isTaken(s.id));
              const isOpen = openParent === parent.id;
              const isParentSelected = category === parent.id;
              const isChildSelected = children.some(c => c.id === category);
              const isSelected = isParentSelected || isChildSelected;
              // skip if parent is taken AND no children
              if (isTaken(parent.id) && children.length === 0) return null;
              return (
                <div key={parent.id} className="rounded-xl overflow-hidden border transition-all"
                  style={{ borderColor: isSelected ? "#F9731660" : "#E2E8F0" }}>
                  {/* Parent row — click selects parent, chevron expands subs */}
                  <div className="flex items-center" style={{ backgroundColor: isSelected ? "#F9731610" : "#F8FAFC" }}>
                    <button
                      onClick={() => !isTaken(parent.id) && setCategory(isParentSelected ? "" : parent.id)}
                      disabled={isTaken(parent.id)}
                      className="flex items-center gap-2.5 px-3 py-2.5 flex-1 text-left transition-colors disabled:opacity-40">
                      <span className="text-lg">{parent.emoji}</span>
                      <span className="text-xs font-semibold flex-1" style={{ color: isSelected ? "#F97316" : "#1A1A1A" }}>{parent.name}</span>
                      {isChildSelected && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#F9731620] text-[#F97316]">
                          {children.find(c => c.id === category)?.name}
                        </span>
                      )}
                    </button>
                    {children.length > 0 && (
                      <button onClick={() => setOpenParent(isOpen ? null : parent.id)} className="px-3 py-2.5">
                        <ChevronDown className="w-3.5 h-3.5 text-[#8FA4C8] flex-shrink-0 transition-transform"
                          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
                      </button>
                    )}
                  </div>
                  {/* Sub-categories */}
                  {isOpen && children.length > 0 && (
                    <div className="px-3 py-2 flex flex-wrap gap-1.5 border-t border-[#F2F4F7] bg-white">
                      {children.map(sub => (
                        <button key={sub.id} onClick={() => setCategory(sub.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold border transition-all"
                          style={{
                            backgroundColor: category === sub.id ? "#F9731620" : "#F2F4F7",
                            borderColor: category === sub.id ? "#F97316" : "#E2E8F0",
                            color: category === sub.id ? "#F97316" : "#4A5568"
                          }}>
                          <span>{sub.emoji}</span>{sub.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {/* Custom categories */}
            {customCats.filter(c => !isTaken(c.key)).length > 0 && (
              <div className="rounded-xl overflow-hidden border border-[#E2E8F0]">
                <div className="px-3 py-2 bg-[#F8FAFC] flex flex-wrap gap-1.5">
                  {customCats.filter(c => !isTaken(c.key)).map(c => (
                    <button key={c.key} onClick={() => setCategory(c.key)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold border transition-all"
                      style={{
                        backgroundColor: category === c.key ? "#F9731620" : "#F2F4F7",
                        borderColor: category === c.key ? "#F97316" : "#E2E8F0",
                        color: category === c.key ? "#F97316" : "#4A5568"
                      }}>
                      <span>{c.emoji}</span>{c.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
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
              className="w-full border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-3.5 text-xl font-bold text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-[#F8FAFC]"
              placeholder="0"
              value={displayAmount}
              onChange={handleAmountChange} />
            
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 rounded-xl border border-[#E2E8F0] text-[#8FA4C8] font-semibold text-sm hover:bg-[#F8FAFC] transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !category || !rawAmount}
            className="flex-1 py-3.5 rounded-xl bg-[#F97316] text-white font-bold text-sm hover:bg-[#e05e00] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Menyimpan...</>
            ) : (
              isEditing ? "Simpan Perubahan" : "Simpan Anggaran"
            )}
          </button>
        </div>
        </div>
      </div>
    </>);

}