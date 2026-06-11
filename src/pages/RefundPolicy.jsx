import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function RefundPolicy() {
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
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">Kebijakan Refund</h1>
        <p className="text-white/30 text-xs mb-10">Berlaku sejak: 1 April 2024 · Terakhir diperbarui: 11 Juni 2026</p>

        <div className="space-y-8 text-white/65 text-sm leading-relaxed">

          <section>
            <h2 className="text-white font-bold text-base mb-3">1. Ringkasan</h2>
            <p>Atur Pintar adalah layanan digital langganan (SaaS) yang dikelola oleh <strong className="text-white">PT Rideff Vreka Tech</strong>. Karena layanan langsung aktif setelah pembayaran berhasil, sebagian besar transaksi bersifat <strong className="text-white">final</strong>. Namun, kami tetap menyediakan jalur refund untuk kondisi tertentu sebagaimana diatur di bawah.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">2. Kondisi yang Berhak Refund</h2>
            <p className="mb-2">Permintaan refund akan kami pertimbangkan apabila memenuhi salah satu kondisi berikut:</p>
            <ul className="list-disc list-inside space-y-1.5 text-white/55">
              <li><strong className="text-white/80">Pembayaran ganda (double charge)</strong> akibat kesalahan sistem pada satu invoice yang sama.</li>
              <li><strong className="text-white/80">Pembayaran berhasil tapi akses Premium tidak aktif</strong> dalam 1×24 jam dan tidak dapat diselesaikan oleh tim kami.</li>
              <li><strong className="text-white/80">Kesalahan teknis dari pihak kami</strong> yang menyebabkan fitur Premium tidak dapat digunakan sama sekali selama lebih dari 7 hari berturut-turut.</li>
              <li><strong className="text-white/80">Permintaan dalam 7 hari pertama</strong> setelah pembayaran paket bulanan/tahunan, dengan syarat pengguna belum menggunakan fitur Premium secara aktif.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">3. Kondisi yang Tidak Berhak Refund</h2>
            <ul className="list-disc list-inside space-y-1.5 text-white/55">
              <li>Sudah menggunakan fitur Premium secara aktif (mis. Nana AI Premium, ekspor data, dll).</li>
              <li>Perubahan keputusan pribadi setelah masa 7 hari pertama berlalu.</li>
              <li>Lupa membatalkan langganan sebelum periode perpanjangan otomatis berikutnya.</li>
              <li>Akun yang dinonaktifkan karena pelanggaran Syarat & Ketentuan.</li>
              <li>Sisa periode langganan saat pengguna memilih downgrade ke paket Free.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">4. Cara Mengajukan Refund</h2>
            <p className="mb-2">Kirim permintaan refund melalui email ke <span className="text-[#FF6A00] font-medium">admin@aturpintar.id</span> dengan menyertakan:</p>
            <ul className="list-disc list-inside space-y-1.5 text-white/55">
              <li>Nama lengkap dan email akun Atur Pintar</li>
              <li>Nomor invoice / ID transaksi dari Xendit</li>
              <li>Tanggal pembayaran</li>
              <li>Alasan permintaan refund</li>
              <li>Bukti pembayaran (screenshot/PDF)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">5. Proses & Waktu Refund</h2>
            <ul className="list-disc list-inside space-y-1.5 text-white/55">
              <li><strong className="text-white/80">Review:</strong> 1–3 hari kerja sejak email diterima.</li>
              <li><strong className="text-white/80">Konfirmasi:</strong> Tim CS akan membalas dengan keputusan disetujui/ditolak beserta alasannya.</li>
              <li><strong className="text-white/80">Pencairan:</strong> Jika disetujui, dana dikembalikan ke metode pembayaran asal dalam 7–14 hari kerja melalui Xendit. Waktu kredit ke rekening tergantung bank/penyedia e-wallet.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">6. Biaya Pemrosesan</h2>
            <p>Atur Pintar tidak memotong biaya administrasi dari refund yang disetujui. Namun, biaya transfer/konversi dari pihak bank atau payment gateway (Xendit) di luar kendali kami dapat berlaku.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">7. Setelah Refund Disetujui</h2>
            <p>Setelah refund diproses, akses Premium akan dinonaktifkan dan akun otomatis dikembalikan ke paket <strong className="text-white">Free</strong>. Data transaksi keuangan kamu tetap aman dan tidak dihapus.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">8. Hubungi Kami</h2>
            <p>Pertanyaan terkait refund dapat disampaikan ke:</p>
            <p className="mt-2 text-white/55">Email: <span className="text-[#FF6A00] font-medium">admin@aturpintar.id</span></p>
            <p className="mt-1 text-white/55">Telepon: <span className="text-white/80">+62 878-1104-2612</span></p>
            <p className="mt-1 text-white/55">Jam operasional: <span className="text-white/80">Senin–Jumat, 09:00–18:00 WIB</span></p>
          </section>
        </div>
      </div>

      <footer className="border-t border-white/5 py-6 px-5 text-center">
        <div className="flex items-center justify-center gap-4 mb-2 flex-wrap">
          <Link to="/LandingPage" className="text-white/30 hover:text-white/60 text-xs transition-colors">Beranda</Link>
          <span className="text-white/15 text-xs">·</span>
          <Link to="/PrivacyPolicy" className="text-white/30 hover:text-white/60 text-xs transition-colors">Kebijakan Privasi</Link>
          <span className="text-white/15 text-xs">·</span>
          <Link to="/TermsOfService" className="text-white/30 hover:text-white/60 text-xs transition-colors">Syarat & Ketentuan</Link>
          <span className="text-white/15 text-xs">·</span>
          <Link to="/CancellationPolicy" className="text-white/30 hover:text-white/60 text-xs transition-colors">Pembatalan Langganan</Link>
        </div>
        <p className="text-white/20 text-xs">© 2026 PT Rideff Vreka Tech. Semua hak dilindungi.</p>
        <p className="text-white/15 text-xs mt-1">Atur Pintar adalah produk dari PT Rideff Vreka Tech</p>
      </footer>
    </div>
  );
}