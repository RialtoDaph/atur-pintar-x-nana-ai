import { useState } from "react";
import { X } from "lucide-react";
import { useAppSettings } from "@/components/utils/useAppSettings";

export default function AddInvestmentTransactionModal({ investment, onClose, onSave }) {
  const { settings } = useAppSettings();
  const lang = settings.language === "en" ? "en" : "id";

  const [form, setForm] = useState({
    type: "buy",
    total_amount: "",
    transaction_date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const amount = parseFloat(form.total_amount) || 0;
    if (!form.type || amount <= 0) return;

    setSaving(true);
    try {
      await onSave({
        investment_id: investment.id,
        type: form.type,
        total_amount: amount,
        transaction_date: form.transaction_date,
        notes: form.notes || undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]";
  const labelCls = "text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block";
  const isValid = form.type && parseFloat(form.total_amount) > 0;

  const typeLabels = {
    buy: lang === "en" ? "Buy" : "Beli",
    sell: lang === "en" ? "Sell" : "Jual",
    dividend: lang === "en" ? "Dividend" : "Dividen",
    adjustment: lang === "en" ? "Adjustment" : "Penyesuaian",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#1A1A1A]">
            {lang === "en" ? "Add Transaction" : "Tambah Transaksi"}
          </h2>
          <button onClick={onClose} className="text-[#9B9B9B] hover:text-[#1A1A1A]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          {/* Investment name (display only) */}
          <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
            <p className="text-xs text-[#8FA4C8] font-semibold">{lang === "en" ? "Investment" : "Investasi"}</p>
            <p className="text-sm font-bold text-[#1A1A1A] mt-1">{investment.name}</p>
          </div>

          {/* Type */}
          <div>
            <label className={labelCls}>{lang === "en" ? "Transaction Type" : "Jenis Transaksi"}</label>
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className={inputCls}
            >
              <option value="buy">{typeLabels.buy}</option>
              <option value="sell">{typeLabels.sell}</option>
              <option value="dividend">{typeLabels.dividend}</option>
              <option value="adjustment">{typeLabels.adjustment}</option>
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className={labelCls}>{lang === "en" ? "Amount (Rp)" : "Nominal (Rp)"}</label>
            <input
              type="number"
              min="0"
              placeholder="0"
              className={inputCls}
              value={form.total_amount}
              onChange={e => setForm(f => ({ ...f, total_amount: e.target.value }))}
            />
          </div>

          {/* Date */}
          <div>
            <label className={labelCls}>{lang === "en" ? "Date" : "Tanggal"}</label>
            <input
              type="date"
              className={inputCls}
              value={form.transaction_date}
              onChange={e => setForm(f => ({ ...f, transaction_date: e.target.value }))}
            />
          </div>

          {/* Notes */}
          <div>
            <label className={labelCls}>{lang === "en" ? "Notes (optional)" : "Catatan (opsional)"}</label>
            <input
              type="text"
              placeholder={lang === "en" ? "e.g. Monthly DCA" : "mis. DCA bulanan"}
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
          {saving ? (lang === "en" ? "Saving..." : "Menyimpan...") : (lang === "en" ? "Add" : "Tambah")}
        </button>
      </div>
    </div>
  );
}