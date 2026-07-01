import { useState, useEffect, useMemo, lazy, Suspense } from "react";

import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AddTransactionModal from "@/components/transactions/AddTransactionModal";
import { useAppSettings } from "@/components/utils/useAppSettings";
import OnboardingQuestionnaire from "@/components/onboarding/OnboardingQuestionnaire";
import NanaIntroModal from "@/components/onboarding/NanaIntroModal";
import SampleDataBanner, { hasSampleData } from "@/components/onboarding/SampleDataManager";
import BalanceCardCarousel from "@/components/dashboard/BalanceCardCarousel";
import TodayTransactionsCard from "@/components/dashboard/TodayTransactionsCard";
import SubscriptionExpiredBanner from "@/components/dashboard/SubscriptionExpiredBanner";
import { saveTransactionWithSync } from "@/components/utils/saveTransaction";

import RecurringManager from "@/components/transactions/RecurringManager";
import { useGamification } from "@/hooks/useGamification";
import { usePremiumUser } from "@/hooks/usePremiumUser";

import DashboardGreeting from "@/components/dashboard/DashboardGreeting";
import DashboardDesktopTopBar from "@/components/dashboard/DashboardDesktopTopBar";
import DailyMissionsCard from "@/components/dashboard/DailyMissionsCard";
import UMKMPintarAdBanner from "@/components/dashboard/UMKMPintarAdBanner";
import BossBattleFloating from "@/components/gamification/BossBattleFloating";
import StreakCelebrationPopup from "@/components/dashboard/StreakCelebrationPopup";
import AchievementPopup from "@/components/dashboard/AchievementPopup";
import LevelUpModal from "@/components/gamification/LevelUpModal";

const BudgetAlertWidget = lazy(() => import("@/components/dashboard/BudgetAlertWidget"));
const GoalsProgressWidget = lazy(() => import("@/components/dashboard/GoalsProgressWidget"));

