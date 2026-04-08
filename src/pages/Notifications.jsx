import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, Clock, CheckCircle2, Trash2, AlertTriangle, Info, TrendingUp, Target, Wallet, Calendar, X } from "lucide-react";
import { format, isToday, addDays } from "date-fns";
import { id } from "date-fns/locale";
import AddReminderModal from "@/components/reminders/AddReminderModal";

const ALERT_ICONS = {
  spending_spike: { icon: TrendingUp, color: "text-red-500", bg: "bg-red-50" },
  bill_upcoming: { icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
  goal_near: { icon: Target, color: "text-green-500", bg: "bg-green-50" },
  savings_opportunity: { icon: Wallet, color: "text-blue-500", bg: "bg-blue-50" },
  unusual_pattern: { icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-50" },
  budget_exceeded: { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50" },
  default: { icon: Info, color: "text-[#8FA4C8]", bg: "bg-[#F2F4F7]" },
};

const REMINDER_ICONS = { tagihan: "💳", cicilan: "🏦", tabungan: "🐷", langganan: "📱", lainnya: "📌" };

function formatRupiah(n) {
  if (!n) return "";
  return "Rp " + Number(n).toLocaleString("id-ID");
}

export default function Notifications() {
  const [tab, setTab] = useState("reminders");
  const [reminders, setReminders] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      base44.entities.Reminder.filter({ created_by: user.email }),
      base44.entities.Alert.filter({ created_by: user.email }),
    ]).then(([r, a]) => {
      setReminders(r.sort((a, b) => (a.due_day || 0) - (b.due_day || 0)));
      setAlerts(a.sort((x, y) => new Date(y.created_date) - new Date(x.created_date)));
    }).finally(() => setLoading(false));
  }, [user]);

  async function dismissAlert(id) {
    await base44.entities.Alert.update(id, { status: "dismissed" });
    setAlerts(prev => prev.filter(a => a.id !== id));
  }

  async function markAlertRead(id) {
    await base44.entities.Alert.update(id, { status: "read" });
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: "read" } : a));
  }

  async function toggleReminder(rem) {
    const updated = await base44.entities.Reminder.update(rem.id, { is_active: !rem.is_active });
    setReminders(prev => prev.map(r => r.id === rem.id ? { ...r, is_active: !rem.is_active } : r));
  }

  async function deleteReminder(id) {
    await base44.entities.Reminder.delete(id);
    setReminders(prev => prev.filter(r => r.id !== id));
  }

  const today = new Date().getDate();
  const unreadAlerts = alerts.filter(a => a.status === "unread").length;
  const activeReminders = reminders.filter(r => r.is_active).length;
  const upcomingReminders = reminders.filter(r => {
    const due = r.due_day;
    return r.is_active && due >= today && due <= today + 7;
  }).length;

  return (
    <div className="min-h-screen bg-[#F2F4F7] pb-10">
      {/* Header */}
      <div className="bg-[#0A0A0A] px-5 pt-10 pb-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-[#8FA4C8] text-sm font-medium">Pusat Notifikasi</p>
          <h1 className="text-white text-2xl font-bold mt-0.5">Pengingat & Notifikasi</h1>
          <div className="flex gap-3 mt-4">
            <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
              <p className="text-white font-bold text-lg">{unreadAlerts}</p>
              <p className="text-[#8FA4C8] text-xs">Notif baru</p>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
              <p className="text-white font-bold text-lg">{activeReminders}</p>
              <p className="text-[#8FA4C8] text-xs">Pengingat aktif</p>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
              <p className="text-[#FF6A00] font-bold text-lg">{upcomingReminders}</p>
              <p className="text-[#8FA4C8] text-xs">Jatuh tempo 7hr</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 mt-5">
        {/* Tabs */}
        <div className="flex bg-white rounded-2xl p-1 shadow-sm mb-5">
          <button
            onClick={() => setTab("reminders")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              tab === "reminders" ? "bg-[#FF6A00] text-white shadow-sm" : "text-[#8FA4C8]"
            }`}
          >
            <Calendar className="w-4 h-4" /> Pengingat
          </button>
          <button
            onClick={() => setTab("alerts")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 relative ${
              tab === "alerts" ? "bg-[#FF6A00] text-white shadow-sm" : "text-[#8FA4C8]"
            }`}
          >
            <Bell className="w-4 h-4" /> Notifikasi
            {unreadAlerts > 0 && tab !== "alerts" && (
              <span className="absolute top-1.5 right-4 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadAlerts}
              </span>
            )}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#F2F4F7] border-t-[#FF6A00] rounded-full animate-spin" />
          </div>
        ) : tab === "reminders" ? (
          <div className="space-y-3">
            <button
              onClick={() => setShowAddReminder(true)}
              className="w-full bg-[#FF6A00] text-white py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2"
            >
              + Tambah Pengingat
            </button>
            {reminders.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
                <Calendar className="w-10 h-10 text-[#E2E8F0] mx-auto mb-3" />
                <p className="text-[#1A1A1A] font-semibold">Belum ada pengingat</p>
                <p className="text-[#8FA4C8] text-sm mt-1">Tambahkan pengingat tagihan, cicilan, atau tabungan</p>
              </div>
            ) : (
              reminders.map(rem => {
                const daysUntil = rem.due_day - today;
                const isUrgent = daysUntil >= 0 && daysUntil <= 3;
                const isPast = daysUntil < 0;
                return (
                  <div key={rem.id} className={`bg-white rounded-2xl shadow-sm p-4 border-l-4 ${
                    !rem.is_active ? "opacity-50 border-[#E2E8F0]" :
                    isUrgent ? "border-[#FF6A00]" :
                    isPast ? "border-red-400" : "border-[#E2E8F0]"
                  }`}>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{rem.icon || REMINDER_ICONS[rem.type] || "📌"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#1A1A1A] text-sm">{rem.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {rem.amount > 0 && (
                            <span className="text-xs text-[#8FA4C8]">{formatRupiah(rem.amount)}</span>
                          )}
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            isUrgent && rem.is_active ? "bg-[#FF6A00]/10 text-[#FF6A00]" :
                            isPast ? "bg-red-50 text-red-500" :
                            "bg-[#F2F4F7] text-[#8FA4C8]"
                          }`}>
                            Tgl {rem.due_day} tiap bulan
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleReminder(rem)}
                          className={`w-8 h-5 rounded-full transition-colors relative ${rem.is_active ? "bg-[#FF6A00]" : "bg-[#E2E8F0]"}`}
                        >
                          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${rem.is_active ? "left-3.5" : "left-0.5"}`} />
                        </button>
                        <button onClick={() => deleteReminder(rem.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-[#8FA4C8] hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.filter(a => a.status !== "dismissed").length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
                <Bell className="w-10 h-10 text-[#E2E8F0] mx-auto mb-3" />
                <p className="text-[#1A1A1A] font-semibold">Semua bersih!</p>
                <p className="text-[#8FA4C8] text-sm mt-1">Tidak ada notifikasi aktif saat ini</p>
              </div>
            ) : (
              alerts.filter(a => a.status !== "dismissed").map(alert => {
                const cfg = ALERT_ICONS[alert.type] || ALERT_ICONS.default;
                const Icon = cfg.icon;
                return (
                  <div
                    key={alert.id}
                    onClick={() => alert.status === "unread" && markAlertRead(alert.id)}
                    className={`bg-white rounded-2xl shadow-sm p-4 cursor-pointer border ${
                      alert.status === "unread" ? "border-[#FF6A00]/30" : "border-transparent"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-semibold ${alert.status === "unread" ? "text-[#1A1A1A]" : "text-[#8FA4C8]"}`}>
                            {alert.title}
                          </p>
                          <button
                            onClick={(e) => { e.stopPropagation(); dismissAlert(alert.id); }}
                            className="p-1 rounded-lg hover:bg-[#F2F4F7] text-[#8FA4C8] flex-shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-xs text-[#8FA4C8] mt-0.5 leading-relaxed">{alert.message}</p>
                        {alert.created_date && (
                          <p className="text-[10px] text-[#8FA4C8] mt-1.5">
                            {format(new Date(alert.created_date), "dd MMM yyyy · HH:mm", { locale: id })}
                          </p>
                        )}
                      </div>
                      {alert.status === "unread" && (
                        <span className="w-2 h-2 rounded-full bg-[#FF6A00] flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
            {alerts.filter(a => a.status !== "dismissed").length > 0 && (
              <button
                onClick={async () => {
                  await Promise.all(alerts.filter(a => a.status !== "dismissed").map(a => base44.entities.Alert.update(a.id, { status: "dismissed" })));
                  setAlerts([]);
                }}
                className="w-full py-3 rounded-2xl border border-[#E2E8F0] text-[#8FA4C8] text-sm font-medium hover:bg-white transition-colors"
              >
                Hapus Semua Notifikasi
              </button>
            )}
          </div>
        )}
      </div>

      {showAddReminder && (
        <AddReminderModal
          onClose={() => setShowAddReminder(false)}
          onSave={(r) => { setReminders(prev => [...prev, r]); setShowAddReminder(false); }}
        />
      )}
    </div>
  );
}