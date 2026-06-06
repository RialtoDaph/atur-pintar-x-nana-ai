import { useState, useEffect } from "react";
import { Bug, Lightbulb, Heart, MessageCircle, Clock, CheckCircle2, XCircle, Eye, Send, Inbox } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import useLockBodyScroll from "@/hooks/useLockBodyScroll";

const TYPE_OPTIONS = [
  { value: "bug", label: "Bug", icon: Bug, color: "text-red-500", bg: "bg-red-50", border: "border-red-200" },
  { value: "suggestion", label: "Saran", icon: Lightbulb, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-200" },
  { value: "praise", label: "Pujian", icon: Heart, color: "text-pink-500", bg: "bg-pink-50", border: "border-pink-200" },
  { value: "other", label: "Lain", icon: MessageCircle, color: "text-[#8FA4C8]", bg: "bg-[#F8FAFC]", border: "border-[#E2E8F0]" },
];

const STATUS_MAP = {
  open: { label: "Menunggu", icon: Clock, color: "text-[#8FA4C8]", bg: "bg-[#F8FAFC]" },
  in_review: { label: "Ditinjau", icon: Eye, color: "text-blue-500", bg: "bg-blue-50" },
  resolved: { label: "Selesai", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50" },
  wont_fix: { label: "Ditolak", icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
};

/**
 * Compact panel content for the FAB popup. Same logic as the previous full modal,
 * but stripped chrome (no backdrop, no close button — parent owns those).
 */
export default function FeedbackReportPanel({ user, onClose }) {
  useLockBodyScroll();
  const [tab, setTab] = useState("report");
  const [type, setType] = useState("bug");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [touched, setTouched] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (tab !== "history" || !user?.email) return;
    setLoadingHistory(true);
    base44.entities.FeedbackReport.filter({ created_by: user.email }, "-created_date")
      .then((items) => setHistory(items || []))
      .catch(() => setHistory([]))
      .finally(() => setLoadingHistory(false));
  }, [tab, user?.email]);

  async function handleSubmit() {
    setTouched(true);
    if (!message.trim()) return;
    setSending(true);
    try {
      const payload = {
        type,
        message: message.trim(),
        page: window.location.pathname,
        user_name: user?.full_name || "Anonymous",
        status: "open",
      };
      if (title.trim()) payload.title = title.trim();
      if (user?.email) payload.user_email = user.email;
      await base44.entities.FeedbackReport.create(payload);
      base44.functions.invoke("sendFeedbackToNotion", {
        rating: null,
        message: `[${type.toUpperCase()}] ${title ? title + " — " : ""}${message}`,
        userName: user?.full_name || "Anonymous",
        userEmail: user?.email || null,
      }).catch(() => {});
      toast.success("Report terkirim! 🙏");
      setMessage("");
      setTitle("");
      setTouched(false);
      setTab("history");
    } catch {
      toast.error("Gagal mengirim. Coba lagi.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-[#F2F4F7] flex-shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">💬</span>
          <h2 className="text-sm font-bold text-[#1A1A1A]">Beta Feedback</h2>
          <span className="text-[8px] font-bold text-[#F97316] bg-[#F97316]/15 border border-[#F97316]/30 rounded px-1 py-0.5 leading-none uppercase tracking-wider">Beta</span>
        </div>
        <p className="text-[11px] text-[#8FA4C8]">Lapor masalah & cek statusnya.</p>

        <div className="flex gap-1 mt-3 bg-[#F8FAFC] p-1 rounded-xl">
          <button
            onClick={() => setTab("report")}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 ${
              tab === "report" ? "bg-white text-[#1A1A1A] shadow-sm" : "text-[#8FA4C8]"
            }`}
          >
            <Send className="w-3 h-3" /> Lapor
          </button>
          <button
            onClick={() => setTab("history")}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 ${
              tab === "history" ? "bg-white text-[#1A1A1A] shadow-sm" : "text-[#8FA4C8]"
            }`}
          >
            <Inbox className="w-3 h-3" /> Riwayat
            {history.length > 0 && (
              <span className="bg-[#F97316] text-white text-[9px] font-bold rounded-full px-1.5 py-0.5 leading-none">{history.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {tab === "report" ? (
          <ReportForm
            type={type} setType={setType}
            title={title} setTitle={setTitle}
            message={message} setMessage={setMessage}
            touched={touched} setTouched={setTouched}
          />
        ) : (
          <HistoryList history={history} loading={loadingHistory} onSwitchToReport={() => setTab("report")} />
        )}
      </div>

      {/* Footer */}
      {tab === "report" && (
        <div className="px-4 py-3 border-t border-[#F2F4F7] flex gap-2 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[#E2E8F0] text-xs font-semibold text-[#8FA4C8] hover:bg-[#F8FAFC] transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={sending}
            className="flex-1 py-2.5 rounded-xl bg-[#F97316] text-white text-xs font-semibold hover:bg-[#e05e00] transition-colors disabled:opacity-50"
          >
            {sending ? "Mengirim..." : "Kirim"}
          </button>
        </div>
      )}
    </div>
  );
}

function ReportForm({ type, setType, title, setTitle, message, setMessage, touched, setTouched }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-[10px] font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5">Jenis</p>
        <div className="grid grid-cols-4 gap-1.5">
          {TYPE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = type === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setType(opt.value)}
                className={`flex flex-col items-center gap-0.5 py-2 rounded-lg border-2 transition-all ${
                  active ? `${opt.bg} ${opt.border}` : "bg-white border-[#E2E8F0]"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? opt.color : "text-[#8FA4C8]"}`} />
                <span className={`text-[10px] font-semibold ${active ? "text-[#1A1A1A]" : "text-[#8FA4C8]"}`}>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-[10px] font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">
          Judul <span className="text-[#CBD5E1] normal-case">(opsional)</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Contoh: Tombol simpan error"
          maxLength={80}
          className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-[#F8FAFC]"
        />
      </div>

      <div>
        <label className="text-[10px] font-semibold text-[#8FA4C8] uppercase tracking-widest mb-1.5 block">
          Detail <span className="text-red-400">*</span>
        </label>
        <textarea
          rows={4}
          value={message}
          onChange={(e) => { setMessage(e.target.value); setTouched(true); }}
          placeholder="Ceritakan masalahnya..."
          className={`w-full border rounded-lg px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-[#F8FAFC] resize-none transition-colors ${
            touched && !message.trim() ? "border-red-400" : "border-[#E2E8F0]"
          }`}
        />
        {touched && !message.trim() && (
          <p className="text-[10px] text-red-400 mt-1">Detail tidak boleh kosong</p>
        )}
      </div>
    </div>
  );
}

function HistoryList({ history, loading, onSwitchToReport }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-[#F8FAFC] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!history.length) {
    return (
      <div className="text-center py-8">
        <div className="text-3xl mb-2">📭</div>
        <p className="text-xs font-semibold text-[#1A1A1A] mb-1">Belum ada report</p>
        <p className="text-[10px] text-[#8FA4C8] mb-3">Lapor masalah biar Atur Pintar makin oke.</p>
        <button
          onClick={onSwitchToReport}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#F97316] text-white text-[11px] font-semibold hover:bg-[#e05e00] transition-colors"
        >
          <Send className="w-3 h-3" /> Buat Report
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {history.map((item) => <ReportCard key={item.id} item={item} />)}
    </div>
  );
}

function ReportCard({ item }) {
  const typeOpt = TYPE_OPTIONS.find((t) => t.value === item.type) || TYPE_OPTIONS[3];
  const statusOpt = STATUS_MAP[item.status] || STATUS_MAP.open;
  const TypeIcon = typeOpt.icon;
  const StatusIcon = statusOpt.icon;
  const date = item.created_date ? new Date(item.created_date).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : "";

  return (
    <div className="border border-[#E2E8F0] rounded-xl p-2.5 bg-white">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className={`w-6 h-6 rounded-md ${typeOpt.bg} flex items-center justify-center flex-shrink-0`}>
            <TypeIcon className={`w-3 h-3 ${typeOpt.color}`} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-[#1A1A1A] truncate">
              {item.title || typeOpt.label}
            </p>
            <p className="text-[9px] text-[#8FA4C8]">{date}</p>
          </div>
        </div>
        <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full ${statusOpt.bg} flex-shrink-0`}>
          <StatusIcon className={`w-2.5 h-2.5 ${statusOpt.color}`} />
          <span className={`text-[9px] font-semibold ${statusOpt.color}`}>{statusOpt.label}</span>
        </div>
      </div>

      <p className="text-[11px] text-[#5A6A7E] leading-relaxed whitespace-pre-wrap break-words line-clamp-3">{item.message}</p>

      {item.admin_response && (
        <div className="mt-1.5 bg-[#F8FAFC] border-l-2 border-[#F97316] rounded-r px-2 py-1.5">
          <p className="text-[9px] font-bold text-[#F97316] uppercase tracking-wider mb-0.5">Balasan Admin</p>
          <p className="text-[11px] text-[#1A1A1A] whitespace-pre-wrap break-words">{item.admin_response}</p>
        </div>
      )}
    </div>
  );
}