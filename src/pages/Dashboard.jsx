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
import DailyMissionsCard from "@/components/dashboard/DailyMissionsCard";
import BossBattleCard from "@/components/gamification/BossBattleCard";
import StreakCelebrationPopup from "@/components/dashboard/StreakCelebrationPopup";
import AchievementPopup from "@/components/dashboard/AchievementPopup";
import LevelUpModal from "@/components/gamification/LevelUpModal";

const DashboardInsights = lazy(() => import("@/components/dashboard/DashboardInsights"));
const BudgetAlertWidget = lazy(() => import("@/components/dashboard/BudgetAlertWidget"));
const CashflowForecast = lazy(() => import("@/components/dashboard/CashflowForecast"));
const GoalsProgressWidget = lazy(() => import("@/components/dashboard/GoalsProgressWidget"));

const LazyFallback = () => (
  <div className="bg-white rounded-2xl h-20 animate-pulse shadow-sm" />
);

export default function Dashboard() {
  const { t } = useAppSettings();
  const queryClient = useQueryClient();
  const [showAddTransaction, setShowAddTransaction] = useState(false);
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
      // Subscription expiry check is now handled in Layout (runs once per session for all pages)
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
    const onRefresh = () => loadData();
    const onTxAdded = () => {
      if (user?.email) gamification.onNewTransaction();
    };
    window.addEventListener("refresh-dashboard", onRefresh);
    window.addEventListener("transaction-added", onTxAdded);
    return () => {
      window.removeEventListener("refresh-dashboard", onRefresh);
      window.removeEventListener("transaction-added", onTxAdded);
    };
  }, [user?.email]);

  useEffect(() => {
    if (!user?.email) return;
    // Debounce helpers to prevent rapid-fire invalidations causing rate limits
    let txTimer, acctTimer;
    const unsub1 = base44.entities.Transaction.subscribe(() => {
      clearTimeout(txTimer);
      txTimer = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["transactions_dashboard", user.email] });
      }, 1500);
    });
    const unsub2 = base44.entities.SavingsGoal.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["goals", user.email] });
    });
    const unsub3 = base44.entities.Budget.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["budgets", user.email] });
    });
    const unsub4 = base44.entities.Account.subscribe(() => {
      clearTimeout(acctTimer);
      acctTimer = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["accounts_dashboard", user.email] });
      }, 300);
    });
    return () => { unsub1(); unsub2(); unsub3(); unsub4(); clearTimeout(txTimer); clearTimeout(acctTimer); };
  }, [user?.email]);

  const enabled = !!user?.onboarding_completed;

  const { data: goals = [], isLoading: goalsLoading } = useQuery({
    queryKey: ["goals", user?.email],
    queryFn: () => base44.entities.SavingsGoal.filter({ created_by: user.email }, "-created_date"),
    enabled,
    staleTime: 2 * 60 * 1000,
  });

  const { data: rawTransactions = [], isLoading: txLoading } = useQuery({
    queryKey: ["transactions_dashboard", user?.email],
    queryFn: () => base44.entities.Transaction.filter({ created_by: user.email, is_deleted: false }, "-date", 500),
    enabled,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Exclude recurring TEMPLATES (parent) from displayed/aggregated transactions —
  // only generated child transactions should affect totals & UI lists.
  const transactions = rawTransactions.filter(t => !(t.is_recurring === true && !t.is_recurring_child));

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
    staleTime: 0,
    refetchOnWindowFocus: true,
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
  // Pengeluaran hanya menghitung type=expense, savings tidak dihitung sebagai pengeluaran (dipisah sebagai "tabungan")
  const monthExpense = thisMonthTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  return (
    <PullToRefresh onRefresh={loadData}>
      <div className="min-h-screen bg-[#F2F4F7] pb-8">
        {user && <RecurringManager userEmail={user.email} />}

        {/* Top Header — transparent on desktop, dark on mobile */}
        <div className="bg-gradient-to-b from-[#0A0A0A] to-[#0d0d0d] sm:bg-none sm:bg-transparent px-5 pt-6 pb-14 sm:pb-6">
          <div className="max-w-2xl md:max-w-4xl lg:max-w-6xl mx-auto">
            {/* 1. Greeting */}
            <DashboardGreeting user={user} gamificationProfile={activeGamProfile} />

            {/* 2. Balance Card + Daily Missions side-by-side on desktop */}
            <div className="lg:grid lg:grid-cols-12 lg:gap-4 lg:items-start">
              <div className="lg:col-span-6">
                <BalanceCardCarousel
                  income={monthIncome}
                  expense={monthExpense}
                  savings={0}
                  accounts={accounts}
                  loading={loading}
                />
              </div>
              <div className="hidden lg:block lg:col-span-6">
                {user?.onboarding_completed && (
                  <DailyMissionsCard
                    user={user}
                    gamificationProfile={activeGamProfile}
                    onProfileUpdate={setGamProfile}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Body — mobile: stacked. tablet/desktop: 4-column grid */}
        <div className="max-w-2xl md:max-w-4xl lg:max-w-6xl mx-auto px-4 -mt-8 sm:mt-0 relative z-10">
          <div className="space-y-3 lg:grid lg:grid-cols-5 lg:gap-4 lg:space-y-0 lg:items-start">

            {/* ── MAIN COLUMN (4/5) ─────────────────────────── */}
            <div className="space-y-3 lg:col-span-4 lg:space-y-4">
              {/* Daily Missions — di mobile muncul di atas (setelah balance card), di desktop sudah ditampilkan di header */}
              <div className="lg:hidden">
                {user?.onboarding_completed && (
                  <DailyMissionsCard
                    user={user}
                    gamificationProfile={activeGamProfile}
                    onProfileUpdate={setGamProfile}
                  />
                )}
              </div>

              {/* Sample data banner & subscription banners — keep here at top of main */}
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

              {/* Budget Alert & Goals Progress — 2 kolom di desktop, stacked di mobile */}
              <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-4">
                <Suspense fallback={<div className="bg-white rounded-2xl h-20 animate-pulse shadow-sm" />}>
                  <BudgetAlertWidget transactions={transactions} loading={loading} budgets={budgets} />
                </Suspense>
                <Suspense fallback={<div className="bg-white rounded-2xl h-24 animate-pulse shadow-sm" />}>
                  <GoalsProgressWidget goals={goals} loading={goalsLoading} />
                </Suspense>
              </div>

              {/* Today Transactions — main content */}
              {user?.onboarding_completed && (
                <TodayTransactionsCard transactions={transactions} allCategories={allCategories} />
              )}
            </div>

            {/* ── SIDE COLUMN (1/5) ─────────────────────────── */}
            <div className="space-y-3 lg:col-span-1 lg:space-y-4">
              {user?.onboarding_completed && (
                <BossBattleCard
                  user={user}
                  gamificationProfile={activeGamProfile}
                  onProfileUpdate={setGamProfile}
                />
              )}
            </div>

          </div>
          <div className="h-4" />
        </div>

        {showAddTransaction && (
          <AddTransactionModal
            goals={goals}
            onClose={() => setShowAddTransaction(false)}
            onSave={async (data) => {
              await base44.entities.Transaction.create(data);
              if (data.account_id && !data.is_recurring) {
                await syncAccountBalance(data.account_id, data.amount, data.type, 1);
              }
              setShowAddTransaction(false);
              setLastTxAddedAt(Date.now());
              gamification.onNewTransaction();
              // Notify other listeners (challenges, recurring, etc.) consistently with Layout's modal
              window.dispatchEvent(new CustomEvent("transaction-added"));
              await loadData();
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

        {/* Gamification popups */}
        <StreakCelebrationPopup
          show={!!gamification.streakPopup}
          message={gamification.streakPopup?.message || ""}
          streak={gamification.streakPopup?.streak || 0}
          onClose={() => gamification.setStreakPopup(null)}
        />
        {gamification.achievementPopup && (
          <AchievementPopup
            achievement={{
              emoji: gamification.achievementPopup.icon,
              name: gamification.achievementPopup.title,
              desc: gamification.achievementPopup.hint,
            }}
            onClose={() => gamification.setAchievementPopup(null)}
          />
        )}
        {gamification.levelUpPopup && (
          <LevelUpModal
            levelData={gamification.levelUpPopup.level}
            onClose={() => gamification.setLevelUpPopup(null)}
          />
        )}
      </div>
    </PullToRefresh>
  );
}