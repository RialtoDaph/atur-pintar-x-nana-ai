import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Plus, Minus, Trash2, CheckCircle, TrendingUp, Crown } from "lucide-react";
import { useAppSettings } from "@/components/utils/useAppSettings";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import AddTransactionModal from "@/components/goals/AddTransactionModal";
import AddGoalModal from "@/components/goals/AddGoalModal";
import AddSavingsModal from "@/components/goals/AddSavingsModal";
import GoalCard from "@/components/goals/GoalCard";
import GoalsNanaPanel from "@/components/goals/GoalsNanaPanel";
import { toast } from "sonner";
import PullToRefresh from "@/components/utils/PullToRefresh";

const FREE_GOALS_LIMIT = 2;

const COLORS = {
  blue: "#4F7CFF",
  green: "#34C87A",
  orange: "#F5A623",
  purple: "#9B59B6",
  pink: "#E91E8C",
  teal: "#1ABC9C",
};

export default function Goals() {
  const navigate = useNavigate();
  const { t, formatCurrency } = useAppSettings();
  const urlParams = new URLSearchParams(window.location.search);
  const goalId = urlParams.get("id");

  const [goals, setGoals] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTxModal, setShowTxModal] = useState(null);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [txFilter, setTxFilter] = useState("all");
  const [savingsGoal, setSavingsGoal] = useState(null);
  const [raiseTargetGoal, setRaiseTargetGoal] = useState(null);
  const [deleteConfirmGoal, setDeleteConfirmGoal] = useState(null);
  const [showDetailDeleteConfirm, setShowDetailDeleteConfirm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  const goal = goals.find((g) => g.id === goalId) || null;

  const [user, setUser] = useState(null);
  // 🎁 Free access window — semua user dapat unlimited goals sampai tanggal ini
  const FREE_ACCESS_UNTIL = "2099-12-31";
  const todayStr = new Date().toISOString().slice(0, 10);
  const inFreeWindow = todayStr <= FREE_ACCESS_UNTIL;
  const isPremium = inFreeWindow || user?.role === "admin" || user?.subscription_plan === "premium_monthly" || user?.subscription_plan === "premium_yearly";
  const goalsLimitReached = !isPremium && goals.length >= FREE_GOALS_LIMIT;

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) loadData();
  }, [goalId, user]);

  useEffect(() => {
    if (!user?.email) return;
    let timeout;
    const debouncedReload = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => loadData(), 800);
    };
    const unsub1 = base44.entities.SavingsGoal.subscribe(debouncedReload);
    const unsub2 = base44.entities.Transaction.subscribe(debouncedReload);
    return () => { clearTimeout(timeout); unsub1(); unsub2(); };
  }, [user?.email]);

  async function loadData() {
    try {
      setLoading(true);
      const [g, goalTxs] = await Promise.all([
        base44.entities.SavingsGoal.filter({ created_by: user.email }, "-created_date"),
        goalId ? base44.entities.Transaction.filter({ goal_id: goalId, created_by: user.email }, "-created_date") : Promise.resolve([]),
      ]);
      setGoals(g);
      setTransactions(goalTxs);
    } catch (err) {
      if (err?.message?.toLowerCase?.().includes("rate limit")) {
        // Silently ignore rate limit — subscription will retry later
      } else {
        console.error("Failed to load goals:", err);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleTransaction(amount, type, note) {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) return;
    const isDeposit = type === "deposit";
    const tx = isDeposit ? {
      goal_id: goalId,
      amount: numAmount,
      type: "savings",
      note,
      date: new Date().toISOString().split("T")[0],
    } : null;
    const newAmount =
      type === "deposit"
        ? (goal.current_amount || 0) + numAmount
        : Math.max((goal.current_amount || 0) - numAmount, 0);

    const previousGoals = goals;
    const optimisticTx = tx ? { ...tx, id: `temp_${Date.now()}`, created_date: new Date().toISOString() } : null;
    const isCompleted = (goal.target_amount || 0) > 0 && newAmount >= goal.target_amount;
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, current_amount: newAmount, status: isCompleted ? "completed" : "active" } : g));
    if (optimisticTx) setTransactions(prev => [optimisticTx, ...prev]);
    setShowTxModal(null);
    try {
       const ops = [
         base44.entities.SavingsGoal.update(goalId, {
           current_amount: newAmount,
           status: isCompleted ? "completed" : "active",
         }),
       ];
       if (tx) ops.push(base44.entities.Transaction.create(tx));
       await Promise.all(ops);
       if (tx) window.dispatchEvent(new CustomEvent("transaction-added"));
     } catch (error) {
      setGoals(previousGoals);
      if (optimisticTx) setTransactions(prev => prev.filter(t => t.id !== optimisticTx.id));
      loadData();
    }
  }

  async function handleAddSavings(goal, { amount, accountId, date, note }) {
    const newAmount = (goal.current_amount || 0) + amount;
    const isCompleted = (goal.target_amount || 0) > 0 && newAmount >= goal.target_amount;
    const newStatus = isCompleted ? "completed" : goal.status;
    try {
      await Promise.all([
        (async () => {
          const tx = await base44.entities.Transaction.create({
            type: "savings", amount, account_id: accountId,
            goal_id: goal.id, date, note: note || `Tabungan ${goal.name}`,
          });
          window.dispatchEvent(new CustomEvent("transaction-added"));
          return tx;
        })(),
        base44.entities.SavingsGoal.update(goal.id, { current_amount: newAmount, status: newStatus }),
        base44.entities.Account.filter({ id: accountId }).then(([acc]) => {
          if (acc) return base44.entities.Account.update(accountId, { balance: Math.max((acc.balance || 0) - amount, 0) });
        }),
      ]);
      setSavingsGoal(null);
      if (newStatus === "completed") toast.success(`🎉 Goal "${goal.name}" berhasil tercapai!`);
      else toast.success("Dana berhasil ditambahkan.");
      loadData();
    } catch {
      toast.error("Gagal menambahkan dana. Coba lagi.");
      loadData();
    }
  }

  async function handleDelete() {
    if (!goalId) return;
    const txs = await base44.entities.Transaction.filter({ goal_id: goalId });
    await Promise.all(txs.map(tx => base44.entities.Transaction.update(tx.id, { goal_id: null })));
    await base44.entities.SavingsGoal.delete(goalId);
    navigate(createPageUrl("Goals"));
  }

  // Optimistic delete with 5s Undo. Hide instantly, unlink + delete after window.
  function handleDeleteFromList(id) {
    setDeleteConfirmGoal(null);
    const snapshot = goals;
    const target = goals.find(g => g.id === id);
    // Optimistic: remove from UI immediately
    setGoals(prev => prev.filter(g => g.id !== id));

    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled) return;
      try {
        const txs = await base44.entities.Transaction.filter({ goal_id: id });
        await Promise.all(txs.map(tx => base44.entities.Transaction.update(tx.id, { goal_id: null })));
        await base44.entities.SavingsGoal.delete(id);
        loadData();
      } catch {
        // Rollback
        setGoals(snapshot);
        toast.error("Gagal menghapus goal. Coba lagi.", {
          action: { label: "Coba lagi", onClick: () => handleDeleteFromList(id) },
        });
      }
    }, 5000);

    toast(`Goal "${target?.name || ""}" dihapus`, {
      action: {
        label: "Urungkan",
        onClick: () => {
          cancelled = true;
          clearTimeout(timer);
          setGoals(snapshot);
        },
      },
      duration: 5000,
    });
  }

  async function handleAddGoal(data) {
    // Use editingGoal (from list "Edit" button) as the source of truth for edit vs create.
    // The old `goal` var (from URL ?id=) is null in list view, but editingGoal can be set
    // when user clicked Edit on a card — we need to route correctly in both cases.
    const target = editingGoal?.id ? editingGoal : (goal?.id ? goal : null);
    try {
      if (target?.id) {
        await base44.entities.SavingsGoal.update(target.id, data);
        toast.success("Tujuan berhasil diperbarui");
      } else {
        await base44.entities.SavingsGoal.create(data);
        toast.success("Tujuan berhasil dibuat 🎯");
      }
      setShowAddGoal(false);
      setEditingGoal(null);
      await loadData();
    } catch (err) {
      console.error("Gagal menyimpan tujuan:", err);
      toast.error("Gagal menyimpan tujuan. Coba lagi.");
      throw err;
    }
  }

  async function handlePause(goal) {
    await base44.entities.SavingsGoal.update(goal.id, { status: "paused" });
    setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, status: "paused" } : g));
  }

  async function handleResume(goal) {
    await base44.entities.SavingsGoal.update(goal.id, { status: "active" });
    setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, status: "active" } : g));
  }

  async function handleRaiseTarget(goal) {
    setRaiseTargetGoal(goal);
    setEditingGoal({ ...goal, _raiseOnly: true });
    setShowAddGoal(true);
  }

  // Only show full-screen spinner on detail view while loading (list view has its own skeleton at line ~432)
  if (loading && goalId && !goal) {
    return (
      <div className="min-h-screen bg-[#F2F4F7] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#1A1A1A] border-t-transparent animate-spin" />
      </div>
    );
  }

  // Goal detail view
  if (goalId && goal) {
    const color = COLORS[goal.color] || COLORS.blue;
    const progress = goal.target_amount > 0
      ? Math.min((goal.current_amount / goal.target_amount) * 100, 100)
      : 0;
    const remaining = Math.max(goal.target_amount - (goal.current_amount || 0), 0);

    return (
      <PullToRefresh onRefresh={loadData}>
      <div className="min-h-screen bg-[#F2F4F7] max-w-lg mx-auto px-4 py-6 pb-32">
        <Link to={createPageUrl("Goals")} className="flex items-center gap-2 text-[#9B9B9B] hover:text-[#0A0A0A] text-sm mb-6 transition-colors tap-highlight-fix">
          <ArrowLeft className="w-4 h-4" /> {t('goals_back')}
        </Link>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#E2E8F0] mb-5">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{goal.icon || "💰"}</span>
               <div className="flex-1">
                 <h1 className="text-xl font-bold text-[#1A1A1A]">{goal.name}</h1>
                 {goal.description && <p className="text-sm text-[#8FA4C8] mt-0.5">{goal.description}</p>}
               </div>
            </div>
            {goal.status === "completed" && (
              <CheckCircle className="w-6 h-6 text-[#00C9A7]" />
            )}
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-bold text-[#1A1A1A] text-2xl">
                {formatCurrency(goal.current_amount || 0)}
              </span>
              <span className="text-[#9B9B9B] self-end text-sm">{t('goals_of')} {formatCurrency(goal.target_amount)}</span>
            </div>
            <div className="h-2 bg-[#F0F0EE] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${progress}%`, backgroundColor: color }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-[#9B9B9B]">{progress.toFixed(1)}{t('goals_achieved_pct')}</span>
              {remaining > 0 && <span className="text-xs text-[#9B9B9B]">{t('goals_remaining')} {formatCurrency(remaining)}</span>}
            </div>
          </div>

          {goal.deadline && (
            <p className="text-xs text-[#9B9B9B] mb-4">
              🗓 {t('goals_target_label')}: {new Date(goal.deadline).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
            </p>
          )}

          <div className="space-y-2 mt-4">
            {goal.status !== "completed" && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowTxModal("deposit")}
                  aria-label="Tambah uang ke tujuan"
                  className="flex items-center justify-center gap-2 bg-[#1A1A1A] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#333] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] focus:ring-offset-2 tap-highlight-fix"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" /> {t('goals_add_money')}
                </button>
                <button
                  onClick={() => setShowTxModal("withdrawal")}
                  aria-label="Tarik uang dari tujuan"
                  className="flex items-center justify-center gap-2 bg-[#F2F4F7] text-[#1A1A1A] py-3 rounded-xl text-sm font-semibold hover:bg-[#E2E8F0] transition-colors border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#E2E8F0] focus:ring-offset-2 tap-highlight-fix"
                >
                  <Minus className="w-4 h-4" aria-hidden="true" /> {t('goals_withdraw')}
                </button>
              </div>
            )}
            <button
              onClick={() => setEditingGoal(goal)}
              className="w-full flex items-center justify-center gap-2 bg-[#F97316] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#EA580C] transition-colors tap-highlight-fix"
            >
              ✏️ {t('edit')} Tujuan
            </button>
          </div>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-[#1A1A1A]">{t('goals_activity')}</h2>
          <button onClick={() => setShowDetailDeleteConfirm(true)} className="text-xs text-red-400 hover:text-red-600 transition-colors flex items-center gap-1 tap-highlight-fix">
            <Trash2 className="w-3.5 h-3.5" /> {t('goals_delete_goal')}
          </button>
        </div>

        {transactions.length > 0 && (
          <div className="flex gap-2 mb-3">
            {["all", "deposit", "withdrawal"].map((f) => (
              <button
                key={f}
                onClick={() => setTxFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors tap-highlight-fix ${
                  txFilter === f ? "bg-[#1A1A1A] text-white" : "bg-[#F2F4F7] text-[#8FA4C8] hover:bg-[#E2E8F0]"
                }`}
              >
                {f === "all" ? t('tx_filter_all') : f === "deposit" ? `💰 ${t('goals_deposit')}` : `📤 ${t('goals_withdraw')}`}
              </button>
            ))}
          </div>
        )}

        {transactions.filter(tx => txFilter === "all" || (txFilter === "deposit" ? tx.type === "savings" : tx.type !== "savings")).length === 0 ? (
          <div className="text-center py-12 text-[#9B9B9B] text-sm">{t('goals_no_tx')}</div>
        ) : (
          <div className="space-y-2">
            {transactions.filter(tx => txFilter === "all" || (txFilter === "deposit" ? tx.type === "savings" : tx.type !== "savings")).map((tx) => (
              <div key={tx.id} className="bg-white rounded-2xl px-4 py-3.5 flex items-center justify-between shadow-sm border border-[#EFEFED]">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                    style={{
                      backgroundColor: tx.type === "savings" ? "#34C87A18" : "#FF525218",
                      color: tx.type === "savings" ? "#34C87A" : "#FF5252",
                    }}
                  >
                    {tx.type === "savings" ? "+" : "−"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1A1A1A]">{tx.note || (tx.type === "deposit" ? "Deposit" : "Withdrawal")}</p>
                    <p className="text-xs text-[#9B9B9B]">{new Date(tx.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</p>
                  </div>
                </div>
                <span
                  className="text-sm font-bold"
                  style={{ color: tx.type === "savings" ? "#34C87A" : "#FF5252" }}
                >
                  {tx.type === "savings" ? "+" : "−"}{formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        )}

        {showTxModal && (
           <AddTransactionModal
             type={showTxModal}
             onClose={() => setShowTxModal(null)}
             onSave={handleTransaction}
             maxWithdrawal={goal.current_amount || 0}
           />
         )}

        {editingGoal && (
          <AddGoalModal
            goal={editingGoal}
            onClose={() => setEditingGoal(null)}
            onSave={handleAddGoal}
          />
        )}

        {showDetailDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
              <p className="font-bold text-[#1A1A1A] mb-2">Hapus Goal ini?</p>
              <p className="text-sm text-[#4A5568] mb-5">Transaksi tabungan terkait akan menjadi transaksi tanpa goal (tidak ikut dihapus).</p>
              <div className="flex gap-2">
                <button onClick={() => setShowDetailDeleteConfirm(false)} className="flex-1 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-[#8FA4C8] hover:bg-[#F2F4F7]">Batal</button>
                <button onClick={() => { setShowDetailDeleteConfirm(false); handleDelete(); }} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600">Hapus</button>
              </div>
            </div>
          </div>
        )}
      </div>
      </PullToRefresh>
    );
  }

  // All goals list view
  return (
    <PullToRefresh onRefresh={loadData}>
      <div className="min-h-screen bg-[#F2F4F7] pb-8">
        <div className="bg-gradient-to-b from-[#0A0A0A] to-[#0d0d0d] px-5 pt-10 pb-20">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[#8FA4C8] text-sm font-medium">{t('goals_plan')}</p>
                <h1 className="text-white text-2xl font-bold mt-0.5">{t('goals_title')}</h1>
              </div>
              {goalsLimitReached ? (
                <div className="h-10 px-4 rounded-full bg-[#8FA4C8] flex items-center gap-1.5 shadow-lg" title="Batas free tercapai">
                  <Crown className="w-4 h-4 text-white" />
                  <span className="text-white text-sm font-semibold">Batas Free</span>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddGoal(true)}
                  aria-label="Tambah tujuan baru"
                  className="h-10 px-4 rounded-full bg-[#F97316] flex items-center shadow-lg hover:bg-[#EA580C] active:scale-95 transition-all tap-highlight-fix"
                >
                  <span className="text-white text-sm font-semibold">Tambah</span>
                </button>
              )}
            </div>

            <div className="flex items-center justify-between bg-white/5 rounded-full px-4 py-2 border border-white/10">
              <span className="text-[#8FA4C8] text-xs font-medium">{t('goals_total_target')}</span>
              <div className="flex items-center gap-2">
                <span className="text-white text-sm font-bold">{formatCurrency(goals.reduce((s, g) => s + g.target_amount, 0))}</span>
                <span className="text-[#8FA4C8] text-xs">· {goals.filter(g => g.status === "active").length} {t('goals_active')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-5 -mt-14 space-y-3">
          <GoalsNanaPanel goals={goals} />

          {goalsLimitReached && (
            <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 border border-[#F97316]/20">
              <Crown className="w-5 h-5 text-[#F97316] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1A1A1A]">Batas {FREE_GOALS_LIMIT} tujuan tercapai</p>
                <p className="text-xs text-[#8FA4C8]">Fitur unlimited akan segera tersedia via App Store.</p>
              </div>
            </div>
          )}
          {loading ? (
            [...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />)
          ) : goals.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm" role="status" aria-live="polite">
              <TrendingUp className="w-12 h-12 text-[#8FA4C8] mx-auto mb-3" aria-hidden="true" />
              <p className="text-[#4A5568] font-semibold">{t('goals_empty_title')}</p>
              <p className="text-[#8FA4C8] text-sm mt-1 mb-4">{t('goals_empty_desc')}</p>
              <button
                onClick={() => setShowAddGoal(true)}
                className="px-5 py-2.5 rounded-xl bg-[#F97316] text-white text-sm font-semibold hover:bg-[#EA580C] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:ring-offset-2 tap-highlight-fix"
              >
                + Buat Tujuan Pertama
              </button>
            </div>
          ) : (
            goals.map((g) => (
              <GoalCard
                key={g.id}
                goal={g}
                onEdit={(goal) => { setEditingGoal(goal); setShowAddGoal(true); }}
                onDelete={(id) => setDeleteConfirmGoal(id)}
                onAddSavings={(goal) => setSavingsGoal(goal)}
                onPause={handlePause}
                onResume={handleResume}
                onRaiseTarget={handleRaiseTarget}
              />
            ))
          )}
        </div>

        {showAddGoal && (
         <AddGoalModal
           goal={editingGoal || null}
           onClose={() => { setShowAddGoal(false); setEditingGoal(null); setRaiseTargetGoal(null); }}
           onSave={async (data) => {
             try {
               if (raiseTargetGoal) {
                 await base44.entities.SavingsGoal.update(raiseTargetGoal.id, { target_amount: data.target_amount, status: data.current_amount < data.target_amount ? 'active' : 'completed' });
                 toast.success("Target berhasil dinaikkan");
                 setRaiseTargetGoal(null);
                 setShowAddGoal(false);
                 setEditingGoal(null);
                 await loadData();
               } else {
                 // handleAddGoal already handles close + loadData + toast
                 await handleAddGoal(data);
               }
             } catch (err) {
               // Error already toasted inside handleAddGoal; re-throw so modal keeps saving=false
               throw err;
             }
           }}
         />
        )}

        {savingsGoal && (
          <AddSavingsModal
            goal={savingsGoal}
            onClose={() => setSavingsGoal(null)}
            onSave={(data) => handleAddSavings(savingsGoal, data)}
          />
        )}

        {deleteConfirmGoal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
              <p className="font-bold text-[#1A1A1A] mb-2">Hapus Goal ini?</p>
              <p className="text-sm text-[#4A5568] mb-5">Menghapus goal tidak akan menghapus transaksi tabungan yang sudah ada. Transaksi terkait akan menjadi transaksi savings tanpa goal.</p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteConfirmGoal(null)} className="flex-1 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-[#8FA4C8] hover:bg-[#F2F4F7]">Batal</button>
                <button onClick={() => handleDeleteFromList(deleteConfirmGoal)} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600">Hapus</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PullToRefresh>
  );
}