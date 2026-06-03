import { useEffect, useRef } from "react";

// Pakai direct DOM mutation (gak trigger React re-render tiap scroll)
export default function ScrollProgress() {
  const fillRef = useRef(null);
  useEffect(() => {
    let ticking = false;
    const update = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop || document.body.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      const pct = total > 0 ? scrolled / total * 100 : 0;
      if (fillRef.current) fillRef.current.style.height = `${pct}%`;
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div style={{ position: "fixed", right: 4, top: "50%", transform: "translateY(-50%)", zIndex: 9998, height: 160, width: 3, borderRadius: 4, background: "rgba(255,106,0,0.12)", pointerEvents: "none" }}>
      <div ref={fillRef} style={{ width: "100%", height: "0%", background: "#F97316", borderRadius: 4, transition: "height 0.1s" }} />
    </div>
  );
}