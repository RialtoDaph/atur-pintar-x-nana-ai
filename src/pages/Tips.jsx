import { useState } from "react";
import { ChevronDown, ChevronUp, BookOpen, Lightbulb, HelpCircle } from "lucide-react";

const TIPS = [
  {
    category: "🚀 Memulai",
    items: [
      {
        q: "Bagaimana cara mencatat transaksi pertama?",
        a: "Tap tombol + oranye di pojok kanan atas halaman Dashboard. Pilih 'Pengeluaran' atau 'Pemasukan', isi jumlah, pilih kategori (contoh: Makanan, Transport), lalu tap Simpan. Coba catat pengeluaran hari ini!",
      },
      {
        q: "Apa itu transaksi berulang (recurring)?",
        a: "Transaksi berulang adalah transaksi yang otomatis dicatat setiap periode — cocok untuk gaji bulanan, cicilan, atau langganan. Aktifkan toggle 'Berulang' saat menambah transaksi, lalu pilih interval (harian/mingguan/bulanan).",
      },
      {
        q: "Bagaimana cara scan struk/kwitansi?",
        a: "Saat menambah transaksi, tap ikon kamera di kanan atas modal. Unggah foto struk, dan Nana AI akan otomatis mengisi jumlah, kategori, dan catatan dari gambar tersebut.",
      },
    ],
  },
  {
    category: "🎯 Tujuan Tabungan",
    items: [
      {
        q: "Cara membuat tujuan tabungan baru?",
        a: "Pergi ke menu 'Tujuan' → tap tombol + oranye → isi nama tujuan (contoh: Dana Darurat), target nominal, pilih ikon & warna, dan opsional set deadline. Setelah dibuat, klik kartu tujuan untuk menyetor dana.",
      },
      {
        q: "Bagaimana cara menyetor dana ke tujuan?",
        a: "Buka halaman detail tujuan (klik kartu tujuan), lalu tap 'Tambah Dana'. Masukkan jumlah yang ingin ditabung. Progres akan langsung diperbarui secara otomatis.",
      },
      {
        q: "Apa arti saran Rp X/bulan di kartu tujuan?",
        a: "Ini adalah estimasi jumlah yang perlu kamu tabung setiap bulan agar tujuan tercapai sebelum deadline. Semakin dekat deadline dan semakin jauh dari target, semakin besar angkanya.",
      },
    ],
  },
  {
    category: "💰 Anggaran",
    items: [
      {
        q: "Cara membuat anggaran bulanan?",
        a: "Pergi ke menu 'Anggaran' → tap + → pilih kategori (contoh: Makanan), isi batas anggaran bulanan (contoh: Rp 1.500.000), dan simpan. Anggaran berlaku untuk bulan yang dipilih.",
      },
      {
        q: "Apa yang terjadi jika anggaran terlampaui?",
        a: "Progress bar akan berubah merah dan kamu akan mendapat Smart Alert di Dashboard. Ini sinyal untuk lebih hati-hati mengontrol pengeluaran di kategori tersebut.",
      },
      {
        q: "Apakah anggaran otomatis dibuat tiap bulan?",
        a: "Tidak, anggaran perlu dibuat manual untuk setiap bulan. Tips: buat anggaran di awal bulan sebagai rencana keuangan bulananmu.",
      },
    ],
  },
  {
    category: "💳 Utang & Kredit",
    items: [
      {
        q: "Cara mencatat utang baru?",
        a: "Pergi ke menu 'Utang' → tap + → isi nama utang (contoh: KPR BCA), total utang, sisa utang saat ini, cicilan per bulan, dan tanggal jatuh tempo. Pilih jenis utang yang sesuai.",
      },
      {
        q: "Bagaimana cara menandai utang sudah lunas?",
        a: "Di halaman Utang, tap ikon centang (✓) di kartu utang yang sudah dibayar. Utang akan dipindahkan ke bagian 'Sudah Lunas' di bawah.",
      },
      {
        q: "Apa itu simulasi pelunasan?",
        a: "Di kartu utang aktif, ada tab 'Simulasi' yang menunjukkan estimasi kapan utang akan lunas berdasarkan cicilan saat ini. Kamu juga bisa melihat dampak jika membayar lebih dari cicilan minimum.",
      },
    ],
  },
  {
    category: "📈 Investasi",
    items: [
      {
        q: "Cara mencatat investasi baru?",
        a: "Pergi ke menu 'Investasi' → tap + → pilih jenis (Saham, Reksa Dana, Crypto, dll), isi nama, modal awal, dan nilai saat ini. Kamu bisa update nilai investasi kapan saja.",
      },
      {
        q: "Bagaimana cara melihat performa portofolio?",
        a: "Di halaman Investasi, kamu bisa melihat total nilai portofolio, total keuntungan/kerugian, dan persentase return. Setiap kartu investasi menampilkan bobot portofolio dan gain/loss individual.",
      },
    ],
  },
  {
    category: "🤖 Nana AI",
    items: [
      {
        q: "Apa yang bisa dilakukan Nana AI?",
        a: "Nana adalah asisten keuangan pribadimu yang bisa: memberikan analisis pengeluaran, saran investasi berdasarkan profil risiko, strategi pelunasan utang, simulasi keuangan, dan menjawab pertanyaan seputar keuangan pribadi.",
      },
      {
        q: "Cara menggunakan Nana AI?",
        a: "Tap ikon chat oranye di pojok kanan bawah layar, atau buka halaman 'Nana' dari menu navigasi. Ketik pertanyaan dengan bebas — Nana memahami bahasa Indonesia sehari-hari.",
      },
      {
        q: "Cara menyesuaikan gaya komunikasi Nana?",
        a: "Buka Pengaturan → scroll ke bagian 'Nana AI Preferences' → pilih tone (Formal/Santai), frekuensi saran, dan jenis saran yang kamu inginkan. Simpan perubahan.",
      },
      {
        q: "Apa itu Profil Risiko Investasi?",
        a: "Profil risiko membantu Nana memberikan saran investasi yang sesuai untukmu. Buka Pengaturan → 'Profil Risiko Investasi' → isi kuesioner singkat. Ada 3 profil: Konservatif, Moderat, dan Agresif.",
      },
    ],
  },
  {
    category: "📊 Analitik",
    items: [
      {
        q: "Apa saja yang bisa dilihat di halaman Analitik?",
        a: "Kalender keuangan (tagihan & tujuan), tren pengeluaran 12 bulan, perbandingan pemasukan vs pengeluaran 6 bulan, breakdown kategori bulan ini, progres anggaran, pencapaian tujuan tabungan, dan ringkasan investasi.",
      },
      {
        q: "Apa itu Financial Calendar?",
        a: "Kalender interaktif yang menampilkan hari-hari dengan transaksi penting, jatuh tempo tagihan (dari Pengingat), dan deadline tujuan tabungan. Tap tanggal untuk melihat detail.",
      },
    ],
  },
  {
    category: "🔔 Pengingat & Alert",
    items: [
      {
        q: "Cara membuat pengingat tagihan?",
        a: "Pergi ke menu 'Pengingat' → tap + → isi nama tagihan (contoh: Listrik PLN), tanggal jatuh tempo tiap bulan, dan nominal. Pengingat akan muncul di Dashboard saat mendekati tanggal jatuh tempo.",
      },
      {
        q: "Apa itu Smart Alert?",
        a: "Smart Alert adalah peringatan otomatis yang muncul di Dashboard berdasarkan pola keuanganmu — seperti pengeluaran kategori yang melonjak, anggaran yang hampir habis, atau peluang tabungan.",
      },
    ],
  },
  {
    category: "⚙️ Pengaturan",
    items: [
      {
        q: "Cara mengaktifkan mode gelap?",
        a: "Buka Pengaturan → tap toggle 'Mode Gelap' di bagian Tampilan. Atau tap ikon matahari/bulan di sidebar (desktop).",
      },
      {
        q: "Cara menyembunyikan widget di Dashboard?",
        a: "Buka Pengaturan → scroll ke 'Widget Dashboard' → matikan toggle untuk widget yang tidak ingin ditampilkan. Perubahan langsung terlihat di Dashboard.",
      },
      {
        q: "Apakah data saya aman?",
        a: "Ya, semua data keuanganmu tersimpan secara aman dan hanya dapat diakses dengan akun kamu. Data tidak dibagikan ke pihak ketiga.",
      },
    ],
  },
];

