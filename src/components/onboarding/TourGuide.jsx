import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, ArrowRight, ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";

const MOBILE_TOUR_STEPS = [
  { id: "balance-card", page: "Dashboard", title: "Kartu Ringkasan 💰", desc: "Geser ke kiri atau ketuk kartu untuk lihat 5 ringkasan: Bulan Ini, Semua Rekening, Investasi, Utang, dan Keuangan Bersama. Titik oranye di bawah menunjukkan slide aktif.", placement: "bottom" },
  { id: "add-transaction-btn", page: "Dashboard", title: "Catat Transaksi ➕", desc: "Ketuk tombol + untuk catat pemasukan atau pengeluaran baru. Pilih rekening dan kategori dalam hitungan detik.", placement: "top" },
  { id: "nana-tab", page: "Dashboard", title: "Tanya Nana AI 🤖", desc: "Tanya Nana untuk saran keuangan personal, analisis pengeluaran, dan tips menabung kapan saja.", placement: "top" },
  { id: "analytics-tab", page: "Dashboard", title: "Lihat Analytics 📊", desc: "Pantau pola pengeluaran, kategori favorit, dan insight keuangan bulanan kamu di sini.", placement: "top" },
  { id: "accounts-page-header", page: "Accounts", title: "Kelola Rekening 🏦", desc: "Tambah bank, e-wallet, dan cash di satu tempat. Saldo selalu tersinkronisasi otomatis tiap transaksi.", placement: "bottom" },
  { id: "profile-avatar", page: "Dashboard", title: "Siap Mulai! 🎉", desc: "Pengaturan akun dan profil ada di ikon ini. Selamat menggunakan Atur Pintar, kontrol uangmu mulai sekarang!", placement: "bottom" },
];

// TODO: Desktop tour steps — customize terpisah nanti (placeholder = sama dengan mobile sementara)
const DESKTOP_TOUR_STEPS = MOBILE_TOUR_STEPS;

const TOUR_STEPS = typeof window !== "undefined" && window.innerWidth >= 640 ? DESKTOP_TOUR_STEPS : MOBILE_TOUR_STEPS;

const TOOLTIP_WIDTH = 280;
const TOOLTIP_HEIGHT = 160;

function getTooltipStyle(rect, placement) {
  if (!rect) return {};
  const padding = 28;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let top, left;

  // Auto-flip: if requested placement doesn't fit, use opposite
  const spaceBelow = vh - rect.bottom;
  const spaceAbove = rect.top;
  let actualPlacement = placement;
  if ((placement === "bottom" || placement === "bottom-left") && spaceBelow < TOOLTIP_HEIGHT + padding + 16 && spaceAbove > spaceBelow) {
    actualPlacement = placement === "bottom-left" ? "top-left" : "top";
  } else if ((placement === "top" || placement === "top-left") && spaceAbove < TOOLTIP_HEIGHT + padding + 16 && spaceBelow > spaceAbove) {
    actualPlacement = placement === "top-left" ? "bottom-left" : "bottom";
  }

  if (actualPlacement === "bottom" || actualPlacement === "bottom-left") {
    top = rect.bottom + padding;
    left = actualPlacement === "bottom-left" ? rect.right - TOOLTIP_WIDTH : rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
  } else {
    top = rect.top - TOOLTIP_HEIGHT - padding;
    left = actualPlacement === "top-left" ? rect.right - TOOLTIP_WIDTH : rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
  }

  left = Math.max(8, Math.min(left, vw - TOOLTIP_WIDTH - 8));
  top = Math.max(8, Math.min(top, vh - TOOLTIP_HEIGHT - 8));

  // Final guard: if tooltip overlaps spotlight (within padding), push it away
  const spotlightTop = rect.top - 6;
  const spotlightBottom = rect.bottom + 6;
  const tooltipBottom = top + TOOLTIP_HEIGHT;
  if (top < spotlightBottom && tooltipBottom > spotlightTop) {
    if (spaceBelow > spaceAbove) {
      top = Math.min(spotlightBottom + padding, vh - TOOLTIP_HEIGHT - 8);
    } else {
      top = Math.max(spotlightTop - TOOLTIP_HEIGHT - padding, 8);
    }
  }

  return { top, left, width: TOOLTIP_WIDTH };
}

function getRect(id) {
  const el = document.querySelector(`[data-tour="${id}"]`);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return null;
  return { top: rect.top, left: rect.left, width: rect.width, height: rect.height, bottom: rect.bottom, right: rect.right };
}

