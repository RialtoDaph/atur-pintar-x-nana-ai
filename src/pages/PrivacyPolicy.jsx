import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); * { font-family: 'Inter', sans-serif; }`}</style>

      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center px-5 sm:px-12 py-3 bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-2">
          <img src="https://media.base44.com/images/public/69a82e8090f60786b869983c/d2e52bdf2_3.png" alt="Logo" className="w-6 h-6" />
          <span className="font-black text-white text-sm">Atur Pintar</span>
        </div>
        <button onClick={() => window.history.length > 1 ? window.history.back() : null} className="ml-auto flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali
        </button>
      </nav>

      <div className="max-w-2xl mx-auto px-5 pt-24 pb-20">
        <p className="text-[#FF6A00] text-xs font-bold uppercase tracking-widest mb-2">Legal</p>
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">Kebijakan Privasi</h1>
        <p className="text-white/30 text-xs mb-10">Berlaku sejak: 1 April 2024 · Terakhir diperbarui: 9 April 2026</p>

        <div className="space-y-8 text-white/65 text-sm leading-relaxed">

          <section>
            <h2 className="text-white font-bold text-base mb-3">1. Identitas Pengelola</h2>
            <p>Atur Pintar adalah produk yang dikelola oleh <strong className="text-white">PT Rideff Vreka Tech</strong>, perusahaan teknologi yang berdomisili di Indonesia.</p>
            <p className="mt-2">Email: <span className="text-[#FF6A00] font-medium">admin@aturpintar.id</span></p>
            <p className="mt-1 text-white/50 text-xs">Data yang kami kumpulkan meliputi: email, nama, data transaksi keuangan, dan profil pengguna — digunakan semata-mata untuk layanan manajemen keuangan personal. Data disimpan aman dan tidak dijual ke pihak ketiga. Pengguna dapat meminta penghapusan akun dengan mengirim email ke admin@aturpintar.id.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">2. Data yang Kami Kumpulkan</h2>
            <p className="mb-2">Atur Pintar mengumpulkan data berikut berdasarkan persetujuan pengguna, sesuai UU No. 27 Tahun 2022 tentang Perlindungan Data Pribadi:</p>
            <p className="font-semibold text-white/80 mb-1">a. Data yang diberikan langsung:</p>
            <ul className="list-disc list-inside space-y-1.5 text-white/55 mb-3">
              <li>Nama lengkap dan alamat email saat pendaftaran</li>
              <li>Data transaksi keuangan yang dimasukkan secara manual</li>
              <li>Informasi tujuan tabungan, anggaran, utang, dan investasi</li>
              <li>Riwayat percakapan dengan Nana AI</li>
              <li>Informasi pembayaran langganan (diproses melalui Xendit, tidak disimpan di server kami)</li>
            </ul>
            <p className="font-semibold text-white/80 mb-1">b. Data yang dikumpulkan otomatis:</p>
            <ul className="list-disc list-inside space-y-1.5 text-white/55">
              <li>Informasi perangkat (jenis browser, sistem operasi)</li>
              <li>Alamat IP dan lokasi kota (tidak akurat)</li>
              <li>Data penggunaan aplikasi (halaman yang dikunjungi, fitur yang digunakan)</li>
              <li>Cookie sesi untuk menjaga status login</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">3. Tujuan Pengumpulan dan Penggunaan Data</h2>
            <ul className="list-disc list-inside space-y-1.5 text-white/55">
              <li>Menyediakan layanan manajemen keuangan personal</li>
              <li>Menampilkan dashboard, analitik, dan insight keuangan</li>
              <li>Memberikan saran personal dari Nana AI berdasarkan data kamu</li>
              <li>Memproses dan memverifikasi pembayaran langganan</li>
              <li>Mengirim notifikasi layanan dan pengingat yang kamu aktifkan</li>
              <li>Meningkatkan kualitas layanan melalui analitik penggunaan anonim</li>
              <li>Memenuhi kewajiban hukum yang berlaku</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">4. Penyimpanan dan Keamanan Data</h2>
            <p>Data disimpan di server yang dikelola oleh <strong className="text-white">Base44</strong> dengan enkripsi standar industri (TLS/SSL). Data keuangan kamu hanya dapat diakses oleh akun kamu sendiri. Kami menerapkan kebijakan akses minimum dan pemantauan keamanan secara berkala.</p>
            <p className="mt-2">Data disimpan selama akun kamu aktif dan hingga 90 hari setelah penghapusan akun, kecuali diwajibkan oleh hukum untuk disimpan lebih lama.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">5. Layanan Pihak Ketiga</h2>
            <p className="mb-2">Atur Pintar menggunakan layanan pihak ketiga berikut:</p>
            <ul className="list-disc list-inside space-y-2 text-white/55">
              <li><strong className="text-white/80">Xendit (PT Xendit Investasi Indonesia)</strong> — Pemrosesan pembayaran langganan. Data kartu kredit/rekening diproses langsung oleh Xendit dan tidak disimpan di server kami. Kebijakan privasi Xendit berlaku.</li>
              <li><strong className="text-white/80">OpenAI / Anthropic</strong> — Layanan AI untuk fitur Nana AI. Pertanyaan yang kamu ajukan dapat dikirim ke API mereka untuk diproses, tanpa menyertakan data identitas pribadi.</li>
              <li><strong className="text-white/80">Base44</strong> — Infrastruktur aplikasi dan penyimpanan data.</li>
              <li><strong className="text-white/80">Google Analytics (opsional)</strong> — Analitik penggunaan anonim untuk meningkatkan layanan.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">6. Berbagi Data dengan Pihak Lain</h2>
            <p>Kami tidak menjual, menyewakan, atau memperdagangkan data pribadi kamu. Data hanya dibagikan dalam kondisi berikut:</p>
            <ul className="list-disc list-inside mt-2 space-y-1.5 text-white/55">
              <li>Kepada penyedia layanan teknis yang disebutkan di atas, sebatas yang diperlukan</li>
              <li>Bila diwajibkan oleh hukum, perintah pengadilan, atau otoritas yang berwenang di Indonesia</li>
              <li>Dalam rangka merger, akuisisi, atau pengalihan aset bisnis (dengan pemberitahuan sebelumnya)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">7. Hak Kamu sebagai Subjek Data</h2>
            <p className="mb-2">Sesuai ketentuan hukum yang berlaku, kamu berhak untuk:</p>
            <ul className="list-disc list-inside space-y-1.5 text-white/55">
              <li><strong className="text-white/80">Akses:</strong> Meminta informasi tentang data pribadi yang kami simpan tentang kamu</li>
              <li><strong className="text-white/80">Koreksi:</strong> Memperbarui atau mengoreksi data yang tidak akurat melalui halaman Profil</li>
              <li><strong className="text-white/80">Penghapusan:</strong> Meminta penghapusan akun dan seluruh data kamu</li>
              <li><strong className="text-white/80">Portabilitas:</strong> Mengunduh data kamu dalam format yang dapat dibaca mesin</li>
              <li><strong className="text-white/80">Keberatan:</strong> Menolak pemrosesan data untuk tujuan tertentu</li>
            </ul>
            <p className="mt-2">Untuk mengajukan permintaan, hubungi: <span className="text-[#FF6A00]">admin@aturpintar.id</span></p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">8. Kebijakan Cookie</h2>
            <p>Atur Pintar menggunakan cookie sesi yang diperlukan untuk menjaga status login kamu. Kami tidak menggunakan cookie pelacakan iklan pihak ketiga. Kamu dapat menonaktifkan cookie melalui pengaturan browser, namun hal ini dapat memengaruhi fungsionalitas aplikasi.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">9. Transfer Data Internasional</h2>
            <p>Beberapa layanan pihak ketiga yang kami gunakan (seperti OpenAI/Anthropic) mungkin memproses data di luar Indonesia. Kami memastikan transfer data tersebut dilindungi oleh perjanjian pemrosesan data yang memadai.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">10. Perubahan Kebijakan Privasi</h2>
            <p>Kami dapat memperbarui kebijakan ini sesuai perubahan layanan atau peraturan yang berlaku. Perubahan signifikan akan diberitahukan melalui email atau notifikasi dalam aplikasi minimal 14 hari sebelum berlaku. Penggunaan layanan setelah tanggal efektif dianggap sebagai persetujuan terhadap kebijakan baru.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">11. Hubungi Kami</h2>
            <p>Pertanyaan, keluhan, atau permintaan terkait privasi data dapat disampaikan ke:</p>
            <p className="mt-2 text-white/55">Email: <span className="text-[#FF6A00] font-medium">admin@aturpintar.id</span></p>
            <p className="mt-2 text-white/40 text-xs">Kami akan merespons dalam 14 hari kerja.</p>
          </section>
        </div>
      </div>

      <footer className="border-t border-white/5 py-6 px-5 text-center">
        <div className="flex items-center justify-center gap-4 mb-2 flex-wrap">
          <Link to="/LandingPage" className="text-white/30 hover:text-white/60 text-xs transition-colors">Beranda</Link>
          <span className="text-white/15 text-xs">·</span>
          <Link to="/TermsOfService" className="text-white/30 hover:text-white/60 text-xs transition-colors">Syarat & Ketentuan</Link>
          <span className="text-white/15 text-xs">·</span>
          <Link to="/RefundPolicy" className="text-white/30 hover:text-white/60 text-xs transition-colors">Kebijakan Refund</Link>
          <span className="text-white/15 text-xs">·</span>
          <Link to="/CancellationPolicy" className="text-white/30 hover:text-white/60 text-xs transition-colors">Pembatalan Langganan</Link>
        </div>
        <p className="text-white/20 text-xs">© 2026 PT Rideff Vreka Tech. Semua hak dilindungi.</p>
        <p className="text-white/15 text-xs mt-1">Atur Pintar adalah produk dari PT Rideff Vreka Tech</p>
      </footer>
    </div>
  );
}