import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { Plus, ChevronRight } from "lucide-react";
import AddGoalModal from "@/components/goals/AddGoalModal";
import AddTransactionModal from "@/components/transactions/AddTransactionModal";
import BalanceCard from "@/components/dashboard/BalanceCard";
import SpendingChart from "@/components/dashboard/SpendingChart";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import GoalsMiniList from "@/components/dashboard/GoalsMiniList";
import SmartAlerts from "@/components/dashboard/SmartAlerts";
import SubscriptionDetector from "@/components/dashboard/SubscriptionDetector";
import CashflowForecast from "@/components/dashboard/CashflowForecast";
import RecurringManager from "@/components/transactions/RecurringManager";

function getWidgets() {
  const saved = localStorage.getItem("widgets");
  if (saved) return JSON.parse(saved);
  return { smartAlerts: true, cashflowForecast: true, subscriptionDetector: true, spendingChart: true, recentTransactions: true, savingsGoals: true };
}

export default function Dashboard() {
  const [goals, setGoals] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showAddTx, setShowAddTx] = useState(false);
  const [widgets, setWidgets] = useState(getWidgets());

  useEffect(() => {
    const onStorage = () => setWidgets(getWidgets());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [g, t] = await Promise.all([
      base44.entities.SavingsGoal.list("-created_date"),
      base44.entities.Transaction.list("-date", 100),
    ]);
    setGoals(g);
    setTransactions(t);
    setLoading(false);
  }

  const now = new Date();
  const thisMonthTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const monthIncome = thisMonthTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const monthExpense = thisMonthTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const totalSaved = goals.reduce((s, g) => s + (g.current_amount || 0), 0);

  return (
    <div className="min-h-screen bg-[#F2F4F7] pb-8">
      <RecurringManager />
      {/* Top Header */}
      <div className="bg-[#0A0A0A] px-5 pt-8 pb-16">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[#8FA4C8] text-xs font-medium">Good day 👋</p>
              <h1 className="text-white text-xl font-bold mt-0.5">Your Finances</h1>
            </div>
            <button
              onClick={() => setShowAddTx(true)}
              className="w-9 h-9 rounded-full bg-[#FF6A00] flex items-center justify-center shadow-lg hover:bg-[#e05e00] transition-colors"
            >
              <Plus className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Balance Card */}
          <BalanceCard
            income={monthIncome}
            expense={monthExpense}
            savings={totalSaved}
            loading={loading}
          />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-8 space-y-3">

        {/* Smart Alerts */}
        {widgets.smartAlerts && <SmartAlerts transactions={transactions} loading={loading} />}

        {/* Cashflow Forecast */}
        {widgets.cashflowForecast && <CashflowForecast transactions={transactions} loading={loading} />}

        {/* Subscription Detector */}
        {widgets.subscriptionDetector && <SubscriptionDetector transactions={transactions} loading={loading} />}

        {/* Spending breakdown */}
        {widgets.spendingChart && <SpendingChart transactions={thisMonthTx} loading={loading} />}

        {/* Recent transactions */}
        {widgets.recentTransactions && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h2 className="font-bold text-[#0A0A0A] text-base">Recent Transactions</h2>
              <Link to={createPageUrl("Transactions")} className="text-xs text-[#FF6A00] font-semibold flex items-center gap-0.5">
                See all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <RecentTransactions transactions={transactions.slice(0, 5)} loading={loading} onRefresh={loadData} />
          </div>
        )}

        {/* Savings Goals */}
        {widgets.savingsGoals && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h2 className="font-bold text-[#0A0A0A] text-base">Savings Goals</h2>
              <button
                onClick={() => setShowAddGoal(true)}
                className="text-xs text-[#FF6A00] font-semibold flex items-center gap-0.5"
              >
                + Add goal
              </button>
            </div>
            <GoalsMiniList goals={goals} loading={loading} />
            {goals.length > 0 && (
              <div className="px-5 pb-4">
                <Link to={createPageUrl("Goals")} className="text-xs text-[#8FA4C8] flex items-center gap-0.5 hover:text-[#1B2559]">
                  View all goals <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        )}

      </div>

      {showAddGoal && (
        <AddGoalModal
          onClose={() => setShowAddGoal(false)}
          onSave={async (data) => {
            await base44.entities.SavingsGoal.create(data);
            setShowAddGoal(false);
            loadData();
          }}
        />
      )}

      {showAddTx && (
        <AddTransactionModal
          onClose={() => setShowAddTx(false)}
          onSave={async (data) => {
            await base44.entities.Transaction.create(data);
            setShowAddTx(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}