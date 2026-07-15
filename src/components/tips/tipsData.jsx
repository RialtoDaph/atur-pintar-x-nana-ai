// Centralized tips & help content. Edit here when adding/updating features.
export const TIPS = [
  {
    category: "🚀 Memulai",
    items: [
      {
        q: "Bagaimana cara mencatat transaksi pertama?",
        a: "Tap tombol + oranye di tengah bawah layar (atau pojok kanan bawah di desktop). Pilih 'Pengeluaran' atau 'Pemasukan', isi jumlah, pilih kategori (contoh: Makanan, Transport), lalu tap Simpan.",
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
      {
        q: "Bagaimana cara import transaksi dari rekening koran?",
        a: "Di halaman Transaksi, tap menu opsi → 'Import PDF/CSV'. Unggah file rekening koran (PDF) atau CSV ekspor dari bank/e-wallet, Nana AI akan otomatis parsing dan mengkategorikan transaksi.",
      },
    ],
  },
  {
    category: "💼 Rekening & Saldo",
    items: [
      {
        q: "Cara menambah rekening baru?",
        a: "Buka menu 'Rekening' → tap + → pilih tipe (Bank, E-Wallet, Cash, Investasi), pilih institusi dari daftar (BCA, GoPay, OVO, dll), isi saldo awal, dan simpan. Kamu bisa punya banyak rekening sekaligus.",
      },
      {
        q: "Apakah saldo rekening otomatis terupdate?",
        a: "Ya. Setiap transaksi yang kamu catat akan otomatis menambah/mengurangi saldo rekening terkait. Pastikan memilih rekening yang benar saat menambah transaksi.",
      },
      {
        q: "Apa itu rekening utama (default)?",
        a: "Rekening utama adalah rekening yang otomatis terpilih saat kamu menambah transaksi baru. Set di halaman Rekening dengan tap ikon bintang pada kartu rekening.",
      },
      {
        q: "Bagaimana cara cek total kekayaan di semua rekening?",
        a: "Di Dashboard, ada kartu carousel 'Saldo Total' yang menampilkan akumulasi saldo dari semua rekening aktif. Geser untuk lihat per rekening.",
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
    category: "🔁 Langganan",
    items: [
      {
        q: "Cara mencatat langganan (Netflix, Spotify, dll)?",
        a: "Di halaman Transaksi → tab 'Langganan' → tap + Tambah. Isi nama, nominal, siklus (Bulanan/Triwulan/Tahunan), dan tanggal jatuh tempo berikutnya. App akan otomatis mengingatkan menjelang tagihan.",
      },
      {
        q: "Apa beda Langganan vs Transaksi Berulang?",
        a: "Langganan adalah tracker untuk biaya berulang yang nominalnya tetap dan ada siklus (Netflix bulanan, hosting tahunan). Transaksi Berulang lebih general untuk pemasukan/pengeluaran apa saja yang otomatis dicatat tiap periode.",
      },
      {
        q: "Bisakah pause atau hapus langganan?",
        a: "Bisa. Swipe kiri pada kartu langganan untuk akses Pause/Delete, atau tap kartu untuk masuk ke detail dan ubah statusnya menjadi 'paused'.",
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
      {
        q: "Apa itu Profil Risiko Investasi?",
        a: "Profil risiko membantu Nana memberikan saran investasi yang sesuai untukmu. Buka Pengaturan → 'Profil Risiko Investasi' → isi kuesioner singkat. Ada 3 profil: Konservatif, Moderat, dan Agresif.",
      },
    ],
  },
  {
    category: "👥 Keuangan Bersama",
    items: [
      {
        q: "Apa itu Shared Wallet (Dompet Bersama)?",
        a: "Fitur untuk mencatat keuangan bersama pasangan, keluarga, atau tim. Buat dompet baru di menu 'Keuangan Bersama', invite anggota via email, dan semua transaksi dicatat bersama secara real-time.",
      },
      {
        q: "Cara invite anggota ke Shared Wallet?",
        a: "Buka dompet bersama → tap ikon orang/anggota → masukkan email anggota yang ingin diundang. Mereka akan dapat link untuk join.",
      },
      {
        q: "Apa itu IOU (I Owe You)?",
        a: "Catatan otomatis hutang teman setelah Split Bill. Buka tab IOU untuk lihat siapa saja yang berhutang ke kamu (dan sebaliknya), dan tandai sudah lunas saat dibayar.",
      },
    ],
  },
  {
    category: "🔔 Pengingat & Alert",
    items: [
      {
        q: "Cara membuat pengingat tagihan?",
        a: "Tap ikon lonceng di header → tab 'Pengingat' → tap + Tambah. Isi nama tagihan, nominal, tanggal jatuh tempo, dan aktifkan toggle berulang jika perlu. App akan notif menjelang jatuh tempo.",
      },
      {
        q: "Apa itu Smart Alert?",
        a: "Smart Alert adalah peringatan otomatis berdasarkan pola keuanganmu — seperti pengeluaran kategori yang melonjak, anggaran yang hampir habis, atau tujuan yang mendekati deadline. Bisa dilihat di ikon lonceng atas.",
      },
      {
        q: "Bisa terima notifikasi email?",
        a: "Ya. Beberapa alert penting seperti tagihan jatuh tempo, ringkasan bulanan, dan reminder langganan dikirim juga via email ke alamat yang terdaftar.",
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
        a: "Tap tab 'Nana AI' di bottom nav (mobile) atau dari sidebar (desktop). Nana punya akses ke data keuanganmu secara real-time untuk memberikan saran yang personal.",
      },
      {
        q: "Cara menyesuaikan gaya komunikasi Nana?",
        a: "Buka Pengaturan → scroll ke 'Nana AI Preferences' → pilih tone (Formal/Santai), frekuensi saran, dan jenis saran yang kamu inginkan.",
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
      {
        q: "Cara ekspor laporan keuangan?",
        a: "Di halaman Analitik, tap menu 'Ekspor Laporan'. Pilih periode dan format (PDF atau Google Sheets). Untuk Google Sheets, kamu perlu authorize akses ke Google Drive sekali saja.",
      },
    ],
  },
  {
    category: "🎮 Gamifikasi",
    items: [
      {
        q: "Apa itu Daily Streak?",
        a: "Streak adalah hitungan hari berturut-turut kamu aktif catat transaksi atau lengkapi Daily Mission. Pertahankan untuk dapat bonus XP. Ada juga 'Streak Freeze' yang auto-protect streak kalau kamu skip 1 hari.",
      },
      {
        q: "Apa itu Daily Mission?",
        a: "Misi harian sederhana seperti 'Catat transaksi', 'Cek anggaran', atau 'Tanya Nana'. Setiap misi selesai dapat XP yang bantu naikin level kamu.",
      },
      {
        q: "Apa itu Boss Battle?",
        a: "Event bulanan komunitas — semua user nyerang Boss bersama dengan habit keuangan baik (catat transaksi, hemat, capai tujuan). Kalau Boss kalah sebelum akhir bulan, semua participant dapat XP & badge.",
      },
      {
        q: "Cara unlock Achievement?",
        a: "Achievement otomatis ke-unlock saat kamu capai milestone tertentu (transaksi pertama, streak 7 hari, level 5, dll). Cek progres di halaman Gamifikasi → tab Achievement.",
      },
    ],
  },
  {
    category: "💎 Premium",
    items: [
      {
        q: "Apa beda Free vs Premium?",
        a: "Saat ini semua fitur Atur Pintar gratis untuk semua pengguna — termasuk Nana AI, analitik lanjutan, ekspor laporan, dan multi-rekening. Tidak perlu berlangganan.",
      },
      {
        q: "Cara berlangganan Premium?",
        a: "Belum perlu. Semua fitur sudah bisa kamu pakai gratis tanpa perlu berlangganan.",
      },
      {
        q: "Kapan langganan Premium berakhir?",
        a: "Saat ini tidak ada masa berlaku — semua fitur gratis untuk semua pengguna.",
      },
    ],
  },
  {
    category: "⚙️ Pengaturan & Akun",
    items: [
      {
        q: "Di mana saya bisa mengakses Pengaturan?",
        a: "Buka halaman Profil, lalu tap ikon roda gigi di pojok kanan atas header. Di sana kamu bisa atur bahasa, mata uang, ekspor data, integrasi, dan tour panduan.",
      },
      {
        q: "Cara mengubah mata uang atau bahasa?",
        a: "Buka Profil → ikon roda gigi → bagian 'Bahasa & Mata Uang'. Tersedia Bahasa Indonesia/English/German dan mata uang IDR/USD/EUR. Fitur ini memerlukan akses admin.",
      },
      {
        q: "Cara ganti password?",
        a: "Buka Profil → Pengaturan → 'Ubah Password'. Masukkan password lama dan password baru. Kalau lupa password, gunakan menu 'Lupa Password' di halaman login.",
      },
      {
        q: "Apakah data saya aman?",
        a: "Ya, semua data keuanganmu tersimpan secara aman dan hanya dapat diakses dengan akun kamu. Data tidak dibagikan ke pihak ketiga.",
      },
      {
        q: "Bisakah aktifkan Dark Mode?",
        a: "Bisa. Buka Pengaturan → toggle 'Dark Mode'. Mode gelap berlaku di semua halaman dan tersimpan di perangkat kamu.",
      },
    ],
  },
];