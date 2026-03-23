import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Loader2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import ReactMarkdown from "react-markdown";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { useAppSettings } from "@/components/utils/useAppSettings";

export default function AIFinancialNarrative({ trendData, pieData, totalIncome, totalExpenses, savingsRate, periodLabel }) {
  const { formatCurrency, formatShortNumber } = useAppSettings();
  const [narrative, setNarrative] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [activeChart, setActiveChart] = useState("line"); // "line" | "pie"

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
      setNarrative(typeof res === "string" ? res : res?.response || "");
    } catch (e) {
      setNarrative("Gagal memuat analisis. Coba lagi.");
    }
    setLoading(false);
  }

  const netFlow = totalIncome - totalExpenses;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF6A00] to-[#FF9A3C] flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#1A1A1A]">Analisis AI Keuangan Bulanan</p>
            <p className="text-xs text-[#8FA4C8]">{periodLabel} · Powered by Nana AI</p>
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
          {/* Chart Tabs */}
          <div className="px-4 sm:px-5 mb-3">
            <div className="flex bg-[#F2F4F7] rounded-xl p-1 w-fit">
              <button
                onClick={() => setActiveChart("line")}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeChart === "line" ? "bg-white text-[#1A1A1A] shadow-sm" : "text-[#8FA4C8]"
                }`}
              >
                📈 Tren
              </button>
              <button
                onClick={() => setActiveChart("pie")}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeChart === "pie" ? "bg-white text-[#1A1A1A] shadow-sm" : "text-[#8FA4C8]"
                }`}
              >
                🥧 Kategori
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

            {activeChart === "pie" && pieData.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} strokeWidth={0}>
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [formatCurrency(v), undefined]} contentStyle={{ borderRadius: 12, border: "none", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 w-full sm:w-auto min-w-[160px] pb-3 sm:pb-0 px-1">
                  {pieData.slice(0, 5).map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-[#4A5568] flex-1 truncate">{d.emoji} {d.name}</span>
                      <span className="font-semibold text-[#1A1A1A] whitespace-nowrap">{((d.value / totalExpenses) * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Metrics strip */}
          <div className="grid grid-cols-4 gap-1.5 px-4 sm:px-5 mt-3 mb-3">
            <div className="bg-[#F2F4F7] rounded-lg p-2 text-center">
              <p className="text-[9px] text-[#8FA4C8] mb-0.5">Pemasukan</p>
              <p className="text-xs font-bold text-[#00C9A7]">{formatShortNumber(totalIncome)}</p>
            </div>
            <div className="bg-[#F2F4F7] rounded-lg p-2 text-center">
              <p className="text-[9px] text-[#8FA4C8] mb-0.5">Pengeluaran</p>
              <p className="text-xs font-bold text-[#FF6B6B]">{formatShortNumber(totalExpenses)}</p>
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
    </div>
  );
}