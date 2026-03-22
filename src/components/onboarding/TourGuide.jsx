import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, ArrowRight, ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";

const TOUR_STEPS = [
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
    id: "add-transaction-btn",
    page: "Transactions",
    title: "Tambah Transaksi ➕",
    desc: "Ketuk tombol + untuk catat pemasukan atau pengeluaran baru.",
    placement: "bottom-left",
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
    placement: "bottom",
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
    id: "tips-page-hint",
    page: "Tips",
    title: "Pusat Bantuan 💡",
    desc: "Ada fitur yang belum dipahami? Cari jawabannya di sini. Semua panduan tersedia lengkap!",
    placement: "bottom",
  },
];

function getTooltipStyle(rect, placement) {
  if (!rect) return {};
  const padding = 12;
  const tooltipWidth = 280;
  const tooltipHeight = 140;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let top, left;

  if (placement === "bottom" || placement === "bottom-left") {
    top = rect.bottom + padding;
    left = placement === "bottom-left"
      ? Math.max(8, rect.right - tooltipWidth)
      : rect.left + rect.width / 2 - tooltipWidth / 2;
  } else if (placement === "top" || placement === "top-left") {
    top = rect.top - tooltipHeight - padding;
    left = placement === "top-left"
      ? Math.max(8, rect.right - tooltipWidth)
      : rect.left + rect.width / 2 - tooltipWidth / 2;
  } else {
    top = rect.bottom + padding;
    left = rect.left + rect.width / 2 - tooltipWidth / 2;
  }

  // Clamp to viewport
  left = Math.max(8, Math.min(left, vw - tooltipWidth - 8));
  top = Math.max(8, Math.min(top, vh - tooltipHeight - 8));

  return { top, left, width: tooltipWidth };
}

export default function TourGuide({ onComplete }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const rafRef = useRef(null);

  const currentStep = TOUR_STEPS[stepIndex];
  const isLast = stepIndex === TOUR_STEPS.length - 1;

  const measureTarget = useCallback(() => {
    const el = document.querySelector(`[data-tour="${currentStep.id}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => {
        const rect = el.getBoundingClientRect();
        setTargetRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height, bottom: rect.bottom, right: rect.right });
      }, 400);
    } else {
      setTargetRect(null);
    }
  }, [currentStep.id]);

  // Navigate to page if needed
  useEffect(() => {
    const targetPath = `/${currentStep.page}`;
    if (!location.pathname.startsWith(targetPath)) {
      navigate(createPageUrl(currentStep.page));
    }
  }, [stepIndex]);

  // Measure after navigation / render
  useEffect(() => {
    const timer = setTimeout(measureTarget, 600);
    return () => clearTimeout(timer);
  }, [stepIndex, location.pathname, measureTarget]);

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
        {/* Spotlight border glow */}
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
        style={{ ...tooltipStyle, pointerEvents: "all", zIndex: 10000 }}
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