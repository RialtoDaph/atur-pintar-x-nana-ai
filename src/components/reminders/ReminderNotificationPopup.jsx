import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { X, Check, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAppSettings } from "@/components/utils/useAppSettings";
import { AnimatePresence, motion } from "framer-motion";

const STORAGE_KEY = "reminder_notif_dismissed";
const PUSH_ASKED_KEY = "push_notif_asked";

function getDaysUntilDue(dueDay) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const clampedDay = Math.min(dueDay, maxDay);
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), clampedDay);
  // Use < (not <=) so the actual due day shows as "Today" (0 days), not skipped to next month
  if (thisMonth < today) {
    const nextMaxDay = new Date(today.getFullYear(), today.getMonth() + 2, 0).getDate();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, Math.min(dueDay, nextMaxDay));
    return Math.ceil((nextMonth - today) / (1000 * 60 * 60 * 24));
  }
  return Math.ceil((thisMonth - today) / (1000 * 60 * 60 * 24));
}

const TYPE_EMOJI = {
  tagihan: "🧾", cicilan: "🏦", tabungan: "🐷", langganan: "📱", lainnya: "📌",
};

async function requestPushPermission() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

function sendBrowserNotification(reminder, daysLeft, formatCurrency) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const emoji = reminder.icon || TYPE_EMOJI[reminder.type] || "📌";
  const dayText = daysLeft === 0 ? "hari ini!" : daysLeft === 1 ? "besok!" : `${daysLeft} hari lagi`;
  const body = reminder.amount
    ? `${formatCurrency(reminder.amount)} jatuh tempo ${dayText}`
    : `Jatuh tempo ${dayText}`;
  new Notification(`${emoji} ${reminder.title}`, {
    body,
    icon: "/favicon.ico",
    tag: `reminder-${reminder.id}`,
  });
}

