import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Loader2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import ReactMarkdown from "react-markdown";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell
} from "recharts";
import { useAppSettings } from "@/components/utils/useAppSettings";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowUp, ArrowDown } from "lucide-react";

function DeltaTag({ current, prev, higherIsBetter = true }) {
  if (prev == null || prev === 0) return null;
  const diff = current - prev;
  const pct = Math.abs((diff / prev) * 100).toFixed(0);
  if (Math.abs(diff) < 0.01) return null;
  const isPositive = diff > 0;
  const isGood = higherIsBetter ? isPositive : !isPositive;
  return (
    <span className={`flex items-center gap-0.5 text-[8px] font-semibold mt-0.5 justify-center ${isGood ? "text-[#00C9A7]" : "text-[#FF6B6B]"}`}>
      {isPositive ? <ArrowUp className="w-2 h-2" /> : <ArrowDown className="w-2 h-2" />}
      {pct}%
    </span>
  );
}

export default function AIFinancialNarrative({ trendData, pieData, totalIncome, totalExpenses, savingsRate, periodLabel, periodSubtitle, goals = [], hasPrevData, prevIncome, prevExpenses, prevSavingsRate, budgets = [], transactions = [] }) {
  const { formatCurrency, formatShortNumber } = useAppSettings();
  const [narrative, setNarrative] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [activeChart, setActiveChart] = useState("line");

  const hasData = trendData.some(d => d.Income > 0 || d.Expenses > 0);

  async function generateNarrative() {
    setLoading(true);
    setNarrative(null);

    const trendText = trendData.map(d =>
      `- ${d.name}: Pemasukan Rp ${Math.round(d.Income || 0).toLocaleString("id-ID")}, Pengeluaran Rp ${Math.round(d.Expenses || 0).toLocaleString("id-ID")}`
    ).join("\n");

    const categoryText = pieData.slice(0, 6).map(d =>
      `- ${d.emoji || ""} ${d.name}: Rp ${Math.round(d.value).toLocaleString("id-ID")} (${((d.value / totalExpenses) * 100).toFixed(0)}%)`
    ).join("\n");

    const prompt = `Kamu adalah Nana, asisten keuangan pribadi yang ramah dan cerdas. Analisis data keuangan berikut dan buat rangkuman performa keuangan dalam narasi teks yang mudah dipahami, personal, dan motivatif.

PERIODE: ${periodLabel}

TREN BULANAN:
${trendText}

BREAKDOWN PENGELUARAN TERBESAR:
${categoryText}

TOTAL PEMASUKAN: Rp ${Math.round(totalIncome).toLocaleString("id-ID")}
TOTAL PENGELUARAN: Rp ${Math.round(totalExpenses).toLocaleString("id-ID")}
TINGKAT TABUNGAN: ${savingsRate}%

Tulis narasi dalam format:
1. Satu paragraf ringkasan performa keseluruhan (2-3 kalimat, personal, gunakan kata "kamu")
2. **Hal terbaik bulan ini** — apa yang berhasil
3. **Yang perlu diperhatikan** — area yang butuh perbaikan  
4. **Satu saran praktis** — langkah konkret yang bisa dilakukan minggu ini

Tone: hangat, supportif, tidak menghakimi. Maksimal 200 kata total. Gunakan angka spesifik dari data.`;

    try {
      const res = await base44.integrations.Core.InvokeLLM({ prompt });
      // InvokeLLM bisa return string langsung, atau object dengan field text/response/content
      const text = typeof res === "string"
        ? res
        : (res?.response || res?.text || res?.content || res?.output || "");
      setNarrative(text || "Hmm, Nana belum bisa kasih analisis kali ini. Coba lagi ya!");
    } catch (e) {
      console.error("[AIFinancialNarrative] InvokeLLM failed:", e);
      setNarrative("Gagal memuat analisis. Coba lagi.");
    }
    setLoading(false);
  }

  const netFlow = totalIncome - totalExpenses;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-5 pr-14">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border-2 border-[#FF6A00]">
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a82e8090f60786b869983c/7708b64f5_generated_image.png" alt="Nana" className="w-full h-full object-contain" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#1A1A1A]">Analisis AI Keuangan Bulanan</p>
            <p className="text-xs text-[#8FA4C8]">{periodSubtitle || periodLabel} · Powered by Nana AI</p>
          </div>
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-[#8FA4C8] hover:text-[#1A1A1A] transition-colors tap-highlight-fix"
        >
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {expanded && (
        <>
          {/* Empty state */}
          {!hasData ? (
            <div className="flex flex-col items-center justify-center px-6 py-8 text-center">
              <span className="text-4xl mb-3">📊</span>
              <p className="font-semibold text-[#1A1A1A] text-sm mb-1">Belum ada data untuk dianalisis nih!</p>
              <p className="text-xs text-[#8FA4C8] mb-4">Yuk mulai catat transaksi kamu, biar Nana bisa kasih insight yang keren</p>
              <Link
                to={createPageUrl("Transactions")}
                className="px-4 py-2 bg-[#FF6A00] text-white text-xs font-semibold rounded-xl hover:bg-[#e55f00] transition-colors"
              >
                Catat Transaksi Sekarang
              </Link>
            </div>
          ) : (
            <>
              {/* Chart Tabs */}
              <div className="px-4 sm:px-5 mb-3">
                <div className="flex bg-[#F2F4F7] rounded-xl p-1 w-fit">
                  <button
                    onClick={() => setActiveChart("line")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeChart === "line" ? "bg-white text-[#1A1A1A] shadow-sm" : "text-[#8FA4C8]"
                    }`}
                  >
                    📈 Tren
                  </button>
                  <button
                    onClick={() => setActiveChart("budget")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeChart === "budget" ? "bg-white text-[#1A1A1A] shadow-sm" : "text-[#8FA4C8]"
                    }`}
                  >
                    💸 Budget
                  </button>
                </div>
              </div>

              {/* Charts */}
              <div className="px-4 sm:px-5">
                {activeChart === "line" && (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={trendData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F2F4F7" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#8FA4C8" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#8FA4C8" }} axisLine={false} tickLine={false} tickFormatter={v => formatShortNumber(v)} />
                      <Tooltip
                        formatter={(v) => [formatCurrency(v), undefined]}
                        contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }}
                      />
                      <Line type="monotone" dataKey="Income" stroke="#00C9A7" strokeWidth={2.5} dot={{ r: 4, fill: "#00C9A7" }} name="Pemasukan" />
                      <Line type="monotone" dataKey="Expenses" stroke="#FF6B6B" strokeWidth={2.5} dot={{ r: 4, fill: "#FF6B6B" }} name="Pengeluaran" />
                    </LineChart>
                  </ResponsiveContainer>
                )}

                {activeChart === "budget" && (() => {
                  const MONTHS_ID = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
                  const now = new Date();
                  const budgetData = [];
                  for (let i = 5; i >= 0; i--) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                    const totalBudget = budgets.filter(b => b.month === monthKey).reduce((s, b) => s + (b.amount || 0), 0);
                    const totalActual = transactions.filter(t => {
                      if (t.type !== "expense") return false;
                      const td = new Date(t.date);
                      return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
                    }).reduce((s, t) => s + (t.amount || 0), 0);
                    budgetData.push({ name: MONTHS_ID[d.getMonth()], Budget: totalBudget, Aktual: totalActual });
                  }
                  const hasAnyBudget = budgetData.some(d => d.Budget > 0);
                  if (!hasAnyBudget) {
                    return (
                      <div className="flex flex-col items-center justify-center h-40 text-center">
                        <span className="text-3xl mb-2">💸</span>
                        <p className="text-xs text-[#8FA4C8] mb-3">Belum ada budget yang dibuat.</p>
                        <Link to={createPageUrl("Budget")} className="px-3 py-1.5 bg-[#FF6A00] text-white text-xs font-semibold rounded-lg">Buat Budget</Link>
                      </div>
                    );
                  }
                  return (
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={budgetData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F2F4F7" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#8FA4C8" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: "#8FA4C8" }} axisLine={false} tickLine={false} tickFormatter={v => formatShortNumber(v)} />
                        <Tooltip
                          formatter={(v) => [formatCurrency(v), undefined]}
                          contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }}
                        />
                        <Line type="monotone" dataKey="Budget" stroke="#4F7CFF" strokeWidth={2.5} dot={{ r: 4, fill: "#4F7CFF" }} name="Budget" />
                        <Line type="monotone" dataKey="Aktual" stroke="#FF6B6B" strokeWidth={2.5} dot={{ r: 4, fill: "#FF6B6B" }} name="Aktual" />
                      </LineChart>
                    </ResponsiveContainer>
                  );
                })()}

              </div>

              {/* Metrics strip */}
              <div className="grid grid-cols-4 gap-1.5 px-4 sm:px-5 mt-3 mb-3">
                <div className="bg-[#F2F4F7] rounded-lg p-2 text-center">
                  <p className="text-[9px] text-[#8FA4C8] mb-0.5">Pemasukan</p>
                  <p className="text-xs font-bold text-[#00C9A7]">{formatShortNumber(totalIncome)}</p>
                  {hasPrevData && <DeltaTag current={totalIncome} prev={prevIncome} higherIsBetter={true} />}
                </div>
                <div className="bg-[#F2F4F7] rounded-lg p-2 text-center">
                  <p className="text-[9px] text-[#8FA4C8] mb-0.5">Pengeluaran</p>
                  <p className="text-xs font-bold text-[#FF6B6B]">{formatShortNumber(totalExpenses)}</p>
                  {hasPrevData && <DeltaTag current={totalExpenses} prev={prevExpenses} higherIsBetter={false} />}
                </div>
                <div className={`rounded-lg p-2 text-center ${netFlow >= 0 ? "bg-[#00C9A7]/10" : "bg-[#FF6B6B]/10"}`}>
                  <p className="text-[9px] text-[#8FA4C8] mb-0.5">Net Flow</p>
                  <p className={`text-xs font-bold ${netFlow >= 0 ? "text-[#00C9A7]" : "text-[#FF6B6B]"}`}>
                    {netFlow >= 0 ? "+" : ""}{formatShortNumber(netFlow)}
                  </p>
                </div>
                <div className="bg-[#4F7CFF]/10 rounded-lg p-2 text-center">
                  <p className="text-[9px] text-[#8FA4C8] mb-0.5">Tabungan</p>
                  <p className="text-xs font-bold text-[#4F7CFF]">{savingsRate}%</p>
                  {hasPrevData && prevSavingsRate != null && <DeltaTag current={parseFloat(savingsRate)} prev={prevSavingsRate} higherIsBetter={true} />}
                </div>
              </div>

              {/* AI Narrative */}
              <div className="mx-4 sm:mx-5 mb-4 border border-[#F2F4F7] rounded-xl overflow-hidden">
                {!narrative && !loading && (
                  <button
                    onClick={generateNarrative}
                    className="w-full flex items-center justify-center gap-2 py-4 text-sm font-semibold text-[#FF6A00] hover:bg-[#FF6A00]/5 transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    Analisis dengan AI
                  </button>
                )}

                {loading && (
                  <div className="flex items-center justify-center gap-2 py-5 text-sm text-[#8FA4C8]">
                    <Loader2 className="w-4 h-4 animate-spin text-[#FF6A00]" />
                    Nana sedang menganalisis data kamu...
                  </div>
                )}

                {narrative && !loading && (
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest">Rangkuman Nana AI</p>
                      <button
                        onClick={generateNarrative}
                        className="flex items-center gap-1 text-[10px] text-[#8FA4C8] hover:text-[#FF6A00] transition-colors tap-highlight-fix"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Perbarui
                      </button>
                    </div>
                    <ReactMarkdown className="prose prose-sm max-w-none text-[#1A1A1A] text-xs sm:text-sm [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:my-2 [&>li]:mb-1 [&>strong]:font-semibold [&>strong]:text-[#1A1A1A]">
                      {narrative}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}