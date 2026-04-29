import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Sparkles, Plus, Crown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAppSettings } from "@/components/utils/useAppSettings";
import { Link } from "react-router-dom";
import { awardXP } from "@/hooks/useGamification";
import { updateStreak, completeMission } from "@/hooks/useGamificationActions";
import MoodPicker from "@/components/nana/MoodPicker";
import NanaQuickActions from "@/components/nana/NanaQuickActions";
import { format } from "date-fns";

const FREE_MSG_LIMIT = 30;
const NANA_AVATAR = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a82e8090f60786b869983c/7708b64f5_generated_image.png";

const MOOD_EMOJIS = { stress: "😤", mager: "😴", happy: "🥳", panik: "😰", normal: "😊" };

export default function Nana() {
  const { t } = useAppSettings();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [todayMood, setTodayMood] = useState(null); // null = loading, false = no mood, object = has mood
  const [moodLoading, setMoodLoading] = useState(false);
  const [todayXP, setTodayXP] = useState(0);
  const bottomRef = useRef(null);
  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      // +5 XP for opening Nana, max 1x per day
      const lastNanaOpen = localStorage.getItem("nana_xp_date");
      if (lastNanaOpen !== today) {
        localStorage.setItem("nana_xp_date", today);
        awardXP(u.email, 5).catch(() => {});
      }
      // Load today XP from localStorage
      const xpKey = `nana_total_xp_${today}`;
      setTodayXP(parseInt(localStorage.getItem(xpKey) || "0", 10));
      // Check mood
      checkTodayMood(u.email);
    }).catch(() => {});
    loadConversations();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const savedNanaMsgIds = useRef(new Set());
  const pendingSaveTimers = useRef({});

  useEffect(() => {
    if (!activeConv) return;
    const unsub = base44.agents.subscribeToConversation(activeConv.id, (data) => {
      const msgs = data.messages || [];
      setMessages(msgs);
      // Save completed Nana (assistant) messages — debounce to avoid saving partial streaming chunks
      msgs.forEach(msg => {
        if (msg.role === "assistant" && msg.id && msg.content && !savedNanaMsgIds.current.has(msg.id)) {
          // Cancel any pending save for this message (content may still be streaming)
          if (pendingSaveTimers.current[msg.id]) {
            clearTimeout(pendingSaveTimers.current[msg.id]);
          }
          // Debounce: save 1.5s after last update for this message id
          pendingSaveTimers.current[msg.id] = setTimeout(() => {
            // Re-check it's not already saved
            if (savedNanaMsgIds.current.has(msg.id)) return;
            savedNanaMsgIds.current.add(msg.id);
            delete pendingSaveTimers.current[msg.id];
            if (user?.email) {
              base44.entities.NanaConversation.create({
                role: "nana",
                message: msg.content,
                session_date: today,
                mood: todayMood?.mood || undefined,
                message_type: "chat",
              }).catch(() => {});
            }
          }, 1500);
        }
      });
    });
    return () => {
      unsub();
      // Clear all pending timers on cleanup
      Object.values(pendingSaveTimers.current).forEach(t => clearTimeout(t));
    };
  }, [activeConv?.id, user?.email]);

  async function checkTodayMood(email) {
    try {
      const records = await base44.entities.MoodCheckIn.filter({ created_by: email, check_in_date: today });
      setTodayMood(records && records.length > 0 ? records[0] : false);
    } catch {
      setTodayMood(false);
    }
  }

  function addTodayXP(amount) {
    const xpKey = `nana_total_xp_${today}`;
    const current = parseInt(localStorage.getItem(xpKey) || "0", 10);
    const newVal = current + amount;
    localStorage.setItem(xpKey, String(newVal));
    setTodayXP(newVal);
  }

  async function handleMoodSelect(moodObj) {
    if (!user || moodLoading) return;
    setMoodLoading(true);
    try {
      const saved = await base44.entities.MoodCheckIn.create({
        mood: moodObj.mood,
        mood_emoji: moodObj.emoji,
        mood_label: moodObj.label,
        check_in_date: today,
      });
      setTodayMood(saved);

      // +5 XP for mood check-in
      awardXP(user.email, 5).catch(() => {});
      addTodayXP(5);

      // Create conversation if needed and send mood trigger
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
      const moodMsg = `[mood:${moodObj.mood}] Hari ini gue lagi ${moodObj.label}`;
      saveToNanaConversation("user", moodMsg, "chat");
      await base44.agents.addMessage(conv, {
        role: "user",
        content: moodMsg,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setMoodLoading(false);
      setSending(false);
    }
  }

  async function loadConversations() {
    setLoading(true);
    try {
      const convs = await base44.agents.listConversations({ agent_name: "nana" });
      setConversations(convs || []);
      if (convs && convs.length > 0) {
        const conv = await base44.agents.getConversation(convs[0].id);
        setActiveConv(conv);
        setMessages(conv.messages || []);
      }
    } catch {}
    setLoading(false);

    // Check for prefilled message from Analytics widgets
    const prefilledMsg = sessionStorage.getItem("nana_prefilled_message");
    if (prefilledMsg) {
      sessionStorage.removeItem("nana_prefilled_message");
      setInput(prefilledMsg);
    }
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

  function detectMessageType(text) {
    const lower = text.toLowerCase();
    if (lower.includes("roast") || lower.includes("hina") || lower.includes("bully")) return "roast";
    if (lower.includes("analisa") || lower.includes("analisis") || lower.includes("laporan") || lower.includes("review keuangan")) return "analysis";
    return "chat";
  }

  async function saveToNanaConversation(role, message, messageType = "chat") {
    if (!user?.email) return;
    base44.entities.NanaConversation.create({
      role,
      message,
      session_date: today,
      mood: todayMood?.mood || undefined,
      message_type: messageType,
    }).catch(() => {});
  }

  async function sendMessage(textOverride) {
    const text = typeof textOverride === "string" ? textOverride : input;
    if (!text.trim() || sending || isLimitReached) return;

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
    setInput("");

    const msgType = detectMessageType(text);
    // Save user message to NanaConversation
    saveToNanaConversation("user", text, msgType);

    await base44.agents.addMessage(conv, { role: "user", content: text });

    // Gamification: streak + tanya_nana mission
    if (user?.email) {
      updateStreak(user.email).catch(() => {});
      completeMission(user.email, "tanya_nana").catch(() => {});
    }

    if (!isPremium) {
      const newCount = msgCount + 1;
      await base44.auth.updateMe({ nana_message_count: newCount, nana_message_month: currentMonth });
      setUser(u => ({ ...u, nana_message_count: newCount, nana_message_month: currentMonth }));
    }

    // +10 XP for sending message, max 3x per day
    if (user?.email) {
      const key = `nana_msg_xp_${today}`;
      const count = parseInt(localStorage.getItem(key) || "0", 10);
      if (count < 3) {
        localStorage.setItem(key, String(count + 1));
        awardXP(user.email, 10).catch(() => {});
        addTodayXP(10);
      }
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
  const showMoodPicker = todayMood === false && !loading;
  const hasMood = todayMood && todayMood.mood;

  return (
    <div className="flex flex-col bg-[#F2F4F7] dark:bg-[#0F1114]" style={{ height: 'calc(100dvh - 56px - env(safe-area-inset-bottom, 0px))' }}>

      {/* Header */}
      <div className="bg-[#0A0A0A] px-4 pt-3 pb-3 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full overflow-hidden">
              <img src={NANA_AVATAR} alt="Nana" className="w-full h-full object-cover" />
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-[#0A0A0A]" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm leading-tight">Nana AI ✨</p>
            <p className="text-green-400 text-[10px] font-medium">Online · siap bantu kamu</p>
            {(hasMood || todayXP > 0) && (
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                {hasMood && (
                  <span className="text-[10px] bg-white/10 text-white px-1.5 py-0.5 rounded-full">
                    {MOOD_EMOJIS[todayMood.mood]} {todayMood.mood_label}
                  </span>
                )}
                {todayXP > 0 && (
                  <span className="text-[10px] bg-[#FF6A00]/20 text-[#FF9A40] px-1.5 py-0.5 rounded-full font-bold">
                    +{todayXP} XP
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={newConversation}
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors flex-shrink-0"
          title={t('nana_new_chat_title')}
        >
          <Plus className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Mood Picker or Chat */}
      {showMoodPicker ? (
        <div className="flex-1 overflow-y-auto">
          <MoodPicker
            userName={user?.full_name}
            onSelect={handleMoodSelect}
            loading={moodLoading}
          />
        </div>
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {loading ? (
              <div className="flex justify-center pt-10">
                <div className="w-6 h-6 border-2 border-[#FF6A00] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : visibleMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-4 px-6">
                <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg">
                  <img src={NANA_AVATAR} alt="Nana" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-[#0A0A0A] dark:text-white font-bold text-lg mb-1">{t('nana_greeting')}</p>
                  <p className="text-[#8FA4C8] text-sm max-w-xs leading-relaxed">{t('nana_greeting_desc')}</p>
                </div>
              </div>
            ) : (
              visibleMessages.map((msg, i) => {
                const prevMsg = visibleMessages[i - 1];
                const msgDate = msg.created_date ? format(new Date(msg.created_date), "yyyy-MM-dd") : today;
                const prevDate = prevMsg?.created_date ? format(new Date(prevMsg.created_date), "yyyy-MM-dd") : null;
                const showSeparator = i === 0 || (prevDate && msgDate !== prevDate);

                return (
                  <div key={i}>
                    {showSeparator && (
                      <div className="flex items-center gap-2 my-3">
                        <div className="flex-1 h-px bg-[#E2E8F0] dark:bg-[#2D2D2D]" />
                        <span className="text-[10px] text-[#8FA4C8] font-medium">
                          {msgDate === today ? "Hari ini" : msgDate}
                        </span>
                        <div className="flex-1 h-px bg-[#E2E8F0] dark:bg-[#2D2D2D]" />
                      </div>
                    )}
                    <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
                      {msg.role === "assistant" && (
                        <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mt-0.5">
                          <img src={NANA_AVATAR} alt="Nana" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${
                        msg.role === "user"
                          ? "bg-[#FF6A00] text-white"
                          : "bg-white dark:bg-[#1A1E25] border border-[#E2E8F0] dark:border-[#2D2D2D] text-[#1A1A1A] dark:text-white"
                      }`}>
                        {msg.role === "assistant" ? (
                          <ReactMarkdown className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 text-[#1A1A1A] dark:text-white">
                            {msg.content}
                          </ReactMarkdown>
                        ) : (
                          <p>{msg.content}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            {sending && (
              <div className="flex justify-start gap-2">
                <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
                  <img src={NANA_AVATAR} alt="Nana" className="w-full h-full object-cover" />
                </div>
                <div className="bg-white dark:bg-[#1A1E25] border border-[#E2E8F0] dark:border-[#2D2D2D] rounded-2xl px-3.5 py-2.5 flex gap-1 items-center">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 bg-[#8FA4C8] rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div className="px-4 pb-4 pt-2 bg-[#F2F4F7] dark:bg-[#0F1114] border-t border-[#E2E8F0] dark:border-[#2D2D2D]">
            {isLimitReached ? (
              <div className="bg-white dark:bg-[#1A1E25] rounded-2xl border border-[#E2E8F0] dark:border-[#2D2D2D] p-5 text-center shadow-sm">
                <Crown className="w-6 h-6 text-[#FF6A00] mx-auto mb-2" />
                <p className="text-sm font-semibold text-[#1A1A1A] dark:text-white mb-1">Batas pesan tercapai</p>
                <p className="text-xs text-[#8FA4C8] mb-4">{msgCount}/{FREE_MSG_LIMIT} pesan bulan ini. Upgrade untuk chat tanpa batas.</p>
                <Link to="/Subscription" className="inline-block px-5 py-2 bg-[#FF6A00] text-white rounded-xl text-sm font-semibold hover:bg-[#e05e00] transition-colors">
                  Upgrade Premium
                </Link>
              </div>
            ) : (
              <>
                {!isPremium && (
                  <p className="text-[10px] text-[#8FA4C8] text-center mb-2">{msgCount}/{FREE_MSG_LIMIT} pesan bulan ini</p>
                )}
                <NanaQuickActions onSelect={sendMessage} disabled={sending} />
                <div className="flex items-end gap-2 mt-2 bg-white dark:bg-[#1A1E25] rounded-2xl border border-[#E2E8F0] dark:border-[#2D2D2D] px-4 py-2.5 shadow-sm">
                  <textarea
                    className="flex-1 text-sm text-[#1A1A1A] dark:text-white resize-none outline-none bg-transparent placeholder:text-[#C0C9D8] dark:placeholder:text-[#8FA4C8] max-h-24 leading-relaxed"
                    rows={1}
                    placeholder={t('nana_input_placeholder')}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKey}
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || sending}
                    className="w-8 h-8 rounded-full bg-[#FF6A00] flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:bg-[#e05e00] transition-colors"
                  >
                    <Send className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}