export default function ReminderNotificationPopup({ user }) {
  const { formatCurrency } = useAppSettings();
  const [upcoming, setUpcoming] = useState([]);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState([]);
  const [nanaMessage, setNanaMessage] = useState("");

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const loadAndNotify = useCallback(async () => {
    if (!user?.email) return;

    // Load dismissed from localStorage (for popup only)
    const storedDismissed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    setDismissed(storedDismissed);

    try {
      const reminders = await base44.entities.Reminder.filter({ is_active: true, created_by: user.email });
      const upcomingList = reminders
        .filter(r => r.last_dismissed_month !== currentMonth && !storedDismissed.includes(r.id + "_" + currentMonth))
        .map(r => ({ ...r, daysLeft: getDaysUntilDue(r.due_day) }))
        .filter(r => r.daysLeft <= 7)
        .sort((a, b) => a.daysLeft - b.daysLeft);

      setUpcoming(upcomingList);

      if (upcomingList.length > 0) {
        setVisible(true);

        // Generate Nana AI message
        try {
          const urgentItems = upcomingList.filter(r => r.daysLeft <= 3);
          const topItem = upcomingList[0];
          const prompt = `Kamu adalah Nana, asisten keuangan pribadi yang ramah, suportif, dan penuh semangat. 
Buat pesan pengingat singkat (maksimal 2 kalimat) untuk pengguna tentang tagihan/pembayaran yang akan jatuh tempo.
Gunakan bahasa Indonesia yang santai dan personal. Tambahkan 1 emoji yang relevan di awal.
Jangan mulai dengan "Hei" atau "Hai".

Data pengingat:
${upcomingList.slice(0, 3).map(r => `- ${r.title}: ${r.daysLeft === 0 ? "HARI INI!" : r.daysLeft === 1 ? "besok" : r.daysLeft + " hari lagi"}${r.amount ? " ("+formatCurrency(r.amount)+")" : ""}`).join("\n")}

Total: ${upcomingList.length} pengingat aktif${urgentItems.length > 0 ? ", " + urgentItems.length + " mendesak" : ""}.`;

          const message = await base44.integrations.Core.InvokeLLM({ prompt });
          setNanaMessage(message);
        } catch (e) {
          console.error("[ReminderPopup] Nana LLM call failed:", e?.message || e);
          setNanaMessage("Ada beberapa tagihan yang perlu kamu perhatikan nih! 🔔");
        }

        // Push browser notifications for urgent ones (≤ 3 days) — guard for unsupported browsers (iOS in-app, etc.)
        if ("Notification" in window) {
          if (Notification.permission === "granted") {
            // Already granted — send notifications
            upcomingList.filter(r => r.daysLeft <= 3).forEach(r => {
              sendBrowserNotification(r, r.daysLeft, formatCurrency);
            });
          } else if (Notification.permission === "default") {
            // Not asked yet — request once per session, not per visit (avoid spam)
            const alreadyAsked = sessionStorage.getItem(PUSH_ASKED_KEY);
            if (!alreadyAsked) {
              sessionStorage.setItem(PUSH_ASKED_KEY, "true");
              const granted = await requestPushPermission();
              if (granted) {
                upcomingList.filter(r => r.daysLeft <= 3).forEach(r => {
                  sendBrowserNotification(r, r.daysLeft, formatCurrency);
                });
              }
            }
          }
          // If permission === "denied" → silently skip, popup in-app still works
        }
      }
    } catch (e) {}
  }, [user?.email, currentMonth, formatCurrency]);

  useEffect(() => {
    loadAndNotify();
  }, [loadAndNotify]);

  async function dismissItem(id) {
    const key = id + "_" + currentMonth;
    const updated = [...dismissed, key];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setDismissed(updated);
    const newUpcoming = upcoming.filter(r => r.id !== id);
    setUpcoming(newUpcoming);
    if (newUpcoming.length === 0) setVisible(false);
    // Sync dismissal to DB for multi-device consistency
    try {
      await base44.entities.Reminder.update(id, { last_dismissed_month: currentMonth });
    } catch (e) {
      console.error("[ReminderPopup] Failed to sync dismissal to DB:", e?.message || e);
    }
  }

  async function dismissAll() {
    const ids = upcoming.map(r => r.id);
    const updated = [...dismissed, ...ids.map(id => id + "_" + currentMonth)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setDismissed(updated);
    setUpcoming([]);
    setVisible(false);
    // Sync all dismissals to DB for multi-device consistency
    try {
      await Promise.all(ids.map(id =>
        base44.entities.Reminder.update(id, { last_dismissed_month: currentMonth })
      ));
    } catch (e) {
      console.error("[ReminderPopup] Failed to sync dismissAll to DB:", e?.message || e);
    }
  }

  return (
    <AnimatePresence>
      {visible && upcoming.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed top-16 sm:top-4 right-4 z-50 w-80 max-w-[calc(100vw-2rem)]"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-[#F2F4F7] overflow-hidden">
            {/* Nana Header */}
            <div className="flex items-start justify-between px-4 pt-4 pb-3 border-b border-[#F2F4F7]">
              <div className="flex items-start gap-3">
                {/* Nana Avatar */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#F97316] to-[#FF9A3C] flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm">
                  N
                </div>
                <div>
                  <p className="text-xs font-bold text-[#F97316]">Nana AI</p>
                  {nanaMessage ? (
                    <p className="text-xs text-[#1A1A1A] leading-relaxed mt-0.5 max-w-[200px]">{nanaMessage}</p>
                  ) : (
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#F97316] animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-[#F97316] animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-[#F97316] animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  )}
                </div>
              </div>
              <button onClick={dismissAll} className="text-[#8FA4C8] hover:text-[#1A1A1A] transition-colors mt-0.5">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Items */}
            <div className="divide-y divide-[#F2F4F7] max-h-52 overflow-y-auto">
              {upcoming.map(r => {
                const urgent = r.daysLeft <= 3;
                return (
                  <div key={r.id} className={`flex items-center gap-3 px-4 py-2.5 ${urgent ? "bg-[#FF6B6B]/5" : ""}`}>
                    <span className="text-lg flex-shrink-0">{r.icon || TYPE_EMOJI[r.type] || "📌"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0A0A0A] truncate">{r.title}</p>
                      <p className="text-xs text-[#8FA4C8]">
                        {r.amount ? formatCurrency(r.amount) + " · " : ""}
                        <span className={urgent ? "text-[#FF6B6B] font-semibold" : ""}>
                          {r.daysLeft === 0 ? "Hari ini!" : r.daysLeft === 1 ? "Besok" : `${r.daysLeft} hari lagi`}
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() => dismissItem(r.id)}
                      className="w-7 h-7 rounded-full bg-[#00C9A7]/15 flex items-center justify-center hover:bg-[#00C9A7]/30 transition-colors flex-shrink-0"
                    >
                      <Check className="w-3.5 h-3.5 text-[#00C9A7]" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-[#F2F4F7]">
              <Link
                to={createPageUrl("Reminders")}
                onClick={dismissAll}
                className="text-xs text-[#F97316] font-semibold flex items-center gap-0.5 hover:underline"
              >
                Lihat semua pengingat <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}