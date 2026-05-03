import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Plus, AlertTriangle, TrendingDown, Target, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useFinancialContext } from "./useFinancialContext";
import InteractivePrompt from "./InteractivePrompt";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function NanaDashboardChat() {
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState(null);
  const [user, setUser] = useState(null);
  const bottomRef = useRef(null);
  const { context, formatContextForMessage } = useFinancialContext(true);

  const FREE_NANA_LIMIT = 30;
  const isPremium = user?.subscription_plan === "premium_monthly" || user?.subscription_plan === "premium_yearly";
  const currentMonth = new Date().toISOString().slice(0, 7);
  const chatCount = user?.nana_message_month === currentMonth ? (user?.nana_message_count || 0) : 0;
  const nanaLimitReached = !isPremium && chatCount >= FREE_NANA_LIMIT;

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      base44.entities.NanaPreferences.filter({ created_by: u.email }).then((prefs) => {
        if (prefs?.length > 0) setPreferences(prefs[0]);
      }).catch(() => {});
    }).catch(() => {});

    // Load latest conversation
    setLoading(true);
    base44.agents.listConversations({ agent_name: "nana" }).then(async (convs) => {
      if (convs && convs.length > 0) {
        const conv = await base44.agents.getConversation(convs[0].id);
        setActiveConv(conv);
        setMessages(conv.messages || []);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

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
    if (!input.trim() || sending || nanaLimitReached) return;
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
    if (!isPremium) {
      const newCount = chatCount + 1;
      await base44.auth.updateMe({ nana_message_count: newCount, nana_message_month: currentMonth });
      setUser((u) => ({ ...u, nana_message_count: newCount, nana_message_month: currentMonth }));
    }
    setSending(false);
  }

  async function sendInteractiveResponse(displayText) {
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

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const visibleMessages = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => m.role === "user"
      ? { ...m, content: m.content?.replace(/\n\n---\n\[FINANCIAL_CONTEXT[\s\S]*?\[\/FINANCIAL_CONTEXT\]\n---/g, "").trim() }
      : m
    );

  // Quick prompts
  const quickPrompts = [
    "Analisis pengeluaranku bulan ini",
    context?.thisMonth?.spendingSpikes?.length > 0
      ? `${context.thisMonth.spendingSpikes[0].category}ku melonjak, bantu hemat`
      : "Rekomendasikan cara menabung lebih banyak",
    "Prioritaskan utangku berdasarkan bunga",
  ];

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 4px 24px rgba(255,106,0,0.18), 0 1px 4px rgba(255,106,0,0.08)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E2E8F0]">
        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-[#FF6A00]/50">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a82e8090f60786b869983c/7708b64f5_generated_image.png"
            alt="Nana"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-[#0A0A0A] font-bold text-sm">Nana AI</p>
            <Sparkles className="w-3 h-3 text-[#FF6A00]" />
          </div>
          <p className="text-[#8FA4C8] text-[10px]">Asisten Keuangan Pribadi</p>

        </div>
        <button
          onClick={newConversation}
          className="w-7 h-7 rounded-full bg-[#F2F4F7] flex items-center justify-center hover:bg-[#E2E8F0] transition-colors tap-highlight-fix"
          title="Obrolan baru"
        >
          <Plus className="w-3.5 h-3.5 text-[#0A0A0A]" />
        </button>
        <Link
          to={createPageUrl("Nana")}
          className="text-[10px] text-[#8FA4C8] hover:text-[#0A0A0A] transition-colors px-2 py-1 rounded-lg hover:bg-[#F2F4F7]"
        >
          Buka full →
        </Link>
      </div>

      {/* Messages */}
      <div className="h-64 overflow-y-auto px-3 py-3 space-y-3 bg-white">
        {loading ? (
          <div className="flex justify-center pt-10">
            <div className="w-5 h-5 border-2 border-[#FF6A00] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : visibleMessages.length === 0 ? (
          <div className="flex flex-col gap-2 pt-2">
            {/* Proactive alerts */}
            {context && (() => {
              const alerts = [];
              context.budgetStatus?.forEach((b) => {
                if (b.pct >= 80) alerts.push({
                  Icon: AlertTriangle,
                  color: "#F5A623",
                  text: `${b.category} ${b.pct >= 100 ? "over budget!" : `${b.pct}% terpakai`}`,
                  prompt: `Analisis pengeluaran ${b.category}ku yang sudah ${b.pct}% dari anggaran`
                });
              });
              const highDebt = context.debts?.find((d) => (d.interestRate || 0) >= 18);
              if (highDebt) alerts.push({
                Icon: TrendingDown, color: "#FF6B6B",
                text: `Utang bunga tinggi: ${highDebt.name}`,
                prompt: `Strategi pelunasan utang ${highDebt.name} berbunga ${highDebt.interestRate}%`
              });
              const urgentGoal = context.goals?.find((g) => g.daysLeft !== null && g.daysLeft < 30 && g.pct < 100);
              if (urgentGoal) alerts.push({
                Icon: Target, color: "#4F7CFF",
                text: `Tujuan mendesak: ${urgentGoal.name} (${urgentGoal.daysLeft}h)`,
                prompt: `Tujuanku "${urgentGoal.name}" deadline ${urgentGoal.daysLeft} hari lagi baru ${urgentGoal.pct}%`
              });

              if (alerts.length > 0) return (
                <div className="space-y-1.5 mb-1">
                  <p className="text-[10px] text-[#8FA4C8] font-medium">⚡ Perlu perhatian</p>
                  {alerts.slice(0, 2).map((a, i) => (
                    <button key={i} onClick={() => setInput(a.prompt)}
                      className="w-full text-left text-[11px] rounded-xl px-3 py-2 border transition-colors flex items-center gap-2"
                      style={{ background: `${a.color}20`, borderColor: `${a.color}40`, color: "#fff" }}>
                      <a.Icon className="w-3 h-3 flex-shrink-0" style={{ color: a.color }} />
                      {a.text}
                    </button>
                  ))}
                </div>
              );
              return null;
            })()}

            <p className="text-[10px] text-[#8FA4C8] font-medium">💬 Mulai dari sini</p>
            {quickPrompts.map((s) => (
              <button key={s} onClick={() => setInput(s)}
                className="w-full text-left text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2 text-[#1A1A1A] hover:border-[#FF6A00]/50 hover:bg-[#FF6A00]/5 transition-colors">
                {s}
              </button>
            ))}
          </div>
        ) : (
          visibleMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
              {msg.role === "assistant" && (
                <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0 mt-0.5">
                  <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a82e8090f60786b869983c/7708b64f5_generated_image.png" alt="Nana" className="w-full h-full object-contain" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${
                msg.role === "user"
                  ? "bg-[#FF6A00] text-white"
                  : "bg-[#F2F4F7] border border-[#E2E8F0] text-[#1A1A1A]"
              }`}>
                {msg.role === "assistant" ? (() => {
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
                      <ReactMarkdown className="prose prose-xs max-w-none text-[#1A1A1A] [&>p]:mb-1 [&>p:last-child]:mb-0 [&>ul]:my-1 [&>li]:mb-0.5 [&>strong]:font-semibold">
                        {displayContent}
                      </ReactMarkdown>
                      {interactivePrompt && (
                        <InteractivePrompt prompt={interactivePrompt} onResponse={sendInteractiveResponse} />
                      )}
                    </>
                  );
                })() : <p>{msg.content}</p>}
              </div>
            </div>
          ))
        )}
        {sending && (
          <div className="flex gap-2">
            <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a82e8090f60786b869983c/7708b64f5_generated_image.png" alt="Nana" className="w-full h-full object-contain" />
            </div>
            <div className="bg-[#F2F4F7] border border-[#E2E8F0] rounded-2xl px-3 py-2 flex gap-1 items-center">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-1.5 h-1.5 bg-[#8FA4C8] rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-2.5 border-t border-[#E2E8F0]">
        {nanaLimitReached ? (
          <p className="text-xs text-[#8FA4C8] text-center py-1">
            Batas {FREE_NANA_LIMIT} chat/bulan tercapai. <Link to="/Subscription" className="text-[#FF6A00] font-semibold underline">Upgrade</Link>
          </p>
        ) : (
          <div className="flex gap-2 bg-[#F2F4F7] rounded-xl border border-[#E2E8F0] px-3 py-1.5">
            <textarea
              className="flex-1 text-xs text-[#1A1A1A] resize-none outline-none bg-transparent placeholder:text-[#8FA4C8] max-h-16"
              rows={1}
              placeholder="Tanya atau catat transaksi..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              className="w-7 h-7 rounded-full bg-[#FF6A00] flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:bg-[#e05e00] transition-colors self-end tap-highlight-fix"
            >
              <Send className="w-3 h-3 text-white" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}