export default function TourGuide({ onComplete }) {
  const [showWelcome, setShowWelcome] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  const currentStep = TOUR_STEPS[stepIndex];
  const isLast = stepIndex === TOUR_STEPS.length - 1;

  function clearTimers() {
    if (intervalRef.current) { clearTimeout(intervalRef.current); intervalRef.current = null; }
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
  }

  // Navigate to correct page when step changes
  useEffect(() => {
    if (showWelcome) return;
    const targetPath = `/${currentStep.page}`;
    if (location.pathname !== targetPath) {
      // Small delay to let any open menu/sheet close before navigation
      const t = setTimeout(() => {
        navigate(createPageUrl(currentStep.page));
      }, 50);
      return () => clearTimeout(t);
    }
  }, [stepIndex, showWelcome, currentStep.page, location.pathname, navigate]);

  // Find and highlight element after step/navigation changes
  useEffect(() => {
    if (showWelcome) return;
    // Only start polling once pathname matches the target page — avoids races during navigation
    const targetPath = `/${currentStep.page}`;
    if (location.pathname !== targetPath) return;

    clearTimers();
    setTargetRect(null);

    let attempts = 0;
    const maxAttempts = 200; // ~20 seconds total — covers lazy-loaded pages + AnimatePresence transitions

    function tryFind() {
      attempts++;
      // Find element that's actually rendered (has size) — skip hidden duplicates (e.g. desktop FAB hidden on mobile)
      const candidates = document.querySelectorAll(`[data-tour="${currentStep.id}"]`);
      let el = null;
      for (const c of candidates) {
        const r = c.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) { el = c; break; }
      }
      if (el) {
        const scrollable = el.closest(".overflow-y-auto") || document.querySelector(".overflow-y-auto");
        if (scrollable) {
          const elRect = el.getBoundingClientRect();
          const containerRect = scrollable.getBoundingClientRect();
          const targetScroll = scrollable.scrollTop + elRect.top - containerRect.top - (window.innerHeight / 2) + elRect.height / 2;
          scrollable.scrollTo({ top: Math.max(0, targetScroll), behavior: "smooth" });
        } else {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        // Re-query rect multiple times — animation/scroll/layout shift can change final position
        let settleAttempts = 0;
        let lastRect = null;
        function settleRect() {
          settleAttempts++;
          const candidates2 = document.querySelectorAll(`[data-tour="${currentStep.id}"]`);
          let visibleEl = null;
          for (const c of candidates2) {
            const r = c.getBoundingClientRect();
            if (r.width > 0 && r.height > 0) { visibleEl = c; break; }
          }
          if (!visibleEl) {
            if (settleAttempts < 20) timeoutRef.current = setTimeout(settleRect, 100);
            return;
          }
          const r = visibleEl.getBoundingClientRect();
          const newRect = { top: r.top, left: r.left, width: r.width, height: r.height, bottom: r.bottom, right: r.right };
          // Wait until rect stops moving (2 identical readings) or max attempts
          if (lastRect && Math.abs(lastRect.top - newRect.top) < 1 && Math.abs(lastRect.left - newRect.left) < 1) {
            setTargetRect(newRect);
            return;
          }
          lastRect = newRect;
          if (settleAttempts < 20) {
            timeoutRef.current = setTimeout(settleRect, 100);
          } else {
            setTargetRect(newRect);
          }
        }
        timeoutRef.current = setTimeout(settleRect, 500);
        return;
      }
      if (attempts < maxAttempts) {
        intervalRef.current = setTimeout(tryFind, 100);
      }
    }

    // Longer initial delay on mobile to let AnimatePresence finish exit animation (300ms) + lazy chunk load
    const initialDelay = window.innerWidth < 640 ? 800 : 400;
    timeoutRef.current = setTimeout(tryFind, initialDelay);

    return () => clearTimers();
  }, [stepIndex, location.pathname, showWelcome, currentStep.id, currentStep.page]);

  // Cleanup on unmount
  useEffect(() => () => clearTimers(), []);

  // Live-track target element position — re-measure on scroll, resize, and layout shifts (e.g. desktop sidebar hover-expand)
  useEffect(() => {
    if (showWelcome || !targetRect) return;

    function remeasure() {
      const candidates = document.querySelectorAll(`[data-tour="${currentStep.id}"]`);
      for (const c of candidates) {
        const r = c.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          setTargetRect(prev => {
            if (prev && Math.abs(prev.top - r.top) < 1 && Math.abs(prev.left - r.left) < 1 && Math.abs(prev.width - r.width) < 1) return prev;
            return { top: r.top, left: r.left, width: r.width, height: r.height, bottom: r.bottom, right: r.right };
          });
          return;
        }
      }
    }

    const el = document.querySelector(`[data-tour="${currentStep.id}"]`);
    const ro = el && "ResizeObserver" in window ? new ResizeObserver(remeasure) : null;
    if (ro && el) ro.observe(el);
    // Also observe body for sidebar expand and other layout changes
    const bodyRo = "ResizeObserver" in window ? new ResizeObserver(remeasure) : null;
    if (bodyRo) bodyRo.observe(document.body);

    window.addEventListener("scroll", remeasure, true);
    window.addEventListener("resize", remeasure);
    const interval = setInterval(remeasure, 1000);

    return () => {
      if (ro) ro.disconnect();
      if (bodyRo) bodyRo.disconnect();
      window.removeEventListener("scroll", remeasure, true);
      window.removeEventListener("resize", remeasure);
      clearInterval(interval);
    };
  }, [showWelcome, targetRect !== null, currentStep.id]);

  function handleNext() {
    if (isLast) { onComplete(); return; }
    const nextStep = TOUR_STEPS[stepIndex + 1];
    const nextPath = `/${nextStep.page}`;
    // Navigate FIRST, then advance step — ensures the page transition starts immediately
    if (location.pathname !== nextPath) {
      navigate(createPageUrl(nextStep.page));
    }
    setStepIndex(i => i + 1);
  }

  function handlePrev() {
    if (stepIndex === 0) return;
    const prevStep = TOUR_STEPS[stepIndex - 1];
    const prevPath = `/${prevStep.page}`;
    if (location.pathname !== prevPath) {
      navigate(createPageUrl(prevStep.page));
    }
    setStepIndex(i => i - 1);
  }

  const tooltipStyle = getTooltipStyle(targetRect, currentStep.placement);
  const spotlight = targetRect ? {
    top: targetRect.top - 6, left: targetRect.left - 6,
    width: targetRect.width + 12, height: targetRect.height + 12,
  } : null;

  const fallbackStyle = !targetRect ? {
    bottom: 120, left: "50%", marginLeft: -(TOOLTIP_WIDTH / 2), width: TOOLTIP_WIDTH,
  } : {};

  // Render dim overlay as 4 separate rects around the spotlight so the spotlight area
  // itself is a true hole — clicks pass through to the highlighted element (e.g. swiping the balance card).
  const overlayBg = "rgba(0,0,0,0.65)";
  const dimRects = spotlight ? [
    { top: 0, left: 0, width: "100%", height: spotlight.top },
    { top: spotlight.top + spotlight.height, left: 0, width: "100%", bottom: 0 },
    { top: spotlight.top, left: 0, width: spotlight.left, height: spotlight.height },
    { top: spotlight.top, left: spotlight.left + spotlight.width, right: 0, height: spotlight.height },
  ] : [{ top: 0, left: 0, right: 0, bottom: 0 }];

  if (showWelcome) {
    return createPortal(
      <div data-tour-overlay="true" className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center p-5">
        <div className="bg-[#0A0A0A] border border-[#FF6A00]/40 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#FF6A00] to-[#e05e00] flex items-center justify-center text-4xl shadow-lg">
            👋
          </div>
          <h2 className="text-white font-bold text-xl mb-2">Selamat Datang di Atur Pintar!</h2>
          <p className="text-[#8FA4C8] text-sm leading-relaxed mb-6">
            Yuk, kenalan dulu sama fitur-fitur utama biar kamu makin gampang ngatur keuangan. Tur singkat ini cuma 6 langkah, kok 😉
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setShowWelcome(false)}
              className="w-full py-3 rounded-2xl bg-[#FF6A00] text-white font-bold text-sm hover:bg-[#e05e00] transition-colors tap-highlight-fix"
            >
              Mulai Tur 🚀
            </button>
            <button
              onClick={onComplete}
              className="w-full py-2.5 text-[#8FA4C8] text-xs font-medium hover:text-white transition-colors tap-highlight-fix"
            >
              Nanti aja
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div data-tour-overlay="true" className="fixed inset-0 z-[9999]" style={{ pointerEvents: "none" }}>
      {dimRects.map((style, i) => (
        <div
          key={i}
          className="absolute"
          style={{ ...style, background: overlayBg, pointerEvents: "all" }}
        />
      ))}
      {spotlight && (
        <div
          className="absolute rounded-xl pointer-events-none"
          style={{
            top: spotlight.top, left: spotlight.left,
            width: spotlight.width, height: spotlight.height,
            border: "2px solid #FF6A00",
            boxShadow: "0 0 0 1px rgba(255,106,0,0.3)"
          }}
        />
      )}

      <div
        className="absolute bg-[#0A0A0A] border border-[#FF6A00]/40 rounded-2xl p-4 shadow-2xl"
        style={{ ...(targetRect ? tooltipStyle : fallbackStyle), pointerEvents: "all", zIndex: 10000 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-1">
            {TOUR_STEPS.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === stepIndex ? "w-5 bg-[#FF6A00]" : "w-1.5 bg-white/20"}`} />
            ))}
          </div>
          <button onClick={onComplete} className="text-[#8FA4C8] hover:text-white transition-colors tap-highlight-fix">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <h3 className="text-white font-bold text-sm mb-1">{currentStep.title}</h3>
        <p className="text-[#8FA4C8] text-xs leading-relaxed mb-4">{currentStep.desc}</p>

        <div className="flex items-center justify-between gap-2">
          <button onClick={onComplete} className="text-xs text-[#8FA4C8] hover:text-white transition-colors tap-highlight-fix">
            Lewati
          </button>
          <div className="flex gap-2">
            {stepIndex > 0 && (
              <button onClick={handlePrev} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition-colors tap-highlight-fix">
                <ArrowLeft className="w-3 h-3" /> Kembali
              </button>
            )}
            <button onClick={handleNext} className="flex items-center gap-1 px-4 py-1.5 rounded-xl bg-[#FF6A00] text-white text-xs font-bold hover:bg-[#e05e00] transition-colors tap-highlight-fix">
              {isLast ? "Selesai 🎉" : (<>Lanjut <ArrowRight className="w-3 h-3" /></>)}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}