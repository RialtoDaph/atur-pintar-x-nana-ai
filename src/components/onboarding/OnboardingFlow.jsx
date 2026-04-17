import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import confetti from "canvas-confetti";

// ── Constants ──────────────────────────────────────────────────────────────

const NANA_IMG = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a82e8090f60786b869983c/7708b64f5_generated_image.png";
const LOGO_IMG = "https://media.base44.com/images/public/69a82e8090f60786b869983c/d2e52bdf2_3.png";

const QUIZ_QUESTIONS = [
{
  q: "Gajian masuk. Hal pertama yang kamu lakuin?",
  options: [
  { key: "A", emoji: "🎉", text: "Transfer ke teman yang minta traktir" },
  { key: "B", emoji: "📱", text: "Langsung cek wishlist yang udah lama disimpen" },
  { key: "C", emoji: "💸", text: "Bayar tagihan dulu baru lihat sisanya" },
  { key: "D", emoji: "🏦", text: "Langsung sisihkan buat tabungan, baru belanja" }]

},
{
  q: "Akhir bulan, kondisi dompet kamu biasanya...",
  options: [
  { key: "A", emoji: "😅", text: '"Kok tinggal segini? Ke mana aja ya?"' },
  { key: "B", emoji: "😤", text: '"Masih ada sih, tapi entah cukup buat apa"' },
  { key: "C", emoji: "😌", text: '"Sesuai rencana, cukup kok"' },
  { key: "D", emoji: "😎", text: '"Masih ada sisa lumayan, udah nabung juga"' }]

},
{
  q: "Teman tiba-tiba ajak makan di restoran fancy. Kamu...",
  options: [
  { key: "A", emoji: "🔥", text: "Gas! YOLO, sekali-sekali" },
  { key: "B", emoji: "💭", text: "Ikut, tapi pesan yang paling murah di menu" },
  { key: "C", emoji: "📊", text: "Cek dulu budget bulan ini, kalau ada — ayo" },
  { key: "D", emoji: "🙅", text: "Maaf aku skip dulu, lagi ketat nih bulannya" }]

},
{
  q: "Kalau ngomongin nabung, kamu lebih sering...",
  options: [
  { key: "A", emoji: "💭", text: "Niatnya ada, eksekusinya entah" },
  { key: "B", emoji: "😬", text: "Nabung kalau sisa, jarang sisa" },
  { key: "C", emoji: "🐢", text: "Nabung rutin tapi jumlahnya kecil" },
  { key: "D", emoji: "🚀", text: "Nabung di awal sebelum belanja apapun" }]

},
{
  q: "Goal finansial kamu 1 tahun ke depan?",
  options: [
  { key: "A", emoji: "🤷", text: "Gak mikir sejauh itu, jalani aja dulu" },
  { key: "B", emoji: "🛡️", text: "Pengen punya tabungan darurat yang proper" },
  { key: "C", emoji: "📈", text: "Mau mulai investasi tapi bingung dari mana" },
  { key: "D", emoji: "🎯", text: "Udah ada rencana, tinggal konsisten eksekusinya" }]

}];


