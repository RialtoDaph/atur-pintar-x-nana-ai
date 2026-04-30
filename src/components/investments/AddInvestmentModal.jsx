import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAppSettings } from "@/components/utils/useAppSettings";
import { INVESTMENT_TYPES_LIST } from "./investmentConstants";
import { useNavigate } from "react-router-dom";

export default function AddInvestmentModal({ onClose, onSave }) {
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
    if (!name) return;
    setSaving(true);
    try {
      await onSave({
        account_id: form.account_id || undefined,
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
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
            <label className={labelCls}>{lang === "en" ? "Wallet / Platform" : "Dompet / Platform"}</label>
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
              <div className="flex flex-col gap-1">
                {accounts.map(acc => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, account_id: acc.id }))}
                    className={`flex items-center gap-2 py-1.5 text-sm text-left transition-colors ${form.account_id === acc.id ? "text-[#FF6A00] font-semibold" : "text-[#1A1A1A]"}`}
                  >
                    <div className="w-6 h-6 rounded-lg bg-[#F2F4F7] flex items-center justify-center overflow-hidden flex-shrink-0">
                      {acc.logo_url
                        ? <img src={acc.logo_url} alt={acc.name} className="w-full h-full object-contain" />
                        : <span className="text-sm">{acc.icon || "💼"}</span>
                      }
                    </div>
                    {acc.name}
                  </button>
                ))}
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
          disabled={saving || !form.name.trim()}
          className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-[#FF6A00] disabled:opacity-40 hover:bg-[#e05e00] transition-colors"
        >
          {saving ? "Menyimpan..." : (lang === "en" ? "Add Investment" : "Tambah Investasi")}
        </button>
      </div>
    </div>
  );
}