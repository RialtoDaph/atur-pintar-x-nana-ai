import Reveal from "./Reveal";
import LazyYouTube from "./LazyYouTube";

const VIDEO_URL = "https://www.youtube.com/embed/6KazLzryNbM";

export default function VideoSection() {
  return (
    <section id="video-section" className="pb-24 px-5 sm:px-12 lg:px-20 relative z-10">
      <div className="max-w-md mx-auto text-center">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">Lihat langsung cara kerjanya.</h2>
        </Reveal>
        <Reveal delay={60}>
          <p className="text-white/40 text-sm mb-10">Web app, buka browser, langsung bisa. Tanpa install apapun.</p>
        </Reveal>
        <Reveal delay={120}>
          <div className="mx-auto iphone-frame" style={{ width: 280 }}>
            <div className="iphone-notch" />
            <div className="overflow-hidden rounded-[30px] bg-black" style={{ aspectRatio: "9/16" }}>
              <LazyYouTube src={VIDEO_URL} />
            </div>
          </div>
          <p className="text-white/25 text-xs mt-5">iOS & Android segera hadir.</p>
        </Reveal>
      </div>
    </section>
  );
}