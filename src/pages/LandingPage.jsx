import { useRef, useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowRight, CheckCircle, Mail, Instagram, Twitter, Sparkles, ChevronRight, ChevronDown, ChevronUp, X } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
const NANA_AVATAR_URL = "https://api.dicebear.com/7.x/adventurer/svg?seed=Nana&backgroundColor=f97316";
const VIDEO_URL = "https://www.youtube.com/embed/6KazLzryNbM";

// ─── Matrix background ────────────────────────────────────────────────────────
function MatrixBackground() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    const cols = Math.floor(w / 18);
    const drops = Array(cols).fill(1);
    const chars = "01アイウエオカキクケコABCDEF∑∆∫πΩ";
    let raf;
    const draw = () => {
      ctx.fillStyle = "rgba(10,10,10,0.06)";
      ctx.fillRect(0, 0, w, h);
      ctx.font = "13px monospace";
      drops.forEach((y, i) => {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const progress = y / (h / 13);
        if (progress < 0.3) ctx.fillStyle = `rgba(255,106,0,${0.6 + Math.random() * 0.4})`;else
        if (progress < 0.6) ctx.fillStyle = `rgba(255,179,71,${0.3 + Math.random() * 0.3})`;else
        ctx.fillStyle = `rgba(255,106,0,${0.05 + Math.random() * 0.15})`;
        ctx.fillText(char, i * 18, y * 13);
        if (y * 13 > h && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    const onResize = () => {w = canvas.width = window.innerWidth;h = canvas.height = window.innerHeight;};
    window.addEventListener("resize", onResize);
    return () => {cancelAnimationFrame(raf);window.removeEventListener("resize", onResize);};
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0, opacity: 0.45 }} />;
}

// ─── Scroll reveal ────────────────────────────────────────────────────────────
function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {if (e.isIntersecting) {setVisible(true);obs.disconnect();}}, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({ children, delay = 0, className = "" }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} className={className} style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(28px)", transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms` }}>
      {children}
    </div>);

}

// ─── FOMO Toast ───────────────────────────────────────────────────────────────
const MALE_NAMES = ["Rizky", "Fajar", "Dimas", "Aldi", "Bagas", "Reza", "Hafiz", "Arif", "Yusuf", "Bima", "Gilang", "Radit", "Ihsan", "Naufal", "Kevin", "Andre", "Daffa", "Rangga", "Wahyu", "Hanif", "Rio", "Fikri", "Zaky", "Galih", "Yoga"];
const FEMALE_NAMES = ["Devina", "Ayu", "Siti", "Nadia", "Rania", "Putri", "Tiara", "Salsa", "Fira", "Mega", "Indah", "Desi", "Rina", "Wulan", "Anggi", "Cindy", "Della", "Vina", "Yanti", "Hana", "Shinta", "Laras", "Mira", "Fitri", "Nurul"];
const CITIES = ["Jakarta", "Bandung", "Surabaya", "Medan", "Yogyakarta", "Semarang", "Bali", "Makassar"];
const TIME_LABELS = ["barusan", "1 mnt lalu", "2 mnt lalu", "3 mnt lalu", "5 mnt lalu", "7 mnt lalu", "8 mnt lalu", "10 mnt lalu", "12 mnt lalu", "15 mnt lalu"];

function shuffle(arr) {return [...arr].sort(() => Math.random() - 0.5);}

