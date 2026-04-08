import { useState, useEffect, lazy, Suspense } from "react";
import PullToRefresh from "@/components/utils/PullToRefresh";

import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from "lucide-react";
import AddTransactionModal from "@/components/transactions/AddTransactionModal";
import { useAppSettings } from "@/components/utils/useAppSettings";
import OnboardingQuestionnaire from "@/components/onboarding/OnboardingQuestionnaire";
import NanaIntroModal from "@/components/onboarding/NanaIntroModal";
import SampleDataBanner, { hasSampleData } from "@/components/onboarding/SampleDataManager";
import BalanceCard from "@/components/dashboard/BalanceCard";
import AccountsWidget from "@/components/dashboard/AccountsWidget";
import { syncAccountBalance } from "@/components/utils/accountSync";

import RecurringManager from "@/components/transactions/RecurringManager";
import ReminderWidget from "@/components/reminders/ReminderWidget";
import StreakWidget from "@/components/dashboard/StreakWidget";
import SharedWalletCard from "@/components/dashboard/SharedWalletCard";

import CashflowForecast from "@/components/dashboard/CashflowForecast";

const DashboardInsights = lazy(() => import("@/components/dashboard/DashboardInsights"));

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
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [widgets, setWidgets] = useState(getWidgets());
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showNanaIntro, setShowNanaIntro] = useState(false);
  const [user, setUser] = useState(null);
  const [showSampleBanner, setShowSampleBanner] = useState(hasSampleData);
  const [lastTxAddedAt, setLastTxAddedAt] = useState(null);

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

  useEffect(() => {
    const onRefresh = () => loadData();
    window.addEventListener("refresh-dashboard", onRefresh);
    return () => window.removeEventListener("refresh-dashboard", onRefresh);
  }, [user?.email]);

  useEffect(() => {
    if (!user?.email) return;
    const unsub1 = base44.entities.Transaction.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["transactions_dashboard", user.email] });
    });
    const unsub2 = base44.entities.SavingsGoal.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["goals", user.email] });
    });
    const unsub3 = base44.entities.Budget.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["budgets", user.email] });
    });
    return () => { unsub1(); unsub2(); unsub3(); };
  }, [user?.email]);

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
    staleTime: 5 * 60 * 1000,
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts_dashboard", user?.email],
    queryFn: () => base44.entities.Account.filter({ created_by: user.email }),
    enabled,
    staleTime: 2 * 60 * 1000,
  });

  const accountsTotal = accounts.reduce((s, a) => s + (a.balance || 0), 0);

  const loading = goalsLoading || txLoading || budgetsLoading;

  async function loadData() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["goals", user?.email] }),
      queryClient.invalidateQueries({ queryKey: ["transactions_dashboard", user?.email] }),
      queryClient.invalidateQueries({ queryKey: ["budgets", user?.email] }),
    ]);
  }

  const now = new Date();
  // Exclude recurring templates (is_recurring=true, is_recurring_child=false) — they are NOT actual transactions
  const thisMonthTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      && !(t.is_recurring === true && !t.is_recurring_child);
  });

  // Semua transaksi (bukan template recurring) untuk saldo keseluruhan
  const allTx = transactions.filter(t => !(t.is_recurring === true && !t.is_recurring_child));
  const monthIncome = allTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const monthExpense = allTx.filter(t => t.type === "expense" || t.type === "savings").reduce((s, t) => s + t.amount, 0);
  const totalSaved = goals.reduce((s, g) => s + (g.current_amount || 0), 0);

  const handleRefresh = async () => {
    await loadData();
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen bg-[#F2F4F7] pb-8">
      {user && <RecurringManager userEmail={user.email} />}
      {/* Top Header */}
      <div className="bg-gradient-to-b from-[#0A0A0A] to-[#0d0d0d] px-5 pt-6 pb-16">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[#8FA4C8] text-xs font-medium">{t('dashboard_greeting')}</p>
              <h1 className="text-white text-xl font-bold mt-0.5">{t('dashboard_title')}</h1>
            </div>
            <button
              data-tour="add-transaction-btn"
              onClick={() => setShowAddTransaction(true)}
              className="w-11 h-11 rounded-full bg-[#FF6A00] flex items-center justify-center shadow-lg hover:bg-[#e05e00] active:scale-95 transition-all duration-150 tap-highlight-fix"
              style={{boxShadow: '0 4px 16px rgba(255,106,0,0.45)'}}
            >
              <Plus className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Balance Card */}
          <BalanceCard
            income={monthIncome}
            expense={monthExpense}
            savings={totalSaved}
            totalBalance={accounts.length > 0 ? accountsTotal : null}
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

        {/* Streak Widget - Now prominent */}
        {user?.onboarding_completed && <StreakWidget user={user} transactionCount={thisMonthTx.length} lastTxAddedAt={lastTxAddedAt} />}

        {/* Reminder Widget */}
        <ReminderWidget user={user} />

        {/* Budget Alert Widget */}
        <Suspense fallback={<LazyFallback />}>
          <BudgetAlertWidget transactions={transactions} loading={loading} budgets={budgets} />
        </Suspense>

        {/* Accounts Widget */}
        {user?.onboarding_completed && <AccountsWidget user={user} />}

        {/* Shared Wallet Card - Bottom */}
        {user?.onboarding_completed && <SharedWalletCard />}

        <div className="h-2" />

      </div>

      {showAddTransaction && (
        <AddTransactionModal
          goals={goals}
          onClose={() => setShowAddTransaction(false)}
          onSave={async (data) => {
            const tx = await base44.entities.Transaction.create(data);
            if (data.account_id) await syncAccountBalance(data.account_id, data.amount, data.type, 1);
            setShowAddTransaction(false);
            setLastTxAddedAt(Date.now());
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