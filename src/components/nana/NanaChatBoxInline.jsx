import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useFinancialContext } from "./useFinancialContext";
import InteractivePrompt from "./InteractivePrompt";

export default function NanaChatBoxInline({ user }) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([]);
  const convRef = useRef(null);
  const pollingRef = useRef(null);
  const { context, formatContextForMessage } = useFinancialContext();

  async function getOrCreateConv() {
    if (convRef.current) return convRef.current;
    const convs = await base44.agents.listConversations({ agent_name: "nana" });
    const conv = (convs && convs.length > 0)
      ? convs[0]
      : await base44.agents.createConversation({
          agent_name: "nana",
          metadata: { name: `Obrolan ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short" })}` }
        });
    convRef.current = conv;
    return conv;
  }

  const fetchMessages = useCallback(async () => {
    const conv = await getOrCreateConv();
    const updated = await base44.agents.getConversation(conv.id);
    if (updated?.messages) setMessages(updated.messages);
  }, []);

  // Load messages on mount
  useEffect(() => {
    fetchMessages();
  }, []);

  // Poll for new messages when sending
  function startPolling() {
    stopPolling();
    pollingRef.current = setInterval(async () => {
      const conv = convRef.current;
      if (!conv) return;
      const updated = await base44.agents.getConversation(conv.id);
      if (updated?.messages) {
        setMessages(updated.messages);
        // Stop polling once we get an assistant reply after the last user message
        const msgs = updated.messages;
        const lastMsg = msgs[msgs.length - 1];
        if (lastMsg?.role === "assistant") {
          stopPolling();
          setSending(false);
        }
      }
    }, 2000);
  }

  function stopPolling() {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }

  useEffect(() => () => stopPolling(), []);

  async function sendMessage() {
    if (!input.trim() || sending) return;
    setSending(true);
    const text = input;
    setInput("");
    const conv = await getOrCreateConv();
    const contextBlock = formatContextForMessage(context);
    // Optimistically add user message
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    await base44.agents.addMessage(conv, { role: "user", content: text + contextBlock });
    startPolling();
  }

  async function sendInteractiveResponse(displayText) {
    if (sending) return;
    setSending(true);
    const conv = await getOrCreateConv();
    const contextBlock = formatContextForMessage(context);
    setMessages((prev) => [...prev, { role: "user", content: displayText }]);
    await base44.agents.addMessage(conv, { role: "user", content: displayText + contextBlock });
    startPolling();
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // Find last assistant message
  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant");

  // Extract interactive_prompt from metadata or JSON content
  let interactivePrompt = lastAssistantMsg?.metadata?.interactive_prompt;
  if (!interactivePrompt && lastAssistantMsg?.content) {
    try {
      const parsed = JSON.parse(lastAssistantMsg.content);
      if (parsed?.interactive_prompt) interactivePrompt = parsed.interactive_prompt;
    } catch {}
  }

  // Check if last message is from user (still waiting for reply)
  const isWaiting = sending || (messages.length > 0 && messages[messages.length - 1]?.role === "user");

  return (
    <div className="bg-[#0A0A0A] rounded-2xl overflow-hidden px-4 py-3 flex flex-col gap-3" style={{ boxShadow: '0 0 0 1.5px #FF6A00, 0 8px 32px rgba(255,106,0,0.35)' }}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-black border-2 border-[#2D2D2D] overflow-hidden flex-shrink-0">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a82e8090f60786b869983c/7708b64f5_generated_image.png"
            alt="Nana"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-xs font-bold flex items-center gap-1">
            Nana AI <Sparkles className="w-3 h-3 text-[#FF6A00]" />
          </p>
          {isWaiting && (
            <p className="text-[#8FA4C8] text-[10px]">Nana sedang mengetik...</p>
          )}
        </div>
      </div>

      {/* Interactive Prompt if present */}
      {interactivePrompt && !isWaiting && (
        <div className="bg-[#1A1A1A] rounded-xl p-3">
          <InteractivePrompt
            prompt={interactivePrompt}
            onResponse={sendInteractiveResponse}
          />
        </div>
      )}

      {/* Input */}
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
  );
}