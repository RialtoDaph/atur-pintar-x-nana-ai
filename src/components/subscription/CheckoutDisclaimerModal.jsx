import { useState, useEffect } from "react";
import { ShieldCheck, X, Zap } from "lucide-react";
import useLockBodyScroll from "@/hooks/useLockBodyScroll";

/**
 * Confirmation modal shown before redirecting to the Xendit checkout page.
 * Forces the user to explicitly acknowledge the legal terms (T&C, Refund
 * Policy, Cancellation Policy) via a checkbox — the "Lanjut ke Pembayaran"
 * button stays disabled until it's ticked. This ensures the disclaimer is
 * seen in-app (Xendit's page doesn't show it).
 */
export default function CheckoutDisclaimerModal({ plan, priceLabel, loading, onClose, onConfirm }) {
  useLockBodyScroll();
  const [agreed, setAgreed] = useState(false);

  // Reset acknowledgement whenever the target plan changes
  useEffect(() => {
    setAgreed(false);
  }, [plan?.key]);

  if (!plan) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-disclaimer-title"
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl flex flex-col"
        style={{ maxHeight: "min(92dvh, calc(100dvh - 2rem))" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#F2F4F7] flex-shrink-0">
          <h2 id="checkout-disclaimer-title" className="text-lg font-bold text-[#1A1A1A]">Konfirmasi Pembayaran</h2>
          <button
            onClick={onClose}
            disabled={loading}
            aria-label="Tutup"
            className="text-[#9B9B9B] hover:text-[#1A1A1A] disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto overscroll-contain flex-1">
          {/* Order summary */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 mb-4 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-[#8FA4C8]">Produk</span>
              <span className="font-semibold text-[#1A1A1A]">Atur Pintar Premium</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#8FA4C8]">Paket</span>
              <span className="font-semibold text-[#1A1A1A]">{plan.label}</span>
            </div>
            <div className="flex justify-between text-sm pt-1.5 border-t border-[#E2E8F0]">
              <span className="text-[#1A1A1A] font-medium">Total Pembayaran</span>
              <span className="font-bold text-[#F97316]">{priceLabel}</span>
            </div>
          </div>

          {/* Disclaimer notice */}
          <div className="bg-[#FFF7ED] border border-[#F97316]/20 rounded-xl p-4 flex items-start gap-3 mb-4">
            <ShieldCheck className="w-4 h-4 text-[#F97316] flex-shrink-0 mt-0.5" />
            <div className="text-xs text-[#1A1A1A] leading-relaxed space-y-2">
              <p className="font-semibold">Sebelum Lanjut ke Pembayaran</p>
              <p className="text-[#4A5568]">
                Kamu akan diarahkan ke halaman Xendit (PT Xendit Investasi Indonesia) — payment gateway
                berlisensi Bank Indonesia. Pembayaran diterima oleh <span className="font-semibold">PT Rideff Vreka Tech</span>.
              </p>
              <p className="text-[#4A5568]">
                Langganan aktif otomatis setelah pembayaran dikonfirmasi.{" "}
                {plan.key === "premium_yearly" ? "Paket tahunan" : "Paket bulanan"} akan diperpanjang secara manual — kamu bisa membatalkan kapan saja lewat pengaturan akun.
              </p>
            </div>
          </div>

          {/* Consent checkbox */}
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              disabled={loading}
              className="w-4 h-4 mt-0.5 accent-[#F97316] flex-shrink-0"
            />
            <span className="text-xs text-[#4A5568] leading-relaxed">
              Saya menyetujui{" "}
              <a href="https://aturpintar.id/TermsOfService" target="_blank" rel="noopener noreferrer" className="text-[#F97316] hover:underline font-semibold">Syarat & Ketentuan</a>,{" "}
              <a href="https://aturpintar.id/RefundPolicy" target="_blank" rel="noopener noreferrer" className="text-[#F97316] hover:underline font-semibold">Kebijakan Refund</a>, dan{" "}
              <a href="https://aturpintar.id/CancellationPolicy" target="_blank" rel="noopener noreferrer" className="text-[#F97316] hover:underline font-semibold">Pembatalan Langganan</a>{" "}
              Atur Pintar.
            </span>
          </label>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 border-t border-[#F2F4F7] flex-shrink-0 flex gap-3"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-[#4A5568] hover:bg-[#F8FAFC] disabled:opacity-40 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={!agreed || loading}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-[#F97316] hover:bg-[#e05e00] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Memuat...</>
            ) : (
              <><Zap className="w-4 h-4" /> Lanjut ke Pembayaran</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}