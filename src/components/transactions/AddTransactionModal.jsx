import { useState, useEffect, useRef, useCallback } from "react";
import { X, Camera, Loader2, Scissors, Upload, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import SplitBillModal from "./SplitBillModal";
import ReceiptCorrectionForm from "./ReceiptCorrectionForm";

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
  const [tab, setTab] = useState("expense");
  const [amountRaw, setAmountRaw] = useState(initialValues.amount ? String(initialValues.amount) : "");
  const [category, setCategory] = useState(initialValues.category || "");
  const [note, setNote] = useState(initialValues.note || "");
  const [date, setDate] = useState(new Date().toLocaleDateString("en-CA"));
  const [accountId, setAccountId] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [interval, setInterval] = useState("monthly");
  const [accounts, setAccounts] = useState([]);
  const [globalCategories, setGlobalCategories] = useState([]);
  const [appSettings, setAppSettings] = useState(null);
  const [favTab, setFavTab] = useState("fav");
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
    if (!category && val.trim().length >= 2) {
      suggestTimer.current = setTimeout(async () => {
        const lower = val.toLowerCase();
        const learns = await base44.entities.CategoryLearning.filter({ created_by: (await base44.auth.me()).email }).catch(() => []);
        const match = (learns || []).find(l => l.note_fragment && lower.includes(l.note_fragment.toLowerCase()) && l.count >= 2);
        if (match) {
          const cat = globalCategories.find(c => c.id === match.category);
          if (cat) setSuggestion(cat);
        }
      }, 1200);
    } else {
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
        is_recurring: isRecurring,
        recurring_interval: isRecurring ? interval : undefined,
        is_recurring_child: false,
      };
      // Update balance only if not recurring template
      if (!isRecurring) {
        const acc = accounts.find(a => a.id === accountId);
        if (acc) {
          const newBal = tab === "expense" ? (acc.balance || 0) - amount : (acc.balance || 0) + amount;
          await base44.entities.Account.update(accountId, { balance: newBal });
        }
      }
      await onSave(txData);
      // CategoryLearning
      if (note && category) {
        const user = await base44.auth.me();
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
        setReceiptData(extracted);
        setTab("expense");
        setAmountRaw(String(Math.round(extracted.total_amount)));
        if (extracted.date) setDate(extracted.date);
        if (extracted.store_name) setNote(extracted.store_name);
        if (extracted.category) setCategory(extracted.category);
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
  const saveBg = tab === "expense" ? "#EF4444" : "#22C55E";
  const saveLabel = tab === "expense" ? "Simpan Pengeluaran" : "Simpan Pemasukan";

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl overflow-y-auto" style={{ maxHeight: "92dvh" }}>

          {/* Type tabs */}
          <div className="grid grid-cols-2 sticky top-0 z-10 bg-white">
            {["expense", "income"].map(t => (
              <button key={t} onClick={() => { setTab(t); setCategory(""); }}
                className="py-4 text-sm font-bold transition-all relative"
                style={{
                  backgroundColor: tab === t ? typeBg : "white",
                  color: tab === t ? typeColor : "#8FA4C8",
                  borderBottom: tab === t ? `2.5px solid ${typeColor}` : "2.5px solid transparent"
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
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-[#F2F4F7] rounded-lg"><X className="w-4 h-4 text-[#8FA4C8]" /></button>
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
            <div className="text-center py-4 border-b border-[#F2F4F7] mb-4 cursor-pointer" onClick={() => amountInputRef.current?.focus()}>
              <p className="text-[11px] text-[#8FA4C8] mb-1">nominal</p>
              <p className="text-3xl font-bold" style={{ color: typeColor }}>
                Rp {formatDisplay(amountRaw) || <span className="text-[#CBD5E0]">0</span>}
              </p>
              {!amountRaw && <p className="text-[10px] text-[#8FA4C8] mt-1">ketuk untuk mengetik</p>}
              <input
                ref={amountInputRef}
                type="tel"
                inputMode="numeric"
                className="opacity-0 w-0 h-0 absolute"
                value={amountRaw}
                onChange={e => setAmountRaw(e.target.value.replace(/\D/g, ""))}
              />
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
                          borderColor: active ? typeColor : "#E2E8F0",
                          backgroundColor: active ? typeColor + "15" : "#F8FAFC",
                          color: active ? typeColor : "#4A5568"
                        }}>
                        <span>{acc.icon || "💳"}</span>{acc.name}
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
                <p className="text-[10px] text-[#8FA4C8]">tekan lama = favorit</p>
              </div>
              {/* Sub-tabs */}
              <div className="flex border border-[#E2E8F0] rounded-lg overflow-hidden mb-2">
                {["fav", "all"].map(t => (
                  <button key={t} onClick={() => setFavTab(t)}
                    className={`flex-1 py-1.5 text-xs font-semibold transition-all ${favTab === t ? "bg-[#0A0A0A] text-white" : "text-[#8FA4C8]"}`}>
                    {t === "fav" ? "⭐ Favorit" : "Semua"}
                  </button>
                ))}
              </div>
              {favTab === "fav" && (
                favCats.length === 0 ? (
                  <p className="text-[11px] text-[#8FA4C8] text-center py-3">Belum ada favorit. Buka tab Semua, tekan lama chip untuk bintangi.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {favCats.map(cat => <CatChip key={cat.id} cat={cat} selected={category === cat.id} typeColor={typeColor} isFav={favIds.includes(cat.id)} onSelect={() => setCategory(category === cat.id ? "" : cat.id)} onLongPress={() => updateFavorites(cat.id)} />)}
                  </div>
                )
              )}
              {favTab === "all" && (
                <div className="flex flex-wrap gap-1.5">
                  {filteredCats.map(cat => <CatChip key={cat.id} cat={cat} selected={category === cat.id} typeColor={typeColor} isFav={favIds.includes(cat.id)} onSelect={() => setCategory(category === cat.id ? "" : cat.id)} onLongPress={() => updateFavorites(cat.id)} />)}
                </div>
              )}

              {/* AI suggestion */}
              {suggestion && !category && (
                <div className="mt-2 flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                  <span className="text-xs text-blue-600">💡 Biasanya:</span>
                  <button onClick={() => { setCategory(suggestion.id); setSuggestion(null); }}
                    className="flex items-center gap-1 text-xs font-bold text-white bg-blue-500 px-2.5 py-1 rounded-lg">
                    {suggestion.emoji} {suggestion.name}
                  </button>
                  <button onClick={() => setSuggestion(null)} className="ml-auto text-[10px] text-[#8FA4C8]">✕</button>
                </div>
              )}
            </div>

            {/* Date & Note */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <p className="text-[11px] text-[#8FA4C8] mb-1.5">tanggal</p>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-xs text-[#1A1A1A] focus:outline-none focus:ring-2 bg-[#F8FAFC]"
                  style={{ "--tw-ring-color": typeColor }} />
              </div>
              <div>
                <p className="text-[11px] text-[#8FA4C8] mb-1.5">catatan</p>
                <input type="text" placeholder="opsional..." value={note} onChange={e => handleNoteChange(e.target.value)}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-xs text-[#1A1A1A] focus:outline-none focus:ring-2 bg-[#F8FAFC]" />
              </div>
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
                  style={{ backgroundColor: isRecurring ? typeColor : "#E2E8F0" }}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isRecurring ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
              {isRecurring && (
                <div className="flex gap-2 mt-2">
                  {INTERVALS.map(iv => (
                    <button key={iv.key} onClick={() => setInterval(iv.key)}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold border transition-all"
                      style={{
                        backgroundColor: interval === iv.key ? typeColor + "15" : "#F2F4F7",
                        borderColor: interval === iv.key ? typeColor : "transparent",
                        color: interval === iv.key ? typeColor : "#4A5568"
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

function CatChip({ cat, selected, typeColor, isFav, onSelect, onLongPress }) {
  const longPressTimer = useRef(null);
  function startPress() { longPressTimer.current = setTimeout(() => { onLongPress(); }, 500); }
  function endPress() { clearTimeout(longPressTimer.current); }
  return (
    <button
      onMouseDown={startPress} onMouseUp={endPress} onMouseLeave={endPress}
      onTouchStart={startPress} onTouchEnd={endPress}
      onContextMenu={e => { e.preventDefault(); onLongPress(); }}
      onClick={onSelect}
      className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold border transition-all relative"
      style={{
        backgroundColor: selected ? typeColor + "20" : "#F2F4F7",
        borderColor: selected ? typeColor : "#E2E8F0",
        color: selected ? typeColor : "#4A5568"
      }}>
      <span>{cat.emoji}</span>{cat.name}
      {isFav && <span className="text-[9px] text-yellow-400 ml-0.5">★</span>}
    </button>
  );
}