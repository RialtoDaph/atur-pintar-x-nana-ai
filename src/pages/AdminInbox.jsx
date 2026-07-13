import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import AdminPageShell from "@/components/admin/AdminPageShell";
import AdminStatBar from "@/components/admin/AdminStatBar";
import InboxActionCard from "@/components/admin/InboxActionCard";
import { MessageSquare, UserX, Clock, CheckCircle2, BarChart3 } from "lucide-react";

/**
 * AdminInbox — new default admin landing page.
 * Shows action items sorted by priority (what admin needs to act on today).
 */
export default function AdminInbox() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [counts, setCounts] = useState({
    pending: 0,
    feedback: 0,
    notOnboarded: 0,
    expiring: 0,
  });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [users, feedback] = await Promise.all([
        base44.entities.User.list().catch(() => []),
        base44.entities.FeedbackReport.filter({ status: "open" }).catch(() => []),
      ]);
      const pending = [];

      const notOnboarded = users.filter((u) => !u.onboarding_completed).length;
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      const expiring = users.filter((u) => {
        if (!u.subscription_end_date || u.subscription_status !== "active") return false;
        const end = new Date(u.subscription_end_date);
        return end <= sevenDaysFromNow && end > new Date();
      }).length;

      setCounts({
        pending: pending.length,
        feedback: feedback.length,
        notOnboarded,
        expiring,
      });
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    base44.auth.me().then((u) => setUser(u)).catch(() => {});
    load();
  }, []);

  // Build action items sorted by priority
  const actions = [];
  if (counts.feedback > 0) {
    actions.push({
      priority: "high",
      icon: MessageSquare,
      iconColor: "bg-[#F97316]",
      title: "Feedback Belum Direspons",
      count: counts.feedback,
      description: "Balas laporan & saran dari user",
      onClick: () => navigate("/AdminFeedback"),
    });
  }
  if (counts.expiring > 0) {
    actions.push({
      priority: "medium",
      icon: Clock,
      iconColor: "bg-[#F59E0B]",
      title: "Langganan Akan Berakhir",
      count: counts.expiring,
      description: "Akan expired dalam 7 hari ke depan",
      onClick: () => navigate("/AdminUsers"),
    });
  }
  if (counts.notOnboarded > 0) {
    actions.push({
      priority: "low",
      icon: UserX,
      iconColor: "bg-[#8FA4C8]",
      title: "User Belum Onboarding",
      count: counts.notOnboarded,
      description: "Kirim reminder untuk selesaikan setup",
      onClick: () => navigate("/AdminUsers"),
    });
  }

  return (
    <AdminPageShell
      currentPage="AdminInbox"
      title="Inbox Admin"
      subtitle="Yang perlu kamu kerjakan hari ini"
      onRefresh={load}
      refreshing={loading}
    >
        {/* Sticky Stat Bar */}
        <AdminStatBar />

        {/* Action Items */}
        <div className="mt-4 space-y-2.5">
          {loading && actions.length === 0 && (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#F97316] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && actions.length === 0 && (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7 text-green-600" />
              </div>
              <p className="font-semibold text-[#1A1A1A]">Semua aman! 🎉</p>
              <p className="text-sm text-[#8FA4C8] mt-1">Tidak ada task urgent saat ini</p>
            </div>
          )}

          {actions.map((a, idx) => (
            <InboxActionCard key={idx} {...a} />
          ))}
        </div>

        {/* Secondary Quick Links */}
        <div className="mt-6">
          <p className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-wider mb-2">Lainnya</p>
          <button
            onClick={() => navigate("/AdminDashboard")}
            className="w-full bg-white border border-[#E2E8F0] rounded-2xl p-4 flex items-center gap-3 hover:border-[#F97316]/40 transition-colors text-left"
          >
            <div className="w-11 h-11 rounded-xl bg-[#F2F4F7] flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-5 h-5 text-[#1A1A1A]" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[#1A1A1A] text-sm">Statistik Lengkap</p>
              <p className="text-xs text-[#8FA4C8] mt-0.5">MRR, growth chart, onboarding rate</p>
            </div>
          </button>
        </div>
    </AdminPageShell>
  );
}