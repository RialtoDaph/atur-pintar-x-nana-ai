import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Search, RefreshCw, Eye, Users, UserCheck, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AdminUsers() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [txCounts, setTxCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u?.role === "admin") loadData();
      else setLoading(false);
    });
  }, []);

  async function loadData() {
    setLoading(true);
    const [usersRes, txRes] = await Promise.all([
      base44.functions.invoke("adminGetUsers", {}),
      base44.functions.invoke("adminGetAllTransactions", {}),
    ]);
    const usersData = usersRes.data?.users || [];
    setUsers(usersData);

    // Count transactions per user email
    const counts = {};
    for (const t of txRes.data?.transactions || []) {
      counts[t.created_by] = (counts[t.created_by] || 0) + 1;
    }
    setTxCounts(counts);
    setLoading(false);
  }

  const filtered = users.filter(u => {
    const matchSearch = u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "all" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "-";

  if (loading) return (
    <AdminLayout currentPage="AdminUsers">
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-[#FF6A00] border-t-transparent rounded-full animate-spin" />
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout currentPage="AdminUsers">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">User Management</h1>
            <p className="text-sm text-[#8FA4C8] mt-1">{users.length} pengguna terdaftar</p>
          </div>
          <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E2E8F0] rounded-xl text-sm font-medium hover:bg-[#F8FAFC] shadow-sm">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-[#FF6A00]" />
              <p className="text-xs text-[#8FA4C8]">Total Users</p>
            </div>
            <p className="text-2xl font-bold text-[#1A1A1A]">{users.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-[#FF6A00]" />
              <p className="text-xs text-[#8FA4C8]">Admin</p>
            </div>
            <p className="text-2xl font-bold text-[#1A1A1A]">{users.filter(u => u.role === "admin").length}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <UserCheck className="w-4 h-4 text-[#FF6A00]" />
              <p className="text-xs text-[#8FA4C8]">Dengan Transaksi</p>
            </div>
            <p className="text-2xl font-bold text-[#1A1A1A]">{users.filter(u => (txCounts[u.email] || 0) > 0).length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8FA4C8]" />
              <input
                type="text"
                placeholder="Cari nama atau email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
              />
            </div>
            <select
              value={filterRole}
              onChange={e => setFilterRole(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
            >
              <option value="all">Semua Role</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F2F4F7]">
                 <th className="text-left px-4 py-2.5 text-xs font-bold text-[#8FA4C8] uppercase tracking-wider">User</th>
                 <th className="text-left px-4 py-2.5 text-xs font-bold text-[#8FA4C8] uppercase tracking-wider">Role</th>
                 <th className="text-left px-4 py-2.5 text-xs font-bold text-[#8FA4C8] uppercase tracking-wider">Terdaftar</th>
                 <th className="text-right px-4 py-2.5 text-xs font-bold text-[#8FA4C8] uppercase tracking-wider">Tx</th>
                 <th className="text-right px-4 py-2.5 text-xs font-bold text-[#8FA4C8] uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F4F7]">
                {filtered.map(u => (
                  <tr key={u.id} className="hover:bg-[#F8FAFC] transition-colors">
                   <td className="px-4 py-3">
                     <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-[#FF6A00] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {u.full_name?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#1A1A1A]">{u.full_name || "—"}</p>
                          <p className="text-xs text-[#8FA4C8]">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${u.role === "admin" ? "bg-[#FF6A00]/10 text-[#FF6A00]" : "bg-[#F2F4F7] text-[#8FA4C8]"}`}>
                        {u.role || "user"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-[#1A1A1A]">{formatDate(u.created_date)}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-semibold text-[#1A1A1A]">{txCounts[u.email] || 0}</span>
                    </td>
                    <td className="px-4 py-3">
                     <div className="flex items-center justify-end gap-2">
                       <Link
                         to={`${createPageUrl("AdminUserSupport")}?email=${encodeURIComponent(u.email)}`}
                         className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                         title="Lihat Detail"
                       >
                         <Eye className="w-3.5 h-3.5" />
                       </Link>
                     </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-[#8FA4C8]">Tidak ada user ditemukan</div>
          )}
        </div>


      </div>
    </AdminLayout>
  );
}