import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Sparkles, Plus } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAppSettings } from "@/components/utils/useAppSettings";

export default function Nana() {
  const { t } = useAppSettings();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
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

  async function sendMessage() {
    if (!input.trim() || sending) return;

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
    <div className="flex flex-col h-screen bg-[#F2F4F7]">
      {/* Header */}
      <div className="bg-[#0A0A0A] px-5 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#FF6A00] flex items-center justify-center text-white font-bold text-sm">N</div>
          <div>
            <p className="text-white font-bold text-sm">Nana</p>
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
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center pt-10">
            <div className="w-6 h-6 border-2 border-[#FF6A00] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : visibleMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 pt-10">
            <div className="w-14 h-14 rounded-full bg-[#FF6A00]/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[#FF6A00]" />
            </div>
            <p className="text-[#0A0A0A] font-bold text-base">{t('nana_greeting')}</p>
            <p className="text-[#8FA4C8] text-sm max-w-xs">{t('nana_greeting_desc')}</p>
            <div className="grid grid-cols-1 gap-2 mt-2 w-full max-w-xs">
              {["Berapa total pengeluaranku bulan ini?", "Bantu aku buat target tabungan", "Cek tagihan yang hampir jatuh tempo"].map(s => (
                <button key={s} onClick={() => setInput(s)}
                  className="text-left text-xs bg-white border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[#1A1A1A] hover:border-[#FF6A00] hover:bg-[#FF6A00]/5 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          visibleMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-[#FF6A00] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5">N</div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${
                msg.role === "user"
                  ? "bg-[#FF6A00] text-white"
                  : "bg-white border border-[#E2E8F0] text-[#1A1A1A]"
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
            <div className="w-7 h-7 rounded-full bg-[#FF6A00] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">N</div>
            <div className="bg-white border border-[#E2E8F0] rounded-2xl px-3.5 py-2.5 flex gap-1 items-center">
              {[0,1,2].map(i => (
                <div key={i} className="w-1.5 h-1.5 bg-[#8FA4C8] rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 bg-[#F2F4F7]">
        <div className="flex gap-2 bg-white rounded-2xl border border-[#E2E8F0] px-4 py-2 shadow-sm">
          <textarea
            className="flex-1 text-sm text-[#1A1A1A] resize-none outline-none bg-transparent placeholder:text-[#C0C9D8] max-h-24"
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
      </div>
    </div>
  );
}