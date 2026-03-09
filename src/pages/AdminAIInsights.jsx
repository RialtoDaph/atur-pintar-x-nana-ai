import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Sparkles, TrendingUp, TrendingDown, RefreshCw, Search } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminAIInsights() {
  const [user, setUser] = useState(null);
  const [insights, setInsights] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u?.role === "admin") loadData();
      else setLoading(false);
    });
  }, []);

  async function loadData() {
    setLoading(true);
    const res = await base44.functions.invoke("adminGetAIInsights", {});
    setInsights(res.data?.insights || []);
    setStats({ totalCalls: res.data?.totalAICallsEstimate });
    setLoading(false);
  }

  const filtered = insights.filter(i =>
    i.user_email?.toLowerCase().includes(search.toLowerCase()) ||
    i.user_name?.toLowerCase().includes(search.toLowerCase())
  );

  const deficitUsers = insights.filter(i => i.has_deficit).length;
  const avgSavings = insights.length > 0
    ? (insights.reduce((s, i) => s + (i.savings_rate || 0), 0) / insights.length).toFixed(1)
    : 0;

  const savingsDistribution = [
    { label: "< 0% (Defisit)", count: insights.filter(i => i.savings_rate < 0).length },
    { label: "0–10%", count: insights.filter(i => i.savings_rate >= 0 && i.savings_rate < 10).length },
    { label: "10–20%", count: insights.filter(i => i.savings_rate >= 10 && i.savings_rate < 20).length },
    { label: "20–30%", count: insights.filter(i => i.savings_rate >= 20 && i.savings_rate < 30).length },
    { label: "> 30%", count: insights.filter(i => i.savings_rate >= 30).length },
  ];

  const fmt = (n) => n?.toLocaleString("id-ID") ?? "0";

  if (loading) return (
    <AdminLayout currentPage="AdminAIInsights">
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-[#FF6A00] border-t-transparent rounded-full animate-spin" />
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout currentPage="AdminAIInsights">
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">AI Insights Monitoring</h1>
            <p className="text-sm text-[#8FA4C8] mt-1">Analisis finansial berbasis AI per user</p>
          </div>
          <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E2E8F0] rounded-xl text-sm font-medium hover:bg-[#F8FAFC] shadow-sm">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-[#FF6A00]" /><p className="text-xs text-[#8FA4C8]">User Dianalisis</p></div>
            <p className="text-2xl font-bold text-[#1A1A1A]">{insights.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1"><TrendingDown className="w-4 h-4 text-red-400" /><p className="text-xs text-[#8FA4C8]">User Defisit</p></div>
            <p className="text-2xl font-bold text-red-500">{deficitUsers}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1"><TrendingUp className="w-4 h-4 text-green-500" /><p className="text-xs text-[#8FA4C8]">Avg Savings Rate</p></div>
            <p className="text-2xl font-bold text-green-600">{avgSavings}%</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-purple-500" /><p className="text-xs text-[#8FA4C8]">Est. AI Calls</p></div>
            <p className="text-2xl font-bold text-purple-600">{stats?.totalCalls ?? 0}</p>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
          <p className="text-sm font-semibold text-[#1A1A1A] mb-4">Distribusi Savings Rate</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={savingsDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F2F4F7" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#FF6A00" radius={[4, 4, 0, 0]} name="Jumlah User" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8FA4C8]" />
            <input type="text" placeholder="Cari user..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]" />
          </div>
        </div>

        {/* Insights Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F2F4F7]">
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#8FA4C8] uppercase tracking-wider">User</th>
                  <th className="text-right px-5 py-3 text-xs font-bold text-[#8FA4C8] uppercase tracking-wider">Transaksi</th>
                  <th className="text-right px-5 py-3 text-xs font-bold text-[#8FA4C8] uppercase tracking-wider">Pemasukan</th>
                  <th className="text-right px-5 py-3 text-xs font-bold text-[#8FA4C8] uppercase tracking-wider">Pengeluaran</th>
                  <th className="text-right px-5 py-3 text-xs font-bold text-[#8FA4C8] uppercase tracking-wider">Savings Rate</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#8FA4C8] uppercase tracking-wider">AI Insight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F4F7]">
                {filtered.map((i, idx) => (
                  <tr key={idx} className={`hover:bg-[#F8FAFC] transition-colors ${i.has_deficit ? "bg-red-50/40" : ""}`}>
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-[#1A1A1A]">{i.user_name || "—"}</p>
                      <p className="text-xs text-[#8FA4C8]">{i.user_email}</p>
                    </td>
                    <td className="px-5 py-4 text-right text-sm font-semibold text-[#1A1A1A]">{i.transaction_count}</td>
                    <td className="px-5 py-4 text-right text-sm font-semibold text-green-600">Rp {fmt(i.total_income)}</td>
                    <td className="px-5 py-4 text-right text-sm font-semibold text-red-500">Rp {fmt(i.total_expense)}</td>
                    <td className="px-5 py-4 text-right">
                      <span className={`text-sm font-bold ${i.savings_rate < 0 ? "text-red-500" : i.savings_rate > 20 ? "text-green-600" : "text-[#8FA4C8]"}`}>
                        {i.savings_rate}%
                      </span>
                    </td>
                    <td className="px-5 py-4 max-w-xs">
                      <p className="text-xs text-[#8FA4C8] leading-relaxed">{i.insight}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-[#8FA4C8]">Belum ada data insights</div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}