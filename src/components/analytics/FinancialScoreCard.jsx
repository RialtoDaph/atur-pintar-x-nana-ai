import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

export default function FinancialScoreCard({ user }) {
  const [healthScore, setHealthScore] = useState(null);

  useEffect(() => {
    if (!user?.email) return;
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    base44.entities.FinancialHealthScore.filter({ created_by: user.email, month: monthStr })
      .then(data => { if (data?.[0]) setHealthScore(data[0]); })
      .catch(() => {});
  }, [user?.email]);

  const score = healthScore?.total_score;
  const scoreLabel = score == null ? "Belum dihitung"
    : score >= 700 ? "Sangat Baik 🌟"
    : score >= 400 ? "Cukup Baik 👍"
    : "Perlu Ditingkatkan 💪";
  const scoreColor = score == null ? "#8FA4C8"
    : score >= 700 ? "#00C9A7"
    : score >= 400 ? "#F5A623"
    : "#FF6B6B";

  const pct = score != null ? Math.min((score / 1000) * 100, 100) : 0;

  return (
    <Link to={createPageUrl("Gamifikasi")} className="block">
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <div className="flex items-center gap-4 mb-3">
          {/* Score badge */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md flex-col"
            style={{ background: `linear-gradient(135deg, ${scoreColor}33 0%, ${scoreColor}22 100%)`, border: `2px solid ${scoreColor}55` }}
          >
            <span className="text-xl font-black" style={{ color: scoreColor }}>
              {score != null ? score : "—"}
            </span>
          </div>

          {/* Score info */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[#8FA4C8] font-medium">Skor Finansial Bulan Ini</p>
            <p className="text-base font-bold text-[#1A1A1A] leading-tight">{scoreLabel}</p>
            <p className="text-xs text-[#8FA4C8] mt-0.5">dari 1.000 poin</p>
          </div>

          <span className="text-xs text-[#FF6A00] font-semibold flex-shrink-0">Lihat →</span>
        </div>

        {/* Score progress bar */}
        <div className="h-2 bg-[#F2F4F7] rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: scoreColor }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        </div>
      </div>
    </Link>
  );
}