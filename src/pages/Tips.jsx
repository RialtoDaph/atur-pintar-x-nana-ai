import { useState } from "react";
import { ChevronDown, ChevronUp, BookOpen, Lightbulb, HelpCircle, MessageCircle } from "lucide-react";
import { useAppSettings } from "@/components/utils/useAppSettings";
import { Link } from "react-router-dom";

const TIPS = [
  {
    category: "🚀 Memulai",
    items: [
      {
        q: "Bagaimana cara mencatat transaksi pertama?",
        a: "Tap tombol + oranye di pojok kanan atas halaman Dashboard. Pilih 'Pengeluaran' atau 'Pemasukan', isi jumlah, pilih kategori (contoh: Makanan, Transport), lalu tap Simpan.",
      },
      {
        q: "Apa itu transaksi berulang (recurring)?",
        a: "Transaksi berulang adalah transaksi yang otomatis dicatat setiap periode — cocok untuk gaji bulanan, cicilan, atau langganan. Aktifkan toggle 'Berulang' saat menambah transaksi, lalu pilih interval (harian/mingguan/bulanan/tahunan).",
      },
      {
        q: "Bagaimana cara scan struk/kwitansi?",
        a: "Saat menambah transaksi, tap ikon Kamera atau Galeri di atas form. Unggah foto struk, dan Nana AI akan otomatis mengisi jumlah, merchant, tanggal, dan kategori dari gambar tersebut.",
      },
      {
        q: "Apa itu Split Bill?",
        a: "Setelah scan struk, tap tombol 'Split Bill dengan Teman'. Tambahkan nama teman, pilih mode bagi rata atau per item, dan app akan otomatis menghitung bagian masing-masing. Data hutang teman tersimpan di fitur IOU.",
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
        q: "Apakah anggaran bisa di-carry over ke bulan berikutnya?",
        a: "Ya! Di halaman Anggaran ada opsi untuk menyalin anggaran bulan ini ke bulan berikutnya agar kamu tidak perlu mengatur ulang setiap bulan.",
      },
    ],
  },
  {
    category: "💳 Utang & Kredit",
    items: [
      {
        q: "Cara mencatat utang baru?",
        a: "Pergi ke menu 'Utang' → tap + → isi nama utang (contoh: KPR BCA), total utang, sisa utang saat ini, cicilan per bulan, bunga tahunan, dan tanggal jatuh tempo. Pilih jenis utang yang sesuai.",
      },
      {
        q: "Bagaimana cara mencatat pembayaran cicilan?",
        a: "Di kartu utang aktif, tap ikon centang (✓) untuk mencatat pembayaran cicilan bulan ini. Sisa utang akan otomatis berkurang dan transaksi pengeluaran akan dicatat.",
      },
      {
        q: "Apa itu simulasi pelunasan?",
        a: "Di halaman detail utang, ada tab 'Simulasi' yang menunjukkan estimasi kapan utang akan lunas berdasarkan cicilan saat ini, termasuk total bunga yang akan dibayar.",
      },
    ],
  },
  {
    category: "📱 Langganan",
    items: [
      {
        q: "Cara mencatat langganan (Netflix, Spotify, dll)?",
        a: "Di Dashboard, scroll ke kartu 'Langganan' lalu tap + untuk menambah. Isi nama layanan, nominal tagihan, siklus (bulanan/triwulanan/tahunan), dan tanggal jatuh tempo berikutnya.",
      },
      {
        q: "Bagaimana cara tandai langganan sudah dibayar?",
        a: "Di kartu Langganan Dashboard, tap ikon centang (✓) di samping nama langganan. Tanggal jatuh tempo otomatis maju ke bulan/siklus berikutnya dan transaksi pengeluaran tercatat.",
      },
    ],
  },
  {
    category: "📈 Investasi",
    items: [
      {
        q: "Cara mencatat investasi baru?",
        a: "Pergi ke menu 'Investasi' → tap + → pilih jenis (Saham, Reksa Dana, Crypto, Emas, dll), isi nama, modal awal, dan nilai saat ini. Kamu bisa update nilai investasi kapan saja untuk memantau return.",
      },
      {
        q: "Bagaimana cara melihat performa portofolio?",
        a: "Di halaman Investasi, kamu bisa melihat total nilai portofolio, total keuntungan/kerugian, dan persentase return. Setiap kartu investasi menampilkan bobot portofolio dan gain/loss individual.",
      },
      {
        q: "Apa itu Watchlist Investasi?",
        a: "Fitur untuk memantau aset yang belum kamu beli. Masukkan nama aset, harga target, dan catatan. Berguna untuk perencanaan investasi ke depan.",
      },
    ],
  },
  {
    category: "🤖 Nana AI",
    items: [
      {
        q: "Apa yang bisa dilakukan Nana AI?",
        a: "Nana adalah asisten keuangan pribadimu yang bisa: menganalisis pengeluaran, memberi saran investasi berdasarkan profil risiko, strategi pelunasan utang, simulasi keuangan, dan menjawab pertanyaan seputar keuangan pribadi — dalam bahasa Indonesia sehari-hari.",
      },
      {
        q: "Cara menggunakan Nana AI?",
        a: "Tap tombol chat Nana di pojok kanan bawah layar (tersedia di semua halaman). Nana juga memiliki akses ke data keuanganmu secara real-time untuk memberikan saran yang personal.",
      },
      {
        q: "Cara menyesuaikan gaya komunikasi Nana?",
        a: "Buka Pengaturan → scroll ke 'Nana AI Preferences' → pilih tone (Formal/Santai), frekuensi saran, dan jenis saran yang kamu inginkan.",
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
        a: "Kalender keuangan, tren pengeluaran 12 bulan, perbandingan pemasukan vs pengeluaran, breakdown kategori, progres anggaran, Net Worth, Cash Flow Forecast, dan ringkasan investasi. Kartu analitik bisa dikustomisasi urutan dan visibilitasnya.",
      },
      {
        q: "Apa itu Financial Calendar?",
        a: "Kalender interaktif yang menampilkan hari-hari dengan transaksi, jatuh tempo tagihan (dari Pengingat), dan deadline tujuan tabungan. Tap tanggal untuk melihat detail keuangan hari itu.",
      },
      {
        q: "Apa itu Proyeksi Cash Flow?",
        a: "Di Dashboard dan Analitik, ada kartu 'Proyeksi Cash Flow' yang memperkirakan saldo akhir bulan berdasarkan rata-rata 3 bulan terakhir ditambah transaksi recurring yang terjadwal.",
      },
    ],
  },
  {
    category: "🔔 Pengingat & Alert",
    items: [
      {
        q: "Cara membuat pengingat tagihan?",
        a: "Pergi ke menu 'Pengingat' → tap + → isi nama tagihan (contoh: Listrik PLN), tanggal jatuh tempo tiap bulan, jenis pengingat, dan nominal. Pengingat akan muncul otomatis di Dashboard saat mendekati tanggal jatuh tempo.",
      },
      {
        q: "Apa itu Smart Alert?",
        a: "Smart Alert adalah peringatan otomatis berdasarkan pola keuanganmu — seperti pengeluaran kategori yang melonjak, anggaran yang hampir habis, tujuan yang mendekati deadline, atau peluang tabungan. Bisa dilihat di ikon lonceng atas.",
      },
    ],
  },
  {
    category: "⚙️ Pengaturan",
    items: [
      {
        q: "Cara mengaktifkan mode gelap?",
        a: "Buka Pengaturan → tap toggle 'Mode Gelap' di bagian Tampilan. Perubahan langsung berlaku di seluruh aplikasi.",
      },
      {
        q: "Cara menyembunyikan widget di Dashboard?",
        a: "Buka Pengaturan → scroll ke 'Widget Dashboard' → matikan toggle untuk widget yang tidak ingin ditampilkan. Perubahan langsung terlihat di Dashboard.",
      },
      {
        q: "Cara mengubah mata uang atau bahasa?",
        a: "Buka Pengaturan → bagian 'Bahasa & Mata Uang'. Tersedia Bahasa Indonesia/English/German dan mata uang IDR/USD/EUR. Fitur ini memerlukan akses admin.",
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
  const { t } = useAppSettings();
  const [searchQ, setSearchQ] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);

  const filtered = TIPS
    .map(cat => ({
      ...cat,
      items: cat.items.filter(
        item =>
          item.q.toLowerCase().includes(searchQ.toLowerCase()) ||
          item.a.toLowerCase().includes(searchQ.toLowerCase())
      ),
    }))
    .filter(cat => cat.items.length > 0)
    .filter(cat => !activeCategory || cat.category === activeCategory);

  return (
    <div data-tour="tips-page-hint" className="min-h-screen bg-[#F2F4F7] pb-10">
      {/* Header */}
      <div className="bg-[#0A0A0A] px-5 pt-6 pb-14">
        <div className="max-w-2xl mx-auto">
          <p className="text-[#8FA4C8] text-xs font-medium">Panduan Penggunaan</p>
          <h1 className="text-white text-2xl font-bold mt-0.5">Tips & Bantuan</h1>
          <p className="text-[#8FA4C8] text-sm mt-1">Pelajari cara memaksimalkan Atur Pintar</p>
          <div className="mt-4">
            <input
              value={searchQ}
              onChange={e => { setSearchQ(e.target.value); setActiveCategory(null); }}
              placeholder="Cari tips atau pertanyaan..."
              className="w-full bg-white/10 text-white placeholder-white/40 rounded-xl px-4 py-3 text-sm border border-white/10 focus:outline-none focus:border-[#FF6A00] transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-6 space-y-4">
        {/* Category quick-filter pills */}
        {!searchQ && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveCategory(null)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${!activeCategory ? "bg-[#FF6A00] text-white" : "bg-white text-[#8FA4C8] shadow-sm"}`}
            >
              Semua
            </button>
            {TIPS.map((cat, i) => (
              <button
                key={i}
                onClick={() => setActiveCategory(cat.category === activeCategory ? null : cat.category)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${activeCategory === cat.category ? "bg-[#FF6A00] text-white" : "bg-white text-[#8FA4C8] shadow-sm"}`}
              >
                {cat.category}
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <Lightbulb className="w-10 h-10 text-[#8FA4C8] mx-auto mb-3" />
            <p className="text-[#4A5568] font-semibold">Tidak ada hasil ditemukan</p>
            <p className="text-[#8FA4C8] text-sm mt-1">Coba kata kunci lain atau tanya Nana AI</p>
          </div>
        ) : (
          filtered.map((cat, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                <p className="text-sm font-bold text-[#1A1A1A]">{cat.category}</p>
                <span className="text-[10px] text-[#8FA4C8] bg-[#F2F4F7] px-2 py-0.5 rounded-full">{cat.items.length} tips</span>
              </div>
              {cat.items.map((item, j) => (
                <TipItem key={j} item={item} />
              ))}
            </div>
          ))
        )}

        {/* Nana CTA */}
        <div className="bg-[#0A0A0A] rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a82e8090f60786b869983c/7708b64f5_generated_image.png"
              alt="Nana AI"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm">Masih ada pertanyaan?</p>
            <p className="text-[#8FA4C8] text-xs mt-0.5">Tanya Nana AI — asisten keuangan pribadimu</p>
          </div>
          <Link
            to="/Nana"
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-[#FF6A00] rounded-xl text-white text-xs font-bold hover:bg-[#e05e00] transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Chat
          </Link>
        </div>

        <div className="bg-[#FFF5EB] border border-[#FF6A00]/20 rounded-2xl p-5 flex items-start gap-3">
          <BookOpen className="w-5 h-5 text-[#FF6A00] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[#FF6A00] mb-1">Tips Pro 💡</p>
            <p className="text-sm text-[#4A5568]">Catat transaksi sesegera mungkin setelah berbelanja agar tidak lupa. Gunakan fitur scan struk untuk cara tercepat mencatat pengeluaran!</p>
          </div>
        </div>
      </div>
    </div>
  );
}