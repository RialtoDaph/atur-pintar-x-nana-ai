import { useState, useRef, useEffect } from "react";
import { Send, Sparkles } from "lucide-react";

const DEMO_RESPONSES = {
  default: (input) => {
    const lower = input.toLowerCase();
    // Detect transaction-like input
    const hasAmount = /\d/.test(input) && /(rb|ribu|k|juta|000|\d{4,})/i.test(input);
    const foodKeywords = ["makan", "minum", "kopi", "nasi", "ayam", "burger", "pizza", "boba", "seblak", "bakso", "martabak", "soto", "mie", "ramen", "jajan", "snack", "cafe", "kafe", "gofood", "grabfood"];
    const transportKeywords = ["gojek", "grab", "taxi", "bensin", "parkir", "tol", "bus", "kereta"];
    const shoppingKeywords = ["shopee", "tokopedia", "baju", "sepatu", "belanja"];

    if (hasAmount) {
      let category = "Lainnya";
      let emoji = "📦";
      let monthlyTotal = "Rp 1.240.000";

      if (foodKeywords.some(k => lower.includes(k))) {
        category = "Makanan & Minuman";
        emoji = "🍔";
        monthlyTotal = "Rp 520.000";
      } else if (transportKeywords.some(k => lower.includes(k))) {
        category = "Transportasi";
        emoji = "🚗";
        monthlyTotal = "Rp 350.000";
      } else if (shoppingKeywords.some(k => lower.includes(k))) {
        category = "Belanja";
        emoji = "🛍️";
        monthlyTotal = "Rp 890.000";
      }

      return {
        type: "transaction",
        text: `✅ Transaksi ditambahkan!\n\n${emoji} **Kategori:** ${category}\n📅 **Tanggal:** Hari ini\n💸 **Pengeluaran ${category} bulan ini:** ${monthlyTotal}`,
      };
    }

    return {
      type: "fallback",
      text: "Halo! 👋 Fitur lengkap Nana AI baru bisa digunakan setelah aplikasi diluncurkan. Saat ini kamu bisa coba demo pencatatan transaksi — ketik contoh seperti \"Beli makan 45k\" atau \"Gojek 25rb\".",
    };
  },
};

const SUGGESTIONS = [
  "Beli makan 45k",
  "Gojek 25rb",
  "Belanja Shopee 150rb",
  "Kopi Starbucks 65000",
];

const INITIAL_MESSAGES = [
  {
    role: "assistant",
    text: "Halo! Aku Nana AI 👋\nCoba ketik transaksi kamu, contoh: \"Beli makan 45k\" dan aku akan mencatatnya otomatis.",
  },
];

export default function NanaDemoChat() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const sendMessage = (text) => {
    const userText = text || input.trim();
    if (!userText) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: userText }]);
    setTyping(true);

    setTimeout(() => {
      const response = DEMO_RESPONSES.default(userText);
      setMessages((m) => [...m, { role: "assistant", text: response.text }]);
      setTyping(false);
    }, 900);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const formatText = (text) => {
    return text.split("\n").map((line, i) => {
      const formatted = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      return <p key={i} className={`${line === "" ? "mt-1" : ""} text-sm leading-relaxed`} dangerouslySetInnerHTML={{ __html: formatted || "&nbsp;" }} />;
    });
  };

  return (
    <div className="max-w-md mx-auto">
      {/* Phone frame */}
      <div className="card-dark rounded-3xl overflow-hidden" style={{ boxShadow: "0 0 60px rgba(255,106,0,0.15)" }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/8 bg-white/3">
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#FF6A00]/40">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a82e8090f60786b869983c/7708b64f5_generated_image.png"
              alt="Nana"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="text-white text-sm font-bold flex items-center gap-1.5">
              Nana AI <Sparkles className="w-3 h-3 text-[#FF6A00]" />
            </p>
            <p className="text-[10px] text-green-400 font-medium">● Demo Mode</p>
          </div>
        </div>

        {/* Messages */}
        <div className="h-56 overflow-y-auto px-4 py-4 space-y-3 bg-[#0D0D0D]">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  msg.role === "user"
                    ? "bg-[#FF6A00] text-white rounded-br-sm"
                    : "bg-white/8 text-white/90 rounded-bl-sm"
                }`}
              >
                {formatText(msg.text)}
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex justify-start">
              <div className="bg-white/8 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        <div className="px-4 pt-3 pb-2 flex gap-2 overflow-x-auto scrollbar-hide bg-[#0D0D0D]">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="flex-shrink-0 text-[10px] font-medium bg-white/6 hover:bg-[#FF6A00]/15 border border-white/10 hover:border-[#FF6A00]/40 text-white/60 hover:text-[#FF6A00] px-3 py-1.5 rounded-full transition-all"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-2 px-4 pb-4 pt-2 bg-[#0D0D0D]">
          <input
            className="flex-1 bg-white/8 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-[#FF6A00]/50 transition-colors"
            placeholder="Ketik transaksi kamu..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || typing}
            className="w-10 h-10 rounded-xl bg-[#FF6A00] hover:bg-[#e05e00] disabled:opacity-40 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}