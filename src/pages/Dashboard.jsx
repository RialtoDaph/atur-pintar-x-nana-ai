import { useState, useEffect, lazy, Suspense } from "react";
import PullToRefresh from "@/components/utils/PullToRefresh";

import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AddTransactionModal from "@/components/transactions/AddTransactionModal";
import { useAppSettings } from "@/components/utils/useAppSettings";
import OnboardingQuestionnaire from "@/components/onboarding/OnboardingQuestionnaire";
import NanaIntroModal from "@/components/onboarding/NanaIntroModal";
import SampleDataBanner, { hasSampleData } from "@/components/onboarding/SampleDataManager";
import BalanceCard from "@/components/dashboard/BalanceCard";
import AccountsWidget from "@/components/dashboard/AccountsWidget";
import { syncAccountBalance } from "@/components/utils/accountSync";

import RecurringManager from "@/components/transactions/RecurringManager";
import StreakWidget from "@/components/dashboard/StreakWidget";
import { useGamification } from "@/hooks/useGamification";

import CashflowForecast from "@/components/dashboard/CashflowForecast";
import DashboardGreeting from "@/components/dashboard/DashboardGreeting";
import FinancialHealthCard from "@/components/dashboard/FinancialHealthCard";
import NanaInsightCard from "@/components/dashboard/NanaInsightCard";
import DailyMissionsCard from "@/components/dashboard/DailyMissionsCard";

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
  const [gamProfile, setGamProfile] = useState(null);

  const gamification = useGamification(user);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (!u?.onboarding_completed && !localStorage.getItem("onboarding_done")) {
        setShowOnboarding(true);
      }
      // Check subscription expiry on load — skip for admin
      if (u?.role !== 'admin' && u?.subscription_status === "active") {
        const endDate = u?.subscription_end_date || u?.subscription_expiry;
        if (endDate) {
          const today = new Date().toISOString().split("T")[0];
          if (endDate < today) {
            base44.auth.updateMe({ subscription_status: "expired", subscription_plan: "free" }).catch(() => {});
          }
        }
      }
      // Run deduplication once per session
      if (u?.onboarding_completed && !sessionStorage.getItem("dedup_done")) {
        sessionStorage.setItem("dedup_done", "1");
        base44.functions.invoke("deduplicateUserData", {}).catch(() => {});
      }
    }).catch(() => {});
  }, []);

  // Check streak reset whenever user loads the dashboard
  useEffect(() => {
    if (user?.onboarding_completed) {
      gamification.checkStreakOnLoad();
    }
  }, [user?.email]);

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
    staleTime: 2 * 60 * 1000,
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

  const thisMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const { data: fhsRecords = [] } = useQuery({
    queryKey: ["fhs", user?.email, thisMonthKey],
    queryFn: () => base44.entities.FinancialHealthScore.filter({ created_by: user.email, month: thisMonthKey }),
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const { data: gamProfiles = [] } = useQuery({
    queryKey: ["gam_profile", user?.email],
    queryFn: async () => {
      const list = await base44.entities.GamificationProfile.filter({ created_by: user.email });
      if (list?.[0]) setGamProfile(list[0]);
      return list;
    },
    enabled,
    staleTime: 30 * 1000,
  });

  const fhsScore = fhsRecords?.[0]?.total_score ?? 0;
  const activeGamProfile = gamProfile || gamProfiles?.[0] || null;

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
  const thisMonthTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      && !(t.is_recurring === true && !t.is_recurring_child);
  });

  const allTx = transactions.filter(t => !(t.is_recurring === true && !t.is_recurring_child));
  const monthIncome = allTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const monthExpense = allTx.filter(t => t.type === "expense" || t.type === "savings").reduce((s, t) => s + t.amount, 0);
  const totalSaved = goals.reduce((s, g) => s + (g.current_amount || 0), 0);

  return (
    <PullToRefresh onRefresh={loadData}>
      <div className="min-h-screen bg-[#F2F4F7] pb-8">
        {user && <RecurringManager userEmail={user.email} />}

        {/* Top Header */}
        <div className="bg-gradient-to-b from-[#0A0A0A] to-[#0d0d0d] px-5 pt-6 pb-16">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <DashboardGreeting user={user} gamificationProfile={activeGamProfile} />
              <div data-tour="add-transaction-btn" />
            </div>

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
          {showSampleBanner && (
            <SampleDataBanner onDismiss={() => { setShowSampleBanner(false); loadData(); }} />
          )}

          {user?.subscription_status === "expired" && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-3">
              <span className="text-lg">⚠️</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-700">Langganan kamu sudah berakhir</p>
                <p className="text-xs text-red-500">Perpanjang untuk akses fitur premium</p>
              </div>
              <a href="/Subscription" className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold">Perpanjang</a>
            </div>
          )}

          {/* Financial Health Score */}
          {user?.onboarding_completed && (
            <FinancialHealthCard score={fhsScore} />
          )}

          {/* Nana Insight */}
          {user?.onboarding_completed && (
            <NanaInsightCard
              todayExpense={(() => {
                const todayStr = new Date().toISOString().split("T")[0];
                return transactions
                  .filter(t => t.date === todayStr && (t.type === "expense") && !t.is_deleted)
                  .reduce((s, t) => s + (t.amount || 0), 0);
              })()}
            />
          )}

          {/* Daily Missions + Level Progress */}
          {user?.onboarding_completed && (
            <DailyMissionsCard
              user={user}
              gamificationProfile={activeGamProfile}
              onProfileUpdate={setGamProfile}
            />
          )}

          {/* Streak Widget */}
          {user?.onboarding_completed && (
            <StreakWidget
              profile={gamification.profile}
              streakPopup={gamification.streakPopup} setStreakPopup={gamification.setStreakPopup}
              achievementPopup={gamification.achievementPopup} setAchievementPopup={gamification.setAchievementPopup}
              levelUpPopup={gamification.levelUpPopup} setLevelUpPopup={gamification.setLevelUpPopup}
              xpFloatMsg={gamification.xpFloatMsg}
              streakResetMsg={gamification.streakResetMsg} setStreakResetMsg={gamification.setStreakResetMsg}
            />
          )}

          <Suspense fallback={<LazyFallback />}>
            <BudgetAlertWidget transactions={transactions} loading={loading} budgets={budgets} />
          </Suspense>

          {widgets.cashflowForecast && (
            <Suspense fallback={<LazyFallback />}>
              <CashflowForecast transactions={transactions} loading={loading} user={user} />
            </Suspense>
          )}

          {user?.onboarding_completed && <AccountsWidget user={user} />}

          <div className="h-2" />
        </div>

        {showAddTransaction && (
          <AddTransactionModal
            goals={goals}
            onClose={() => setShowAddTransaction(false)}
            onSave={async (data) => {
              await base44.entities.Transaction.create(data);
              if (data.account_id) await syncAccountBalance(data.account_id, data.amount, data.type, 1);
              setShowAddTransaction(false);
              setLastTxAddedAt(Date.now());
              gamification.onNewTransaction();
              loadData();
            }}
          />
        )}

        {showOnboarding && (
          <OnboardingQuestionnaire onClose={() => {
            setShowOnboarding(false);
            loadData();
          }} />
        )}

        {showNanaIntro && (
          <NanaIntroModal onClose={() => setShowNanaIntro(false)} />
        )}
      </div>
    </PullToRefresh>
  );
}