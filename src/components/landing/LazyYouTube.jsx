import { useEffect, useRef, useState } from "react";

export default function LazyYouTube({ src }) {
  const ref = useRef(null);
  const [load, setLoad] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setLoad(true); obs.disconnect(); }
    }, { rootMargin: "200px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className="w-full h-full">
      {load ? (
        <iframe
          src={src}
          className="w-full h-full px-5"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Demo Atur Pintar" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-black">
          <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-[#F97316] animate-spin" />
        </div>
      )}
    </div>
  );
}