function FomoToast({ data, visible }) {
  return (
    <div style={{
      position: "fixed", top: 68, left: 12, zIndex: 9999, maxWidth: 220,
      background: "#ffffff", borderRadius: 10, padding: "7px 11px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(-8px)",
      transition: "opacity 0.35s ease, transform 0.35s ease",
      pointerEvents: "none"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
        <div>
          <p style={{ margin: 0, fontSize: 10, color: "#111", lineHeight: 1.4 }}>
            <span style={{ color: "#f97316", fontWeight: 700 }}>{data.name}</span>
            {" "}dari {data.city} bergabung 🎉
          </p>
          <p style={{ margin: "1px 0 0", fontSize: 9, color: "#999" }}>{data.time}</p>
        </div>
      </div>
    </div>);

}

// ─── Scroll Progress ──────────────────────────────────────────────────────────
function ScrollProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop || document.body.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      setPct(total > 0 ? scrolled / total * 100 : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div style={{ position: "fixed", right: 4, top: "50%", transform: "translateY(-50%)", zIndex: 9998, height: 160, width: 3, borderRadius: 4, background: "rgba(255,106,0,0.12)", pointerEvents: "none" }}>
      <div style={{ width: "100%", height: `${pct}%`, background: "#FF6A00", borderRadius: 4, transition: "height 0.1s" }} />
    </div>);

}

// ─── NANA Chat Demo ───────────────────────────────────────────────────────────
const NANA_RESPONSES = [
{ keywords: ["nabung", "tabung", "saving"], reply: "Dari pola yang sering aku lihat, nabung itu lebih berhasil kalau langsung disisihkan di awal bulan — bukan nunggu sisa akhir bulan. Coba tentukan nominal tetap dulu, sekecil apapun itu. Konsistensi lebih penting dari jumlahnya." },
{ keywords: ["boros", "hemat", "pengeluaran berlebih"], reply: "Ngerasa boros itu wajar — biasanya bukan soal jumlah pengeluarannya, tapi karena belum ada tracking yang jelas. Coba catat pengeluaran selama 3 hari aja dulu. Dari situ biasanya langsung kelihatan polanya." },
{ keywords: ["investasi", "invest", "saham", "reksa"], reply: "Sebelum investasi, pastikan dulu kamu punya dana darurat minimal 3 bulan pengeluaran. Kalau sudah ada, reksa dana pasar uang bisa jadi titik mulai yang aman — risikonya rendah dan bisa dicairkan kapan saja." },
{ keywords: ["gaji", "salary", "penghasilan", "income"], reply: "Gaji berapapun bisa diatur kalau sistemnya sudah jelas. Formula 50-30-20 bisa jadi titik awal — 50% untuk kebutuhan, 30% keinginan, 20% tabungan. Proporsinya bisa disesuaikan dengan kondisi kamu." },
{ keywords: ["hutang", "utang", "cicilan", "kredit"], reply: "Ada dua strategi yang umum dipakai. Pertama, bayar yang bunga paling besar dulu — debt avalanche, paling hemat secara matematis. Kedua, bayar yang nominal paling kecil dulu — debt snowball, lebih terasa progresnya. Pilih yang paling cocok sama psikologi kamu." },
{ keywords: ["budget", "anggaran", "planning"], reply: "Mulai dari catat semua pengeluaran bulan lalu — dari situ kamu bisa lihat mana yang fixed dan mana yang variable. Setelah itu baru tentukan batas untuk tiap kategori. Jangan terlalu ketat di awal, nanti susah diikutin." },
{ keywords: ["darurat", "emergency"], reply: "Standarnya 3–6 bulan pengeluaran bulanan kamu. Simpan di tempat yang likuid — rekening tabungan biasa atau reksa dana pasar uang, bukan deposito yang ada jatuh temponya." },
{ keywords: ["belanja", "shopee", "tokopedia", "lazada", "online"], reply: "Platform belanja online memang dirancang supaya kamu impulsif. Coba pakai teknik wishlist 24 jam: kalau mau beli sesuatu, masukin wishlist dulu. Tunggu sehari. Kalau masih mau, baru beli. Lebih dari 60% biasanya sudah tidak jadi." },
{ keywords: ["motor", "mobil", "rumah", "kpr", "beli"], reply: "Bagus punya tujuan yang spesifik. Tentukan harga targetnya, lalu bagi dengan berapa bulan kamu mau mencapainya — itu nominal yang harus disisihkan tiap bulan. Yang penting angkanya jelas dulu." }];


function getNanaReply(input) {
  const lower = input.toLowerCase();
  for (const { keywords, reply } of NANA_RESPONSES) {
    if (keywords.some((k) => lower.includes(k))) return reply;
  }
  return "Pertanyaan yang bagus! Tapi untuk jawaban yang benar-benar personal, aku butuh lihat kondisi keuangan kamu yang sesungguhnya. Daftar dulu — begitu akses dibuka, kita bisa ngobrol lebih dalam dengan data yang nyata.";
}

const QUICK_QUESTIONS = [
{ emoji: "💰", label: "Cara nabung yang bener", text: "Cara nabung yang bener itu gimana?" },
{ emoji: "📉", label: "Kok selalu boros?", text: "Kok aku selalu boros ya?" },
{ emoji: "📈", label: "Mulai investasi", text: "Gimana cara mulai investasi?" },
{ emoji: "💸", label: "Atur hutang", text: "Gimana cara atur hutang yang banyak?" }];


function NanaChatDemo({ scrollToWaitingList }) {
  const [messages, setMessages] = useState([
  { role: "nana", text: "Halo! Aku Nana, asisten keuangan kamu 👋 Tanya apa saja soal keuangan — nabung, investasi, hutang, atau apapun yang lagi bikin pusing." }]
  );
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [questionsLeft, setQuestionsLeft] = useState(2);
  const [done, setDone] = useState(false);
  const [showQuick, setShowQuick] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {bottomRef.current?.scrollIntoView({ behavior: "smooth" });}, [messages, typing]);

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
          setMessages((prev) => [...prev, { role: "nana", text: "Penasaran kan? Aku sudah tunjukkan sedikit dari yang bisa aku lakukan. Kalau kamu daftar, aku bisa lihat kondisi keuangan kamu yang sebenarnya dan bantu lebih dalam. Amankan tempatmu sekarang ya 🧡" }]);
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
          <p className="text-center text-white/40 text-xs mb-6">AI bestie finansialmu — tanya apa saja soal keuangan.</p>
        </Reveal>
        <Reveal delay={120}>
          <div className="card-d rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-[#FF6A00] flex items-center justify-center flex-shrink-0">
                <img src="https://media.base44.com/images/public/69a82e8090f60786b869983c/51c7f5e6a_Nana_AI.png" alt="Nana" className="w-full h-full object-cover" onError={(e) => {e.target.style.display = "none";}} />
              </div>
              <div>
                <p className="text-white text-xs font-bold leading-none">Nana AI</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <p className="text-white/40 text-[10px]">Online</p>
                </div>
              </div>
              {questionsLeft > 0 && !done &&
              <div className="ml-auto text-[10px] text-white/25 bg-white/5 px-2 py-1 rounded-full">{questionsLeft} pertanyaan gratis</div>
              }
            </div>

            {/* Quick questions */}
            {showQuick && !done &&
            <div className="px-4 pt-3 pb-1">
                <p className="text-white/30 text-[10px] mb-2">Mau tanya soal apa?</p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_QUESTIONS.map((q, i) =>
                <button key={i} onClick={() => sendMessage(q.text)} disabled={typing}
                className="flex items-center gap-1 text-[10px] text-white/70 border border-white/10 hover:border-[#FF6A00]/50 hover:text-white bg-white/4 hover:bg-[#FF6A00]/10 rounded-full px-2.5 py-1 transition-all disabled:opacity-40">
                      <span>{q.emoji}</span> {q.label}
                    </button>
                )}
                </div>
              </div>
            }

            {/* Messages */}
            <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
              {messages.map((m, i) =>
              <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
                  {m.role === "nana" &&
                <div className="w-6 h-6 rounded-full overflow-hidden bg-[#FF6A00] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <img src="https://media.base44.com/images/public/69a82e8090f60786b869983c/51c7f5e6a_Nana_AI.png" alt="N" className="w-full h-full object-cover" onError={(e) => {e.target.style.display = "none";}} />
                    </div>
                }
                  <div className={`rounded-2xl px-3 py-2.5 max-w-[85%] text-xs leading-relaxed ${m.role === "nana" ? "bg-white/6 rounded-tl-sm text-white/80" : "bg-[#FF6A00] rounded-tr-sm text-white"}`}>
                    {m.text}
                  </div>
                  {m.role === "user" &&
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-[9px] flex-shrink-0 mt-0.5">K</div>
                }
                </div>
              )}
              {typing &&
              <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-[#FF6A00] flex items-center justify-center flex-shrink-0">
                    <img src="https://media.base44.com/images/public/69a82e8090f60786b869983c/51c7f5e6a_Nana_AI.png" alt="N" className="w-full h-full object-cover" onError={(e) => {e.target.style.display = "none";}} />
                  </div>
                  <div className="bg-white/6 rounded-2xl rounded-tl-sm px-3 py-2.5">
                    <span className="text-white/40 text-xs">Nana mengetik<span className="typing-dots">...</span></span>
                  </div>
                </div>
              }
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-3 pb-3 border-t border-white/8 pt-2">
              {done ?
              <button onClick={scrollToWaitingList} className="w-full py-3 bg-[#FF6A00] rounded-xl text-white text-sm font-bold hover:bg-[#e05e00] transition-colors">
                  Amankan Tempatku →
                </button> :
              <div className="flex gap-2">
                  <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Atau ketik sendiri..." disabled={typing || done}
                className="bg-white/5 text-white px-3 py-2.5 text-xs rounded-xl flex-1 border border-white/8 placeholder-white/25 outline-none focus:border-[#FF6A00]/40 disabled:opacity-40" />
                  <button onClick={handleSend} disabled={typing || !input.trim() || done}
                className="w-9 h-9 rounded-xl bg-[#FF6A00] flex items-center justify-center text-white hover:bg-[#e05e00] transition-colors disabled:opacity-40">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              }
            </div>
          </div>
        </Reveal>
      </div>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .typing-dots { animation: blink 1.2s infinite; }
      `}</style>
    </section>);

}

// ─── FAQ Accordion ────────────────────────────────────────────────────────────
const FAQS = [
{ q: "Apakah Atur Pintar gratis?", a: "Ya, ada versi gratis selamanya. Kamu bisa catat transaksi, pakai Nana AI 5x sehari, dan akses fitur gamifikasi tanpa bayar apapun." },
{ q: "Apakah data keuangan saya aman?", a: "Data kamu dienkripsi dan tidak pernah dijual ke pihak ketiga. Atur Pintar tidak punya akses ke rekening bank kamu — semua diinput manual oleh kamu sendiri." },
{ q: "Bisa dipakai di HP?", a: "Bisa langsung dari browser HP kamu — tidak perlu install apapun. Versi iOS dan Android sedang dalam pengembangan." },
{ q: "Kenapa harus join waiting list?", a: "Kami ingin onboarding yang personal — bukan ramai-ramai sekaligus. Dengan waiting list, kamu dapat perhatian lebih dan akses sebelum semua orang." },
{ q: "Apa yang didapat saat akses dibuka?", a: "Early access sebelum publik, badge Founding Member permanen di profil kamu, dan 30 hari Premium gratis." },
{ q: "Kapan akses dibuka?", a: "Kami kirim akses via email berurutan sesuai nomor antrian. Semakin cepat daftar, semakin awal kamu bisa pakai." }];


function FaqSection() {
  const [open, setOpen] = useState(null);
  return (
    <section className="pb-24 px-5 sm:px-12 lg:px-20 relative z-10">
      <div className="max-w-2xl mx-auto">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-2 text-center">Pertanyaan yang sering ditanya.</h2>
        </Reveal>
        <Reveal delay={60}>
          <p className="text-center text-white/40 text-sm mb-8">Kalau masih ada yang belum jelas, tanya langsung aja.</p>
        </Reveal>
        <div className="space-y-3">
          {FAQS.map((faq, i) =>
          <Reveal key={i} delay={i * 50}>
              <div className="card-d rounded-2xl overflow-hidden">
                <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left gap-4">
                
                  <span className="text-white font-semibold text-sm">{faq.q}</span>
                  {open === i ? <ChevronUp className="w-4 h-4 text-[#FF6A00] flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-white/40 flex-shrink-0" />}
                </button>
                {open === i &&
              <div className="px-5 pb-5">
                    <p className="text-white/60 text-sm leading-relaxed">{faq.a}</p>
                  </div>
              }
              </div>
            </Reveal>
          )}
        </div>
      </div>
    </section>);

}

// ─── Validation helpers ───────────────────────────────────────────────────────
const SPAM_NAME_PATTERNS = ["http", "https", ".com", ".net", ".org", ".id", "www.", "evil", "hack", "click", "klik"];
function isValidName(name) {
  const lower = name.toLowerCase();
  return !SPAM_NAME_PATTERNS.some(p => lower.includes(p));
}
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

// ─── Waiting List Form ────────────────────────────────────────────────────────
function WaitingListSection({ fomoCounter, incrementCounter }) {
  const [form, setForm] = useState({ name: "", email: "", whatsapp: "", job: "", city: "", biggest_money_problem: "", current_finance_tracking_method: "", early_access_interest: "" });
  const [honeypot, setHoneypot] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [queueNumber, setQueueNumber] = useState(null);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Honeypot: silently reject if filled
    if (honeypot) return;

    // Client-side validation
    const newErrors = {};
    if (!isValidName(form.name)) newErrors.name = "Nama tidak valid, mohon isi nama asli kamu";
    if (!isValidEmail(form.email)) newErrors.email = "Format email tidak valid";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});

    setLoading(true);
    try {
      const res = await base44.functions.invoke("submitWaitingList", {
        name: form.name,
        email: form.email,
        whatsapp: form.whatsapp || undefined,
        job: form.job,
        city: form.city,
        biggest_money_problem: form.biggest_money_problem || undefined,
        current_finance_tracking_method: form.current_finance_tracking_method,
        early_access_interest: form.early_access_interest,
        honeypot,
      });
      if (res.data?.error) throw new Error(res.data.error);
      const qNum = fomoCounter + 1;
      setQueueNumber(qNum);
      incrementCounter();
      setSuccess(true);
      // Send confirmation email
      base44.functions.invoke("sendWaitingListEmail", { name: form.name, email: form.email, queueNumber: qNum }).catch(() => {});
      // Mini confetti
      if (window.confetti) window.confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 }, colors: ["#FF6A00", "#FFB347", "#ffffff"] });
    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("rate") || msg.includes("banyak") || msg.includes("limit")) {
        setErrors({ general: "Terlalu banyak percobaan, coba lagi nanti" });
      } else {
        setErrors({ general: "Gagal mendaftar, coba lagi." });
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <section id="waiting-list-section" className="pb-24 px-5 sm:px-12 lg:px-20 relative z-10">
        <div className="max-w-lg mx-auto card-d rounded-3xl p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-[#FF6A00]/20 flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-[#FF6A00]" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Yeay! 🎉</h2>
          <p className="text-[#FF6A00] font-bold text-lg mb-3">Kamu #{queueNumber} dalam antrian.</p>
          <p className="text-white/60 text-sm leading-relaxed">
            Yeay! Kamu sudah masuk daftar tunggu Atur Pintar. Kami akan hubungi kamu segera!
          </p>
          <p className="text-white/40 text-xs mt-3">
            Konfirmasi dikirim ke <span className="text-white font-semibold">{form.email}</span>
          </p>
        </div>
      </section>);

  }

  return (
    <section id="waiting-list-section" className="pb-24 px-5 sm:px-12 lg:px-20 relative z-10">
      <div className="max-w-lg mx-auto">
        <Reveal>
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">Kamu yang pertama.</h2>
            <p className="text-[#FF6A00] font-bold text-lg mb-3">Amankan tempatmu sekarang.</p>
            <p className="text-white/50 text-sm">Semakin cepat daftar — semakin awal dapat akses.</p>
            <div className="mt-5 space-y-2 text-left max-w-xs mx-auto">
              {["Early access sebelum publik", "Badge \"Founding Member\" permanen di profilmu", "30 hari Premium gratis"].map((b, i) =>
              <div key={i} className="flex items-center gap-2.5">
                  <span className="text-green-400 text-sm">✅</span>
                  <span className="text-white/70 text-sm">{b}</span>
                </div>
              )}
            </div>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <div className="card-d rounded-2xl p-2 mb-4 text-center">
            <p className="text-white/50 text-xs">Kamu akan jadi</p>
            <p className="text-[#FF6A00] font-black text-2xl">#{fomoCounter + 1}</p>
            <p className="text-white/50 text-xs">dalam antrian</p>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <form onSubmit={handleSubmit} className="card-d rounded-2xl p-6 space-y-4">
            {/* Honeypot - hidden from real users */}
            <div style={{ position: "absolute", left: "-9999px", top: "-9999px", opacity: 0, pointerEvents: "none" }} aria-hidden="true">
              <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={e => setHoneypot(e.target.value)} />
            </div>

            {errors.general && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-xs font-medium">
                {errors.general}
              </div>
            )}

            <div>
              <label className="text-white/60 text-xs mb-1.5 block">Nama lengkap *</label>
              <input required value={form.name} onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setErrors(er => ({ ...er, name: undefined })); }} placeholder="Nama kamu" className={`bg-[hsl(var(--foreground))] text-white px-4 py-3 text-sm rounded-xl w-full border placeholder-white/25 outline-none focus:border-[#FF6A00]/50 ${errors.name ? "border-red-500/60" : "border-white/10"}`} />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="text-white/60 text-xs mb-1.5 block">Email aktif *</label>
              <input required type="email" value={form.email} onChange={(e) => { setForm((f) => ({ ...f, email: e.target.value })); setErrors(er => ({ ...er, email: undefined })); }} placeholder="email@kamu.com" className={`bg-[hsl(var(--foreground))] text-white px-4 py-3 text-sm rounded-xl w-full border placeholder-white/25 outline-none focus:border-[#FF6A00]/50 ${errors.email ? "border-red-500/60" : "border-white/10"}`} />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="text-white/60 text-xs mb-1.5 block">Nomor WhatsApp (opsional)</label>
              <input value={form.whatsapp} onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))} placeholder="08xxxxxxxxxx" className="bg-[hsl(var(--card-foreground))] text-white px-4 py-3 text-sm rounded-xl w-full border border-white/10 placeholder-white/25 outline-none focus:border-[#FF6A00]/50" />
            </div>
            <div>
              <label className="text-white/60 text-xs mb-1.5 block">Pekerjaan *</label>
              <input required value={form.job} onChange={(e) => setForm((f) => ({ ...f, job: e.target.value }))} placeholder="Karyawan, pelajar, freelancer..." className="bg-[hsl(var(--card-foreground))] text-white px-4 py-3 text-sm rounded-xl w-full border border-white/10 placeholder-white/25 outline-none focus:border-[#FF6A00]/50" />
            </div>
            <div>
              <label className="text-white/60 text-xs mb-1.5 block">Kota domisili *</label>
              <input required value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} placeholder="Jakarta, Bandung, dll..." className="bg-[hsl(var(--card-foreground))] text-white px-4 py-3 text-sm opacity-100 rounded-xl w-full border border-white/10 placeholder-white/25 outline-none focus:border-[#FF6A00]/50" />
            </div>
            <div>
              <label className="text-white/60 text-xs mb-1.5 block">Tantangan terbesar mengatur uang saat ini (opsional)</label>
              <textarea value={form.biggest_money_problem} onChange={(e) => setForm((f) => ({ ...f, biggest_money_problem: e.target.value }))} placeholder="Ceritakan kondisimu..." rows={3} className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/25 outline-none focus:border-[#FF6A00]/50 resize-none" />
            </div>
            <div>
              <label className="text-white/60 text-xs mb-1.5 block">Cara catat keuangan sekarang *</label>
              <select required value={form.current_finance_tracking_method} onChange={(e) => setForm((f) => ({ ...f, current_finance_tracking_method: e.target.value }))} className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#FF6A00]/50">
                <option value="" disabled>Pilih...</option>
                <option value="Tidak mencatat">Tidak mencatat</option>
                <option value="Notes di HP">Notes di HP</option>
                <option value="Excel / Spreadsheet">Excel / Spreadsheet</option>
                <option value="Aplikasi lain">Aplikasi lain</option>
              </select>
            </div>
            <div>
              <label className="text-white/60 text-xs mb-1.5 block">Tertarik coba versi awal? *</label>
              <select required value={form.early_access_interest} onChange={(e) => setForm((f) => ({ ...f, early_access_interest: e.target.value }))} className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#FF6A00]/50">
                <option value="" disabled>Pilih...</option>
                <option value="Ya">Ya</option>
                <option value="Mungkin">Mungkin</option>
                <option value="Belum yakin">Belum yakin</option>
              </select>
            </div>
            <button type="submit" disabled={loading} className="w-full py-4 bg-[#FF6A00] hover:bg-[#e05e00] text-white font-black text-base rounded-full transition-all disabled:opacity-60 mt-2">
              {loading ? "Mendaftarkan..." : "Amankan Tempatku →"}
            </button>
            <p className="text-center text-white/30 text-xs">Gratis. Tanpa kartu kredit. Tanpa syarat tersembunyi.</p>
          </form>
        </Reveal>
      </div>
    </section>);

}

