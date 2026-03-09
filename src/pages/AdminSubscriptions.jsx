import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AdminLayout from "@/components/admin/AdminLayout";
import { CreditCard, Users, CheckCircle2, XCircle, RefreshCw } from "lucide-react";

// Placeholder subscription data since this is a freemium app
// In a real app, integrate with Stripe or payment provider
export default function AdminSubscriptions() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u?.role === "admin") loadData();
      else setLoading(false);
    });
  }, []);

  async function loadData() {
    setLoading(true);
    const res = await base44.functions.invoke("adminGetUsers", {});
    setUsers(res.data?.users || []);
    setLoading(false);
  }

  // Simulate subscription statuses based on settings_unlocked
  const subscriptionData = users.map(u => ({
    ...u,
    plan: u.role === "admin" ? "Admin" : u.settings?.settings_unlocked ? "Premium" : "Free",
    status: "active",
    startDate: u.created_date,
  }));

  const premiumCount = subscriptionData.filter(u => u.plan === "Premium").length;
  const freeCount = subscriptionData.filter(u => u.plan === "Free").length;

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "-";

  if (loading) return (
    <AdminLayout currentPage="AdminSubscriptions">
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-[#FF6A00] border-t-transparent rounded-full animate-spin" />
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout currentPage="AdminSubscriptions">
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">Subscription Panel</h1>
            <p className="text-sm text-[#8FA4C8] mt-1">Status langganan pengguna</p>
          </div>
          <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E2E8F0] rounded-xl text-sm font-medium hover:bg-[#F8FAFC] shadow-sm">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1"><Users className="w-4 h-4 text-[#FF6A00]" /><p className="text-xs text-[#8FA4C8]">Total Users</p></div>
            <p className="text-2xl font-bold text-[#1A1A1A]">{users.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1"><CreditCard className="w-4 h-4 text-purple-500" /><p className="text-xs text-[#8FA4C8]">Premium</p></div>
            <p className="text-2xl font-bold text-purple-600">{premiumCount}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1"><CheckCircle2 className="w-4 h-4 text-green-500" /><p className="text-xs text-[#8FA4C8]">Free Plan</p></div>
            <p className="text-2xl font-bold text-green-600">{freeCount}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1"><CreditCard className="w-4 h-4 text-blue-500" /><p className="text-xs text-[#8FA4C8]">Konversi</p></div>
            <p className="text-2xl font-bold text-blue-600">
              {users.length > 0 ? ((premiumCount / users.length) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>

        {/* Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
          <p className="text-sm text-amber-700 font-medium">⚡ Payment Integration</p>
          <p className="text-xs text-amber-600 mt-1">
            Untuk integrasi pembayaran penuh (Stripe, Midtrans), hubungkan payment gateway.
            Saat ini menampilkan data berdasarkan status settings_unlocked sebagai proxy.
          </p>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F2F4F7]">
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#8FA4C8] uppercase tracking-wider">User</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#8FA4C8] uppercase tracking-wider">Plan</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#8FA4C8] uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#8FA4C8] uppercase tracking-wider">Bergabung</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#8FA4C8] uppercase tracking-wider">Bahasa</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#8FA4C8] uppercase tracking-wider">Mata Uang</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F4F7]">
                {subscriptionData.map(u => (
                  <tr key={u.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#FF6A00] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {u.full_name?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#1A1A1A]">{u.full_name || "—"}</p>
                          <p className="text-xs text-[#8FA4C8]">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        u.plan === "Premium" ? "bg-purple-50 text-purple-600" :
                        u.plan === "Admin" ? "bg-[#FF6A00]/10 text-[#FF6A00]" :
                        "bg-[#F2F4F7] text-[#8FA4C8]"
                      }`}>
                        {u.plan}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1 text-xs font-semibold text-green-600 w-fit">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Active
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-[#1A1A1A]">{formatDate(u.startDate)}</td>
                    <td className="px-5 py-4 text-sm text-[#8FA4C8]">{u.settings?.language || "—"}</td>
                    <td className="px-5 py-4 text-sm text-[#8FA4C8]">{u.settings?.currency || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {subscriptionData.length === 0 && (
            <div className="py-12 text-center text-sm text-[#8FA4C8]">Belum ada data</div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}