import { useState, useEffect } from "react";
import { Bell, ChevronRight } from "lucide-react";
import { useAppSettings } from "@/components/utils/useAppSettings";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

function getDaysUntilDue(dueDay) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const clampedDay = Math.min(dueDay, maxDay);
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), clampedDay);
  if (thisMonth <= today) {
    const nextMaxDay = new Date(today.getFullYear(), today.getMonth() + 2, 0).getDate();
    const nextDay = Math.min(dueDay, nextMaxDay);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, nextDay);
    return Math.ceil((nextMonth - today) / (1000 * 60 * 60 * 24));
  }
  return Math.ceil((thisMonth - today) / (1000 * 60 * 60 * 24));
}

export default function ReminderAlertWidget({ user }) {
  const { formatCurrency } = useAppSettings();
  const [reminders, setReminders] = useState([]);

  useEffect(() => {
    if (!user?.email) return;
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    base44.entities.Reminder.filter({ created_by: user.email, is_active: true })
      .then(data => {
        const upcoming = (data || []).filter(r => {
          if (r.last_dismissed_month === currentMonth) return false;
          return getDaysUntilDue(r.due_day) <= 5;
        });
        upcoming.sort((a, b) => getDaysUntilDue(a.due_day) - getDaysUntilDue(b.due_day));
        setReminders(upcoming);
      })
      .catch(() => {});
  }, [user?.email]);

  if (reminders.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#FF6A00]/10 flex items-center justify-center">
            <Bell className="w-3.5 h-3.5 text-[#FF6A00]" />
          </div>
          <p className="text-sm font-bold text-[#0A0A0A]">Tagihan Jatuh Tempo</p>
        </div>
        <Link to={createPageUrl("Reminders")} className="flex items-center gap-0.5 text-[11px] font-semibold text-[#F97316]">
          Semua <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="px-4 pb-4 space-y-2">
        {reminders.map(r => {
          const days = getDaysUntilDue(r.due_day);
          const isUrgent = days <= 2;
          return (
            <div key={r.id} className={`flex items-center gap-3 p-3 rounded-xl ${isUrgent ? "bg-[#FF6B6B]/8 border border-[#FF6B6B]/20" : "bg-[#F8FAFC]"}`}>
              <span className="text-xl">{r.icon || "🧾"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#0A0A0A] truncate">{r.title}</p>
                {r.amount > 0 && (
                  <p className="text-[11px] text-[#8FA4C8]">{formatCurrency(r.amount)}</p>
                )}
              </div>
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${isUrgent ? "bg-[#FF6B6B]/15 text-[#FF6B6B]" : "bg-[#F97316]/10 text-[#F97316]"}`}>
                {days === 0 ? "Hari ini" : days === 1 ? "Besok" : `${days} hari lagi`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}