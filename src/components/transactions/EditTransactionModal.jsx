import { useState, useEffect } from "react";
import { X, Settings2, GripVertical } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAppSettings } from "@/components/utils/useAppSettings";
import AccountAvatar from "@/components/ui/AccountAvatar";
import ManageCategoriesModal from "./ManageCategoriesModal";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import useLockBodyScroll from "@/hooks/useLockBodyScroll";
import BottomSheetSelect from "@/components/ui/BottomSheetSelect";
import { ChevronDown } from "lucide-react";

// Match AddTransactionModal formatting — integer-only, id-ID grouping.
function formatDisplay(val) {
  if (!val && val !== 0) return "";
  const num = parseInt(String(val).replace(/\D/g, ""), 10);
  if (isNaN(num) || num === 0) return "";
  return num.toLocaleString("id-ID");
}
function parseAmount(val) {
  if (!val) return 0;
  return parseInt(String(val).replace(/\D/g, ""), 10) || 0;
}

export default function EditTransactionModal({ transaction, goals = [], onClose, onSave }) {
  useLockBodyScroll();
  const { t, settings } = useAppSettings();
  // "savings" transactions cannot be edited via this modal (only via Goals page).
  // Without preserving the original type here, save would silently downgrade savings → expense
  // and break SavingsGoal.current_amount sync (old=savings, new=expense mismatch).
  const isSavings = transaction.type === "savings";
  const [tab, setTab] = useState(transaction.type === "income" ? "income" : "expense");
  const [form, setForm] = useState({
    // Store raw digits internally — display uses formatDisplay(). Prevents dot/comma bugs.
    amount: transaction.amount ? String(Math.round(transaction.amount)) : "",
    category: transaction.category || "",
    note: transaction.note || "",
    date: transaction.date || new Date().toISOString().split("T")[0],
    goal_id: transaction.goal_id || "",
    account_id: transaction.account_id || "",
  });
  const [saving, setSaving] = useState(false);
  const [globalCategories, setGlobalCategories] = useState([]);
  const [customCats, setCustomCats] = useState([]);
  const [showManage, setShowManage] = useState(false);
  const [catOrder, setCatOrder] = useState([]);
  const [appSettings, setAppSettings] = useState(null);
  const [subCatPopup, setSubCatPopup] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [accountError, setAccountError] = useState("");
  const [showGoalSheet, setShowGoalSheet] = useState(false);

  useEffect(() => {
    loadCategories();
    loadAppSettings();
    base44.auth.me().then(u => {
      if (u?.email) {
        base44.entities.Account.filter({ created_by: u.email }, "name").then(accs => {
          const deduped = [];
          const seen = new Set();
          for (const a of (accs || [])) { if (!seen.has(a.name)) { seen.add(a.name); deduped.push(a); } }
          setAccounts(deduped);
          // Legacy transactions without account_id would otherwise be uneditable
          // (Save button stays disabled). Auto-pick the user's default/first account.
          if (!transaction.account_id && deduped.length > 0) {
            const fallback = deduped.find(a => a.is_default) || deduped[0];
            setForm(f => ({ ...f, account_id: fallback.id }));
          }
        });
      }
    });
  }, []);

  async function loadAppSettings() {
    const settings = await base44.entities.AppSettings.list();
    if (settings.length > 0) {
      setAppSettings(settings[0]);
      setCatOrder(settings[0].category_order || []);
    }
  }

  useEffect(() => {
    const unsubscribe = base44.entities.CustomCategory.subscribe(() => {
      loadCategories();
    });
    return unsubscribe;
  }, []);

  async function loadCategories() {
    const [globals, customs] = await Promise.all([
      base44.entities.GlobalCategory.list("sort_order").catch(() => []),
      base44.entities.CustomCategory.list("-created_date").catch(() => []),
    ]);
    setGlobalCategories((globals || []).filter(c => c.is_active !== false));
    setCustomCats(customs || []);
  }

  async function handleSave() {
    // account_id required for expense/income; savings exempt
    if (!isSavings && !form.account_id) {
      setAccountError("Pilih rekening untuk transaksi ini.");
      return;
    }
    if (!parseAmount(form.amount) || !form.category) return;
    if (!isSavings && !form.account_id) return;
    setSaving(true);
    await onSave(transaction.id, {
      ...form,
      // Preserve original type if it's "savings" — this modal only toggles expense/income.
      type: isSavings ? "savings" : tab,
      amount: parseAmount(form.amount),
      goal_id: form.goal_id || undefined,
      account_id: form.account_id,
    });
    setSaving(false);
  }

  // Build category list from GlobalCategory (admin-managed) + user's CustomCategory,
  // matching AddTransactionModal so both modals stay in sync.
  const filteredGlobal = globalCategories.filter(c =>
    tab === "expense" ? (c.type === "expense" || c.type === "both") : (c.type === "income" || c.type === "both")
  );
  const filteredCustom = customCats.filter(c => c.type === tab || c.type === "both");
  const allCats = [
    ...filteredGlobal.map(c => ({
      key: c.id,
      label: c.name,
      emoji: c.emoji || "📦",
      color: c.color || "#888",
      is_subcategory: c.is_subcategory,
      parent_category_name: c.parent_category,
    })),
    ...filteredCustom.map(c => ({
      key: `custom_${c.id}`,
      label: c.name,
      emoji: c.emoji || "📦",
      color: c.color || "#888",
    })),
  ];

  // Parents are non-subcategory GlobalCategory items + all CustomCategory items.
  const mainCats = allCats.filter(c => !c.is_subcategory);
  const subCatsByParent = {};
  allCats.filter(c => c.is_subcategory).forEach(c => {
    // Match child → parent by the parent's NAME (as stored in GlobalCategory.parent_category)
    const parent = mainCats.find(p => p.label === c.parent_category_name);
    if (!parent) return;
    if (!subCatsByParent[parent.key]) subCatsByParent[parent.key] = [];
    subCatsByParent[parent.key].push(c);
  });
  
  // Apply drag order if available
  const orderedCats = catOrder.length > 0 
    ? [
        ...catOrder.map(key => mainCats.find(c => c.key === key)).filter(Boolean),
        ...mainCats.filter(c => !catOrder.includes(c.key))
      ]
    : mainCats;

  const handleCategoryClick = (cat) => {
    const subs = subCatsByParent[cat.key];
    if (subs && subs.length > 0) {
      setSubCatPopup({ parentKey: cat.key, parentLabel: cat.label, parentEmoji: cat.emoji, subs });
    } else {
      setForm({ ...form, category: cat.key });
    }
  };

  const handleDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination || source.index === destination.index) return;
    
    const newOrder = Array.from(orderedCats);
    const [moved] = newOrder.splice(source.index, 1);
    newOrder.splice(destination.index, 0, moved);
    const newOrderKeys = newOrder.map(c => c.key);
    setCatOrder(newOrderKeys);
    
    // Save to AppSettings
    if (appSettings) {
      await base44.entities.AppSettings.update(appSettings.id, { category_order: newOrderKeys });
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[190] bg-black/40 sm:backdrop-blur-sm" onClick={onClose} />
      {/* Mobile: floating popup above the FAB. Desktop: centered modal. */}
      <div
        className="fixed z-[200] pointer-events-none flex justify-center sm:inset-0 sm:items-center sm:p-4"
        style={{
          left: 0,
          right: 0,
          bottom: 'calc(112px + env(safe-area-inset-bottom, 0px))',
          top: '64px'
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          className="bg-white rounded-3xl shadow-2xl flex flex-col pointer-events-auto animate-slide-up-sheet w-[calc(100%-24px)] sm:w-full sm:max-w-md"
          style={{ maxHeight: "100%" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header — sticky */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#F2F4F7] flex-shrink-0">
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

          {/* Scrollable body */}
          <div className="px-6 py-5 overflow-y-auto overscroll-contain flex-1">

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

          {/* Account */}
          {accounts.length > 0 && (
            <div className="mb-4">
              <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">Rekening</label>
              <div className="flex flex-wrap gap-2">
                {accounts.map(acc => (
                  <button
                    key={acc.id}
                    onClick={() => { setForm({ ...form, account_id: acc.id }); setAccountError(""); }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold border-[1.5px] transition-all ${
                      form.account_id === acc.id
                        ? "border-[#F97316] bg-[#FFF7ED] text-[#EA580C]"
                        : accountError
                          ? "border-[#DC2626] bg-[#F8FAFC] text-[#4A5568]"
                          : "border-[#E2E8F0] bg-[#F8FAFC] text-[#4A5568]"
                    }`}
                  >
                    <AccountAvatar logoUrl={acc.logo_url} name={acc.name} color={acc.color || "#F97316"} size="w-5 h-5" />
                    {acc.name}
                  </button>
                ))}
              </div>
              {accountError && !isSavings && (
                <p className="text-[11px] text-[#DC2626] font-semibold mt-1.5">{accountError}</p>
              )}
            </div>
          )}

          {/* Amount */}
          <div className="mb-4">
            <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">{t('amount')}</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8FA4C8] font-medium text-lg">{settings.currency_symbol}</span>
              <input
                autoFocus type="text" inputMode="numeric" pattern="[0-9]*"
                className="w-full border border-[#E2E8F0] rounded-xl pl-9 pr-4 py-3 text-2xl font-bold text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-[#F8FAFC]"
                placeholder="0"
                value={formatDisplay(form.amount)}
                onChange={(e) => setForm({ ...form, amount: e.target.value.replace(/\D/g, "") })}
                autoComplete="off"
              />
            </div>
          </div>

          {/* Category */}
          <div className="mb-4">
            <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-2 block">{t('category')}</label>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="categories" direction="horizontal">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`grid grid-cols-3 sm:grid-cols-4 gap-2 p-2 rounded-lg transition-colors ${snapshot.isDraggingOver ? "bg-[#F97316]/5" : ""}`}
                  >
                    {orderedCats.map((c, idx) => (
                      <Draggable key={c.key} draggableId={c.key} index={idx}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`relative transition-all ${snapshot.isDragging ? "opacity-50" : ""}`}
                          >
                            <div>
                              <button
                                {...provided.dragHandleProps}
                                onClick={() => handleCategoryClick(c)}
                                className={`w-full flex flex-col items-center gap-1 p-2 rounded-xl border transition-all relative ${
                                  form.category === c.key || subCatsByParent[c.key]?.some(s => s.key === form.category)
                                    ? "border-[#F97316] bg-[#F97316]/10"
                                    : "border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#CBD5E0]"
                                }`}
                              >
                                <span className="text-lg sm:text-xl">{c.emoji}</span>
                                <span className="text-xs font-medium text-[#4A5568] text-center leading-tight">{c.label}</span>
                                {subCatsByParent[c.key]?.length > 0 && (
                                  <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#F97316] rounded-full flex items-center justify-center">
                                    <span className="text-white text-[9px] font-bold leading-none">▾</span>
                                  </span>
                                )}
                                {subCatsByParent[c.key]?.some(s => s.key === form.category) && (
                                  <span className="text-[11px] text-[#F97316] font-semibold truncate w-full text-center">
                                    {subCatsByParent[c.key].find(s => s.key === form.category)?.emoji}{" "}
                                    {subCatsByParent[c.key].find(s => s.key === form.category)?.label}
                                  </span>
                                )}
                              </button>
                            </div>
                            {snapshot.isDragging && (
                              <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl">
                                <GripVertical className="w-4 h-4 text-[#F97316]" />
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          {/* Note & Date & Goal */}
          <div className="space-y-3 mb-5">
            <div>
              <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">{t('note_optional')}</label>
              <input
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-[#F8FAFC]"
                placeholder={t('note_placeholder')}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">{t('date')}</label>
              <input type="date"
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-[#F8FAFC]"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            {goals && goals.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">{t('link_to_goal')}</label>
                <button
                  type="button"
                  onClick={() => setShowGoalSheet(true)}
                  className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-[#F8FAFC] text-left flex items-center justify-between"
                >
                  <span className="truncate">
                    {form.goal_id
                      ? (() => {
                          const g = goals.find(g => g.id === form.goal_id);
                          return g ? `${g.icon || "🎯"} ${g.name}` : t('no_goal');
                        })()
                      : t('no_goal')}
                  </span>
                  <ChevronDown className="w-4 h-4 text-[#8FA4C8] flex-shrink-0 ml-2" />
                </button>
              </div>
            )}
          </div>

          </div>

          {/* Sticky footer — always visible */}
          <div className="px-6 py-4 border-t border-[#F2F4F7] flex-shrink-0" style={{ paddingBottom: 'calc(1rem + max(0px, env(safe-area-inset-bottom)))' }}>
            <button onClick={handleSave} disabled={saving || !parseAmount(form.amount) || !form.category || (!isSavings && !form.account_id)}
              className="w-full py-3 rounded-xl font-bold text-sm text-white disabled:opacity-40 transition-colors"
              style={{ backgroundColor: tab === "expense" ? "#FF6B6B" : "#00C9A7" }}>
              {saving ? t('saving') : t('save_changes')}
            </button>
          </div>
        </div>
      </div>

      {showManage && (
        <ManageCategoriesModal
          onClose={() => setShowManage(false)}
          onUpdated={() => base44.entities.CustomCategory.list("-created_date").then(setCustomCats)}
        />
      )}

      <BottomSheetSelect
        isOpen={showGoalSheet}
        onClose={() => setShowGoalSheet(false)}
        title={t('link_to_goal')}
        options={[
          { key: "", label: t('no_goal'), emoji: "🚫" },
          ...goals.map(g => ({ key: g.id, label: g.name, emoji: g.icon || "🎯" }))
        ]}
        onSelect={(key) => setForm({ ...form, goal_id: key })}
        selectedValue={form.goal_id || ""}
      />

      {/* Sub-category popup */}
      {subCatPopup && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-xs shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{subCatPopup.parentEmoji}</span>
                <div>
                  <p className="text-xs text-[#8FA4C8] font-medium">Pilih sub-kategori</p>
                  <p className="text-sm font-bold text-[#1A1A1A]">{subCatPopup.parentLabel}</p>
                </div>
              </div>
              <button onClick={() => setSubCatPopup(null)} className="text-[#9B9B9B] hover:text-[#1A1A1A]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {subCatPopup.subs.map(sub => (
                <button
                  key={sub.key}
                  onClick={() => {
                    setForm(f => ({ ...f, category: sub.key }));
                    setSubCatPopup(null);
                  }}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#F97316] hover:bg-[#F97316]/5 transition-all"
                >
                  <span className="text-2xl">{sub.emoji}</span>
                  <span className="text-xs font-semibold text-[#4A5568] text-center leading-tight">{sub.label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setForm(f => ({ ...f, category: subCatPopup.parentKey }));
                setSubCatPopup(null);
              }}
              className="mt-3 w-full py-2.5 rounded-xl border border-[#E2E8F0] text-xs font-semibold text-[#8FA4C8] hover:border-[#CBD5E0] transition-colors"
            >
              Pilih "{subCatPopup.parentLabel}" saja (tanpa sub-kategori)
            </button>
          </div>
        </div>
      )}
    </>
  );
}