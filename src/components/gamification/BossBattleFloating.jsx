import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import BossBattleCard from "./BossBattleCard";
import BossLeaderboardCompact from "./BossLeaderboardCompact";

/**
 * Floating Boss Battle launcher — bottom-right on both mobile & desktop.
 * Mobile: sits above the bottom nav. Desktop: pinned lower.
 * Uses existing BossBattleCard for content — no business logic change.
 */
export default function BossBattleFloating({ user, gamificationProfile, onProfileUpdate }) {
  const [open, setOpen] = useState(false);

  if (!user?.onboarding_completed) return null;

  return (
    <>
      {/* Floating trigger — icon only, hidden when popup open.
          Mobile: above bottom nav (nav ~70px + safe-area + 36px breathing room).
          Desktop: pinned at bottom-right with 24px margin. */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Buka Boss Battle"
          className="fixed z-[70] right-4 sm:right-6 flex flex-col items-center gap-0.5 active:scale-90 transition-transform sm:bottom-6"
          style={{
            bottom: "calc(110px + env(safe-area-inset-bottom, 0px))",
          }}
        >
          <span className="text-5xl drop-shadow-lg leading-none" aria-hidden="true">👹</span>
          <span className="text-[10px] font-bold text-white bg-[#0A0A0A]/80 rounded-full px-2 py-0.5 leading-none shadow-md">Boss Battle</span>
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
              className="fixed z-[101] left-3 right-3 sm:left-auto sm:right-6 sm:w-[360px]"
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
                <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
                  <BossLeaderboardCompact />
                  <BossBattleCard
                    user={user}
                    gamificationProfile={gamificationProfile}
                    onProfileUpdate={onProfileUpdate}
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}