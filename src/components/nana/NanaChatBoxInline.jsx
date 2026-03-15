import { useState, useEffect, useRef } from "react";
import { Send, Sparkles, X, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useFinancialContext } from "./useFinancialContext";
import { useCategoryManager } from "@/components/utils/useCategoryManager";

export default function NanaChatBoxInline({ user }) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [lastReply, setLastReply] = useState(null);
  const [subCatPopup, setSubCatPopup] = useState(null);
  const [pendingTx, setPendingTx] = useState(null);
  const convRef = useRef(null);
  const pollingRef = useRef(null);
  const { context, formatContextForMessage } = useFinancialContext();
  const { parseTransaction, createTransaction: createTxFromHook, formatCategory, subCatsByParent } = useCategoryManager();

  async function getOrCreateConv() {
    if (convRef.current) return convRef.current;
    const convs = await base44.agents.listConversations({ agent_name: "nana" });
    const conv =
      convs && convs.length > 0
        ? convs[0]
        : await base44.agents.createConversation({
            agent_name: "nana",
            metadata: { name: `Obrolan ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short" })}` },
          });
    convRef.current = conv;
    return conv;
  }

  function startPolling() {
    stopPolling();
    pollingRef.current = setInterval(async () => {
      const conv = convRef.current;
      if (!conv) return;
      const updated = await base44.agents.getConversation(conv.id);
      const msgs = updated?.messages || [];
      const last = msgs[msgs.length - 1];
      if (last?.role === "assistant") {
        let content = last.content || "";
        let interactivePrompt = last.metadata?.interactive_prompt || null;
        if (content.trim().startsWith("{")) {
          try {
            const p = JSON.parse(content);
            if (p.content) content = p.content;
            if (p.interactive_prompt) interactivePrompt = p.interactive_prompt;
          } catch {}
        }
        setLastReply({ content, interactivePrompt });
        stopPolling();
        setSending(false);
      }
    }, 2000);
  }

  function stopPolling() {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
  }

  useEffect(() => () => stopPolling(), []);

  async function handleCreateTransaction(txData) {
    setSending(true);
    try {
      await createTxFromHook(txData);
      const fmt = new Intl.NumberFormat("id-ID").format(txData.amount);
      const { emoji, label } = formatCategory(txData.category || "other");
      setLastReply({
        content: `✅ Tercatat! ${emoji} ${txData.type === "income" ? "Pemasukan" : "Pengeluaran"} Rp ${fmt} untuk "${txData.note}" (${label}) berhasil disimpan.`,
        interactivePrompt: null,
      });
    } finally {
      setSending(false);
      setPendingTx(null);
      setSubCatPopup(null);
    }
  }

  async function sendInteractiveResponse(displayText) {
    if (sending) return;
    setSending(true);
    setLastReply(null);
    const conv = await getOrCreateConv();
    await base44.agents.addMessage(conv, { role: "user", content: displayText + formatContextForMessage(context) });
    startPolling();
  }

  async function sendToNana(text) {
    setSending(true);
    setLastReply(null);
    setInput("");
    const conv = await getOrCreateConv();
    await base44.agents.addMessage(conv, { role: "user", content: text + formatContextForMessage(context) });
    startPolling();
  }

  async function handleSend() {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput("");
    const parsed = parseTransaction(text);

    if (parsed) {
      setPendingTx(parsed);
      // Check custom subcategories only
      const subs = subCatsByParent[parsed.category] || [];
      if (subs.length > 0) {
        const { emoji, label } = formatCategory(parsed.category);
        setSubCatPopup({
          parentKey: parsed.category,
          parentLabel: label,
          parentEmoji: emoji,
          subs,
        });
      } else {
        await handleCreateTransaction(parsed);
      }
    } else {
      await sendToNana(text);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  return (
    <>
      <div
        className="bg-[#0A0A0A] rounded-2xl overflow-hidden px-4 py-3 flex flex-col gap-3"
        style={{ boxShadow: "0 0 0 1.5px #FF6A00, 0 8px 32px rgba(255,106,0,0.35)" }}
      >
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
            {sending && <p className="text-[#8FA4C8] text-[10px]">Memproses...</p>}
          </div>
        </div>

        {/* Last reply preview */}
        {lastReply && !sending && (
          <div className="bg-[#1A1A1A] rounded-xl px-3 py-2 space-y-2">
            {lastReply.content && (
              <p className="text-white text-xs leading-relaxed line-clamp-3">{lastReply.content}</p>
            )}
            {lastReply.interactivePrompt && (
              <div className="space-y-1.5">
                {lastReply.interactivePrompt.question && (
                  <p className="text-[#8FA4C8] text-[10px] font-medium">{lastReply.interactivePrompt.question}</p>
                )}
                {lastReply.interactivePrompt.type === "select_one" && lastReply.interactivePrompt.options?.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => sendInteractiveResponse(opt.label)}
                    className="w-full text-left text-[10px] bg-[#2D2D2D] border border-[#3D3D3D] rounded-lg px-2.5 py-1.5 text-white hover:border-[#FF6A00] hover:bg-[#FF6A00]/10 transition-colors flex items-center justify-between group"
                  >
                    <span>{opt.label}</span>
                    <ChevronRight className="w-3 h-3 text-[#8FA4C8] group-hover:text-[#FF6A00] flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
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
            onClick={handleSend}
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

      {/* Sub-category popup */}
      {subCatPopup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-xs shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{subCatPopup.parentEmoji}</span>
                <div>
                  <p className="text-xs text-[#8FA4C8] font-medium">Pilih sub-kategori</p>
                  <p className="text-sm font-bold text-[#1A1A1A]">{subCatPopup.parentLabel}</p>
                </div>
              </div>
              <button onClick={() => { setSubCatPopup(null); setPendingTx(null); }} className="text-[#9B9B9B] hover:text-[#1A1A1A]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {subCatPopup.subs.map((sub) => (
                <button
                  key={sub.key}
                  onClick={() => handleCreateTransaction({ ...pendingTx, category: sub.key })}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#FF6A00] hover:bg-[#FF6A00]/5 transition-all tap-highlight-fix"
                >
                  <span className="text-2xl">{sub.emoji}</span>
                  <span className="text-[10px] font-semibold text-[#4A5568] text-center leading-tight">{sub.label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => handleCreateTransaction({ ...pendingTx, category: subCatPopup.parentKey })}
              className="mt-3 w-full py-2.5 rounded-xl border border-[#E2E8F0] text-xs font-semibold text-[#8FA4C8] hover:border-[#CBD5E0] transition-colors tap-highlight-fix"
            >
              Pilih "{subCatPopup.parentLabel}" saja
            </button>
          </div>
        </div>
      )}
    </>
  );
}