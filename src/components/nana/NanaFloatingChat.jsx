import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Sparkles, Plus, X, Minus } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function NanaFloatingChat() {
  const [open, setOpen] = useState(false);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

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

  async function openChat() {
    setOpen(true);
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
      metadata: { name: `Obrolan ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short" })}` },
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
        metadata: { name: `Obrolan ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short" })}` },
      });
      setActiveConv(conv);
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
    <>
      <style>{`
        @keyframes float-bounce {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(2deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 4px 20px rgba(255,106,0,0.3); }
          50% { box-shadow: 0 4px 30px rgba(255,106,0,0.6); }
        }
        .nana-float { animation: float-bounce 3s ease-in-out infinite, pulse-glow 2s ease-in-out infinite; }
      `}</style>
      {/* Floating button */}
      {!open && (
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a82e8090f60786b869983c/83b9f64b6_generated_image.png" 
          alt="Nana AI" 
          onClick={openChat}
          className="fixed bottom-24 right-4 sm:bottom-6 sm:right-6 z-50 w-14 h-14 hover:opacity-90 transition-all active:scale-95 nana-float cursor-pointer"
        />
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[380px] max-w-[420px] rounded-2xl shadow-2xl flex flex-col bg-white border border-[#E2E8F0] overflow-hidden"
          style={{ height: "520px", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}>
          
          {/* Header */}
          <div className="bg-[#0A0A0A] px-4 py-3 flex items-center gap-3 flex-shrink-0">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a82e8090f60786b869983c/83b9f64b6_generated_image.png" 
              alt="Nana" 
              className="w-8 h-8 rounded-full"
            />
            <div className="flex-1">
              <p className="text-white font-bold text-sm">Nana</p>
              <p className="text-[#8FA4C8] text-[10px]">Asisten Keuangan AI</p>
            </div>
            <button onClick={newConversation} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors" title="Obrolan baru">
              <Plus className="w-3.5 h-3.5 text-white" />
            </button>
            <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <X className="w-3.5 h-3.5 text-white" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-[#F8F9FB]">
            {loading ? (
              <div className="flex justify-center pt-10">
                <div className="w-5 h-5 border-2 border-[#FF6A00] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : visibleMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-2 pt-4">
               <div className="w-12 h-12 rounded-full overflow-hidden">
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a82e8090f60786b869983c/83b9f64b6_generated_image.png" 
                    alt="Nana" 
                    className="w-full h-full"
                  />
                </div>
                <p className="text-[#0A0A0A] font-bold text-sm">Halo! Aku Nana 👋</p>
                <p className="text-[#8FA4C8] text-xs max-w-[220px]">Tanya apa saja soal keuanganmu!</p>
                <div className="flex flex-col gap-1.5 mt-1 w-full">
                  {["Berapa pengeluaranku bulan ini?", "Bantu buat target tabungan", "Cek tagihan jatuh tempo"].map(s => (
                    <button key={s} onClick={() => setInput(s)}
                      className="text-left text-xs bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-[#1A1A1A] hover:border-[#FF6A00] hover:bg-[#FF6A00]/5 transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              visibleMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
                  {msg.role === "assistant" && (
                     <img 
                       src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a82e8090f60786b869983c/83b9f64b6_generated_image.png" 
                       alt="Nana" 
                       className="w-6 h-6 rounded-full flex-shrink-0 mt-0.5"
                     />
                   )}
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${
                    msg.role === "user" ? "bg-[#FF6A00] text-white" : "bg-white border border-[#E2E8F0] text-[#1A1A1A]"
                  }`}>
                    {msg.role === "assistant" ? (
                      <ReactMarkdown className="prose prose-xs max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 text-[#1A1A1A]">
                        {msg.content}
                      </ReactMarkdown>
                    ) : <p>{msg.content}</p>}
                  </div>
                </div>
              ))
            )}
            {sending && (
               <div className="flex justify-start gap-2">
                 <img 
                   src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a82e8090f60786b869983c/f91470034_generated_image.png" 
                   alt="Nana" 
                   className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                 />
                <div className="bg-white border border-[#E2E8F0] rounded-2xl px-3 py-2 flex gap-1 items-center">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 bg-[#8FA4C8] rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-2.5 bg-white border-t border-[#E2E8F0] flex-shrink-0">
            <div className="flex gap-2 bg-[#F8F9FB] rounded-xl border border-[#E2E8F0] px-3 py-1.5">
              <textarea
                className="flex-1 text-xs text-[#1A1A1A] resize-none outline-none bg-transparent placeholder:text-[#C0C9D8] max-h-16"
                rows={1}
                placeholder="Tanya Nana sesuatu..."
                value={input}
                onChange={e => setInput(e.target.value)}
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
      )}
    </>
  );
}