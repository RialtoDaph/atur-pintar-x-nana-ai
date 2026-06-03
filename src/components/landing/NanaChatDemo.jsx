import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Reveal from "./Reveal";

const NANA_RESPONSES = [
  { keywords: ["nabung", "tabung", "saving"], reply: "Dari pola yang sering aku lihat, nabung itu lebih berhasil kalau langsung disisihkan di awal bulan, bukan nunggu sisa akhir bulan. Coba tentukan nominal tetap dulu, sekecil apapun itu. Konsistensi lebih penting dari jumlahnya." },
  { keywords: ["boros", "hemat", "pengeluaran berlebih"], reply: "Ngerasa boros itu wajar, biasanya bukan soal jumlah pengeluarannya, tapi karena belum ada tracking yang jelas. Coba catat pengeluaran selama 3 hari aja dulu. Dari situ biasanya langsung kelihatan polanya." },
  { keywords: ["investasi", "invest", "saham", "reksa"], reply: "Sebelum investasi, pastikan dulu kamu punya dana darurat minimal 3 bulan pengeluaran. Kalau sudah ada, reksa dana pasar uang bisa jadi titik mulai yang aman, risikonya rendah dan bisa dicairkan kapan saja." },
  { keywords: ["gaji", "salary", "penghasilan", "income"], reply: "Gaji berapapun bisa diatur kalau sistemnya sudah jelas. Formula 50-30-20 bisa jadi titik awal: 50% untuk kebutuhan, 30% keinginan, 20% tabungan. Proporsinya bisa disesuaikan dengan kondisi kamu." },
  { keywords: ["hutang", "utang", "cicilan", "kredit"], reply: "Ada dua strategi yang umum dipakai. Pertama, bayar yang bunga paling besar dulu (debt avalanche), paling hemat secara matematis. Kedua, bayar yang nominal paling kecil dulu (debt snowball), lebih terasa progresnya. Pilih yang paling cocok sama psikologi kamu." },
  { keywords: ["budget", "anggaran", "planning"], reply: "Mulai dari catat semua pengeluaran bulan lalu, dari situ kamu bisa lihat mana yang fixed dan mana yang variable. Setelah itu baru tentukan batas untuk tiap kategori. Jangan terlalu ketat di awal, nanti susah diikutin." },
  { keywords: ["darurat", "emergency"], reply: "Standarnya 3 sampai 6 bulan pengeluaran bulanan kamu. Simpan di tempat yang likuid seperti rekening tabungan biasa atau reksa dana pasar uang, bukan deposito yang ada jatuh temponya." },
  { keywords: ["belanja", "shopee", "tokopedia", "lazada", "online"], reply: "Platform belanja online memang dirancang supaya kamu impulsif. Coba pakai teknik wishlist 24 jam: kalau mau beli sesuatu, masukin wishlist dulu. Tunggu sehari. Kalau masih mau, baru beli. Lebih dari 60% biasanya sudah tidak jadi." },
  { keywords: ["motor", "mobil", "rumah", "kpr", "beli"], reply: "Bagus punya tujuan yang spesifik. Tentukan harga targetnya, lalu bagi dengan berapa bulan kamu mau mencapainya, itu nominal yang harus disisihkan tiap bulan. Yang penting angkanya jelas dulu." }
];

const QUICK_QUESTIONS = [
  { emoji: "💰", label: "Cara nabung yang bener", text: "Cara nabung yang bener itu gimana?" },
  { emoji: "📉", label: "Kok selalu boros?", text: "Kok aku selalu boros ya?" },
  { emoji: "📈", label: "Mulai investasi", text: "Gimana cara mulai investasi?" },
  { emoji: "💸", label: "Atur hutang", text: "Gimana cara atur hutang yang banyak?" }
];

function getNanaReply(input) {
  const lower = input.toLowerCase();
  for (const { keywords, reply } of NANA_RESPONSES) {
    if (keywords.some((k) => lower.includes(k))) return reply;
  }
  return "Pertanyaan yang bagus! Tapi untuk jawaban yang benar-benar personal, aku butuh lihat kondisi keuangan kamu yang sesungguhnya. Daftar gratis sekarang dan kita bisa ngobrol lebih dalam dengan data yang nyata.";
}