const PERSONAS = {
  explorer: {
    label: "🔥 Si Explorer Duit",
    type: "explorer",
    desc: "Kamu hidup untuk momen! Duit ada untuk dinikmati, dan kamu selalu tau cara bikin uang bekerja untuk pengalaman. Tapi kadang, besok sedikit terlupakan.",
    strengths: ["Bisa nikmatin hidup tanpa rasa bersalah", "Spontan & berani ambil kesempatan", "Tahu cara reward diri sendiri"],
    growth: ["Mulai sisihin 10% sebelum belanja", "Coba budget untuk impuls buying"]
  },
  pelit: {
    label: "🥶 Si Hemat Ekstrem",
    type: "pelit",
    desc: "Kamu ahli dalam menahan diri! Menabung adalah prioritas nomor satu. Tapi hati-hati, terlalu pelit juga bisa bikin stres dan kehilangan momen berharga.",
    strengths: ["Disiplin menabung & tidak boros", "Selalu siap untuk situasi darurat", "Bisa hidup dengan kebutuhan minimal"],
    growth: ["Izinkan diri untuk reward sesekali", "Belajar bedain 'hemat' vs 'pelit'"]
  },
  mager: {
    label: "😴 Si Mager",
    type: "mager",
    desc: "Kamu sudah tau apa yang harus dilakukan — tinggal eksekusinya aja! Niat ada, tapi action butuh sedikit dorongan. Nana bakal bantu kamu mulai.",
    strengths: ["Sadar tentang keuangan & mau belajar", "Tidak impulsif, lebih hati-hati", "Punya dasar yang bagus untuk berkembang"],
    growth: ["Mulai dari hal kecil, konsisten dulu", "Set reminder harian untuk catat pengeluaran"]
  },
  ambisius: {
    label: "🎯 Si Ambisius",
    type: "ambisius",
    desc: "Kamu serius soal masa depan finansial! Rencana ada, disiplin ada, tinggal skalain lagi. Kamu tipe yang bakal beneran financial free.",
    strengths: ["Punya rencana keuangan yang jelas", "Disiplin dan konsisten", "Selalu nabung sebelum belanja"],
    growth: ["Jangan lupa nikmatin hidup sekarang juga", "Diversifikasi investasi lebih lanjut"]
  },
  impulsif: {
    label: "💫 Si Impulsif",
    type: "impulsif",
    desc: "Kamu kombinasi menarik — bisa sangat hemat tapi bisa juga tiba-tiba belanja besar. Emosimu sering ikut dalam keputusan finansial.",
    strengths: ["Fleksibel dan adaptif", "Bisa berhemat kalau mau", "Tahu cara enjoy hidup"],
    growth: ["Buat 'cooling off period' 24 jam sebelum beli", "Pisahkan rekening untuk tabungan & pengeluaran"]
  },
  balanced: {
    label: "⭐ Si Balanced",
    type: "balanced",
    desc: "Kamu punya keseimbangan yang bagus antara menikmati hidup dan merencanakan masa depan. Ini fondasi yang solid untuk berkembang lebih jauh.",
    strengths: ["Seimbang antara enjoy & nabung", "Bisa adaptasi dengan situasi berbeda", "Tidak ekstrem di satu sisi"],
    growth: ["Optimalkan strategi investasi", "Buat target finansial yang lebih spesifik"]
  }
};

const GOALS = [
{ key: "dana_darurat", emoji: "🆘", label: "Dana darurat" },
{ key: "liburan", emoji: "✈️", label: "Liburan/travel" },
{ key: "gadget", emoji: "📱", label: "Gadget baru" },
{ key: "kursus", emoji: "🎓", label: "Kursus/skill up" },
{ key: "kost", emoji: "🏠", label: "Biaya kost/rumah" },
{ key: "spesial", emoji: "💍", label: "Sesuatu yang spesial" },
{ key: "custom", emoji: "✏️", label: "Tulis sendiri..." }];


const INCOME_RANGES = [
{ key: "under_3m", label: "Di bawah Rp 3 juta" },
{ key: "3m_5m", label: "Rp 3–5 juta" },
{ key: "5m_8m", label: "Rp 5–8 juta" },
{ key: "8m_15m", label: "Rp 8–15 juta" },
{ key: "above_15m", label: "Di atas Rp 15 juta" },
{ key: "private", label: "Belum mau cerita dulu 🙈" }];


// ── Persona Logic ───────────────────────────────────────────────────────────

function computePersona(answers) {
  const counts = { A: 0, B: 0, C: 0, D: 0 };
  answers.forEach((a) => {if (counts[a] !== undefined) counts[a]++;});
  const max = Math.max(...Object.values(counts));
  const winners = Object.keys(counts).filter((k) => counts[k] === max);

  if (winners.length === 1) {
    const w = winners[0];
    if (w === "A") return PERSONAS.explorer;
    if (w === "B") return PERSONAS.pelit;
    if (w === "C") return PERSONAS.mager;
    if (w === "D") return PERSONAS.ambisius;
  }

  // Tiebreaker rules
  const s = new Set(winners);
  if (s.has("A") && s.has("B")) return PERSONAS.impulsif;
  if (s.has("A") && s.has("C")) return PERSONAS.explorer;
  if (s.has("A") && s.has("D")) return PERSONAS.explorer;
  if (s.has("B") && s.has("C")) return PERSONAS.mager;
  if (s.has("B") && s.has("D")) return PERSONAS.mager;
  if (s.has("C") && s.has("D")) return PERSONAS.balanced;
  // 3+ ties
  return PERSONAS.balanced;
}

