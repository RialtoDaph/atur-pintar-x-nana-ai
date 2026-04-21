import { useState, useEffect, lazy, Suspense } from "react";
import PullToRefresh from "@/components/utils/PullToRefresh";

import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AddTransactionModal from "@/components/transactions/AddTransactionModal";
import { useAppSettings } from "@/components/utils/useAppSettings";
import OnboardingQuestionnaire from "@/components/onboarding/OnboardingQuestionnaire";
import NanaIntroModal from "@/components/onboarding/NanaIntroModal";
import SampleDataBanner, { hasSampleData } from "@/components/onboarding/SampleDataManager";
import BalanceCardCarousel from "@/components/dashboard/BalanceCardCarousel";
import TodayTransactionsCard from "@/components/dashboard/TodayTransactionsCard";
import { syncAccountBalance } from "@/components/utils/accountSync";

import RecurringManager from "@/components/transactions/RecurringManager";
import { useGamification } from "@/hooks/useGamification";

import DashboardGreeting from "@/components/dashboard/DashboardGreeting";
import NanaInsightCard from "@/components/dashboard/NanaInsightCard";
import DailyMissionsCard from "@/components/dashboard/DailyMissionsCard";
import ReminderAlertWidget from "@/components/dashboard/ReminderAlertWidget";
import BossBattleCard from "@/components/gamification/BossBattleCard";

const DashboardInsights = lazy(() => import("@/components/dashboard/DashboardInsights"));
const BudgetAlertWidget = lazy(() => import("@/components/dashboard/BudgetAlertWidget"));
const CashflowForecast = lazy(() => import("@/components/dashboard/CashflowForecast"));

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
    const unsub4 = base44.entities.Account.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["accounts_dashboard", user.email] });
    });
    return () => { unsub1(); unsub2(); unsub3(); unsub4(); };
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

  const activeGamProfile = gamProfile || gamProfiles?.[0] || null;

  const { data: allCategories = [] } = useQuery({
    queryKey: ["categories", user?.email],
    queryFn: () => base44.entities.GlobalCategory.list(),
    enabled,
    staleTime: 10 * 60 * 1000,
  });

  const accountsTotal = accounts.reduce((s, a) => s + (a.balance || 0), 0);
  const loading = goalsLoading || txLoading || budgetsLoading;

  async function loadData() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["goals", user?.email] }),
      queryClient.invalidateQueries({ queryKey: ["transactions_dashboard", user?.email] }),
      queryClient.invalidateQueries({ queryKey: ["budgets", user?.email] }),
      queryClient.invalidateQueries({ queryKey: ["accounts_dashboard", user?.email] }),
    ]);
  }

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const todayStr = now.toISOString().split("T")[0];
  
  // Filter transactions from day 1 of month to today
  const thisMonthTx = transactions.filter(t => {
    const d = new Date(t.date);
    return t.date >= firstDayOfMonth && t.date <= todayStr && !t.is_deleted;
  });

  const monthIncome = thisMonthTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const monthExpense = thisMonthTx.filter(t => t.type === "expense" || t.type === "savings").reduce((s, t) => s + t.amount, 0);

  return (
    <PullToRefresh onRefresh={loadData}>
      <div className="min-h-screen bg-[#F2F4F7] pb-8">
        {user && <RecurringManager userEmail={user.email} />}

        {/* Top Header */}
        <div className="bg-gradient-to-b from-[#0A0A0A] to-[#0d0d0d] px-5 pt-6 pb-14">
          <div className="max-w-2xl mx-auto">
            {/* 1. Greeting */}
            <DashboardGreeting user={user} gamificationProfile={activeGamProfile} />

            {/* 2. Balance Card Carousel */}
            <BalanceCardCarousel
              income={monthIncome}
              expense={monthExpense}
              savings={0}
              accounts={accounts}
              loading={loading}
            />
          </div>
        </div>

        {/* Budget Widget — overlaps header/body boundary */}
        <div className="max-w-2xl mx-auto px-4 -mt-8 relative z-10">
          <Suspense fallback={<div className="bg-white rounded-2xl h-20 animate-pulse shadow-sm" />}>
            <BudgetAlertWidget transactions={transactions} loading={loading} budgets={budgets} />
          </Suspense>
        </div>

        {showSampleBanner && (
          <div className="max-w-2xl mx-auto px-4 mt-3">
            <SampleDataBanner onDismiss={() => { setShowSampleBanner(false); loadData(); }} />
          </div>
        )}

        {user?.subscription_status === "expired" && (
          <div className="max-w-2xl mx-auto px-4 mt-3">
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-3">
              <span className="text-lg">⚠️</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-700">Langganan kamu sudah berakhir</p>
                <p className="text-xs text-red-500">Perpanjang untuk akses fitur premium</p>
              </div>
              <a href="/Subscription" className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold">Perpanjang</a>
            </div>
          </div>
        )}

        <div className="max-w-2xl mx-auto px-4 space-y-3 mt-3">

          {/* 4. Misi Hari Ini */}
          {user?.onboarding_completed && (
            <NanaInsightCard
              todayExpense={transactions
                .filter(t => t.date === todayStr && t.type === "expense" && !t.is_deleted)
                .reduce((s, t) => s + (t.amount || 0), 0)}
            />
          )}

          {/* 5. Banner Belum Catat */}
          {user?.onboarding_completed && (
            <DailyMissionsCard
              user={user}
              gamificationProfile={activeGamProfile}
              onProfileUpdate={setGamProfile}
            />
          )}

          {/* 6. Daily Mission Card */}
          {user?.onboarding_completed && (
            <BossBattleCard
              user={user}
              gamificationProfile={activeGamProfile}
              onProfileUpdate={setGamProfile}
            />
          )}

          {/* 7. Transaksi Overview Hari Ini */}
          {user?.onboarding_completed && (
            <TodayTransactionsCard transactions={transactions} allCategories={allCategories} />
          )}

          {user?.onboarding_completed && <ReminderAlertWidget user={user} />}

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