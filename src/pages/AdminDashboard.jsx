import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminStatBar from "@/components/admin/AdminStatBar";
import RevenueSnapshot from "@/components/admin/RevenueSnapshot";
import CollapsibleSection from "@/components/admin/CollapsibleSection";
import AdminStreakManager from "@/components/admin/AdminStreakManager";
import AdminWaitingListSection from "@/components/admin/AdminWaitingListSection";
import LandingAnalyticsCard from "@/components/admin/LandingAnalyticsCard";
import { RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [monthlyChartData, setMonthlyChartData] = useState([]);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u?.role === "admin") loadStats();
      else setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function loadStats() {
    setLoading(true);
    try {
      const allUsers = await base44.entities.User.list();

      const totalUsers = allUsers.length;
      const premiumMonthly = allUsers.filter(u => u.subscription_plan === "premium_monthly" && u.subscription_status === "active");
      const premiumYearly = allUsers.filter(u => u.subscription_plan === "premium_yearly" && u.subscription_status === "active");
      const premiumUsers = premiumMonthly.length + premiumYearly.length;
      const thisMonth = new Date().toISOString().slice(0, 7);
      const monthlyRevenue = 0; // Payments removed — revenue akan tracked via Apple IAP nanti.

      // Onboarding
      const completedOnboarding = allUsers.filter(u => u.onboarding_completed).length;
      const onboardingRate = totalUsers > 0 ? Math.round((completedOnboarding / totalUsers) * 100) : 0;

      // Chart data
      const chartData = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthStr = d.toISOString().slice(0, 7);
        const newCount = allUsers.filter(u => u.created_date?.startsWith(monthStr)).length;
        chartData.push({
          month: new Date(monthStr + "-01").toLocaleDateString("id-ID", { month: "short", year: "2-digit" }),
          newUsers: newCount
        });
      }

      // MRR & churn — revenue disabled sampai Apple IAP integration
      const mrr = 0;
      const expiredUsers = allUsers.filter(u => u.subscription_status === "expired" && u.updated_date?.startsWith(thisMonth)).length;

      setStats({
        totalUsers,
        premiumUsers,
        monthlyRevenue: Math.round(monthlyRevenue),
        totalMRR: Math.round(mrr),
        conversionRate: totalUsers > 0 ? Math.round((premiumUsers / totalUsers) * 100) : 0,
        churnCount: expiredUsers,
        onboardingRate,
        completedOnboarding,
      });
      setMonthlyChartData(chartData);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
    setLoading(false);
  }

  if (loading) return (
    <AdminLayout currentPage="AdminDashboard">
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-[#F97316] border-t-transparent rounded-full animate-spin" />
      </div>
    </AdminLayout>
  );

  if (user?.role !== "admin") return (
    <AdminLayout currentPage="AdminDashboard">
      <div className="p-10 text-center text-red-500 font-semibold">Akses Ditolak</div>
    </AdminLayout>
  );

  return (
    <AdminLayout currentPage="AdminDashboard">
      <div className="p-4 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1A1A1A]">Statistik</h1>
            <p className="text-sm text-[#8FA4C8] mt-0.5">Analytics & insight platform</p>
          </div>
          <button
            onClick={loadStats}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#1A1A1A] hover:bg-[#F8FAFC] transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Sticky Stat Bar — reuse from Inbox */}
        <AdminStatBar />

        <div className="mt-4 space-y-4">
          {/* Revenue Snapshot — replaces 3 separate MRR/Conversion cards */}
          <RevenueSnapshot
            mrr={stats?.totalMRR}
            premiumUsers={stats?.premiumUsers}
            totalUsers={stats?.totalUsers}
            conversionRate={stats?.conversionRate}
            churnCount={stats?.churnCount}
          />

          {/* Growth Chart — moved up */}
          {monthlyChartData.length > 0 && (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-[#E2E8F0]">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-[#1A1A1A]">Pertumbuhan User (6 bulan)</p>
                <p className="text-xs text-[#8FA4C8]">{stats?.onboardingRate}% onboarded</p>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F2F4F7" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="newUsers" fill="#F97316" radius={[4, 4, 0, 0]} name="New Users" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Heavy sections — collapsed by default on mobile */}
          <CollapsibleSection title="Landing Page Analytics" subtitle="Pengunjung, klik CTA & konversi">
            <LandingAnalyticsCard />
          </CollapsibleSection>

          <CollapsibleSection title="Waiting List" subtitle="Manajemen sign-up early access">
            <div className="p-4">
              <AdminWaitingListSection />
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Streak Manager" subtitle="Kelola streak & gamifikasi user">
            <div className="p-4">
              <AdminStreakManager onActionComplete={loadStats} />
            </div>
          </CollapsibleSection>
        </div>
      </div>
    </AdminLayout>
  );
}