import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const MEDAL = ["🥇", "🥈", "🥉"];

/**
 * Compact leaderboard for the floating Boss Battle popup.
 * Shows top 5 contributors + "my rank" callout if not in top 5.
 */
export default function BossLeaderboardCompact() {
  const [entries, setEntries] = useState([]);
  const [myRank, setMyRank] = useState(-1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    base44.functions
      .invoke("getLeaderboard", {})
      .then((resp) => {
        if (cancelled) return;
        const data = resp?.data || {};
        setEntries(data.entries || []);
        setMyRank(typeof data.myRank === "number" ? data.myRank : -1);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <div className="bg-white rounded-2xl h-32 animate-pulse shadow-sm" />;
  }

  if (entries.length === 0) return null;

  const top = entries.slice(0, 5);
  const showMyRankCallout = myRank >= 5;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-black text-[#F97316] uppercase tracking-widest">🏆 Leaderboard</p>
        <p className="text-[10px] text-[#8FA4C8]">Top damage</p>
      </div>

      <div className="space-y-1.5">
        {top.map((e, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${e.isMe ? "bg-[#F97316]/5 border border-[#F97316]/20" : ""}`}
          >
            <div className="w-5 text-center">
              {i < 3 ? (
                <span className="text-sm">{MEDAL[i]}</span>
              ) : (
                <span className="text-[10px] font-black text-[#8FA4C8]">#{i + 1}</span>
              )}
            </div>
            <p className={`flex-1 text-xs font-bold truncate ${e.isMe ? "text-[#F97316]" : "text-[#1A1A1A]"}`}>
              {e.displayName}
            </p>
            <p className="text-xs font-black text-[#F97316]">
              {e.totalDamage.toLocaleString("id-ID")}
            </p>
          </div>
        ))}
      </div>

      {showMyRankCallout && entries[myRank] && (
        <div className="mt-2 pt-2 border-t border-[#F2F4F7] flex items-center gap-2 px-2">
          <span className="text-[10px] font-black text-[#F97316] w-5 text-center">#{myRank + 1}</span>
          <p className="flex-1 text-xs font-bold text-[#F97316] truncate">Kamu</p>
          <p className="text-xs font-black text-[#F97316]">
            {entries[myRank].totalDamage.toLocaleString("id-ID")}
          </p>
        </div>
      )}
    </div>
  );
}