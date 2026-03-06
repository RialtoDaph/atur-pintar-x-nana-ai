import { useState, useEffect } from "react";
import PullToRefresh from "@/components/utils/PullToRefresh";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, ChevronRight } from "lucide-react";
import AddGoalModal from "@/components/goals/AddGoalModal";
import AddTransactionModal from "@/components/transactions/AddTransactionModal";
import { useAppSettings } from "@/components/utils/useAppSettings";
import OnboardingQuestionnaire from "@/components/onboarding/OnboardingQuestionnaire";
import BalanceCard from "@/components/dashboard/BalanceCard";
import SpendingChart from "@/components/dashboard/SpendingChart";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import GoalsMiniList from "@/components/dashboard/GoalsMiniList";
import SmartAlerts from "@/components/dashboard/SmartAlerts";
import SmartAlertsPanel from "@/components/dashboard/SmartAlertsPanel";
import SubscriptionDetector from "@/components/dashboard/SubscriptionDetector";
import CashflowForecast from "@/components/dashboard/CashflowForecast";
import RecurringManager from "@/components/transactions/RecurringManager";
import ReminderWidget from "@/components/reminders/ReminderWidget";
import DashboardInsights from "@/components/dashboard/DashboardInsights";
import PortfolioSummary from "@/components/dashboard/PortfolioSummary";
import BudgetAlertWidget from "@/components/dashboard/BudgetAlertWidget";
import IncomeExpenseChart from "@/components/dashboard/IncomeExpenseChart";

function getWidgets() {
  const saved = localStorage.getItem("widgets");
  if (saved) return JSON.parse(saved);
  return { smartAlerts: true, cashflowForecast: true, subscriptionDetector: true, spendingChart: true, recentTransactions: true, savingsGoals: true };
}

export default function Dashboard() {
  const { t } = useAppSettings();
  const [goals, setGoals] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showAddTx, setShowAddTx] = useState(false);
  const [widgets, setWidgets] = useState(getWidgets());
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (!u?.onboarding_completed && !localStorage.getItem("onboarding_done")) {
        setShowOnboarding(true);
      }
    }).catch(() => {});
  }, []);


  useEffect(() => {
    const onStorage = () => setWidgets(getWidgets());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => { if (user?.onboarding_completed) loadData(); }, [user]);

  async function loadData() {
    setLoading(true);
    const [g, t, b] = await Promise.all([
      base44.entities.SavingsGoal.filter({ created_by: user.email }, "-created_date"),
      base44.entities.Transaction.filter({ created_by: user.email }, "-date", 100),
      base44.entities.Budget.filter({ created_by: user.email }),
    ]);
    setGoals(g);
    setTransactions(t);
    setBudgets(b);
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
    <PullToRefresh onRefresh={loadData}>
      <div className="min-h-screen bg-[#F2F4F7] pb-8">
      <RecurringManager userEmail={user?.email} />
      {/* Top Header */}
      <div className="bg-[#0A0A0A] px-5 pt-6 pb-14">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[#8FA4C8] text-xs font-medium">{t('dashboard_greeting')}</p>
              <h1 className="text-white text-xl font-bold mt-0.5">{t('dashboard_title')}</h1>
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

      <div className="max-w-2xl mx-auto px-4 -mt-6 space-y-3">

        {/* Reminder Widget */}
        <ReminderWidget />

        {/* Budget Alert Widget */}
        <BudgetAlertWidget transactions={transactions} loading={loading} budgets={budgets} />

        {/* Personal Insights */}
        {!loading && <DashboardInsights transactions={transactions} goals={goals} />}

        {/* Smart Alerts Panel */}
        <SmartAlertsPanel />

        {/* Smart Alerts */}
        {widgets.smartAlerts && <SmartAlerts transactions={transactions} loading={loading} />}

        {/* Cashflow Forecast */}
        {widgets.cashflowForecast && <CashflowForecast transactions={transactions} loading={loading} user={user} />}

        {/* Subscription Detector */}
        {widgets.subscriptionDetector && <SubscriptionDetector transactions={transactions} loading={loading} />}

        {/* Income vs Expense Chart */}
        <IncomeExpenseChart transactions={transactions} loading={loading} />

        {/* Spending breakdown */}
        {widgets.spendingChart && <SpendingChart transactions={thisMonthTx} loading={loading} />}

        {/* Recent transactions */}
        {widgets.recentTransactions && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <h2 className="font-bold text-[#0A0A0A] text-sm">{t('recent_transactions')}</h2>
              <Link to={createPageUrl("Transactions")} className="text-xs text-[#FF6A00] font-semibold flex items-center gap-0.5">
                {t('view_all')} <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <RecentTransactions transactions={transactions.slice(0, 5)} loading={loading} onRefresh={loadData} />
          </div>
        )}

        {/* Portfolio Summary */}
        <PortfolioSummary />

        {/* Savings Goals */}
        {widgets.savingsGoals && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <h2 className="font-bold text-[#0A0A0A] text-sm">{t('savings_goals')}</h2>
              <button
                onClick={() => setShowAddGoal(true)}
                className="text-xs text-[#FF6A00] font-semibold flex items-center gap-0.5"
              >
                {t('add_goal')}
              </button>
            </div>
            <GoalsMiniList goals={goals} loading={loading} />
            {goals.length > 0 && (
              <div className="px-4 pb-3">
                <Link to={createPageUrl("Goals")} className="text-xs text-[#8FA4C8] flex items-center gap-0.5 hover:text-[#1B2559]">
                  {t('view_all')} <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        )}
        <div className="h-2" />

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

      {showOnboarding && (
        <OnboardingQuestionnaire onClose={() => {
          setShowOnboarding(false);
          localStorage.setItem("onboarding_done", "true");
          loadData();
        }} />
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
    </PullToRefresh>
  );
}