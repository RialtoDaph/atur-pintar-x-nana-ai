import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAppSettings } from "@/components/utils/useAppSettings";
import { Bell, ChevronRight, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

function getDaysUntilDue(dueDay) {
  const today = new Date();
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), dueDay);
  if (thisMonth < today) {
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
    return Math.ceil((nextMonth - today) / (1000 * 60 * 60 * 24));
  }
  return Math.ceil((thisMonth - today) / (1000 * 60 * 60 * 24));
}

const TYPE_EMOJI = {
  tagihan: "🧾", cicilan: "🏦", tabungan: "🐷", langganan: "📱", lainnya: "📌",
};

export default function ReminderWidget() {
  const { formatCurrency, t } = useAppSettings();
  const [reminders, setReminders] = useState([]);

  useEffect(() => {
    base44.auth.me().then(u => {
      base44.entities.Reminder.filter({ is_active: true, created_by: u.email }).then(setReminders).catch(() => {});
    }).catch(() => {});
  }, []);

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const upcoming = reminders
    .filter(r => r.last_dismissed_month !== currentMonth)
    .map(r => ({ ...r, daysLeft: getDaysUntilDue(r.due_day) }))
    .filter(r => r.daysLeft <= 7)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  if (upcoming.length === 0) return null;

  async function dismiss(r) {
    await base44.entities.Reminder.update(r.id, { last_dismissed_month: currentMonth });
    setReminders(prev => prev.map(x => x.id === r.id ? { ...x, last_dismissed_month: currentMonth } : x));
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#FF6A00]" />
          <h2 className="font-bold text-[#0A0A0A] text-sm">{t('upcoming_reminders')}</h2>
        </div>
        <Link to={createPageUrl("Reminders")} className="text-xs text-[#FF6A00] font-semibold flex items-center gap-0.5">
        {t('view_all')} <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="px-4 pb-4 space-y-2">
        {upcoming.map(r => {
          const urgent = r.daysLeft <= 3;
          return (
            <div key={r.id} className={`flex items-center gap-3 p-3 rounded-xl ${urgent ? "bg-[#FF6B6B]/8 border border-[#FF6B6B]/20" : "bg-[#F8FAFC]"}`}>
              <span className="text-xl">{r.icon || TYPE_EMOJI[r.type] || "📌"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#0A0A0A] truncate">{r.title}</p>
                <p className="text-xs text-[#8FA4C8]">
                  {r.amount ? formatCurrency(r.amount) + " · " : ""}
                  {r.daysLeft === 0 ? t('today') : r.daysLeft === 1 ? t('tomorrow') : `${r.daysLeft} ${t('days_left')}`}
                </p>
              </div>
              <button onClick={() => dismiss(r)} className="w-7 h-7 rounded-full bg-[#00C9A7]/15 flex items-center justify-center hover:bg-[#00C9A7]/30 transition-colors flex-shrink-0">
                <Check className="w-3.5 h-3.5 text-[#00C9A7]" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}