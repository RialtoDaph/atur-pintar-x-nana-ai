import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ShieldCheck, X } from "lucide-react";

/**
 * ConsentModal — shown when user taps Google/Apple login.
 * Captures explicit T&C consent before triggering OAuth.
 *
 * Props:
 *  - open: boolean
 *  - provider: "google" | "apple" — used for display label only
 *  - onClose: () => void
 *  - onConfirm: () => void  (called when user agrees & taps Lanjut)
 */
export default function ConsentModal({ open, provider, onClose, onConfirm }) {
  const [agreed, setAgreed] = useState(false);

  // Reset checkbox whenever modal opens
  useEffect(() => {
    if (open) setAgreed(false);
  }, [open]);

  if (!open) return null;

  const providerLabel = provider === "apple" ? "Apple" : "Google";

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="bg-[#1B1B1B] border border-white/10 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl animate-slide-up-sheet sm:animate-none overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F97316]/15 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#F97316]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Sebelum Melanjutkan</h3>
              <p className="text-xs text-white/50 mt-0.5">Lanjut dengan {providerLabel}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <p className="text-sm text-white/70 leading-relaxed mb-4">
            Untuk melindungi data keuangan kamu, kami perlu persetujuan kamu sebelum membuat atau membuka akun.
          </p>

          <label
            htmlFor="consent-agree"
            className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
          >
            <Checkbox
              id="consent-agree"
              checked={agreed}
              onCheckedChange={(v) => setAgreed(v === true)}
              className="mt-0.5 border-white/30 data-[state=checked]:bg-[#F97316] data-[state=checked]:border-[#F97316] flex-shrink-0"
            />
            <Label htmlFor="consent-agree" className="text-xs text-white/80 leading-relaxed font-normal cursor-pointer">
              Saya setuju dengan{" "}
              <a href="https://aturpintar.com/PrivacyPolicy" target="_blank" rel="noopener noreferrer" className="text-[#F97316] hover:underline font-semibold">
                Kebijakan Privasi
              </a>{" "}
              dan{" "}
              <a href="https://aturpintar.com/TermsOfService" target="_blank" rel="noopener noreferrer" className="text-[#F97316] hover:underline font-semibold">
                Ketentuan Layanan
              </a>{" "}
              Atur Pintar.
            </Label>
          </label>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-2 flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 h-11 bg-transparent border-white/15 text-white/70 hover:bg-white/5 hover:text-white"
          >
            Batal
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!agreed}
            className="flex-1 h-11 font-bold bg-[#F97316] hover:bg-[#e05e00] text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Lanjut
          </Button>
        </div>
      </div>
    </div>
  );
}