export default function NanaChatDemo() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { role: "nana", text: "Halo! Aku Nana, asisten keuangan kamu 👋 Tanya apa saja soal keuangan, nabung, investasi, hutang, atau apapun yang lagi bikin pusing." }
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [questionsLeft, setQuestionsLeft] = useState(2);
  const [done, setDone] = useState(false);
  const [showQuick, setShowQuick] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    const el = bottomRef.current;
    if (!el) return;
    const container = el.parentElement;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages, typing]);

  const sendMessage = (text) => {
    if (!text.trim() || typing || done) return;
    setShowQuick(false);
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setTyping(true);
    setTimeout(() => {
      const reply = getNanaReply(text);
      setMessages((prev) => [...prev, { role: "nana", text: reply }]);
      setTyping(false);
      const newLeft = questionsLeft - 1;
      setQuestionsLeft(newLeft);
      if (newLeft <= 0) {
        setDone(true);
        setTimeout(() => {
          setMessages((prev) => [...prev, { role: "nana", text: "Penasaran kan? Aku sudah tunjukkan sedikit dari yang bisa aku lakukan. Kalau kamu daftar gratis, aku bisa lihat kondisi keuangan kamu yang sebenarnya dan bantu lebih dalam. Yuk mulai sekarang 🧡" }]);
        }, 800);
      }
    }, 1500);
  };

  const handleSend = () => sendMessage(input.trim());

  return (
    <section id="nana-demo" className="pb-16 px-5 sm:px-12 lg:px-20 relative z-10">
      <div className="max-w-xl mx-auto">
        <Reveal>
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-1 text-center">Kenalan sama Nana.</h2>
        </Reveal>
        <Reveal delay={60}>
          <p className="text-center text-white/40 text-xs mb-6">AI bestie finansialmu, tanya apa saja soal keuangan.</p>
        </Reveal>
        <Reveal delay={120}>
          <div className="card-d rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-[#F97316] flex items-center justify-center flex-shrink-0">
                <img src="https://media.base44.com/images/public/69a82e8090f60786b869983c/51c7f5e6a_Nana_AI.png" alt="Avatar Nana AI — asisten keuangan virtual Atur Pintar" loading="lazy" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
              </div>
              <div>
                <p className="text-white text-xs font-bold leading-none">Nana AI</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <p className="text-white/40 text-[10px]">Online</p>
                </div>
              </div>
              {questionsLeft > 0 && !done && (
                <div className="ml-auto text-[10px] text-white/25 bg-white/5 px-2 py-1 rounded-full">{questionsLeft} pertanyaan gratis</div>
              )}
            </div>

            {/* Quick questions */}
            {showQuick && !done && (
              <div className="px-4 pt-3 pb-1">
                <p className="text-white/30 text-[10px] mb-2">Mau tanya soal apa?</p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_QUESTIONS.map((q, i) => (
                    <button key={i} onClick={() => sendMessage(q.text)} disabled={typing}
                      className="flex items-center gap-1 text-[10px] text-white/70 border border-white/10 hover:border-[#F97316]/50 hover:text-white bg-white/4 hover:bg-[#F97316]/10 rounded-full px-2.5 py-1 transition-all disabled:opacity-40">
                      <span>{q.emoji}</span> {q.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
                  {m.role === "nana" && (
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-[#F97316] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <img src="https://media.base44.com/images/public/69a82e8090f60786b869983c/51c7f5e6a_Nana_AI.png" alt="Avatar Nana AI" loading="lazy" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
                    </div>
                  )}
                  <div className={`rounded-2xl px-3 py-2.5 max-w-[85%] text-xs leading-relaxed ${m.role === "nana" ? "bg-white/6 rounded-tl-sm text-white/80" : "bg-[#F97316] rounded-tr-sm text-white"}`}>
                    {m.text}
                  </div>
                  {m.role === "user" && (
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-[9px] flex-shrink-0 mt-0.5">K</div>
                  )}
                </div>
              ))}
              {typing && (
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-[#F97316] flex items-center justify-center flex-shrink-0">
                    <img src="https://media.base44.com/images/public/69a82e8090f60786b869983c/51c7f5e6a_Nana_AI.png" alt="Nana sedang mengetik" loading="lazy" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
                  </div>
                  <div className="bg-white/6 rounded-2xl rounded-tl-sm px-3 py-2.5">
                    <span className="text-white/40 text-xs">Nana mengetik<span className="typing-dots">...</span></span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-3 pb-3 border-t border-white/8 pt-2">
              {done ? (
                <button onClick={() => navigate("/register")} className="w-full py-3 bg-[#F97316] rounded-xl text-white text-sm font-bold hover:bg-[#e05e00] transition-colors">
                  Mulai Gratis Sekarang →
                </button>
              ) : (
                <div className="flex gap-2">
                  <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Atau ketik sendiri..." disabled={typing || done}
                    style={{ fontSize: "16px" }}
                    className="bg-white/5 text-white px-3 py-2.5 sm:text-xs rounded-xl flex-1 border border-white/8 placeholder-white/25 outline-none focus:border-[#F97316]/40 disabled:opacity-40" />
                  <button onClick={handleSend} disabled={typing || !input.trim() || done}
                    className="w-9 h-9 rounded-xl bg-[#F97316] flex items-center justify-center text-white hover:bg-[#e05e00] transition-colors disabled:opacity-40">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </Reveal>
      </div>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .typing-dots { animation: blink 1.2s infinite; }
      `}</style>
    </section>
  );
}