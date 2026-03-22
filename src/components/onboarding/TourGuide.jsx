import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, ArrowRight, ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";

const TOUR_STEPS = [
  {
    id: "add-transaction-btn",
    page: "Dashboard",
    title: "Tambah Transaksi ➕",
    desc: "Ketuk tombol + untuk catat pemasukan atau pengeluaran baru.",
    placement: "bottom-left",
  },
  {
    id: "balance-card",
    page: "Dashboard",
    title: "Ringkasan Keuangan 💰",
    desc: "Lihat saldo bersih, pemasukan, dan pengeluaran bulan ini dalam satu tampilan.",
    placement: "bottom",
  },
  {
    id: "nana-chat",
    page: "Dashboard",
    title: "Tanya Nana AI 🤖",
    desc: "Punya pertanyaan soal keuangan? Ketuk Nana kapan saja untuk dapat saran pintar.",
    placement: "top-left",
  },
  {
    id: "contract-payments-card",
    page: "Transactions",
    title: "Kontrak & Tagihan 🏠",
    desc: "Catat tagihan rutin seperti sewa, listrik, atau internet di sini.",
    placement: "bottom",
  },
  {
    id: "subscription-detector-card",
    page: "Transactions",
    title: "Langganan 📱",
    desc: "Pantau semua langganan aktif kamu — Netflix, Spotify, dan lainnya.",
    placement: "bottom",
  },
  {
    id: "tx-history-card",
    page: "Transactions",
    title: "Riwayat Transaksi 📋",
    desc: "Ketuk judul ini untuk buka riwayat lengkap semua transaksi.",
    placement: "top",
  },
  {
    id: "add-budget-btn",
    page: "Budget",
    title: "Buat Anggaran 📊",
    desc: "Tetapkan batas pengeluaran per kategori agar keuangan tetap terkontrol.",
    placement: "bottom-left",
  },
  {
    id: "mobile-more-tab",
    page: "Budget",
    title: "Menu Lainnya 📂",
    desc: "Ketuk 'Lainnya' di navigasi bawah untuk lihat Tujuan, Utang, Pengingat, dan fitur lainnya.",
    placement: "top",
  },
  {
    id: "tips-nav-link",
    page: "Menu",
    title: "Pusat Bantuan 💡",
    desc: "Ada fitur yang belum dipahami? Cari jawabannya di sini. Semua panduan tersedia lengkap!",
    placement: "bottom",
  },
];

const TOOLTIP_WIDTH = 280;
const TOOLTIP_HEIGHT = 160;

function getTooltipStyle(rect, placement) {
  if (!rect) return {};
  const padding = 12;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let top, left;

  if (placement === "bottom" || placement === "bottom-left") {
    top = rect.bottom + padding;
    left = placement === "bottom-left"
      ? rect.right - TOOLTIP_WIDTH
      : rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
  } else if (placement === "top" || placement === "top-left") {
    top = rect.top - TOOLTIP_HEIGHT - padding;
    left = placement === "top-left"
      ? rect.right - TOOLTIP_WIDTH
      : rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
  } else {
    top = rect.bottom + padding;
    left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
  }

  // Clamp to viewport
  left = Math.max(8, Math.min(left, vw - TOOLTIP_WIDTH - 8));
  top = Math.max(8, Math.min(top, vh - TOOLTIP_HEIGHT - 8));

  return { top, left, width: TOOLTIP_WIDTH };
}

function measureElement(id) {
  const el = document.querySelector(`[data-tour="${id}"]`);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  // Only return rect if element is actually visible in viewport
  if (rect.width === 0 && rect.height === 0) return null;
  return { top: rect.top, left: rect.left, width: rect.width, height: rect.height, bottom: rect.bottom, right: rect.right };
}

