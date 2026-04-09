import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); * { font-family: 'Inter', sans-serif; }`}</style>

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
        <p className="text-white/30 text-xs mb-10">Berlaku sejak: 1 April 2024 · Terakhir diperbarui: 9 April 2026</p>

        <div className="space-y-8 text-white/65 text-sm leading-relaxed">

          <section>
            <h2 className="text-white font-bold text-base mb-3">1. Definisi dan Penerimaan</h2>
            <p className="mb-2"><strong className="text-white">Atur Pintar x Nana AI</strong> adalah layanan aplikasi manajemen keuangan pribadi berbasis kecerdasan buatan ("Layanan"), yang dikelola oleh <strong className="text-white">[Nama Pengelola — Placeholder]</strong> ("Pengelola", "Kami").</p>
            <p>Dengan mendaftar atau menggunakan Layanan, kamu ("Pengguna") menyatakan telah membaca, memahami, dan menyetujui Syarat & Ketentuan ini serta <Link to="/PrivacyPolicy" className="text-[#FF6A00] hover:underline">Kebijakan Privasi</Link> kami. Jika tidak setuju, harap tidak menggunakan Layanan.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">2. Deskripsi Layanan</h2>
            <p>Atur Pintar menyediakan:</p>
            <ul className="list-disc list-inside mt-2 space-y-1.5 text-white/55">
              <li>Pencatatan dan kategorisasi transaksi keuangan personal</li>
              <li>Dashboard dan analitik keuangan visual</li>
              <li>Manajemen anggaran, tujuan tabungan, dan utang</li>
              <li>Asisten keuangan AI "Nana AI" yang memberikan insight personal</li>
              <li>Fitur investasi dan pelacakan portofolio</li>
              <li>Export data ke PDF dan Google Sheets</li>
            </ul>
            <p className="mt-2">Layanan tersedia dalam versi <strong className="text-white">Gratis</strong> dengan fitur terbatas dan <strong className="text-white">Premium</strong> dengan akses penuh.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">3. Ketentuan Akun</h2>
            <ul className="list-disc list-inside space-y-1.5 text-white/55">
              <li>Pengguna harus berusia minimal 17 tahun atau mendapat izin dari orang tua/wali</li>
              <li>Satu orang hanya diperbolehkan memiliki satu akun aktif</li>
              <li>Kamu bertanggung jawab penuh atas keamanan dan kerahasiaan kata sandi akun</li>
              <li>Dilarang berbagi akun dengan orang lain</li>
              <li>Informasi yang diberikan saat pendaftaran harus akurat dan terkini</li>
              <li>Pengelola berhak menangguhkan atau menghapus akun yang melanggar ketentuan</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">4. Ketentuan Berlangganan Premium</h2>
            <p className="mb-2 font-semibold text-white/80">4.1 Harga dan Paket</p>
            <p className="mb-3 text-white/55">Harga langganan Premium ditampilkan secara transparan di halaman Berlangganan dan dapat berubah dengan pemberitahuan minimal 30 hari sebelumnya melalui email atau notifikasi aplikasi.</p>
            
            <p className="mb-2 font-semibold text-white/80">4.2 Pembayaran</p>
            <ul className="list-disc list-inside space-y-1.5 text-white/55 mb-3">
              <li>Pembayaran diproses melalui <strong className="text-white/80">Midtrans</strong> (PT Midtrans, anak perusahaan GoTo Financial)</li>
              <li>Atur Pintar tidak menyimpan data kartu kredit atau rekening bank kamu</li>
              <li>Semua transaksi dalam mata uang Rupiah Indonesia (IDR)</li>
              <li>Bukti pembayaran akan dikirimkan melalui email setelah transaksi berhasil</li>
            </ul>

            <p className="mb-2 font-semibold text-white/80">4.3 Aktivasi Layanan</p>
            <p className="mb-3 text-white/55">Akses Premium aktif segera setelah pembayaran dikonfirmasi oleh sistem Midtrans. Periode berlangganan dihitung mulai tanggal konfirmasi pembayaran.</p>

            <p className="mb-2 font-semibold text-white/80">4.4 Perpanjangan</p>
            <p className="mb-3 text-white/55">Saat ini berlangganan bersifat satu kali bayar (tidak auto-renewal). Kamu perlu melakukan pembayaran baru untuk memperpanjang akses Premium.</p>

            <p className="mb-2 font-semibold text-white/80">4.5 Kebijakan Pengembalian Dana (Refund)</p>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-1">
              <p className="text-white/70 font-medium mb-1">⚠️ Tidak Ada Pengembalian Dana</p>
              <p className="text-white/50 text-xs">Sesuai sifat layanan digital, pembayaran yang telah dikonfirmasi tidak dapat dikembalikan. Dengan melakukan pembayaran, kamu menyetujui kebijakan ini. Pengecualian hanya berlaku jika layanan mengalami gangguan total selama lebih dari 7 hari berturut-turut.</p>
            </div>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">5. Larangan Penggunaan</h2>
            <p>Pengguna dilarang keras untuk:</p>
            <ul className="list-disc list-inside mt-2 space-y-1.5 text-white/55">
              <li>Menggunakan Layanan untuk aktivitas ilegal, penipuan, atau pencucian uang</li>
              <li>Mencoba mengakses data, akun, atau sistem milik pengguna lain</li>
              <li>Melakukan reverse engineering, dekompilasi, atau menyalin kode aplikasi</li>
              <li>Menggunakan bot, scraper, atau skrip otomatis tanpa izin tertulis</li>
              <li>Menyebarkan informasi palsu atau menyesatkan tentang Layanan</li>
              <li>Berbagi akun Premium dengan orang lain selain pemegang akun</li>
              <li>Mencoba melewati batasan fitur berlangganan secara tidak sah</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">6. Disclaimer Keuangan</h2>
            <div className="bg-[#FF6A00]/8 border border-[#FF6A00]/20 rounded-xl p-4">
              <p className="text-white/75 leading-relaxed">Atur Pintar, termasuk fitur <strong className="text-white">Nana AI</strong>, adalah alat bantu manajemen keuangan yang bersifat <strong className="text-white">informatif dan edukatif semata</strong>. Layanan ini:</p>
              <ul className="list-disc list-inside mt-2 space-y-1.5 text-white/55 text-xs">
                <li>Bukan merupakan nasihat investasi, keuangan, hukum, atau pajak yang berlisensi</li>
                <li>Tidak menggantikan konsultasi dengan perencana keuangan profesional bersertifikat (CFP)</li>
                <li>Tidak menjamin hasil atau imbal hasil dari keputusan keuangan yang kamu buat</li>
              </ul>
              <p className="mt-2 text-white/45 text-xs">Pengelola tidak bertanggung jawab atas kerugian finansial akibat keputusan berdasarkan informasi dari aplikasi ini.</p>
            </div>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">7. Ketersediaan Layanan</h2>
            <p>Kami berupaya menyediakan layanan dengan uptime setinggi mungkin (target 99,5%). Namun kami tidak menjamin ketersediaan tanpa gangguan. Pemeliharaan terjadwal akan diberitahukan minimal 24 jam sebelumnya melalui notifikasi aplikasi atau media sosial resmi.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">8. Kekayaan Intelektual</h2>
            <p>Seluruh konten, desain, logo, merek, dan kode sumber Atur Pintar adalah milik Pengelola dan dilindungi oleh hukum kekayaan intelektual Indonesia. Pengguna tidak diberikan hak atas kekayaan intelektual tersebut kecuali hak penggunaan terbatas untuk keperluan pribadi.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">9. Perubahan Syarat Layanan</h2>
            <p>Pengelola berhak mengubah Syarat & Ketentuan ini kapan saja. Perubahan material akan diberitahukan melalui email atau notifikasi dalam aplikasi minimal 14 hari sebelum berlaku. Penggunaan Layanan setelah tanggal efektif dianggap sebagai penerimaan terhadap perubahan.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">10. Penghentian Layanan</h2>
            <p>Kamu dapat menghentikan penggunaan layanan kapan saja dengan menghapus akun melalui halaman Profil. Pengelola berhak menghentikan atau menangguhkan akun yang melanggar Syarat & Ketentuan ini tanpa pemberitahuan sebelumnya.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">11. Hukum yang Berlaku dan Penyelesaian Sengketa</h2>
            <p>Syarat & Ketentuan ini tunduk pada <strong className="text-white">Hukum Republik Indonesia</strong>, termasuk namun tidak terbatas pada UU ITE No. 11/2008 jo. No. 19/2016, PP No. 71/2019 tentang Penyelenggaraan Sistem dan Transaksi Elektronik, dan UU No. 8/1999 tentang Perlindungan Konsumen.</p>
            <p className="mt-2">Sengketa diselesaikan melalui:</p>
            <ol className="list-decimal list-inside mt-1 space-y-1.5 text-white/55">
              <li>Musyawarah mufakat dalam 30 hari sejak sengketa dilaporkan</li>
              <li>Mediasi melalui Badan Penyelesaian Sengketa Konsumen (BPSK) setempat</li>
              <li>Jalur hukum melalui Pengadilan Negeri yang berwenang di Indonesia</li>
            </ol>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">12. Hubungi Kami</h2>
            <p>Pertanyaan, keluhan, atau pengaduan terkait Layanan:</p>
            <p className="mt-2 text-white/55">Email: <span className="text-[#FF6A00] font-medium">support@aturpintar.id</span></p>
            <p className="text-white/55">Alamat: [Alamat Kantor — Placeholder], Indonesia</p>
            <p className="mt-2 text-white/40 text-xs">Kami akan merespons dalam 3 hari kerja.</p>
          </section>
        </div>
      </div>

      <footer className="border-t border-white/5 py-6 px-5 text-center">
        <div className="flex items-center justify-center gap-4 mb-2">
          <Link to="/LandingPage" className="text-white/30 hover:text-white/60 text-xs transition-colors">Beranda</Link>
          <span className="text-white/15 text-xs">·</span>
          <Link to="/PrivacyPolicy" className="text-white/30 hover:text-white/60 text-xs transition-colors">Kebijakan Privasi</Link>
        </div>
        <p className="text-white/20 text-xs">© 2026 Atur Pintar. Kelola uangmu lebih cerdas.</p>
      </footer>
    </div>
  );
}