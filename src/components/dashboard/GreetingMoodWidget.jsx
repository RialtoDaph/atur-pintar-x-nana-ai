import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";

const MOODS = [
  { key: "happy", emoji: "😄", label: "Happy" },
  { key: "normal", emoji: "😐", label: "Normal" },
  { key: "mager", emoji: "😴", label: "Mager" },
  { key: "stress", emoji: "😤", label: "Stress" },
  { key: "panik", emoji: "😨", label: "Panik" },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
}

export default function GreetingMoodWidget({ user }) {
  const [todayMood, setTodayMood] = useState(null);
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const firstName = user?.full_name?.split(" ")[0] || "Kamu";

  useEffect(() => {
    if (!user?.email) return;
    base44.entities.MoodCheckIn.filter({ created_by: user.email, date: today })
      .then(records => { if (records?.[0]) setTodayMood(records[0]); })
      .catch(() => {});
  }, [user?.email]);

  async function handleMood(mood) {
    if (saving || todayMood) return;
    setSaving(true);
    const record = await base44.entities.MoodCheckIn.create({ date: today, mood: mood.key, emoji: mood.emoji });
    setTodayMood(record);
    setSaving(false);
  }

  const selectedMood = MOODS.find(m => m.key === todayMood?.mood);

  return (
    <div className="bg-[#0A0A0A] px-5 pt-6 pb-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[#8FA4C8] text-sm font-medium">{getGreeting()},</p>
          <p className="text-white text-xl font-bold mt-0.5">{firstName} 👋</p>
        </div>
        {selectedMood && (
          <div className="text-right">
            <p className="text-[#8FA4C8] text-[10px] mb-1">Mood hari ini</p>
            <span className="text-2xl">{selectedMood.emoji}</span>
          </div>
        )}
      </div>

      {!todayMood && (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
            <p className="text-[#8FA4C8] text-xs mb-2.5">Bagaimana perasaanmu hari ini?</p>
            <div className="flex gap-2">
              {MOODS.map(mood => (
                <button
                  key={mood.key}
                  onClick={() => handleMood(mood)}
                  disabled={saving}
                  className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors tap-highlight-fix"
                >
                  <span className="text-xl">{mood.emoji}</span>
                  <span className="text-[9px] text-[#8FA4C8] font-medium">{mood.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}