export default function TourGuide({ onComplete }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const observerRef = useRef(null);
  const rafRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const retryRef = useRef(null);
  const retryCountRef = useRef(0);

  const currentStep = TOUR_STEPS[stepIndex];
  const isLast = stepIndex === TOUR_STEPS.length - 1;

  const measure = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const rect = measureElement(currentStep.id);
      setTargetRect(rect);
    });
  }, [currentStep.id]);

  // Retry finding element until it appears in DOM (for lazy-loaded components)
  const waitAndMeasure = useCallback(() => {
    retryCountRef.current = 0;
    if (retryRef.current) clearInterval(retryRef.current);

    retryRef.current = setInterval(() => {
      retryCountRef.current++;
      const rect = measureElement(currentStep.id);
      if (rect) {
        clearInterval(retryRef.current);
        // Scroll element into view then measure
        const el = document.querySelector(`[data-tour="${currentStep.id}"]`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => {
            const r = measureElement(currentStep.id);
            setTargetRect(r);
          }, 800);
        } else {
          setTargetRect(rect);
        }
      } else if (retryCountRef.current > 20) {
        // Give up after ~2 seconds, show tooltip without highlight
        clearInterval(retryRef.current);
        setTargetRect(null);
      }
    }, 100);
  }, [currentStep.id]);

  // Attach ResizeObserver + scroll listener
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    const el = document.querySelector(`[data-tour="${currentStep.id}"]`);
    if (!el) return;

    observerRef.current = new ResizeObserver(measure);
    observerRef.current.observe(el);

    window.addEventListener("scroll", measure, { passive: true });
    return () => {
      observerRef.current?.disconnect();
      window.removeEventListener("scroll", measure);
    };
  }, [currentStep.id, measure, targetRect]);

  // Navigate to correct page when step changes
  useEffect(() => {
    if (currentStep.noNavigate) return;
    const targetPath = `/${currentStep.page}`;
    if (!location.pathname.startsWith(targetPath)) {
      navigate(createPageUrl(currentStep.page));
    }
  }, [stepIndex]);

  // Wait for element after navigation/render
  useEffect(() => {
    setTargetRect(null);
    const timer = setTimeout(waitAndMeasure, 400);
    return () => {
      clearTimeout(timer);
      if (retryRef.current) clearInterval(retryRef.current);
    };
  }, [stepIndex, location.pathname]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      if (retryRef.current) clearInterval(retryRef.current);
      observerRef.current?.disconnect();
    };
  }, []);

  function handleNext() {
    if (isLast) {
      onComplete();
    } else {
      setStepIndex(i => i + 1);
    }
  }

  function handlePrev() {
    if (stepIndex > 0) setStepIndex(i => i - 1);
  }

  const tooltipStyle = getTooltipStyle(targetRect, currentStep.placement);

  const spotlight = targetRect
    ? {
        top: targetRect.top - 6,
        left: targetRect.left - 6,
        width: targetRect.width + 12,
        height: targetRect.height + 12,
      }
    : null;

  // Fallback position when element not found
  const fallbackStyle = !targetRect ? {
    bottom: 100,
    left: "50%",
    transform: "translateX(-50%)",
    width: TOOLTIP_WIDTH,
  } : {};

  return createPortal(
    <div className="fixed inset-0 z-[9999]" style={{ pointerEvents: "none" }}>
      {/* Dark overlay with spotlight cutout */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: "all" }}
        onClick={handleNext}
      >
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {spotlight && (
              <rect
                x={spotlight.left}
                y={spotlight.top}
                width={spotlight.width}
                height={spotlight.height}
                rx="12"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.65)"
          mask="url(#spotlight-mask)"
        />
        {spotlight && (
          <rect
            x={spotlight.left}
            y={spotlight.top}
            width={spotlight.width}
            height={spotlight.height}
            rx="12"
            fill="none"
            stroke="#FF6A00"
            strokeWidth="2"
          />
        )}
      </svg>

      {/* Tooltip */}
      <div
        className="absolute bg-[#0A0A0A] border border-[#FF6A00]/40 rounded-2xl p-4 shadow-2xl"
        style={{ ...(targetRect ? tooltipStyle : fallbackStyle), pointerEvents: "all", zIndex: 10000 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Progress dots */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-1">
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === stepIndex ? "w-5 bg-[#FF6A00]" : "w-1.5 bg-white/20"}`}
              />
            ))}
          </div>
          <button
            onClick={onComplete}
            className="text-[#8FA4C8] hover:text-white transition-colors tap-highlight-fix"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <h3 className="text-white font-bold text-sm mb-1">{currentStep.title}</h3>
        <p className="text-[#8FA4C8] text-xs leading-relaxed mb-4">{currentStep.desc}</p>

        <div className="flex items-center justify-between gap-2">
          <button
            onClick={onComplete}
            className="text-xs text-[#8FA4C8] hover:text-white transition-colors tap-highlight-fix"
          >
            Lewati
          </button>
          <div className="flex gap-2">
            {stepIndex > 0 && (
              <button
                onClick={handlePrev}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition-colors tap-highlight-fix"
              >
                <ArrowLeft className="w-3 h-3" /> Kembali
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-4 py-1.5 rounded-xl bg-[#FF6A00] text-white text-xs font-bold hover:bg-[#e05e00] transition-colors tap-highlight-fix"
            >
              {isLast ? "Selesai 🎉" : (<>Lanjut <ArrowRight className="w-3 h-3" /></>)}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}