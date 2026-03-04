import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Plus, Minus, Trash2, CheckCircle, TrendingUp, Calendar, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import AddTransactionModal from "@/components/goals/AddTransactionModal";
import AddGoalModal from "@/components/goals/AddGoalModal";

const COLORS = {
  blue: "#4F7CFF",
  green: "#34C87A",
  orange: "#F5A623",
  purple: "#9B59B6",
  pink: "#E91E8C",
  teal: "#1ABC9C",
};

export default function Goals() {
  const urlParams = new URLSearchParams(window.location.search);
  const goalId = urlParams.get("id");

  const [goals, setGoals] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTxModal, setShowTxModal] = useState(null); // 'deposit' | 'withdrawal'
  const [showAddGoal, setShowAddGoal] = useState(false);

  const goal = goals.find((g) => g.id === goalId) || null;

  useEffect(() => {
    loadData();
  }, [goalId]);

  async function loadData() {
    setLoading(true);
    const [g, t] = await Promise.all([
      base44.entities.SavingsGoal.list("-created_date"),
      goalId ? base44.entities.Transaction.filter({ goal_id: goalId }, "-created_date") : Promise.resolve([]),
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
    if (!window.confirm("Delete this goal?")) return;
    await base44.entities.SavingsGoal.delete(goalId);
    window.location.href = createPageUrl("Dashboard");
  }

  async function handleAddGoal(data) {
    await base44.entities.SavingsGoal.create(data);
    setShowAddGoal(false);
    loadData();
  }

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
      <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center">
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
      <div className="min-h-screen bg-[#F7F6F3] max-w-lg mx-auto px-4 py-8">
        <Link to={createPageUrl("Dashboard")} className="flex items-center gap-2 text-[#9B9B9B] hover:text-[#0A0A0A] text-sm mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        {/* Goal hero */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#EFEFED] mb-5">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{goal.icon || "💰"}</span>
              <div>
                <h1 className="text-xl font-bold text-[#1A1A1A]">{goal.name}</h1>
                {goal.description && <p className="text-sm text-[#9B9B9B] mt-0.5">{goal.description}</p>}
              </div>
            </div>
            {goal.status === "completed" && (
              <CheckCircle className="w-6 h-6 text-[#34C87A]" />
            )}
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-bold text-[#1A1A1A] text-2xl">
                ${(goal.current_amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[#9B9B9B] self-end text-sm">of ${goal.target_amount.toLocaleString()}</span>
            </div>
            <div className="h-2 bg-[#F0F0EE] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${progress}%`, backgroundColor: color }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-[#9B9B9B]">{progress.toFixed(1)}% complete</span>
              {remaining > 0 && <span className="text-xs text-[#9B9B9B]">${remaining.toLocaleString()} remaining</span>}
            </div>
          </div>

          {/* Deadline */}
          {goal.deadline && (
            <p className="text-xs text-[#9B9B9B] mb-4">
              🗓 Target: {new Date(goal.deadline).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          )}

          {/* Actions */}
          {goal.status !== "completed" && (
            <div className="grid grid-cols-2 gap-3 mt-2">
              <button
                onClick={() => setShowTxModal("deposit")}
                className="flex items-center justify-center gap-2 bg-[#1A1A1A] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#333] transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Money
              </button>
              <button
                onClick={() => setShowTxModal("withdrawal")}
                className="flex items-center justify-center gap-2 bg-[#F7F6F3] text-[#1A1A1A] py-3 rounded-xl text-sm font-semibold hover:bg-[#EFEFED] transition-colors border border-[#EFEFED]"
              >
                <Minus className="w-4 h-4" /> Withdraw
              </button>
            </div>
          )}
        </div>

        {/* Transactions */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-[#1A1A1A]">Activity</h2>
          <button onClick={handleDelete} className="text-xs text-red-400 hover:text-red-600 transition-colors flex items-center gap-1">
            <Trash2 className="w-3.5 h-3.5" /> Delete goal
          </button>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-12 text-[#9B9B9B] text-sm">No transactions yet</div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
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
                    <p className="text-xs text-[#9B9B9B]">{new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                  </div>
                </div>
                <span
                  className="text-sm font-bold"
                  style={{ color: tx.type === "deposit" ? "#34C87A" : "#FF5252" }}
                >
                  {tx.type === "deposit" ? "+" : "−"}${tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
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
            <p className="text-[#8FA4C8] text-sm font-medium">Rencana</p>
            <h1 className="text-white text-2xl font-bold mt-0.5">Tujuan Finansial</h1>
          </div>
          <button
            onClick={() => setShowAddGoal(true)}
            className="w-10 h-10 rounded-full bg-[#FF6A00] flex items-center justify-center shadow-lg hover:bg-[#e05e00] transition-colors"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="bg-white/10 rounded-2xl p-5">
          <p className="text-white/60 text-sm mb-1">Total Target</p>
          <p className="text-white font-bold text-3xl mb-2">Rp {goals.reduce((s, g) => s + g.target_amount, 0).toLocaleString("id-ID")}</p>
          <p className="text-white/40 text-xs">{goals.filter(g => g.status === "active").length} tujuan aktif</p>
        </div>
      </div>
    </div>

    <div className="max-w-2xl mx-auto px-5 -mt-10 space-y-3">
      {loading ? (
        [...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />)
      ) : goals.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
          <TrendingUp className="w-10 h-10 text-[#8FA4C8] mx-auto mb-3" />
          <p className="text-[#4A5568] font-semibold">Belum ada tujuan finansial</p>
          <p className="text-[#8FA4C8] text-sm mt-1">Tap + untuk membuat tujuan tabungan pertama Anda</p>
        </div>
      ) : (
        goals.map((g) => {
          const color = COLORS[g.color] || COLORS.blue;
          const progress = g.target_amount > 0 ? Math.min((g.current_amount || 0 / g.target_amount) * 100, 100) : 0;
          const daysLeft = calculateDaysRemaining(g.deadline);
          const suggestedMonthly = calculateSuggestedMonthly(g);
          const isUrgent = daysLeft && daysLeft < 30;

          return (
            <Link
              key={g.id}
              to={createPageUrl(`Goals?id=${g.id}`)}
              className="block bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl" style={{ backgroundColor: `${color}20` }}>
                    {g.icon || "💰"}
                  </div>
                  <div>
                    <p className="font-semibold text-[#1A1A1A] text-sm">{g.name}</p>
                    {g.description && <p className="text-xs text-[#8FA4C8] mt-0.5">{g.description}</p>}
                  </div>
                </div>
                {g.status === "completed" && <CheckCircle className="w-5 h-5 text-[#00C9A7]" />}
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[#4A5568] font-medium">Rp {(g.current_amount || 0).toLocaleString("id-ID")} dari Rp {g.target_amount.toLocaleString("id-ID")}</span>
                  <span className="font-bold" style={{ color }}>{progress.toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-[#F2F4F7] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: color }} />
                </div>
              </div>

              <div className="flex gap-3 text-xs">
                {g.deadline && (
                  <div className="flex items-center gap-1 text-[#8FA4C8]">
                    <Calendar className="w-3.5 h-3.5" />
                    {daysLeft >= 0 ? `${daysLeft} hari` : "Kadaluarsa"}
                  </div>
                )}
                {suggestedMonthly && (
                  <div className={`flex items-center gap-1 ${isUrgent ? "text-[#FF6B6B]" : "text-[#8FA4C8]"}`}>
                    <Zap className="w-3.5 h-3.5" />
                    Rp {suggestedMonthly.toLocaleString("id-ID")}/bln
                  </div>
                )}
              </div>
            </Link>
          );
        })
      )}
    </div>

    {showAddGoal && (
      <AddGoalModal
        onClose={() => setShowAddGoal(false)}
        onSave={handleAddGoal}
      />
    )}
  </div>
  );
  }