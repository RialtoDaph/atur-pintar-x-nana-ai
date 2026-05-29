// ─── Persona Config ─────────────────────────────────────────────────────────
export const PERSONAS = {
  explorer: {
    label: "🔥 Si Explorer Duit",
    type: "explorer",
    desc: "Kamu hidup di momen sekarang dan suka mencoba hal-hal baru dengan uangmu. Pengalaman dan kesenangan adalah prioritas, dan itu bukan hal yang salah! Kamu spontan, generous, dan mudah bergaul soal uang.",
    strengths: ["Dermawan dan suka berbagi", "Hidup penuh dan nggak FOMO", "Adaptif dan fleksibel"],
    growth: ["Mulai sisihkan sebelum dihabiskan", "Rencanakan 1 tujuan jangka pendek"],
  },
  pelit: {
    label: "🥶 Si Hemat Ekstrem",
    type: "pelit",
    desc: "Kamu sangat sadar pengeluaran dan selalu mencari cara terbaik untuk menggunakan uang. Kamu jarang boros, tapi kadang terlalu ketat sampai lupa menikmati hidup.",
    strengths: ["Sangat disiplin soal pengeluaran", "Selalu tahu kondisi keuangan", "Sulit dipengaruhi iklan"],
    growth: ["Izinkan diri menikmati sesekali", "Mulai investasi supaya uang bekerja"],
  },
  mager: {
    label: "😴 Si Mager",
    type: "mager",
    desc: "Kamu sudah tahu apa yang harus dilakukan, tapi eksekusinya sering tertunda. Niatmu baik, tapi energi buat mulai sering nggak ada. Tenang — semua orang pernah di posisi ini.",
    strengths: ["Niat yang baik sudah ada", "Cukup stabil, nggak impulsif", "Terbuka untuk berubah"],
    growth: ["Automasi tabungan supaya nggak perlu niat", "Mulai dari yang kecil, 1 langkah dulu"],
  },
  ambisius: {
    label: "🎯 Si Ambisius",
    type: "ambisius",
    desc: "Kamu punya rencana, disiplin, dan visi yang jelas soal keuangan. Kamu tipe yang nabung di awal dan belanja dari sisa. Mayoritas orang belum ada di level ini — kamu di jalur yang benar.",
    strengths: ["Disiplin dan terencana", "Nabung sebelum belanja", "Punya tujuan jangka panjang"],
    growth: ["Jaga konsistensi saat life events", "Diversifikasi instrumen investasi"],
  },
  impulsif: {
    label: "💫 Si Impulsif",
    type: "impulsif",
    desc: "Kamu spontan dan suka kebebasan, tapi kadang keputusan finansial dibuat dalam hitungan detik. Kamu energetik dan berani, tinggal sedikit rem untuk hasil yang lebih optimal.",
    strengths: ["Berani dan decisif", "Nggak overthinking", "Suka mencoba hal baru"],
    growth: ["Terapkan aturan 24 jam sebelum beli", "Pisahkan rekening belanja dan tabungan"],
  },
  balanced: {
    label: "⭐ Si Balanced",
    type: "balanced",
    desc: "Kamu punya keseimbangan yang baik antara menikmati hidup dan merencanakan masa depan. Kamu realistis, konsisten, dan tahu kapan harus berhemat dan kapan bisa santai.",
    strengths: ["Konsisten dan stabil", "Bisa menikmati hidup tanpa rasa bersalah", "Rencana yang realistis"],
    growth: ["Tingkatkan investasi untuk wealth building", "Eksplorasi passive income"],
  },
};

