import { useState, useEffect, useRef } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

// ─── Persona Config ─────────────────────────────────────────────────────────
const PERSONAS = {
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

const QUESTIONS = [
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

const FIRST_GOALS = [
  { key: "dana_darurat", emoji: "🆘", label: "Dana darurat" },
  { key: "liburan", emoji: "✈️", label: "Liburan/travel" },
  { key: "gadget", emoji: "📱", label: "Gadget baru" },
  { key: "kursus", emoji: "🎓", label: "Kursus/skill up" },
  { key: "kost", emoji: "🏠", label: "Biaya kost/rumah" },
  { key: "spesial", emoji: "💍", label: "Sesuatu yang spesial" },
  { key: "custom", emoji: "✏️", label: "Tulis sendiri..." },
];

const INCOME_RANGES = [
  { key: "under_3jt", label: "Di bawah Rp 3 juta" },
  { key: "3_5jt", label: "Rp 3–5 juta" },
  { key: "5_8jt", label: "Rp 5–8 juta" },
  { key: "8_15jt", label: "Rp 8–15 juta" },
  { key: "above_15jt", label: "Di atas Rp 15 juta" },
  { key: "prefer_not_to_say", label: "Belum mau cerita dulu 🙈" },
];

function determinePersona(answers) {
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

// ─── Screen components ───────────────────────────────────────────────────────

function ScreenWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex flex-col min-h-full"
    >
      {children}
    </motion.div>
  );
}

function NanaAvatar({ size = "lg", excited = false }) {
  const sz = size === "lg" ? "w-20 h-20" : "w-12 h-12";
  return (
    <motion.div
      animate={excited ? { scale: [1, 1.15, 0.95, 1.05, 1], rotate: [0, -5, 5, -3, 0] } : {}}
      transition={{ duration: 0.6, repeat: excited ? Infinity : 0, repeatDelay: 2 }}
      className={`${sz} rounded-full overflow-hidden shadow-lg mx-auto ring-2 ring-[#FF6B35]/30`}
    >
      <img
        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a82e8090f60786b869983c/7708b64f5_generated_image.png"
        alt="Nana"
        className="w-full h-full object-cover"
      />
    </motion.div>
  );
}

function CTAButton({ onClick, disabled, loading, children, secondary = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40 ${
        secondary
          ? "border-2 border-[#FF6B35] text-[#FF6B35] bg-transparent"
          : "bg-[#FF6B35] text-white shadow-lg shadow-[#FF6B35]/30"
      }`}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
    </button>
  );
}

// ─── Screen 1: Splash & Welcome ─────────────────────────────────────────────
function Screen1({ onNext }) {
  return (
    <ScreenWrapper>
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-10">
        <motion.img
          src="https://media.base44.com/images/public/69a82e8090f60786b869983c/d2e52bdf2_3.png"
          alt="Atur Pintar"
          className="w-16 h-16 mb-6"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
        />
        <NanaAvatar excited />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <h1 className="text-3xl font-bold text-[#1A1A1A] mb-3">Halo! 👋</h1>
          <p className="text-[#4A5568] text-sm leading-relaxed max-w-xs mx-auto">
            Aku <strong>Nana</strong>, dan aku bakal jadi teman finansial kamu yang paling jujur (dan paling lucu) yang pernah ada.
            <br /><br />
            Sebelum mulai, aku mau kenalan dulu sama kamu. Cuma 2 menit. Janji.
          </p>
        </motion.div>
      </div>
      <div className="px-6 pb-8">
        <CTAButton onClick={onNext}>
          Yuk Mulai →
        </CTAButton>
      </div>
    </ScreenWrapper>
  );
}

// ─── Screen 3: Intro Quiz ────────────────────────────────────────────────────
function Screen3({ onNext, onSkip }) {
  return (
    <ScreenWrapper>
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-10">
        <div className="text-5xl mb-5">🧠</div>
        <h2 className="text-2xl font-bold text-[#1A1A1A] mb-3">Kenalan dulu,<br />baru kasih saran.</h2>
        <p className="text-[#4A5568] text-sm leading-relaxed max-w-xs mx-auto mb-8">
          5 pertanyaan singkat biar Nana tau gimana cara terbaik bantu kamu.
          <br /><br />
          Gak ada jawaban yang salah, yang salah itu kalau bohong ke diri sendiri. 😄
        </p>
      </div>
      <div className="px-6 pb-8 space-y-3">
        <CTAButton onClick={onNext}>
          Mulai Quiz →
        </CTAButton>
        <button
          onClick={onSkip}
          className="w-full py-3 text-sm font-medium text-[#8FA4C8] hover:text-[#FF6B35] transition-colors tap-highlight-fix"
        >
          Lewati quiz, isi yang penting aja
        </button>
      </div>
    </ScreenWrapper>
  );
}

// ─── Screen 4–8: Quiz Questions ──────────────────────────────────────────────
function QuizScreen({ questionIndex, totalQuestions, question, onAnswer, onBack, canGoBack }) {
  const [selected, setSelected] = useState(null);
  const isTransitioning = useRef(false);

  function handleSelect(key) {
    if (isTransitioning.current) return;
    isTransitioning.current = true;
    setSelected(key);
    setTimeout(() => onAnswer(key), 500);
  }

  function handleBack() {
    if (isTransitioning.current) return;
    isTransitioning.current = true;
    onBack();
  }

  return (
    <ScreenWrapper>
      {/* Progress */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between text-xs text-[#8FA4C8] mb-2">
          <div className="flex items-center gap-2">
            {canGoBack && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-[#FF6B35] font-medium tap-highlight-fix"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Kembali
              </button>
            )}
            <span>Pertanyaan {questionIndex + 1} dari {totalQuestions}</span>
          </div>
          <span>{Math.round(((questionIndex + 1) / totalQuestions) * 100)}%</span>
        </div>
        <div className="h-1.5 bg-[#F2F4F7] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#FF6B35] rounded-full"
            initial={{ width: `${(questionIndex / totalQuestions) * 100}%` }}
            animate={{ width: `${((questionIndex + 1) / totalQuestions) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      <div className="flex-1 px-6 pb-6">
        <h2 className="text-lg font-bold text-[#1A1A1A] mb-6 leading-snug">{question.q}</h2>
        <div className="space-y-3">
          {question.opts.map(opt => (
            <motion.button
              key={opt.key}
              onClick={() => handleSelect(opt.key)}
              whileTap={{ scale: 0.97 }}
              className={`w-full text-left px-4 py-4 rounded-2xl border-2 flex items-center gap-3 transition-all duration-200 ${
                selected === opt.key
                  ? "border-[#FF6B35] bg-[#FF6B35]/10"
                  : "border-[#E2E8F0] bg-white hover:border-[#FF6B35]/40"
              }`}
            >
              <span className="text-2xl w-8 flex-shrink-0">{opt.emoji}</span>
              <span className="text-sm font-medium text-[#1A1A1A] leading-snug">{opt.text}</span>
              {selected === opt.key && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-auto w-5 h-5 rounded-full bg-[#FF6B35] flex items-center justify-center flex-shrink-0"
                >
                  <span className="text-white text-xs">✓</span>
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </ScreenWrapper>
  );
}

// ─── Screen 9: Persona Reveal ─────────────────────────────────────────────────
function PersonaReveal({ persona, onNext }) {
  const p = PERSONAS[persona];
  return (
    <ScreenWrapper>
      <div className="flex-1 px-6 py-8 overflow-y-auto">
        <div className="text-center mb-6">
          <NanaAvatar excited size="lg" />
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-[#8FA4C8] text-sm mt-4 mb-1">Kamu adalah...</p>
            <h2 className="text-2xl font-bold text-[#1A1A1A]">{p.label}</h2>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          <div className="bg-[#F8FAFC] rounded-2xl p-4">
            <p className="text-sm text-[#4A5568] leading-relaxed">{p.desc}</p>
          </div>

          <div className="bg-[#F0FDF4] rounded-2xl p-4">
            <p className="text-xs font-bold text-[#16A34A] uppercase tracking-widest mb-3">Kekuatan kamu</p>
            {p.strengths.map((s, i) => (
              <div key={i} className="flex items-start gap-2 mb-1.5">
                <span className="text-[#16A34A]">✅</span>
                <span className="text-sm text-[#1A1A1A]">{s}</span>
              </div>
            ))}
          </div>

          <div className="bg-[#FFF7ED] rounded-2xl p-4">
            <p className="text-xs font-bold text-[#EA580C] uppercase tracking-widest mb-3">Area berkembang</p>
            {p.growth.map((g, i) => (
              <div key={i} className="flex items-start gap-2 mb-1.5">
                <span>📈</span>
                <span className="text-sm text-[#1A1A1A]">{g}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="px-6 pb-8">
        <CTAButton onClick={onNext}>
          Oke Nana, aku siap! →
        </CTAButton>
      </div>
    </ScreenWrapper>
  );
}

// ─── Screen 10: First Goal ───────────────────────────────────────────────────
function Screen10({ onNext }) {
  const [selected, setSelected] = useState(null);
  const [customGoal, setCustomGoal] = useState("");

  const isValid = selected && (selected !== "custom" || customGoal.trim().length > 0);

  function handleNext() {
    if (!isValid) return;
    const goal = selected === "custom" ? customGoal.trim() : selected;
    onNext(goal);
  }

  return (
    <ScreenWrapper>
      <div className="flex-1 px-6 py-8 overflow-y-auto">
        <div className="flex items-center gap-3 mb-6">
          <NanaAvatar size="sm" />
          <div className="bg-[#F2F4F7] rounded-2xl rounded-tl-sm px-4 py-3 flex-1">
            <p className="text-sm text-[#1A1A1A] leading-relaxed">
              Satu hal dulu. Kamu mau nabung buat apa dalam 3 bulan ke depan?
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {FIRST_GOALS.filter(g => g.key !== "custom").map(goal => (
            <button
              key={goal.key}
              onClick={() => setSelected(goal.key)}
              className={`py-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                selected === goal.key
                  ? "border-[#FF6B35] bg-[#FF6B35]/10"
                  : "border-[#E2E8F0] bg-white"
              }`}
            >
              <span className="text-3xl">{goal.emoji}</span>
              <span className="text-xs font-semibold text-[#1A1A1A] text-center">{goal.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => setSelected("custom")}
          className={`w-full py-3 rounded-2xl border-2 flex items-center justify-center gap-2 transition-all mb-3 ${
            selected === "custom"
              ? "border-[#FF6B35] bg-[#FF6B35]/10"
              : "border-dashed border-[#CBD5E0]"
          }`}
        >
          <span>✏️</span>
          <span className="text-sm font-medium text-[#4A5568]">Tulis sendiri...</span>
        </button>

        {selected === "custom" && (
          <input
            type="text"
            placeholder="Nabung buat apa?"
            maxLength={50}
            className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35] bg-white mb-3"
            value={customGoal}
            onChange={e => setCustomGoal(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && isValid) {
                e.preventDefault();
                handleNext();
              }
            }}
            autoFocus
          />
        )}

        <p className="text-xs text-[#8FA4C8] text-center">
          Ini bukan komitmen seumur hidup. Bisa diubah kapan saja. Yang penting mulai dulu.
        </p>
      </div>

      <div className="px-6 pb-8">
        <CTAButton
          onClick={handleNext}
          disabled={!isValid}
        >
          Lanjut →
        </CTAButton>
      </div>
    </ScreenWrapper>
  );
}

// ─── Screen 11: Income Range ─────────────────────────────────────────────────
function Screen11({ onNext, loading, error }) {
  const [selected, setSelected] = useState(null);

  return (
    <ScreenWrapper>
      <div className="flex-1 px-6 py-8 overflow-y-auto">
        <div className="flex items-center gap-3 mb-6">
          <NanaAvatar size="sm" />
          <div className="bg-[#F2F4F7] rounded-2xl rounded-tl-sm px-4 py-3 flex-1">
            <p className="text-sm text-[#1A1A1A] leading-relaxed">
              Terakhir, biar Nana bisa kasih saran yang relevan, Nana perlu tau income bulanan kamu.
            </p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          {INCOME_RANGES.map(r => (
            <button
              key={r.key}
              onClick={() => setSelected(r.key)}
              className={`w-full text-left px-4 py-3.5 rounded-2xl border-2 text-sm font-medium transition-all ${
                selected === r.key
                  ? "border-[#FF6B35] bg-[#FF6B35]/10 text-[#FF6B35]"
                  : "border-[#E2E8F0] bg-white text-[#1A1A1A]"
              }`}
            >
              {selected === r.key ? "● " : "○ "}{r.label}
            </button>
          ))}
        </div>

        <p className="text-xs text-[#8FA4C8] text-center">
          Data ini cuma buat Nana kasih saran yang relevan. Gak ada yang tau selain kamu dan Nana. 🔒
        </p>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-xs text-red-600 text-center">{error}</p>
          </div>
        )}
      </div>

      <div className="px-6 pb-8">
        <CTAButton
          onClick={() => onNext(selected)}
          disabled={!selected}
          loading={loading}
        >
          Selesai! →
        </CTAButton>
      </div>
    </ScreenWrapper>
  );
}

// ─── Screen 12: Welcome to the Game ─────────────────────────────────────────
function Screen12({ persona, primaryGoal, primaryGoalLabel, onDone }) {
  useEffect(() => {
    let cancelled = false;
    const end = Date.now() + 2500;
    let rafId;
    const frame = () => {
      if (cancelled) return;
      confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors: ["#FF6B35", "#FFD700", "#FF9A5C"] });
      confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors: ["#FF6B35", "#FFD700", "#FF9A5C"] });
      if (Date.now() < end) rafId = requestAnimationFrame(frame);
    };
    const timeoutId = setTimeout(frame, 400);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <ScreenWrapper>
      <div className="flex-1 px-6 py-8 overflow-y-auto">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">Selamat datang di<br />Atur Pintar!</h2>
          <p className="text-sm text-[#4A5568]">
            Kamu resmi jadi <strong>Level 1, Newbie Ngatur.</strong><br />
            Dan perjalanan naik level dimulai sekarang.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3 mb-6"
        >
          {/* XP Bar */}
          <div className="bg-[#F8FAFC] rounded-2xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-[#1A1A1A]">⚡ XP</span>
              <span className="text-xs text-[#8FA4C8]">0 / 500</span>
            </div>
            <div className="h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FFD700] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: "2%" }}
                transition={{ delay: 0.8, duration: 0.6 }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#FFF7ED] rounded-2xl p-4 text-center">
              <div className="text-2xl mb-1">🔥</div>
              <p className="text-xs text-[#8FA4C8]">Streak</p>
              <p className="text-sm font-bold text-[#1A1A1A]">Hari ke-1</p>
            </div>
            <div className="bg-[#F0FDF4] rounded-2xl p-4 text-center">
              <div className="text-2xl mb-1">🎯</div>
              <p className="text-xs text-[#8FA4C8]">Goal</p>
              <p className="text-xs font-bold text-[#1A1A1A] leading-tight">{primaryGoalLabel || primaryGoal}</p>
            </div>
          </div>
        </motion.div>

        {/* First Mission */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-r from-[#FF6B35] to-[#FF9A5C] rounded-2xl p-4 text-white"
        >
          <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">🏆 Mission Pertama</p>
          <p className="text-sm font-semibold">Catat 1 pengeluaran hari ini → +10 XP</p>
        </motion.div>
      </div>

      <div className="px-6 pb-8 pt-4">
        <CTAButton onClick={onDone}>
          Masuk ke Dashboard →
        </CTAButton>
      </div>
    </ScreenWrapper>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
const SCREEN = {
  WELCOME: 0,
  QUIZ_INTRO: 1,
  QUIZ: 2,       // 5 sub-screens via questionIndex
  PERSONA: 3,
  GOAL: 4,
  INCOME: 5,
  WELCOME_GAME: 6,
};

export default function OnboardingQuestionnaire({ onClose }) {
  const [screen, setScreen] = useState(SCREEN.WELCOME);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [persona, setPersona] = useState(null);
  const [primaryGoal, setPrimaryGoal] = useState(null);
  const [primaryGoalLabel, setPrimaryGoalLabel] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const isSavingRef = useRef(false);

  function handleAnswer(key) {
    const newAnswers = [...answers, key];
    setAnswers(newAnswers);

    if (questionIndex < QUESTIONS.length - 1) {
      setQuestionIndex(i => i + 1);
    } else {
      // All questions done → compute persona
      const p = determinePersona(newAnswers);
      setPersona(p);
      setScreen(SCREEN.PERSONA);
    }
  }

  function handleQuizBack() {
    if (questionIndex > 0) {
      setQuestionIndex(i => i - 1);
      setAnswers(prev => prev.slice(0, -1));
    }
  }

  function handleGoalNext(goal) {
    const goalObj = FIRST_GOALS.find(g => g.key === goal);
    setPrimaryGoal(goal);
    // If custom goal, the goal string itself IS the label; else use predefined label
    setPrimaryGoalLabel(goalObj?.label || goal);
    setScreen(SCREEN.INCOME);
  }

  async function handleIncomeNext(incomeRange) {
    if (isSavingRef.current) return; // prevent double-submit
    isSavingRef.current = true;
    setSaving(true);
    setSaveError(null);

    const today = new Date().toISOString().split("T")[0];
    const personaData = PERSONAS[persona];

    try {
      // Check existing GamificationProfile to avoid duplicate
      const existingProfiles = await base44.entities.GamificationProfile.list();
      const needsProfile = !existingProfiles || existingProfiles.length === 0;

      const ops = [
        base44.entities.UserPersona.create({
          persona_type: persona,
          persona_label: personaData.label,
          quiz_answers: answers,
          primary_goal: primaryGoal,
          primary_goal_label: primaryGoalLabel,
          income_range: incomeRange,
          onboarding_completed_at: today,
        }),
        base44.auth.updateMe({
          onboarding_completed: true,
          primary_goal: primaryGoal,
        }),
      ];

      if (needsProfile) {
        ops.push(base44.entities.GamificationProfile.create({
          total_points: 0,
          level: 1,
          daily_streak: 0,
          last_activity_date: today,
        }));
      }

      await Promise.all(ops);
      setScreen(SCREEN.WELCOME_GAME);
    } catch (err) {
      setSaveError(err?.message || "Gagal menyimpan data. Coba lagi ya.");
    } finally {
      setSaving(false);
      isSavingRef.current = false;
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col overflow-hidden">
      <AnimatePresence mode="wait">
        {screen === SCREEN.WELCOME && (
          <Screen1 key="s1" onNext={() => setScreen(SCREEN.QUIZ_INTRO)} />
        )}
        {screen === SCREEN.QUIZ_INTRO && (
          <Screen3
            key="s3"
            onNext={() => { setScreen(SCREEN.QUIZ); setQuestionIndex(0); setAnswers([]); }}
            onSkip={() => {
              // Skip quiz: default persona "balanced", lanjut ke goal selection
              setPersona("balanced");
              setAnswers([]);
              setScreen(SCREEN.GOAL);
            }}
          />
        )}
        {screen === SCREEN.QUIZ && (
          <QuizScreen
            key={`quiz-${questionIndex}`}
            questionIndex={questionIndex}
            totalQuestions={QUESTIONS.length}
            question={QUESTIONS[questionIndex]}
            onAnswer={handleAnswer}
            onBack={handleQuizBack}
            canGoBack={questionIndex > 0}
          />
        )}
        {screen === SCREEN.PERSONA && persona && (
          <PersonaReveal key="persona" persona={persona} onNext={() => setScreen(SCREEN.GOAL)} />
        )}
        {screen === SCREEN.GOAL && (
          <Screen10 key="goal" onNext={handleGoalNext} />
        )}
        {screen === SCREEN.INCOME && (
          <Screen11 key="income" onNext={handleIncomeNext} loading={saving} error={saveError} />
        )}
        {screen === SCREEN.WELCOME_GAME && (
          <Screen12
            key="done"
            persona={persona}
            primaryGoal={primaryGoal}
            primaryGoalLabel={primaryGoalLabel}
            onDone={() => {
              onClose();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}