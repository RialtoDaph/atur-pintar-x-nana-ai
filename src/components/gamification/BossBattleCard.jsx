import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Sword } from "lucide-react";

export default function BossBattleCard({ user, gamificationProfile, onProfileUpdate }) {
  const [boss, setBoss] = useState(null);
  const [contribution, setContribution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attacking, setAttacking] = useState(false);
  const [damageResult, setDamageResult] = useState(null);
  const [showWinModal, setShowWinModal] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const currentMonth = today.slice(0, 7);

  useEffect(() => {
    if (!user?.email) return;
    loadBoss();
  }, [user?.email]);

  async function loadBoss() {
    setLoading(true);
    // Match backend bossBattleAttack: prefer current-month boss, fallback to any active boss
    const bosses = await base44.entities.BossBattle.filter({ status: "active" }).catch(() => []);
    const activeBoss = (bosses || []).find(b => b.month === currentMonth) || bosses?.[0];
    if (!activeBoss) { setLoading(false); return; }
    setBoss(activeBoss);

    const contribs = await base44.entities.BossBattleContribution.filter({
      created_by: user.email, boss_id: activeBoss.id,
    }).catch(() => []);
    setContribution(contribs?.[0] || null);
    setLoading(false);
  }

  async function handleAttack() {
    if (!boss || attacking) return;
    if (contribution?.last_attack_date === today) {
      setDamageResult({ msg: "Sudah menyerang hari ini! Kembali besok ⚔️", dmg: 0 });
      return;
    }

    setAttacking(true);

    // Delegate to backend — atomic attack + reward distribution
    const resp = await base44.functions.invoke("bossBattleAttack", {}).catch(err => ({ data: { error: err?.message || "Gagal serang" } }));
    const result = resp?.data || {};

    if (result.error) {
      setDamageResult({ msg: result.error, dmg: 0 });
      setAttacking(false);
      return;
    }
    if (result.alreadyAttacked) {
      setDamageResult({ msg: "Sudah menyerang hari ini! Kembali besok ⚔️", dmg: 0 });
      setAttacking(false);
      return;
    }
    if (result.noDamage) {
      setDamageResult({ msg: result.message || "Selesaikan minimal 1 mission dulu!", dmg: 0 });
      setAttacking(false);
      return;
    }

    // Optimistic UI update from authoritative server response
    const damage = result.damage || 0;
    setBoss(prev => ({
      ...prev,
      current_hp: result.newHP,
      status: result.bossDefeated ? "won" : "active",
      participant_count: !contribution ? (prev.participant_count || 0) + 1 : prev.participant_count,
    }));
    setContribution(prev => ({
      ...(prev || {}),
      damage_dealt: ((prev?.damage_dealt) || 0) + damage,
      total_damage_all_time: ((prev?.total_damage_all_time) || 0) + damage,
      last_attack_date: today,
    }));

    // Refresh profile from DB to reflect XP awarded by processGamification
    const profiles = await base44.entities.GamificationProfile.filter({ created_by: user.email }).catch(() => []);
    const fresh = (profiles || []).sort((a, b) => (b.total_points || 0) - (a.total_points || 0))[0];
    if (fresh && onProfileUpdate) onProfileUpdate(fresh);

    setDamageResult({
      msg: `⚔️ Kamu kasih ${damage} damage ke boss!`,
      dmg: damage,
      missions: result.completedMissions,
      streak: result.streak,
    });

    // Notify leaderboard to invalidate its cache
    window.dispatchEvent(new CustomEvent("boss-attacked"));

    if (result.bossDefeated) setShowWinModal(true);
    setAttacking(false);
  }

  if (loading) return <div className="bg-white rounded-2xl h-36 animate-pulse shadow-sm" />;
  if (!boss) return null;

  const hpPct = Math.max(0, Math.min(100, (boss.current_hp / boss.max_hp) * 100));
  const alreadyAttackedToday = contribution?.last_attack_date === today;

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm p-4 border-2 border-[#F97316]/20">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">{boss.icon || "👹"}</span>
          <div className="flex-1">
            <p className="text-[10px] font-black text-[#F97316] uppercase tracking-widest">Boss Bulan Ini</p>
            <p className="text-sm font-bold text-[#1A1A1A]">{boss.name}</p>
          </div>
          {boss.status === "won" && <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">Kalah!</span>}
          {boss.status === "lost" && <span className="text-xs bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">Boss Kabur</span>}
        </div>

        {/* HP Bar */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <p className="text-xs text-[#8FA4C8] font-medium">HP Boss</p>
            <p className="text-xs font-bold text-[#1A1A1A]">
              {Math.max(0, boss.current_hp).toLocaleString("id-ID")} / {boss.max_hp.toLocaleString("id-ID")}
            </p>
          </div>
          <div className="h-3 bg-[#F2F4F7] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: hpPct > 50 ? "#EF4444" : hpPct > 20 ? "#F97316" : "#16A34A" }}
              initial={{ width: "100%" }}
              animate={{ width: `${hpPct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mb-3">
          <p className="text-xs text-[#8FA4C8]">👥 <span className="font-semibold text-[#1A1A1A]">{boss.participant_count || 0}</span> pejuang aktif</p>
          <p className="text-xs text-[#8FA4C8]">🏆 Reward: <span className="font-semibold text-[#F97316]">{boss.reward_xp || 200} XP</span></p>
        </div>

        {/* Damage result */}
        <AnimatePresence>
          {damageResult && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-3 bg-[#FFF7ED] border border-[#F97316]/20 rounded-xl px-3 py-2"
            >
              <p className="text-xs font-semibold text-[#F97316]">{damageResult.msg}</p>
              {damageResult.dmg > 0 && (
                <p className="text-[11px] text-[#8FA4C8] mt-0.5">
                  {damageResult.missions} mission × 100 + streak bonus {Math.min((damageResult.streak || 0) * 50, 500)} = {damageResult.dmg} dmg · +20 XP
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Attack button */}
        {boss.status === "active" && (
          <button
            onClick={handleAttack}
            disabled={attacking || alreadyAttackedToday}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
              alreadyAttackedToday
                ? "bg-[#F2F4F7] text-[#8FA4C8] cursor-not-allowed"
                : "bg-[#F97316] text-white hover:bg-[#E05E28] active:scale-95 shadow-md shadow-[#F97316]/25"
            }`}
          >
            <Sword className="w-4 h-4" />
            {attacking ? "Menyerang..." : alreadyAttackedToday ? "Sudah Serang Hari Ini ✓" : "Serang Boss! ⚔️"}
          </button>
        )}

        {boss.status === "lost" && (
          <p className="text-center text-sm text-[#8FA4C8] italic">😔 Boss lolos bulan ini... Tapi bulan depan kita lebih siap!</p>
        )}
      </div>

      {/* Win Modal */}
      <AnimatePresence>
        {showWinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-xs w-full text-center shadow-2xl"
            >
              <div className="text-5xl mb-3">🎉</div>
              <p className="text-xs font-black text-[#F97316] uppercase tracking-widest mb-1">Komunitas Menang!</p>
              <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">{boss.name} dikalahkan!</h2>
              <p className="text-[#4A5568] text-sm mb-2">+{boss.reward_xp || 200} XP untuk semua peserta!</p>
              <p className="text-[#4A5568] text-sm mb-6">🏆 Badge '{boss.reward_badge || "Penakluk Boss"}' unlocked!</p>
              <button
                onClick={() => setShowWinModal(false)}
                className="w-full py-3.5 rounded-2xl bg-[#F97316] text-white font-bold text-sm shadow-lg shadow-[#F97316]/30"
              >
                Luar Biasa! 🎊
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}