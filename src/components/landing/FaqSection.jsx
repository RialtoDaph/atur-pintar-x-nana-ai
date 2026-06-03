import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import Reveal from "./Reveal";

const FAQS = [
  { q: "Apakah Atur Pintar gratis?", a: "Ya, ada versi gratis selamanya. Kamu bisa catat transaksi, pakai Nana AI 5x sehari, dan akses fitur gamifikasi tanpa bayar apapun." },
  { q: "Apakah data keuangan saya aman?", a: "Data kamu dienkripsi dan tidak pernah dijual ke pihak ketiga. Atur Pintar tidak punya akses ke rekening bank kamu — semua diinput manual oleh kamu sendiri." },
  { q: "Bisa dipakai di HP?", a: "Bisa langsung dari browser HP kamu, tidak perlu install apapun. Web app sudah fully responsive dan terasa seperti aplikasi native." },
  { q: "Kapan versi iOS & Android rilis?", a: "Aplikasi mobile untuk App Store dan Play Store sedang dalam tahap finalisasi. Sementara itu, web app sudah siap dipakai dengan semua fitur lengkap." },
  { q: "Gimana cara mulai?", a: "Klik tombol 'Mulai Gratis', daftar pakai email, dan kamu langsung bisa pakai semua fitur dasar tanpa bayar apapun." },
  { q: "Bedanya Free dan Plus?", a: "Free: tracker lengkap, Nana AI 5x per hari, 1 goal. Plus (Rp 49rb per bulan): Nana AI unlimited, analytics advanced, shared wallet unlimited, dan semua fitur premium lainnya." }
];

export default function FaqSection() {
  const [open, setOpen] = useState(null);
  return (
    <section className="pb-24 px-5 sm:px-12 lg:px-20 relative z-10">
      <div className="max-w-2xl mx-auto">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-2 text-center">Pertanyaan yang sering ditanya.</h2>
        </Reveal>
        <Reveal delay={60}>
          <p className="text-center text-white/40 text-sm mb-8">Kalau masih ada yang belum jelas, tanya langsung aja.</p>
        </Reveal>
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <Reveal key={i} delay={i * 50}>
              <div className="card-d rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left gap-4">
                  <span className="text-white font-semibold text-sm">{faq.q}</span>
                  {open === i ? <ChevronUp className="w-4 h-4 text-[#F97316] flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-white/40 flex-shrink-0" />}
                </button>
                {open === i && (
                  <div className="px-5 pb-5">
                    <p className="text-white/60 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}