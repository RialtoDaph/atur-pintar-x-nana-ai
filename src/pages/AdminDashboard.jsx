import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminStatCard from "@/components/admin/AdminStatCard";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminStreakManager from "@/components/admin/AdminStreakManager";
import { Users, TrendingUp, DollarSign, Clock, AlertTriangle, RefreshCw, CheckCircle2, UserX, Send, X } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";
import AdminWaitingListSection from "@/components/admin/AdminWaitingListSection";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [monthlyChartData, setMonthlyChartData] = useState([]);
  const [notOnboardedModal, setNotOnboardedModal] = useState(false);
  const [notOnboardedList, setNotOnboardedList] = useState([]);
  const [sendingReminder, setSendingReminder] = useState({});

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
      const [allUsers, allTransactions, pendingPayments, approvedPayments, allAlerts] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.Transaction.list(),
        base44.entities.SubscriptionPayment.filter({ status: "pending" }),
        base44.entities.SubscriptionPayment.filter({ status: "approved" }),
        base44.entities.Alert.list()
      ]);

      // Calculate metrics
      const totalUsers = allUsers.length;
      const premiumMonthly = allUsers.filter(u => u.subscription_plan === "premium_monthly" && u.subscription_status === "active");
      const premiumYearly = allUsers.filter(u => u.subscription_plan === "premium_yearly" && u.subscription_status === "active");
      const premiumUsers = allUsers.filter(u => u.subscription_plan && u.subscription_plan !== "free" && u.subscription_status === "active").length;
      const thisMonth = new Date().toISOString().slice(0, 7);
      const newUsersThisMonth = allUsers.filter(u => u.created_date?.startsWith(thisMonth)).length;
      
      // Pending payments older than 3 days
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const oldPendingCount = pendingPayments.filter(p => new Date(p.created_date) < threeDaysAgo).length;

      // April revenue (approved payments in April 2026) - REAL: 88000 (49k + 39k)
      const aprilPayments = approvedPayments.filter(p => {
        const date = p.approved_at || p.created_date;
        return date?.startsWith("2026-04");
      });
      const monthlyRevenue = aprilPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

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
      const notOnboarded = allUsers.filter(u => !u.onboarding_completed);
      setNotOnboardedList(notOnboarded);
      
      // New users this month (April 2026)
      const newThisMonth = allUsers.filter(u => u.created_date?.startsWith(thisMonth)).length;

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

      // MRR calculation
      const mrrMonthly = premiumMonthly.length * 49000;
      const mrrYearly = premiumYearly.length * 40833;
      const totalMRR = mrrMonthly + mrrYearly;

      // Churn (expired subscriptions this month)
      const expiredUsers = allUsers.filter(u => u.subscription_status === "expired" && u.updated_date?.startsWith(thisMonth)).length;

      // Alert for pending & expiring
      const sixDaysFromNow = new Date();
      sixDaysFromNow.setDate(sixDaysFromNow.getDate() + 7);
      const expiringUsers = allUsers.filter(u => {
        if (!u.subscription_end_date || u.subscription_status !== "active") return false;
        const endDate = new Date(u.subscription_end_date);
        return endDate <= sixDaysFromNow && endDate > new Date();
      }).length;

      setStats({
        totalUsers,
        premiumUsers,
        freeUsers: totalUsers - premiumUsers,
        newUsersThisMonth: newThisMonth,
        notOnboardedCount: notOnboarded.length,
        pendingPaymentCount: pendingPayments.length,
        oldPendingCount,
        monthlyRevenue: Math.round(monthlyRevenue),
        totalMRR: Math.round(totalMRR),
        conversionRate: totalUsers > 0 ? Math.round((premiumUsers / totalUsers) * 100) : 0,
        churnCount: expiredUsers,
        activeUsers,
        onboardingRate,
        completedOnboarding,
        expiringUsers,
        alertCount: allAlerts.filter(a => a.status === "unread").length
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

        {/* Pending Payment Alert */}
        {stats?.pendingPaymentCount > 0 && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-center justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-orange-900">⚠️ Ada {stats.pendingPaymentCount} pembayaran menunggu persetujuan</p>
                <p className="text-sm text-orange-700 mt-1">Segera review di halaman AdminUsers</p>
              </div>
            </div>
            <button onClick={() => navigate('/AdminUsers')} className="px-4 py-2 bg-orange-600 text-white text-sm font-bold rounded-lg hover:bg-orange-700 flex-shrink-0">
              Review →
            </button>
          </div>
        )}

        {/* Expiring Subscription Alert */}
        {stats?.expiringUsers > 0 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-900">⏰ {stats.expiringUsers} langganan akan berakhir dalam 7 hari</p>
              <p className="text-sm text-yellow-700 mt-1">Pertimbangkan untuk mengingatkan user</p>
            </div>
          </div>
        )}

        {/* All OK Status */}
        {stats?.pendingPaymentCount === 0 && stats?.expiringUsers === 0 && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-900">✓ Semua langganan & pembayaran dalam kondisi baik</p>
            </div>
          </div>
        )}

        {/* MRR & Conversion Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[#E2E8F0]">
            <p className="text-xs text-[#8FA4C8] font-medium mb-2">MRR (Monthly Recurring Revenue)</p>
            <p className="text-3xl font-bold text-[#FF6A00]">Rp {fmt(stats?.totalMRR)}</p>
            <p className="text-xs text-[#8FA4C8] mt-2">From {stats?.premiumUsers} premium users</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[#E2E8F0]">
            <p className="text-xs text-[#8FA4C8] font-medium mb-2">Premium Conversion</p>
            <p className="text-3xl font-bold text-[#FF6A00]">{stats?.conversionRate}%</p>
            <p className="text-xs text-[#8FA4C8] mt-2">{stats?.premiumUsers}/{stats?.totalUsers} users</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[#E2E8F0]">
            <p className="text-xs text-[#8FA4C8] font-medium mb-2">Pending Payments</p>
            <p className="text-3xl font-bold text-[#FF6A00]">{stats?.pendingPaymentCount || 0}</p>
            <p className="text-xs text-[#8FA4C8] mt-2">{stats?.pendingPaymentCount === 0 ? "✓ Aman" : "Perlu review"}</p>
          </div>
          </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[#E2E8F0]">
            <p className="text-xs text-[#8FA4C8] font-medium mb-2">Onboarding Completion</p>
            <p className="text-3xl font-bold text-[#FF6A00]">{stats?.onboardingRate}%</p>
            <p className="text-xs text-[#8FA4C8] mt-2">{stats?.completedOnboarding}/{stats?.totalUsers} users</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[#E2E8F0]">
            <p className="text-xs text-[#8FA4C8] font-medium mb-2">Premium Rate</p>
            <p className="text-3xl font-bold text-[#FF6A00]">{stats?.totalUsers > 0 ? Math.round((stats?.premiumUsers / stats?.totalUsers) * 100) : 0}%</p>
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

        {/* Not Onboarded Widget */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-[#E2E8F0] mb-6 cursor-pointer hover:border-[#FF6A00]/40 transition-colors" onClick={() => setNotOnboardedModal(true)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <UserX className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1A1A1A]">User Belum Selesai Onboarding</p>
                <p className="text-xs text-[#8FA4C8]">Klik untuk lihat daftar dan kirim reminder</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-amber-600">{stats?.notOnboardedCount ?? 0}</p>
          </div>
        </div>

        {/* Waiting List Section */}
        <div className="mt-6">
          <AdminWaitingListSection />
        </div>

        {/* Streak Manager */}
         <div className="mt-6">
           <AdminStreakManager onActionComplete={loadStats} />
         </div>

        {/* Not Onboarded Modal */}
        {notOnboardedModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] flex flex-col shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#F2F4F7]">
                <h3 className="font-bold text-[#1A1A1A]">User Belum Onboarding ({notOnboardedList.length})</h3>
                <button onClick={() => setNotOnboardedModal(false)} className="p-1 hover:bg-[#F2F4F7] rounded"><X className="w-4 h-4" /></button>
              </div>
              <div className="overflow-y-auto flex-1 px-6 py-4 space-y-2">
                {notOnboardedList.length === 0 && <p className="text-sm text-[#8FA4C8] text-center py-6">Semua user sudah selesai onboarding! 🎉</p>}
                {notOnboardedList.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-xl">
                    <div>
                      <p className="text-sm font-semibold text-[#1A1A1A]">{u.full_name || u.email}</p>
                      <p className="text-xs text-[#8FA4C8]">{u.email}</p>
                      <p className="text-xs text-[#8FA4C8]">Daftar: {u.created_date ? new Date(u.created_date).toLocaleDateString('id-ID') : '-'}</p>
                    </div>
                    <button
                       disabled={sendingReminder[u.id]}
                       onClick={async () => {
                         setSendingReminder(prev => ({ ...prev, [u.id]: true }));
                         await base44.entities.AdminNotification.create({
                           title: '👋 Selesaikan setup akunmu!',
                           message: 'Hei! Kamu belum selesai proses onboarding Atur Pintar. Yuk buka app dan selesaikan setup untuk mulai kelola keuanganmu.',
                           target_type: 'specific',
                           target_email: u.email
                         });
                         setSendingReminder(prev => ({ ...prev, [u.id]: false }));
                       }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF6A00] text-white text-xs font-bold rounded-lg hover:bg-[#e05e00] disabled:opacity-50 transition-colors flex-shrink-0">
                      {sendingReminder[u.id] ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-3 h-3" />}
                      Kirim Reminder
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}