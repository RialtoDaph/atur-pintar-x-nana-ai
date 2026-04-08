import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { CheckCircle2, XCircle, Clock, AlertCircle, RefreshCw } from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

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

  async function approvePayment(paymentId, userEmail, amount) {
    try {
      const today = new Date().toISOString().split("T")[0];
      const endDate = new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      // Update payment
      await base44.entities.SubscriptionPayment.update(paymentId, { status: "approved", approved_at: today });

      // Upgrade user subscription
      const userList = await base44.entities.User.filter({ email: userEmail });
      if (userList.length > 0) {
        await base44.entities.User.update(userList[0].id, {
          subscription_plan: "premium_monthly",
          subscription_status: "active",
          subscription_start_date: today,
          subscription_end_date: endDate
        });
      }

      // Send notification to user
      await base44.entities.AdminNotification.create({
        title: "🎉 Selamat! Akun kamu sudah Premium!",
        message: "Pembayaran kamu sudah dikonfirmasi. Selamat menikmati fitur premium Atur Pintar!",
        target_type: "specific",
        target_email: userEmail,
        is_read: false,
        read_by: []
      });

      // Log action
      await base44.entities.SystemLog.create({
        log_type: "activity",
        user_email: userEmail,
        action: "payment_approved",
        severity: "info",
        details: `Payment approved for ${userEmail}: Rp ${amount}`
      });

      setSuccessMsg("Payment approved & user upgraded to premium");
      setTimeout(() => setSuccessMsg(""), 3000);
      await loadData();
    } catch (error) {
      setErrorMsg("Error approving payment: " + error.message);
    }
  }

  async function rejectPayment(paymentId) {
    if (!window.confirm("Reject this payment?")) return;
    try {
      const payment = await base44.entities.SubscriptionPayment.filter({ id: paymentId });
      const userEmail = payment.length > 0 ? payment[0].created_by : "user@example.com";

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
        user_email: userEmail,
        action: "payment_rejected",
        severity: "info"
      });

      setSuccessMsg("Payment rejected");
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
                            onClick={() => approvePayment(p.id, p.created_by, p.amount)}
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
            <button onClick={loadData} className="p-2 hover:bg-[#F8FAFC] rounded-lg transition-colors">
              <RefreshCw className="w-4 h-4 text-[#FF6A00]" />
            </button>
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}