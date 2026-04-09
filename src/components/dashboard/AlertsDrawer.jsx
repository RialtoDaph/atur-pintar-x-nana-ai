import { useState, useEffect } from "react";
import { X, TrendingUp, AlertTriangle, CheckCircle, Zap, Info, Bell, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import DashboardInsights from "@/components/dashboard/DashboardInsights";
import SmartAlertsPanel from "@/components/dashboard/SmartAlertsPanel";
import AnomalyDetector from "@/components/analytics/AnomalyDetector";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const ALERT_CONFIG = {
  spending_spike:      { icon: TrendingUp,    color: "text-red-500",    bg: "bg-red-50",    label: "Spending Spike" },
  bill_upcoming:       { icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-50", label: "Tagihan" },
  goal_near:           { icon: CheckCircle,   color: "text-green-500", bg: "bg-green-50",  label: "Tujuan" },
  savings_opportunity: { icon: Zap,           color: "text-blue-500",  bg: "bg-blue-50",  label: "Peluang" },
  unusual_pattern:     { icon: Info,          color: "text-yellow-600",bg: "bg-yellow-50",label: "Pola Aneh" },
  budget_exceeded:     { icon: AlertTriangle, color: "text-red-600",   bg: "bg-red-50",   label: "Budget" },
};

const TYPE_EMOJI = { tagihan: "🧾", cicilan: "🏦", tabungan: "🐷", langganan: "📱", lainnya: "📌" };

function getDaysUntilDue(dueDay) {
  const today = new Date();
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), dueDay);
  if (thisMonth < today) {
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
    return Math.ceil((nextMonth - today) / (1000 * 60 * 60 * 24));
  }
  return Math.ceil((thisMonth - today) / (1000 * 60 * 60 * 24));
}

