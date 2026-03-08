import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Plus, Minus, Trash2, CheckCircle, TrendingUp } from "lucide-react";
import { useAppSettings } from "@/components/utils/useAppSettings";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import AddTransactionModal from "@/components/goals/AddTransactionModal";
import AddGoalModal from "@/components/goals/AddGoalModal";
import GoalCard from "@/components/goals/GoalCard";

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
  const [showTxModal, setShowTxModal] = useState(null); // 'deposit' | 'withdrawal'
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [txFilter, setTxFilter] = useState("all"); // 'all' | 'deposit' | 'withdrawal'

  const goal = goals.find((g) => g.id === goalId) || null;

  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) loadData();
  }, [goalId, user]);

  async function loadData() {
    setLoading(true);
    const [g, t] = await Promise.all([
      base44.entities.SavingsGoal.filter({ created_by: user.email }, "-created_date"),
      goalId ? base44.entities.Transaction.filter({ goal_id: goalId, created_by: user.email }, "-created_date") : Promise.resolve([]),
    ]);
    setGoals(g);
    setTransactions(t);
    setLoading(false);
  }

  async function handleTransaction(amount, type, note) {
    const tx = {
      goal_id: goalId,
      amount,
      type,
      note,
      date: new Date().toISOString().split("T")[0],
    };
    const newAmount =
      type === "deposit"
        ? (goal.current_amount || 0) + amount
        : Math.max((goal.current_amount || 0) - amount, 0);

    await Promise.all([
      base44.entities.Transaction.create(tx),
      base44.entities.SavingsGoal.update(goalId, {
        current_amount: newAmount,
        status: newAmount >= goal.target_amount ? "completed" : "active",
      }),
    ]);
    setShowTxModal(null);
    loadData();
  }

  async function handleDelete() {
    if (!window.confirm(t('goals_delete_confirm'))) return;
    await base44.entities.SavingsGoal.delete(goalId);
    navigate(createPageUrl("Dashboard"));
  }

  async function handleAddGoal(data) {
    if (goal?.id) {
      await base44.entities.SavingsGoal.update(goal.id, data);
    } else {
      await base44.entities.SavingsGoal.create(data);
    }
    setShowAddGoal(false);
    loadData();
  }

  const [editingGoal, setEditingGoal] = useState(null);

  function calculateSuggestedMonthly(goal) {
    if (!goal.deadline) return null;
    const today = new Date();
    const deadline = new Date(goal.deadline);
    const remaining = Math.max(goal.target_amount - (goal.current_amount || 0), 0);
    const months = Math.max((deadline - today) / (1000 * 60 * 60 * 24 * 30), 0.5);
    return months > 0 ? Math.ceil(remaining / months) : remaining;
  }

  function calculateDaysRemaining(deadline) {
    if (!deadline) return null;
    const today = new Date();
    const days = Math.ceil((new Date(deadline) - today) / (1000 * 60 * 60 * 24));
    return Math.max(days, 0);
  }

  if (loading) {
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
      <div className="min-h-screen bg-[#F2F4F7] max-w-lg mx-auto px-4 py-8">
        <Link to={createPageUrl("Dashboard")} className="flex items-center gap-2 text-[#9B9B9B] hover:text-[#0A0A0A] text-sm mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t('goals_back')}
        </Link>

        {/* Goal hero */}
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

          {/* Progress */}
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

          {/* Deadline */}
          {goal.deadline && (
            <p className="text-xs text-[#9B9B9B] mb-4">
              🗓 {t('goals_target_label')}: {new Date(goal.deadline).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
            </p>
          )}

          {/* Actions */}
           <div className="grid grid-cols-3 gap-2 mt-4">
             {goal.status !== "completed" && (
               <>
                 <button
                   onClick={() => setShowTxModal("deposit")}
                   className="flex items-center justify-center gap-2 bg-[#1A1A1A] text-white py-3 rounded-xl text-xs font-semibold hover:bg-[#333] transition-colors"
                 >
                   <Plus className="w-4 h-4" /> {t('goals_add_money')}
                 </button>
                 <button
                   onClick={() => setShowTxModal("withdrawal")}
                   className="flex items-center justify-center gap-2 bg-[#F7F6F3] text-[#1A1A1A] py-3 rounded-xl text-xs font-semibold hover:bg-[#EFEFED] transition-colors border border-[#EFEFED]"
                 >
                   <Minus className="w-4 h-4" /> {t('goals_withdraw')}
                 </button>
               </>
             )}
             <button
               onClick={() => setEditingGoal(goal)}
               className="flex items-center justify-center gap-2 bg-[#FF6A00] text-white py-3 rounded-xl text-xs font-semibold hover:bg-[#e05e00] transition-colors"
             >
               ✏️ {t('edit')}
             </button>
           </div>
          </div>

        {/* Transactions */}
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-[#1A1A1A]">{t('goals_activity')}</h2>
          <button onClick={handleDelete} className="text-xs text-red-400 hover:text-red-600 transition-colors flex items-center gap-1">
            <Trash2 className="w-3.5 h-3.5" /> {t('goals_delete_goal')}
          </button>
        </div>

        {/* Filter tabs */}
        {transactions.length > 0 && (
          <div className="flex gap-2 mb-3">
            {["all", "deposit", "withdrawal"].map((f) => (
              <button
                key={f}
                onClick={() => setTxFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  txFilter === f ? "bg-[#1A1A1A] text-white" : "bg-[#F2F4F7] text-[#8FA4C8] hover:bg-[#E2E8F0]"
                }`}
              >
                {f === "all" ? t('tx_filter_all') : f === "deposit" ? `💰 ${t('goals_deposit')}` : `📤 ${t('goals_withdraw')}`}
              </button>
            ))}
          </div>
        )}

        {transactions.filter(tx => txFilter === "all" || tx.type === txFilter).length === 0 ? (
          <div className="text-center py-12 text-[#9B9B9B] text-sm">{t('goals_no_tx')}</div>
        ) : (
          <div className="space-y-2">
            {transactions.filter(tx => txFilter === "all" || tx.type === txFilter).map((tx) => (
              <div key={tx.id} className="bg-white rounded-2xl px-4 py-3.5 flex items-center justify-between shadow-sm border border-[#EFEFED]">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                    style={{
                      backgroundColor: tx.type === "deposit" ? "#34C87A18" : "#FF525218",
                      color: tx.type === "deposit" ? "#34C87A" : "#FF5252",
                    }}
                  >
                    {tx.type === "deposit" ? "+" : "−"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1A1A1A]">{tx.note || (tx.type === "deposit" ? "Deposit" : "Withdrawal")}</p>
                    <p className="text-xs text-[#9B9B9B]">{new Date(tx.date).toLocaleDateString("id-ID", { month: "short", day: "numeric", year: "numeric" })}</p>
                  </div>
                </div>
                <span
                   className="text-sm font-bold"
                   style={{ color: tx.type === "deposit" ? "#34C87A" : "#FF5252" }}
                 >
                   {tx.type === "deposit" ? "+" : "−"}{formatCurrency(tx.amount)}
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
        </div>
        );
        }

  // All goals list view
  return (
  <div className="min-h-screen bg-[#F2F4F7] pb-8">
    <div className="bg-[#0A0A0A] px-5 pt-10 pb-20">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[#8FA4C8] text-sm font-medium">{t('goals_plan')}</p>
            <h1 className="text-white text-2xl font-bold mt-0.5">{t('goals_title')}</h1>
          </div>
          <button
            onClick={() => setShowAddGoal(true)}
            className="w-10 h-10 rounded-full bg-[#FF6A00] flex items-center justify-center shadow-lg hover:bg-[#e05e00] transition-colors"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="bg-white/10 rounded-2xl p-5">
          <p className="text-white/60 text-sm mb-1">{t('goals_total_target')}</p>
          <p className="text-white font-bold text-3xl mb-2">{formatCurrency(goals.reduce((s, g) => s + g.target_amount, 0))}</p>
          <p className="text-white/40 text-xs">{goals.filter(g => g.status === "active").length} {t('goals_active')}</p>
        </div>
      </div>
    </div>

    <div className="max-w-2xl mx-auto px-5 -mt-10 space-y-3">
      {loading ? (
        [...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />)
      ) : goals.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
          <TrendingUp className="w-10 h-10 text-[#8FA4C8] mx-auto mb-3" />
          <p className="text-[#4A5568] font-semibold">{t('goals_empty_title')}</p>
          <p className="text-[#8FA4C8] text-sm mt-1">{t('goals_empty_desc')}</p>
        </div>
      ) : (
        goals.map((g) => (
          <GoalCard
            key={g.id}
            goal={g}
            onEdit={(goal) => { setEditingGoal(goal); setShowAddGoal(true); }}
            onDelete={async (id) => {
              if (!window.confirm(t('goals_delete_confirm'))) return;
              await base44.entities.SavingsGoal.delete(id);
              loadData();
            }}
          />
        ))
      )}
    </div>

    {showAddGoal && (
     <AddGoalModal
       goal={editingGoal || null}
       onClose={() => { setShowAddGoal(false); setEditingGoal(null); }}
       onSave={handleAddGoal}
     />
    )}
    </div>
    );
    }