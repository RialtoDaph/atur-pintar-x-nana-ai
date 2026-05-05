import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAppSettings } from "@/components/utils/useAppSettings";
import { INVESTMENT_TYPES_LIST } from "./investmentConstants";
import { useNavigate } from "react-router-dom";
import useLockBodyScroll from "@/hooks/useLockBodyScroll";

export default function AddInvestmentModal({ onClose, onSave }) {
  useLockBodyScroll();
  const { settings } = useAppSettings();
  const lang = settings.language === "en" ? "en" : "id";
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({
    account_id: "",
    name: "",
    type: "reksa_dana",
    purchase_date: "",
    notes: "",
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
    if (!name || !form.account_id) return;
    setSaving(true);
    try {
      await onSave({
        account_id: form.account_id,
        name,
        type: form.type,
        purchase_date: form.purchase_date || undefined,
        notes: form.notes || undefined,
        initial_amount: 0,
        current_value: 0,
      });
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]";
  const labelCls = "text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block";

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
        <div role="dialog" aria-modal="true" className="bg-white rounded-3xl shadow-2xl p-6 overflow-y-auto overscroll-contain pointer-events-auto animate-slide-up-sheet w-[calc(100%-24px)] sm:w-full sm:max-w-md" style={{ maxHeight: '100%' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#1A1A1A]">
            {lang === "en" ? "Add Investment" : "Tambah Investasi"}
          </h2>
          <button onClick={onClose} className="text-[#9B9B9B] hover:text-[#1A1A1A]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          {/* Nama */}
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

          {/* Tipe */}
          <div>
            <label className={labelCls}>{lang === "en" ? "Type" : "Tipe"}</label>
            <select
              className={inputCls}
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            >
              {INVESTMENT_TYPES_LIST.map(t => (
                <option key={t.key} value={t.key}>
                  {t.emoji} {lang === "en" ? t.label_en : t.label_id}
                </option>
              ))}
            </select>
          </div>

          {/* Platform / Dompet */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`${labelCls} mb-0`}>
                {lang === "en" ? "Wallet / Platform" : "Dompet / Platform"} <span className="text-[#FF6B6B] normal-case">*</span>
              </label>
              {accounts.length > 0 && !form.account_id && (
                <span className="text-[10px] font-semibold text-[#FF6A00] uppercase tracking-wider">
                  {lang === "en" ? "Required" : "Wajib pilih"}
                </span>
              )}
            </div>
            {accounts.length === 0 ? (
              <div className="border border-[#E2E8F0] rounded-xl px-4 py-3 bg-[#FFF5F5] space-y-2">
                <p className="text-sm text-[#C84545]">
                  {lang === "en" ? "No investment wallets yet." : "Belum ada dompet investasi."}
                </p>
                <button
                  onClick={() => navigate("/Accounts")}
                  className="text-xs font-semibold text-[#FF6A00] hover:text-[#e05e00] underline"
                >
                  {lang === "en" ? "Go to Accounts" : "Buka Rekening"}
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {accounts.map(acc => {
                  const selected = form.account_id === acc.id;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, account_id: acc.id }))}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${selected ? "border-[#FF6A00] bg-[#FF6A00] text-white" : "border-[#E2E8F0] bg-white text-[#1A1A1A] hover:border-[#FF6A00]/50"}`}
                    >
                      <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {acc.logo_url
                          ? <img src={acc.logo_url} alt={acc.name} className="w-full h-full object-contain" />
                          : <span className="text-[10px]">{acc.icon || "💼"}</span>
                        }
                      </span>
                      {acc.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tanggal */}
          <div>
            <label className={labelCls}>{lang === "en" ? "Start Date" : "Tanggal Mulai"}</label>
            <input
              type="date"
              className={inputCls}
              value={form.purchase_date}
              onChange={e => setForm(f => ({ ...f, purchase_date: e.target.value }))}
            />
          </div>

          {/* Catatan */}
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
          disabled={saving || !form.name.trim() || !form.account_id}
          className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-[#FF6A00] disabled:opacity-40 hover:bg-[#e05e00] transition-colors"
        >
          {saving ? "Menyimpan..." : (lang === "en" ? "Add Investment" : "Tambah Investasi")}
        </button>
        </div>
      </div>
    </>
  );
}