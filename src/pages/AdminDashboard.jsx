import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminStatCard from "@/components/admin/AdminStatCard";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Users, ArrowLeftRight, TrendingUp, TrendingDown, UserCheck, UserCheck2, RefreshCw } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend,
} from "recharts";

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u?.role === "admin") loadStats();
      else setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function loadStats() {
    setLoading(true);
    const res = await base44.functions.invoke("adminGetDashboardStats", {});
    setStats(res.data);
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
          <AdminStatCard icon={UserCheck} label="Aktif (Bulan ini)" value={fmt(stats?.activeUsersMonthly)} sub={`${stats?.activeUsersDaily ?? 0} aktif hari ini`} color="blue" />
          <AdminStatCard icon={ArrowLeftRight} label="Total Transaksi" value={fmt(stats?.totalTransactions)} color="purple" />
          <AdminStatCard icon={TrendingUp} label="Total Pemasukan" value={`Rp ${fmt(stats?.totalIncome)}`} color="green" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-[#8FA4C8] font-medium">Total Pengeluaran</p>
              <TrendingDown className="w-4 h-4 text-red-400" />
            </div>
            <p className="text-2xl font-bold text-red-500">Rp {fmt(stats?.totalExpense)}</p>
            <p className="text-xs text-[#8FA4C8] mt-1">
              Net: {stats?.totalIncome - stats?.totalExpense >= 0 ? "+" : ""}Rp {fmt(Math.abs((stats?.totalIncome ?? 0) - (stats?.totalExpense ?? 0)))}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-[#8FA4C8] font-medium">Goals & Debts</p>
              <UserCheck2 className="w-4 h-4 text-[#FF6A00]" />
            </div>
            <p className="text-2xl font-bold text-[#1A1A1A]">{stats?.totalGoals ?? 0} Goals</p>
            <p className="text-xs text-[#8FA4C8] mt-1">{stats?.totalDebts ?? 0} Debts terdaftar</p>
          </div>
        </div>

        {/* Charts */}
        {stats?.chartData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="text-sm font-semibold text-[#1A1A1A] mb-4">Pertumbuhan Transaksi (6 Bulan)</p>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={stats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F2F4F7" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="transactions" stroke="#FF6A00" fill="#FF6A00" fillOpacity={0.15} name="Transaksi" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="text-sm font-semibold text-[#1A1A1A] mb-4">User Baru vs User Aktif (6 Bulan)</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F2F4F7" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="newUsers" fill="#FF6A00" name="User Baru" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="activeUsers" fill="#3B82F6" name="User Aktif" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}