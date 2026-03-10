import { useState, useEffect, useRef } from "react";
import { Send, Sparkles, X, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useFinancialContext } from "./useFinancialContext";

const DEFAULT_CATS = {
  expense: [
    { key: "housing", label: "Rumah", emoji: "🏠" },
    { key: "food", label: "Makanan", emoji: "🍔" },
    { key: "transport", label: "Transportasi", emoji: "🚗" },
    { key: "health", label: "Kesehatan", emoji: "❤️" },
    { key: "entertainment", label: "Hiburan", emoji: "🎬" },
    { key: "shopping", label: "Belanja", emoji: "🛍️" },
    { key: "subscriptions", label: "Langganan", emoji: "📱" },
    { key: "other", label: "Lainnya", emoji: "📦" },
  ],
  income: [
    { key: "salary", label: "Gaji", emoji: "💼" },
    { key: "freelance", label: "Freelance", emoji: "💻" },
    { key: "other", label: "Lainnya", emoji: "📦" },
  ],
};

const FOOD_SUBCATEGORIES = [
  { key: "food_street", label: "🥘 Makanan Jalanan", emoji: "🥘", description: "Seblak, Martabak, Batagor, Siomay, dll" },
  { key: "food_restaurant", label: "🍽️ Restoran / Cafe", emoji: "🍽️", description: "Makan dine-in, kafe" },
  { key: "food_delivery", label: "🛵 Delivery / Pesan Antar", emoji: "🛵", description: "GoFood, GrabFood, ShopeeFood" },
  { key: "food_grocery", label: "🛒 Groceries / Belanja Bahan", emoji: "🛒", description: "Indomaret, Alfamart, pasar, supermarket" },
];

const CATEGORY_KEYWORDS = {
  food: [
    // Generic
    "makan", "minum", "makanan", "minuman", "snack", "jajan", "kuliner",
    // Indonesian street food & dishes
    "nasi", "ayam", "mie", "mi", "bakso", "baso", "soto", "rendang", "sate", "satay",
    "martabak", "terang bulan", "gado-gado", "gadogado", "pecel", "lontong",
    "ketoprak", "batagor", "siomay", "cilok", "cimol", "cireng", "cuanki",
    "empek-empek", "pempek", "otak-otak", "seblak", "mie ayam", "mie goreng",
    "mie rebus", "mie kuah", "kwetiau", "bihun", "nasi goreng", "nasi uduk",
    "nasi padang", "nasi kuning", "nasi liwet", "nasi pecel", "nasi campur",
    "nasi bakar", "bubur ayam", "bubur", "ketupat", "opor", "rawon",
    "gulai", "tongseng", "semur", "garang asem", "pindang", "ikan bakar",
    "ayam geprek", "geprek", "ayam goreng", "ayam bakar", "bebek goreng",
    "bebek betutu", "pepes", "tempe", "tahu", "tofu", "gado",
    "rujak", "asinan", "kerupuk", "krupuk", "emping", "rempeyek",
    "lumpia", "risoles", "kroket", "lemper", "klepon", "onde-onde",
    "dadar gulung", "kue", "donat", "doughnut", "roti", "toast",
    "sandwich", "burger", "pizza", "pasta", "steak", "hotdog",
    "sushi", "ramen", "dimsum", "dim sum", "shabu", "bbq",
    // Drinks & beverages
    "kopi", "coffee", "espresso", "latte", "cappuccino", "americano",
    "teh", "boba", "bubble tea", "thai tea", "susu", "milk",
    "jus", "juice", "smoothie", "minuman", "es teh", "es jeruk",
    "es campur", "es cendol", "cendol", "segar",
    // Restaurants & delivery
    "cafe", "kafe", "restoran", "warung", "warteg", "kedai", "depot",
    "kantin", "foodcourt", "food court", "gofood", "grabfood", "shopeefood",
    "shopee food", "traveloka food", "delivery", "ojek makan",
    // Snacks & desserts
    "indomie", "indomaret", "alfamart", "superindo", "chiki", "chitato",
    "cheetos", "oreo", "wafer", "permen", "coklat", "chocolate",
    "ice cream", "es krim", "gelato", "pudding", "puding",
    // Specific well-known brands/places
    "mcd", "mcdonalds", "kfc", "wendy", "burger king", "a&w", "j.co",
    "starbucks", "chatime", "tiger sugar", "koi", "janji jiwa", "kopi kenangan",
  ],
  transport: ["gojek", "grab", "taxi", "taksi", "ojek", "bensin", "bbm", "parkir", "tol", "busway", "mrt", "lrt", "kereta", "angkot", "bus", "commuter", "transjakarta", "maxim"],
  shopping: ["shopee", "tokopedia", "lazada", "baju", "sepatu", "tas", "pakaian", "fashion", "belanja"],
  health: ["dokter", "rumah sakit", "obat", "apotek", "klinik", "periksa", "gym", "fitness"],
  entertainment: ["bioskop", "film", "movie", "game", "konser", "tiket", "hiburan"],
  subscriptions: ["netflix", "spotify", "youtube premium", "icloud", "disney", "langganan"],
  housing: ["listrik", "air", "pdam", "wifi", "internet", "sewa", "kost", "kontrakan", "gas"],
  salary: ["gaji", "salary", "upah", "honor"],
  freelance: ["freelance", "proyek", "project", "fee"],
};

