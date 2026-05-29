import { useState } from "react";
import { X } from "lucide-react";

export default function UMKMPintarAdBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="mx-4 mb-4">
      <div
        className="relative overflow-hidden"
        style={{
          borderRadius: 16,
          background:
            "linear-gradient(135deg, #1C0A00 0%, #2A1200 60%, #1C0A00 100%)",
          border: "1px solid rgba(232,82,10,0.2)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
        }}
      >
        {/* Top orange thin gradient line */}
        <div
          className="absolute top-0 left-0 right-0"
          style={{
            height: 2,
            background:
              "linear-gradient(90deg, transparent, #E8520A, transparent)",
          }}
        />

        {/* Subtle grid texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.04,
            backgroundImage:
              "repeating-linear-gradient(0deg, #ffffff 0, #ffffff 1px, transparent 1px, transparent 20px), repeating-linear-gradient(90deg, #ffffff 0, #ffffff 1px, transparent 1px, transparent 20px)",
          }}
        />

        <div className="relative" style={{ padding: "14px 16px 16px" }}>
          {/* Top row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <span
                style={{
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "rgba(255,255,255,0.3)",
                }}
              >
                Sponsored
              </span>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>·</span>
              <img
                src="https://media.base44.com/images/public/69a82e8090f60786b869983c/d2e52bdf2_3.png"
                alt="Atur Pintar"
                className="flex-shrink-0 object-contain"
                style={{ width: 14, height: 14 }}
              />
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                by Atur Pintar
              </span>
            </div>

            <button
              onClick={() => setDismissed(true)}
              aria-label="Tutup iklan"
              className="flex items-center justify-center tap-highlight-fix transition-colors hover:bg-white/15"
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: "rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.5)",
              }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Content row */}
          <div className="flex items-start gap-3">
            {/* LEFT */}
            <div className="flex-1 min-w-0">
              {/* Logo row */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <div
                  className="flex items-center justify-center flex-shrink-0 overflow-hidden"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "#000",
                    border: "1px solid rgba(232,82,10,0.5)",
                  }}
                >
                  <img
                    src="https://media.base44.com/images/public/69a82e8090f60786b869983c/3a4fdd82d_TangkapanLayar2026-05-08pukul224953.png"
                    alt="Vrekas.id"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span
                  className="text-white font-bold"
                  style={{ fontSize: 14 }}
                >
                  Vrekas.id
                </span>
                <span
                  className="font-bold"
                  style={{
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "#E8520A",
                    background: "rgba(232,82,10,0.18)",
                    border: "1px solid rgba(232,82,10,0.4)",
                    padding: "2px 6px",
                    borderRadius: 4,
                  }}
                >
                  GRATIS
                </span>
              </div>

              <p
                className="text-white font-bold leading-snug mb-1"
                style={{ fontSize: 15 }}
              >
                Punya usaha sampingan?
              </p>
              <p
                className="leading-snug"
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.55)",
                }}
              >
                Invoice, slip gaji & kwitansi profesional dalam menit.
              </p>
            </div>

            {/* RIGHT */}
            <div
              className="flex-shrink-0 flex flex-col items-center"
              style={{ gap: 10 }}
            >
              {/* Document stack illustration */}
              <div
                className="relative"
                style={{ width: 64, height: 72 }}
              >
                {/* Back doc */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: "rgba(232,82,10,0.15)",
                    border: "1px solid rgba(232,82,10,0.2)",
                    borderRadius: 6,
                    transform: "rotate(6deg)",
                  }}
                />
                {/* Middle doc */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: "rgba(232,82,10,0.25)",
                    border: "1px solid rgba(232,82,10,0.35)",
                    borderRadius: 6,
                    transform: "rotate(3deg)",
                  }}
                />
                {/* Front doc */}
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center"
                  style={{
                    background: "#1A0A00",
                    border: "1px solid rgba(232,82,10,0.5)",
                    borderRadius: 6,
                    padding: "8px 6px",
                    gap: 4,
                  }}
                >
                  <span style={{ fontSize: 18, lineHeight: 1 }}>📄</span>
                  <div
                    style={{
                      width: "80%",
                      height: 2,
                      background: "#E8520A",
                      borderRadius: 1,
                    }}
                  />
                  <div
                    style={{
                      width: "80%",
                      height: 2,
                      background: "rgba(255,255,255,0.25)",
                      borderRadius: 1,
                    }}
                  />
                  <div
                    style={{
                      width: "60%",
                      height: 2,
                      background: "rgba(255,255,255,0.25)",
                      borderRadius: 1,
                    }}
                  />
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={() =>
                  window.open("https://vrekas.id", "_blank")
                }
                className="text-white font-bold active:scale-95 transition-transform tap-highlight-fix whitespace-nowrap"
                style={{
                  fontSize: 11,
                  padding: "7px 12px",
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #F06020, #E8520A)",
                  boxShadow: "0 2px 10px rgba(232,82,10,0.4)",
                }}
              >
                Coba Gratis →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}