// ── Sub-components ──────────────────────────────────────────────────────────

function NanaAvatar({ size = 80, animate = false }) {
  return (
    <motion.div
      initial={animate ? { scale: 0, rotate: -15 } : false}
      animate={animate ? { scale: 1, rotate: 0 } : false}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      style={{ width: size, height: size }} className="bg-[#F2F4F7] mx-auto rounded-[64px] border-2 border-[#FF6A00] overflow-hidden">

      
      <img src={NANA_IMG} alt="Nana AI" className="w-full h-full object-contain" />
    </motion.div>);

}

function QuizProgress({ current, total }) {
  return (
    <div className="mb-5">
      <div className="flex justify-between text-xs text-gray-500 mb-2">
        <span>Pertanyaan {current} dari {total}</span>
        <span>{Math.round(current / total * 100)}%</span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="h-1.5 bg-[#FF6A00] rounded-full"
          animate={{ width: `${current / total * 100}%` }}
          transition={{ duration: 0.4 }} />
        
      </div>
      <div className="flex justify-center gap-1.5 mt-2">
        {Array.from({ length: total }).map((_, i) =>
        <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i < current ? "bg-[#FF6A00]" : "bg-[#E2E8F0]"}`} />
        )}
      </div>
    </div>);

}

// ── Screens ─────────────────────────────────────────────────────────────────

function ScreenWelcome({ onNext }) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-8">
      <motion.img
        src={LOGO_IMG}
        alt="Atur Pintar"
        className="w-16 h-16 mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }} />
      
      <NanaAvatar size={96} animate />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-5">
        
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Halo! 👋</h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          Aku <span className="text-[#FF6A00] font-bold">Nana</span> — dan aku bakal jadi teman finansial kamu yang paling jujur (dan paling lucu) yang pernah ada.
          <br /><br />
          Sebelum mulai, aku mau kenalan dulu sama kamu. Cuma 2 menit. Janji.
        </p>
        <button
          onClick={onNext}
          className="w-full py-4 rounded-2xl bg-[#FF6A00] text-white font-bold text-base flex items-center justify-center gap-2 hover:bg-[#e05e00] active:scale-95 transition-all">
          
          Yuk Mulai <ArrowRight className="w-5 h-5" />
        </button>
      </motion.div>
    </div>);

}

function ScreenQuizIntro({ onNext }) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-8">
      <NanaAvatar size={80} animate />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-5">
        
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Dulu kenalan, baru kasih saran.</h2>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          5 pertanyaan singkat biar Nana tau gimana cara terbaik bantu kamu.
          <br /><br />
          Tidak ada jawaban yang salah — yang salah itu kalau bohong ke diri sendiri. 😄
        </p>
        <div className="flex justify-center gap-2 mb-8">
          {Array.from({ length: 5 }).map((_, i) =>
          <div key={i} className="w-8 h-1.5 rounded-full bg-[#FF6A00]/30" />
          )}
        </div>
        <button
          onClick={onNext}
          className="w-full py-4 rounded-2xl bg-[#FF6A00] text-white font-bold text-base flex items-center justify-center gap-2 hover:bg-[#e05e00] active:scale-95 transition-all">
          
          Mulai Quiz <ArrowRight className="w-5 h-5" />
        </button>
      </motion.div>
    </div>);

}

function ScreenQuiz({ questionIndex, answers, onAnswer }) {
  const q = QUIZ_QUESTIONS[questionIndex];
  return (
    <div className="px-6 py-6">
      <QuizProgress current={questionIndex + 1} total={5} />
      <motion.div
        key={questionIndex}
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}>
        
        <h2 className="text-lg font-bold text-gray-900 mb-5 leading-snug">{q.q}</h2>
        <div className="space-y-3">
          {q.options.map((opt) =>
          <button
            key={opt.key}
            onClick={() => onAnswer(opt.key)}
            className="w-full text-left flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 hover:bg-[#FF6A00]/10 hover:border-[#FF6A00]/50 active:scale-[0.98] transition-all">
            
              <span className="text-xl flex-shrink-0">{opt.emoji}</span>
              <span className="text-sm text-gray-800 font-medium leading-snug">{opt.text}</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>);

}

function ScreenPersona({ persona, onNext }) {
  useEffect(() => {
    setTimeout(() => {
      if (typeof confetti === "function") {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.3 }, colors: ["#FF6A00", "#FFD700", "#FF4444"] });
      }
    }, 400);
  }, []);

  return (
    <div className="px-6 py-8">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
        className="text-center mb-5">
        
        <NanaAvatar size={80} animate />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}>
        
        <p className="text-gray-400 text-xs text-center uppercase tracking-widest mb-1">Persona kamu</p>
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">{persona.label}</h2>
        <p className="text-sm text-gray-500 leading-relaxed text-center mb-5">{persona.desc}</p>

        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-4 space-y-2">
          <p className="text-xs font-bold text-[#FF6A00] uppercase tracking-widest mb-2">Strengths</p>
          {persona.strengths.map((s, i) =>
          <div key={i} className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✅</span>
              <span className="text-sm text-gray-800">{s}</span>
            </div>
          )}
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-6 space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Growth Area</p>
          {persona.growth.map((g, i) =>
          <div key={i} className="flex items-start gap-2">
              <span className="text-sm mt-0.5">📈</span>
              <span className="text-sm text-gray-500">{g}</span>
            </div>
          )}
        </div>

        <button
          onClick={onNext}
          className="w-full py-4 rounded-2xl bg-[#FF6A00] text-white font-bold text-base flex items-center justify-center gap-2 hover:bg-[#e05e00] active:scale-95 transition-all">
          
          Oke Nana, aku siap! <ArrowRight className="w-5 h-5" />
        </button>
      </motion.div>
    </div>);

}

function ScreenSetGoal({ onNext }) {
  const [selected, setSelected] = useState(null);
  const [customText, setCustomText] = useState("");

  const handleNext = () => {
    if (!selected) return;
    const value = selected === "custom" ? customText : selected;
    onNext(value);
  };

  return (
    <div className="px-6 py-6">
      <NanaAvatar size={64} animate />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <p className="text-center text-gray-400 text-sm mt-3 mb-2">Nana berkata:</p>
        <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 mb-5 text-center">
          <p className="text-gray-800 text-sm leading-relaxed">
            Satu hal dulu. Kamu mau nabung buat apa dalam 3 bulan ke depan? 🎯
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {GOALS.map((g) =>
          <button
            key={g.key}
            onClick={() => setSelected(g.key)}
            className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-2xl border transition-all active:scale-95 ${
            selected === g.key ?
            "border-[#FF6A00] bg-[#FF6A00]/10 text-gray-900" :
            "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300"}`
            }>
            
              <span className="text-2xl">{g.emoji}</span>
              <span className={`text-xs font-semibold text-center leading-tight ${selected === g.key ? "text-[#FF6A00]" : "text-gray-600"}`}>{g.label}</span>
            </button>
          )}
        </div>

        {selected === "custom" &&
        <input
          type="text"
          placeholder="Tulis goal kamu di sini..."
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6A00] mb-4 placeholder-gray-400"
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          autoFocus />

        }

        <p className="text-xs text-gray-400 text-center mb-4">
          Ini bukan komitmen seumur hidup. Bisa diubah kapan saja. Yang penting mulai dulu.
        </p>

        <button
          onClick={handleNext}
          disabled={!selected || selected === "custom" && !customText.trim()}
          className="w-full py-4 rounded-2xl bg-[#FF6A00] text-white font-bold text-base flex items-center justify-center gap-2 hover:bg-[#e05e00] active:scale-95 transition-all disabled:opacity-40">
          
          Lanjut <ArrowRight className="w-5 h-5" />
        </button>
      </motion.div>
    </div>);

}

