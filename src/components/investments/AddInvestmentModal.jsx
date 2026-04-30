import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAppSettings } from "@/components/utils/useAppSettings";
import { INVESTMENT_TYPES_LIST } from "./investmentConstants";
import { useNavigate } from "react-router-dom";

export default function AddInvestmentModal({ onClose, onSave, investment = null }) {
  const { settings } = useAppSettings();
  const lang = settings.language === "en" ? "en" : "id";
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({
    account_id: investment?.account_id || "",
    name: investment?.name || "",
    type: investment?.type || "reksa_dana",
    initial_amount: investment?.initial_amount?.toString() || "",
    current_value: investment?.current_value?.toString() || "",
    purchase_date: investment?.purchase_date || "",
    notes: investment?.notes || "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      base44.entities.Account.filter({ created_by: u.email, type: "investasi" })
        .then(accs => setAccounts(accs || []))
        .catch(() => {});
    }).catch(() => {});
  }, []);

  async function handleSave() {
    const name = form.name.trim();
    const initial = parseFloat(form.initial_amount) || 0;
    const current = parseFloat(form.current_value) || 0;
    if (!name || initial <= 0) return;

    setSaving(true);
    try {
      await onSave({
        account_id: form.account_id || undefined,
        name,
        type: form.type,
        initial_amount: initial,
        current_value: current > 0 ? current : initial,
        purchase_date: form.purchase_date || undefined,
        notes: form.notes || undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]";
  const labelCls = "text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block";
  const isValid = form.name.trim() && parseFloat(form.initial_amount) > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#1A1A1A]">
            {investment
              ? (lang === "en" ? "Edit Investment" : "Edit Investasi")
              : (lang === "en" ? "Add Investment" : "Tambah Investasi")}
          </h2>
          <button onClick={onClose} className="text-[#9B9B9B] hover:text-[#1A1A1A]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 mb-6">

          {/* 1. Dompet investasi */}
          <div>
            <label className={labelCls}>{lang === "en" ? "Wallet / Platform" : "Dompet / Platform"}</label>
            {accounts.length === 0 ? (
              <div className="border border-[#E2E8F0] rounded-xl px-4 py-3 bg-[#FFF5F5] space-y-2">
                <p className="text-sm text-[#C84545]">
                  {lang === "en" ? "No investment wallets yet. Please add one first." : "Belum ada dompet investasi. Silakan tambahkan terlebih dahulu."}
                </p>
                <button
                  onClick={() => navigate("/Accounts")}
                  className="text-xs font-semibold text-[#FF6A00] hover:text-[#e05e00] underline"
                >
                  {lang === "en" ? "Go to Accounts" : "Buka Rekening"}
                </button>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    const list = document.getElementById('account-list');
                    list?.classList.toggle('hidden');
                  }}
                  className={`${inputCls} text-left flex items-center gap-2 justify-between`}
                >
                  <span>
                    {form.account_id
                      ? accounts.find(a => a.id === form.account_id)?.name || (lang === "en" ? "-- Select wallet --" : "-- Pilih dompet --")
                      : (lang === "en" ? "-- Select wallet --" : "-- Pilih dompet --")}
                  </span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>
                <div id="account-list" className="hidden absolute top-full left-0 right-0 mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-lg z-10">
                  {accounts.map(acc => (
                    <button
                      key={acc.id}
                      onClick={() => {
                        setForm(f => ({ ...f, account_id: acc.id }));
                        document.getElementById('account-list')?.classList.add('hidden');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F8FAFC] border-b border-[#E2E8F0] last:border-b-0 text-left transition-colors"
                    >
                      {acc.logo_url ? (
                        <img src={acc.logo_url} alt={acc.name} className="w-6 h-6 object-contain flex-shrink-0" />
                      ) : acc.icon ? (
                        <span className="text-lg flex-shrink-0">{acc.icon}</span>
                      ) : null}
                      <span className="text-sm font-medium text-[#1A1A1A]">{acc.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. Nama aset */}
          <div>
            <label className={labelCls}>{lang === "en" ? "Asset Name" : "Nama Aset"}</label>
            <input
              type="text"
              placeholder={lang === "en" ? "e.g. Reksa Dana Pertumbuhan, BTC, BBCA" : "mis. Reksa Dana Pertumbuhan, BTC, BBCA"}
              className={inputCls}
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>

          {/* 3. Nominal beli */}
          <div>
            <label className={labelCls}>{lang === "en" ? "Purchase Amount (Rp)" : "Nominal Beli (Rp)"}</label>
            <input
              type="number"
              min="0"
              placeholder="0"
              className={inputCls}
              value={form.initial_amount}
              onChange={e => setForm(f => ({ ...f, initial_amount: e.target.value }))}
            />
          </div>

          {/* 4. Nilai saat ini */}
          <div>
            <label className={labelCls}>{lang === "en" ? "Current Value (Rp)" : "Nilai Saat Ini (Rp)"}</label>
            <input
              type="number"
              min="0"
              placeholder={lang === "en" ? "Leave empty = same as purchase" : "Kosongkan = sama dengan nominal beli"}
              className={inputCls}
              value={form.current_value}
              onChange={e => setForm(f => ({ ...f, current_value: e.target.value }))}
            />
            <p className="text-xs text-[#8FA4C8] mt-1">
              {lang === "en" ? "Update manually whenever the value changes." : "Update manual setiap nilai berubah."}
            </p>
          </div>

          {/* 5. Tanggal beli */}
          <div>
            <label className={labelCls}>{lang === "en" ? "Purchase Date" : "Tanggal Beli"}</label>
            <input
              type="date"
              className={inputCls}
              value={form.purchase_date}
              onChange={e => setForm(f => ({ ...f, purchase_date: e.target.value }))}
            />
          </div>

          {/* 6. Catatan opsional */}
          <div>
            <label className={labelCls}>{lang === "en" ? "Notes (optional)" : "Catatan (opsional)"}</label>
            <input
              type="text"
              placeholder={lang === "en" ? "e.g. DCA monthly" : "mis. DCA bulanan"}
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
          {saving
            ? (lang === "en" ? "Saving..." : "Menyimpan...")
            : investment
              ? (lang === "en" ? "Update" : "Perbarui")
              : (lang === "en" ? "Add Investment" : "Tambah Investasi")}
        </button>
      </div>
    </div>
  );
}