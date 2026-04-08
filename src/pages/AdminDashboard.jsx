import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminStatCard from "@/components/admin/AdminStatCard";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminStreakManager from "@/components/admin/AdminStreakManager";
import { Users, TrendingUp, DollarSign, Clock, AlertTriangle, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

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
      // Fetch all data in parallel
      const [allUsers, allSubs, allTransactions, pendingPayments] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.Subscription.list(),
        base44.entities.Transaction.list(),
        base44.entities.SubscriptionPayment.filter({ status: "pending" })
      ]);

      // Calculate metrics
      const totalUsers = allUsers.length;
      const premiumUsers = allUsers.filter(u => u.subscription_plan && u.subscription_plan !== "free").length;
      const thisMonth = new Date().toISOString().slice(0, 7);
      const newUsersThisMonth = allUsers.filter(u => u.created_date?.startsWith(thisMonth)).length;
      
      // Pending payments older than 3 days
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const oldPendingCount = pendingPayments.filter(p => new Date(p.created_date) < threeDaysAgo).length;

      // Monthly revenue (approved payments this month)
      const approvedThisMonth = await base44.entities.SubscriptionPayment.filter({ status: "approved" });
      const monthlyRevenue = approvedThisMonth
        .filter(p => p.created_date?.startsWith(thisMonth))
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      // Active users (transactions in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const activeUsers = new Set(
        allTransactions
          .filter(t => new Date(t.created_date) > thirtyDaysAgo)
          .map(t => t.created_by)
      ).size;

      // Onboarding completion rate
      const completedOnboarding = allUsers.filter(u => u.onboarding_completed).length;
      const onboardingRate = totalUsers > 0 ? Math.round((completedOnboarding / totalUsers) * 100) : 0;

      // Generate monthly chart data (last 6 months)
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

      setStats({
        totalUsers,
        premiumUsers,
        newUsersThisMonth,
        pendingPaymentCount: pendingPayments.length,
        oldPendingCount,
        monthlyRevenue: Math.round(monthlyRevenue),
        activeUsers,
        onboardingRate,
        completedOnboarding
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
        <div className="w-8 h-8 border-4 border-[#FF6A00] border-t-transparent rounded-full animate-spin" />
      </div>
    </AdminLayout>
  );

  if (user?.role !== "admin") return (
    <AdminLayout currentPage="AdminDashboard">
      <div className="p-10 text-center text-red-500 font-semibold">Akses Ditolak</div>
    </AdminLayout>
  );

  const fmt = (n) => n?.toLocaleString("id-ID") ?? "-";

  return (
    <AdminLayout currentPage="AdminDashboard">
      <div className="p-4 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1A1A1A]">Admin Dashboard</h1>
            <p className="text-sm text-[#8FA4C8] mt-0.5">Overview sistem Atur Pintar</p>
          </div>
          <button
            onClick={loadStats}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#1A1A1A] hover:bg-[#F8FAFC] transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <AdminStatCard icon={Users} label="Total Pengguna" value={fmt(stats?.totalUsers)} color="orange" />
          <AdminStatCard icon={TrendingUp} label="Premium Users" value={fmt(stats?.premiumUsers)} sub={`${stats?.newUsersThisMonth ?? 0} baru bulan ini`} color="blue" />
          <AdminStatCard icon={DollarSign} label="Revenue (Bulan)" value={`Rp ${fmt(stats?.monthlyRevenue)}`} color="green" />
          <AdminStatCard icon={Clock} label="Aktif (30 hari)" value={fmt(stats?.activeUsers)} sub={`${stats?.onboardingRate ?? 0}% selesai onboarding`} color="purple" />
        </div>

        {/* Alerts */}
        {stats?.oldPendingCount > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">⚠️ {stats.oldPendingCount} pending payments older than 3 days</p>
              <p className="text-sm text-red-700 mt-1">Review & approve/reject in Admin Users page</p>
            </div>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[#E2E8F0]">
            <p className="text-xs text-[#8FA4C8] font-medium mb-2">Onboarding Completion</p>
            <p className="text-3xl font-bold text-[#FF6A00]">{stats?.onboardingRate}%</p>
            <p className="text-xs text-[#8FA4C8] mt-2">{stats?.completedOnboarding}/{stats?.totalUsers} users</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[#E2E8F0]">
            <p className="text-xs text-[#8FA4C8] font-medium mb-2">Pending Payments</p>
            <p className="text-3xl font-bold text-[#FF6A00]">{stats?.pendingPaymentCount}</p>
            <p className="text-xs text-red-600 mt-2">{stats?.oldPendingCount} overdue</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[#E2E8F0]">
            <p className="text-xs text-[#8FA4C8] font-medium mb-2">Premium Rate</p>
            <p className="text-3xl font-bold text-[#FF6A00]">{stats?.totalUsers > 0 ? Math.round((stats.premiumUsers / stats.totalUsers) * 100) : 0}%</p>
            <p className="text-xs text-[#8FA4C8] mt-2">{stats?.premiumUsers}/{stats?.totalUsers} users</p>
          </div>
        </div>

        {/* Chart */}
        {monthlyChartData.length > 0 && (
          <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E2E8F0] mb-6">
            <p className="text-sm font-semibold text-[#1A1A1A] mb-4">New Users (Last 6 Months)</p>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F2F4F7" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="newUsers" fill="#FF6A00" radius={[4, 4, 0, 0]} name="New Users" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Streak Manager */}
        <div className="mt-6">
          <AdminStreakManager onActionComplete={loadStats} />
        </div>
      </div>
    </AdminLayout>
  );
}