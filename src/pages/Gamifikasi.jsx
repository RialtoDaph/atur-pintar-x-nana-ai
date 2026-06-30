import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { ACHIEVEMENTS_DEF, LEVELS } from "@/hooks/useGamification";
import BossBattleCard from "@/components/gamification/BossBattleCard";
import ChallengeSection from "@/components/gamification/ChallengeSection";
import LeaderboardTab from "@/components/gamification/LeaderboardTab";

function getLevelInfo(xp) {
  const current = LEVELS.find(l => xp >= l.min && xp <= l.max) || LEVELS[0];
  const next = LEVELS.find(l => l.level === current.level + 1);
  return { current, next };
}

const TABS = [
  { key: "overview", label: "Overview", icon: "⚡" },
  { key: "achievement", label: "Achievement", icon: "🏅" },
  { key: "challenge", label: "Challenge", icon: "🎯" },
  { key: "boss", label: "Boss Battle", icon: "👹" },
  { key: "leaderboard", label: "Leaderboard", icon: "🏆" },
];

export default function Gamifikasi() {
  const [tab, setTab] = useState("overview");
  const [user, setUser] = useState(null);
  const [gamificationProfile, setGamificationProfile] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [fhsScore, setFhsScore] = useState(null);
  const [bossHistory, setBossHistory] = useState([]);
  const [allContrib, setAllContrib] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(async u => {
      setUser(u);
      // Expired challenges are handled centrally by processGamification + dailyGamificationCheck
      const [profiles, achs, fhsList] = await Promise.all([
        base44.entities.GamificationProfile.filter({ created_by: u.email }).catch(() => []),
        base44.entities.Achievement.filter({ created_by: u.email }).catch(() => []),
        base44.entities.FinancialHealthScore.filter({ created_by: u.email }).catch(() => []),
      ]);
      // Pick highest-XP profile (matches backend) to handle stray duplicates safely
      const sortedProfiles = (profiles || []).sort((a, b) => (b.total_points || 0) - (a.total_points || 0));
      setGamificationProfile(sortedProfiles[0] || null);
      setAchievements(achs || []);
      const sorted = (fhsList || []).sort((a, b) => (b.month || "").localeCompare(a.month || ""));
      setFhsScore(sorted?.[0] || null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function loadBossTab() {
    if (!user?.email) return;
    const [all, contribs] = await Promise.all([
      base44.entities.BossBattle.filter({}).catch(() => []),
      base44.entities.BossBattleContribution.filter({ created_by: user.email }).catch(() => []),
    ]);
    const history = (all || []).filter(b => b.status !== "active").sort((a, b) => (b.month || "").localeCompare(a.month || ""));
    setBossHistory(history);
    const totalDmg = (contribs || []).reduce((s, c) => s + (c.total_damage_all_time || 0), 0);
    setAllContrib(totalDmg);
  }

  useEffect(() => {
    if (tab === "boss" && user?.email) loadBossTab();
  }, [tab, user?.email]);

  const xp = gamificationProfile?.total_points || 0;
  const { current: lvl, next: nextLvl } = getLevelInfo(xp);
  const xpInLevel = xp - lvl.min;
  const xpNeeded = nextLvl ? nextLvl.min - lvl.min : 1;
  const pct = nextLvl ? Math.min((xpInLevel / xpNeeded) * 100, 100) : 100;
  // Dedupe + only count records that are actually unlocked.
  // Some legacy rows have is_unlocked=false or duplicate keys, so we filter and uniq.
  const unlockedKeys = Array.from(new Set(
    (achievements || []).filter(a => a.is_unlocked).map(a => a.achievement_key)
  ));

  return (
    <div className="min-h-screen bg-[#F2F4F7] pb-10">
      {/* Header */}
      <div className="bg-[#0A0A0A] px-5 pt-10 pb-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-[#8FA4C8] text-sm font-medium">Progres kamu</p>
          <h1 className="text-white text-2xl font-bold mt-0.5">Gamifikasi 🎮</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-[#F0F2F5] sticky top-14 sm:top-0 z-30">
        <div className="max-w-2xl mx-auto flex overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-3.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
                tab === t.key
                  ? "border-[#F97316] text-[#F97316]"
                  : "border-transparent text-[#8FA4C8] hover:text-[#4A5568]"
              }`}
            >
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 mt-4 space-y-4">
        {loading && <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl h-24 animate-pulse shadow-sm" />)}</div>}

        {/* ── TAB: OVERVIEW ── */}
        {!loading && tab === "overview" && (
          <>
            {/* Level card */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F97316] to-[#FFD700] flex items-center justify-center shadow-md shadow-[#F97316]/25">
                  <p className="text-white font-black text-lg">{lvl.level}</p>
                </div>
                <div>
                  <p className="text-xs text-[#8FA4C8] font-semibold">Level saat ini</p>
                  <p className="text-base font-bold text-[#1A1A1A]">{lvl.name}</p>
                  <p className="text-xs font-bold text-[#F97316]">{xp.toLocaleString("id-ID")} XP</p>
                </div>
              </div>
              <div className="h-2.5 bg-[#F2F4F7] rounded-full overflow-hidden mb-1.5">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #F97316, #FFD700)" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.7 }}
                />
              </div>
              {nextLvl ? (
                <p className="text-xs text-[#8FA4C8]">{(nextLvl.min - xp).toLocaleString("id-ID")} XP lagi → Level {nextLvl.level}: {nextLvl.name}</p>
              ) : (
                <p className="text-xs text-[#F97316] font-semibold">Level Maksimal! 🏆</p>
              )}
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
                <p className="text-2xl font-black text-[#F97316]">{gamificationProfile?.daily_streak || 0}</p>
                <p className="text-[10px] text-[#8FA4C8] font-semibold mt-0.5">🔥 Streak</p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
                <p className="text-2xl font-black text-[#F97316]">{fhsScore?.total_score ?? "--"}</p>
                <p className="text-[10px] text-[#8FA4C8] font-semibold mt-0.5">❤️ FHS Score</p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
                <p className="text-2xl font-black text-[#F97316]">{unlockedKeys.length}</p>
                <p className="text-[10px] text-[#8FA4C8] font-semibold mt-0.5">🏅 Achievement</p>
              </div>
            </div>

            {/* Streak info */}
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-bold text-[#1A1A1A]">🔥 Streak Harian</p>
                <span
                  className="text-xs font-bold text-[#1A1A1A] bg-[#F2F4F7] px-2 py-0.5 rounded-full"
                  title="Streak Freeze otomatis lindungi streak kamu kalau skip 1 hari. Quota 3x per minggu, reset tiap Senin (WIB)."
                >
                  ❄️ {gamificationProfile?.streak_freezes_available ?? 0} freeze
                </span>
              </div>
              <p className="text-3xl font-black text-[#F97316]">{gamificationProfile?.daily_streak || 0} <span className="text-base font-semibold text-[#8FA4C8]">hari berturut-turut</span></p>
              <p className="text-xs text-[#8FA4C8] mt-1">Terakhir aktif: {gamificationProfile?.last_activity_date || "-"}</p>
              {gamificationProfile?.streak_freeze_last_used && (
                <p className="text-[11px] text-[#1A1A1A] mt-2 bg-[#F2F4F7] px-2 py-1.5 rounded-lg">
                  ❄️ Freeze terakhir terpakai: {gamificationProfile.streak_freeze_last_used}
                </p>
              )}

              {/* Weekly freeze reset info */}
              {(() => {
                // Compute next Monday (WIB) — when freeze quota refreshes to 3.
                // WIB = UTC+7. Get "today" in WIB, find days until next Monday.
                const nowWIB = new Date(Date.now() + 7 * 60 * 60 * 1000);
                const wibDay = nowWIB.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
                const daysUntilMonday = wibDay === 1 ? 7 : (8 - wibDay) % 7 || 7;
                const nextResetWIB = new Date(nowWIB);
                nextResetWIB.setUTCDate(nowWIB.getUTCDate() + daysUntilMonday);
                const resetDateStr = nextResetWIB.toLocaleDateString("id-ID", { day: "numeric", month: "long" });
                const label = daysUntilMonday === 1 ? "besok" : `${daysUntilMonday} hari lagi`;
                return (
                  <div className="mt-3 pt-3 border-t border-[#F2F4F7]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">🔄</span>
                        <p className="text-[11px] font-semibold text-[#1A1A1A]">Freeze reset</p>
                      </div>
                      <p className="text-[11px] font-bold text-[#F97316]">{label}</p>
                    </div>
                    <p className="text-[10px] text-[#8FA4C8] mt-0.5">
                      Senin, {resetDateStr} (WIB) · jatah freeze kembali ke 3
                    </p>
                  </div>
                );
              })()}
            </div>
          </>
        )}

        {/* ── TAB: ACHIEVEMENT ── */}
        {!loading && tab === "achievement" && (
          <>
            <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-[#8FA4C8] font-semibold uppercase tracking-widest">Terkumpul</p>
                <p className="text-xl font-bold text-[#1A1A1A]">{unlockedKeys.length} / {ACHIEVEMENTS_DEF.length}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#8FA4C8]">Bonus XP</p>
                <p className="text-xl font-bold text-[#F97316]">{
                  (() => {
                    // Sum XP from unique unlocked achievement keys only (no duplicates).
                    const seen = new Set();
                    let total = 0;
                    for (const r of (achievements || [])) {
                      if (!r.is_unlocked) continue;
                      if (seen.has(r.achievement_key)) continue;
                      seen.add(r.achievement_key);
                      total += (r.xp_reward || 0);
                    }
                    return total.toLocaleString("id-ID");
                  })()
                } XP</p>
              </div>
            </div>

            {["streak", "transaction", "goal", "level", "special"].map(cat => {
              const catDefs = ACHIEVEMENTS_DEF.filter(a => a.category === cat);
              const catLabels = { streak: "🔥 Streak", transaction: "📝 Transaksi", goal: "🎯 Goals", level: "⚡ Level", special: "✨ Spesial" };
              return (
                <div key={cat}>
                  <p className="text-xs font-bold text-[#8FA4C8] uppercase tracking-widest mb-2 px-1">{catLabels[cat]}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {catDefs.map(a => {
                      const isUnlocked = unlockedKeys.includes(a.key);
                      return (
                        <div key={a.key} className={`bg-white rounded-2xl p-4 shadow-sm border-2 transition-all ${isUnlocked ? "border-[#F97316]/30" : "border-transparent opacity-50"}`}>
                          <div className={`text-3xl mb-2 ${!isUnlocked ? "grayscale" : ""}`}>{a.icon}</div>
                          <p className={`text-sm font-bold ${isUnlocked ? "text-[#1A1A1A]" : "text-[#8FA4C8]"}`}>{a.title}</p>
                          <p className="text-xs text-[#8FA4C8] mt-0.5">{a.hint}</p>
                          <p className={`text-xs font-bold mt-2 ${isUnlocked ? "text-[#F97316]" : "text-[#CBD5E0]"}`}>+{a.xp} XP</p>
                          {!isUnlocked && <p className="text-[10px] text-[#CBD5E0] mt-1">🔒 Belum terkunci</p>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* ── TAB: CHALLENGE ── */}
        {!loading && tab === "challenge" && user && (
          <ChallengeSection
            user={user}
            gamificationProfile={gamificationProfile}
            onProfileUpdate={setGamificationProfile}
            showHistory
          />
        )}

        {/* ── TAB: LEADERBOARD ── */}
        {!loading && tab === "leaderboard" && (
          <LeaderboardTab currentUser={user} />
        )}

        {/* ── TAB: BOSS BATTLE ── */}
        {!loading && tab === "boss" && user && (
          <>
            <BossBattleCard
              user={user}
              gamificationProfile={gamificationProfile}
              onProfileUpdate={setGamificationProfile}
            />

            {/* Total contribution */}
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <p className="text-xs text-[#8FA4C8] font-semibold uppercase tracking-widest mb-1">Total Kontribusimu</p>
              <p className="text-2xl font-black text-[#F97316]">
                {(allContrib || 0).toLocaleString("id-ID")} <span className="text-sm font-semibold text-[#8FA4C8]">total damage</span>
              </p>
            </div>

            {/* Boss history */}
            {bossHistory.length > 0 && (
              <div>
                <p className="text-xs font-bold text-[#8FA4C8] uppercase tracking-widest mb-2 px-1">Riwayat Boss Battle</p>
                <div className="space-y-2">
                  {bossHistory.map(b => (
                    <div key={b.id} className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3">
                      <span className="text-2xl">{b.icon || "👹"}</span>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-[#1A1A1A]">{b.name}</p>
                        <p className="text-xs text-[#8FA4C8]">{b.month}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${b.status === "won" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {b.status === "won" ? "Menang 🏆" : "Boss Kabur"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}