function ScreenIncomeRange({ onNext, saving }) {
  const [selected, setSelected] = useState(null);

  return (
    <div className="px-6 py-6">
      <NanaAvatar size={64} animate />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <p className="text-center text-gray-400 text-sm mt-3 mb-2">Nana berkata:</p>
        <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 mb-5 text-center">
          <p className="text-gray-800 text-sm leading-relaxed">
            Terakhir — biar aku bisa bantu yang relevan, aku perlu tau income bulanan kamu. 💰
          </p>
        </div>

        <div className="space-y-2 mb-4">
          {INCOME_RANGES.map((r) =>
          <button
            key={r.key}
            onClick={() => setSelected(r.key)}
            className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border transition-all active:scale-[0.98] ${
            selected === r.key ?
            "border-[#FF6A00] bg-[#FF6A00]/10 text-gray-900" :
            "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"}`
            }>
            
              <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${selected === r.key ? "border-[#FF6A00] bg-[#FF6A00]" : "border-gray-400"}`} />
              <span className="text-sm font-medium">{r.label}</span>
            </button>
          )}
        </div>

        <p className="text-xs text-gray-400 text-center mb-5">
          Data ini cuma buat Nana kasih saran yang relevan. Tidak ada yang tau selain kamu dan Nana.
        </p>

        <button
          onClick={() => selected && onNext(selected)}
          disabled={!selected || saving}
          className="w-full py-4 rounded-2xl bg-[#FF6A00] text-white font-bold text-base flex items-center justify-center gap-2 hover:bg-[#e05e00] active:scale-95 transition-all disabled:opacity-40">
          
          {saving ? <><Loader2 className="w-5 h-5 animate-spin" /> Menyimpan...</> : <>Selesai! <ArrowRight className="w-5 h-5" /></>}
        </button>
      </motion.div>
    </div>);

}

