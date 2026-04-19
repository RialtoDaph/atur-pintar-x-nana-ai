import { useState, useEffect } from "react";
import PullToRefresh from "@/components/utils/PullToRefresh";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AddTransactionModal from "@/components/transactions/AddTransactionModal";
import { useAppSettings } from "@/components/utils/useAppSettings";
import OnboardingQuestionnaire from "@/components/onboarding/OnboardingQuestionnaire";
import NanaIntroModal from "@/components/onboarding/NanaIntroModal";
import SampleDataBanner, { hasSampleData } from "@/components/onboarding/SampleDataManager";
import { syncAccountBalance } from "@/components/utils/accountSync";
import RecurringManager from "@/components/transactions/RecurringManager";
import { useGamification } from "@/hooks/useGamification";
import { useFinancialHealthScore } from "@/hooks/useFinancialHealthScore";
import { Plus } from "lucide-react";

// Dashboard widgets
import GreetingMoodWidget from "@/components/dashboard/GreetingMoodWidget";
import NetWorthSnapshot from "@/components/dashboard/NetWorthSnapshot";
import BudgetProgressWidget from "@/components/dashboard/BudgetProgressWidget";
import RecentTransactionsWidget from "@/components/dashboard/RecentTransactionsWidget";
import ActiveAlertsWidget from "@/components/dashboard/ActiveAlertsWidget";
import SavingsGoalWidget from "@/components/dashboard/SavingsGoalWidget";
import StreakMissionWidget from "@/components/dashboard/StreakMissionWidget";
import FHSWidget from "@/components/dashboard/FHSWidget";
import NanaQuickPrompt from "@/components/dashboard/NanaQuickPrompt";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showNanaIntro, setShowNanaIntro] = useState(false);
  const [user, setUser] = useState(null);
  const [showSampleBanner, setShowSampleBanner] = useState(hasSampleData);
  const [gamProfile, setGamProfile] = useState(null);

  const gamification = useGamification(user);
  useFinancialHealthScore(user);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (!u?.onboarding_completed && !localStorage.getItem("onboarding_done")) {
        setShowOnboarding(true);
      }
      if (u?.role !== 'admin' && u?.subscription_status === "active") {
        const endDate = u?.subscription_end_date || u?.subscription_expiry;
        if (endDate && endDate < new Date().toISOString().split("T")[0]) {
          base44.auth.updateMe({ subscription_status: "expired", subscription_plan: "free" }).catch(() => {});
        }
      }
      if (u?.onboarding_completed && !sessionStorage.getItem("dedup_done")) {
        sessionStorage.setItem("dedup_done", "1");
        base44.functions.invoke("deduplicateUserData", {}).catch(() => {});
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (user?.onboarding_completed) gamification.checkStreakOnLoad();
  }, [user?.email]);

  useEffect(() => {
    if (!user?.email) return;
    const unsub1 = base44.entities.Transaction.subscribe(() => queryClient.invalidateQueries({ queryKey: ["transactions_dashboard", user.email] }));
    const unsub2 = base44.entities.SavingsGoal.subscribe(() => queryClient.invalidateQueries({ queryKey: ["goals", user.email] }));
    const unsub3 = base44.entities.Budget.subscribe(() => queryClient.invalidateQueries({ queryKey: ["budgets", user.email] }));
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

  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
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

  const activeGamProfile = gamProfile || gamProfiles?.[0] || null;
  const loading = goalsLoading || txLoading || budgetsLoading || accountsLoading;

  async function loadData() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["goals", user?.email] }),
      queryClient.invalidateQueries({ queryKey: ["transactions_dashboard", user?.email] }),
      queryClient.invalidateQueries({ queryKey: ["budgets", user?.email] }),
      queryClient.invalidateQueries({ queryKey: ["accounts_dashboard", user?.email] }),
    ]);
  }

  return (
    <PullToRefresh onRefresh={loadData}>
      <div className="min-h-screen bg-[#F2F4F7]">
        {user && <RecurringManager userEmail={user.email} />}

        {/* 1. Greeting + Mood */}
        <GreetingMoodWidget user={user} />

        {/* 2. Net Worth Snapshot */}
        <NetWorthSnapshot accounts={accounts} transactions={transactions} loading={accountsLoading} />

        {/* Main content */}
        <div className="max-w-lg mx-auto px-4 pt-6 pb-28 space-y-6">

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

          {/* 4. Budget Bulan Ini */}
          {user?.onboarding_completed && (
            <BudgetProgressWidget budgets={budgets} transactions={transactions} loading={budgetsLoading} user={user} />
          )}

          {/* 5. Transaksi Terbaru */}
          {user?.onboarding_completed && (
            <RecentTransactionsWidget transactions={transactions} loading={txLoading} />
          )}

          {/* 6. Alert Aktif */}
          {user?.onboarding_completed && (
            <ActiveAlertsWidget user={user} />
          )}

          {/* 7. Savings Goals */}
          {user?.onboarding_completed && (
            <SavingsGoalWidget goals={goals} loading={goalsLoading} />
          )}

          {/* 8. Streak & Daily Mission */}
          {user?.onboarding_completed && (
            <StreakMissionWidget
              user={user}
              gamificationProfile={activeGamProfile}
              onProfileUpdate={setGamProfile}
            />
          )}

          {/* 9. Financial Health Score */}
          {user?.onboarding_completed && (
            <FHSWidget fhsRecord={fhsRecords?.[0] || null} />
          )}

          {/* 10. Nana Quick Prompt */}
          {user?.onboarding_completed && (
            <NanaQuickPrompt />
          )}
        </div>

        {/* 3. FAB Catat Transaksi */}
        <button
          onClick={() => setShowAddTransaction(true)}
          className="fixed bottom-20 sm:bottom-8 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-8 z-[55] bg-[#FF6B35] flex items-center justify-center rounded-full shadow-2xl active:scale-95 transition-all duration-150 tap-highlight-fix"
          style={{ width: 60, height: 60, boxShadow: "0 4px 24px rgba(255,107,53,0.5)" }}
        >
          <Plus className="w-7 h-7 text-white" />
        </button>

        {showAddTransaction && (
          <AddTransactionModal
            goals={goals}
            onClose={() => setShowAddTransaction(false)}
            onSave={async (data) => {
              await base44.entities.Transaction.create(data);
              if (data.account_id) await syncAccountBalance(data.account_id, data.amount, data.type, 1);
              setShowAddTransaction(false);
              gamification.onNewTransaction();
              loadData();
            }}
          />
        )}

        {showOnboarding && (
          <OnboardingQuestionnaire onClose={() => { setShowOnboarding(false); loadData(); }} />
        )}

        {showNanaIntro && (
          <NanaIntroModal onClose={() => setShowNanaIntro(false)} />
        )}
      </div>
    </PullToRefresh>
  );
}