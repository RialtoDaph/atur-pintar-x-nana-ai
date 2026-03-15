import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Sparkles, Plus, Crown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAppSettings } from "@/components/utils/useAppSettings";
import { Link } from "react-router-dom";

const FREE_MSG_LIMIT = 30;

export default function Nana() {
  const { t } = useAppSettings();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    loadConversations();
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

  async function loadConversations() {
    setLoading(true);
    const convs = await base44.agents.listConversations({ agent_name: "nana" });
    setConversations(convs || []);
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
      metadata: { name: `Obrolan ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short" })}` },
    });
    setActiveConv(conv);
    setMessages([]);
    setConversations(prev => [conv, ...prev]);
  }

  const isPremium = user?.subscription_plan === "premium_monthly" || user?.subscription_plan === "premium_yearly";
  const currentMonth = new Date().toISOString().slice(0, 7);
  const msgCount = user?.nana_message_month === currentMonth ? (user?.nana_message_count || 0) : 0;
  const isLimitReached = !isPremium && msgCount >= FREE_MSG_LIMIT;

  async function sendMessage() {
    if (!input.trim() || sending || isLimitReached) return;

    let conv = activeConv;
    if (!conv) {
      conv = await base44.agents.createConversation({
        agent_name: "nana",
        metadata: { name: `Obrolan ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short" })}` },
      });
      setActiveConv(conv);
      setConversations(prev => [conv, ...prev]);
    }

    setSending(true);
    const text = input;
    setInput("");
    await base44.agents.addMessage(conv, { role: "user", content: text });

    // Update message count for free users
    if (!isPremium) {
      const newCount = msgCount + 1;
      await base44.auth.updateMe({ nana_message_count: newCount, nana_message_month: currentMonth });
      setUser(u => ({ ...u, nana_message_count: newCount, nana_message_month: currentMonth }));
    }

    setSending(false);
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const visibleMessages = messages.filter(m => m.role === "user" || m.role === "assistant");

  return (
    <div className="flex flex-col h-screen bg-[#F2F4F7] dark:bg-[#0F1114]">
      {/* Header */}
      <div className="bg-[#0A0A0A] px-5 pt-4 pb-4 flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#2D2D2D] min-h-[80px]">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-lg overflow-hidden -mt-1 -mb-1">
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a82e8090f60786b869983c/7708b64f5_generated_image.png" alt="Nana" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">Nana AI</p>
            <p className="text-[#8FA4C8] text-[10px]">{t('nana_subtitle')}</p>
          </div>
        </div>
        <button
          onClick={newConversation}
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          title={t('nana_new_chat_title')}
        >
          <Plus className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin scrollbar-thumb-[#E2E8F0] dark:scrollbar-thumb-[#2D2D2D] scrollbar-track-transparent">
        {loading ? (
          <div className="flex justify-center pt-10">
            <div className="w-6 h-6 border-2 border-[#FF6A00] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : visibleMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 pt-10">
            <div className="w-14 h-14 rounded-full bg-[#FF6A00]/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[#FF6A00]" />
            </div>
            <p className="text-[#0A0A0A] dark:text-white font-bold text-base">{t('nana_greeting')}</p>
            <p className="text-[#8FA4C8] text-sm max-w-xs">{t('nana_greeting_desc')}</p>
            <div className="grid grid-cols-1 gap-2 mt-2 w-full max-w-xs">
              {["Berapa total pengeluaranku bulan ini?", "Bantu aku buat target tabungan", "Cek tagihan yang hampir jatuh tempo"].map(s => (
                <button key={s} onClick={() => setInput(s)}
                  className="text-left text-xs bg-white dark:bg-[#1A1E25] border border-[#E2E8F0] dark:border-[#2D2D2D] rounded-xl px-3 py-2.5 text-[#1A1A1A] dark:text-white hover:border-[#FF6A00] hover:bg-[#FF6A00]/5 dark:hover:bg-[#FF6A00]/10 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          visibleMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mt-0.5">
                  <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a82e8090f60786b869983c/7708b64f5_generated_image.png" alt="Nana" className="w-full h-full object-cover" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${
                msg.role === "user"
                  ? "bg-[#FF6A00] text-white"
                  : "bg-white dark:bg-[#1A1E25] border border-[#E2E8F0] dark:border-[#2D2D2D] text-[#1A1A1A] dark:text-white"
              }`}>
                {msg.role === "assistant" ? (
                  <ReactMarkdown className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 text-[#1A1A1A]">
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
            <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a82e8090f60786b869983c/7708b64f5_generated_image.png" alt="Nana" className="w-full h-full object-cover" />
            </div>
            <div className="bg-white dark:bg-[#1A1E25] border border-[#E2E8F0] dark:border-[#2D2D2D] rounded-2xl px-3.5 py-2.5 flex gap-1 items-center">
              {[0,1,2].map(i => (
                <div key={i} className="w-1.5 h-1.5 bg-[#8FA4C8] rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 bg-[#F2F4F7] dark:bg-[#0F1114] border-t border-[#E2E8F0] dark:border-[#2D2D2D]">
        {isLimitReached ? (
          <div className="bg-white dark:bg-[#1A1E25] rounded-2xl border border-[#E2E8F0] dark:border-[#2D2D2D] p-4 text-center shadow-sm">
            <Crown className="w-5 h-5 text-[#FF6A00] mx-auto mb-2" />
            <p className="text-xs font-semibold text-[#1A1A1A] dark:text-white mb-1">Batas pesan tercapai ({FREE_MSG_LIMIT}/bulan)</p>
            <p className="text-[10px] text-[#8FA4C8] mb-3">Upgrade ke Premium untuk chat tanpa batas.</p>
            <Link to="/Subscription" className="inline-block px-4 py-1.5 bg-[#FF6A00] text-white rounded-xl text-xs font-semibold hover:bg-[#e05e00] transition-colors">
              Upgrade Premium
            </Link>
          </div>
        ) : (
          <>
            {!isPremium && (
              <p className="text-[10px] text-[#8FA4C8] text-center mb-2">{msgCount}/{FREE_MSG_LIMIT} pesan bulan ini</p>
            )}
            <div className="flex gap-2 bg-white dark:bg-[#1A1E25] rounded-2xl border border-[#E2E8F0] dark:border-[#2D2D2D] px-4 py-2 shadow-sm">
              <textarea
                className="flex-1 text-sm text-[#1A1A1A] dark:text-white resize-none outline-none bg-transparent dark:bg-transparent placeholder:text-[#C0C9D8] dark:placeholder:text-[#8FA4C8] max-h-24"
                rows={1}
                placeholder={t('nana_input_placeholder')}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || sending}
                className="w-8 h-8 rounded-full bg-[#FF6A00] flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:bg-[#e05e00] transition-colors self-end"
              >
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}