export const QUESTIONS = [
  {
    q: "Gajian masuk. Hal pertama yang kamu lakuin?",
    opts: [
      { key: "A", emoji: "🎉", text: "Transfer ke teman yang minta traktir" },
      { key: "B", emoji: "📱", text: "Langsung cek wishlist yang udah lama disimpen" },
      { key: "C", emoji: "💸", text: "Bayar tagihan dulu baru lihat sisanya" },
      { key: "D", emoji: "🏦", text: "Langsung sisihkan buat tabungan, baru belanja" },
    ],
  },
  {
    q: "Akhir bulan, kondisi dompet kamu biasanya...",
    opts: [
      { key: "A", emoji: "😅", text: '"Kok tinggal segini? Ke mana aja ya?"' },
      { key: "B", emoji: "😤", text: '"Masih ada sih, tapi entah cukup buat apa"' },
      { key: "C", emoji: "😌", text: '"Sesuai rencana, cukup kok"' },
      { key: "D", emoji: "😎", text: '"Masih ada sisa lumayan, udah nabung juga"' },
    ],
  },
  {
    q: "Teman tiba-tiba ajak makan di restoran fancy. Kamu...",
    opts: [
      { key: "A", emoji: "🚀", text: "Gas! YOLO, sekali-sekali" },
      { key: "B", emoji: "🔍", text: "Ikut, tapi pesan yang paling murah di menu" },
      { key: "C", emoji: "📊", text: "Cek dulu budget bulan ini, kalau ada — ayo" },
      { key: "D", emoji: "🙏", text: "Maaf aku skip dulu, lagi ketat nih bulannya" },
    ],
  },
  {
    q: "Kalau ngomongin nabung, kamu lebih sering...",
    opts: [
      { key: "A", emoji: "💭", text: "Niatnya ada, eksekusinya entah" },
      { key: "B", emoji: "🪣", text: "Nabung kalau sisa, jarang sisa" },
      { key: "C", emoji: "📅", text: "Nabung rutin tapi jumlahnya kecil" },
      { key: "D", emoji: "🎯", text: "Nabung di awal sebelum belanja apapun" },
    ],
  },
  {
    q: "Goal finansial kamu 1 tahun ke depan?",
    opts: [
      { key: "A", emoji: "🌊", text: "Gak mikir sejauh itu, jalani aja dulu" },
      { key: "B", emoji: "🛡️", text: "Pengen punya tabungan darurat yang proper" },
      { key: "C", emoji: "📈", text: "Mau mulai investasi tapi bingung dari mana" },
      { key: "D", emoji: "🗺️", text: "Udah ada rencana, tinggal konsisten eksekusinya" },
    ],
  },
];

export const FIRST_GOALS = [
  { key: "dana_darurat", emoji: "🆘", label: "Dana darurat" },
  { key: "liburan", emoji: "✈️", label: "Liburan/travel" },
  { key: "gadget", emoji: "📱", label: "Gadget baru" },
  { key: "kursus", emoji: "🎓", label: "Kursus/skill up" },
  { key: "kost", emoji: "🏠", label: "Biaya kost/rumah" },
  { key: "spesial", emoji: "💍", label: "Sesuatu yang spesial" },
  { key: "custom", emoji: "✏️", label: "Tulis sendiri..." },
];

export const INCOME_RANGES = [
  { key: "under_3jt", label: "Di bawah Rp 3 juta" },
  { key: "3_5jt", label: "Rp 3–5 juta" },
  { key: "5_8jt", label: "Rp 5–8 juta" },
  { key: "8_15jt", label: "Rp 8–15 juta" },
  { key: "above_15jt", label: "Di atas Rp 15 juta" },
  { key: "prefer_not_to_say", label: "Belum mau cerita dulu 🙈" },
];

export function determinePersona(answers) {
  const counts = { A: 0, B: 0, C: 0, D: 0 };
  answers.forEach(a => { if (counts[a] !== undefined) counts[a]++; });
  const sorted = Object.entries(counts).sort((x, y) => y[1] - x[1]);
  const top = sorted[0][0];
  const second = sorted[1][0];
  const topCount = sorted[0][1];
  const secondCount = sorted[1][1];

  // Mix detection
  if (topCount <= 3 && secondCount >= 2) {
    if ((top === "A" && second === "B") || (top === "B" && second === "A")) return "impulsif";
    if ((top === "C" && second === "D") || (top === "D" && second === "C")) return "balanced";
  }

  const map = { A: "explorer", B: "pelit", C: "mager", D: "ambisius" };
  return map[top] || "balanced";
}