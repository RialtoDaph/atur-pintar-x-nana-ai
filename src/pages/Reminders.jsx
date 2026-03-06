import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { formatRupiah } from "@/components/utils/formatRupiah";
import { Plus, Bell, Trash2, ToggleLeft, ToggleRight, Edit2, Check } from "lucide-react";
import AddReminderModal from "@/components/reminders/AddReminderModal";
import { useAppSettings } from "@/components/utils/useAppSettings";

const TYPE_CONFIG = {
  tagihan:   { label: "Tagihan",   emoji: "🧾", color: "#FF6B6B" },
  cicilan:   { label: "Cicilan",   emoji: "🏦", color: "#4F7CFF" },
  tabungan:  { label: "Tabungan",  emoji: "🐷", color: "#00C9A7" },
  langganan: { label: "Langganan", emoji: "📱", color: "#9B59B6" },
  lainnya:   { label: "Lainnya",   emoji: "📌", color: "#F5A623" },
};

function getDaysUntilDue(dueDay) {
  const today = new Date();
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), dueDay);
  if (thisMonth < today) {
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
    return Math.ceil((nextMonth - today) / (1000 * 60 * 60 * 24));
  }
  return Math.ceil((thisMonth - today) / (1000 * 60 * 60 * 24));
}

export default function Reminders() {
  const { t, formatCurrency } = useAppSettings();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
    }).catch(() => {});
  }, []);

  useEffect(() => { if (user) load(); }, [user]);

  async function load() {
    setLoading(true);
    const data = await base44.entities.Reminder.filter({ created_by: user.email }, "-created_date");
    setReminders(data);
    setLoading(false);
  }

  async function toggleActive(r) {
    await base44.entities.Reminder.update(r.id, { is_active: !r.is_active });
    load();
  }

  async function deleteReminder(id) {
    await base44.entities.Reminder.delete(id);
    load();
  }

  async function dismissThisMonth(r) {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    await base44.entities.Reminder.update(r.id, { last_dismissed_month: month });
    load();
  }

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const activeReminders = reminders.filter(r => r.is_active && r.last_dismissed_month !== currentMonth);
  const dismissedThisMonth = reminders.filter(r => r.last_dismissed_month === currentMonth);
  const inactive = reminders.filter(r => !r.is_active);

  const upcomingReminders = [...activeReminders].sort((a, b) => getDaysUntilDue(a.due_day) - getDaysUntilDue(b.due_day));

  const totalDue = activeReminders.reduce((s, r) => s + (r.amount || 0), 0);

  return (
    <div className="min-h-screen bg-[#F2F4F7] pb-8">
      {/* Header */}
      <div className="bg-[#0A0A0A] px-5 pt-8 pb-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[#8FA4C8] text-xs font-medium">{t('reminders_manage')}</p>
            <h1 className="text-white text-xl font-bold mt-0.5">{t('reminders_title')}</h1>
          </div>
          <button
            onClick={() => { setEditing(null); setShowAdd(true); }}
            className="w-9 h-9 rounded-full bg-[#FF6A00] flex items-center justify-center shadow-lg hover:bg-[#e05e00] transition-colors"
          >
            <Plus className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-4 space-y-4">

        {/* Summary */}
        {activeReminders.length > 0 && (
          <div className="bg-[#FF6A00] rounded-2xl p-4 text-white">
            <p className="text-xs opacity-80 font-medium">{t('reminders_total_active')}</p>
            <p className="text-2xl font-bold mt-0.5">{formatCurrency(totalDue)}</p>
            <p className="text-xs opacity-70 mt-1">{activeReminders.length} {t('reminders_active_count')}</p>
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl h-20 animate-pulse" />)}
          </div>
        )}

        {!loading && reminders.length === 0 && (
          <div className="bg-white rounded-2xl p-10 text-center">
            <Bell className="w-10 h-10 text-[#E2E8F0] mx-auto mb-3" />
            <p className="text-[#8FA4C8] text-sm">{t('reminders_empty')}</p>
            <button onClick={() => setShowAdd(true)} className="mt-3 text-sm font-semibold text-[#FF6A00]">
              {t('reminders_add_first')}
            </button>
          </div>
        )}

        {/* Active & upcoming */}
        {upcomingReminders.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-2 px-1">{t('reminders_upcoming')}</p>
            <div className="space-y-2">
              {upcomingReminders.map(r => {
                const daysLeft = getDaysUntilDue(r.due_day);
                const cfg = TYPE_CONFIG[r.type] || TYPE_CONFIG.lainnya;
                const urgent = daysLeft <= 3;
                return (
                  <div key={r.id} className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${urgent ? "border-[#FF6B6B]" : "border-transparent"}`}>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: cfg.color + "20" }}>
                        {r.icon || cfg.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-[#0A0A0A] text-sm truncate">{r.title}</p>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${urgent ? "bg-[#FF6B6B]/10 text-[#FF6B6B]" : "bg-[#F2F4F7] text-[#8FA4C8]"}`}>
                            {daysLeft === 0 ? t('today') : daysLeft === 1 ? t('tomorrow') : `${daysLeft} ${t('days_left')}`}
                          </span>
                        </div>
                        <p className="text-xs text-[#8FA4C8] mt-0.5">
                          {cfg.label} · {t('reminders_due_day')} {r.due_day} {t('reminders_every_month')}
                          {r.amount ? ` · ${formatRupiah(r.amount)}` : ""}
                        </p>
                        {r.notes && <p className="text-xs text-[#8FA4C8] mt-0.5 truncate">{r.notes}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <button onClick={() => dismissThisMonth(r)} className="flex items-center gap-1 text-xs text-[#00C9A7] font-semibold bg-[#00C9A7]/10 px-3 py-1.5 rounded-lg hover:bg-[#00C9A7]/20 transition-colors">
                        <Check className="w-3 h-3" /> {t('reminders_mark_paid')}
                      </button>
                      <button onClick={() => { setEditing(r); setShowAdd(true); }} className="flex items-center gap-1 text-xs text-[#8FA4C8] font-medium px-3 py-1.5 rounded-lg hover:bg-[#F2F4F7] transition-colors">
                        <Edit2 className="w-3 h-3" /> {t('reminders_edit')}
                      </button>
                      <button onClick={() => deleteReminder(r.id)} className="flex items-center gap-1 text-xs text-[#FF6B6B] font-medium px-3 py-1.5 rounded-lg hover:bg-[#FF6B6B]/10 transition-colors ml-auto">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Dismissed this month */}
        {dismissedThisMonth.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-2 px-1">{t('reminders_paid_this_month')}</p>
            <div className="space-y-2">
              {dismissedThisMonth.map(r => {
                const cfg = TYPE_CONFIG[r.type] || TYPE_CONFIG.lainnya;
                return (
                  <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm opacity-60">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: cfg.color + "15" }}>
                        {r.icon || cfg.emoji}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-[#0A0A0A] text-sm line-through">{r.title}</p>
                        <p className="text-xs text-[#8FA4C8]">{r.amount ? formatRupiah(r.amount) : cfg.label}</p>
                      </div>
                      <Check className="w-4 h-4 text-[#00C9A7]" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Inactive */}
        {inactive.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-2 px-1">{t('reminders_inactive')}</p>
            <div className="space-y-2">
              {inactive.map(r => {
                const cfg = TYPE_CONFIG[r.type] || TYPE_CONFIG.lainnya;
                return (
                  <div key={r.id} className="bg-white rounded-2xl p-3 shadow-sm flex items-center gap-3 opacity-50">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: cfg.color + "15" }}>
                      {r.icon || cfg.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#0A0A0A] text-sm truncate">{r.title}</p>
                      <p className="text-xs text-[#8FA4C8]">{t('reminders_due_day')} {r.due_day} · {r.amount ? formatCurrency(r.amount) : cfg.label}</p>
                    </div>
                    <button onClick={() => toggleActive(r)} className="text-[#8FA4C8] hover:text-[#FF6A00] transition-colors">
                      <ToggleLeft className="w-6 h-6" />
                    </button>
                    <button onClick={() => deleteReminder(r.id)} className="text-[#FF6B6B]">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showAdd && (
        <AddReminderModal
          reminder={editing}
          onClose={() => { setShowAdd(false); setEditing(null); }}
          onSave={async (data) => {
            if (editing) {
              await base44.entities.Reminder.update(editing.id, data);
            } else {
              await base44.entities.Reminder.create(data);
            }
            setShowAdd(false);
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}