import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Activity, LogIn, ArrowLeftRight, CreditCard, AlertCircle, RefreshCw, Circle } from "lucide-react";

const TYPE_CONFIG = {
  login:    { icon: LogIn,           color: "blue",   bg: "bg-blue-50",    text: "text-blue-600",    label: "Login" },
  payment:  { icon: CreditCard,      color: "green",  bg: "bg-green-50",   text: "text-green-600",   label: "Pembayaran" },
  expired:  { icon: AlertCircle,     color: "red",    bg: "bg-red-50",     text: "text-red-600",     label: "Langganan" },
  txn:      { icon: ArrowLeftRight,  color: "purple", bg: "bg-purple-50",  text: "text-purple-600",  label: "Transaksi" },
  signup:   { icon: Activity,        color: "orange", bg: "bg-orange-50",  text: "text-orange-600",  label: "User Baru" },
};

function timeAgo(dateStr) {
  if (!dateStr) return "-";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}d lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}j lalu`;
  return `${Math.floor(diff / 86400)}h lalu`;
}

export default function AdminActivityFeed() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const load = useCallback(async () => {
    try {
      const [logs, txns, users] = await Promise.all([
        base44.entities.SystemLog.filter({ log_type: "login" }, "-created_date", 15).catch(() => []),
        base44.entities.Transaction.list("-created_date", 10).catch(() => []),
        base44.entities.User.list("-created_date", 10).catch(() => []),
      ]);

      const events = [];

      (logs || []).forEach(l => events.push({
        id: `login-${l.id}`,
        type: "login",
        title: l.user_email || "Unknown",
        detail: "Login ke aplikasi",
        date: l.created_date,
      }));

      (txns || []).forEach(t => events.push({
        id: `txn-${t.id}`,
        type: "txn",
        title: t.created_by,
        detail: `${t.type === "income" ? "Pemasukan" : t.type === "expense" ? "Pengeluaran" : "Tabungan"} • ${t.note || t.category || "—"}`,
        amount: t.amount,
        date: t.created_date,
      }));

      (users || []).forEach(u => events.push({
        id: `user-${u.id}`,
        type: "signup",
        title: u.full_name || u.email,
        detail: "Mendaftar ke Atur Pintar",
        date: u.created_date,
      }));

      events.sort((a, b) => new Date(b.date) - new Date(a.date));
      setItems(events.slice(0, 30));
      setLastUpdate(new Date());
    } catch (e) {
      console.error("AdminActivityFeed load failed:", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;
    // Pause polling when tab is hidden to save credits & bandwidth
    const t = setInterval(() => {
      if (!document.hidden) load();
    }, 30000);
    return () => clearInterval(t);
  }, [autoRefresh, load]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#F2F4F7]">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#F97316]" />
          <p className="text-sm font-bold text-[#1A1A1A]">Aktivitas Real-time</p>
          {autoRefresh && (
            <span className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
              <Circle className="w-1.5 h-1.5 fill-green-500 text-green-500 animate-pulse" /> LIVE
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {lastUpdate && (
            <span className="text-[10px] text-[#8FA4C8] hidden sm:inline">
              Update {timeAgo(lastUpdate.toISOString())}
            </span>
          )}
          <button
            onClick={() => setAutoRefresh(v => !v)}
            className={`text-[10px] px-2 py-1 rounded-lg font-medium ${autoRefresh ? "bg-[#F97316]/10 text-[#F97316]" : "bg-[#F2F4F7] text-[#8FA4C8]"}`}>
            {autoRefresh ? "Auto" : "Off"}
          </button>
          <button onClick={load} className="p-1.5 rounded-lg hover:bg-[#F8FAFC]">
            <RefreshCw className={`w-3.5 h-3.5 text-[#8FA4C8] ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="max-h-[420px] overflow-y-auto">
        {loading && items.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#8FA4C8]">Memuat aktivitas...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#8FA4C8]">Belum ada aktivitas</div>
        ) : (
          <div className="divide-y divide-[#F2F4F7]">
            {items.map(ev => {
              const cfg = TYPE_CONFIG[ev.type] || TYPE_CONFIG.txn;
              const Icon = cfg.icon;
              return (
                <div key={ev.id} className="flex items-start gap-3 px-5 py-3 hover:bg-[#F8FAFC] transition-colors">
                  <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${cfg.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-semibold text-[#1A1A1A] truncate">{ev.title}</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.text}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-[#8FA4C8] mt-0.5 truncate">{ev.detail}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {ev.amount != null && (
                      <p className="text-xs font-bold text-[#1A1A1A]">Rp{Number(ev.amount).toLocaleString("id-ID")}</p>
                    )}
                    <p className="text-[10px] text-[#8FA4C8] mt-0.5">{timeAgo(ev.date)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}