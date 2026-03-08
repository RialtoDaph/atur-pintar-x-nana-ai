import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Trash2, Mail, CheckCircle, AlertTriangle, TrendingUp, Info, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAppSettings } from "@/components/utils/useAppSettings";

const ALERT_CONFIG = {
  spending_spike: {
    icon: TrendingUp,
    color: "text-red-500",
    bg: "bg-red-50",
    label: "Spending Spike",
  },
  bill_upcoming: {
    icon: AlertTriangle,
    color: "text-orange-500",
    bg: "bg-orange-50",
    label: "Upcoming Bill",
  },
  goal_near: {
    icon: CheckCircle,
    color: "text-green-500",
    bg: "bg-green-50",
    label: "Goal Progress",
  },
  savings_opportunity: {
    icon: Zap,
    color: "text-blue-500",
    bg: "bg-blue-50",
    label: "Opportunity",
  },
  unusual_pattern: {
    icon: Info,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    label: "Pattern Alert",
  },
  budget_exceeded: {
    icon: AlertTriangle,
    color: "text-red-600",
    bg: "bg-red-50",
    label: "Budget Exceeded",
  },
};

export default function AlertsPage() {
  const { t } = useAppSettings();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("unread"); // unread | all

  useEffect(() => {
    loadAlerts();
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadAlerts() {
    setLoading(true);
    try {
      const query = filter === "unread" ? { status: "unread" } : {};
      const data = await base44.entities.Alert.filter(query, "-created_date");
      setAlerts(data);
    } catch (error) {
      console.error("Error loading alerts:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsRead(alertId) {
    await base44.entities.Alert.update(alertId, { status: "read" });
    loadAlerts();
  }

  async function handleDelete(alertId) {
    await base44.entities.Alert.delete(alertId);
    loadAlerts();
  }

  async function handleResendEmail(alert) {
    try {
      const user = await base44.auth.me();
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: `⚠️ ${alert.title} - Atur.in`,
        body: `${alert.message}\n\nSilakan buka aplikasi untuk detail lebih lanjut.`,
      });
      await base44.entities.Alert.update(alert.id, { email_sent: true });
      loadAlerts();
    } catch (e) {
      console.error("Failed to send email", e);
    }
  }

  return (
    <div className="min-h-screen bg-[#F2F4F7] pb-8">
      <div className="bg-[#0A0A0A] px-5 pt-10 pb-16">
        <div className="max-w-2xl mx-auto">
          <Link
            to={createPageUrl("Dashboard")}
            className="flex items-center gap-2 text-[#8FA4C8] hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> {t('alerts_back')}
          </Link>
          <h1 className="text-white text-2xl font-bold">{t('alerts_title')}</h1>
          <p className="text-[#8FA4C8] text-sm mt-1">{t('alerts_subtitle')}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 -mt-8 space-y-3">
        {/* Filter tabs */}
        <div className="flex gap-2 bg-white rounded-xl p-1 shadow-sm">
          <button
            onClick={() => setFilter("unread")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "unread"
                ? "bg-[#FF6A00] text-white"
                : "text-[#8FA4C8] hover:bg-[#F2F4F7]"
            }`}
          >
            {t('alerts_unread')} ({alerts.filter(a => a.status === "unread").length})
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "all"
                ? "bg-[#FF6A00] text-white"
                : "text-[#8FA4C8] hover:bg-[#F2F4F7]"
            }`}
          >
            {t('alerts_all')}
          </button>
        </div>

        {/* Alerts list */}
        {loading ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="w-6 h-6 rounded-full border-2 border-[#8FA4C8] border-t-transparent animate-spin mx-auto" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <CheckCircle className="w-10 h-10 text-[#00C9A7] mx-auto mb-3" />
            <p className="text-[#4A5568] font-semibold">{t('alerts_empty_title')}</p>
            <p className="text-[#8FA4C8] text-sm mt-1">{t('alerts_empty_desc')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => {
              const config = ALERT_CONFIG[alert.type] || ALERT_CONFIG.unusual_pattern;
              const Icon = config.icon;

              return (
                <div
                  key={alert.id}
                  className={`rounded-2xl p-4 shadow-sm transition-all ${
                    alert.status === "unread" ? "bg-white ring-2 ring-[#FF6A00]/20" : "bg-[#F8FAFC]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-[#1A1A1A] text-sm">{alert.title}</p>
                          <p className="text-[#4A5568] text-sm mt-1 leading-relaxed">{alert.message}</p>
                        </div>
                        <div className="flex-shrink-0">
                          {alert.severity && (
                            <span
                              className={`text-xs font-medium px-2 py-1 rounded-lg ${
                                alert.severity === "high"
                                  ? "bg-red-100 text-red-700"
                                  : alert.severity === "medium"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {alert.severity}
                            </span>
                          )}
                        </div>
                      </div>

                      {alert.action_url && (
                        <Link
                          to={createPageUrl(alert.action_url)}
                          className="text-[#FF6A00] text-xs font-medium mt-2 inline-block hover:underline"
                          onClick={() => handleMarkAsRead(alert.id)}
                        >
                          {t('alerts_follow_up')}
                        </Link>
                      )}

                      <p className="text-xs text-[#8FA4C8] mt-2">
                        {new Date(alert.created_date).toLocaleDateString("id-ID", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-[#E2E8F0]">
                    {alert.status === "unread" && (
                      <button
                        onClick={() => handleMarkAsRead(alert.id)}
                        className="flex items-center gap-1.5 text-xs font-medium text-[#8FA4C8] hover:text-[#1A1A1A] transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> {t('alerts_mark_read')}
                      </button>
                    )}
                    <button
                      onClick={() => handleResendEmail(alert)}
                      className="flex items-center gap-1.5 text-xs font-medium text-[#8FA4C8] hover:text-[#1A1A1A] transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" /> {t('alerts_email')}
                    </button>
                    <button
                      onClick={() => handleDelete(alert.id)}
                      className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-700 transition-colors ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> {t('alerts_delete')}
                    </button>
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