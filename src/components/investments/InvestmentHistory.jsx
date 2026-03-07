import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2 } from "lucide-react";
import { useAppSettings } from "@/components/utils/AppSettingsContext";

const TX_TYPE_LABELS = {
  id: { buy: "Beli", sell: "Jual", dividend: "Dividen", adjustment: "Penyesuaian" },
  en: { buy: "Buy", sell: "Sell", dividend: "Dividend", adjustment: "Adjustment" },
};

const TX_TYPE_COLORS = {
  buy: "bg-[#00C9A7]/10 text-[#00C9A7]",
  sell: "bg-[#FF6B6B]/10 text-[#FF6B6B]",
  dividend: "bg-[#4F7CFF]/10 text-[#4F7CFF]",
  adjustment: "bg-[#F5A623]/10 text-[#F5A623]",
};

export default function InvestmentHistory({ investmentId, formatCurrency }) {
  const { settings } = useAppSettings();
  const lang = settings.language === 'en' ? 'en' : 'id';
  const typeLabels = TX_TYPE_LABELS[lang];

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "buy", quantity: "", price_per_unit: "", transaction_date: "", notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, [investmentId]);

  async function loadTransactions() {
    setLoading(true);
    const data = await base44.entities.InvestmentTransaction.filter(
      { investment_id: investmentId },
      "-transaction_date"
    );
    setTransactions(data);
    setLoading(false);
  }

  async function handleAddTx() {
    if (!form.transaction_date) return;
    setSaving(true);
    const qty = parseFloat(form.quantity) || 0;
    const price = parseFloat(form.price_per_unit) || 0;
    await base44.entities.InvestmentTransaction.create({
      investment_id: investmentId,
      type: form.type,
      quantity: qty || undefined,
      price_per_unit: price || undefined,
      total_amount: qty && price ? qty * price : undefined,
      transaction_date: form.transaction_date,
      notes: form.notes || undefined,
    });
    setForm({ type: "buy", quantity: "", price_per_unit: "", transaction_date: "", notes: "" });
    setShowForm(false);
    setSaving(false);
    loadTransactions();
  }

  async function handleDelete(id) {
    await base44.entities.InvestmentTransaction.delete(id);
    loadTransactions();
  }

  const dateLocale = lang === 'en' ? 'en-US' : 'id-ID';
  const inputCls = "w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC]";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[#1A1A1A]">
          {lang === 'en' ? 'Transaction History' : 'Riwayat Transaksi'}
          {transactions.length > 0 && (
            <span className="ml-2 text-xs font-normal text-[#8FA4C8]">({transactions.length})</span>
          )}
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 text-xs text-[#FF6A00] font-semibold hover:text-[#e05e00]"
        >
          <Plus className="w-3.5 h-3.5" />
          {lang === 'en' ? 'Add' : 'Tambah'}
        </button>
      </div>

      {showForm && (
        <div className="bg-[#F8FAFC] rounded-xl p-4 mb-4 space-y-3 border border-[#E2E8F0]">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-semibold text-[#8FA4C8] uppercase tracking-widest block mb-1">
                {lang === 'en' ? 'Type' : 'Jenis'}
              </label>
              <select className={inputCls} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-[#8FA4C8] uppercase tracking-widest block mb-1">
                {lang === 'en' ? 'Date' : 'Tanggal'}
              </label>
              <input type="date" className={inputCls} value={form.transaction_date}
                onChange={e => setForm(f => ({ ...f, transaction_date: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-semibold text-[#8FA4C8] uppercase tracking-widest block mb-1">
                {lang === 'en' ? 'Qty' : 'Jumlah'}
              </label>
              <input type="number" min="0" placeholder="0" className={inputCls}
                value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-[#8FA4C8] uppercase tracking-widest block mb-1">
                {lang === 'en' ? 'Price/Unit' : 'Harga/Unit'}
              </label>
              <input type="number" min="0" placeholder="0" className={inputCls}
                value={form.price_per_unit} onChange={e => setForm(f => ({ ...f, price_per_unit: e.target.value }))} />
            </div>
          </div>
          <input type="text" placeholder={lang === 'en' ? 'Notes (optional)' : 'Catatan (opsional)'} className={inputCls}
            value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-xl text-sm text-[#8FA4C8] border border-[#E2E8F0] hover:bg-[#F8FAFC]">
              {lang === 'en' ? 'Cancel' : 'Batal'}
            </button>
            <button onClick={handleAddTx} disabled={saving || !form.transaction_date}
              className="flex-1 py-2 rounded-xl text-sm font-semibold text-white bg-[#FF6A00] disabled:opacity-40 hover:bg-[#e05e00]">
              {saving ? '...' : lang === 'en' ? 'Save' : 'Simpan'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((n) => <div key={n} className="h-14 bg-[#F8FAFC] rounded-xl animate-pulse" />)}
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-[#8FA4C8]">
            {lang === 'en' ? 'No transactions yet' : 'Belum ada transaksi'}
          </p>
          <p className="text-xs text-[#CBD5E0] mt-1">
            {lang === 'en' ? 'Tap + to add the first one' : 'Tap + untuk menambah transaksi'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-xl">
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TX_TYPE_COLORS[tx.type] || 'bg-gray-100 text-gray-500'}`}>
                  {typeLabels[tx.type] || tx.type}
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#1A1A1A]">
                    {tx.total_amount ? formatCurrency(tx.total_amount) : '-'}
                  </p>
                  {tx.quantity && tx.price_per_unit && (
                    <p className="text-[10px] text-[#8FA4C8]">
                      {tx.quantity} × {formatCurrency(tx.price_per_unit)}
                    </p>
                  )}
                  {tx.notes && <p className="text-[10px] text-[#8FA4C8] italic">{tx.notes}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#8FA4C8]">
                  {new Date(tx.transaction_date).toLocaleDateString(dateLocale)}
                </span>
                <button onClick={() => handleDelete(tx.id)} className="text-[#CBD5E0] hover:text-[#FF6B6B] transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}