function TipItem({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen(o => !o)}
      className="w-full text-left border-t border-[#F2F4F7] first:border-0"
    >
      <div className="flex items-start justify-between px-5 py-4 gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <HelpCircle className="w-4 h-4 text-[#FF6A00] flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-[#1A1A1A] leading-snug">{item.q}</p>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-[#8FA4C8] flex-shrink-0 mt-0.5" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#8FA4C8] flex-shrink-0 mt-0.5" />
        )}
      </div>
      {open && (
        <div className="px-5 pb-4 pt-0">
          <div className="bg-[#FFF5EB] border border-[#FF6A00]/20 rounded-xl px-4 py-3 ml-7">
            <p className="text-sm text-[#4A5568] leading-relaxed">{item.a}</p>
          </div>
        </div>
      )}
    </button>
  );
}

export default function Tips() {
  const [searchQ, setSearchQ] = useState("");

  const filtered = TIPS.map(cat => ({
    ...cat,
    items: cat.items.filter(
      item =>
        item.q.toLowerCase().includes(searchQ.toLowerCase()) ||
        item.a.toLowerCase().includes(searchQ.toLowerCase())
    ),
  })).filter(cat => cat.items.length > 0);

  return (
    <div className="min-h-screen bg-[#F2F4F7] pb-10">
      <div className="bg-[#0A0A0A] px-5 pt-10 pb-8">
        <div className="max-w-2xl mx-auto">
          <p className="text-[#8FA4C8] text-sm font-medium">Panduan</p>
          <h1 className="text-white text-2xl font-bold mt-0.5">Tips & Cara Pakai</h1>
          <div className="mt-4">
            <input
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Cari pertanyaan atau topik..."
              className="w-full bg-white/10 text-white placeholder-white/40 rounded-xl px-4 py-3 text-sm border border-white/10 focus:outline-none focus:border-[#FF6A00] transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 mt-6 space-y-4">
        {/* Quick links */}
        {!searchQ && (
          <div className="grid grid-cols-3 gap-3">
            {["🚀 Mulai", "🤖 Nana AI", "📊 Analitik"].map((label, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm text-center">
                <p className="text-sm font-semibold text-[#1A1A1A]">{label}</p>
              </div>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <Lightbulb className="w-10 h-10 text-[#8FA4C8] mx-auto mb-3" />
            <p className="text-[#4A5568] font-semibold">Tidak ada hasil</p>
            <p className="text-[#8FA4C8] text-sm mt-1">Coba kata kunci lain</p>
          </div>
        ) : (
          filtered.map((cat, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 pt-4 pb-2">
                <p className="text-sm font-bold text-[#1A1A1A]">{cat.category}</p>
              </div>
              {cat.items.map((item, j) => (
                <TipItem key={j} item={item} />
              ))}
            </div>
          ))
        )}

        <div className="bg-[#FFF5EB] border border-[#FF6A00]/20 rounded-2xl p-5 flex items-start gap-3">
          <BookOpen className="w-5 h-5 text-[#FF6A00] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[#FF6A00] mb-1">Butuh bantuan lebih?</p>
            <p className="text-sm text-[#4A5568]">Tanya langsung ke Nana AI — asisten keuangan pintarmu yang siap membantu 24/7.</p>
          </div>
        </div>
      </div>
    </div>
  );
}