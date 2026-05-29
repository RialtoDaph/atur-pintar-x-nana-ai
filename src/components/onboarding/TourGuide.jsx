import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, ArrowRight, ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";

const TOUR_STEPS = [
  { id: "balance-card", page: "Dashboard", title: "Kartu Ringkasan 💰", desc: "Geser ke kiri atau ketuk kartu untuk lihat 5 ringkasan: Bulan Ini, Semua Rekening, Investasi, Utang, dan Keuangan Bersama. Titik oranye di bawah menunjukkan slide aktif.", placement: "bottom" },
  { id: "add-transaction-btn", page: "Dashboard", title: "Catat Transaksi ➕", desc: "Ketuk tombol + untuk catat pemasukan atau pengeluaran baru. Pilih rekening dan kategori dalam hitungan detik.", placement: "top" },
  { id: "nana-tab", page: "Dashboard", title: "Tanya Nana AI 🤖", desc: "Tanya Nana untuk saran keuangan personal, analisis pengeluaran, dan tips menabung kapan saja.", placement: "top" },
  { id: "analytics-tab", page: "Dashboard", title: "Lihat Analytics 📊", desc: "Pantau pola pengeluaran, kategori favorit, dan insight keuangan bulanan kamu di sini.", placement: "top" },
  { id: "accounts-page-header", page: "Accounts", title: "Kelola Rekening 🏦", desc: "Tambah bank, e-wallet, dan cash di satu tempat. Saldo selalu tersinkronisasi otomatis tiap transaksi.", placement: "bottom" },
  { id: "profile-avatar", page: "Dashboard", title: "Siap Mulai! 🎉", desc: "Pengaturan akun dan profil ada di ikon ini. Selamat menggunakan Atur Pintar, kontrol uangmu mulai sekarang!", placement: "bottom" },
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
    left = placement === "bottom-left" ? rect.right - TOOLTIP_WIDTH : rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
  } else {
    top = rect.top - TOOLTIP_HEIGHT - padding;
    left = placement === "top-left" ? rect.right - TOOLTIP_WIDTH : rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
  }

  left = Math.max(8, Math.min(left, vw - TOOLTIP_WIDTH - 8));
  top = Math.max(8, Math.min(top, vh - TOOLTIP_HEIGHT - 8));
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
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  const currentStep = TOUR_STEPS[stepIndex];
  const isLast = stepIndex === TOUR_STEPS.length - 1;

  function clearTimers() {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
  }

  // Navigate to correct page when step changes
  useEffect(() => {
    const targetPath = `/${currentStep.page}`;
    if (!location.pathname.startsWith(targetPath)) {
      navigate(createPageUrl(currentStep.page));
    }
  }, [stepIndex]);

  // Find and highlight element after step/navigation changes
  useEffect(() => {
    clearTimers();
    setTargetRect(null);

    let attempts = 0;

    function tryFind() {
      attempts++;
      const el = document.querySelector(`[data-tour="${currentStep.id}"]`);
      if (el) {
        // Scroll the element into view using its nearest scrollable parent
        const scrollable = document.querySelector(".overflow-y-auto");
        if (scrollable) {
          const elRect = el.getBoundingClientRect();
          const containerRect = scrollable.getBoundingClientRect();
          const targetScroll = scrollable.scrollTop + elRect.top - containerRect.top - (window.innerHeight / 2) + elRect.height / 2;
          scrollable.scrollTo({ top: Math.max(0, targetScroll), behavior: "smooth" });
        } else {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        // After scroll animation (~500ms), measure final position
        timeoutRef.current = setTimeout(() => {
          const rect = getRect(currentStep.id);
          setTargetRect(rect);
        }, 600);
        return;
      }
      if (attempts < 50) {
        intervalRef.current = setTimeout(tryFind, 100);
      }
    }

    // Start polling after a short delay to allow page to render
    timeoutRef.current = setTimeout(tryFind, 500);

    return () => clearTimers();
  }, [stepIndex, location.pathname]);

  // Cleanup on unmount
  useEffect(() => () => clearTimers(), []);

  function handleNext() {
    if (isLast) onComplete();
    else setStepIndex(i => i + 1);
  }

  function handlePrev() {
    if (stepIndex > 0) setStepIndex(i => i - 1);
  }

  const tooltipStyle = getTooltipStyle(targetRect, currentStep.placement);
  const spotlight = targetRect ? {
    top: targetRect.top - 6, left: targetRect.left - 6,
    width: targetRect.width + 12, height: targetRect.height + 12,
  } : null;

  const fallbackStyle = !targetRect ? {
    bottom: 100, left: "50%", transform: "translateX(-50%)", width: TOOLTIP_WIDTH,
  } : {};

  return createPortal(
    <div data-tour-overlay="true" className="fixed inset-0 z-[9999]" style={{ pointerEvents: "none" }}>
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "all" }} onClick={handleNext}>
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {spotlight && <rect x={spotlight.left} y={spotlight.top} width={spotlight.width} height={spotlight.height} rx="12" fill="black" />}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.65)" mask="url(#spotlight-mask)" />
        {spotlight && <rect x={spotlight.left} y={spotlight.top} width={spotlight.width} height={spotlight.height} rx="12" fill="none" stroke="#FF6A00" strokeWidth="2" />}
      </svg>

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