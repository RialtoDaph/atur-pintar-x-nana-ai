import Reveal from "./Reveal";

const PAIN_POINTS = [
  { emoji: "😮‍💨", text: "Tiap awal bulan niat nabung.\nTiap akhir bulan bingung duitnya ke mana." },
  { emoji: "📱", text: "Udah download 5 aplikasi keuangan.\nSemuanya dibuka sekali, terus lupa." },
  { emoji: "😬", text: "Ngerti teorinya sih.\nTapi eksekusinya... nanti deh." }
];

export default function PainPointSection() {
  return (
    <section className="pb-24 px-5 sm:px-12 lg:px-20 relative z-10">
      <div className="max-w-3xl mx-auto">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-10 text-center">Jujur deh...</h2>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {PAIN_POINTS.map((c, i) => (
            <Reveal key={i} delay={i * 80}>
              <div className="card-d rounded-2xl p-6 text-center h-full flex flex-col items-center gap-4">
                <span className="text-4xl">{c.emoji}</span>
                <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">{c.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={200}>
          <p className="text-center text-white/45 text-sm italic max-w-lg mx-auto leading-relaxed">
            "Kamu gak sendiri. Dan kamu gak butuh lebih banyak teori, kamu butuh cara yang bikin kamu mau lakuin."
          </p>
        </Reveal>
      </div>
    </section>
  );
}