function getScoreLabel(score) {
  if (score <= 200) return "Mulai Perjalanan 🌱";
  if (score <= 400) return "Berkembang 📈";
  if (score <= 600) return "Lumayan Oke 💪";
  if (score <= 800) return "Hampir Pro 🎯";
  return "Atur Pintar Pro 🏆";
}

export default function FinancialHealthCard({ score = 0 }) {
  const label = getScoreLabel(score);
  const pct = Math.min((score / 1000) * 100, 100);

  return (
    <div
      className="rounded-2xl p-5 shadow-md"
      style={{ background: "linear-gradient(135deg, #FF6B35, #FF8C5A)" }}
    >
      <p className="text-white/80 text-xs font-semibold uppercase tracking-widest mb-1">
        Financial Health Score
      </p>
      <div className="flex items-end justify-between mb-3">
        <p className="text-white text-5xl font-bold">{score}</p>
        <p className="text-white/90 text-sm font-semibold mb-1">{label}</p>
      </div>
      <div className="h-2 bg-white/30 rounded-full overflow-hidden">
        <div
          className="h-full bg-white rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-white/70 text-xs mt-1.5">dari 1000 poin</p>
    </div>
  );
}