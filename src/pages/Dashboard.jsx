import { useState, useEffect, lazy, Suspense } from "react";
import PullToRefresh from "@/components/utils/PullToRefresh";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, ChevronRight } from "lucide-react";
import AddGoalModal from "@/components/goals/AddGoalModal";
import AddTransactionModal from "@/components/transactions/AddTransactionModal";
import { useAppSettings } from "@/components/utils/useAppSettings";
import OnboardingQuestionnaire from "@/components/onboarding/OnboardingQuestionnaire";
import NanaIntroModal from "@/components/onboarding/NanaIntroModal";
import SampleDataBanner, { hasSampleData } from "@/components/onboarding/SampleDataManager";
import BalanceCard from "@/components/dashboard/BalanceCard";
import GoalsMiniList from "@/components/dashboard/GoalsMiniList";
import SmartAlertsPanel from "@/components/dashboard/SmartAlertsPanel";
import RecurringManager from "@/components/transactions/RecurringManager";
import ReminderWidget from "@/components/reminders/ReminderWidget";

// Lazy load heavy components
const SpendingChart = lazy(() => import("@/components/dashboard/SpendingChart"));
const CashflowForecast = lazy(() => import("@/components/dashboard/CashflowForecast"));
const DashboardInsights = lazy(() => import("@/components/dashboard/DashboardInsights"));
const PortfolioSummary = lazy(() => import("@/components/dashboard/PortfolioSummary"));
const BudgetAlertWidget = lazy(() => import("@/components/dashboard/BudgetAlertWidget"));

const LazyFallback = () => (
  <div className="bg-white rounded-2xl h-20 animate-pulse shadow-sm" />
);


function getWidgets() {
  const saved = localStorage.getItem("widgets");
  if (saved) return JSON.parse(saved);
  return { smartAlerts: true, cashflowForecast: true, subscriptionDetector: true, spendingChart: true, recentTransactions: true, savingsGoals: true };
}

export default function Dashboard() {
  const { t } = useAppSettings();
  const queryClient = useQueryClient();
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [widgets, setWidgets] = useState(getWidgets());
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showNanaIntro, setShowNanaIntro] = useState(false);
  const [user, setUser] = useState(null);
  const [showSampleBanner, setShowSampleBanner] = useState(hasSampleData);

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

  const enabled = !!user?.onboarding_completed;

  const { data: goals = [], isLoading: goalsLoading } = useQuery({
    queryKey: ["goals", user?.email],
    queryFn: () => base44.entities.SavingsGoal.filter({ created_by: user.email }, "-created_date"),
    enabled,
    staleTime: 2 * 60 * 1000, // 2 menit cache
  });

  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ["transactions_dashboard", user?.email],
    queryFn: () => base44.entities.Transaction.filter({ created_by: user.email }, "-date", 100),
    enabled,
    staleTime: 2 * 60 * 1000,
  });

  const { data: budgets = [], isLoading: budgetsLoading } = useQuery({
    queryKey: ["budgets", user?.email],
    queryFn: () => base44.entities.Budget.filter({ created_by: user.email }),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 menit cache
  });

  const loading = goalsLoading || txLoading || budgetsLoading;

  async function loadData() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["goals", user?.email] }),
      queryClient.invalidateQueries({ queryKey: ["transactions_dashboard", user?.email] }),
      queryClient.invalidateQueries({ queryKey: ["budgets", user?.email] }),
    ]);
  }

  const now = new Date();
  const thisMonthTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const monthIncome = thisMonthTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const monthExpense = thisMonthTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const totalSaved = goals.reduce((s, g) => s + (g.current_amount || 0), 0);

  const handleRefresh = async () => {
    await loadData();
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen bg-[#F2F4F7] pb-8">
      {user && <RecurringManager userEmail={user.email} />}
      {/* Top Header */}
      <div className="bg-[#0A0A0A] px-5 pt-6 pb-14">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[#8FA4C8] text-xs font-medium">{t('dashboard_greeting')}</p>
              <h1 className="text-white text-xl font-bold mt-0.5">{t('dashboard_title')}</h1>
            </div>
            <button
              onClick={() => setShowAddTransaction(true)}
              className="w-10 h-10 rounded-full bg-[#FF6A00] flex items-center justify-center shadow-lg hover:bg-[#e05e00] transition-colors tap-highlight-fix"
            >
              <Plus className="w-5 h-5 text-white" />
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



        {/* Sample Data Banner */}
        {showSampleBanner && (
          <SampleDataBanner onDismiss={() => {
            setShowSampleBanner(false);
            loadData();
          }} />
        )}

        {/* Reminder Widget */}
        <ReminderWidget user={user} />

        {/* Budget Alert Widget */}
        <Suspense fallback={<LazyFallback />}>
          <BudgetAlertWidget transactions={transactions} loading={loading} budgets={budgets} />
        </Suspense>

        {/* Personal Insights */}
        {!loading && (
          <Suspense fallback={<LazyFallback />}>
            <DashboardInsights transactions={transactions} goals={goals} />
          </Suspense>
        )}

        {/* Smart Alerts Panel */}
        <SmartAlertsPanel user={user} />

        {/* Cashflow Forecast */}
        {widgets.cashflowForecast && (
          <Suspense fallback={<LazyFallback />}>
            <CashflowForecast transactions={transactions} loading={loading} user={user} />
          </Suspense>
        )}

        {/* Spending breakdown */}
        {widgets.spendingChart && (
          <Suspense fallback={<LazyFallback />}>
            <SpendingChart transactions={thisMonthTx} loading={loading} />
          </Suspense>
        )}

        {/* Portfolio Summary */}
        <Suspense fallback={<LazyFallback />}>
          <PortfolioSummary user={user} />
        </Suspense>

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

      {showAddTransaction && (
        <AddTransactionModal
          goals={goals}
          onClose={() => setShowAddTransaction(false)}
          onSave={async (data) => {
            await base44.entities.Transaction.create(data);
            setShowAddTransaction(false);
            loadData();
          }}
        />
      )}

      {showOnboarding && (
        <OnboardingQuestionnaire onClose={async () => {
          setShowOnboarding(false);
          localStorage.setItem("onboarding_done", "true");
          await base44.auth.updateMe({ onboarding_completed: true });
          loadData();
          setShowNanaIntro(true);
        }} />
      )}

      {showNanaIntro && (
        <NanaIntroModal onClose={() => {
          setShowNanaIntro(false);
        }} />
      )}

      </div>
    </PullToRefresh>
  );
}