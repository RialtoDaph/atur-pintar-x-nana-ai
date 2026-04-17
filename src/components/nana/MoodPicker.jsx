import { motion } from "framer-motion";

const MOODS = [
  { mood: "stress", emoji: "😤", label: "Lagi Stress" },
  { mood: "mager", emoji: "😴", label: "Males Banget" },
  { mood: "happy", emoji: "🥳", label: "Lagi Senang" },
  { mood: "panik", emoji: "😰", label: "Lagi Panik" },
  { mood: "normal", emoji: "😊", label: "Biasa Aja" },
];

export default function MoodPicker({ userName, onSelect, loading }) {
  const firstName = userName ? userName.split(" ")[0] : "Kamu";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full px-6 py-8 text-center"
    >
      <div className="w-16 h-16 rounded-full overflow-hidden mb-4 shadow-lg">
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a82e8090f60786b869983c/7708b64f5_generated_image.png"
          alt="Nana"
          className="w-full h-full object-cover"
        />
      </div>
      <h2 className="text-[#1A1A1A] dark:text-white font-black text-xl leading-tight mb-1">
        Hai {firstName}! Hari ini kamu lagi gimana? 👀
      </h2>
      <p className="text-[#8FA4C8] text-sm mb-8">Pilih mood kamu biar Nana bisa bantu lebih baik</p>

      <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
        {MOODS.map((m, i) => (
          <motion.button
            key={m.mood}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.07 }}
            onClick={() => !loading && onSelect(m)}
            disabled={loading}
            className="flex flex-col items-center gap-2 bg-white dark:bg-[#1A1E25] border-2 border-[#F2F4F7] dark:border-[#2D2D2D] rounded-2xl px-3 py-4 hover:border-[#FF6A00] hover:bg-[#FF6A00]/5 transition-all disabled:opacity-50 tap-highlight-fix"
          >
            <span className="text-3xl">{m.emoji}</span>
            <span className="text-xs font-bold text-[#1A1A1A] dark:text-white leading-tight">{m.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}