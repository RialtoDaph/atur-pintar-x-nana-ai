import { useState } from "react";
import { X, Star } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function FeedbackModal({ user, onClose }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [touched, setTouched] = useState(false);

  async function handleSubmit() {
    setTouched(true);
    if (!message.trim()) return;
    setSending(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: user?.email || "feedback@atur.in",
        subject: `Feedback Atur.in${rating ? ` — Rating: ${rating}/5` : ""}`,
        body: `Feedback dari: ${user?.full_name || "Pengguna"} (${user?.email || "-"})\n\n${rating ? `Rating: ${"⭐".repeat(rating)} (${rating}/5)\n\n` : ""}Pesan:\n${message}`,
      });
      toast.success("Feedback terkirim! Terima kasih 🙏");
      onClose();
    } catch {
      toast.error("Gagal mengirim feedback. Coba lagi.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-title"
      >
        <div className="flex items-center justify-between mb-2">
          <h2 id="feedback-title" className="text-lg font-bold text-[#1A1A1A]">Kirim Feedback</h2>
          <button
            onClick={onClose}
            aria-label="Tutup modal"
            className="text-[#9B9B9B] hover:text-[#1A1A1A] transition-colors rounded-lg p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-[#8FA4C8] mb-5">Bantu kami meningkatkan Atur.in dengan masukan Anda.</p>

        {/* Star Rating */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-2">
            Rating (opsional)
          </p>
          <div className="flex gap-2" role="group" aria-label="Pilih rating bintang">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star === rating ? 0 : star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                aria-label={`${star} bintang`}
                aria-pressed={rating === star}
                className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#FF6A00] rounded"
              >
                <Star
                  className={`w-8 h-8 transition-colors ${
                    star <= (hoveredRating || rating)
                      ? "text-[#FF6A00] fill-[#FF6A00]"
                      : "text-[#E2E8F0]"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Message */}
        <div className="mb-5">
          <label
            htmlFor="feedback-message"
            className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest mb-2 block"
          >
            Pesan <span className="text-red-400" aria-hidden="true">*</span>
          </label>
          <textarea
            id="feedback-message"
            rows={4}
            value={message}
            onChange={(e) => { setMessage(e.target.value); setTouched(true); }}
            placeholder="Ceritakan pengalaman Anda menggunakan Atur.in..."
            aria-required="true"
            aria-describedby={touched && !message.trim() ? "feedback-error" : undefined}
            className={`w-full border rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00] bg-[#F8FAFC] resize-none transition-colors ${
              touched && !message.trim() ? "border-red-400" : "border-[#E2E8F0]"
            }`}
          />
          {touched && !message.trim() && (
            <p id="feedback-error" role="alert" className="text-xs text-red-400 mt-1">
              Pesan tidak boleh kosong
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-[#8FA4C8] hover:bg-[#F8FAFC] transition-colors focus:outline-none focus:ring-2 focus:ring-[#E2E8F0]"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={sending}
            aria-busy={sending}
            className="flex-1 py-3 rounded-xl bg-[#FF6A00] text-white text-sm font-semibold hover:bg-[#e05e00] transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#FF6A00] focus:ring-offset-2"
          >
            {sending ? "Mengirim..." : "Kirim Feedback"}
          </button>
        </div>
      </div>
    </div>
  );
}