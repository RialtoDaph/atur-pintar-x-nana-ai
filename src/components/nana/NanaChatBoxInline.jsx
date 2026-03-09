import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Plus, AlertTriangle, TrendingDown, Target, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useFinancialContext } from "./useFinancialContext";

export default function NanaChatBoxInline({ user }) {
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const bottomRef = useRef(null);
  const { context, formatContextForMessage } = useFinancialContext();

  useEffect(() => {
    if (!user?.email) return;
    base44.entities.NanaPreferences.filter({ created_by: user.email }).then((prefs) => {
      if (prefs?.length > 0) setPreferences(prefs[0]);
    }).catch(() => {});

    // Load existing conversation
    setLoading(true);
    base44.agents.listConversations({ agent_name: "nana" }).then(async (convs) => {
      if (convs && convs.length > 0) {
        const conv = await base44.agents.getConversation(convs[0].id);
        setActiveConv(conv);
        setMessages(conv.messages || []);
      }
      setInitialized(true);
      setLoading(false);
    }).catch(() => { setInitialized(true); setLoading(false); });
  }, [user?.email]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!activeConv) return;
    const unsub = base44.agents.subscribeToConversation(activeConv.id, (data) => {
      setMessages(data.messages || []);
    });
    return unsub;
  }, [activeConv?.id]);

  async function newConversation() {
    const conv = await base44.agents.createConversation({
      agent_name: "nana",
      metadata: { name: `Obrolan ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short" })}` }
    });
    setActiveConv(conv);
    setMessages([]);
  }

  async function sendMessage() {
    if (!input.trim() || sending) return;
    let conv = activeConv;
    if (!conv) {
      conv = await base44.agents.createConversation({
        agent_name: "nana",
        metadata: { name: `Obrolan ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short" })}`, preferences }
      });
      setActiveConv(conv);
    }
    setSending(true);
    const text = input;
    setInput("");
    const contextBlock = formatContextForMessage(context);
    await base44.agents.addMessage(conv, { role: "user", content: text + contextBlock });
    setSending(false);
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const visibleMessages = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => m.role === "user" ? { ...m, content: m.content?.replace(/\n\n---\n\[FINANCIAL_CONTEXT[\s\S]*?\[\/FINANCIAL_CONTEXT\]\n---/g, "").trim() } : m);

  const quickPrompts = [
    "Catat pengeluaran makan siang Rp 50.000 hari ini",
    "Tambahkan pemasukan gaji Rp 10.000.000",
    "Rekomendasikan cara hemat bulan ini",
  ];

  return (
    <div className="bg-[#0A0A0A] rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-white/10">
        <div className="w-8 h-8 rounded-full bg-black border-2 border-[#2D2D2D] overflow-hidden flex-shrink-0">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a82e8090f60786b869983c/7708b64f5_generated_image.png"
            alt="Nana"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1">
          <p className="text-white font-bold text-sm flex items-center gap-1.5">
            Nana AI <Sparkles className="w-3 h-3 text-[#FF6A00]" />
          </p>
          <p className="text-[#8FA4C8] text-[10px]">Catat transaksi, tanya keuangan, dan lainnya</p>
        </div>
        <button
          onClick={newConversation}
          className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          title="Obrolan baru"
        >
          <Plus className="w-3.5 h-3.5 text-white" />
        </button>
      </div>

      {/* Messages */}
      <div className="h-[260px] overflow-y-auto px-3 py-3 space-y-3 bg-[#1A1A1A]">
        {loading ? (
          <div className="flex justify-center pt-10">
            <div className="w-5 h-5 border-2 border-[#FF6A00] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : visibleMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-black border-2 border-[#2D2D2D]">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a82e8090f60786b869983c/7708b64f5_generated_image.png"
                alt="Nana"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-white font-bold text-sm">Halo! Saya Nana 👋</p>
            <p className="text-[#8FA4C8] text-xs max-w-[240px]">Ketik perintah seperti <span className="text-[#FF6A00]">"catat pengeluaran"</span> atau tanya soal keuanganmu</p>

            {/* Quick prompts */}
            <div className="flex flex-col gap-1.5 w-full mt-1">
              {quickPrompts.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="text-left text-xs bg-[#2D2D2D] border border-[#3D3D3D] rounded-xl px-3 py-2 text-white hover:border-[#FF6A00] hover:bg-[#FF6A00]/10 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Proactive alerts */}
            {context && (() => {
              const alerts = [];
              context.budgetStatus?.forEach((b) => {
                if (b.pct >= 80) alerts.push({ Icon: AlertTriangle, color: "#F5A623", text: `${b.category} ${b.pct >= 100 ? "over budget!" : `${b.pct}% anggaran terpakai`}`, prompt: `Analisis pengeluaran ${b.category}ku yang sudah ${b.pct}% dari anggaran` });
              });
              const highDebt = context.debts?.find((d) => (d.interestRate || 0) >= 18);
              if (highDebt) alerts.push({ Icon: TrendingDown, color: "#FF6B6B", text: `Utang bunga tinggi: ${highDebt.name}`, prompt: `Strategi terbaik untuk melunasi ${highDebt.name}` });
              const urgentGoal = context.goals?.find((g) => g.daysLeft !== null && g.daysLeft < 30 && g.pct < 100);
              if (urgentGoal) alerts.push({ Icon: Target, color: "#4F7CFF", text: `Tujuan mendesak: ${urgentGoal.name} (${urgentGoal.daysLeft}h)`, prompt: `Tujuanku "${urgentGoal.name}" deadline ${urgentGoal.daysLeft} hari lagi, apa yang harus aku lakukan?` });
              if (alerts.length === 0) return null;
              return (
                <div className="w-full mt-1 space-y-1.5">
                  <p className="text-[10px] text-[#8FA4C8] font-medium text-left">⚡ Perhatian</p>
                  {alerts.slice(0, 2).map((a, i) => (
                    <button key={i} onClick={() => setInput(a.prompt)}
                      className="w-full text-left text-[11px] rounded-xl px-3 py-2 border transition-colors flex items-center gap-2"
                      style={{ background: `${a.color}20`, borderColor: `${a.color}50`, color: "#fff" }}>
                      <a.Icon className="w-3 h-3 flex-shrink-0" style={{ color: a.color }} />
                      {a.text}
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>
        ) : (
          visibleMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
              {msg.role === "assistant" && (
                <div className="w-6 h-6 rounded-full overflow-hidden bg-black border border-[#2D2D2D] flex-shrink-0 mt-0.5">
                  <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a82e8090f60786b869983c/7708b64f5_generated_image.png" alt="Nana" className="w-full h-full object-cover" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs ${msg.role === "user" ? "bg-[#FF6A00] text-white" : "bg-[#2D2D2D] border border-[#3D3D3D] text-white"}`}>
                {msg.role === "assistant" ? (
                  <ReactMarkdown className="prose prose-xs max-w-none text-white [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:my-2 [&>ol]:my-2 [&>li]:mb-1 [&>strong]:font-semibold">
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
            </div>
          ))
        )}
        {sending && (
          <div className="flex justify-start gap-2">
            <div className="w-6 h-6 rounded-full overflow-hidden bg-black border border-[#2D2D2D] flex-shrink-0">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a82e8090f60786b869983c/7708b64f5_generated_image.png" alt="Nana" className="w-full h-full object-cover" />
            </div>
            <div className="bg-[#2D2D2D] border border-[#3D3D3D] rounded-2xl px-3 py-2 flex gap-1 items-center">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-1.5 h-1.5 bg-[#8FA4C8] rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-2.5 bg-black border-t border-[#2D2D2D]">
        <div className="flex gap-2 bg-[#2D2D2D] rounded-xl border border-[#3D3D3D] px-3 py-1.5">
          <textarea
            className="flex-1 text-xs text-white resize-none outline-none bg-transparent placeholder:text-[#8FA4C8] max-h-16"
            rows={1}
            placeholder='Contoh: "Catat makan siang Rp 50.000" atau tanya keuangan...'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="w-7 h-7 rounded-full bg-[#FF6A00] flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:bg-[#e05e00] transition-colors self-end"
          >
            <Send className="w-3 h-3 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}