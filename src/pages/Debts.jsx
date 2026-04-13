import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, CreditCard, CheckCircle, Pencil, Crown, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import AddDebtModal from "@/components/debts/AddDebtModal.jsx";
import PayDebtModal from "@/components/debts/PayDebtModal";
import IOUSection from "@/components/splitbill/IOUSection";
import { useAppSettings } from "@/components/utils/useAppSettings";
import DebtNanaPanel from "@/components/debts/DebtNanaPanel";
import DebtDetailModal from "@/components/debts/DebtDetailModal";
import PullToRefresh from "@/components/utils/PullToRefresh";
import { toast } from "sonner";

const FREE_DEBTS_LIMIT = 2;

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
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editDebt, setEditDebt] = useState(null);
  const [user, setUser] = useState(null);
  const [paymentModal, setPaymentModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [markPaidConfirm, setMarkPaidConfirm] = useState(null);
  const [detailDebt, setDetailDebt] = useState(null);
  const [activeTab, setActiveTab] = useState("active");

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
    }).catch(() => {});
  }, []);

  useEffect(() => { if (user) loadData(); }, [user]);

  useEffect(() => {
    if (!user?.email) return;
    const unsub = base44.entities.Debt.subscribe(() => loadData());
    return unsub;
  }, [user?.email]);

  async function loadData() {
    setLoading(true);
    const [d, accs] = await Promise.all([
      base44.entities.Debt.filter({ created_by: user.email }, "-created_date"),
      base44.entities.Account.filter({ created_by: user.email }),
    ]);
    setDebts(d);
    setAccounts(accs || []);
    setLoading(false);
  }

  async function handlePayment({ amount, note, date, accountId }) {
    const debt = debts.find(d => d.id === paymentModal);
    if (!debt) return;

    const newRemaining = Math.max(debt.remaining_amount - amount, 0);
    const newStatus = newRemaining <= 0 ? "paid" : "active";

    setDebts(prev => prev.map(d => d.id === debt.id ? { ...d, remaining_amount: newRemaining, status: newStatus } : d));
    try {
      const txData = {
        amount,
        type: "expense",
        category: "cicilan",
        note: note || `Cicilan ${debt.name}`,
        date: date || new Date().toISOString().split("T")[0],
        debt_id: debt.id,
        ...(accountId ? { account_id: accountId } : {}),
      };
      await Promise.all([
        base44.entities.Transaction.create(txData).then(async (tx) => {
          // Sync account balance if account selected
          if (accountId) {
            await base44.functions.invoke("syncTransactionChanges", {
              action: "create",
              transaction: txData,
            });
          }
        }),
        base44.entities.Debt.update(debt.id, {
          remaining_amount: newRemaining,
          status: newStatus,
        }),
      ]);
      setPaymentModal(null);
      toast.success(`Pembayaran cicilan ${debt.name} berhasil dicatat!`);
      if (newStatus === "paid") {
        toast.success(`🎉 ${debt.name} telah lunas!`);
      }
    } catch (error) {
      loadData();
    }
  }

  async function handleSaveNewDebt(data) {
    const debt = await base44.entities.Debt.create(data);
    // Auto-create recurring transaction if monthly_payment set
    if (data.monthly_payment > 0) {
      await base44.entities.Transaction.create({
        type: "expense",
        category: "cicilan",
        amount: data.monthly_payment,
        note: `Cicilan ${data.name}`,
        date: data.due_date || new Date().toISOString().split("T")[0],
        debt_id: debt.id,
        is_recurring: true,
        recurring_interval: "monthly",
      });
      toast.success(`Transaksi rutin cicilan ${data.name} berhasil dibuat.`);
    }
    setShowAdd(false);
    loadData();
  }

  async function markPaid(debt) {
    await base44.entities.Debt.update(debt.id, { status: "paid", remaining_amount: 0 });
    setMarkPaidConfirm(null);
    loadData();
  }

  async function handleDelete(id) {
    await base44.entities.Debt.delete(id);
    setDeleteConfirm(null);
    loadData();
  }

  const isPremium = user?.subscription_plan === "premium_monthly" || user?.subscription_plan === "premium_yearly";
  const activeDebts = debts.filter(d => d.status === "active");
  const paidDebts = debts.filter(d => d.status === "paid");
  const debtLimitReached = !isPremium && activeDebts.length >= FREE_DEBTS_LIMIT;
  const totalDebt = activeDebts.reduce((s, d) => s + d.remaining_amount, 0);
  const totalMonthly = activeDebts.reduce((s, d) => s + (d.monthly_payment || 0), 0);

  return (
    <PullToRefresh onRefresh={loadData}>
      <div className="min-h-screen bg-[#F2F4F7] pb-8">
        <div className="bg-gradient-to-b from-[#0A0A0A] to-[#0d0d0d] px-5 pt-10 pb-20">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[#8FA4C8] text-sm font-medium">{t('debts_management')}</p>
              <h1 className="text-white text-2xl font-bold mt-0.5">{t('debts_title')}</h1>
            </div>
            {debtLimitReached ? (
              <Link to="/Subscription" className="w-11 h-11 rounded-full bg-[#8FA4C8] flex items-center justify-center shadow-lg hover:bg-[#7a93b5] active:scale-95 transition-all" title="Upgrade untuk tambah lebih banyak utang">
                <Crown className="w-5 h-5 text-white" />
              </Link>
            ) : (
              <button
                onClick={() => setShowAdd(true)}
                className="w-11 h-11 rounded-full bg-[#F97316] flex items-center justify-center shadow-lg hover:bg-[#EA580C] active:scale-95 transition-all"
                style={{boxShadow: '0 4px 16px rgba(249,115,22,0.4)'}}
              >
                <Plus className="w-5 h-5 text-white" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 rounded-2xl p-4 border border-white/5">
              <p className="text-white/60 text-xs mb-1">{t('debts_total')}</p>
              <p className="text-white font-bold text-lg">{formatCurrency(totalDebt)}</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 border border-white/5">
              <p className="text-white/60 text-xs mb-1">{t('debts_monthly')}</p>
              <p className="text-white font-bold text-lg">{formatCurrency(totalMonthly)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 -mt-14 space-y-3">
        {debtLimitReached && (
          <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 border border-[#FF6A00]/20">
            <Crown className="w-5 h-5 text-[#F97316] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#1A1A1A]">Batas {FREE_DEBTS_LIMIT} utang aktif tercapai</p>
              <p className="text-xs text-[#8FA4C8]">Upgrade Premium untuk utang unlimited.</p>
            </div>
            <Link to="/Subscription" className="px-3 py-1.5 bg-[#F97316] text-white rounded-xl text-xs font-semibold hover:bg-[#EA580C] transition-colors flex-shrink-0">Upgrade</Link>
          </div>
        )}
        <IOUSection />
        <DebtNanaPanel debts={debts} />
        {/* Tabs */}
        <div className="flex bg-white rounded-2xl p-1 shadow-sm">
          <button onClick={() => setActiveTab("active")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "active" ? "bg-[#F97316] text-white" : "text-[#8FA4C8]"
            }`}>
            Aktif ({activeDebts.length})
          </button>
          <button onClick={() => setActiveTab("paid")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "paid" ? "bg-[#00C9A7] text-white" : "text-[#8FA4C8]"
            }`}>
            Lunas ({paidDebts.length})
          </button>
        </div>

        {loading ? (
          [...Array(2)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-28 animate-pulse" />)
        ) : activeTab === "active" && activeDebts.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <CreditCard className="w-10 h-10 text-[#8FA4C8] mx-auto mb-3" />
            <p className="text-[#4A5568] font-semibold">{t('debts_empty_title')}</p>
            <p className="text-[#8FA4C8] text-sm mt-1">{t('debts_empty_desc')}</p>
          </div>
        ) : activeTab === "active" ? (
          activeDebts.map(debt => {
            const type = DEBT_TYPES[debt.type] || DEBT_TYPES.lainnya;
            const progress = debt.total_amount > 0 ? ((debt.total_amount - debt.remaining_amount) / debt.total_amount) * 100 : 0;
            const monthsLeft = debt.monthly_payment > 0 ? Math.ceil(debt.remaining_amount / debt.monthly_payment) : null;
            return (
              <div key={debt.id} className="bg-white rounded-2xl p-5 shadow-md border border-[#F0F2F5] hover:shadow-lg transition-all duration-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-[#FF6B6B]/10 flex items-center justify-center text-xl flex-shrink-0">
                      {debt.icon || type.emoji}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-[#1A1A1A]">{debt.name}</p>
                      <p className="text-xs text-[#8FA4C8]">{type.label}{debt.interest_rate ? ` · ${debt.interest_rate}% p.a.` : ""}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 flex-shrink-0">
                    <button onClick={() => setDetailDebt(debt)} className="text-[#CBD5E0] hover:text-[#8FA4C8] transition-colors p-1.5" title="Lihat Detail">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => setPaymentModal(debt.id)} className="text-[#CBD5E0] hover:text-[#F97316] transition-colors p-1.5" title="Bayar cicilan">
                      <Plus className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditDebt(debt)} className="text-[#CBD5E0] hover:text-[#4F7CFF] transition-colors p-1.5" title="Edit">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => setMarkPaidConfirm(debt)} className="text-[#CBD5E0] hover:text-[#00C9A7] transition-colors p-1.5" title={t('debts_mark_paid_title')}>
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteConfirm(debt.id)} className="text-[#CBD5E0] hover:text-[#FF6B6B] transition-colors p-1.5">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-[#F8FAFC] rounded-xl p-2.5">
                    <p className="text-[10px] text-[#8FA4C8] mb-0.5">Total Awal</p>
                    <p className="font-bold text-sm text-[#1A1A1A]">{formatCurrency(debt.total_amount)}</p>
                  </div>
                  <div className="bg-[#F8FAFC] rounded-xl p-2.5">
                    <p className="text-[10px] text-[#8FA4C8] mb-0.5">{t('debts_remaining')}</p>
                    <p className="font-bold text-[#FF6B6B]">{formatCurrency(debt.remaining_amount)}</p>
                  </div>
                  {debt.monthly_payment > 0 && (
                    <div className="bg-[#F8FAFC] rounded-xl p-2.5">
                      <p className="text-[10px] text-[#8FA4C8] mb-0.5">{t('debts_installment')}</p>
                      <p className="font-bold text-[#1A1A1A]">{formatCurrency(debt.monthly_payment)}/bln</p>
                    </div>
                  )}
                  {monthsLeft && (
                    <div className="bg-[#4F7CFF]/10 rounded-xl p-2.5">
                      <p className="text-[10px] text-[#4F7CFF] mb-0.5">Est. Lunas</p>
                      <p className="font-bold text-[#4F7CFF]">{monthsLeft} bln lagi</p>
                    </div>
                  )}
                </div>
                <div className="w-full bg-[#F2F4F7] rounded-full h-2 mb-1">
                  <div className="h-2 rounded-full bg-[#00C9A7] transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
                </div>
                <div className="flex justify-between text-xs text-[#8FA4C8]">
                  <span>{Math.round(progress)}% terbayar</span>
                  {debt.due_date && <span>Jatuh tempo: {new Date(debt.due_date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>}
                </div>
              </div>
            );
          })
        ) : (
          paidDebts.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
              <CheckCircle className="w-10 h-10 text-[#E2E8F0] mx-auto mb-3" />
              <p className="text-[#4A5568] font-semibold">Belum ada utang yang lunas</p>
            </div>
          ) : (
            paidDebts.map(debt => {
              const paid = debt.total_amount - debt.remaining_amount;
              return (
                <div key={debt.id} className="bg-green-50 rounded-2xl p-5 shadow-sm border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-xl">
                        {debt.icon || "✅"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-green-900">{debt.name}</p>
                          <span className="text-[10px] bg-green-500 text-white font-bold px-2 py-0.5 rounded-full">LUNAS</span>
                        </div>
                        <p className="text-xs text-green-700">Total dibayar: {formatCurrency(debt.total_amount)}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setDetailDebt(debt)} className="text-green-400 hover:text-green-600 transition-colors p-1.5">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteConfirm(debt.id)} className="text-green-300 hover:text-red-400 transition-colors p-1.5">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div className="h-2 rounded-full bg-green-500" style={{ width: "100%" }} />
                  </div>
                </div>
              );
            })
          )
        )}
      </div>

      {showAdd && (
        <AddDebtModal
          onClose={() => setShowAdd(false)}
          onSave={handleSaveNewDebt}
        />
      )}

      {editDebt && (
        <AddDebtModal
          debt={editDebt}
          onClose={() => setEditDebt(null)}
          onSave={async (data) => {
            await base44.entities.Debt.update(editDebt.id, data);
            setEditDebt(null);
            loadData();
          }}
        />
      )}

      {paymentModal && (
        <PayDebtModal
          debt={debts.find(d => d.id === paymentModal)}
          accounts={accounts}
          onClose={() => setPaymentModal(null)}
          onConfirm={handlePayment}
        />
      )}

      {markPaidConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <p className="text-sm font-semibold text-[#1A1A1A] mb-1">{t('debts_mark_paid_title')}</p>
            <p className="text-xs text-[#8FA4C8] mb-4">{t('debts_mark_paid_confirm_msg', { name: markPaidConfirm.name })}</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setMarkPaidConfirm(null)} className="px-4 py-2 rounded-lg text-sm font-semibold text-[#8FA4C8] hover:bg-[#F2F4F7] transition-colors">
                {t('cancel')}
              </button>
              <button onClick={() => markPaid(markPaidConfirm)} className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#00C9A7] hover:bg-[#00b395] transition-colors">
                ✅ {t('debts_paid')}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailDebt && <DebtDetailModal debt={detailDebt} onClose={() => setDetailDebt(null)} />}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <p className="text-sm font-semibold text-[#1A1A1A] mb-4">{t('debts_delete_confirm')}</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-[#8FA4C8] hover:bg-[#F2F4F7] transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#FF6B6B] hover:bg-[#FF5252] transition-colors"
              >
                {t('alerts_delete')}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
      </PullToRefresh>
      );
      }