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
{ id: "profile-avatar", page: "Dashboard", title: "Siap Mulai! 🎉", desc: "Pengaturan akun dan profil ada di ikon ini. Selamat menggunakan Atur Pintar, kontrol uangmu mulai sekarang!", placement: "bottom" }];


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
    if (intervalRef.current) {clearInterval(intervalRef.current);intervalRef.current = null;}
    if (timeoutRef.current) {clearTimeout(timeoutRef.current);timeoutRef.current = null;}
  }

  // Navigate to correct page when step changes
  useEffect(() => {
    if (showWelcome) return;
    const targetPath = `/${currentStep.page}`;
    if (!location.pathname.startsWith(targetPath)) {
      navigate(createPageUrl(currentStep.page));
    }
  }, [stepIndex, showWelcome]);

  // Find and highlight element after step/navigation changes
  useEffect(() => {
    if (showWelcome) return;
    clearTimers();
    setTargetRect(null);

    let attempts = 0;
    // Wait longer for pages that need data-fetch / lazy load (Accounts, Analytics)
    const maxAttempts = 120; // ~12 seconds total

    function tryFind() {
      attempts++;
      const el = document.querySelector(`[data-tour="${currentStep.id}"]`);
      if (el) {
        // Scroll the element into view using its nearest scrollable parent
        const scrollable = document.querySelector(".overflow-y-auto");
        if (scrollable) {
          const elRect = el.getBoundingClientRect();
          const containerRect = scrollable.getBoundingClientRect();
          const targetScroll = scrollable.scrollTop + elRect.top - containerRect.top - window.innerHeight / 2 + elRect.height / 2;
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
      if (attempts < maxAttempts) {
        intervalRef.current = setTimeout(tryFind, 100);
      }
      // If never found, tooltip falls back to bottom-center (handled below) and Lanjut still works
    }

    // Start polling after a short delay to allow page to render
    timeoutRef.current = setTimeout(tryFind, 500);

    return () => clearTimers();
  }, [stepIndex, location.pathname, showWelcome]);

  // Cleanup on unmount
  useEffect(() => () => clearTimers(), []);

  function handleNext() {
    if (isLast) onComplete();else
    setStepIndex((i) => i + 1);
  }

  function handlePrev() {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  }

  const tooltipStyle = getTooltipStyle(targetRect, currentStep.placement);
  const spotlight = targetRect ? {
    top: targetRect.top - 6, left: targetRect.left - 6,
    width: targetRect.width + 12, height: targetRect.height + 12
  } : null;

  const fallbackStyle = !targetRect ? {
    bottom: 120, left: "50%", marginLeft: -(TOOLTIP_WIDTH / 2), width: TOOLTIP_WIDTH
  } : {};

  // Render dim overlay as 4 separate rects around the spotlight so the spotlight area
  // itself is a true hole — clicks pass through to the highlighted element (e.g. swiping the balance card).
  const overlayBg = "rgba(0,0,0,0.65)";
  const dimRects = spotlight ? [
  { top: 0, left: 0, width: "100%", height: spotlight.top },
  { top: spotlight.top + spotlight.height, left: 0, width: "100%", bottom: 0 },
  { top: spotlight.top, left: 0, width: spotlight.left, height: spotlight.height },
  { top: spotlight.top, left: spotlight.left + spotlight.width, right: 0, height: spotlight.height }] :
  [{ top: 0, left: 0, right: 0, bottom: 0 }];

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
              className="w-full py-3 rounded-2xl bg-[#FF6A00] text-white font-bold text-sm hover:bg-[#e05e00] transition-colors tap-highlight-fix">
              
              Mulai Tur 🚀
            </button>
            <button
              onClick={onComplete}
              className="w-full py-2.5 text-[#8FA4C8] text-xs font-medium hover:text-white transition-colors tap-highlight-fix">
              
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
      {dimRects.map((style, i) =>
      <div
        key={i}
        className="absolute"
        style={{ ...style, background: overlayBg, pointerEvents: "all" }}
        onClick={handleNext} />

      )}
      {spotlight &&
      <div
        className="absolute rounded-xl pointer-events-none"
        style={{
          top: spotlight.top, left: spotlight.left,
          width: spotlight.width, height: spotlight.height,
          border: "2px solid #FF6A00",
          boxShadow: "0 0 0 1px rgba(255,106,0,0.3)"
        }} />

      }

      <div
        className="absolute bg-[#0A0A0A] border border-[#FF6A00]/40 rounded-2xl shadow-2xl px-4 py-4 my-1"
        style={{ ...(targetRect ? tooltipStyle : fallbackStyle), pointerEvents: "all", zIndex: 10000 }}
        onClick={(e) => e.stopPropagation()}>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-1">
            {TOUR_STEPS.map((_, i) =>
            <div key={i} className={`h-1.5 rounded-full transition-all ${i === stepIndex ? "w-5 bg-[#FF6A00]" : "w-1.5 bg-white/20"}`} />
            )}
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
            {stepIndex > 0 &&
            <button onClick={handlePrev} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition-colors tap-highlight-fix">
                <ArrowLeft className="w-3 h-3" /> Kembali
              </button>
            }
            <button onClick={handleNext} className="flex items-center gap-1 px-4 py-1.5 rounded-xl bg-[#FF6A00] text-white text-xs font-bold hover:bg-[#e05e00] transition-colors tap-highlight-fix">
              {isLast ? "Selesai 🎉" : <>Lanjut <ArrowRight className="w-3 h-3" /></>}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}