import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, TrendingUp, Info, CheckCircle2, X, Zap } from "lucide-react";
import { createPageUrl } from "@/utils";

const ALERT_CONFIG = {
  spending_spike: {
    icon: TrendingUp,
    color: "text-red-500",
    bg: "bg-red-50",
    border: "border-red-100",
  },
  bill_upcoming: {
    icon: AlertTriangle,
    color: "text-orange-500",
    bg: "bg-orange-50",
    border: "border-orange-100",
  },
  goal_near: {
    icon: CheckCircle2,
    color: "text-green-500",
    bg: "bg-green-50",
    border: "border-green-100",
  },
  savings_opportunity: {
    icon: Zap,
    color: "text-blue-500",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  unusual_pattern: {
    icon: Info,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    border: "border-yellow-100",
  },
  budget_exceeded: {
    icon: AlertTriangle,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-100",
  },
};

export default function SmartAlertsPanel() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  async function loadAlerts() {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      const allAlerts = await base44.entities.Alert.filter(
        { status: { $in: ["unread", "read"] }, created_by: user.email },
        "-created_date",
        20
      );
      setAlerts(allAlerts.filter(a => a.status === "unread").slice(0, 5));
    } catch (error) {
      console.error("Error loading alerts:", error);
    }
    setLoading(false);
  }

  async function handleDismiss(alertId) {
    await base44.entities.Alert.update(alertId, { status: "dismissed" });
    loadAlerts();
  }

  async function handleRead(alertId) {
    await base44.entities.Alert.update(alertId, { status: "read" });
    loadAlerts();
  }

  if (loading || alerts.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2.5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-[#0A0A0A] text-sm">🔔 Smart Alerts</h2>
        <a
          href={createPageUrl("Dashboard")}
          className="text-xs text-[#FF6A00] font-medium hover:underline"
        >
          Lihat semua
        </a>
      </div>

      {alerts.map((alert) => {
        const config = ALERT_CONFIG[alert.type] || ALERT_CONFIG.unusual_pattern;
        const Icon = config.icon;

        return (
          <div
            key={alert.id}
            className={`flex items-start gap-3 rounded-xl px-3 py-2.5 border ${config.bg} ${config.border}`}
          >
            <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${config.color}`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#1A1A1A]">{alert.title}</p>
              <p className="text-xs text-[#4A5568] mt-0.5 line-clamp-2">{alert.message}</p>
              {alert.action_url && (
                <a
                  href={createPageUrl(alert.action_url)}
                  className="text-xs text-[#FF6A00] font-medium mt-1 inline-block hover:underline"
                  onClick={() => handleRead(alert.id)}
                >
                  Tindaklanjuti →
                </a>
              )}
            </div>
            <button
              onClick={() => handleDismiss(alert.id)}
              className="text-[#CBD5E0] hover:text-[#1A1A1A] transition-colors flex-shrink-0 mt-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}