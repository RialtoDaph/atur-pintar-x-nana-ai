import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, CreditCard, CheckCircle } from "lucide-react";
import AddDebtModal from "@/components/debts/AddDebtModal.jsx";
import IOUSection from "@/components/splitbill/IOUSection";
import { useAppSettings } from "@/components/utils/useAppSettings";

const DEBT_TYPES = {
  kpr: { label: "KPR", emoji: "🏠" },
  kendaraan: { label: "Kendaraan", emoji: "🚗" },
  kartu_kredit: { label: "Kartu Kredit", emoji: "💳" },
  pinjaman_pribadi: { label: "Pinjaman Pribadi", emoji: "🤝" },
  lainnya: { label: "Lainnya", emoji: "📋" },
};

export default function DebtsPage() {
  const { t, formatCurrency } = useAppSettings();
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
    }).catch(() => {});
  }, []);

  useEffect(() => { if (user) loadData(); }, [user]);

  async function loadData() {
    setLoading(true);
    const d = await base44.entities.Debt.filter({ created_by: user.email }, "-created_date");
    setDebts(d);
    setLoading(false);
  }

  async function markPaid(debt) {
    await base44.entities.Debt.update(debt.id, { status: "paid", remaining_amount: 0 });
    loadData();
  }

  async function handleDelete(id) {
    if (!window.confirm(t('debts_delete_confirm') || "Hapus utang ini?")) return;
    await base44.entities.Debt.delete(id);
    loadData();
  }

  const activeDebts = debts.filter(d => d.status === "active");
  const paidDebts = debts.filter(d => d.status === "paid");
  const totalDebt = activeDebts.reduce((s, d) => s + d.remaining_amount, 0);
  const totalMonthly = activeDebts.reduce((s, d) => s + (d.monthly_payment || 0), 0);

  return (
    <div className="min-h-screen bg-[#F2F4F7] pb-8">
      <div className="bg-[#0A0A0A] px-5 pt-10 pb-20">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[#8FA4C8] text-sm font-medium">{t('debts_management')}</p>
              <h1 className="text-white text-2xl font-bold mt-0.5">{t('debts_title')}</h1>
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="w-10 h-10 rounded-full bg-[#FF6A00] flex items-center justify-center shadow-lg hover:bg-[#e05e00] transition-colors"
            >
              <Plus className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 rounded-2xl p-4">
              <p className="text-white/60 text-xs mb-1">{t('debts_total')}</p>
              <p className="text-white font-bold text-lg">{formatCurrency(totalDebt)}</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-4">
              <p className="text-white/60 text-xs mb-1">{t('debts_monthly')}</p>
              <p className="text-white font-bold text-lg">{formatCurrency(totalMonthly)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 -mt-10 space-y-3">
        <IOUSection />
        {loading ? (
          [...Array(2)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-28 animate-pulse" />)
        ) : activeDebts.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <CreditCard className="w-10 h-10 text-[#8FA4C8] mx-auto mb-3" />
            <p className="text-[#4A5568] font-semibold">{t('debts_empty_title')}</p>
            <p className="text-[#8FA4C8] text-sm mt-1">{t('debts_empty_desc')}</p>
          </div>
        ) : (
          activeDebts.map(debt => {
            const type = DEBT_TYPES[debt.type] || DEBT_TYPES.lainnya;
            const progress = debt.total_amount > 0 ? ((debt.total_amount - debt.remaining_amount) / debt.total_amount) * 100 : 0;
            return (
              <div key={debt.id} className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#FF6B6B]/10 flex items-center justify-center text-xl">
                      {debt.icon || type.emoji}
                    </div>
                    <div>
                      <p className="font-semibold text-[#1A1A1A]">{debt.name}</p>
                      <p className="text-xs text-[#8FA4C8]">{type.label}{debt.interest_rate ? ` · ${debt.interest_rate}% p.a.` : ""}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => markPaid(debt)} className="text-[#CBD5E0] hover:text-[#00C9A7] transition-colors" title={t('debts_mark_paid_title')}>
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(debt.id)} className="text-[#CBD5E0] hover:text-[#FF6B6B] transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#8FA4C8]">{t('debts_remaining')}: <span className="text-[#FF6B6B] font-bold">{formatCurrency(debt.remaining_amount)}</span></span>
                  {debt.monthly_payment && <span className="text-[#8FA4C8]">{t('debts_installment')}: <span className="font-semibold text-[#1A1A1A]">{formatCurrency(debt.monthly_payment)}/bln</span></span>}
                </div>
                <div className="w-full bg-[#F2F4F7] rounded-full h-2">
                  <div className="h-2 rounded-full bg-[#00C9A7] transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-[#8FA4C8] mt-1">{Math.round(progress)}{t('debts_paid_pct')}</p>
              </div>
            );
          })
        )}

        {paidDebts.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-sm font-semibold text-[#8FA4C8] mb-2">✅ {t('debts_paid')} ({paidDebts.length})</p>
            {paidDebts.map(debt => (
              <div key={debt.id} className="flex items-center justify-between py-2 border-t border-[#F2F4F7] first:border-0">
                <span className="text-sm text-[#4A5568] line-through">{debt.name}</span>
                <button onClick={() => handleDelete(debt.id)} className="text-[#CBD5E0] hover:text-[#FF6B6B] transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <AddDebtModal
          onClose={() => setShowAdd(false)}
          onSave={async (data) => {
            await base44.entities.Debt.create(data);
            setShowAdd(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}