function ScreenWelcomeGame({ goal, onFinish }) {
  const [xpWidth, setXpWidth] = useState(0);
  const goalObj = GOALS.find((g) => g.key === goal);
  const goalLabel = goalObj ? `${goalObj.emoji} ${goalObj.label}` : goal;

  useEffect(() => {
    setTimeout(() => setXpWidth(0), 200);
    setTimeout(() => {
      if (typeof confetti === "function") {
        confetti({ particleCount: 150, spread: 90, origin: { y: 0.4 }, colors: ["#FF6A00", "#FFD700", "#00C851", "#FF4444"] });
      }
    }, 300);
  }, []);

  return (
    <div className="px-6 py-8 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="text-6xl mb-4">
        
        🎉
      </motion.div>

      <NanaAvatar size={80} animate />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <h2 className="text-2xl font-bold text-gray-900 mt-4 mb-2">Selamat datang di Atur Pintar!</h2>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          Kamu resmi jadi <span className="text-[#FF6A00] font-bold">Level 1 — Newbie Ngatur</span>. Dan perjalanan naik level dimulai sekarang.
        </p>

        {/* XP Bar */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>⚡ XP</span>
            <span>0 / 500</span>
          </div>
          <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#FF6A00] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: "0%" }}
              transition={{ duration: 1, delay: 0.6 }} />
            
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
          { icon: "🔥", label: "Streak", val: "Hari ke-1" },
          { icon: "🎯", label: "Goal", val: goalLabel },
          { icon: "⭐", label: "Level", val: "1 — Newbie" }].
          map((s, i) =>
          <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-center">
              <div className="text-lg mb-0.5">{s.icon}</div>
              <div className="text-[10px] text-gray-400">{s.label}</div>
              <div className="text-xs font-bold text-gray-800 mt-0.5 leading-tight">{s.val}</div>
            </div>
          )}
        </div>

        {/* First mission */}
        <div className="bg-[#FF6A00]/10 border border-[#FF6A00]/30 rounded-2xl p-4 mb-6 text-left">
          <p className="text-xs font-bold text-[#FF6A00] uppercase tracking-widest mb-1.5">🎮 Mission Pertama</p>
          <p className="text-sm text-gray-800 leading-relaxed">
            Catat 1 pengeluaran hari ini → <span className="text-[#FF6A00] font-bold">+10 XP</span>
          </p>
        </div>

        <button
          onClick={onFinish}
          className="w-full py-4 rounded-2xl bg-[#FF6A00] text-white font-bold text-base flex items-center justify-center gap-2 hover:bg-[#e05e00] active:scale-95 transition-all">
          
          Masuk ke Dashboard <ArrowRight className="w-5 h-5" />
        </button>
      </motion.div>
    </div>);

}

