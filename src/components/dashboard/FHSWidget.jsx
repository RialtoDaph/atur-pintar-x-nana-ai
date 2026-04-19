import { motion } from "framer-motion";

const COMPONENTS = [
  { key: "consistency_score", label: "Konsistensi", max: 250 },
  { key: "budget_adherence_score", label: "Budget", max: 250 },
  { key: "streak_score", label: "Streak", max: 200 },
  { key: "goal_progress_score", label: "Goals", max: 200 },
  { key: "nana_interaction_score", label: "Nana AI", max: 100 },
];

function getScoreColor(score) {
  if (score >= 700) return "#16A34A";
  if (score >= 400) return "#D97706";
  return "#DC2626";
}

function getScoreLabel(score) {
  if (score >= 800) return "Excellent";
  if (score >= 700) return "Sangat Baik";
  if (score >= 500) return "Baik";
  if (score >= 300) return "Cukup";
  return "Perlu Perbaikan";
}

export default function FHSWidget({ fhsRecord }) {
  if (!fhsRecord) return (
    <div className="bg-white rounded-2xl shadow-sm p-5 text-center">
      <p className="text-[#8FA4C8] text-sm">Skor kesehatan finansial belum tersedia</p>
    </div>
  );

  const score = fhsRecord.total_score || 0;
  const pct = Math.min((score / 1000) * 100, 100);
  const color = getScoreColor(score);
  const label = getScoreLabel(score);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <h3 className="text-sm font-bold text-[#1A1A1A] mb-4">Skor Kesehatan Finansial 💪</h3>
      
      {/* Ring/gauge area */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
            <circle cx="40" cy="40" r="30" fill="none" stroke="#F2F4F7" strokeWidth="8" />
            <motion.circle cx="40" cy="40" r="30" fill="none" stroke={color} strokeWidth="8"
              strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 30}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 30 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 30 * (1 - pct / 100) }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-black" style={{ color }}>{score}</span>
            <span className="text-[9px] text-[#8FA4C8]">/ 1000</span>
          </div>
        </div>
        <div>
          <p className="text-base font-bold" style={{ color }}>{label}</p>
          <p className="text-xs text-[#8FA4C8] mt-0.5">Skor bulan ini</p>
        </div>
      </div>

      {/* Breakdown bars */}
      <div className="space-y-2">
        {COMPONENTS.map(comp => {
          const val = fhsRecord[comp.key] || 0;
          const barPct = comp.max > 0 ? Math.min((val / comp.max) * 100, 100) : 0;
          return (
            <div key={comp.key}>
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-[10px] text-[#8FA4C8] font-medium">{comp.label}</span>
                <span className="text-[10px] font-bold text-[#1A1A1A]">{val}/{comp.max}</span>
              </div>
              <div className="h-1.5 bg-[#F2F4F7] rounded-full overflow-hidden">
                <motion.div className="h-full rounded-full" style={{ backgroundColor: getScoreColor(barPct * 10) }}
                  initial={{ width: 0 }} animate={{ width: `${barPct}%` }} transition={{ duration: 0.6, delay: 0.1 }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}