export default function Dashboard() {
  const { t } = useAppSettings();
  const queryClient = useQueryClient();
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showNanaIntro, setShowNanaIntro] = useState(false);
  const [user, setUser] = useState(null);
  const [showSampleBanner, setShowSampleBanner] = useState(hasSampleData);
  const [desktopUnreadCount, setDesktopUnreadCount] = useState(0);

  const gamification = useGamification(user);
  const { isExpired: subscriptionExpired } = usePremiumUser();

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (!u?.onboarding_completed) {
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

  // Unread count for desktop top bar (alerts + admin notifications)
  useEffect(() => {
    if (!user?.email) return;
    let cancelled = false;
    Promise.all([
      base44.entities.Alert.filter({ created_by: user.email, status: "unread" }).catch(() => []),
      base44.entities.AdminNotification.list().catch(() => []),
    ]).then(([alerts, notifs]) => {
      if (cancelled) return;
      const seen = new Set();
      let alertCount = 0;
      for (const a of alerts || []) {
        const key = `${a.title}::${a.category || ""}`;
        if (!seen.has(key)) { seen.add(key); alertCount++; }
      }
      const adminCount = (notifs || []).filter(n =>
        (n.target_type === "all" || n.target_email === user.email) &&
        !n.read_by?.includes(user.email)
      ).length;
      setDesktopUnreadCount(Math.min(alertCount, 10) + adminCount);
    });
    return () => { cancelled = true; };
  }, [user?.email]);

  useEffect(() => {
    const onRefresh = () => loadData();
    const onTxAdded = (e) => {
      if (user?.email) gamification.onNewTransaction(e?.detail?.gamification || null);
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

  // Date range: from start of current month to today.
  // Filter at the server (date >= firstDayOfMonth) instead of pulling 500 records and
  // filtering client-side — guarantees correctness for power users with >500 lifetime tx.
  // Memoized once per mount — `new Date()` recomputed only when the day rolls over (won't happen mid-session realistically).
  const firstDayOfMonthStr = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
  }, []);

  const { data: rawTransactions = [], isLoading: txLoading } = useQuery({
    queryKey: ["transactions_dashboard", user?.email, firstDayOfMonthStr],
    queryFn: () => base44.entities.Transaction.filter(
      { created_by: user.email, is_deleted: false, date: { $gte: firstDayOfMonthStr } },
      "-date"
    ),
    enabled,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Exclude recurring TEMPLATES (parent) from displayed/aggregated transactions —
  // only generated child transactions should affect totals & UI lists.
  const transactions = useMemo(
    () => rawTransactions.filter(t => !(t.is_recurring === true && !t.is_recurring_child)),
    [rawTransactions]
  );

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

  // Fallback query — populates profile on first mount before `checkStreakOnLoad` runs.
  // Once the hook's `gamification.profile` is set, that becomes authoritative.
  const { data: gamProfiles = [] } = useQuery({
    queryKey: ["gam_profile", user?.email],
    queryFn: () => base44.entities.GamificationProfile.filter({ created_by: user.email }),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    placeholderData: (prev) => prev,
  });

  // Single source of truth: hook's profile (kept fresh by processGamification responses) wins,
  // fall back to the initial query result while the hook hasn't loaded yet.
  const activeGamProfile = gamification.profile || gamProfiles?.[0] || null;

  const { data: allCategories = [] } = useQuery({
    queryKey: ["categories", user?.email],
    queryFn: () => base44.entities.GlobalCategory.list(),
    enabled,
    staleTime: 10 * 60 * 1000,
  });

  // Balance card only needs transaction totals — don't gate it on goals/budgets loading.
  // Include `!user` so widgets render skeleton instead of flashing "Rp 0" before user is fetched.
  const balanceLoading = !user || txLoading;
  const loading = !user || goalsLoading || txLoading || budgetsLoading;

  async function loadData() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["goals", user?.email] }),
      queryClient.invalidateQueries({ queryKey: ["transactions_dashboard", user?.email] }),
      queryClient.invalidateQueries({ queryKey: ["budgets", user?.email] }),
      queryClient.invalidateQueries({ queryKey: ["accounts_dashboard", user?.email] }),
    ]);
  }

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Single-pass aggregation — avoids 3x filter+reduce traversals over the same array
  const { monthIncome, monthExpense, monthSavings } = useMemo(() => {
    let inc = 0, exp = 0, sav = 0;
    for (const t of transactions) {
      if (t.is_deleted || t.date > todayStr) continue;
      if (t.type === "income") inc += t.amount;
      else if (t.type === "expense") exp += t.amount;
      else if (t.type === "savings") sav += t.amount;
    }
    return { monthIncome: inc, monthExpense: exp, monthSavings: sav };
  }, [transactions, todayStr]);

  return (
    <>
      <div className="min-h-screen bg-[#F2F4F7] pb-8">
        {user && <RecurringManager userEmail={user.email} />}

        {/* Top Header — transparent on desktop, dark on mobile */}
        <div className="bg-gradient-to-b from-[#0A0A0A] to-[#0d0d0d] sm:bg-none sm:bg-transparent px-5 pt-6 pb-14 sm:pb-6">
          <div className="max-w-2xl md:max-w-4xl lg:max-w-6xl mx-auto">
            {/* Greeting — mobile: above balance card (unchanged) */}
            <div className="lg:hidden">
              <DashboardGreeting user={user} gamificationProfile={activeGamProfile} />
            </div>

            {/* Desktop: top bar contains greeting + search + streak + bell + Catat Transaksi (1 baris) */}
            <div className="hidden lg:block">
              <DashboardDesktopTopBar
                user={user}
                gamificationProfile={activeGamProfile}
                unreadCount={desktopUnreadCount}
                onAddTransaction={() => setShowAddTransaction(true)}
              />
            </div>

            {/* Mobile: Balance card stays here (unchanged). Desktop: moved to body grid below. */}
            <div className="lg:hidden">
              <BalanceCardCarousel
                income={monthIncome}
                expense={monthExpense}
                savings={monthSavings}
                accounts={accounts}
                loading={balanceLoading}
              />
            </div>
          </div>
        </div>

        {/* Body — mobile: stacked (unchanged). Desktop: 2-column layout matching mockup */}
        <div className="max-w-2xl md:max-w-4xl lg:max-w-6xl mx-auto px-4 -mt-8 sm:mt-0 relative z-10">

          {/* ============ MOBILE LAYOUT (unchanged) ============ */}
          <div className="space-y-3 lg:hidden">
            {user?.onboarding_completed && (
              <DailyMissionsCard
                user={user}
                gamificationProfile={activeGamProfile}
                onProfileUpdate={gamification.setProfile}
              />
            )}

            {showSampleBanner && (
              <SampleDataBanner onDismiss={() => { setShowSampleBanner(false); loadData(); }} />
            )}

            {(user?.subscription_status === "expired" || subscriptionExpired) && <SubscriptionExpiredBanner />}

            <Suspense fallback={<div className="bg-white rounded-2xl h-20 animate-pulse shadow-sm" />}>
              <BudgetAlertWidget transactions={transactions} loading={loading} budgets={budgets} globalCategories={allCategories} />
            </Suspense>
            <Suspense fallback={<div className="bg-white rounded-2xl h-24 animate-pulse shadow-sm" />}>
              <GoalsProgressWidget goals={goals} loading={goalsLoading} />
            </Suspense>

            {user?.onboarding_completed && (
              <TodayTransactionsCard transactions={transactions} allCategories={allCategories} goals={goals} />
            )}
          </div>

          {/* ============ DESKTOP LAYOUT (2 columns, mockup-style) ============ */}
          <div className="hidden lg:grid lg:grid-cols-12 lg:gap-4 lg:items-start">

            {/* LEFT COLUMN (7/12): Balance → Cashflow/Budget Alert → Today Tx */}
            <div className="lg:col-span-7 space-y-4">
              <BalanceCardCarousel
                income={monthIncome}
                expense={monthExpense}
                savings={monthSavings}
                accounts={accounts}
                loading={balanceLoading}
              />

              {showSampleBanner && (
                <SampleDataBanner onDismiss={() => { setShowSampleBanner(false); loadData(); }} />
              )}

              {(user?.subscription_status === "expired" || subscriptionExpired) && <SubscriptionExpiredBanner />}

              <Suspense fallback={<div className="bg-white rounded-2xl h-20 animate-pulse shadow-sm" />}>
                <BudgetAlertWidget transactions={transactions} loading={loading} budgets={budgets} globalCategories={allCategories} />
              </Suspense>

              {user?.onboarding_completed && (
                <TodayTransactionsCard transactions={transactions} allCategories={allCategories} goals={goals} />
              )}
            </div>

            {/* RIGHT COLUMN (5/12): Daily Missions → Goals Progress → Boss Battle */}
            <div className="lg:col-span-5 space-y-4">
              {user?.onboarding_completed && (
                <DailyMissionsCard
                  user={user}
                  gamificationProfile={activeGamProfile}
                  onProfileUpdate={gamification.setProfile}
                />
              )}

              <Suspense fallback={<div className="bg-white rounded-2xl h-24 animate-pulse shadow-sm" />}>
                <GoalsProgressWidget goals={goals} loading={goalsLoading} />
              </Suspense>

            </div>

          </div>
          <div className="h-4" />
        </div>

        {/* Sponsored banner — paling bawah sebelum bottom nav */}
        <UMKMPintarAdBanner />

        {/* Floating Boss Battle — bottom-right, replaces inline card */}
        <BossBattleFloating
          user={user}
          gamificationProfile={activeGamProfile}
          onProfileUpdate={gamification.setProfile}
        />

        {showAddTransaction && (
          <AddTransactionModal
            goals={goals}
            onClose={() => setShowAddTransaction(false)}
            onSave={async (data) => {
              await saveTransactionWithSync(data);
              setShowAddTransaction(false);
              await loadData();
            }}
          />
        )}

        {showOnboarding && (
          <OnboardingQuestionnaire onClose={async () => {
            setShowOnboarding(false);
            // Refetch user so onboarding_completed flag flips and gated widgets render
            try {
              const fresh = await base44.auth.me();
              setUser(fresh);
              // Notify App.jsx so it can trigger TourGuide in the same session
              window.dispatchEvent(new CustomEvent("onboarding-completed"));
            } catch {}
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
    </>
  );
}