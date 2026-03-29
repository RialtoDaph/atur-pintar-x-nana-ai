import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Plus, X, AlertTriangle, TrendingDown, Target } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useFinancialContext } from "./useFinancialContext";
import InteractivePrompt from "./InteractivePrompt";

export default function NanaFloatingChat() {
  const [open, setOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const bottomRef = useRef(null);
  const { context, formatContextForMessage } = useFinancialContext(open);

  // Detect open modals/dialogs and hide Nana
  useEffect(() => {
    const checkModals = () => {
      const hasModal = document.querySelectorAll('[role="dialog"][data-state="open"], .fixed.inset-0:not([data-nana])').length > 0;
      setIsModalOpen(hasModal);
    };
    const observer = new MutationObserver(checkModals);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-state", "class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let isMounted = true;
    base44.auth.me().then((user) => {
      if (!isMounted) return;
      base44.entities.NanaPreferences.filter({ created_by: user.email }).then((prefs) => {
        if (isMounted && prefs?.length > 0) setPreferences(prefs[0]);
      }).catch(() => {});
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!activeConv) return;
    const unsub = base44.agents.subscribeToConversation(activeConv.id, (data) => {
      setMessages(data.messages || []);
      if (!open) {
        const lastSeen = parseInt(localStorage.getItem("nana_last_seen") || "0");
        const newAssistantMsgs = (data.messages || []).filter(
          (m) => m.role === "assistant" && new Date(m.created_date).getTime() > lastSeen
        );
        setUnreadCount(newAssistantMsgs.length);
      }
    });
    return unsub;
  }, [activeConv?.id, open]);

  async function openChat() {
    setOpen(true);
    setUnreadCount(0);
    localStorage.setItem("nana_last_seen", Date.now().toString());
    if (activeConv) return;
    setLoading(true);
    const convs = await base44.agents.listConversations({ agent_name: "nana" });
    if (convs && convs.length > 0) {
      const conv = await base44.agents.getConversation(convs[0].id);
      setActiveConv(conv);
      setMessages(conv.messages || []);
    }
    setLoading(false);
  }

  async function newConversation() {
    const conv = await base44.agents.createConversation({
      agent_name: "nana",
      metadata: { name: `Obrolan ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short" })}` }
    });
    setActiveConv(conv);
    setMessages([]);
  }

  async function sendInteractiveResponse(displayText, responseValue) {
    let conv = activeConv;
    if (!conv) {
      conv = await base44.agents.createConversation({
        agent_name: "nana",
        metadata: { name: `Obrolan ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short" })}`, preferences }
      });
      setActiveConv(conv);
    }
    const contextBlock = formatContextForMessage(context);
    await base44.agents.addMessage(conv, { role: "user", content: displayText + contextBlock });
  }

  async function sendMessage() {
    if (!input.trim() || sending) return;
    let conv = activeConv;
    if (!conv) {
      conv = await base44.agents.createConversation({
        agent_name: "nana",
        metadata: {
          name: `Obrolan ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short" })}`,
          preferences: preferences
        }
      });
      setActiveConv(conv);
    }
    setSending(true);
    const text = input;
    setInput("");
    // Append the full financial context to every message so Nana always has fresh data
    const contextBlock = formatContextForMessage(context);
    const messageContent = text + contextBlock;
    await base44.agents.addMessage(conv, { role: "user", content: messageContent });
    setSending(false);
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // Strip the injected financial context block from user-visible messages
  const visibleMessages = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => m.role === "user" ? { ...m, content: m.content?.replace(/\n\n---\n\[FINANCIAL_CONTEXT[\s\S]*?\[\/FINANCIAL_CONTEXT\]\n---/g, "").trim() } : m);

  if (isModalOpen) return null;

  return (
    <>
      <style>{`
        @keyframes float-bounce {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 4px 16px rgba(255,106,0,0.2); }
          50% { box-shadow: 0 4px 20px rgba(255,106,0,0.35); }
        }
        .nana-float { animation: float-bounce 4s ease-in-out infinite, pulse-glow 4s ease-in-out infinite; }
      `}</style>
      {/* Floating button */}
      {!open &&
      <div data-nana="true" data-tour="nana-chat" className="fixed bottom-24 right-4 sm:bottom-6 sm:right-6 z-50 cursor-pointer" onClick={openChat}>
        <div className="relative flex items-center gap-1.5 sm:gap-2 bg-[#0A0A0A] border border-[#FF6A00] rounded-2xl px-2 py-1.5 sm:px-3 sm:py-2 shadow-lg hover:bg-[#1A1A1A] transition-all active:scale-95 nana-float">
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-xl overflow-hidden flex-shrink-0 border border-[#FF6A00]/40">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a82e8090f60786b869983c/7708b64f5_generated_image.png"
              alt="Nana AI"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <p className="text-white text-[11px] sm:text-xs font-bold leading-tight">Nana AI</p>
            <p className="text-[#8FA4C8] text-[9px] sm:text-[10px] leading-tight">Chat sekarang ✨</p>
          </div>
          {unreadCount > 0 && (
            <div className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] sm:min-w-[18px] sm:h-[18px] bg-[#FF6A00] rounded-full flex items-center justify-center px-1 border-2 border-[#0A0A0A]">
              <span className="text-white text-[8px] sm:text-[9px] font-bold leading-none">{unreadCount > 9 ? "9+" : unreadCount}</span>
            </div>
          )}
        </div>
      </div>
      }

      {/* Chat panel */}
      {open &&
      <div data-nana="true" className="fixed bottom-24 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[380px] max-w-[420px] rounded-2xl shadow-2xl flex flex-col bg-[#1A1A1A] border border-[#2D2D2D] overflow-hidden h-[360px] sm:h-[520px]"
      style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.3)" }}>
          {/* Header */}
          <div className="bg-[#0F1114] px-4 py-3 flex items-center gap-3 flex-shrink-0 border-b border-[#2D2D2D]">
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a82e8090f60786b869983c/7708b64f5_generated_image.png" alt="Nana" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-sm">Nana</p>
              <p className="text-[#8FA4C8] text-[10px]">Asisten Keuangan Pribadi</p>
            </div>
            <button onClick={newConversation} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors" title="Obrolan baru">
              <Plus className="w-3.5 h-3.5 text-white" />
            </button>
            <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <X className="w-3.5 h-3.5 text-white" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-[#1A1A1A] scrollbar-thin scrollbar-thumb-[#2D2D2D] scrollbar-track-transparent">
            {loading ?
          <div className="flex justify-center pt-10">
                <div className="w-5 h-5 border-2 border-[#FF6A00] border-t-transparent rounded-full animate-spin" />
              </div> :
          visibleMessages.length === 0 ?
          <div className="flex flex-col items-center justify-center h-full text-center gap-2 pt-4">
               <p className="text-white font-bold text-sm">Nana AI</p>
                <p className="text-[#8FA4C8] text-xs max-w-[220px]">Tanya apa saja soal keuanganmu!</p>
                {/* Proactive alerts from financial context */}
                {context && (() => {
                  const alerts = [];
                  context.budgetStatus?.forEach((b) => {
                    if (b.pct >= 80) alerts.push({ Icon: AlertTriangle, color: "#F5A623", text: `${b.category} ${b.pct >= 100 ? "over budget!" : `${b.pct}% anggaran terpakai`}`, prompt: `Analisis pengeluaran ${b.category}ku yang sudah ${b.pct}% dari anggaran dan beri saran penghematan` });
                  });
                  const highDebt = context.debts?.find((d) => (d.interestRate || 0) >= 18);
                  if (highDebt) alerts.push({ Icon: TrendingDown, color: "#FF6B6B", text: `Utang bunga tinggi: ${highDebt.name} (${highDebt.interestRate}%)`, prompt: `Analisis utang ${highDebt.name} dengan bunga ${highDebt.interestRate}% dan rekomendasikan strategi terbaik untuk melunasinya` });
                  const urgentGoal = context.goals?.find((g) => g.daysLeft !== null && g.daysLeft < 30 && g.pct < 100);
                  if (urgentGoal) alerts.push({ Icon: Target, color: "#4F7CFF", text: `Tujuan mendesak: ${urgentGoal.name} (${urgentGoal.daysLeft}h lagi)`, prompt: `Tujuanku "${urgentGoal.name}" deadline ${urgentGoal.daysLeft} hari lagi tapi baru ${urgentGoal.pct}%. Apa yang bisa aku lakukan?` });
                  const dueToday = context.upcomingReminders?.find((r) => r.daysUntilDue === 0);
                  if (dueToday) alerts.push({ Icon: AlertTriangle, color: "#FF6B6B", text: `Tagihan hari ini: ${dueToday.title}`, prompt: `Tagihan ${dueToday.title} jatuh tempo hari ini. Cek kondisi keuanganku.` });
                  if (alerts.length === 0) return null;
                  return (
                    <div className="w-full mt-2 space-y-1.5">
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

                <div className="flex flex-col gap-1.5 mt-2 w-full">
                  <p className="text-[10px] text-[#8FA4C8] font-medium text-left">💬 Mulai dari sini</p>
                  {[
                    "Prioritaskan utangku berdasarkan bunga",
                    context?.thisMonth?.spendingSpikes?.length > 0
                      ? `Pengeluaran ${context.thisMonth.spendingSpikes[0].category}ku melonjak. Apa yang bisa aku hemat?`
                      : "Analisis pola pengeluaranku bulan ini",
                    "Rekomendasikan kategori mana yang paling bisa dikurangi bulan ini"
                  ].map((s) =>
                <button key={s} onClick={() => setInput(s)}
                className="text-left text-xs bg-[#2D2D2D] border border-[#3D3D3D] rounded-xl px-3 py-2 text-white hover:border-[#FF6A00] hover:bg-[#FF6A00]/10 transition-colors">
                      {s}
                    </button>
                )}
                </div>
                </div> :

          visibleMessages.map((msg, i) =>
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
                  {msg.role === "assistant" &&
                  <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 mt-0.5">
                  <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a82e8090f60786b869983c/7708b64f5_generated_image.png" alt="Nana" className="w-full h-full object-contain" />
                  </div>
                  }
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs ${
            msg.role === "user" ? "bg-[#FF6A00] text-white" : "bg-[#2D2D2D] border border-[#3D3D3D] text-white"}`
            }>
                    {msg.role === "assistant" ?
              <div>
                {(() => {
                  let displayContent = msg.content;
                  let interactivePrompt = msg.metadata?.interactive_prompt;
                  if (typeof msg.content === "string" && msg.content.trim().startsWith("{")) {
                    try {
                      const parsed = JSON.parse(msg.content);
                      if (parsed.content) displayContent = parsed.content;
                      if (parsed.interactive_prompt) interactivePrompt = parsed.interactive_prompt;
                    } catch {}
                  }
                  return (
                    <>
                      <ReactMarkdown className="prose prose-xs max-w-none text-white [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:my-2 [&>ol]:my-2 [&>li]:mb-1 [&>strong]:font-semibold [&>code]:bg-black/30 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>pre]:bg-black/50 [&>pre]:p-2 [&>pre]:rounded [&>pre]:text-[10px] [&>pre]:overflow-x-auto [&>h3]:font-semibold [&>h3]:mt-2 [&>h3]:mb-1">
                        {displayContent}
                      </ReactMarkdown>
                      {interactivePrompt && (
                        <InteractivePrompt
                          prompt={interactivePrompt}
                          onResponse={sendInteractiveResponse}
                        />
                      )}
                    </>
                  );
                })()}
              </div> :
              <p>{msg.content}</p>}
                  </div>
                </div>
          )
          }
            {sending &&
            <div className="flex justify-start gap-2">
                  <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                    <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a82e8090f60786b869983c/7708b64f5_generated_image.png" alt="Nana" className="w-full h-full object-contain" />
                  </div>
                <div className="bg-[#2D2D2D] border border-[#3D3D3D] rounded-2xl px-3 py-2 flex gap-1 items-center">
                  {[0, 1, 2].map((i) =>
              <div key={i} className="w-1.5 h-1.5 bg-[#8FA4C8] rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              )}
                </div>
              </div>
          }
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-2.5 bg-[#0F1114] border-t border-[#2D2D2D] flex-shrink-0">
            <div className="flex gap-2 bg-[#2D2D2D] rounded-xl border border-[#3D3D3D] px-3 py-1.5">
              <textarea
              className="flex-1 text-xs text-white resize-none outline-none bg-transparent placeholder:text-[#8FA4C8] max-h-16"
              rows={1}
              placeholder="Tanya atau catat transaksi..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey} />

              <button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              className="w-7 h-7 rounded-full bg-[#FF6A00] flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:bg-[#e05e00] transition-colors self-end">

                <Send className="w-3 h-3 text-white" />
              </button>
            </div>
          </div>
          </div>
          }
    </>);

}