// ── Main Flow ───────────────────────────────────────────────────────────────

const SCREEN = {
  WELCOME: "welcome",
  QUIZ_INTRO: "quiz_intro",
  QUIZ: "quiz",
  PERSONA: "persona",
  SET_GOAL: "set_goal",
  INCOME_RANGE: "income_range",
  GAME: "game"
};

export default function OnboardingFlow({ onComplete }) {
  const [screen, setScreen] = useState(SCREEN.WELCOME);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [persona, setPersona] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [saving, setSaving] = useState(false);

  function handleQuizAnswer(key) {
    const newAnswers = [...quizAnswers, key];
    setQuizAnswers(newAnswers);
    if (quizIndex < QUIZ_QUESTIONS.length - 1) {
      setQuizIndex((i) => i + 1);
    } else {
      const p = computePersona(newAnswers);
      setPersona(p);
      setScreen(SCREEN.PERSONA);
    }
  }

  function handleGoalSet(goal) {
    setSelectedGoal(goal);
    setScreen(SCREEN.INCOME_RANGE);
  }

  async function handleIncomeSet(incomeRange) {
    setSaving(true);
    try {
      // Save persona
      const existingPersona = await base44.entities.UserPersona.filter({}).catch(() => []);
      const personaData = {
        persona_type: persona.type,
        persona_label: persona.label,
        quiz_answers: quizAnswers,
        income_range: incomeRange,
        onboarding_completed_at: new Date().toISOString()
      };
      if (existingPersona.length > 0) {
        await base44.entities.UserPersona.update(existingPersona[0].id, personaData);
      } else {
        await base44.entities.UserPersona.create(personaData);
      }

      // Update user
      await base44.auth.updateMe({
        primary_goal: selectedGoal,
        onboarding_completed: true
      });

      // Initialize GamificationProfile
      const existing = await base44.entities.GamificationProfile.filter({}).catch(() => []);
      if (existing.length === 0) {
        await base44.entities.GamificationProfile.create({
          total_points: 0,
          level: 1,
          daily_streak: 0,
          longest_streak: 0,
          achievements: [],
          last_activity_date: new Date().toISOString().split("T")[0]
        });
      }

      setScreen(SCREEN.GAME);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function handleFinish() {
    localStorage.setItem("onboarding_done", "true");
    if (onComplete) onComplete();
    window.location.reload();
  }

  return (
    <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center overflow-hidden">
      <div className="w-full max-w-sm h-full overflow-y-auto flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={screen + quizIndex}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="flex-1">
            
            {screen === SCREEN.WELCOME &&
            <ScreenWelcome onNext={() => setScreen(SCREEN.QUIZ_INTRO)} />
            }
            {screen === SCREEN.QUIZ_INTRO &&
            <ScreenQuizIntro onNext={() => setScreen(SCREEN.QUIZ)} />
            }
            {screen === SCREEN.QUIZ &&
            <ScreenQuiz
              questionIndex={quizIndex}
              answers={quizAnswers}
              onAnswer={handleQuizAnswer} />

            }
            {screen === SCREEN.PERSONA && persona &&
            <ScreenPersona persona={persona} onNext={() => setScreen(SCREEN.SET_GOAL)} />
            }
            {screen === SCREEN.SET_GOAL &&
            <ScreenSetGoal onNext={handleGoalSet} />
            }
            {screen === SCREEN.INCOME_RANGE &&
            <ScreenIncomeRange onNext={handleIncomeSet} saving={saving} />
            }
            {screen === SCREEN.GAME &&
            <ScreenWelcomeGame goal={selectedGoal} onFinish={handleFinish} />
            }
          </motion.div>
        </AnimatePresence>
      </div>
    </div>);

}