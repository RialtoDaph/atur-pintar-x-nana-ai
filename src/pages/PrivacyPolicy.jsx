import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); * { font-family: 'Inter', sans-serif; }`}</style>

      {/* Nav */}
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
        <p className="text-white/30 text-xs mb-10">Terakhir diperbarui: 1 April 2025</p>

        <div className="space-y-8 text-white/65 text-sm leading-relaxed">

          <section>
            <h2 className="text-white font-bold text-base mb-3">1. Informasi yang Kami Kumpulkan</h2>
            <p>Atur Pintar mengumpulkan informasi yang kamu berikan secara langsung, termasuk:</p>
            <ul className="list-disc list-inside mt-2 space-y-1.5 text-white/55">
              <li>Nama dan alamat email saat registrasi</li>
              <li>Data transaksi keuangan yang kamu masukkan secara manual</li>
              <li>Informasi tujuan tabungan, anggaran, dan utang</li>
              <li>Riwayat percakapan dengan Nana AI</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">2. Bagaimana Kami Menggunakan Informasi</h2>
            <p>Data yang dikumpulkan digunakan untuk:</p>
            <ul className="list-disc list-inside mt-2 space-y-1.5 text-white/55">
              <li>Menampilkan dashboard dan analitik keuangan personal kamu</li>
              <li>Memberikan saran dan insight dari Nana AI</li>
              <li>Meningkatkan kualitas layanan dan fitur aplikasi</li>
              <li>Mengirim notifikasi atau pengingat yang kamu aktifkan</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">3. Keamanan Data</h2>
            <p>Kami menggunakan enkripsi standar industri untuk melindungi data kamu. Data keuangan kamu hanya dapat diakses oleh kamu sendiri dan tidak dibagikan kepada pihak ketiga tanpa persetujuan kamu.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">4. Berbagi Data dengan Pihak Ketiga</h2>
            <p>Kami tidak menjual atau menyewakan data pribadi kamu. Data dapat dibagikan hanya dalam kondisi berikut:</p>
            <ul className="list-disc list-inside mt-2 space-y-1.5 text-white/55">
              <li>Dengan penyedia layanan teknis yang mendukung operasional aplikasi (hosting, AI)</li>
              <li>Bila diwajibkan oleh hukum atau otoritas yang berwenang</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">5. Hak Kamu</h2>
            <p>Kamu berhak untuk:</p>
            <ul className="list-disc list-inside mt-2 space-y-1.5 text-white/55">
              <li>Mengakses dan mengunduh data kamu kapan saja</li>
              <li>Meminta penghapusan akun dan seluruh data kamu</li>
              <li>Memperbarui atau mengoreksi informasi pribadi kamu</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">6. Cookie dan Pelacakan</h2>
            <p>Atur Pintar menggunakan cookie sesi untuk menjaga status login kamu. Kami tidak menggunakan cookie pelacakan iklan pihak ketiga.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">7. Perubahan Kebijakan</h2>
            <p>Kami dapat memperbarui kebijakan privasi ini sewaktu-waktu. Perubahan signifikan akan diberitahukan melalui email atau notifikasi dalam aplikasi.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">8. Hubungi Kami</h2>
            <p>Pertanyaan terkait privasi dapat dikirimkan ke: <span className="text-[#FF6A00] font-medium">support@aturpintar.id</span></p>
          </section>
        </div>
      </div>

      <footer className="border-t border-white/5 py-6 px-5 text-center">
        <p className="text-white/20 text-xs">© 2025 Atur Pintar. Kelola uangmu lebih cerdas.</p>
      </footer>
    </div>
  );
}