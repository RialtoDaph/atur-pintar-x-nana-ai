import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function CancellationPolicy() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); * { font-family: 'Inter', sans-serif; }`}</style>

      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center px-5 sm:px-12 py-3 bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-2">
          <img src="https://media.base44.com/images/public/69a82e8090f60786b869983c/d2e52bdf2_3.png" alt="Logo" className="w-6 h-6" />
          <span className="font-black text-white text-sm">Atur Pintar</span>
        </div>
        <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/LandingPage")} className="ml-auto flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali
        </button>
      </nav>

      <div className="max-w-2xl mx-auto px-5 pt-24 pb-20">
        <p className="text-[#FF6A00] text-xs font-bold uppercase tracking-widest mb-2">Legal</p>
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">Pembatalan Langganan</h1>
        <p className="text-white/30 text-xs mb-10">Berlaku sejak: 1 April 2024 · Terakhir diperbarui: 11 Juni 2026</p>

        <div className="space-y-8 text-white/65 text-sm leading-relaxed">

          <section>
            <h2 className="text-white font-bold text-base mb-3">1. Ringkasan</h2>
            <p>Kamu dapat membatalkan langganan Premium <strong className="text-white">kapan saja</strong> tanpa biaya pembatalan. Setelah dibatalkan, akses Premium tetap aktif sampai akhir periode yang sudah dibayar, lalu otomatis kembali ke paket <strong className="text-white">Free</strong>.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">2. Cara Membatalkan Langganan</h2>
            <p className="mb-3">Saat ini Atur Pintar menggunakan model pembayaran <strong className="text-white">satu kali per periode</strong> (bukan auto-debit otomatis). Untuk berhenti berlangganan:</p>
            <p className="font-semibold text-white/80 mb-2">Opsi A — Cukup tidak memperpanjang:</p>
            <ul className="list-disc list-inside space-y-1.5 text-white/55 mb-4">
              <li>Setelah periode aktif berakhir, akun kamu otomatis turun ke paket Free.</li>
              <li>Tidak ada penagihan otomatis, tidak perlu konfirmasi apa pun.</li>
            </ul>
            <p className="font-semibold text-white/80 mb-2">Opsi B — Hentikan langsung dari akun:</p>
            <ul className="list-disc list-inside space-y-1.5 text-white/55">
              <li>Buka halaman <strong className="text-white/80">Profil &amp; Pengaturan</strong> di aplikasi.</li>
              <li>Pilih bagian <strong className="text-white/80">Langganan</strong>.</li>
              <li>Klik <strong className="text-white/80">Batalkan Langganan</strong> dan ikuti konfirmasi yang muncul.</li>
            </ul>
            <p className="mt-3">Bila kamu tidak menemukan opsinya atau butuh bantuan, kirim email ke <span className="text-[#FF6A00] font-medium">admin@aturpintar.id</span> dengan subjek <em>"Batalkan Langganan"</em>.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">3. Apa yang Terjadi Setelah Membatalkan</h2>
            <ul className="list-disc list-inside space-y-1.5 text-white/55">
              <li><strong className="text-white/80">Akses Premium tetap aktif</strong> sampai tanggal akhir periode yang sudah dibayar.</li>
              <li>Setelah periode berakhir, akun otomatis turun ke paket <strong className="text-white/80">Free</strong> tanpa kehilangan data transaksi.</li>
              <li>Fitur Premium (Nana AI tanpa batas, ekspor data, analitik lanjutan, dll) akan dinonaktifkan.</li>
              <li>Riwayat transaksi, tujuan tabungan, anggaran, dan utang <strong className="text-white">tetap tersimpan</strong> dan dapat diakses di paket Free dengan batas yang berlaku.</li>
              <li>Kamu bisa berlangganan kembali kapan saja tanpa kehilangan data.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">4. Batas Penggunaan di Paket Free</h2>
            <p className="mb-2">Setelah turun ke Free, kamu masih bisa menggunakan fitur dasar Atur Pintar dengan batasan berikut:</p>
            <ul className="list-disc list-inside space-y-1.5 text-white/55">
              <li>Pencatatan transaksi tanpa batas jumlah.</li>
              <li>Maksimal 3 tujuan tabungan aktif.</li>
              <li>Maksimal 5 anggaran kategori aktif.</li>
              <li>Nana AI dengan batas penggunaan harian.</li>
              <li>Ekspor data &amp; analitik lanjutan tidak tersedia.</li>
            </ul>
            <p className="mt-2 text-white/40 text-xs">Batas paket Free dapat berubah sewaktu-waktu dan akan diumumkan melalui aplikasi sebelum berlaku.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">5. Refund Sisa Periode</h2>
            <p>Pembatalan langganan di tengah periode <strong className="text-white">tidak otomatis mengembalikan</strong> sisa biaya yang sudah dibayar. Akses Premium kamu berjalan sampai akhir periode aktif. Untuk kondisi yang dapat di-refund, lihat halaman <Link to="/RefundPolicy" className="text-[#FF6A00] hover:underline">Kebijakan Refund</Link>.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">6. Penghapusan Akun</h2>
            <p>Pembatalan langganan <strong className="text-white">tidak sama</strong> dengan penghapusan akun. Akun kamu tetap aktif di paket Free. Jika kamu ingin menghapus akun sepenuhnya beserta seluruh data, silakan ikuti langkah di halaman <strong className="text-white">Profil &amp; Pengaturan → Hapus Akun</strong>, atau kirim email permintaan ke <span className="text-[#FF6A00] font-medium">admin@aturpintar.id</span>.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">7. Hubungi Kami</h2>
            <p>Pertanyaan atau bantuan terkait pembatalan langganan:</p>
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
          <Link to="/RefundPolicy" className="text-white/30 hover:text-white/60 text-xs transition-colors">Kebijakan Refund</Link>
        </div>
        <p className="text-white/20 text-xs">© 2026 PT Rideff Vreka Tech. Semua hak dilindungi.</p>
        <p className="text-white/15 text-xs mt-1">Atur Pintar adalah produk dari PT Rideff Vreka Tech</p>
      </footer>
    </div>
  );
}