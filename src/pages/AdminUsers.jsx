import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { CheckCircle2, XCircle, Clock, AlertCircle, RefreshCw, UserX, Shield } from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
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
    try {
      const [allUsers, allPayments] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.SubscriptionPayment.list()
      ]);
      setUsers(allUsers);
      setPayments(allPayments);
    } catch (error) {
      setErrorMsg("Error loading data: " + error.message);
    }
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

  async function approvePayment(paymentId, userEmail, plan, amount) {
    try {
      const today = new Date().toISOString().split("T")[0];
      const daysToAdd = plan === "premium_yearly" ? 365 : 30;
      const endDate = new Date(new Date().getTime() + daysToAdd * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      // Update payment
      await base44.entities.SubscriptionPayment.update(paymentId, { status: "approved", approved_at: today });

      // Upgrade user subscription
      const userList = await base44.entities.User.filter({ email: userEmail });
      if (userList.length > 0) {
        await base44.entities.User.update(userList[0].id, {
          subscription_plan: plan,
          subscription_status: "active",
          subscription_start_date: today,
          subscription_end_date: endDate
        });
      }

      // Send notification to user
      await base44.entities.AdminNotification.create({
        title: "🎉 Akun Premium Aktif!",
        message: "Pembayaran kamu sudah dikonfirmasi admin. Selamat menikmati semua fitur premium Atur Pintar! 🚀",
        target_type: "specific",
        target_email: userEmail,
        is_read: false,
        read_by: []
      });

      // Log action
      await base44.entities.SystemLog.create({
        log_type: "activity",
        user_email: user?.email || "admin",
        action: "payment_approved",
        severity: "info",
        details: `Plan: ${plan} upgraded for ${userEmail}, Amount: Rp ${amount}`
      });

      setSuccessMsg("✓ Pembayaran disetujui & user upgraded ke premium");
      setTimeout(() => setSuccessMsg(""), 3000);
      await loadData();
    } catch (error) {
      setErrorMsg("Error approving payment: " + error.message);
    }
  }

  async function rejectPayment(paymentId) {
    if (!window.confirm("Reject this payment?")) return;
    try {
      const paymentsList = await base44.entities.SubscriptionPayment.filter({ id: paymentId });
      const payment = paymentsList.length > 0 ? paymentsList[0] : null;
      const userEmail = payment?.user_email || payment?.created_by || "user@example.com";

      await base44.entities.SubscriptionPayment.update(paymentId, { status: "rejected" });

      // Send rejection notification
      await base44.entities.AdminNotification.create({
        title: "❌ Pembayaran Ditolak",
        message: "Pembayaran upgrade kamu telah ditolak. Silakan periksa riwayat atau hubungi support.",
        target_type: "specific",
        target_email: userEmail,
        is_read: false,
        read_by: []
      });

      // Log action
      await base44.entities.SystemLog.create({
        log_type: "activity",
        user_email: user?.email || "admin",
        action: "payment_rejected",
        severity: "warning",
        details: `Payment rejected for ${userEmail}`
      });

      setSuccessMsg("✓ Pembayaran ditolak");
      setTimeout(() => setSuccessMsg(""), 3000);
      await loadData();
    } catch (error) {
      setErrorMsg("Error rejecting payment: " + error.message);
    }
  }

  const filteredUsers = users.filter(u => {
    if (filter === "premium") return u.subscription_plan && u.subscription_plan !== "free";
    if (filter === "free") return !u.subscription_plan || u.subscription_plan === "free";
    if (filter === "inactive") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return new Date(u.updated_date || u.created_date) < thirtyDaysAgo;
    }
    return true;
  });

  const pendingPayments = payments.filter(p => p.status === "pending");
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const overduePending = pendingPayments.filter(p => new Date(p.created_date) < threeDaysAgo);
  
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
        <div className="w-8 h-8 border-4 border-[#FF6A00] border-t-transparent rounded-full animate-spin" />
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
        <AdminPageHeader title="User Management" subtitle="Manage users & approve payments" />
        
        {/* Quick Stats */}
        {showStats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-[#E2E8F0]">
              <p className="text-xs text-[#8FA4C8] font-medium">Total</p>
              <p className="text-2xl font-bold text-[#1A1A1A]">{totalUsers}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-[#E2E8F0]">
              <p className="text-xs text-[#8FA4C8] font-medium">Premium</p>
              <p className="text-2xl font-bold text-[#FF6A00]">{premiumUsers}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-[#E2E8F0]">
              <p className="text-xs text-[#8FA4C8] font-medium">Free</p>
              <p className="text-2xl font-bold text-gray-600">{freeUsers}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-[#E2E8F0]">
              <p className="text-xs text-[#8FA4C8] font-medium">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingPayments.length}</p>
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

        {/* Pending Payments Alert */}
        {overduePending.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-900">⚠️ {overduePending.length} payments overdue (&gt;3 days pending)</p>
              <p className="text-sm text-red-700 mt-1">Review in payment section below</p>
            </div>
          </div>
        )}

        {/* Payment Approval Section */}
        {pendingPayments.length > 0 && (
          <div className="mb-8 bg-white rounded-xl p-6 shadow-sm border border-[#E2E8F0]">
            <h2 className="text-lg font-bold text-[#1A1A1A] mb-4">Pending Payments ({pendingPayments.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    <th className="text-left py-3 px-2 font-semibold text-[#1A1A1A]">User Email</th>
                    <th className="text-right py-3 px-2 font-semibold text-[#1A1A1A]">Amount</th>
                    <th className="text-center py-3 px-2 font-semibold text-[#1A1A1A]">Status</th>
                    <th className="text-center py-3 px-2 font-semibold text-[#1A1A1A]">Days Pending</th>
                    <th className="text-center py-3 px-2 font-semibold text-[#1A1A1A]">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingPayments.map(p => {
                    const daysPending = Math.floor((new Date() - new Date(p.created_date)) / (1000 * 60 * 60 * 24));
                    return (
                      <tr key={p.id} className="border-b border-[#F2F4F7] hover:bg-[#F8FAFC]">
                        <td className="py-3 px-2 text-[#1A1A1A]">{p.created_by}</td>
                        <td className="py-3 px-2 text-right text-[#1A1A1A] font-medium">Rp {(p.amount || 0).toLocaleString("id-ID")}</td>
                        <td className="py-3 px-2 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${daysPending > 3 ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                            {daysPending}d
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center text-[#8FA4C8] text-xs">{new Date(p.created_date).toLocaleDateString("id-ID")}</td>
                        <td className="py-3 px-2 text-center space-x-2">
                          <button
                            onClick={() => approvePayment(p.id, p.user_email || p.created_by, p.plan, p.amount)}
                            className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => rejectPayment(p.id)}
                            className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700 transition-colors"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E2E8F0]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#1A1A1A]">Users ({filteredUsers.length})</h2>
            <div className="flex gap-2">
               <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                📥 Export CSV
              </button>
              <button onClick={cleanupSampleData} disabled={cleaningUp} className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50">
                {cleaningUp ? "🗑️ Cleaning..." : "🗑️ Cleanup"}
              </button>
              <button onClick={loadData} className="p-2 hover:bg-[#F8FAFC] rounded-lg transition-colors">
                <RefreshCw className="w-4 h-4 text-[#FF6A00]" />
              </button>
            </div>
          </div>

          {/* Filter */}
          <div className="flex gap-2 mb-4">
            {["all", "premium", "free", "inactive"].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f ? "bg-[#FF6A00] text-white" : "bg-[#F8FAFC] text-[#1A1A1A] hover:bg-[#E2E8F0]"
                }`}
              >
                {f === "all" ? "All" : f === "inactive" ? "Inactive" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0]">
                  <th className="text-left py-3 px-2 font-semibold text-[#1A1A1A]">Name</th>
                  <th className="text-left py-3 px-2 font-semibold text-[#1A1A1A]">Email</th>
                  <th className="text-center py-3 px-2 font-semibold text-[#1A1A1A]">Plan</th>
                  <th className="text-center py-3 px-2 font-semibold text-[#1A1A1A]">Status</th>
                  <th className="text-center py-3 px-2 font-semibold text-[#1A1A1A]">Joined</th>
                  <th className="text-center py-3 px-2 font-semibold text-[#1A1A1A]">Last Active</th>
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
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.subscription_plan === "premium_monthly" ? "bg-[#FF6A00] text-white" : "bg-gray-200 text-gray-700"}`}>
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
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#FF6A00] text-white text-sm font-bold hover:bg-[#E55A00]">
                Ya, Ubah Role
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}