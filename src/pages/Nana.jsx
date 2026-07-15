import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Plus, Crown, Settings, History, Mic, MicOff } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { useAppSettings } from "@/components/utils/useAppSettings";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { completeMission } from "@/hooks/useGamificationActions";
import MoodPicker from "@/components/nana/MoodPicker";
import NanaQuickActions from "@/components/nana/NanaQuickActions";
import { useFinancialContext } from "@/components/nana/useFinancialContext";
import NanaErrorBoundary from "@/components/nana/NanaErrorBoundary";
import NanaHistoryPanel from "@/components/nana/NanaHistoryPanel";
import NanaPreferencesModal from "@/components/nana/NanaPreferencesModal";
import InteractivePrompt from "@/components/nana/InteractivePrompt";
import { parseNanaMessage } from "@/components/nana/parseNanaMessage";
import { format } from "date-fns";

const FREE_MSG_LIMIT = 30;
const NANA_AVATAR = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a82e8090f60786b869983c/7708b64f5_generated_image.png";

const MOOD_EMOJIS = { stress: "😤", mager: "😴", happy: "🥳", panik: "😰", normal: "😊" };

function NanaInner() {
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
  const [showHistory, setShowHistory] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesContainerRef = useRef(null);
  const didInitialScroll = useRef(false);
  const lastSendAt = useRef(0);
  const recognitionRef = useRef(null);
  const today = format(new Date(), "yyyy-MM-dd");
  const { context: financialContext } = useFinancialContext(true);

  // Voice input via Web Speech API
  function toggleVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      toast.error("Browser kamu belum mendukung voice input.");
      return;
    }
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }
    const rec = new SR();
    rec.lang = "id-ID";
    rec.continuous = false;
    rec.interimResults = true;
    rec.onstart = () => setIsListening(true);
    rec.onend = () => setIsListening(false);
    rec.onerror = (e) => {
      setIsListening(false);
      const err = e?.error;
      if (err === "not-allowed" || err === "service-not-allowed") {
        toast.error("Mic diblokir. Izinkan akses mic di pengaturan browser.");
      } else if (err === "no-speech") {
        toast("Suara tidak terdengar. Coba lagi ya.", { icon: "🎤" });
      } else if (err === "network") {
        toast.error("Voice input butuh koneksi internet.");
      } else if (err && err !== "aborted") {
        toast.error("Voice input gagal. Coba ketik aja ya.");
      }
    };
    rec.onresult = (e) => {
      const transcript = Array.from(e.results).map((r) => r[0].transcript).join("");
      setInput(transcript);
    };
    recognitionRef.current = rec;
    rec.start();
  }

  // Cleanup voice recognition on unmount
  useEffect(() => {
    return () => {
      try { recognitionRef.current?.stop(); } catch {}
    };
  }, []);

  async function handleSelectConversation(conv) {
    setShowHistory(false);
    if (conv.id === activeConv?.id) return;
    // 🔒 Defensive: block ONLY when created_by exists and doesn't match
    if (user?.email && conv.created_by && conv.created_by !== user.email) return;
    try {
      const full = await base44.agents.getConversation(conv.id);
      if (user?.email && full?.created_by && full.created_by !== user.email) return;
      setActiveConv(full);
      setMessages(full.messages || []);
    } catch {}
  }

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      // Daily check via backend (handles streak/achievement on Nana page open, max 1x per day)
      const lastNanaOpen = localStorage.getItem("nana_xp_date");
      if (lastNanaOpen !== today) {
        localStorage.setItem("nana_xp_date", today);
        base44.functions.invoke("processGamification", { trigger: "daily_check" }).catch(() => {});
      }
      // Load today XP from localStorage
      const xpKey = `nana_total_xp_${today}`;
      setTodayXP(parseInt(localStorage.getItem(xpKey) || "0", 10));
      // Check mood
      checkTodayMood(u.email);
      // Load conversations only AFTER user is loaded so we can filter by created_by
      loadConversations(u.email);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  // Always auto-scroll to the latest message when the chat opens, when messages
  // change (new message arrives / sent), or when switching conversations.
  // Initial mount uses an instant jump; subsequent updates use smooth scroll.
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || messages.length === 0) return;

    if (!didInitialScroll.current) {
      container.scrollTop = container.scrollHeight;
      didInitialScroll.current = true;
      return;
    }
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages, activeConv?.id]);

  // Reset initial-scroll flag when switching conversations so each conv jumps to bottom on open
  useEffect(() => {
    didInitialScroll.current = false;
  }, [activeConv?.id]);

  const savedNanaMsgIds = useRef(new Set());
  const lastContentByMsgId = useRef({});
  const pendingSaveTimers = useRef({});

  useEffect(() => {
    if (!activeConv || !user?.email) return;
    // 🔒 SECURITY: re-verify ownership at subscribe time
    // (guards against stale activeConv after logout/login on same tab)
    if (activeConv.created_by && activeConv.created_by !== user.email) return;

    const subscriberEmail = user.email; // capture at subscribe time
    const unsub = base44.agents.subscribeToConversation(activeConv.id, (data) => {
      const msgs = data.messages || [];
      setMessages(msgs);
      // Save completed Nana (assistant) messages — only save when content is stable (unchanged for 2.5s)
      msgs.forEach(msg => {
        if (msg.role === "assistant" && msg.id && msg.content && !savedNanaMsgIds.current.has(msg.id)) {
          // Skip if content hasn't changed since last tick (still streaming same buffer)
          if (lastContentByMsgId.current[msg.id] === msg.content && pendingSaveTimers.current[msg.id]) {
            return;
          }
          lastContentByMsgId.current[msg.id] = msg.content;
          // Cancel previous pending save — content changed, reset timer
          if (pendingSaveTimers.current[msg.id]) {
            clearTimeout(pendingSaveTimers.current[msg.id]);
          }
          // Wait 2.5s of no content changes before saving
          pendingSaveTimers.current[msg.id] = setTimeout(() => {
            if (savedNanaMsgIds.current.has(msg.id)) return;
            savedNanaMsgIds.current.add(msg.id);
            delete pendingSaveTimers.current[msg.id];
            const finalContent = lastContentByMsgId.current[msg.id];
            delete lastContentByMsgId.current[msg.id];
            // Only save if the user that started this subscription is still logged in
            if (subscriberEmail && finalContent) {
              base44.entities.NanaConversation.create({
                role: "nana",
                message: finalContent,
                session_date: today,
                mood: todayMood?.mood || undefined,
                message_type: "chat",
              }).catch(() => {});
            }
          }, 2500);
        }
      });
    });
    return () => {
      try { unsub(); } catch {}
      // Clear all pending timers + buffers on unmount/conv change to avoid late writes
      Object.values(pendingSaveTimers.current).forEach(t => clearTimeout(t));
      pendingSaveTimers.current = {};
      lastContentByMsgId.current = {};
    };
  }, [activeConv?.id, activeConv?.created_by, user?.email]);

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

      // +5 XP for mood check-in (backend handles streak/achievement)
      base44.functions.invoke("processGamification", { trigger: "mood_checkin" }).catch(() => {});
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
      const moodMsg = `[mood:${moodObj.mood}] Hari ini aku lagi ${moodObj.label}`;
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

  async function loadConversations(userEmail) {
    setLoading(true);
    try {
      const all = await base44.agents.listConversations({ agent_name: "nana" });
      // 🔒 SECURITY (defensive): if SDK returns created_by, drop foreign records.
      // Otherwise trust SDK scoping (it auto-filters by current user).
      const convs = (all || []).filter(c => !c.created_by || c.created_by === userEmail);
      setConversations(convs);
      if (convs.length > 0) {
        const conv = await base44.agents.getConversation(convs[0].id);
        if (conv && (!conv.created_by || conv.created_by === userEmail)) {
          setActiveConv(conv);
          setMessages(conv.messages || []);
        }
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

  // 🎁 Free access window — semua user dapat unlimited Nana chat sampai tanggal ini
  const FREE_ACCESS_UNTIL_NANA = "2099-12-31";
  const todayStrNana = new Date().toISOString().slice(0, 10);
  const inFreeWindowNana = todayStrNana <= FREE_ACCESS_UNTIL_NANA;
  const isPremium = inFreeWindowNana || user?.role === "admin" || user?.subscription_plan === "premium_monthly" || user?.subscription_plan === "premium_yearly";
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
    // Block sending until user is loaded — without this, quota update could overwrite a higher existing count with 1
    if (!user) return;
    // Rate limit: min 3 detik antar pesan (anti-spam, hemat AI credits)
    const nowMs = Date.now();
    if (nowMs - lastSendAt.current < 3000) {
      const waitSec = Math.ceil((3000 - (nowMs - lastSendAt.current)) / 1000);
      toast(`Sabar ya, tunggu ${waitSec} detik lagi 😊`, { icon: "⏳" });
      return;
    }

    let conv = activeConv;
    // 🔒 SECURITY: refuse to send into a conversation not owned by current user
    if (conv && conv.created_by && conv.created_by !== user.email) {
      conv = null;
      setActiveConv(null);
      setMessages([]);
    }
    setSending(true);
    const previousInput = input;
    setInput("");
    try {
      if (!conv) {
        conv = await base44.agents.createConversation({
          agent_name: "nana",
          metadata: { name: `Obrolan ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short" })}` },
        });
        setActiveConv(conv);
        setConversations(prev => [conv, ...prev]);
      }

      const msgType = detectMessageType(text);

      // Send to agent FIRST — only count quota / save / award XP if it actually succeeds
      await base44.agents.addMessage(conv, { role: "user", content: text });

      // From here on, the message is committed. Set rate-limit timestamp now (not before failure).
      lastSendAt.current = nowMs;

      // Save user message to NanaConversation (fire-and-forget)
      saveToNanaConversation("user", text, msgType);

      // Gamification: tanya_nana mission
      if (user?.email) {
        completeMission(user.email, "tanya_nana").catch(() => {});
      }

      // Quota update — delegated to backend function for atomic read-modify-write.
      // Prevents race condition when user spams messages (concurrent updateMe calls
      // overwriting each other with stale counts).
      if (!isPremium) {
        base44.functions.invoke("incrementNanaQuota", {}).then((res) => {
          const data = res?.data;
          if (data?.count !== undefined) {
            setUser(u => u ? { ...u, nana_message_count: data.count, nana_message_month: data.month } : u);
          }
        }).catch(() => {});
      }

      // XP for sending message via backend (max 3x per day; backend awards 2 XP per nana_message_sent)
      if (user?.email) {
        const key = `nana_msg_xp_${today}`;
        const count = parseInt(localStorage.getItem(key) || "0", 10);
        if (count < 3) {
          localStorage.setItem(key, String(count + 1));
          base44.functions.invoke("processGamification", { trigger: "nana_message_sent" }).catch(() => {});
          addTodayXP(2);
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Restore input so user doesn't lose their message on failure
      setInput(previousInput);
      toast.error("Gagal kirim pesan. Cek koneksi & coba lagi ya.");
    } finally {
      setSending(false);
    }
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
    <div className="flex flex-col bg-[#F2F4F7] dark:bg-[#0F1114] overflow-hidden" style={{ height: 'calc(100dvh - 56px - env(safe-area-inset-top, 0px))' }}>

      {/* Header */}
      <div className="bg-[#0A0A0A] px-4 pt-3 pb-3 flex items-center justify-between border-b border-white/10 flex-shrink-0">
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
                  <span className="text-[10px] bg-[#F97316]/20 text-[#FF9A40] px-1.5 py-0.5 rounded-full font-bold">
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
          <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
            {loading ? (
              <div className="flex justify-center pt-10">
                <div className="w-6 h-6 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
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
                  <motion.div
                    key={msg.id || `msg-${i}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
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
                      <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed shadow-sm ${
                        msg.role === "user"
                          ? "bg-[#F97316] text-white rounded-br-md"
                          : "bg-white dark:bg-[#1A1E25] border border-[#E2E8F0] dark:border-[#2D2D2D] text-[#1A1A1A] dark:text-white rounded-bl-md"
                      }`}>
                        {msg.role === "assistant" ? (() => {
                          const { text, interactivePrompt } = parseNanaMessage(msg.content);
                          const isLastAssistant = i === visibleMessages.length - 1;
                          return (
                            <>
                              {text && (
                                <ReactMarkdown className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 text-[#1A1A1A] dark:text-white">
                                  {text}
                                </ReactMarkdown>
                              )}
                              {interactivePrompt && isLastAssistant && (
                                <InteractivePrompt
                                  prompt={interactivePrompt}
                                  onResponse={(displayText, value) => sendMessage(displayText || value)}
                                />
                              )}
                            </>
                          );
                        })() : (
                          <p>{msg.content}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
            <AnimatePresence>
            {sending && (() => {
              // Hide typing indicator once assistant has started streaming —
              // otherwise user sees the streaming bubble + a separate "...typing"
              // bubble at the same time (double loading template).
              const lastMsg = visibleMessages[visibleMessages.length - 1];
              const assistantAlreadyResponding = lastMsg?.role === "assistant" && lastMsg?.content;
              if (assistantAlreadyResponding) return null;
              return (
              <motion.div
                key="typing-indicator"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.2 }}
                className="flex justify-start gap-2"
              >
                <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
                  <img src={NANA_AVATAR} alt="Nana" className="w-full h-full object-cover" />
                </div>
                <div className="bg-white dark:bg-[#1A1E25] border border-[#E2E8F0] dark:border-[#2D2D2D] rounded-2xl px-3.5 py-2.5 flex gap-1 items-center">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 bg-[#8FA4C8] rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </motion.div>
              );
            })()}
            </AnimatePresence>
          </div>

          {/* Input area */}
          <div className="flex-shrink-0 px-4 pt-2 bg-[#F2F4F7] dark:bg-[#0F1114] border-t border-[#E2E8F0] dark:border-[#2D2D2D]" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}>
            {isLimitReached ? (
              <div className="bg-white dark:bg-[#1A1E25] rounded-2xl border border-[#E2E8F0] dark:border-[#2D2D2D] p-5 text-center shadow-sm">
                <Crown className="w-6 h-6 text-[#F97316] mx-auto mb-2" />
                <p className="text-sm font-semibold text-[#1A1A1A] dark:text-white mb-1">Batas pesan tercapai</p>
                <p className="text-xs text-[#8FA4C8]">{msgCount}/{FREE_MSG_LIMIT} pesan bulan ini. Fitur premium akan segera tersedia via App Store.</p>
              </div>
            ) : (
              <>
                {!isPremium && (
                  <p className="text-[10px] text-[#8FA4C8] text-center mb-2">{msgCount}/{FREE_MSG_LIMIT} pesan bulan ini</p>
                )}
                <NanaQuickActions onSelect={(text) => setInput(text)} disabled={sending} contextSnapshot={financialContext} />
                <div className="bg-white dark:bg-[#1A1E25] rounded-2xl border border-[#E2E8F0] dark:border-[#2D2D2D] shadow-sm overflow-hidden">
                  <textarea
                    className="w-full text-sm text-[#1A1A1A] dark:text-white resize-none outline-none bg-transparent placeholder:text-[#C0C9D8] dark:placeholder:text-[#8FA4C8] px-4 pt-3 pb-2 leading-relaxed min-h-[52px] max-h-32"
                    rows={2}
                    placeholder={t('nana_input_placeholder')}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKey}
                  />
                  <div className="flex items-center justify-between px-2 pb-2">
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => setShowPreferences(true)}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-[#8FA4C8] hover:text-[#1A1A1A] dark:hover:text-white hover:bg-[#F2F4F7] dark:hover:bg-[#2D2D2D] transition-colors tap-highlight-fix"
                        title="Preferensi Nana"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <div className="w-px h-5 bg-[#E2E8F0] dark:bg-[#2D2D2D] mx-1" />
                      <button
                        onClick={newConversation}
                        disabled={sending}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-[#8FA4C8] hover:text-[#1A1A1A] dark:hover:text-white hover:bg-[#F2F4F7] dark:hover:bg-[#2D2D2D] transition-colors disabled:opacity-40 tap-highlight-fix"
                        title="Obrolan baru"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowHistory(true)}
                        className="h-9 px-2.5 rounded-full flex items-center gap-1.5 text-[#8FA4C8] hover:text-[#1A1A1A] dark:hover:text-white hover:bg-[#F2F4F7] dark:hover:bg-[#2D2D2D] transition-colors tap-highlight-fix"
                        title="Riwayat"
                      >
                        <History className="w-4 h-4" />
                        <span className="text-xs font-medium hidden xs:inline">Riwayat</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={toggleVoice}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors tap-highlight-fix ${
                          isListening
                            ? "bg-red-500 text-white animate-pulse"
                            : "text-[#8FA4C8] hover:text-[#1A1A1A] dark:hover:text-white hover:bg-[#F2F4F7] dark:hover:bg-[#2D2D2D]"
                        }`}
                        title={isListening ? "Stop" : "Voice input"}
                      >
                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => sendMessage()}
                        disabled={!input.trim() || sending}
                        className="w-9 h-9 rounded-full bg-[#F97316] flex items-center justify-center disabled:opacity-40 hover:bg-[#e05e00] transition-colors tap-highlight-fix"
                        title="Kirim"
                      >
                        <Send className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {showHistory && (
        <NanaHistoryPanel
          conversations={conversations}
          activeId={activeConv?.id}
          onSelect={handleSelectConversation}
          onClose={() => setShowHistory(false)}
        />
      )}

      {showPreferences && (
        <NanaPreferencesModal onClose={() => setShowPreferences(false)} />
      )}
    </div>
  );
}

export default function Nana() {
  return (
    <NanaErrorBoundary>
      <NanaInner />
    </NanaErrorBoundary>
  );
}