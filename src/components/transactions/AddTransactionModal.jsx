import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { X, Camera, Loader2, Scissors, Upload, Sparkles, History, ChevronDown } from "lucide-react";
import { updateStreak, completeMission } from "@/hooks/useGamificationActions";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import AccountAvatar from "@/components/ui/AccountAvatar";
import SplitBillModal from "./SplitBillModal";
import ReceiptCorrectionForm from "./ReceiptCorrectionForm";
import useLockBodyScroll from "@/hooks/useLockBodyScroll";

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

const INTERVALS = [
  { key: "daily", label: "Hari" },
  { key: "weekly", label: "Minggu" },
  { key: "monthly", label: "Bulan" },
  { key: "yearly", label: "Tahun" },
];

export default function AddTransactionModal({ goals = [], onClose, onSave, initialValues = {} }) {
  useLockBodyScroll();
  const [tab, setTab] = useState("expense");
  const [amountRaw, setAmountRaw] = useState(initialValues.amount ? String(initialValues.amount) : "");
  const [amountFocused, setAmountFocused] = useState(false);
  const [category, setCategory] = useState(initialValues.category || "");
  const [note, setNote] = useState(initialValues.note || "");
  const [date, setDate] = useState(new Date().toLocaleDateString("en-CA"));
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  });
  const [accountId, setAccountId] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [interval, setInterval] = useState("monthly");
  const [accounts, setAccounts] = useState([]);
  const [globalCategories, setGlobalCategories] = useState([]);
  const [appSettings, setAppSettings] = useState(null);
  const [favTab, setFavTab] = useState("fav");
  const [openParent, setOpenParent] = useState(null);
  const [suggestion, setSuggestion] = useState(null);
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [showSplitBill, setShowSplitBill] = useState(false);
  const [lowBalanceConfirm, setLowBalanceConfirm] = useState(null);
  const suggestTimer = useRef(null);
  const amountInputRef = useRef(null);
  const fileRef = useRef(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      if (!u?.email) return;
      Promise.all([
        base44.entities.Account.filter({ created_by: u.email }, "name"),
        base44.entities.GlobalCategory.list("sort_order"),
        base44.entities.AppSettings.filter({ created_by: u.email }),
      ]).then(([accs, cats, settings]) => {
        const deduped = [];
        const seen = new Set();
        for (const a of (accs || [])) { if (!seen.has(a.name)) { seen.add(a.name); deduped.push(a); } }
        setAccounts(deduped);
        const def = deduped.find(a => a.is_default) || deduped[0];
        if (def) setAccountId(def.id);
        setGlobalCategories((cats || []).filter(c => c.is_active !== false));
        const s = settings?.[0] || null;
        setAppSettings(s);
        if (!s?.favorite_categories?.length) setFavTab("all");
      });
    });
  }, []);

  const filteredCats = globalCategories.filter(c =>
    tab === "expense" ? (c.type === "expense" || c.type === "both") : (c.type === "income" || c.type === "both")
  );
  const favIds = appSettings?.favorite_categories || [];
  const favCats = filteredCats.filter(c => favIds.includes(c.id));

  async function updateFavorites(catId) {
    if (!appSettings) return;
    const favs = [...(appSettings.favorite_categories || [])];
    const idx = favs.indexOf(catId);
    if (idx >= 0) {
      favs.splice(idx, 1);
      toast.success("Dihapus dari Favorit");
    } else if (favs.length >= 6) {
      toast.error("Maksimal 6 favorit. Hapus salah satu dulu.");
      return;
    } else {
      favs.push(catId);
      toast.success("Ditambahkan ke Favorit ★");
    }
    const newSettings = { ...appSettings, favorite_categories: favs };
    setAppSettings(newSettings);
    if (appSettings.id) {
      await base44.entities.AppSettings.update(appSettings.id, { favorite_categories: favs });
    }
  }

  function handleNoteChange(val) {
    setNote(val);
    clearTimeout(suggestTimer.current);
    if (!category && val.trim().length >= 3) {
      suggestTimer.current = setTimeout(async () => {
        try {
          // Try backend categorization (learning + rules + AI)
          const res = await base44.functions.invoke("categorizeTransaction", { note: val, type: tab });
          const result = res.data || {};

          if (result.category) {
            // Direct category ID from learning
            const cat = globalCategories.find(c => c.id === result.category);
            if (cat) { setSuggestion({ ...cat, source: result.source }); return; }
          }
          if (result.category_name) {
            // Category name match from rules or AI
            const cat = globalCategories.find(c =>
              c.name.toLowerCase() === result.category_name.toLowerCase() ||
              c.name.toLowerCase().includes(result.category_name.toLowerCase())
            );
            if (cat) { setSuggestion({ ...cat, source: result.source }); return; }
          }
        } catch {
          // Fallback: local CategoryLearning check
          const lower = val.toLowerCase();
          const learns = await base44.entities.CategoryLearning.filter({ created_by: (await base44.auth.me()).email }).catch(() => []);
          const match = (learns || []).sort((a, b) => (b.count || 1) - (a.count || 1)).find(l => l.note_fragment && lower.includes(l.note_fragment.toLowerCase()) && l.count >= 2);
          if (match) {
            const cat = globalCategories.find(c => c.id === match.category);
            if (cat) setSuggestion(cat);
          }
        }
      }, 900);
    } else if (!val.trim()) {
      setSuggestion(null);
    }
  }

  const selectedAccount = accounts.find(a => a.id === accountId);
  const amount = parseAmount(amountRaw);
  const canSave = amount > 0 && accountId;

  async function doSave() {
    setSaving(true);
    try {
      const txData = {
        amount,
        type: tab,
        date,
        category: category || "other",
        note,
        account_id: accountId,
        time: time || undefined,
        is_recurring: isRecurring,
        recurring_interval: isRecurring ? interval : undefined,
        is_recurring_child: false,
      };
      // Balance is updated by parent's onSave handler (via syncAccountBalance) — do not double-update here
      await onSave(txData);

      // Gamification: streak + mission
      const user = await base44.auth.me();
      if (user?.email) {
        updateStreak(user.email).catch(() => {});
        completeMission(user.email, "catat_transaksi").catch(() => {});
      }

      // CategoryLearning
      if (note && category) {
        const words = note.split(/\s+/).filter(w => w.length >= 3);
        for (const word of words) {
          const frag = word.toLowerCase();
          const existing = await base44.entities.CategoryLearning.filter({ note_fragment: frag, created_by: user.email }).catch(() => []);
          if (existing?.length > 0) {
            await base44.entities.CategoryLearning.update(existing[0].id, { count: (existing[0].count || 1) + 1 });
          } else {
            await base44.entities.CategoryLearning.create({ note_fragment: frag, category, count: 1 }).catch(() => {});
          }
        }
      }
      toast.success("Tersimpan!");
      onClose();
    } catch (e) {
      toast.error("Gagal: " + e.message);
    }
    setSaving(false);
  }

  function handleSave() {
    if (!canSave) return;
    if (tab === "expense" && !isRecurring && selectedAccount && (selectedAccount.balance || 0) < amount) {
      setLowBalanceConfirm(true);
      return;
    }
    doSave();
  }

  async function handleScanReceipt(e) {
    const file = e.target.files[0];
    if (!file) return;
    setScanning(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const response = await base44.functions.invoke("extractReceiptData", { file_url });
      const extracted = response.data?.data;
      if (extracted?.total_amount) {
        setReceiptData({ ...extracted, image_url: file_url });
        setTab("expense");
        setAmountRaw(String(Math.round(extracted.total_amount)));
        if (extracted.date) setDate(extracted.date);
        if (extracted.store_name) setNote(extracted.store_name);
        if (extracted.category) setCategory(extracted.category);
        // Save to ReceiptScan entity
        base44.entities.ReceiptScan.create({
          image_url: file_url,
          merchant_name: extracted.store_name || "",
          total_amount: extracted.total_amount || 0,
          scan_date: extracted.date || new Date().toLocaleDateString("en-CA"),
          suggested_category: extracted.category || "",
          scanned_at: new Date().toISOString(),
          status: "pending",
        }).catch(() => {});
        toast.success("Struk berhasil dipindai!");
      } else {
        toast.error("Gagal membaca struk.");
      }
    } catch {
      toast.error("Gagal memindai struk.");
    } finally {
      setScanning(false);
      e.target.value = "";
    }
  }

  async function handleSplitConfirm({ splitMode, participants, shares }) {
    setShowSplitBill(false);
    setSaving(true);
    try {
      await onSave({ type: "expense", amount: receiptData.total_amount, category: category || "food", note: `${receiptData.store_name} (split bill)`, date, is_recurring: false });
      const iouPromises = shares.filter(s => s.name !== "Saya" && s.amount > 0).map(s =>
        base44.entities.SplitIOU.create({ store_name: receiptData.store_name, date, debtor_name: s.name, debtor_email: s.email || "", creditor_name: "Saya", amount: s.amount, status: "unpaid", receipt_image_url: receiptData.receipt_image_url || "" })
      );
      if (iouPromises.length > 0) await Promise.all(iouPromises);
      toast.success("Split bill berhasil disimpan");
      onClose();
    } catch { toast.error("Gagal menyimpan split bill"); }
    setSaving(false);
  }

  const typeColor = tab === "expense" ? "#DC2626" : "#16A34A";
  const typeBg = tab === "expense" ? "#FEF2F2" : "#F0FDF4";
  const saveBg = "#F97316";
  const saveLabel = tab === "expense" ? "Simpan Pengeluaran" : "Simpan Pemasukan";

  return (
    <>
      {/* Backdrop — translucent so FAB at z-80 stays visible above */}
      <div className="fixed inset-0 z-40 bg-black/40 sm:backdrop-blur-sm" onClick={onClose} />
      {/* Mobile: floating popup positioned just above the FAB. Desktop: centered modal */}
      <div
        className="fixed z-40 pointer-events-none flex justify-center sm:inset-0 sm:items-center"
        style={{
          left: 0,
          right: 0,
          bottom: 'calc(112px + env(safe-area-inset-bottom, 0px))',
          top: '64px'
        }}>
        <div
          role="dialog"
          aria-modal="true"
          className="bg-white rounded-3xl shadow-2xl overflow-y-auto overscroll-contain pointer-events-auto animate-slide-up-sheet w-[calc(100%-24px)] sm:w-full sm:max-w-md md:max-w-lg"
          style={{ maxHeight: "100%" }}
          onClick={e => e.stopPropagation()}>

          {/* Type tabs */}
          <div className="grid grid-cols-2 sticky top-0 z-10 bg-white">
            {["expense", "income"].map(t => (
              <button key={t} onClick={() => { setTab(t); setCategory(""); }}
                className="py-4 text-sm font-bold transition-all relative"
                style={{
                  backgroundColor: tab === t ? "#FFF7ED" : "white",
                  color: tab === t ? "#F97316" : "#8FA4C8",
                  borderBottom: tab === t ? "2.5px solid #F97316" : "2.5px solid transparent"
                }}>
                {t === "expense" ? "Pengeluaran" : "Pemasukan"}
              </button>
            ))}
          </div>

          <div className="px-5 pb-5">
            {/* Receipt scan buttons */}
            <div className="flex items-center justify-between py-2 mb-1">
              <div className="flex gap-2">
                <button onClick={() => cameraRef.current?.click()} disabled={scanning}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FF6A00]/10 text-[10px] font-semibold text-[#FF6A00]">
                  {scanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />} Kamera
                </button>
                <button onClick={() => fileRef.current?.click()} disabled={scanning}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F2F4F7] text-[10px] font-semibold text-[#4A5568]">
                  <Upload className="w-3 h-3" /> Galeri
                </button>
                <Link to="/ReceiptScanHistory" onClick={onClose}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F2F4F7] text-[10px] font-semibold text-[#4A5568]">
                  <History className="w-3 h-3" /> Riwayat scan
                </Link>
              </div>
            </div>
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleScanReceipt} />
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleScanReceipt} />

            {/* Receipt preview */}
            {receiptData && (
              <div className="mb-4 bg-[#FFF5EB] border border-[#FF6A00]/20 rounded-2xl p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#FF6A00]" />
                  <span className="text-xs font-bold text-[#FF6A00]">Struk terbaca</span>
                </div>
                <div className="flex justify-between mb-2">
                  <p className="text-sm font-bold text-[#1A1A1A]">{receiptData.store_name}</p>
                  <p className="text-sm font-bold text-[#FF6A00]">Rp{receiptData.total_amount?.toLocaleString("id-ID")}</p>
                </div>
                <button onClick={() => setShowSplitBill(true)}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-[#0A0A0A] text-white text-xs font-bold">
                  <Scissors className="w-3.5 h-3.5" /> Split Bill
                </button>
                <ReceiptCorrectionForm receiptData={receiptData} onChange={(c) => {
                  setReceiptData(c);
                  setAmountRaw(String(Math.round(c.total_amount)));
                  if (c.date) setDate(c.date);
                  if (c.store_name) setNote(c.store_name);
                }} />
              </div>
            )}

            {/* Amount */}
            <div className="py-4 border-b border-[#F2F4F7] mb-4">
              <p className="text-[11px] text-[#8FA4C8] mb-2 text-center">nominal</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl font-bold" style={{ color: typeColor }}>Rp</span>
                <input
                  ref={amountInputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="0"
                  className="text-3xl font-bold bg-transparent border-none outline-none text-center w-full max-w-[220px]"
                  style={{ color: amountRaw ? typeColor : "#CBD5E0" }}
                  value={amountFocused ? amountRaw : formatDisplay(amountRaw)}
                  onFocus={() => setAmountFocused(true)}
                  onBlur={() => setAmountFocused(false)}
                  onChange={e => setAmountRaw(e.target.value.replace(/\D/g, ""))}
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Account pills */}
            {accounts.length > 0 && (
              <div className="mb-4">
                <p className="text-[11px] text-[#8FA4C8] mb-2">dari rekening</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {accounts.map(acc => {
                    const active = accountId === acc.id;
                    return (
                      <button key={acc.id} onClick={() => setAccountId(acc.id)}
                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold border-[1.5px] transition-all"
                        style={{
                          borderColor: active ? "#F97316" : "#E2E8F0",
                          backgroundColor: active ? "#FFF7ED" : "#F8FAFC",
                          color: active ? "#EA580C" : "#4A5568"
                        }}>
                        <AccountAvatar logoUrl={acc.logo_url} name={acc.name} color={acc.color || "#FF6A00"} size="w-5 h-5" />
                        {acc.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Category */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] text-[#8FA4C8]">kategori</p>
                <p className="text-[10px] text-[#8FA4C8]">★ = tambah/hapus favorit</p>
              </div>
              {/* Sub-tabs */}
              <div className="flex border border-[#E2E8F0] rounded-lg overflow-hidden mb-2">
                {["fav", "all"].map(t => (
                  <button key={t} onClick={() => setFavTab(t)}
                    className={`flex-1 py-1.5 text-xs font-semibold transition-all ${favTab === t ? "bg-[#F97316] text-white" : "text-[#8FA4C8]"}`}>
                    {t === "fav" ? "⭐ Favorit" : "Semua"}
                  </button>
                ))}
              </div>
              {favTab === "fav" && (
                favCats.length === 0 ? (
                  <p className="text-[11px] text-[#8FA4C8] text-center py-3">Belum ada favorit. Buka tab Semua, tekan lama chip untuk bintangi.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {favCats.map(cat => <CatChip key={cat.id} cat={cat} selected={category === cat.id} typeColor={typeColor} isFav={favIds.includes(cat.id)} onSelect={() => setCategory(category === cat.id ? "" : cat.id)} onFavToggle={() => updateFavorites(cat.id)} />)}
                  </div>
                )
              )}
              {favTab === "all" && (() => {
                const parents = filteredCats.filter(c => !c.is_subcategory).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
                const subs = filteredCats.filter(c => c.is_subcategory === true).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
                if (parents.length > 0) {
                  return (
                    <div className="space-y-1">
                      {parents.map(parent => {
                        const children = subs.filter(s => s.parent_category === parent.name);
                        const isOpen = openParent === parent.id;
                        const isParentSelected = category === parent.id || children.some(c => c.id === category);
                        return (
                          <div key={parent.id} className="rounded-xl overflow-hidden border transition-all"
                            style={{ borderColor: isParentSelected ? typeColor + "60" : "#E2E8F0" }}>
                            {/* Parent row */}
                            <div className="flex items-center"
                              style={{ backgroundColor: isParentSelected ? typeColor + "10" : "#F8FAFC" }}>
                              <button
                                onClick={() => setOpenParent(isOpen ? null : parent.id)}
                                className="flex-1 flex items-center gap-2 px-3 py-2.5">
                                <span className="text-lg">{parent.emoji}</span>
                                <span className="text-xs font-semibold flex-1 text-left" style={{ color: isParentSelected ? typeColor : "#1A1A1A" }}>{parent.name}</span>
                                {children.some(c => c.id === category) && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: typeColor + "20", color: typeColor }}>
                                    {children.find(c => c.id === category)?.name}
                                  </span>
                                )}
                                <ChevronDown className="w-3.5 h-3.5 transition-transform flex-shrink-0" style={{ color: "#8FA4C8", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
                              </button>
                              <button onClick={() => updateFavorites(parent.id)} className="px-3 py-2.5 active:scale-90 transition-transform">
                                <span style={{ color: favIds.includes(parent.id) ? "#FBBF24" : "#CBD5E0", fontSize: 16 }}>★</span>
                              </button>
                            </div>
                            {/* Dropdown subcategories */}
                            {isOpen && children.length > 0 && (
                              <div className="px-3 py-2.5 flex flex-wrap gap-1.5 border-t border-[#F2F4F7] bg-white">
                                {children.map(cat => (
                                  <CatChip key={cat.id} cat={cat} selected={category === cat.id} typeColor={typeColor} isFav={favIds.includes(cat.id)} onSelect={() => { setCategory(category === cat.id ? "" : cat.id); setOpenParent(parent.id); }} onFavToggle={() => updateFavorites(cat.id)} />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                }
                return (
                  <div className="flex flex-wrap gap-1.5">
                    {filteredCats.map(cat => <CatChip key={cat.id} cat={cat} selected={category === cat.id} typeColor={typeColor} isFav={favIds.includes(cat.id)} onSelect={() => setCategory(category === cat.id ? "" : cat.id)} onFavToggle={() => updateFavorites(cat.id)} />)}
                  </div>
                );
              })()}

              {/* AI suggestion */}
              {suggestion && !category && (
                <div className="mt-2 flex items-center gap-2 bg-[#FFF7ED] border border-[#F97316]/20 rounded-xl px-3 py-2">
                  <span className="text-xs text-[#F97316]">
                    {suggestion.source === 'learning' ? '🧠' : suggestion.source === 'rules' ? '⚡' : '✨'}
                  </span>
                  <span className="text-xs text-[#EA580C] font-medium">Saran:</span>
                  <button onClick={() => { setCategory(suggestion.id); setSuggestion(null); }}
                    className="flex items-center gap-1 text-xs font-bold text-white bg-[#F97316] px-2.5 py-1 rounded-lg">
                    {suggestion.emoji} {suggestion.name}
                  </button>
                  <button onClick={() => setSuggestion(null)} className="ml-auto text-[10px] text-[#8FA4C8]">✕</button>
                </div>
              )}
            </div>

            {/* Date, Time & Note */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <p className="text-[11px] text-[#8FA4C8] mb-1.5">tanggal</p>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-xs text-[#1A1A1A] focus:outline-none focus:ring-2 bg-[#F8FAFC]"
                  style={{ "--tw-ring-color": typeColor }} />
              </div>
              <div>
                <p className="text-[11px] text-[#8FA4C8] mb-1.5">waktu</p>
                <input type="time" value={time} onChange={e => setTime(e.target.value)}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-xs text-[#1A1A1A] focus:outline-none focus:ring-2 bg-[#F8FAFC]"
                  style={{ "--tw-ring-color": typeColor }} />
              </div>
            </div>
            <div className="mb-4">
              <p className="text-[11px] text-[#8FA4C8] mb-1.5">catatan</p>
              <input type="text" placeholder="opsional..." value={note} onChange={e => handleNoteChange(e.target.value)}
                className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-xs text-[#1A1A1A] focus:outline-none focus:ring-2 bg-[#F8FAFC]" />
            </div>

            {/* Recurring toggle */}
            <div className="mb-5">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-semibold text-[#1A1A1A]">Transaksi berulang?</p>
                  {isRecurring && <p className="text-[10px] text-[#8FA4C8]">masuk ke Transaksi Rutin</p>}
                </div>
                <button onClick={() => setIsRecurring(r => !r)}
                  className="w-11 h-6 rounded-full transition-colors relative flex-shrink-0"
                  style={{ backgroundColor: isRecurring ? "#F97316" : "#E2E8F0" }}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isRecurring ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
              {isRecurring && (
                <div className="flex gap-2 mt-2">
                  {INTERVALS.map(iv => (
                    <button key={iv.key} onClick={() => setInterval(iv.key)}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold border transition-all"
                      style={{
                        backgroundColor: interval === iv.key ? "#FFF7ED" : "#F2F4F7",
                        borderColor: interval === iv.key ? "#F97316" : "transparent",
                        color: interval === iv.key ? "#EA580C" : "#4A5568"
                      }}>
                      {iv.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Save */}
            <button onClick={handleSave} disabled={saving || !canSave}
              className="w-full py-3.5 rounded-[10px] font-bold text-sm text-white transition-colors"
              style={{ backgroundColor: saveBg, opacity: (!canSave || saving) ? 0.4 : 1, pointerEvents: !canSave ? "none" : "auto" }}>
              {saving ? "Menyimpan..." : saveLabel}
            </button>
          </div>
        </div>
      </div>

      {/* Low balance confirm */}
      {lowBalanceConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl">
            <p className="text-sm font-bold text-[#1A1A1A] mb-2">⚠️ Saldo Tidak Cukup</p>
            <p className="text-xs text-[#8FA4C8] mb-4">
              Saldo {selectedAccount?.name} ({`Rp${(selectedAccount?.balance || 0).toLocaleString("id-ID")}`}) tidak cukup. Tetap simpan?
            </p>
            <div className="flex gap-2">
              <button onClick={() => setLowBalanceConfirm(null)} className="flex-1 py-3 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-[#8FA4C8]">Batal</button>
              <button onClick={() => { setLowBalanceConfirm(null); doSave(); }} className="flex-1 py-3 rounded-xl bg-[#EF4444] text-white text-sm font-bold">Tetap Simpan</button>
            </div>
          </div>
        </div>
      )}

      {showSplitBill && receiptData && (
        <SplitBillModal receiptData={receiptData} onClose={() => setShowSplitBill(false)} onConfirm={handleSplitConfirm} />
      )}
    </>
  );
}

function CatChip({ cat, selected, typeColor, isFav, onSelect, onFavToggle, onLongPress }) {
  const longPressTimer = useRef(null);
  function startPress() { if (onLongPress) { longPressTimer.current = setTimeout(() => { onLongPress(); }, 500); } }
  function endPress() { clearTimeout(longPressTimer.current); }
  return (
    <div className="flex items-center rounded-full border transition-all overflow-hidden"
      style={{
        backgroundColor: selected ? typeColor + "20" : "#F2F4F7",
        borderColor: selected ? typeColor : "#E2E8F0",
      }}>
      <button
        onMouseDown={startPress} onMouseUp={endPress} onMouseLeave={endPress}
        onTouchStart={startPress} onTouchEnd={endPress}
        onClick={onSelect}
        className="flex items-center gap-1 pl-2.5 pr-1.5 py-1.5 text-[11px] font-semibold"
        style={{ color: selected ? typeColor : "#4A5568" }}>
        <span>{cat.emoji}</span>{cat.name}
      </button>
      {onFavToggle && (
        <button
          onClick={e => { e.stopPropagation(); onFavToggle(); }}
          className="pr-2 py-1.5 text-[11px] leading-none active:scale-90 transition-transform"
        >
          <span style={{ color: isFav ? "#FBBF24" : "#CBD5E0" }}>★</span>
        </button>
      )}
    </div>
  );
}