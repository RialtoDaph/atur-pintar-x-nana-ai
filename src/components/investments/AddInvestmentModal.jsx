import { useState, useEffect } from "react";
import { X, Loader2, RefreshCw, Pencil } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAppSettings } from "@/components/utils/useAppSettings";
import AssetSearch from "./AssetSearch";
import {
  INVESTMENT_TYPES_LIST,
  UNIT_LABELS,
  SEARCHABLE_TYPES,
} from "./investmentConstants";

function getUnitLabel(type, lang) {
  return UNIT_LABELS[type]?.[lang] || (lang === "en" ? "Units" : "Unit");
}

export default function AddInvestmentModal({ onClose, onSave, investment = null }) {
  const { t, settings } = useAppSettings();
  const lang = settings.language === "en" ? "en" : "id";

  const [form, setForm] = useState({
    name: investment?.name || "",
    type: investment?.type || "reksa_dana",
    initial_amount: investment?.initial_amount?.toString() || "",
    current_value: investment?.current_value?.toString() || "",
    purchase_date: investment?.purchase_date || "",
    quantity: investment?.quantity?.toString() || "",
    price_per_unit: investment?.price_per_unit?.toString() || "",
    notes: investment?.notes || "",
    // Emas
    weight_grams: investment?.quantity?.toString() || "", // reuse quantity for grams
    price_per_gram: investment?.price_per_unit?.toString() || "",
    // Deposito
    interest_rate: "",
    tenor_months: "",
  });

  const [saving, setSaving] = useState(false);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [fetchingHistorical, setFetchingHistorical] = useState(false);
  const [manualName, setManualName] = useState(
    !SEARCHABLE_TYPES.includes(investment?.type || "reksa_dana") || !!investment?.name
  );

  const isSearchable = SEARCHABLE_TYPES.includes(form.type);
  const isGold = form.type === "emas";
  const isDeposit = form.type === "deposito";

  // Auto-calculate for gold: current_value = weight_grams * price_per_gram
  useEffect(() => {
    if (isGold) {
      const grams = parseFloat(form.weight_grams) || 0;
      const pricePerGram = parseFloat(form.price_per_gram) || 0;
      if (grams > 0 && pricePerGram > 0) {
        const total = (grams * pricePerGram).toString();
        setForm(f => ({ ...f, initial_amount: total, current_value: total }));
      }
    }
  }, [form.weight_grams, form.price_per_gram, isGold]);

  // Auto-calculate for saham/crypto: initial_amount = quantity * price_per_unit
  useEffect(() => {
    if (!isGold && !isDeposit) {
      const qty = parseFloat(form.quantity) || 0;
      const price = parseFloat(form.price_per_unit) || 0;
      if (qty > 0 && price > 0) {
        const total = (qty * price).toString();
        setForm(f => ({ ...f, initial_amount: total, current_value: total }));
      }
    }
  }, [form.quantity, form.price_per_unit, isGold, isDeposit]);

  // Auto-calculate deposito: current_value = initial_amount * (1 + rate/100 * tenor/12)
  useEffect(() => {
    if (isDeposit) {
      const principal = parseFloat(form.initial_amount) || 0;
      const rate = parseFloat(form.interest_rate) || 0;
      const tenor = parseFloat(form.tenor_months) || 0;
      if (principal > 0 && rate > 0 && tenor > 0) {
        const projected = principal * (1 + (rate / 100) * (tenor / 12));
        setForm(f => ({ ...f, current_value: projected.toFixed(0) }));
      }
    }
  }, [form.initial_amount, form.interest_rate, form.tenor_months, isDeposit]);

  async function fetchLivePrice() {
    if (!form.name) return;
    setFetchingPrice(true);
    try {
      const response = await base44.functions.invoke("searchAssets", {
        query: form.name,
        type: form.type,
      });
      if (response.data?.results?.[0]) {
        const asset = response.data.results[0];
        const price = asset.price?.toString() || "";
        setForm(f => ({
          ...f,
          price_per_unit: price,
          current_value: price,
        }));
      }
    } catch (e) {
      console.error("Price fetch failed:", e.message);
    }
    setFetchingPrice(false);
  }

  // Fetch historical price when purchase_date changes (for saham, crypto, emas)
  async function fetchHistoricalPrice(date) {
    if (!date || !form.name) return;
    if (!["saham", "crypto", "emas"].includes(form.type)) return;
    setFetchingHistorical(true);
    try {
      const response = await base44.functions.invoke("getHistoricalPrice", {
        symbol: form.name,
        type: form.type,
        date,
      });
      if (response.data?.price) {
        const price = response.data.price.toString();
        setForm(f => ({
          ...f,
          price_per_unit: price,
          ...(isGold ? { price_per_gram: price } : {}),
        }));
      }
    } catch (e) {
      // silently fail, user can enter manually
    }
    setFetchingHistorical(false);
  }

  function handleTypeChange(key) {
    setForm(f => ({
      ...f,
      type: key,
      quantity: "",
      price_per_unit: "",
      weight_grams: "",
      price_per_gram: "",
      interest_rate: "",
      tenor_months: "",
      initial_amount: "",
      current_value: "",
    }));
    setManualName(!SEARCHABLE_TYPES.includes(key));
  }

  async function handleSave() {
    const name = form.name.trim();
    const initial = parseFloat(form.initial_amount) || 0;
    if (!name || initial <= 0) return;

    setSaving(true);
    const payload = {
      name,
      type: form.type,
      initial_amount: initial,
      current_value: parseFloat(form.current_value) || initial,
      purchase_date: form.purchase_date || undefined,
      notes: form.notes || undefined,
    };

    // Quantity & price_per_unit
    if (isGold) {
      payload.quantity = parseFloat(form.weight_grams) || undefined;
      payload.price_per_unit = parseFloat(form.price_per_gram) || undefined;
    } else {
      payload.quantity = parseFloat(form.quantity) || undefined;
      payload.price_per_unit = parseFloat(form.price_per_unit) || undefined;
    }

    await onSave(payload);
    setSaving(false);
  }

  const unitLabel = getUnitLabel(form.type, lang);
  const inputCls = "w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]";
  const labelCls = "text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block";
  const isValid = form.name.trim() && parseFloat(form.initial_amount) > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#1A1A1A]">
            {investment ? t("edit_investment") : t("add_investment")}
          </h2>
          <button onClick={onClose} className="text-[#9B9B9B] hover:text-[#1A1A1A]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type selector */}
        <div className="mb-4">
          <label className={labelCls}>{t("investment_type")}</label>
          <div className="grid grid-cols-4 gap-2">
            {INVESTMENT_TYPES_LIST.map((type) => (
              <button
                key={type.key}
                onClick={() => handleTypeChange(type.key)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                  form.type === type.key
                    ? "border-[#FF6A00] bg-[#FF6A00]/10"
                    : "border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#CBD5E0]"
                }`}
              >
                <span className="text-xl">{type.emoji}</span>
                <span className="text-[10px] font-medium text-[#4A5568] text-center leading-tight">
                  {lang === "en" ? type.label_en : type.label_id}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {/* Asset name — search or manual */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelCls.replace(" mb-1.5", "")}>
                {isSearchable && !manualName ? t("search_asset") : (lang === "en" ? "Asset Name" : "Nama Aset")}
              </label>
              <button
                type="button"
                onClick={() => setManualName(!manualName)}
                className="flex items-center gap-1 text-[10px] text-[#FF6A00] font-medium hover:underline"
              >
                <Pencil className="w-3 h-3" />
                {manualName
                  ? lang === "en" ? "Search" : "Cari"
                  : lang === "en" ? "Manual" : "Manual"}
              </button>
            </div>
            {isSearchable && !manualName ? (
              <AssetSearch
                type={form.type}
                onSelect={(asset) => {
                  setForm(f => ({
                    ...f,
                    name: asset.name || asset.symbol,
                    price_per_unit: asset.price?.toString() || "",
                    current_value: asset.price?.toString() || "",
                  }));
                }}
              />
            ) : (
              <input
                type="text"
                placeholder={
                  isGold
                    ? lang === "en" ? "e.g. Antam Gold" : "mis. Emas Antam"
                    : isDeposit
                    ? lang === "en" ? "e.g. BCA Deposit" : "mis. Deposito BCA"
                    : lang === "en" ? "Asset name..." : "Nama aset..."
                }
                className={inputCls}
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            )}
          </div>

          {/* GOLD: weight + price per gram */}
          {isGold && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>
                  {lang === "en" ? "Weight (Grams)" : "Berat (Gram)"}
                </label>
                <input
                  type="number" min="0" placeholder="0"
                  className={inputCls}
                  value={form.weight_grams}
                  onChange={e => setForm(f => ({ ...f, weight_grams: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelCls}>
                  {lang === "en" ? "Price / Gram" : "Harga / Gram"}
                </label>
                <input
                  type="number" min="0" placeholder="0"
                  className={inputCls}
                  value={form.price_per_gram}
                  onChange={e => setForm(f => ({ ...f, price_per_gram: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* DEPOSITO: principal + interest rate + tenor */}
          {isDeposit && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>
                  {lang === "en" ? "Interest Rate (%/yr)" : "Bunga (%/thn)"}
                </label>
                <input
                  type="number" min="0" max="100" placeholder="0"
                  className={inputCls}
                  value={form.interest_rate}
                  onChange={e => setForm(f => ({ ...f, interest_rate: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelCls}>
                  {lang === "en" ? "Tenor (Months)" : "Tenor (Bulan)"}
                </label>
                <input
                  type="number" min="1" placeholder="12"
                  className={inputCls}
                  value={form.tenor_months}
                  onChange={e => setForm(f => ({ ...f, tenor_months: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* SAHAM / CRYPTO / OTHERS: quantity + price per unit */}
          {!isGold && !isDeposit && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>{t("price_per_unit")}</label>
                <input
                  type="number" min="0" placeholder="0"
                  className={inputCls}
                  value={form.price_per_unit}
                  onChange={e => setForm(f => ({ ...f, price_per_unit: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelCls}>
                  {lang === "en" ? `Qty (${unitLabel})` : `Jumlah (${unitLabel})`}
                </label>
                <input
                  type="number" min="0" placeholder="0"
                  className={inputCls}
                  value={form.quantity}
                  onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* Initial amount */}
          <div>
            <label className={labelCls}>{t("initial_amount")}</label>
            <input
              type="number" min="0" placeholder="0"
              className={inputCls}
              value={form.initial_amount}
              onChange={e => setForm(f => ({ ...f, initial_amount: e.target.value, current_value: e.target.value }))}
            />
            <p className="text-xs text-[#8FA4C8] mt-1">
              {isGold
                ? lang === "en" ? "Auto-calculated from weight × price/gram" : "Otomatis dari berat × harga/gram"
                : isDeposit
                ? lang === "en" ? "Principal deposit amount" : "Pokok deposito"
                : t("current_value_auto")}
            </p>
          </div>

          {/* Current value */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelCls.replace(" mb-1.5", "")}>{t("current_value")}</label>
              {isSearchable && (
                <button
                  type="button"
                  onClick={fetchLivePrice}
                  disabled={fetchingPrice || !form.name}
                  className="flex items-center gap-1 text-xs text-[#FF6A00] hover:text-[#e05e00] font-semibold disabled:opacity-40"
                >
                  {fetchingPrice ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                  {t("fetch_price")}
                </button>
              )}
              {isDeposit && (
                <span className="text-[10px] text-[#8FA4C8]">
                  {lang === "en" ? "Auto from interest calc" : "Otomatis dari bunga"}
                </span>
              )}
            </div>
            <input
              type="number" min="0" placeholder="0"
              className={inputCls}
              value={form.current_value}
              onChange={e => setForm(f => ({ ...f, current_value: e.target.value }))}
            />
            <p className="text-xs text-[#8FA4C8] mt-1">{t("change_if_price_differs")}</p>
          </div>

          {/* Purchase date */}
          <div>
            <label className={labelCls}>{t("purchase_date")}</label>
            <input
              type="date"
              className={inputCls}
              value={form.purchase_date}
              onChange={e => setForm(f => ({ ...f, purchase_date: e.target.value }))}
            />
          </div>

          {/* Notes */}
          <div>
            <label className={labelCls}>{t("notes")}</label>
            <input
              type="text"
              placeholder={t("notes_optional_placeholder")}
              className={inputCls}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !isValid}
          className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-[#FF6A00] disabled:opacity-40 hover:bg-[#e05e00] transition-colors"
        >
          {saving ? t("saving") : investment ? t("update_investment") : t("add_investment")}
        </button>
      </div>
    </div>
  );
}