import { useState, useEffect, useRef } from "react";
import { X, Settings2, Camera, Loader2, Scissors, Sparkles, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { parseRupiah } from "@/components/utils/parseRupiah";
import { useAppSettings } from "@/components/utils/useAppSettings";
import ManageCategoriesModal from "./ManageCategoriesModal";
import SplitBillModal from "./SplitBillModal";
import ReceiptCorrectionForm from "./ReceiptCorrectionForm";
import BottomSheetSelect from "@/components/ui/BottomSheetSelect";
import TransactionFormInputs from "./TransactionFormInputs";
import TransactionCategories from "./TransactionCategories";
import { toast } from "sonner";

export default function AddTransactionModal({ goals = [], onClose, onSave, initialValues = {} }) {
  const { t, formatCurrency, settings } = useAppSettings();
  const [tab, setTab] = useState("expense");
  const [form, setForm] = useState({
    amount: initialValues.amount || "",
    category: initialValues.category || "",
    note: initialValues.note || "",
    date: new Date().toISOString().split("T")[0],
    goal_id: "",
    is_recurring: initialValues.is_recurring || false,
    recurring_interval: initialValues.recurring_interval || "monthly",
  });
  const [saving, setSaving] = useState(false);
  const [customCats, setCustomCats] = useState([]);
  const [showManage, setShowManage] = useState(false);

  const [scanning, setScanning] = useState(false);
  const [receiptData, setReceiptData] = useState(null); // extracted receipt
  const [showSplitBill, setShowSplitBill] = useState(false);
  const [catOrder, setCatOrder] = useState([]); // Category drag order
  const [appSettings, setAppSettings] = useState(null);
  const [subCatPopup, setSubCatPopup] = useState(null); // { parentKey, parentLabel, subs }
  const [showGoalSelect, setShowGoalSelect] = useState(false);
  const fileRef = useRef(null);
  const cameraRef = useRef(null);

  // Removed - now handled in TransactionCategories component

  async function handleScanReceipt(e) {
    const file = e.target.files[0];
    if (!file) return;
    setScanning(true);
    setReceiptData(null);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const response = await base44.functions.invoke("extractReceiptData", { file_url });
      const extracted = response.data?.data;

      if (extracted && extracted.total_amount) {
        setReceiptData(extracted);
        setTab("expense");
        setForm(f => ({
          ...f,
          amount: extracted.total_amount ? String(Math.round(extracted.total_amount)) : f.amount,
          date: extracted.date || f.date,
          note: extracted.store_name || f.note,
          category: extracted.category || "other",
        }));
        toast.success("Struk berhasil dipindai! Data telah diisi otomatis.");
      } else {
        toast.error("Gagal membaca struk. Silakan coba lagi.");
      }
    } catch (error) {
      console.error("Receipt scan failed:", error);
      toast.error("Gagal memindai struk. Silakan periksa file Anda.");
    } finally {
      setScanning(false);
      e.target.value = "";
    }
  }

  async function handleSplitConfirm({ splitMode, participants, shares, items }) {
    setShowSplitBill(false);
    setSaving(true);

    try {
      if (!receiptData?.total_amount || !Array.isArray(shares) || shares.length === 0) {
        toast.error("Data split bill tidak valid");
        return;
      }

      await onSave({
        type: "expense",
        amount: receiptData.total_amount,
        category: form.category || "food",
        note: `${receiptData.store_name} (split bill)`,
        date: form.date,
        is_recurring: false,
      });

      const iouPromises = shares
        .filter(share => share.name !== "Saya" && share.amount > 0)
        .map(share =>
          base44.entities.SplitIOU.create({
            store_name: receiptData.store_name,
            date: form.date,
            debtor_name: share.name,
            debtor_email: share.email || "",
            creditor_name: "Saya",
            amount: share.amount,
            status: "unpaid",
            receipt_image_url: receiptData.receipt_image_url || "",
            notes: `Split bill ${splitMode === "equal" ? "bagi rata" : "per item"}`,
          })
        );

      if (iouPromises.length > 0) {
        await Promise.all(iouPromises);
      }
      toast.success("Split bill berhasil disimpan");
    } catch (error) {
      console.error("Split bill failed:", error);
      toast.error("Gagal menyimpan split bill");
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    if (!form.amount || !form.category) return;

    const amount = parseRupiah(form.amount);
    if (amount <= 0) return;

    setSaving(true);
    try {
      await onSave({
        ...form,
        type: tab,
        amount,
        goal_id: form.goal_id || undefined,
      });
    } catch (error) {
      console.error("Save transaction failed:", error);
      throw error;
    } finally {
      setSaving(false);
    }
  }



  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 max-h-[90vh] overflow-y-auto scroll-smooth">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-[#1A1A1A]">{t('add_transaction')}</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <button onClick={() => cameraRef.current?.click()} disabled={scanning}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#FF6A00]/10 hover:bg-[#FF6A00]/20 transition-colors text-[10px] font-semibold text-[#FF6A00] tap-highlight-fix"
                  title="Foto Struk">
                  {scanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
                  Kamera
                </button>
                <button onClick={() => fileRef.current?.click()} disabled={scanning}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#F2F4F7] hover:bg-[#E2E8F0] transition-colors text-[10px] font-semibold text-[#4A5568] tap-highlight-fix"
                  title="Upload dari Galeri">
                  <Upload className="w-3 h-3" />
                  Galeri
                </button>
                <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleScanReceipt} />
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleScanReceipt} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowManage(true)} className="text-[#9B9B9B] hover:text-[#1A1A1A] transition-colors tap-highlight-fix" title={t('manage_categories')}>
                <Settings2 className="w-4 h-4" />
              </button>
              <button onClick={onClose} className="text-[#9B9B9B] hover:text-[#1A1A1A] transition-colors tap-highlight-fix">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Receipt preview + Split Bill CTA */}
          {receiptData && (
            <div className="mb-5 bg-gradient-to-br from-[#FF6A00]/5 to-[#F8FAFC] border border-[#FF6A00]/20 rounded-2xl p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-[#FF6A00]" />
                <span className="text-xs font-bold text-[#FF6A00]">AI Berhasil Membaca Struk</span>
              </div>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-bold text-[#1A1A1A]">{receiptData.store_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {receiptData.category && (
                      <span className="text-[10px] bg-[#FF6A00]/10 text-[#FF6A00] font-semibold px-2 py-0.5 rounded-full capitalize">
                        {receiptData.category}
                      </span>
                    )}
                    {receiptData.tax_amount > 0 && (
                      <span className="text-[10px] text-[#8FA4C8]">Pajak: {formatCurrency(receiptData.tax_amount)}</span>
                    )}
                  </div>
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

          {/* Scanning overlay */}
          {scanning && (
            <div className="mb-5 bg-[#FF6A00]/5 border border-[#FF6A00]/20 rounded-2xl p-6 flex flex-col items-center gap-3">
              <div className="relative">
                <Camera className="w-10 h-10 text-[#FF6A00]/30" />
                <Loader2 className="w-5 h-5 text-[#FF6A00] animate-spin absolute -top-1 -right-1" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-[#1A1A1A]">AI Memindai Struk...</p>
                <p className="text-xs text-[#8FA4C8] mt-0.5">Mengekstrak merchant, total, tanggal & kategori</p>
              </div>
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

          <TransactionCategories 
            tab={tab} 
            form={form} 
            setForm={setForm}
            onShowSubCatPopup={setSubCatPopup}
          />

          <TransactionFormInputs 
            form={form} 
            setForm={setForm}
            t={t}
          />

          {/* Linked Goal (if any savings goals exist) */}
          {goals && goals.length > 0 && (
            <div className="mb-5">
              <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-2 block">{t('link_to_goal')}</label>
              <button
                onClick={() => setShowGoalSelect(true)}
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC] text-left transition-colors hover:border-[#CBD5E0] tap-highlight-fix flex items-center justify-between"
              >
                <span>{form.goal_id ? goals.find(g => g.id === form.goal_id)?.name || t('no_goal') : t('no_goal')}</span>
                <span className="text-[#8FA4C8]">›</span>
              </button>
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
          onUpdated={() => setShowManage(false)}
        />
      )}

      {showSplitBill && receiptData && (
        <SplitBillModal
          receiptData={receiptData}
          onClose={() => setShowSplitBill(false)}
          onConfirm={handleSplitConfirm}
        />
      )}

      {/* Sub-category popup */}
      {subCatPopup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-xs shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{subCatPopup.parentEmoji}</span>
                <div>
                  <p className="text-xs text-[#8FA4C8] font-medium">Pilih sub-kategori</p>
                  <p className="text-sm font-bold text-[#1A1A1A]">{subCatPopup.parentLabel}</p>
                </div>
              </div>
              <button onClick={() => setSubCatPopup(null)} className="text-[#9B9B9B] hover:text-[#1A1A1A] tap-highlight-fix">
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
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#FF6A00] hover:bg-[#FF6A00]/5 transition-all tap-highlight-fix"
                >
                  <span className="text-2xl">{sub.emoji}</span>
                  <span className="text-[10px] font-semibold text-[#4A5568] text-center leading-tight">{sub.label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setForm(f => ({ ...f, category: subCatPopup.parentKey }));
                setSubCatPopup(null);
              }}
              className="mt-3 w-full py-2.5 rounded-xl border border-[#E2E8F0] text-xs font-semibold text-[#8FA4C8] hover:border-[#CBD5E0] transition-colors tap-highlight-fix"
            >
              Pilih "{subCatPopup.parentLabel}" saja (tanpa sub-kategori)
            </button>
          </div>
        </div>
      )}

      <BottomSheetSelect
        isOpen={showGoalSelect}
        onClose={() => setShowGoalSelect(false)}
        title={t('link_to_goal')}
        options={[
          { key: "", label: t('no_goal'), emoji: "❌" },
          ...goals.map(g => ({ key: g.id, label: g.name, emoji: g.icon }))
        ]}
        onSelect={(goalId) => setForm({ ...form, goal_id: goalId })}
        selectedValue={form.goal_id}
      />
    </>
  );
}