import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAppSettings } from "@/components/utils/useAppSettings";
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

  const TYPES = [
    { value: "saham", label: "Saham" },
    { value: "reksa_dana", label: "Reksa Dana" },
    { value: "crypto", label: "Crypto" },
    { value: "deposito", label: "Deposito" },
    { value: "obligasi", label: "Obligasi" },
    { value: "emas", label: "Emas" },
    { value: "lainnya", label: "Lainnya" },
  ];

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        account_id: form.account_id || undefined,
        name: form.name.trim(),
        type: form.type,
        initial_amount: 0,
        current_value: 0,
        purchase_date: form.purchase_date || undefined,
        notes: form.notes || undefined,
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
            {investment ? "Edit Investasi" : "Tambah Investasi"}
          </h2>
          <button onClick={onClose} className="text-[#9B9B9B] hover:text-[#1A1A1A]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          {/* Nama aset */}
          <div>
            <label className={labelCls}>Nama Aset</label>
            <input
              type="text"
              placeholder="mis. Reksa Dana Pertumbuhan, BTC, BBCA"
              className={inputCls}
              value={form.name}
              autoFocus
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>

          {/* Tipe */}
          <div>
            <label className={labelCls}>Tipe Investasi</label>
            <select
              className={inputCls}
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            >
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {/* Platform / Wallet */}
          <div>
            <label className={labelCls}>Platform / Dompet</label>
            {accounts.length === 0 ? (
              <div className="border border-[#E2E8F0] rounded-xl px-4 py-3 bg-[#FFF5F5] space-y-2">
                <p className="text-sm text-[#C84545]">Belum ada dompet investasi.</p>
                <button
                  onClick={() => navigate("/Accounts")}
                  className="text-xs font-semibold text-[#FF6A00] underline"
                >
                  Buka Rekening
                </button>
              </div>
            ) : (
              <select
                className={inputCls}
                value={form.account_id}
                onChange={e => setForm(f => ({ ...f, account_id: e.target.value }))}
              >
                <option value="">-- Pilih platform --</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            )}
          </div>

          {/* Tanggal */}
          <div>
            <label className={labelCls}>Tanggal Mulai (opsional)</label>
            <input
              type="date"
              className={inputCls}
              value={form.purchase_date}
              onChange={e => setForm(f => ({ ...f, purchase_date: e.target.value }))}
            />
          </div>

          {/* Catatan */}
          <div>
            <label className={labelCls}>Catatan (opsional)</label>
            <input
              type="text"
              placeholder="mis. DCA bulanan"
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
          {saving ? "Menyimpan..." : investment ? "Perbarui" : "Tambah Investasi"}
        </button>
      </div>
    </div>
  );
}