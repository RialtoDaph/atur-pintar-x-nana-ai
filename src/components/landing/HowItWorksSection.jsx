import Reveal from "./Reveal";

const STEPS = [
  { num: "01", emoji: "📝", title: "Daftar dalam 30 detik", desc: "Sign up gratis pakai email atau Google. Gak perlu kartu kredit, gak perlu input nomor rekening." },
  { num: "02", emoji: "⚡", title: "Catat transaksi 3 detik", desc: "Tap, pilih kategori, simpan. Atau scan struk, biar Nana yang isi otomatis. Tinggal konfirmasi." },
  { num: "03", emoji: "🚀", title: "Naik level, dapet insight", desc: "Tiap hari kamu catat = XP. Streak naik, achievement unlock, Nana kasih insight personal. Konsisten jadi terasa ringan." }
];

export default function HowItWorksSection() {
  return (
    <section className="pb-24 px-5 sm:px-12 lg:px-20 relative z-10">
      <div className="max-w-4xl mx-auto">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-2 text-center">Dari nol ke konsisten, dalam 3 langkah.</h2>
        </Reveal>
        <Reveal delay={60}>
          <p className="text-center text-white/40 text-sm mb-10">Gak ada learning curve. Gak ada setup ribet.</p>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {STEPS.map((s, i) => (
            <Reveal key={i} delay={i * 90}>
              <div className="card-d rounded-2xl p-6 h-full flex flex-col gap-3 relative overflow-hidden">
                <span className="absolute -top-2 -right-1 text-6xl font-black text-white/[0.04] leading-none select-none">{s.num}</span>
                <span className="text-3xl">{s.emoji}</span>
                <p className="text-white font-bold text-sm leading-snug">{s.title}</p>
                <p className="text-white/50 text-xs leading-relaxed">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}