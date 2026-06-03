import Reveal from "./Reveal";

// ⚠️ TODO: Isi dengan testimoni REAL dari beta tester. Section auto-hidden kalau array kosong.
// Format: { name, role, avatar?, quote, highlight? }
const TESTIMONIALS = [
  // {
  //   name: "Devina",
  //   role: "Content Creator, Jakarta",
  //   quote: "Akhirnya ada apps yg gak bikin gue ngerasa goblok soal duit. Nana baik bgt.",
  //   highlight: "gak bikin gue ngerasa goblok"
  // },
];

export default function TestimonialSection() {
  // Auto-hide kalau belum ada testimoni — gak akan muncul section kosong yang awkward
  if (TESTIMONIALS.length === 0) return null;

  return (
    <section className="pb-24 px-5 sm:px-12 lg:px-20 relative z-10">
      <div className="max-w-4xl mx-auto">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-2 text-center">Yang udah nyobain bilang gini.</h2>
        </Reveal>
        <Reveal delay={60}>
          <p className="text-center text-white/40 text-sm mb-10">Cerita asli dari pengguna pertama Atur Pintar.</p>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={i} delay={i * 70}>
              <div className="card-d rounded-2xl p-6 h-full flex flex-col gap-4">
                <p className="text-white/80 text-sm leading-relaxed italic">"{t.quote}"</p>
                <div className="flex items-center gap-3 mt-auto pt-3 border-t border-white/8">
                  {t.avatar ? (
                    <img src={t.avatar} alt={`Foto ${t.name}`} className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#F97316] flex items-center justify-center text-white text-xs font-black">
                      {t.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-white text-xs font-bold leading-tight">{t.name}</p>
                    <p className="text-white/40 text-[10px] leading-tight">{t.role}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}