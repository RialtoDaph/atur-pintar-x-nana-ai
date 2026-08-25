import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { CreditCard, Search, ExternalLink, CheckCircle2, XCircle, Clock, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const STATUS_STYLES = {
  pending: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", icon: Clock, label: "Pending" },
  approved: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", icon: CheckCircle2, label: "Approved" },
  rejected: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: XCircle, label: "Rejected" },
  expired: { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200", icon: XCircle, label: "Expired" },
};

export default function AdminSubscriptions() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  async function loadPayments() {
    setRefreshing(true);
    try {
      const list = await base44.entities.SubscriptionPayment.list("-created_date", 200);
      setPayments(list || []);
    } catch {
      toast.error("Gagal memuat data pembayaran");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadPayments();
  }, []);

  const filtered = useMemo(() => {
    return payments.filter(p => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!(p.user_email?.toLowerCase().includes(s) || p.user_name?.toLowerCase().includes(s))) return false;
      }
      return true;
    });
  }, [payments, statusFilter, search]);

  const stats = useMemo(() => {
    const totalRevenue = payments.filter(p => p.status === "approved").reduce((sum, p) => sum + (p.amount || 0), 0);
    const pending = payments.filter(p => p.status === "pending").length;
    const approved = payments.filter(p => p.status === "approved").length;
    return { totalRevenue, pending, approved };
  }, [payments]);

  const formatRp = (n) => "Rp " + (n || 0).toLocaleString("id-ID");
  const formatDate = (d) => d ? new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-";

  async function markAsApproved(payment) {
    if (!confirm(`Konfirmasi manual approve pembayaran ${payment.user_email}?`)) return;
    try {
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      const expiry = new Date(today);
      if (payment.plan === "premium_monthly") expiry.setMonth(expiry.getMonth() + 1);
      else expiry.setFullYear(expiry.getFullYear() + 1);
      const expiryStr = expiry.toISOString().split("T")[0];

      await base44.entities.SubscriptionPayment.update(payment.id, {
        status: "approved",
        approved_at: todayStr,
        expires_at: expiryStr,
      });
      toast.success("Pembayaran di-approve ✓");
      loadPayments();
    } catch {
      toast.error("Gagal update status");
    }
  }

  return (
    <div className="min-h-screen bg-[#F2F4F7] pb-10">
      {/* Header — same pattern */}
      <div className="bg-gradient-to-b from-[#0A0A0A] to-[#0d0d0d] px-5 pt-10 pb-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-[#8FA4C8] text-sm font-medium">Admin</p>
          <h1 className="text-white text-2xl font-bold mt-0.5 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-[#F97316]" />
            Subscription Payments
          </h1>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="bg-white/10 rounded-xl px-3 py-2.5 border border-white/5">
              <p className="text-[#8FA4C8] text-[10px]">Revenue</p>
              <p className="text-white text-sm font-bold mt-0.5">{formatRp(stats.totalRevenue)}</p>
            </div>
            <div className="bg-white/10 rounded-xl px-3 py-2.5 border border-white/5">
              <p className="text-[#8FA4C8] text-[10px]">Approved</p>
              <p className="text-white text-sm font-bold mt-0.5">{stats.approved}</p>
            </div>
            <div className="bg-white/10 rounded-xl px-3 py-2.5 border border-white/5">
              <p className="text-[#8FA4C8] text-[10px]">Pending</p>
              <p className="text-white text-sm font-bold mt-0.5">{stats.pending}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 mt-5 space-y-3">
        {/* Filter + search */}
        <div className="bg-white rounded-2xl shadow-sm p-3 space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8FA4C8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari email atau nama..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E2E8F0] text-sm bg-[#F8FAFC] focus:outline-none focus:border-[#F97316]"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto">
            {["all", "pending", "approved", "rejected", "expired"].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === s
                    ? "bg-[#F97316] text-white"
                    : "bg-[#F8FAFC] text-[#8FA4C8] hover:bg-[#F2F4F7]"
                }`}
              >
                {s === "all" ? "Semua" : STATUS_STYLES[s]?.label || s}
              </button>
            ))}
            <button
              onClick={loadPayments}
              disabled={refreshing}
              className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-[#F8FAFC] text-[#8FA4C8] hover:bg-[#F2F4F7] ml-auto"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#F2F4F7] border-t-[#F97316] rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
            <CreditCard className="w-12 h-12 text-[#E2E8F0] mx-auto mb-3" />
            <p className="text-[#1A1A1A] font-semibold">Belum ada pembayaran</p>
            <p className="text-[#8FA4C8] text-sm mt-1">Data pembayaran akan muncul di sini</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(p => {
              const style = STATUS_STYLES[p.status] || STATUS_STYLES.pending;
              const Icon = style.icon;
              return (
                <div key={p.id} className="bg-white rounded-2xl shadow-sm p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1A1A1A] truncate">{p.user_name || p.user_email}</p>
                      <p className="text-xs text-[#8FA4C8] truncate">{p.user_email}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${style.bg} ${style.text} ${style.border}`}>
                      <Icon className="w-3 h-3" />
                      {style.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-[#F2F4F7] pt-2 mt-2">
                    <div>
                      <p className="text-[10px] text-[#8FA4C8] uppercase tracking-widest">
                        {p.plan === "premium_yearly" ? "Tahunan" : "Bulanan"}
                      </p>
                      <p className="text-sm font-bold text-[#1A1A1A]">{formatRp(p.amount)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-[#8FA4C8]">{formatDate(p.created_date)}</p>
                      {p.expires_at && (
                        <p className="text-[10px] text-[#27AE60]">expires {formatDate(p.expires_at)}</p>
                      )}
                    </div>
                  </div>
                  {(p.status === "pending" || p.xendit_invoice_url) && (
                    <div className="flex gap-2 mt-3">
                      {p.xendit_invoice_url && (
                        <a
                          href={p.xendit_invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#4A5568] hover:bg-[#F8FAFC] transition-colors text-center flex items-center justify-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Invoice
                        </a>
                      )}
                      {p.status === "pending" && (
                        <button
                          onClick={() => markAsApproved(p)}
                          className="flex-1 py-2 rounded-lg bg-[#27AE60] text-white text-xs font-bold hover:bg-[#219553] transition-colors"
                        >
                          Approve Manual
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}