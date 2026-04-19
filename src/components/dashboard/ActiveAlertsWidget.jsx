import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X } from "lucide-react";

const SEVERITY_STYLE = {
  high: { border: "#DC2626", bg: "#FEF2F2", dot: "#DC2626" },
  medium: { border: "#D97706", bg: "#FFFBEB", dot: "#D97706" },
  low: { border: "#CBD5E0", bg: "#F8FAFC", dot: "#94A3B8" },
};

export default function ActiveAlertsWidget({ user }) {
  const [alerts, setAlerts] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user?.email) return;
    base44.entities.Alert.filter({ created_by: user.email, status: "unread" })
      .then(a => { setAlerts(a || []); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, [user?.email]);

  async function dismiss(id) {
    setAlerts(prev => prev.filter(a => a.id !== id));
    await base44.entities.Alert.update(id, { status: "read" }).catch(() => {});
  }

  if (!loaded || alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-[#1A1A1A] px-1">⚠️ Alert Aktif</h3>
      {alerts.map(alert => {
        const style = SEVERITY_STYLE[alert.severity] || SEVERITY_STYLE.low;
        return (
          <div key={alert.id} className="rounded-2xl p-4 border-l-4 flex items-start gap-3"
            style={{ backgroundColor: style.bg, borderLeftColor: style.border }}>
            <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: style.dot }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#1A1A1A]">{alert.title}</p>
              <p className="text-xs text-[#4A5568] mt-0.5 leading-relaxed">{alert.message}</p>
            </div>
            <button onClick={() => dismiss(alert.id)} className="flex-shrink-0 p-1 hover:bg-black/5 rounded-lg transition-colors tap-highlight-fix">
              <X className="w-3.5 h-3.5 text-[#94A3B8]" />
            </button>
          </div>
        );
      })}
    </div>
  );
}