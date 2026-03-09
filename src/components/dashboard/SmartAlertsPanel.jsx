import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, TrendingUp, Info, CheckCircle2, X, Zap } from "lucide-react";
import { createPageUrl } from "@/utils";

const ALERT_CONFIG = {
  spending_spike: {
    icon: TrendingUp,
    color: "text-red-500",
    bg: "bg-red-50",
    border: "border-red-100"
  },
  bill_upcoming: {
    icon: AlertTriangle,
    color: "text-orange-500",
    bg: "bg-orange-50",
    border: "border-orange-100"
  },
  goal_near: {
    icon: CheckCircle2,
    color: "text-green-500",
    bg: "bg-green-50",
    border: "border-green-100"
  },
  savings_opportunity: {
    icon: Zap,
    color: "text-blue-500",
    bg: "bg-blue-50",
    border: "border-blue-100"
  },
  unusual_pattern: {
    icon: Info,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    border: "border-yellow-100"
  },
  budget_exceeded: {
    icon: AlertTriangle,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-100"
  }
};

export default function SmartAlertsPanel({ user }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.email) loadAlerts();
  }, [user?.email]);

  async function loadAlerts() {
    setLoading(true);
    try {
      const allAlerts = await base44.entities.Alert.filter(
        { status: { $in: ["unread", "read"] }, created_by: user?.email },
        "-created_date",
        20
      );
      setAlerts(allAlerts.filter((a) => a.status === "unread").slice(0, 5));
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

  return null;













































}