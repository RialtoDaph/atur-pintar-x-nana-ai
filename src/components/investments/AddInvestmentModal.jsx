import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAppSettings } from "@/components/utils/useAppSettings";
import AssetSearch from "./AssetSearch";

const INVESTMENT_TYPES = [
  { key: "saham", label: "Saham", emoji: "📈" },
  { key: "reksa_dana", label: "Reksa Dana", emoji: "💰" },
  { key: "crypto", label: "Crypto", emoji: "₿" },
  { key: "deposito", label: "Deposito", emoji: "🏦" },
  { key: "obligasi", label: "Obligasi", emoji: "📄" },
  { key: "emas", label: "Emas", emoji: "🥇" },
  { key: "lainnya", label: "Lainnya", emoji: "💼" },
];

export default function AddInvestmentModal({ onClose, onSave, investment = null }) {
  const { t, formatCurrency } = useAppSettings();
  const [form, setForm] = useState(investment || {
    name: "", type: "reksa_dana", initial_amount: "", current_value: "", purchase_date: "", quantity: "", price_per_unit: "", notes: ""
  });
  const [saving, setSaving] = useState(false);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [pricePerUnit, setPricePerUnit] = useState(investment?.price_per_unit || "");

  async function fetchLivePrice() {
    if (!form.name) return;
    setFetchingPrice(true);
    try {
      const response = await base44.functions.invoke('searchAssets', {
        query: form.name,
        type: form.type
      });
      if (response.data?.results?.[0]) {
        const asset = response.data.results[0];
        setForm(f => ({ ...f, current_value: asset.price?.toString() || "" }));
        setPricePerUnit(asset.price?.toString() || "");
      }
    } catch (e) {
      console.log('Price fetch failed:', e.message);
    }
    setFetchingPrice(false);
  }

  function calculateValues() {
    const initialAmt = parseFloat(form.initial_amount) || 0;
    const qty = parseFloat(form.quantity) || 0;
    const price = parseFloat(pricePerUnit) || 0;

    let calculatedValues = { ...form };

    // Jika ada price per unit dan quantity, hitung initial_amount
    if (price > 0 && qty > 0) {
      calculatedValues.initial_amount = (price * qty).toString();
    }

    // current_value same as initial_amount jika tidak ada perubahan harga
    if (!calculatedValues.current_value) {
      calculatedValues.current_value = calculatedValues.initial_amount;
    }

    return calculatedValues;
  }

  async function handleSave() {
    if (!form.name || !form.initial_amount) return;
    setSaving(true);
    const values = calculateValues();
    await onSave({
      ...values,
      initial_amount: parseFloat(values.initial_amount),
      current_value: parseFloat(values.current_value) || parseFloat(values.initial_amount),
      quantity: form.quantity ? parseFloat(form.quantity) : undefined,
      price_per_unit: pricePerUnit ? parseFloat(pricePerUnit) : undefined,
    });
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#1A1A1A]">{investment ? t('edit_investment') : t('add_investment')}</h2>
          <button onClick={onClose} className="text-[#9B9B9B] hover:text-[#1A1A1A]"><X className="w-5 h-5" /></button>
        </div>

        <div className="mb-4">
          <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-2 block">{t('investment_type')}</label>
          <div className="grid grid-cols-4 gap-2">
            {INVESTMENT_TYPES.map(t => (
              <button key={t.key} onClick={() => setForm(f => ({ ...f, type: t.key }))}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                  form.type === t.key ? "border-[#FF6A00] bg-[#FF6A00]/10" : "border-[#E2E8F0] bg-[#F8FAFC]"
                }`}>
                <span className="text-xl">{t.emoji}</span>
                <span className="text-[10px] font-medium text-[#4A5568] text-center leading-tight">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div>
            <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">{t('search_asset')}</label>
            <AssetSearch 
              type={form.type} 
              onSelect={(asset) => {
                setForm(f => ({
                  ...f,
                  name: asset.symbol,
                  current_value: asset.price?.toString() || ""
                }));
                setPricePerUnit(asset.price?.toString() || "");
              }}
              placeholder="Ketik nama atau simbol aset..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">{t('price_per_unit')}</label>
              <input type="number" placeholder="0"
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]"
                value={pricePerUnit}
                onChange={e => setPricePerUnit(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">{t('quantity_units')}</label>
              <input type="number" placeholder="0"
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]"
                value={form.quantity}
                onChange={e => setForm(f => {
                  const qty = e.target.value;
                  const price = parseFloat(pricePerUnit) || 0;
                  return { 
                    ...f, 
                    quantity: qty,
                    initial_amount: price > 0 && qty ? (parseFloat(qty) * price).toString() : f.initial_amount
                  };
                })}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">{t('initial_amount')}</label>
            <input type="number" placeholder="0"
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]"
              value={form.initial_amount}
              onChange={e => setForm(f => ({ ...f, initial_amount: e.target.value, current_value: e.target.value }))}
            />
            <p className="text-xs text-[#8FA4C8] mt-1">{t('current_value_auto')}</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest">{t('current_value')}</label>
              <button type="button" onClick={fetchLivePrice} disabled={fetchingPrice || !form.name}
                className="text-xs text-[#FF6A00] hover:text-[#e05e00] font-semibold flex items-center gap-1">
                {fetchingPrice ? <Loader2 className="w-3 h-3 animate-spin" /> : '🔄'} {t('fetch_price')}
              </button>
            </div>
            <input type="number" placeholder="0"
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]"
              value={form.current_value}
              onChange={e => setForm(f => ({ ...f, current_value: e.target.value }))}
            />
            <p className="text-xs text-[#8FA4C8] mt-1">{t('change_if_price_differs')}</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">{t('purchase_date')}</label>
            <input type="date"
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]"
              value={form.purchase_date}
              onChange={e => setForm(f => ({ ...f, purchase_date: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">{t('notes')}</label>
            <input type="text" placeholder={t('notes_optional_placeholder')}
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>
        </div>

        <button onClick={handleSave} disabled={saving || !form.name || !form.initial_amount}
          className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-[#FF6A00] disabled:opacity-40 hover:bg-[#e05e00] transition-colors">
          {saving ? t('saving') : investment ? t('update_investment') : t('add_investment')}
        </button>
      </div>
    </div>
  );
}