function detectCategory(text) {
  const lower = text.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return cat;
  }
  return null;
}

function parseTransaction(text) {
  // Match amount: number possibly with k/ribu/juta suffix
  const amountRegex = /(\d[\d.,]*)\s*(ribu|rb|k|juta|jt|miliar|mil)?\b/gi;
  const matches = [...text.matchAll(amountRegex)];
  let amount = null;
  let amountStr = null;
  for (const m of matches) {
    const num = parseFloat(m[1].replace(/\./g, "").replace(/,/g, "."));
    const suffix = (m[2] || "").toLowerCase();
    let value = num;
    if (["ribu", "rb", "k"].includes(suffix)) value = num * 1000;
    else if (["juta", "jt"].includes(suffix)) value = num * 1000000;
    else if (["miliar", "mil"].includes(suffix)) value = num * 1000000000;
    if (value >= 100) { amount = value; amountStr = m[0]; break; }
  }
  if (!amount) return null;

  const note = text.replace(amountStr, "").trim().replace(/\s+/g, " ") || "Transaksi";
  const incomeKW = ["terima", "dapat", "gaji", "masuk", "income", "pemasukan", "salary"];
  const isIncome = incomeKW.some((kw) => text.toLowerCase().includes(kw));
  const category = detectCategory(text);

  return { amount, note, type: isIncome ? "income" : "expense", category };
}

export default function NanaChatBoxInline({ user }) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [lastReply, setLastReply] = useState(null);
  const [customCats, setCustomCats] = useState([]);
  const [subCatPopup, setSubCatPopup] = useState(null);
  const [pendingTx, setPendingTx] = useState(null);
  const convRef = useRef(null);
  const pollingRef = useRef(null);
  const { context, formatContextForMessage } = useFinancialContext();

  useEffect(() => {
    base44.entities.CustomCategory.list("-created_date").then(setCustomCats).catch(() => {});
  }, []);

  // Build subcategory map
  const subCatsByParent = {};
  customCats.filter((c) => c.parent_category_key).forEach((c) => {
    if (!subCatsByParent[c.parent_category_key]) subCatsByParent[c.parent_category_key] = [];
    subCatsByParent[c.parent_category_key].push({ key: `custom_${c.id}`, label: c.name, emoji: c.emoji });
  });

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

  async function createTransaction(txData) {
    setSending(true);
    try {
      await base44.entities.Transaction.create({
        amount: txData.amount,
        type: txData.type,
        category: txData.category || "other",
        note: txData.note,
        date: new Date().toISOString().split("T")[0],
      });
      const fmt = new Intl.NumberFormat("id-ID").format(txData.amount);
      const allCats = [...DEFAULT_CATS.expense, ...DEFAULT_CATS.income];
      const catObj = allCats.find((c) => c.key === txData.category);
      const subCat = Object.values(subCatsByParent).flat().find((s) => s.key === txData.category);
      const catLabel = subCat?.label || catObj?.label || txData.category;
      const catEmoji = subCat?.emoji || catObj?.emoji || "📦";
      setLastReply({ content: `✅ Tercatat! ${catEmoji} ${txData.type === "income" ? "Pemasukan" : "Pengeluaran"} Rp ${fmt} untuk "${txData.note}" (${catLabel}) berhasil disimpan.`, interactivePrompt: null });
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
      if (parsed.category && subCatsByParent[parsed.category]?.length > 0) {
        const allCats = [...DEFAULT_CATS.expense, ...DEFAULT_CATS.income];
        const parentCat = allCats.find((c) => c.key === parsed.category);
        setSubCatPopup({
          parentKey: parsed.category,
          parentLabel: parentCat?.label || parsed.category,
          parentEmoji: parentCat?.emoji || "📦",
          subs: subCatsByParent[parsed.category],
        });
      } else {
        await createTransaction(parsed);
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
                  onClick={() => createTransaction({ ...pendingTx, category: sub.key })}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#FF6A00] hover:bg-[#FF6A00]/5 transition-all tap-highlight-fix"
                >
                  <span className="text-2xl">{sub.emoji}</span>
                  <span className="text-[10px] font-semibold text-[#4A5568] text-center leading-tight">{sub.label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => createTransaction({ ...pendingTx, category: subCatPopup.parentKey })}
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