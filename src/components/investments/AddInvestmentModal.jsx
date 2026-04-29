import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAppSettings } from "@/components/utils/useAppSettings";
import {
  INVESTMENT_TYPES_LIST,
} from "./investmentConstants";

export default function AddInvestmentModal({ onClose, onSave, investment = null }) {
  const { t, settings } = useAppSettings();
  const lang = settings.language === "en" ? "en" : "id";

  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({
    name: investment?.name || "",
    type: investment?.type || "reksa_dana",
    account_id: investment?.account_id || "",
    initial_amount: investment?.initial_amount?.toString() || "",
    current_value: investment?.current_value?.toString() || "",
    purchase_date: investment?.purchase_date || "",
    notes: investment?.notes || "",
    icon: investment?.icon || "",
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      base44.entities.Account.filter({ created_by: u.email }).then(accs => {
        // Tampilkan semua account, terutama tipe investment
        setAccounts(accs || []);
      }).catch(() => {});
    }).catch(() => {});
  }, []);

  async function handleSave() {
    const name = form.name.trim();
    const initial = parseFloat(form.initial_amount) || 0;
    const current = parseFloat(form.current_value) || 0;

    if (!name || initial <= 0 || current <= 0) return;

    setSaving(true);
    try {
      const payload = {
        name,
        type: form.type,
        account_id: form.account_id || undefined,
        initial_amount: initial,
        current_value: current,
        purchase_date: form.purchase_date || undefined,
        notes: form.notes || undefined,
        icon: form.icon || undefined,
      };
      await onSave(payload);
    } catch (error) {
      console.error("Save investment failed:", error);
      throw error;
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]";
  const labelCls = "text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block";
  const isValid = form.name.trim() && parseFloat(form.initial_amount) > 0 && parseFloat(form.current_value) > 0;

  // Investasi tipe deposito: auto-hitung current_value dari bunga
  const isDeposit = form.type === "deposito";
  const [interestRate, setInterestRate] = useState("");
  const [tenorMonths, setTenorMonths] = useState("");

  useEffect(() => {
    if (isDeposit) {
      const principal = parseFloat(form.initial_amount) || 0;
      const rate = parseFloat(interestRate) || 0;
      const tenor = parseFloat(tenorMonths) || 0;
      if (principal > 0 && rate > 0 && tenor > 0) {
        const projected = principal * (1 + (rate / 100) * (tenor / 12));
        setForm(f => ({ ...f, current_value: projected.toFixed(0) }));
      }
    }
  }, [form.initial_amount, interestRate, tenorMonths, isDeposit]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#1A1A1A]">
            {investment ? (lang === "en" ? "Edit Investment" : "Edit Investasi") : (lang === "en" ? "Add Investment" : "Tambah Investasi")}
          </h2>
          <button onClick={onClose} className="text-[#9B9B9B] hover:text-[#1A1A1A]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type selector */}
        <div className="mb-4">
          <label className={labelCls}>{lang === "en" ? "Investment Type" : "Tipe Investasi"}</label>
          <div className="grid grid-cols-4 gap-2">
            {INVESTMENT_TYPES_LIST.map((type) => (
              <button
                key={type.key}
                onClick={() => setForm(f => ({ ...f, type: type.key }))}
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

          {/* Dompet Investasi (Account) */}
          <div>
            <label className={labelCls}>{lang === "en" ? "Investment Wallet" : "Dompet Investasi"}</label>
            <select
              className={inputCls}
              value={form.account_id}
              onChange={e => setForm(f => ({ ...f, account_id: e.target.value }))}
            >
              <option value="">{lang === "en" ? "-- None / Direct --" : "-- Tanpa dompet --"}</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.icon ? `${acc.icon} ` : ""}{acc.name}
                  {acc.type === "investment" ? " 💼" : ""}
                </option>
              ))}
            </select>
            <p className="text-xs text-[#8FA4C8] mt-1">
              {lang === "en" ? "e.g. Bibit, Pluang, Ajaib" : "mis. Bibit, Pluang, Ajaib"}
            </p>
          </div>

          {/* Nama aset */}
          <div>
            <label className={labelCls}>{lang === "en" ? "Asset Name" : "Nama Aset"}</label>
            <input
              type="text"
              placeholder={lang === "en" ? "e.g. Reksa Dana Pertumbuhan" : "mis. Reksa Dana Pertumbuhan"}
              className={inputCls}
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>

          {/* DEPOSITO: bunga + tenor */}
          {isDeposit && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>{lang === "en" ? "Interest Rate (%/yr)" : "Bunga (%/thn)"}</label>
                <input
                  type="number" min="0" max="100" placeholder="0"
                  className={inputCls}
                  value={interestRate}
                  onChange={e => setInterestRate(e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>{lang === "en" ? "Tenor (Months)" : "Tenor (Bulan)"}</label>
                <input
                  type="number" min="1" placeholder="12"
                  className={inputCls}
                  value={tenorMonths}
                  onChange={e => setTenorMonths(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Nominal awal */}
          <div>
            <label className={labelCls}>{lang === "en" ? "Initial Amount" : "Nominal Awal"}</label>
            <input
              type="number" min="0" placeholder="0"
              className={inputCls}
              value={form.initial_amount}
              onChange={e => setForm(f => ({ ...f, initial_amount: e.target.value }))}
            />
          </div>

          {/* Nilai saat ini */}
          <div>
            <label className={labelCls}>{lang === "en" ? "Current Value" : "Nilai Saat Ini"}</label>
            <input
              type="number" min="0" placeholder="0"
              className={inputCls}
              value={form.current_value}
              onChange={e => setForm(f => ({ ...f, current_value: e.target.value }))}
            />
            <p className="text-xs text-[#8FA4C8] mt-1">
              {isDeposit
                ? lang === "en" ? "Auto-calculated from interest" : "Otomatis dari perhitungan bunga"
                : lang === "en" ? "Update manually when value changes" : "Update manual jika nilai berubah"}
            </p>
          </div>

          {/* Tanggal beli */}
          <div>
            <label className={labelCls}>{lang === "en" ? "Purchase Date" : "Tanggal Beli"}</label>
            <input
              type="date"
              className={inputCls}
              value={form.purchase_date}
              onChange={e => setForm(f => ({ ...f, purchase_date: e.target.value }))}
            />
          </div>

          {/* Catatan */}
          <div>
            <label className={labelCls}>{lang === "en" ? "Notes" : "Catatan"}</label>
            <input
              type="text"
              placeholder={lang === "en" ? "Optional notes..." : "Catatan opsional..."}
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
          {saving ? (lang === "en" ? "Saving..." : "Menyimpan...") : investment ? (lang === "en" ? "Update" : "Perbarui") : (lang === "en" ? "Add Investment" : "Tambah Investasi")}
        </button>
      </div>
    </div>
  );
}