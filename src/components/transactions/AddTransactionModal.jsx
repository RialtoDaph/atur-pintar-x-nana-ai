import { useState, useEffect, useRef } from "react";
import { X, Settings2, Camera, Loader2, Scissors, GripVertical } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { parseRupiah } from "@/components/utils/parseRupiah";
import { useAppSettings } from "@/components/utils/useAppSettings";
import ManageCategoriesModal from "./ManageCategoriesModal";
import SplitBillModal from "./SplitBillModal";
import ReceiptCorrectionForm from "./ReceiptCorrectionForm";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

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

export default function AddTransactionModal({ goals = [], onClose, onSave }) {
  const { t, formatCurrency, settings } = useAppSettings();
  const [tab, setTab] = useState("expense");
  const [form, setForm] = useState({
    amount: "",
    category: "",
    note: "",
    date: new Date().toISOString().split("T")[0],
    goal_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [customCats, setCustomCats] = useState([]);
  const [showManage, setShowManage] = useState(false);
  const [recurring, setRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState("monthly");
  const [scanning, setScanning] = useState(false);
  const [receiptData, setReceiptData] = useState(null); // extracted receipt
  const [showSplitBill, setShowSplitBill] = useState(false);
  const [catOrder, setCatOrder] = useState([]); // Category drag order
  const [appSettings, setAppSettings] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => { 
    loadCustomCats();
    loadAppSettings();
  }, []);
  
  useEffect(() => {
    base44.entities.CustomCategory.subscribe((event) => {
      loadCustomCats();
    });
  }, []);

  async function loadAppSettings() {
    const settings = await base44.entities.AppSettings.list();
    if (settings.length > 0) {
      setAppSettings(settings[0]);
      setCatOrder(settings[0].category_order || []);
    }
  }

  async function loadCustomCats() {
    const cats = await base44.entities.CustomCategory.list("-created_date");
    setCustomCats(cats);
  }

  async function handleScanReceipt(e) {
    const file = e.target.files[0];
    if (!file) return;
    setScanning(true);
    setReceiptData(null);

    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    // Call backend to extract receipt data (detailed)
    const response = await base44.functions.invoke("extractReceiptData", { file_url });
    const extracted = response.data?.data;

    if (extracted) {
      setReceiptData(extracted);
      setTab("expense");
      setForm(f => ({
        ...f,
        amount: extracted.total_amount ? String(Math.round(extracted.total_amount)) : f.amount,
        date: extracted.date || f.date,
        note: extracted.store_name || f.note,
        category: "food",
      }));
    }

    setScanning(false);
    e.target.value = "";
  }

  async function handleSplitConfirm({ splitMode, participants, shares, items }) {
    setShowSplitBill(false);
    setSaving(true);

    const myShare = shares.find(s => s.name === "Saya");

    // Save my own transaction (full amount — I paid upfront)
    await onSave({
      type: "expense",
      amount: receiptData.total_amount,
      category: form.category || "food",
      note: `${receiptData.store_name} (split bill)`,
      date: form.date,
      is_recurring: false,
    });

    // Create IOU records for each non-"Saya" participant
    for (const share of shares) {
      if (share.name === "Saya" || share.amount <= 0) continue;
      await base44.entities.SplitIOU.create({
        store_name: receiptData.store_name,
        date: form.date,
        debtor_name: share.name,
        debtor_email: share.email || "",
        creditor_name: "Saya",
        amount: share.amount,
        status: "unpaid",
        receipt_image_url: receiptData.receipt_image_url || "",
        notes: `Split bill ${splitMode === "equal" ? "bagi rata" : "per item"}`,
      });
    }

    setSaving(false);
  }

  async function handleSave() {
    if (!form.amount || !form.category) return;
    setSaving(true);
    await onSave({
      ...form,
      type: tab,
      amount: parseRupiah(form.amount),
      is_recurring: recurring,
      recurring_interval: recurring ? recurringInterval : undefined,
      recurring_last_generated: recurring ? form.date : undefined,
      goal_id: form.goal_id || undefined,
    });
    setSaving(false);
  }

  const defaultCats = DEFAULT_CATEGORIES[tab] || [];
  const filteredCustom = customCats.filter(c => c.type === tab || c.type === "both");
  const allCats = [
    ...defaultCats.map(c => ({ ...c, label: t(c.i18nKey) })),
    ...filteredCustom.map(c => ({ key: `custom_${c.id}`, label: c.name, emoji: c.emoji, color: c.color || "#888", parent_category_key: c.parent_category_key })),
  ];
  
  // Build category structure with sub-categories
  const mainCats = allCats.filter(c => !c.parent_category_key);
  const subCatsByParent = {};
  allCats.filter(c => c.parent_category_key).forEach(c => {
    if (!subCatsByParent[c.parent_category_key]) subCatsByParent[c.parent_category_key] = [];
    subCatsByParent[c.parent_category_key].push(c);
  });
  
  // Apply drag order if available
  const orderedCats = catOrder.length > 0 
    ? catOrder.map(key => mainCats.find(c => c.key === key)).filter(Boolean)
    : mainCats;
  
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

  // Format currency input helper
  const formatCurrencyInput = (val) => {
    const numStr = val.replace(new RegExp("\\" + settings.thousand_separator, "g"), "").replace(settings.decimal_separator, ".");
    const num = parseFloat(numStr) || 0;
    const intPart = Math.floor(num);
    const intStr = intPart.toString().split('').reverse();
    const grouped = [];
    for (let i = 0; i < intStr.length; i++) {
      if (i > 0 && i % 3 === 0) grouped.push(settings.thousand_separator);
      grouped.push(intStr[i]);
    }
    return grouped.reverse().join('');
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 max-h-[90vh] overflow-y-auto scroll-smooth">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#1A1A1A]">{t('add_transaction')}</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => fileRef.current?.click()} disabled={scanning}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F2F4F7] hover:bg-[#E2E8F0] transition-colors text-xs font-semibold text-[#4A5568]"
                title={t('scan_receipt')}>
                {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                {scanning ? t('scanning') : t('scan_receipt')}
              </button>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleScanReceipt} />
              <button onClick={() => setShowManage(true)} className="text-[#9B9B9B] hover:text-[#1A1A1A] transition-colors" title={t('manage_categories')}>
                <Settings2 className="w-4 h-4" />
              </button>
              <button onClick={onClose} className="text-[#9B9B9B] hover:text-[#1A1A1A] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Receipt preview + Split Bill CTA */}
          {receiptData && (
            <div className="mb-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-xs text-[#8FA4C8] font-medium">{t('receipt_detected')}</p>
                  <p className="text-sm font-bold text-[#1A1A1A]">{receiptData.store_name}</p>
                  {receiptData.tax_amount > 0 && (
                    <p className="text-xs text-[#8FA4C8]">{t('tax')}: {formatCurrency(receiptData.tax_amount)}</p>
                  )}
                </div>
                <p className="text-sm font-bold text-[#FF6A00]">
                  {formatCurrency(receiptData.total_amount)}
                </p>
              </div>
              {receiptData.items?.length > 0 && (
                <div className="space-y-1 mb-3 max-h-28 overflow-y-auto">
                  {receiptData.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs text-[#4A5568]">
                      <span>{item.quantity > 1 ? `${item.quantity}x ` : ""}{item.name}</span>
                      <span>{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => setShowSplitBill(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#0A0A0A] text-white text-xs font-bold hover:bg-[#333] transition-colors"
              >
                <Scissors className="w-3.5 h-3.5" />
                {t('split_bill_with_friends')}
              </button>
              <ReceiptCorrectionForm
                receiptData={receiptData}
                onChange={(corrected) => {
                  setReceiptData(corrected);
                  setForm(f => ({
                    ...f,
                    amount: corrected.total_amount ? String(Math.round(corrected.total_amount)) : f.amount,
                    date: corrected.date || f.date,
                    note: corrected.store_name || f.note,
                  }));
                }}
              />
            </div>
          )}

          {/* Type tabs */}
          <div className="flex bg-[#F2F4F7] rounded-xl p-1 mb-5">
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
          <div className="mb-5">
            <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">{t('amount')}</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8FA4C8] font-medium text-base">{settings.currency_symbol}</span>
              <input
                autoFocus type="text" inputMode="numeric"
                className="w-full border border-[#E2E8F0] rounded-xl pl-12 pr-4 py-3.5 text-2xl font-bold text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]"
                placeholder="0"
                value={form.amount}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.,]/g, "");
                  setForm({ ...form, amount: formatCurrencyInput(val) });
                }}
              />
            </div>
          </div>

          {/* Category */}
          <div className="mb-5">
            <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-2 block">{t('category')}</label>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="categories" direction="horizontal">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`grid grid-cols-3 sm:grid-cols-4 gap-2 p-2 rounded-lg transition-colors ${snapshot.isDraggingOver ? "bg-[#FF6A00]/5" : ""}`}
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
                                onClick={() => setForm({ ...form, category: c.key })}
                                className={`w-full flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                                  form.category === c.key ? "border-[#FF6A00] bg-[#FF6A00]/10" : "border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#CBD5E0]"
                                }`}
                              >
                                <span className="text-lg sm:text-xl">{c.emoji}</span>
                                <span className="text-[9px] sm:text-[10px] font-medium text-[#4A5568] text-center leading-tight">{c.label}</span>
                              </button>
                              {/* Sub-categories */}
                              {subCatsByParent[c.key]?.length > 0 && (
                                <div className="mt-1.5 pl-1 space-y-1">
                                  {subCatsByParent[c.key].map(sub => (
                                    <button
                                      key={sub.key}
                                      onClick={() => setForm({ ...form, category: sub.key })}
                                      className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[8px] sm:text-[9px] font-medium transition-all ${
                                        form.category === sub.key ? "border-[#FF6A00] bg-[#FF6A00]/10 text-[#FF6A00]" : "border-[#E2E8F0] bg-white text-[#4A5568] hover:border-[#CBD5E0]"
                                      }`}
                                    >
                                      <span>{sub.emoji}</span>
                                      <span className="truncate">{sub.label}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            {snapshot.isDragging && (
                              <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl">
                                <GripVertical className="w-4 h-4 text-[#FF6A00]" />
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

          {/* Note & Date */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">{t('note_optional')}</label>
              <input
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]"
                placeholder={t('note_placeholder')}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">{t('date')}</label>
              <input type="date"
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
          </div>

          {/* Recurring */}
          <div className="mb-5">
            <button
              type="button"
              onClick={() => setRecurring(r => !r)}
              className={`flex items-center gap-2 w-full px-4 py-3 rounded-xl border transition-all ${
                recurring ? "border-[#FF6A00] bg-[#FF6A00]/10" : "border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#CBD5E0]"
              }`}
            >
              <span className="text-base">🔄</span>
              <span className="text-sm font-semibold text-[#1A1A1A] flex-1 text-left">{t('recurring_transaction')}</span>
              <div className={`w-4 h-4 rounded-full border-2 ${recurring ? "bg-[#FF6A00] border-[#FF6A00]" : "border-[#CBD5E0]"}`} />
            </button>
            {recurring && (
              <div className="flex gap-2 mt-2">
                {["daily","weekly","monthly","yearly"].map(interval => (
                  <button key={interval} onClick={() => setRecurringInterval(interval)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border capitalize transition-all ${
                      recurringInterval === interval ? "bg-[#0A0A0A] text-white border-[#0A0A0A]" : "text-[#4A5568] border-[#E2E8F0] bg-white hover:border-[#CBD5E0]"
                    }`}>
                    {t(interval)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Linked Goal (if any savings goals exist) */}
          {goals && goals.length > 0 && (
            <div className="mb-5">
              <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-2 block">{t('link_to_goal')}</label>
              <select
                value={form.goal_id || ""}
                onChange={(e) => setForm({ ...form, goal_id: e.target.value })}
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]"
              >
                <option value="">{t('no_goal')}</option>
                {goals.map(goal => (
                  <option key={goal.id} value={goal.id}>{goal.icon} {goal.name}</option>
                ))}
              </select>
            </div>
          )}

          <button onClick={handleSave} disabled={saving || !form.amount || !form.category}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-white disabled:opacity-40 transition-colors"
            style={{ backgroundColor: tab === "expense" ? "#FF6B6B" : "#00C9A7" }}>
            {saving ? t('saving') : `${t('add')} ${tab === "expense" ? t('expense') : t('income')}`}
          </button>
        </div>
      </div>

      {showManage && (
        <ManageCategoriesModal
          onClose={() => setShowManage(false)}
          onUpdated={() => { loadCustomCats(); }}
        />
      )}

      {showSplitBill && receiptData && (
        <SplitBillModal
          receiptData={receiptData}
          onClose={() => setShowSplitBill(false)}
          onConfirm={handleSplitConfirm}
        />
      )}
    </>
  );
}