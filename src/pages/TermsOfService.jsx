import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); * { font-family: 'Inter', sans-serif; }`}</style>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center px-5 sm:px-12 py-3 bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-2">
          <img src="https://media.base44.com/images/public/69a82e8090f60786b869983c/d2e52bdf2_3.png" alt="Logo" className="w-6 h-6" />
          <span className="font-black text-white text-sm">Atur Pintar</span>
        </div>
        <button onClick={() => window.history.back()} className="ml-auto flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali
        </button>
      </nav>

      <div className="max-w-2xl mx-auto px-5 pt-24 pb-20">
        <p className="text-[#FF6A00] text-xs font-bold uppercase tracking-widest mb-2">Legal</p>
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">Syarat & Ketentuan</h1>
        <p className="text-white/30 text-xs mb-10">Terakhir diperbarui: 1 April 2025</p>

        <div className="space-y-8 text-white/65 text-sm leading-relaxed">

          <section>
            <h2 className="text-white font-bold text-base mb-3">1. Penerimaan Syarat</h2>
            <p>Dengan menggunakan Atur Pintar, kamu menyetujui syarat dan ketentuan ini. Jika kamu tidak setuju, harap tidak menggunakan layanan kami.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">2. Deskripsi Layanan</h2>
            <p>Atur Pintar adalah aplikasi manajemen keuangan pribadi yang membantu kamu mencatat transaksi, membuat anggaran, melacak tujuan tabungan, dan mendapatkan insight dari AI. Layanan tersedia dalam versi Gratis dan Premium.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">3. Akun Pengguna</h2>
            <ul className="list-disc list-inside space-y-1.5 text-white/55">
              <li>Kamu bertanggung jawab menjaga kerahasiaan kata sandi akun kamu</li>
              <li>Satu orang hanya boleh memiliki satu akun aktif</li>
              <li>Atur Pintar berhak menangguhkan akun yang melanggar ketentuan ini</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">4. Langganan dan Pembayaran</h2>
            <p>Fitur Premium tersedia melalui berlangganan bulanan atau tahunan. Pembayaran diproses melalui Midtrans. Atur Pintar tidak menyimpan data kartu kredit kamu.</p>
            <ul className="list-disc list-inside mt-2 space-y-1.5 text-white/55">
              <li>Langganan diperpanjang otomatis kecuali dibatalkan sebelum tanggal jatuh tempo</li>
              <li>Tidak ada pengembalian dana untuk periode langganan yang sudah berjalan</li>
              <li>Harga dapat berubah dengan pemberitahuan minimal 30 hari sebelumnya</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">5. Batasan Penggunaan</h2>
            <p>Kamu dilarang untuk:</p>
            <ul className="list-disc list-inside mt-2 space-y-1.5 text-white/55">
              <li>Menggunakan layanan untuk aktivitas ilegal</li>
              <li>Mencoba mengakses data pengguna lain</li>
              <li>Melakukan reverse engineering atau menyalin aplikasi</li>
              <li>Menggunakan bot atau skrip otomatis tanpa izin tertulis</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">6. Disclaimer Keuangan</h2>
            <p>Atur Pintar, termasuk fitur Nana AI, hanya memberikan informasi dan insight yang bersifat edukatif. Ini bukan merupakan nasihat keuangan profesional. Kami tidak bertanggung jawab atas keputusan keuangan yang kamu ambil berdasarkan data atau saran dari aplikasi ini.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">7. Ketersediaan Layanan</h2>
            <p>Kami berupaya menjaga uptime layanan setinggi mungkin, namun tidak menjamin ketersediaan 100%. Pemeliharaan terjadwal akan diberitahukan sebelumnya.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">8. Perubahan Layanan</h2>
            <p>Atur Pintar berhak mengubah, menambah, atau menghentikan fitur kapan saja. Perubahan signifikan akan dikomunikasikan kepada pengguna aktif.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">9. Hukum yang Berlaku</h2>
            <p>Syarat ini tunduk pada hukum Republik Indonesia. Sengketa diselesaikan melalui musyawarah atau jalur hukum yang berlaku di Indonesia.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">10. Hubungi Kami</h2>
            <p>Pertanyaan terkait syarat & ketentuan: <span className="text-[#FF6A00] font-medium">support@aturpintar.id</span></p>
          </section>
        </div>
      </div>

      <footer className="border-t border-white/5 py-6 px-5 text-center">
        <p className="text-white/20 text-xs">© 2025 Atur Pintar. Kelola uangmu lebih cerdas.</p>
      </footer>
    </div>
  );
}