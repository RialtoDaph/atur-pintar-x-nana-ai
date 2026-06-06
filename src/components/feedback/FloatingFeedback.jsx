import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import FeedbackReportPanel from "@/components/feedback/FeedbackReportPanel";
import { base44 } from "@/api/base44Client";

/**
 * Floating Beta Feedback — FAB pattern (same as BossBattleFloating).
 * Trigger hidden when open. Popup anchors from bottom-right.
 * Mobile: bottom = 174px (boss 110px + 64px offset)
 * Desktop: bottom = 88px (boss 24px + 64px offset)
 */
export default function FloatingFeedback({ user }) {
  const [open, setOpen] = useState(false);
  const [hasUnreadResponse, setHasUnreadResponse] = useState(false);

  // Check if user has feedback reports with admin response yet unread
  useEffect(() => {
    if (!user?.email) return;
    const lastSeenKey = `feedback_response_seen_${user.email}`;
    const lastSeen = localStorage.getItem(lastSeenKey) || "1970-01-01T00:00:00Z";

    base44.entities.FeedbackReport.filter({ created_by: user.email })
      .then((reports) => {
        const unread = (reports || []).some(
          (r) => r.admin_response && r.admin_response.trim() && new Date(r.updated_date) > new Date(lastSeen)
        );
        setHasUnreadResponse(unread);
      })
      .catch(() => {});
  }, [user?.email, open]);

  const handleOpen = () => {
    setOpen(true);
    if (user?.email) {
      localStorage.setItem(`feedback_response_seen_${user.email}`, new Date().toISOString());
      setHasUnreadResponse(false);
    }
  };

  if (!user?.onboarding_completed) return null;
  if (typeof window !== "undefined" && window.location.pathname !== "/Dashboard") return null;

  return (
    <>
      {!open && (
        <button
          onClick={handleOpen}
          aria-label={hasUnreadResponse ? "Balasan baru dari admin tersedia" : "Beta feedback & lapor masalah"}
          className="fixed z-[70] right-4 sm:right-6 flex items-center justify-center active:scale-90 transition-transform sm:bottom-[88px]"
          style={{
            bottom: "calc(174px + env(safe-area-inset-bottom, 0px))",
          }}
        >
          <span className="relative">
            <span className="text-5xl drop-shadow-lg" aria-hidden="true">💬</span>
            <span className="absolute -top-1 -right-1 text-[8px] font-bold text-white bg-[#F97316] rounded px-1 py-0.5 leading-none uppercase tracking-wider shadow-md">
              Report
            </span>
            {hasUnreadResponse && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#EF4444] border-2 border-white shadow-md animate-pulse" aria-hidden="true" />
            )}
          </span>
        </button>
      )}

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="fixed z-[101] left-3 right-3 sm:left-auto sm:right-6 sm:w-[380px]"
              style={{
                top: "calc(56px + env(safe-area-inset-top, 0px) + 8px)",
                bottom: "calc(96px + env(safe-area-inset-bottom, 0px) + 16px)",
              }}
            >
              <div className="relative h-full flex flex-col">
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Tutup"
                  className="absolute -top-2 -right-2 z-10 w-7 h-7 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center shadow-md active:scale-95"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <FeedbackReportPanel user={user} onClose={() => setOpen(false)} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}