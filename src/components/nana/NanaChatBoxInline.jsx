import { useState } from "react";
import { Send, Sparkles, PlusCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useFinancialContext } from "./useFinancialContext";
import NanaQuickEntryModal from "./NanaQuickEntryModal";

export default function NanaChatBoxInline({ user }) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const { context, formatContextForMessage } = useFinancialContext();

  async function getOrCreateConv() {
    const convs = await base44.agents.listConversations({ agent_name: "nana" });
    if (convs && convs.length > 0) return convs[0];
    return base44.agents.createConversation({
      agent_name: "nana",
      metadata: { name: `Obrolan ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short" })}` }
    });
  }

  async function sendMessage() {
    if (!input.trim() || sending) return;
    setSending(true);
    const text = input;
    setInput("");
    const conv = await getOrCreateConv();
    const contextBlock = formatContextForMessage(context);
    await base44.agents.addMessage(conv, { role: "user", content: text + contextBlock });
    setSending(false);
  }

  async function sendFromModal(text) {
    const conv = await getOrCreateConv();
    const contextBlock = formatContextForMessage(context);
    await base44.agents.addMessage(conv, { role: "user", content: text + contextBlock });
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="bg-[#0A0A0A] rounded-2xl overflow-hidden px-4 py-3 flex items-center gap-3" style={{ boxShadow: '0 0 0 1.5px #FF6A00, 0 8px 32px rgba(255,106,0,0.35)' }}>
      {showEntryModal && (
        <NanaQuickEntryModal onClose={() => setShowEntryModal(false)} onSend={sendFromModal} />
      )}

      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-black border-2 border-[#2D2D2D] overflow-hidden flex-shrink-0">
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a82e8090f60786b869983c/7708b64f5_generated_image.png"
          alt="Nana"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Name + Input */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-xs font-bold flex items-center gap-1 mb-1">
          Nana AI <Sparkles className="w-3 h-3 text-[#FF6A00]" />
        </p>
        <div className="flex gap-2 bg-[#2D2D2D] rounded-xl border border-[#3D3D3D] px-3 py-1.5">
          <textarea
            className="flex-1 text-xs text-white resize-none outline-none bg-transparent placeholder:text-[#8FA4C8] max-h-16"
            rows={1}
            placeholder="Tanya atau catat transaksi..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
          />
          <button
            onClick={() => setShowEntryModal(true)}
            className="w-7 h-7 rounded-full bg-[#2D2D2D] border border-[#FF6A00]/50 flex items-center justify-center flex-shrink-0 hover:bg-[#FF6A00]/20 transition-colors self-end"
            title="Catat transaksi / investasi"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#FF6A00]" />
          </button>
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="w-7 h-7 rounded-full bg-[#FF6A00] flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:bg-[#e05e00] transition-colors self-end"
          >
            {sending ? (
              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-3 h-3 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}