export default function AlertsDrawer({ onClose, user }) {
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [alertRecords, setAlertRecords] = useState([]);
  const [adminNotifs, setAdminNotifs] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  useEffect(() => {
    if (!user?.email) return;
    Promise.all([
      base44.entities.Transaction.filter({ created_by: user.email }, "-date", 100),
      base44.entities.SavingsGoal.filter({ created_by: user.email }, "-created_date"),
      base44.entities.Alert.filter({ created_by: user.email }, "-created_date", 50),
      base44.entities.AdminNotification.list(),
      base44.entities.Reminder.filter({ is_active: true, created_by: user.email }),
    ]).then(([tx, gl, alerts, notifs, rems]) => {
      setTransactions(tx);
      setGoals(gl);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const seenTitles = new Set();
      // Show: unread OR created within 7 days, deduped by title, max 10
      const dedupedAlerts = (alerts || []).filter(a => {
        const isUnread = a.status === 'unread';
        const isRecent = a.created_date && a.created_date > sevenDaysAgo;
        if (!isUnread && !isRecent) return false;
        if (seenTitles.has(a.title)) return false;
        seenTitles.add(a.title);
        return true;
      }).slice(0, 10);
      setAlertRecords(dedupedAlerts);
      const myNotifs = (notifs || []).filter(n =>
        (n.target_type === 'all' || n.target_email === user.email) && !n.read_by?.includes(user.email)
      );
      setAdminNotifs(myNotifs);
      const upcoming = (rems || []).filter(r => {
        if (r.last_dismissed_month === currentMonth) return false;
        return getDaysUntilDue(r.due_day) <= 7;
      }).map(r => ({ ...r, daysLeft: getDaysUntilDue(r.due_day) })).sort((a, b) => a.daysLeft - b.daysLeft);
      setReminders(upcoming);
      setLoading(false);
      // Mark unread alerts as read
      alerts.filter(a => a.status === 'unread').forEach(a => base44.entities.Alert.update(a.id, { status: "read" }));
      myNotifs.forEach(n => {
        base44.entities.AdminNotification.update(n.id, { read_by: [...(n.read_by || []), user.email] }).catch(() => {});
      });
    });
  }, [user?.email]);

  async function dismissReminder(r) {
    await base44.entities.Reminder.update(r.id, { last_dismissed_month: currentMonth });
    setReminders(prev => prev.filter(x => x.id !== r.id));
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Drawer */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative w-full max-w-sm h-full bg-[#F2F4F7] overflow-y-auto flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-[#0A0A0A] sticky top-0 z-10">
            <div>
              <p className="text-white font-bold text-sm">Insights & Alerts</p>
              <p className="text-[#8FA4C8] text-xs mt-0.5">Ringkasan keuangan kamu</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors tap-highlight-fix"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-2xl h-20 animate-pulse shadow-sm" />
                ))}
              </div>
            ) : (
              <>
                {/* Admin Notifications */}
                {adminNotifs.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest px-1">Dari Admin ({adminNotifs.length})</p>
                    {adminNotifs.map(n => (
                      <div key={n.id} className="bg-white rounded-2xl p-3 shadow-sm ring-2 ring-[#FF6A00]/20">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                            <Bell className="w-4 h-4 text-[#FF6A00]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[#1A1A1A] text-sm">{n.title}</p>
                            <p className="text-[#4A5568] text-xs mt-0.5 leading-relaxed">{n.message}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upcoming Reminders */}
                {reminders.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest px-1">Pengingat ({reminders.length})</p>
                    {reminders.map(r => {
                      const urgent = r.daysLeft <= 3;
                      return (
                        <div key={r.id} className={`bg-white rounded-2xl p-3 shadow-sm flex items-center gap-3 ${urgent ? "ring-2 ring-orange-200" : ""}`}>
                          <span className="text-xl">{r.icon || TYPE_EMOJI[r.type] || "📌"}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#0A0A0A] truncate">{r.title}</p>
                            <p className="text-xs text-[#8FA4C8]">
                              {r.daysLeft === 0 ? "Hari ini" : r.daysLeft === 1 ? "Besok" : `${r.daysLeft} hari lagi`}
                            </p>
                          </div>
                          <button onClick={() => dismissReminder(r)} className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center hover:bg-green-100 transition-colors flex-shrink-0">
                            <Check className="w-3.5 h-3.5 text-green-500" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Alert entity records — unread notifications */}
                {alertRecords.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest px-1">Notifikasi Baru ({alertRecords.length})</p>
                    {alertRecords.map(alert => {
                      const cfg = ALERT_CONFIG[alert.type] || ALERT_CONFIG.unusual_pattern;
                      const Icon = cfg.icon;
                      return (
                        <div key={alert.id} className="bg-white rounded-2xl p-3 shadow-sm ring-2 ring-[#FF6A00]/20">
                          <div className="flex items-start gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                              <Icon className={`w-4 h-4 ${cfg.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-[#1A1A1A] text-sm">{alert.title}</p>
                              <p className="text-[#4A5568] text-xs mt-0.5 leading-relaxed">{alert.message}</p>
                              {alert.severity && (
                                <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mt-1.5 ${
                                  alert.severity === "high" ? "bg-red-100 text-red-700" :
                                  alert.severity === "medium" ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"
                                }`}>
                                  {alert.severity === "high" ? "Penting" : alert.severity === "medium" ? "Sedang" : "Info"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <Link
                      to={createPageUrl("Alerts")}
                      onClick={onClose}
                      className="block text-center text-xs font-semibold text-[#FF6A00] py-2 hover:underline"
                    >
                      Lihat semua riwayat alert →
                    </Link>
                  </div>
                )}
                {alertRecords.length === 0 && (
                  <div className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                    <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#1A1A1A] text-sm">Semua beres!</p>
                      <p className="text-[#8FA4C8] text-xs">Tidak ada notifikasi baru</p>
                    </div>
                    <Link to={createPageUrl("Alerts")} onClick={onClose} className="ml-auto text-xs text-[#FF6A00] font-semibold hover:underline flex-shrink-0">Riwayat</Link>
                  </div>
                )}
                <SmartAlertsPanel user={user} />
                <AnomalyDetector transactions={transactions} />
                <DashboardInsights transactions={transactions} goals={goals} />
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}