import { useMemo, useState } from "react";
import { Trophy, Scale, Coffee, ChevronRight } from "lucide-react";
import { useAppSettings } from "@/components/utils/useAppSettings";

// Klasifikasi 50/30/20
// Needs (50%): housing, food, transport, health
// Wants (30%): entertainment, shopping, subscriptions, other
// Savings (20%): savings, investments, goals (deteksi via type=savings atau goal_id)
const NEEDS_KEYS = ["housing", "food", "transport", "health"];
const WANTS_KEYS = ["entertainment", "shopping", "subscriptions", "other"];

export default function BehaviorInsightsCard({ transactions = [], filterPeriod = "6", customDateRange = null, allCategoriesConfig = {} }) {
  const { formatCurrency, formatShortNumber } = useAppSettings();
  const [tab, setTab] = useState("merchant"); // merchant | lifestyle | nospend

  const data = useMemo(() => {
    const now = new Date();
    let start, end;
    if (customDateRange) {
      start = customDateRange.start;
      end = customDateRange.end;
    } else {
      const months = parseInt(filterPeriod);
      start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
      end = now;
    }

    const filtered = transactions.filter((t) => {
      const d = new Date(t.date);
      return d >= start && d <= end;
    });

    const expenses = filtered.filter((t) => t.type === "expense");
    const totalExpense = expenses.reduce((s, t) => s + (t.amount || 0), 0);

    // ===== TAB 1: Top Merchant =====
    // Group by `note` (merchant name). Skip kosong. Normalisasi case.
    const merchantMap = {};
    expenses.forEach((t) => {
      const raw = (t.note || "").trim();
      if (!raw) return;
      const key = raw.toLowerCase();
      if (!merchantMap[key]) {
        merchantMap[key] = { name: raw, total: 0, count: 0 };
      }
      merchantMap[key].total += t.amount || 0;
      merchantMap[key].count += 1;
    });
    const topMerchants = Object.values(merchantMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // ===== TAB 2: 50/30/20 Lifestyle =====
    let needs = 0, wants = 0, savings = 0;
    filtered.forEach((t) => {
      const amount = t.amount || 0;
      if (t.type === "savings" || t.goal_id) {
        savings += amount;
        return;
      }
      if (t.type !== "expense") return;
      const cat = t.category || "other";
      // Cek custom/global category — fallback by parent category atau default
      const catConfig = allCategoriesConfig[cat];
      const catKey = catConfig?.parent_key || cat;

      if (NEEDS_KEYS.includes(catKey) || NEEDS_KEYS.some(k => cat.includes(k))) {
        needs += amount;
      } else if (WANTS_KEYS.includes(catKey) || WANTS_KEYS.some(k => cat.includes(k))) {
        wants += amount;
      } else {
        wants += amount; // unknown → wants
      }
    });
    const totalLifestyle = needs + wants + savings;
    const needsPct = totalLifestyle > 0 ? (needs / totalLifestyle) * 100 : 0;
    const wantsPct = totalLifestyle > 0 ? (wants / totalLifestyle) * 100 : 0;
    const savingsPct = totalLifestyle > 0 ? (savings / totalLifestyle) * 100 : 0;

    // Verdict
    let verdict = null;
    if (totalLifestyle > 0) {
      if (needsPct <= 55 && wantsPct <= 35 && savingsPct >= 15) {
        verdict = { type: "good", emoji: "🎯", text: "Lifestyle kamu sehat & seimbang!" };
      } else if (wantsPct > 40) {
        verdict = { type: "warning", emoji: "🛍️", text: `Wants kamu ${wantsPct.toFixed(0)}% — agak boros nih.` };
      } else if (savingsPct < 10) {
        verdict = { type: "warning", emoji: "💰", text: `Savings cuma ${savingsPct.toFixed(0)}% — yuk tingkatkan!` };
      } else {
        verdict = { type: "neutral", emoji: "👀", text: "Lifestyle masih bisa dioptimalkan." };
      }
    }

    // ===== TAB 3: No-Spend Days =====
    const totalDaysInPeriod = Math.max(
      Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1,
      1
    );
    const spendingDates = new Set();
    expenses.forEach((t) => {
      spendingDates.add(t.date);
    });
    const spendingDays = spendingDates.size;
    const noSpendDays = Math.max(totalDaysInPeriod - spendingDays, 0);
    const noSpendPct = totalDaysInPeriod > 0 ? (noSpendDays / totalDaysInPeriod) * 100 : 0;

    // Hitung streak no-spend terpanjang
    const sortedDates = Array.from(spendingDates).sort();
    let longestStreak = 0;
    let currentStreak = 0;
    const cursor = new Date(start);
    cursor.setHours(0, 0, 0, 0);
    const endDay = new Date(end);
    endDay.setHours(0, 0, 0, 0);
    while (cursor <= endDay) {
      const iso = cursor.toISOString().split("T")[0];
      if (!spendingDates.has(iso)) {
        currentStreak++;
        if (currentStreak > longestStreak) longestStreak = currentStreak;
      } else {
        currentStreak = 0;
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    return {
      topMerchants,
      totalExpense,
      needs, wants, savings, needsPct, wantsPct, savingsPct, verdict, totalLifestyle,
      noSpendDays, totalDaysInPeriod, noSpendPct, longestStreak, spendingDays,
    };
  }, [transactions, filterPeriod, customDateRange, allCategoriesConfig]);

  const renderMerchantTab = () => {
    if (data.topMerchants.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <span className="text-3xl mb-2">🏪</span>
          <p className="text-xs text-[#8FA4C8]">Belum ada merchant terdeteksi.</p>
          <p className="text-[10px] text-[#8FA4C8] mt-1">Tambahkan catatan/nama tempat saat catat transaksi.</p>
        </div>
      );
    }
    const max = data.topMerchants[0].total;
    return (
      <div className="space-y-2.5">
        {data.topMerchants.map((m, idx) => {
          const pct = (m.total / max) * 100;
          const pctOfTotal = data.totalExpense > 0 ? (m.total / data.totalExpense) * 100 : 0;
          return (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${idx === 0 ? "bg-[#FF6A00] text-white" : "bg-[#F2F4F7] text-[#8FA4C8]"}`}>
                    {idx + 1}
                  </span>
                  <p className="text-sm font-semibold text-[#1A1A1A] truncate">{m.name}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold text-[#1A1A1A]">{formatShortNumber(m.total)}</p>
                  <p className="text-[9px] text-[#8FA4C8]">{m.count}x · {pctOfTotal.toFixed(0)}%</p>
                </div>
              </div>
              <div className="h-1.5 bg-[#F2F4F7] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: idx === 0 ? "#FF6A00" : "#FFC785" }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderLifestyleTab = () => {
    if (data.totalLifestyle === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <span className="text-3xl mb-2">⚖️</span>
          <p className="text-xs text-[#8FA4C8]">Belum ada data untuk dianalisis.</p>
        </div>
      );
    }
    return (
      <div>
        {/* Stacked bar */}
        <div className="h-3 rounded-full overflow-hidden flex bg-[#F2F4F7] mb-3">
          <div style={{ width: `${data.needsPct}%`, background: "#4F7CFF" }} />
          <div style={{ width: `${data.wantsPct}%`, background: "#FF6B6B" }} />
          <div style={{ width: `${data.savingsPct}%`, background: "#00C9A7" }} />
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center p-2 rounded-xl bg-[#4F7CFF]/10">
            <p className="text-[9px] text-[#8FA4C8] mb-0.5">🏠 Needs</p>
            <p className="text-base font-bold text-[#4F7CFF]">{data.needsPct.toFixed(0)}%</p>
            <p className="text-[9px] text-[#8FA4C8] mt-0.5">target 50%</p>
          </div>
          <div className="text-center p-2 rounded-xl bg-[#FF6B6B]/10">
            <p className="text-[9px] text-[#8FA4C8] mb-0.5">🎉 Wants</p>
            <p className="text-base font-bold text-[#FF6B6B]">{data.wantsPct.toFixed(0)}%</p>
            <p className="text-[9px] text-[#8FA4C8] mt-0.5">target 30%</p>
          </div>
          <div className="text-center p-2 rounded-xl bg-[#00C9A7]/10">
            <p className="text-[9px] text-[#8FA4C8] mb-0.5">💰 Savings</p>
            <p className="text-base font-bold text-[#00C9A7]">{data.savingsPct.toFixed(0)}%</p>
            <p className="text-[9px] text-[#8FA4C8] mt-0.5">target 20%</p>
          </div>
        </div>

        {/* Verdict */}
        {data.verdict && (
          <div className={`p-3 rounded-xl ${
            data.verdict.type === "good" ? "bg-[#00C9A7]/10" :
            data.verdict.type === "warning" ? "bg-[#FFF5F5]" : "bg-[#F2F4F7]"
          }`}>
            <p className="text-xs font-semibold text-[#1A1A1A]">
              {data.verdict.emoji} {data.verdict.text}
            </p>
          </div>
        )}

        <p className="text-[10px] text-[#8FA4C8] mt-2 leading-relaxed">
          <strong>50/30/20 Rule:</strong> 50% kebutuhan, 30% keinginan, 20% tabungan.
        </p>
      </div>
    );
  };

  const renderNoSpendTab = () => {
    if (data.totalDaysInPeriod === 0) return null;
    const verdict = data.noSpendPct >= 30
      ? { emoji: "🏆", text: "Hebat! Disiplin kamu top." }
      : data.noSpendPct >= 15
      ? { emoji: "💪", text: "Lumayan, terus dipertahankan!" }
      : { emoji: "🎯", text: "Coba sisihkan 1 hari per minggu tanpa belanja." };

    return (
      <>
        {/* Big number */}
        <div className="text-center py-4 bg-gradient-to-br from-[#00C9A7]/10 to-[#4F7CFF]/10 rounded-2xl mb-3">
          <p className="text-5xl font-bold text-[#00C9A7] mb-1">{data.noSpendDays}</p>
          <p className="text-xs text-[#8FA4C8]">hari tanpa pengeluaran</p>
          <p className="text-[10px] text-[#8FA4C8] mt-1">dari {data.totalDaysInPeriod} hari · {data.noSpendPct.toFixed(0)}%</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="p-2.5 rounded-xl bg-[#F2F4F7] text-center">
            <p className="text-[10px] text-[#8FA4C8] mb-0.5">🔥 Streak Terlama</p>
            <p className="text-sm font-bold text-[#1A1A1A]">{data.longestStreak} hari</p>
          </div>
          <div className="p-2.5 rounded-xl bg-[#F2F4F7] text-center">
            <p className="text-[10px] text-[#8FA4C8] mb-0.5">💸 Hari Belanja</p>
            <p className="text-sm font-bold text-[#1A1A1A]">{data.spendingDays} hari</p>
          </div>
        </div>

        {/* Verdict */}
        <div className="p-3 rounded-xl bg-[#FFF5F5]">
          <p className="text-xs font-semibold text-[#1A1A1A]">{verdict.emoji} {verdict.text}</p>
        </div>
      </>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🧠</span>
        <div>
          <h3 className="text-[#1A1A1A] font-bold text-base sm:text-lg leading-tight">Behavior Insights</h3>
          <p className="text-[10px] sm:text-xs text-[#8FA4C8] mt-0.5">Pahami kebiasaan finansialmu</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-[#F2F4F7] rounded-xl p-1 mb-4 gap-0.5">
        <button
          onClick={() => setTab("merchant")}
          className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
            tab === "merchant" ? "bg-white text-[#1A1A1A] shadow-sm" : "text-[#8FA4C8]"
          }`}
        >
          <Trophy className="w-3 h-3" />
          Merchant
        </button>
        <button
          onClick={() => setTab("lifestyle")}
          className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
            tab === "lifestyle" ? "bg-white text-[#1A1A1A] shadow-sm" : "text-[#8FA4C8]"
          }`}
        >
          <Scale className="w-3 h-3" />
          50/30/20
        </button>
        <button
          onClick={() => setTab("nospend")}
          className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
            tab === "nospend" ? "bg-white text-[#1A1A1A] shadow-sm" : "text-[#8FA4C8]"
          }`}
        >
          <Coffee className="w-3 h-3" />
          No-Spend
        </button>
      </div>

      {tab === "merchant" && renderMerchantTab()}
      {tab === "lifestyle" && renderLifestyleTab()}
      {tab === "nospend" && renderNoSpendTab()}
    </div>
  );
}