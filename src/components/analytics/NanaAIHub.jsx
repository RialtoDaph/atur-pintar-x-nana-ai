import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Loader2, RefreshCw, BookOpen, TrendingUp, ArrowUp, ArrowDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";
import { useAppSettings } from "@/components/utils/useAppSettings";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import MonthEndForecastCard from "./MonthEndForecastCard";

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

const NANA_AVATAR = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a82e8090f60786b869983c/7708b64f5_generated_image.png";
const MONTHS_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export default function NanaAIHub({
  trendData, pieData, totalIncome, totalExpenses, savingsRate,
  periodLabel, periodSubtitle,
  hasPrevData, prevIncome, prevExpenses, prevSavingsRate,
  budgets = [], transactions = [],
  filterPeriod, customDateRange,
}) {
  const { formatCurrency, formatShortNumber } = useAppSettings();
  const [tab, setTab] = useState("narasi");
  const [narrative, setNarrative] = useState(null);
  const [loading, setLoading] = useState(false);

  const hasData = trendData.some(d => d.Income > 0 || d.Expenses > 0);
  const netFlow = totalIncome - totalExpenses;

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
      const text = typeof res === "string"
        ? res
        : (res?.response || res?.text || res?.content || res?.output || "");
      setNarrative(text || "Hmm, Nana belum bisa kasih analisis kali ini. Coba lagi ya!");
    } catch (e) {
      console.error("[NanaAIHub] InvokeLLM failed:", e);
      setNarrative("Gagal memuat analisis. Coba lagi.");
    }
    setLoading(false);
  }

  const tabs = [
    { id: "narasi", label: "Narasi", icon: BookOpen },
    { id: "tren", label: "Tren", icon: TrendingUp },
    { id: "forecast", label: "Forecast", icon: Sparkles },
    { id: "budget", label: "Budget", icon: TrendingUp },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-5 sm:p-6 pb-3">
        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-[#FF6A00]">
          <img src={NANA_AVATAR} alt="Nana" className="w-full h-full object-contain" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm sm:text-base font-bold text-[#1A1A1A]">Nana AI Hub</p>
          <p className="text-[10px] sm:text-xs text-[#8FA4C8]">{periodSubtitle || periodLabel}</p>
        </div>
      </div>

      {/* Empty state */}
      {!hasData ? (
        <div className="flex flex-col items-center justify-center px-6 py-8 text-center">
          <span className="text-4xl mb-3">📊</span>
          <p className="font-semibold text-[#1A1A1A] text-sm mb-1">Belum ada data untuk dianalisis nih!</p>
          <p className="text-xs text-[#8FA4C8] mb-4">Yuk mulai catat transaksi kamu, biar Nana bisa kasih insight</p>
          <Link
            to={createPageUrl("Transactions")}
            className="px-4 py-2 bg-[#FF6A00] text-white text-xs font-semibold rounded-xl hover:bg-[#e55f00] transition-colors"
          >
            Catat Transaksi Sekarang
          </Link>
        </div>
      ) : (
        <>
          {/* Scrollable Tabs */}
          <div className="px-5 sm:px-6 pb-3">
            <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
              {tabs.map(({ id, label, icon: Icon }) => {
                const active = tab === id;
                return (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 tap-highlight-fix ${
                      active ? "bg-[#FF6A00] text-white shadow-sm" : "bg-[#F2F4F7] text-[#8FA4C8]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab content */}
          <div className="px-5 sm:px-6 pb-5 sm:pb-6">
            {tab === "narasi" && (
              <NarasiTab narrative={narrative} loading={loading} onGenerate={generateNarrative} />
            )}

            {tab === "tren" && (
              <TrendTab trendData={trendData} formatCurrency={formatCurrency} formatShortNumber={formatShortNumber} />
            )}

            {tab === "forecast" && (
              <MonthEndForecastCard transactions={transactions} budgets={budgets} embedded />
            )}

            {tab === "budget" && (
              <BudgetTab
                budgets={budgets}
                transactions={transactions}
                formatCurrency={formatCurrency}
                formatShortNumber={formatShortNumber}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ===== Sub-tab: Narasi =====
function NarasiTab({ narrative, loading, onGenerate }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-[#8FA4C8]">
        <Loader2 className="w-4 h-4 animate-spin text-[#FF6A00]" />
        Nana sedang menganalisis...
      </div>
    );
  }

  if (!narrative) {
    return (
      <button
        onClick={onGenerate}
        className="w-full flex items-center justify-center gap-2 py-8 text-sm font-semibold text-[#FF6A00] bg-[#FF6A00]/5 hover:bg-[#FF6A00]/10 transition-colors rounded-xl border border-dashed border-[#FF6A00]/30"
      >
        <Sparkles className="w-4 h-4" />
        Analisis dengan Nana AI
      </button>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-[#8FA4C8] uppercase tracking-widest">Rangkuman Nana</p>
        <button
          onClick={onGenerate}
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
  );
}

// ===== Sub-tab: Tren =====
function TrendTab({ trendData, formatCurrency, formatShortNumber }) {
  return (
    <>
      <div className="flex items-center justify-center gap-4 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00C9A7]" />
          <span className="text-[10px] font-semibold text-[#8FA4C8]">Pemasukan</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B6B]" />
          <span className="text-[10px] font-semibold text-[#8FA4C8]">Pengeluaran</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
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
    </>
  );
}

// ===== Sub-tab: Budget =====
function BudgetTab({ budgets, transactions, formatCurrency, formatShortNumber }) {
  const now = new Date();
  const data = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const totalBudget = budgets.filter(b => b.month === monthKey).reduce((s, b) => s + (b.amount || 0), 0);
    const totalActual = transactions.filter(t => {
      if (t.type !== "expense") return false;
      const td = new Date(t.date);
      return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
    }).reduce((s, t) => s + (t.amount || 0), 0);
    data.push({ name: MONTHS_ID[d.getMonth()], Budget: totalBudget, Aktual: totalActual });
  }
  const hasAnyBudget = data.some(d => d.Budget > 0);

  if (!hasAnyBudget) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <span className="text-3xl mb-2">💸</span>
        <p className="text-xs text-[#8FA4C8] mb-3">Belum ada budget yang dibuat.</p>
        <Link to={createPageUrl("Budget")} className="px-3 py-1.5 bg-[#FF6A00] text-white text-xs font-semibold rounded-lg">Buat Budget</Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-center gap-4 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#4F7CFF]" />
          <span className="text-[10px] font-semibold text-[#8FA4C8]">Budget</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B6B]" />
          <span className="text-[10px] font-semibold text-[#8FA4C8]">Aktual</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
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
    </>
  );
}