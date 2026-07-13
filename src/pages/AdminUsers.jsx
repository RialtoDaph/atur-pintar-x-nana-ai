import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { CheckCircle2, Clock, AlertCircle, RefreshCw, UserX, Shield } from "lucide-react";
import UserMobileCard from "@/components/admin/UserMobileCard";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [showStats, setShowStats] = useState(true);
  const [cleaningUp, setCleaningUp] = useState(false);
  const [roleChangeModal, setRoleChangeModal] = useState(null); // { user, newRole }

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u?.role === "admin") loadData();
      else setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function loadData() {
    setLoading(true);
    // Fetch users and payments independently so a slow/failed payments call never
    // blocks the users table from rendering. Previously Promise.all made a single
    // failure stall the whole page in the loading spinner.
    // We also narrow payments to the two statuses this page actually uses
    // (pending banner + approve/reject actions) instead of pulling the full history.
    try {
      const allUsers = await base44.entities.User.list("-created_date", 1000);
      setUsers(allUsers || []);
    } catch (error) {
      setErrorMsg("Error loading users: " + error.message);
    }
    // Payments removed — akan pakai Apple IAP nantinya
    setLoading(false);
  }

  async function changeUserRole(targetUser, newRole) {
    if (newRole === 'admin' && !window.confirm(`Yakin ingin memberikan akses admin ke ${targetUser.email}? User ini akan punya akses penuh ke admin panel.`)) return;
    try {
      await base44.entities.User.update(targetUser.id, { role: newRole });
      setSuccessMsg(`✓ Role ${targetUser.email} diubah ke ${newRole}`);
      setTimeout(() => setSuccessMsg(""), 3000);
      setRoleChangeModal(null);
      await loadData();
    } catch (error) {
      setErrorMsg("Error changing role: " + error.message);
    }
  }

  async function toggleUserDisabled(targetUser) {
    const newState = !targetUser.is_disabled;
    try {
      await base44.entities.User.update(targetUser.id, { is_disabled: newState });
      setSuccessMsg(`✓ Akun ${targetUser.email} ${newState ? 'dinonaktifkan' : 'diaktifkan kembali'}`);
      setTimeout(() => setSuccessMsg(""), 3000);
      await loadData();
    } catch (error) {
      setErrorMsg("Error toggling user: " + error.message);
    }
  }

  // approvePayment/rejectPayment removed — Apple IAP will handle billing entitlements.

  const filteredUsers = users.filter(u => {
    // Premium = paid plan AND active status (matches the premiumUsers stat below)
    if (filter === "premium") return u.subscription_plan && u.subscription_plan !== "free" && u.subscription_status === "active";
    if (filter === "free") return !u.subscription_plan || u.subscription_plan === "free" || u.subscription_status !== "active";
    if (filter === "inactive") {
      // Match the "Inactive" stats card which uses 14 days
      const fourteenDaysAgoFilter = new Date();
      fourteenDaysAgoFilter.setDate(fourteenDaysAgoFilter.getDate() - 14);
      return new Date(u.updated_date || u.created_date) < fourteenDaysAgoFilter;
    }
    if (filter === "no_onboarding") return !u.onboarding_completed;
    return true;
  });
  const noOnboardingCount = users.filter(u => !u.onboarding_completed).length;

  // Stats
  const totalUsers = users.length;
  const premiumUsers = users.filter(u => u.subscription_plan && u.subscription_plan !== "free" && u.subscription_status === "active").length;
  const freeUsers = totalUsers - premiumUsers;
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  const inactiveUsers = users.filter(u => new Date(u.updated_date || u.created_date) < fourteenDaysAgo).length;

  // CSV Export
  async function cleanupSampleData() {
    if (!window.confirm("Hapus semua data sample dari larasadelia dan imeldaiis? Tindakan ini tidak bisa dibatalkan.")) return;
    setCleaningUp(true);
    try {
      const res = await base44.functions.invoke("cleanupSampleData", {});
      setSuccessMsg(`Berhasil menghapus ${res.data.deleted} records dari ${res.data.entities} entities`);
      setTimeout(() => setSuccessMsg(""), 5000);
      await loadData();
    } catch (error) {
      setErrorMsg("Error cleaning up data: " + error.message);
    }
    setCleaningUp(false);
  }

  const exportCSV = () => {
    const headers = ["Name", "Email", "Plan", "Status", "Joined", "Last Active"];
    const rows = users.map(u => [
      u.full_name || "—",
      u.email,
      u.subscription_plan || "free",
      u.subscription_status || "—",
      new Date(u.created_date).toLocaleDateString("id-ID"),
      new Date(u.updated_date || u.created_date).toLocaleDateString("id-ID")
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) return (
    <AdminLayout currentPage="AdminUsers">
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-[#F97316] border-t-transparent rounded-full animate-spin" />
      </div>
    </AdminLayout>
  );

  if (user?.role !== "admin") return (
    <AdminLayout currentPage="AdminUsers">
      <div className="p-10 text-center text-red-500 font-semibold">Akses Ditolak</div>
    </AdminLayout>
  );

  return (
    <AdminLayout currentPage="AdminUsers">
      <div className="p-4 sm:p-8">
        <AdminPageHeader title="User Management" subtitle="Kelola user & role" />
        
        {/* Quick Stats */}
        {showStats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-[#E2E8F0]">
              <p className="text-xs text-[#8FA4C8] font-medium">Total</p>
              <p className="text-2xl font-bold text-[#1A1A1A]">{totalUsers}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-[#E2E8F0]">
              <p className="text-xs text-[#8FA4C8] font-medium">Premium</p>
              <p className="text-2xl font-bold text-[#F97316]">{premiumUsers}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-[#E2E8F0]">
              <p className="text-xs text-[#8FA4C8] font-medium">Free</p>
              <p className="text-2xl font-bold text-gray-600">{freeUsers}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-[#E2E8F0]">
              <p className="text-xs text-[#8FA4C8] font-medium">Inactive</p>
              <p className="text-2xl font-bold text-red-600">{inactiveUsers}</p>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* Payment Approval Section removed — pembelian premium akan pindah ke Apple IAP. */}

        {/* Users Table */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E2E8F0]">
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <h2 className="text-base sm:text-lg font-bold text-[#1A1A1A]">Users ({filteredUsers.length})</h2>
            <div className="flex gap-2 flex-wrap">
               <button onClick={exportCSV} className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-green-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-green-700 transition-colors">
                📥 <span className="hidden sm:inline">Export CSV</span><span className="sm:hidden">CSV</span>
              </button>
              <button onClick={cleanupSampleData} disabled={cleaningUp} className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-red-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50">
                {cleaningUp ? "🗑️" : <>🗑️ <span className="hidden sm:inline">Cleanup</span></>}
              </button>
              <button onClick={loadData} className="p-2 hover:bg-[#F8FAFC] rounded-lg transition-colors">
                <RefreshCw className="w-4 h-4 text-[#F97316]" />
              </button>
            </div>
          </div>

          {/* Filter */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {["all", "premium", "free", "inactive", "no_onboarding"].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f ? "bg-[#F97316] text-white" : "bg-[#F8FAFC] text-[#1A1A1A] hover:bg-[#E2E8F0]"
                }`}
              >
                {f === "all" ? "All" : f === "inactive" ? "Inactive" : f === "no_onboarding" ? `Belum Onboarding (${noOnboardingCount})` : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Mobile: card list */}
          <div className="sm:hidden space-y-2">
            {filteredUsers.map(u => (
              <UserMobileCard
                key={u.id}
                u={u}
                currentUserEmail={user?.email}
                onRoleClick={(target) => setRoleChangeModal({ user: target, newRole: target.role === 'admin' ? 'user' : 'admin' })}
                onToggleDisabled={toggleUserDisabled}
              />
            ))}
            {filteredUsers.length === 0 && (
              <p className="text-center text-sm text-[#8FA4C8] py-8">Tidak ada user.</p>
            )}
          </div>

          {/* Desktop: original table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0]">
                  <th className="text-left py-3 px-2 font-semibold text-[#1A1A1A]">Name</th>
                  <th className="text-left py-3 px-2 font-semibold text-[#1A1A1A]">Email</th>
                  <th className="text-center py-3 px-2 font-semibold text-[#1A1A1A]">Plan</th>
                  <th className="text-center py-3 px-2 font-semibold text-[#1A1A1A]">Status</th>
                  <th className="text-center py-3 px-2 font-semibold text-[#1A1A1A]">Joined</th>
                  <th className="text-center py-3 px-2 font-semibold text-[#1A1A1A]">Last Active</th>
                  <th className="text-center py-3 px-2 font-semibold text-[#1A1A1A]">Onboarding</th>
                  <th className="text-center py-3 px-2 font-semibold text-[#1A1A1A]">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => {
                  const daysSinceActive = Math.floor((new Date() - new Date(u.updated_date || u.created_date)) / (1000 * 60 * 60 * 24));
                  return (
                    <tr key={u.id} className="border-b border-[#F2F4F7] hover:bg-[#F8FAFC]">
                      <td className="py-3 px-2 text-[#1A1A1A] font-medium">{u.full_name || "—"}</td>
                      <td className="py-3 px-2 text-[#1A1A1A] text-xs">{u.email}</td>
                      <td className="py-3 px-2 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.subscription_plan === "premium_monthly" ? "bg-[#F97316] text-white" : "bg-gray-200 text-gray-700"}`}>
                          {u.subscription_plan || "free"}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`flex items-center justify-center gap-1 ${u.subscription_status === "active" ? "text-green-600" : "text-gray-500"}`}>
                          {u.subscription_status === "active" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center text-[#8FA4C8] text-xs">{new Date(u.created_date).toLocaleDateString("id-ID")}</td>
                      <td className="py-3 px-2 text-center text-[#8FA4C8] text-xs">{daysSinceActive}d ago</td>
                      <td className="py-3 px-2 text-center">
                        {u.onboarding_completed ? (
                          <span className="text-green-500 text-xs font-semibold">✓</span>
                        ) : (
                          <span className="text-amber-500 text-xs font-semibold">Belum</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {u.email !== user?.email && (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setRoleChangeModal({ user: u, newRole: u.role === 'admin' ? 'user' : 'admin' })}
                              title={u.role === 'admin' ? 'Turunkan ke user' : 'Jadikan admin'}
                              className={`p-1.5 rounded-lg text-xs transition-colors ${u.role === 'admin' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                              <Shield className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => toggleUserDisabled(u)}
                              title={u.is_disabled ? 'Aktifkan akun' : 'Nonaktifkan akun'}
                              className={`p-1.5 rounded-lg text-xs transition-colors ${u.is_disabled ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}>
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Role Change Confirmation Modal */}
      {roleChangeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">Ubah Role User</h3>
            <p className="text-sm text-[#8FA4C8] mb-4">
              Ubah role <strong>{roleChangeModal.user.email}</strong> menjadi <strong>{roleChangeModal.newRole}</strong>?
              {roleChangeModal.newRole === 'admin' && " User ini akan punya akses penuh ke admin panel."}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setRoleChangeModal(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-medium hover:bg-[#F8FAFC]">Batal</button>
              <button onClick={() => changeUserRole(roleChangeModal.user, roleChangeModal.newRole)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#F97316] text-white text-sm font-bold hover:bg-[#EA580C]">
                Ya, Ubah Role
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}