// ─── AnimatedCounter ──────────────────────────────────────────────────────────
function AnimatedCounter({ value }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    if (value === prev.current) return;
    const start = prev.current;
    const end = value;
    const duration = 600;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setDisplay(Math.round(start + (end - start) * progress));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    prev.current = value;
  }, [value]);
  return <span>{display.toLocaleString("id-ID")}</span>;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const pricingRef = useRef(null);
  const howRef = useRef(null);
  const waitingListRef = useRef(null);

  useEffect(() => {window.scrollTo(0, 0);}, []);

  const [featureWaitingList, setFeatureWaitingList] = useState(true);
  const [fomoCounter, setFomoCounter] = useState(637);
  const [fomoToast, setFomoToast] = useState(null);
  const [fomoVisible, setFomoVisible] = useState(false);

  // Load AppConfig
  useEffect(() => {
    base44.entities.AppConfig.list().then((configs) => {
      if (configs?.length) setFeatureWaitingList(configs[0].feature_waiting_list ?? true);
    }).catch(() => {});
  }, []);

  // FOMO toast logic
  useEffect(() => {
    const allNames = shuffle([...MALE_NAMES, ...FEMALE_NAMES]);
    const allCities = shuffle(CITIES);
    const allTimes = shuffle(TIME_LABELS);
    let count = 0;
    let cityIdx = 0;
    let timeIdx = 0;

    const showToast = () => {
      if (count >= 10) return;
      const name = allNames[count % allNames.length];
      const city = allCities[cityIdx % allCities.length];
      const time = allTimes[timeIdx % allTimes.length];
      cityIdx++;timeIdx++;
      setFomoToast({ name, city, time });
      setFomoVisible(true);
      setFomoCounter((prev) => prev + 1);
      count++;
      setTimeout(() => setFomoVisible(false), 5000);
    };

    const firstTimer = setTimeout(() => {
      showToast();
      if (count < 10) {
        const interval = setInterval(() => {
          if (count >= 10) {clearInterval(interval);return;}
          showToast();
        }, 20000 + Math.random() * 10000);
        return () => clearInterval(interval);
      }
    }, 8000);

    return () => clearTimeout(firstTimer);
  }, []);

  const scrollToWaitingList = useCallback(() => {
    document.getElementById("waiting-list-section")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const incrementCounter = useCallback(() => setFomoCounter((prev) => prev + 1), []);

  const LEVELS = [
  { icon: "🌱", level: "Lv.1", label: "Newbie Ngatur" },
  { icon: "💸", level: "Lv.2", label: "Si Pencatat" },
  { icon: "🎯", level: "Lv.3", label: "Budgeter Muda" },
  { icon: "🤝", level: "Lv.4", label: "Social Saver" },
  { icon: "🧠", level: "Lv.5", label: "Financial Aware" },
  { icon: "🏆", level: "Lv.7", label: "Atur Pintar Pro" }];


  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans overflow-x-hidden">
      <MatrixBackground />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif; }
        .g-text { background: linear-gradient(135deg,#FF6A00 0%,#FFB347 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .glow { box-shadow: 0 0 40px rgba(255,106,0,0.28); }
        .card-d { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); }
        .iphone-frame { background:#111; border-radius:44px; border:3px solid #333; position:relative; padding:14px; box-shadow:0 30px 80px rgba(0,0,0,0.7),inset 0 0 0 1px #222; }
        .iphone-notch { width:90px; height:22px; background:#111; border-radius:0 0 14px 14px; margin:0 auto -8px; position:relative; z-index:1; }
      `}</style>

      {/* FOMO Toast */}
      {fomoToast && <FomoToast data={fomoToast} visible={fomoVisible} />}

      {/* Scroll Progress */}
      <ScrollProgress />

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center px-5 sm:px-12 lg:px-20 py-3 bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-2">
          <img src="https://media.base44.com/images/public/69a82e8090f60786b869983c/d2e52bdf2_3.png" alt="Logo" className="w-7 h-7" />
          <span className="font-black text-white text-sm tracking-tight">Atur Pintar</span>
        </div>
        <div className="hidden sm:flex items-center gap-6 ml-10">
          <button onClick={() => howRef.current?.scrollIntoView({ behavior: "smooth" })} className="text-xs text-white/50 hover:text-white transition-colors">Fitur</button>
          {!featureWaitingList &&
          <button onClick={() => pricingRef.current?.scrollIntoView({ behavior: "smooth" })} className="text-xs text-white/50 hover:text-white transition-colors">Harga</button>
          }
          <Link to="/About" className="text-xs text-white/50 hover:text-white transition-colors">Tentang</Link>
        </div>
        {!featureWaitingList &&
        <button onClick={() => base44.auth.redirectToLogin()} className="text-xs font-bold bg-[#FF6A00] hover:bg-[#e05e00] text-white px-4 py-2 rounded-full transition-colors ml-auto">
            Masuk / Daftar
          </button>
        }
        {featureWaitingList &&
        <button onClick={scrollToWaitingList} className="text-xs font-bold bg-[#FF6A00] hover:bg-[#e05e00] text-white px-4 py-2 rounded-full transition-colors ml-auto">
            Amankan Tempatku →
          </button>
        }
      </nav>

      {/* ── HERO ── */}
      <section className="pt-28 pb-24 px-5 sm:px-12 lg:px-20 relative z-10 text-center sm:text-left">
        <div className="absolute top-10 left-0 w-[600px] h-[500px] rounded-full bg-[#FF6A00]/6 blur-[140px] pointer-events-none" />
        <div className="max-w-3xl mx-auto sm:mx-0">
          <Reveal>
            <div className="inline-flex items-center gap-2 bg-[#FF6A00]/10 border border-[#FF6A00]/25 rounded-full px-4 py-1.5 mb-7">
              <Sparkles className="w-3 h-3 text-[#FF6A00]" />
              <span className="text-[11px] text-[#FF6A00] font-bold uppercase tracking-wide">AI-Powered Personal Finance</span>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black leading-[1.08] mb-6">
              Aplikasi keuangan yang<br />
              <span className="g-text">akhirnya kamu buka tiap hari.</span>
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="text-base sm:text-lg text-white/55 max-w-xl mb-10 leading-relaxed mx-auto sm:mx-0">
              Bukan karena harus — tapi karena seru.<br />
              Catat duit, naik level, saingan sama teman.<br />
              Atur Pintar hadir buat kamu yang capek merasa <em>guilty</em> soal keuangan.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-center sm:justify-start mb-8">
              <button
                onClick={scrollToWaitingList}
                className="group flex items-center gap-2.5 bg-[#FF6A00] hover:bg-[#e05e00] text-white font-bold text-base px-8 py-4 rounded-2xl transition-all glow hover:scale-105 active:scale-95 w-full sm:w-auto justify-center">
                
                Amankan Tempatku — Gratis
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => document.getElementById("video-section")?.scrollIntoView({ behavior: "smooth" })}
                className="flex items-center gap-2 text-white/60 hover:text-white border border-white/10 hover:border-white/25 font-semibold text-sm px-6 py-4 rounded-2xl transition-all w-full sm:w-auto justify-center">
                
                Lihat cara kerjanya dulu ↓
              </button>
            </div>
          </Reveal>

          <Reveal delay={300}>
            <div className="text-sm text-white/50 text-center sm:text-left">
              <span className="text-[#FF6A00] font-black text-lg tabular-nums">
                <AnimatedCounter value={fomoCounter} />
              </span>{" "}
              <span className="text-white/60 font-semibold">orang sudah antre duluan.</span>
              <br />
              <span className="text-white/35 text-xs">Kamu mau nomor berapa?</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── PAIN POINT ── */}
      <section className="pb-24 px-5 sm:px-12 lg:px-20 relative z-10">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-10 text-center">Jujur deh...</h2>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
            { emoji: "😮‍💨", text: "Tiap awal bulan niat nabung.\nTiap akhir bulan bingung duitnya ke mana." },
            { emoji: "📱", text: "Udah download 5 aplikasi keuangan.\nSemuanya dibuka sekali, terus lupa." },
            { emoji: "😬", text: "Ngerti teorinya sih.\nTapi eksekusinya... nanti deh." }].
            map((c, i) =>
            <Reveal key={i} delay={i * 80}>
                <div className="card-d rounded-2xl p-6 text-center h-full flex flex-col items-center gap-4">
                  <span className="text-4xl">{c.emoji}</span>
                  <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">{c.text}</p>
                </div>
              </Reveal>
            )}
          </div>
          <Reveal delay={200}>
            <p className="text-center text-white/45 text-sm italic max-w-lg mx-auto leading-relaxed">
              "Kamu gak sendiri. Dan kamu gak butuh lebih banyak teori — kamu butuh cara yang bikin kamu mau lakuin."
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── FITUR UTAMA ── */}
      <section ref={howRef} className="pb-24 px-5 sm:px-12 lg:px-20 relative z-10">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-2 text-center">Kenalan sama cara baru ngatur uang.</h2>
          </Reveal>
          <Reveal delay={60}>
            <p className="text-center text-white/40 text-sm mb-10">Bukan sekadar catatan. Ini pengalaman.</p>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
            { icon: "🎮", title: "Keuangan yang terasa kayak game.", desc: "Setiap kebiasaan finansial yang kamu lakuin = XP. Naik level, unlock fitur baru, jaga streak harianmu. Duit diatur sambil ngerasa menang tiap hari." },
            { icon: "✨", title: "Kenalan sama Nana — AI bestie finansialmu.", desc: "Bukan chatbot kaku. Nana tau pola pengeluaranmu, kasih insight yang jujur, dan cukup lucu buat bikin kamu gak mager buka app. Dia di pihak kamu — selalu." },
            { icon: "🏆", title: "Saingan nabung sama teman.", desc: "Shared wallet, leaderboard, dan challenge bareng. Karena kadang yang bikin kamu konsisten bukan aplikasinya — tapi tahu temenmu lagi ngejar juga." },
            { icon: "🔥", title: "Kebiasaan kecil, hasil nyata.", desc: "Daily missions yang ringan, achievable, dan numpuk jadi perubahan besar. Satu habit per hari sudah cukup untuk mulai." }].
            map((f, i) =>
            <Reveal key={i} delay={i * 70}>
                <div className="card-d rounded-2xl p-5 hover:border-[#F97316]/30 transition-all h-full flex flex-col gap-3">
                  <span className="text-3xl">{f.icon}</span>
                  <p className="text-white font-bold text-sm leading-snug">{f.title}</p>
                  <p className="text-white/45 text-xs leading-relaxed flex-1">{f.desc}</p>
                </div>
              </Reveal>
            )}
          </div>
        </div>
      </section>

      {/* ── NANA CHAT DEMO ── */}
      <NanaChatDemo scrollToWaitingList={scrollToWaitingList} />

      {/* ── GAMIFIKASI ── */}
      <section className="pb-16 px-5 sm:px-12 lg:px-20 relative z-10">
        <div className="max-w-4xl mx-auto card-d rounded-3xl p-6 sm:p-8 overflow-hidden">
          <Reveal>
            <div className="mb-5">
              <span className="text-[10px] font-black text-[#FF6A00] uppercase tracking-widest">Gamifikasi</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1 mb-1">Level up bukan cuma di game.</h2>
              <p className="text-white/40 text-xs leading-relaxed">Setiap kebiasaan finansial yang kamu lakuin punya reward nyata.</p>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-5">
              {LEVELS.map((lv, i) =>
              <div key={i} className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl" style={{ background: "rgba(255,106,0,0.07)", border: "1px solid rgba(255,106,0,0.15)" }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-base"
                style={{ background: `linear-gradient(135deg, rgba(255,106,0,${0.2 + i * 0.13}) 0%, rgba(255,179,71,${0.25 + i * 0.1}) 100%)`, border: "1px solid rgba(255,106,0,0.25)" }}>
                    {lv.icon}
                  </div>
                  <p className="text-[9px] font-black text-[#FF6A00]">{lv.level}</p>
                  <p className="text-[8px] text-white/35 text-center leading-tight">{lv.label}</p>
                </div>
              )}
            </div>
          </Reveal>
          <Reveal delay={140}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-white/8">
              <p className="text-white/45 text-xs leading-relaxed">
                XP nambah tiap catat, jaga streak & dengerin Nana.<br />
                <span className="text-white/65 font-semibold">Karena konsistensi harusnya ada rewardnya.</span>
              </p>
              <button onClick={scrollToWaitingList} className="flex-shrink-0 flex items-center gap-1.5 bg-[#FF6A00] hover:bg-[#e05e00] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all whitespace-nowrap">
                Amankan Tempatku →
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── VIDEO SECTION ── */}
      <section id="video-section" className="pb-24 px-5 sm:px-12 lg:px-20 relative z-10">
        <div className="max-w-md mx-auto text-center">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">Lihat langsung cara kerjanya.</h2>
          </Reveal>
          <Reveal delay={60}>
            <p className="text-white/40 text-sm mb-10">Web app — buka browser, langsung bisa. Tanpa install apapun.</p>
          </Reveal>
          <Reveal delay={120}>
            <div className="mx-auto iphone-frame" style={{ width: 280 }}>
              <div className="iphone-notch" />
              <div className="overflow-hidden rounded-[30px] bg-black" style={{ aspectRatio: "9/16" }}>
                <iframe
                  src={VIDEO_URL} className="px-4 w-full h-full"

                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Demo Atur Pintar" />
                
              </div>
            </div>
            <p className="text-white/25 text-xs mt-5">iOS & Android segera hadir.</p>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ── */}
      <FaqSection />

      {/* ── PRICING (hidden when feature_waiting_list) ── */}
      {!featureWaitingList &&
      <section ref={pricingRef} className="pb-24 px-5 sm:px-12 lg:px-20 relative z-10">
          <div className="max-w-3xl mx-auto">
            <Reveal>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-2 text-center">Mulai gratis. Upgrade kalau udah ketagihan.</h2>
              <p className="text-center text-white/40 text-sm mb-10">Tanpa kartu kredit. Tanpa syarat tersembunyi.</p>
            </Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Reveal delay={60}>
                <div className="card-d rounded-2xl p-7 flex flex-col h-full">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">Gratis</span>
                  <p className="text-3xl font-black text-white mb-0.5">Rp 0</p>
                  <p className="text-white/35 text-xs mb-6">per bulan</p>
                  <div className="space-y-2.5 flex-1 mb-7">
                    {["Expense & income tracker", "Daily missions & XP", "Nana AI basic (5 chat/hari)", "Leaderboard teman", "1 financial goal"].map((f, i) =>
                  <div key={i} className="flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-[#F97316] flex-shrink-0" />
                        <p className="text-white/60 text-xs">{f}</p>
                      </div>
                  )}
                  </div>
                  <button onClick={() => base44.auth.redirectToLogin()} className="w-full py-3 rounded-xl border border-[#F97316]/50 text-[#F97316] font-bold text-sm hover:bg-[#F97316]/10 transition-colors">
                    Mulai Gratis →
                  </button>
                </div>
              </Reveal>
              <Reveal delay={120}>
                <div className="relative rounded-2xl p-7 flex flex-col h-full bg-[#FF6A00] border-2 border-[#FF6A00]">
                  <div className="absolute -top-3.5 left-6 bg-white text-[#FF6A00] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">POPULER ⭐</div>
                  <span className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-3">Plus</span>
                  <p className="text-3xl font-black text-white mb-0.5">Rp 49.000</p>
                  <p className="text-white/70 text-xs mb-1">per bulan</p>
                  <p className="text-white/60 text-[11px] mb-6">atau Rp 399.000/tahun <span className="text-white font-bold">(hemat ~32%)</span></p>
                  <div className="space-y-2.5 flex-1 mb-7">
                    {["Semua fitur Free", "Nana AI unlimited chat", "Advanced spending analytics", "Shared wallet unlimited", "Semua level unlocked", "Badge & skin eksklusif", "Laporan PDF bulanan"].map((f, i) =>
                  <div key={i} className="flex items-center gap-2">
                        <span className="text-white text-xs">⭐</span>
                        <p className="text-white/90 text-xs">{f}</p>
                      </div>
                  )}
                  </div>
                  <button onClick={() => base44.auth.redirectToLogin()} className="w-full py-3 rounded-xl bg-white text-[#FF6A00] font-bold text-sm hover:bg-white/90 transition-colors">
                    Coba 30 Hari Gratis →
                  </button>
                </div>
              </Reveal>
            </div>
            <Reveal delay={200}>
              <p className="text-center text-white/30 text-xs mt-5 italic">Lebih murah dari kopi yang kamu beli tadi pagi. ☕</p>
            </Reveal>
          </div>
        </section>
      }

      {/* ── WAITING LIST ── */}
      <WaitingListSection fomoCounter={fomoCounter} incrementCounter={incrementCounter} />

      {/* ── CLOSING INFO ── */}
      <section className="pb-12 px-5 sm:px-12 lg:px-20 relative z-10">
        <div className="max-w-lg mx-auto text-center">
          <div className="card-d rounded-2xl px-6 py-5 border border-[#FF6A00]/15">
            <p className="text-[#FF6A00] text-[10px] font-black uppercase tracking-widest mb-1">⏳ Early Access</p>
            <p className="text-white/60 text-xs mb-3 leading-relaxed">Pendaftaran waiting list akan segera ditutup setelah kuota awal terpenuhi.</p>
            <div className="flex flex-col gap-1.5 text-left max-w-xs mx-auto">
              {["Early access sebelum publik", 'Badge "Founding Member" permanen di profilmu', "30 hari Premium gratis"].map((b, i) =>
              <div key={i} className="flex items-center gap-2">
                  <span className="text-green-400 text-xs flex-shrink-0">✅</span>
                  <span className="text-white/55 text-xs">{b}</span>
                </div>
              )}
            </div>
            <p className="text-white/25 text-[10px] mt-3">Gratis · Tanpa kartu kredit · Tanpa syarat tersembunyi</p>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA (hidden when feature_waiting_list) ── */}
      {!featureWaitingList &&
      <section className="pb-0 px-5 sm:px-12 lg:px-20 relative z-10">
          <div className="relative rounded-3xl overflow-hidden py-20 px-8 sm:px-16 text-center" style={{ background: "#1A1A2E" }}>
            <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-[#FF6A00]/10 blur-[80px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-[#FF6A00]/8 blur-[100px] pointer-events-none translate-x-1/3 translate-y-1/3" />
            <Reveal>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black g-text mb-4 leading-tight">Duit bukan musuh.<br />Malas yang musuh.</h2>
            </Reveal>
            <Reveal delay={100}>
              <p className="text-white/60 text-base mb-10 max-w-md mx-auto">Dan Atur Pintar ada buat lawan mager bareng kamu.</p>
            </Reveal>
            <Reveal delay={180}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button onClick={() => base44.auth.redirectToLogin()} className="group flex items-center justify-center gap-2.5 bg-[#FF6A00] hover:bg-[#e05e00] text-white font-bold text-base px-8 py-4 rounded-2xl transition-all glow hover:scale-105 active:scale-95">
                  Download Sekarang — Gratis →
                </button>
                <button onClick={() => pricingRef.current?.scrollIntoView({ behavior: "smooth" })} className="flex items-center justify-center gap-2 text-white border border-white/20 hover:border-white/40 font-semibold text-sm px-6 py-4 rounded-2xl transition-all">
                  Lihat cara kerjanya dulu ↓
                </button>
              </div>
            </Reveal>
            <Reveal delay={250}>
              <p className="text-white/25 text-xs mt-8">Tersedia sebagai web app. iOS & Android segera hadir.</p>
            </Reveal>
          </div>
        </section>
      }

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 pt-10 pb-8 px-5 sm:px-12 lg:px-20 relative z-10 mt-16">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <img src="https://media.base44.com/images/public/69a82e8090f60786b869983c/d2e52bdf2_3.png" alt="Logo" className="w-6 h-6" />
                <span className="text-sm font-black text-white">Atur Pintar</span>
              </div>
              <p className="text-white/30 text-xs leading-relaxed italic">"Duit diatur, hidup lebih pintar."</p>
            </div>
            <div>
              <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-3">Tautan</p>
              <div className="space-y-2">
                <div><Link to="/PrivacyPolicy" className="text-white/30 hover:text-white/70 text-xs transition-colors">Privacy Policy</Link></div>
                <div><Link to="/TermsOfService" className="text-white/30 hover:text-white/70 text-xs transition-colors">Terms of Service</Link></div>
                <div><button onClick={() => base44.auth.redirectToLogin()} className="text-white/30 hover:text-white/70 text-xs transition-colors">Hubungi Kami</button></div>
              </div>
            </div>
            <div>
              <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-3">Kontak</p>
              <a href="mailto:admin@aturpintar.id" className="flex items-center gap-2 text-white/30 hover:text-white/70 text-xs transition-colors mb-3">
                <Mail className="w-3.5 h-3.5" />
                admin@aturpintar.id
              </a>
              <p className="text-white/20 text-[11px]">aturpintar.app</p>
              <div className="flex items-center gap-3 mt-3">
                <a href="https://instagram.com/aturpintar" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white/5 hover:bg-[#F97316]/20 flex items-center justify-center text-white/40 hover:text-[#F97316] transition-colors">
                  <Instagram className="w-3.5 h-3.5" />
                </a>
                <a href="https://x.com/aturpintar" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white/5 hover:bg-[#F97316]/20 flex items-center justify-center text-white/40 hover:text-[#F97316] transition-colors">
                  <Twitter className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-white/5 pt-5">
            <p className="text-white/20 text-xs text-center">© 2026 PT Rideff Vreka Tech. All rights reserved. · admin@aturpintar.id · aturpintar.app</p>
          </div>
        </div>
      </footer>
    </div>);

}