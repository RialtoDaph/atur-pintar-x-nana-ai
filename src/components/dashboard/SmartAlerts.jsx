import { AlertTriangle, TrendingUp, Info, X } from "lucide-react";
import { useAppSettings } from "@/components/utils/useAppSettings";
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

export default function SmartAlerts({ transactions, loading }) {
  const { t } = useAppSettings();
  const [dismissedIds, setDismissedIds] = useState([]);
  const [alerts, setAlerts] = useState([]);

  // Load dismissed alerts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("dismissed_smart_alerts");
    if (saved) setDismissedIds(JSON.parse(saved));
  }, []);

  // Generate alerts and save to database
  useEffect(() => {
    if (loading) return;

    const now = new Date();
    const thisMonth = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const lastMonth = transactions.filter((t) => {
      const d = new Date(t.date);
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
    });

    const thisExpense = thisMonth.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const lastExpense = lastMonth.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const thisIncome = thisMonth.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);

    const generatedAlerts = [];

    // Alert 1: Spending spike
    if (lastExpense > 0 && thisExpense > lastExpense) {
      const pct = Math.round((thisExpense - lastExpense) / lastExpense * 100);
      const alertId = "spending_spike";
      if (!dismissedIds.includes(alertId)) {
        generatedAlerts.push({
          id: alertId,
          type: "spending_spike",
          icon: TrendingUp,
          color: "text-red-500",
          bg: "bg-red-50",
          border: "border-red-100",
          title: t('alert_spending_spike') || "Pengeluaran Meningkat",
          text: `Pengeluaran naik ${pct}% dibanding bulan lalu`,
          severity: "medium",
          message: `Pengeluaran naik ${pct}% dibanding bulan lalu`
        });

        // Save to database
        saveAlertToDatabase({
          type: "spending_spike",
          title: t('alert_spending_spike') || "Pengeluaran Meningkat",
          message: `Pengeluaran naik ${pct}% dibanding bulan lalu`,
          severity: "medium",
          metadata: { percentage: pct, current: thisExpense, last: lastExpense }
        });
      }
    }

    // Alert 2: High single transactions
    const highTx = thisMonth.filter((t) => t.type === "expense" && t.amount > 500000);
    if (highTx.length > 0) {
      const alertId = "high_transactions";
      if (!dismissedIds.includes(alertId)) {
        generatedAlerts.push({
          id: alertId,
          type: "budget_exceeded",
          icon: AlertTriangle,
          color: "text-orange-500",
          bg: "bg-orange-50",
          border: "border-orange-100",
          title: t('alert_high_transaction') || "Transaksi Besar",
          text: `${highTx.length} transaksi besar (>Rp 500rb) bulan ini`,
          severity: "high",
          message: `${highTx.length} transaksi besar (>Rp 500rb) bulan ini`
        });

        // Save to database
        saveAlertToDatabase({
          type: "budget_exceeded",
          title: t('alert_high_transaction') || "Transaksi Besar",
          message: `${highTx.length} transaksi besar (>Rp 500rb) bulan ini`,
          severity: "high",
          metadata: { count: highTx.length, threshold: 500000 }
        });
      }
    }

    // Alert 3: High expense ratio
    if (thisIncome > 0 && thisExpense / thisIncome > 0.8) {
      const ratio = Math.round(thisExpense / thisIncome * 100);
      const alertId = "high_expense_ratio";
      if (!dismissedIds.includes(alertId)) {
        generatedAlerts.push({
          id: alertId,
          type: "unusual_pattern",
          icon: Info,
          color: "text-yellow-600",
          bg: "bg-yellow-50",
          border: "border-yellow-100",
          title: t('alert_expense_ratio') || "Pengeluaran Tinggi",
          text: `Kamu sudah pakai ${ratio}% dari pemasukan bulan ini`,
          severity: "medium",
          message: `Kamu sudah pakai ${ratio}% dari pemasukan bulan ini`
        });

        // Save to database
        saveAlertToDatabase({
          type: "unusual_pattern",
          title: t('alert_expense_ratio') || "Pengeluaran Tinggi",
          message: `Kamu sudah pakai ${ratio}% dari pemasukan bulan ini`,
          severity: "medium",
          metadata: { ratio, income: thisIncome, expense: thisExpense }
        });
      }
    }

    setAlerts(generatedAlerts);
  }, [transactions, loading, dismissedIds]);

  async function saveAlertToDatabase(alertData) {
    try {
      const user = await base44.auth.me();
      // Check if alert with same type exists for this month
      const existing = await base44.entities.Alert.filter({
        type: alertData.type,
        status: { $in: ["unread", "read"] },
        created_by: user.email
      });

      // Only create if doesn't exist yet
      if (existing.length === 0) {
        await base44.entities.Alert.create({
          ...alertData,
          status: "unread"
        });
      }
    } catch (error) {
      console.error("Error saving alert:", error);
    }
  }

  function handleDismiss(alertId) {
    const updated = [...dismissedIds, alertId];
    setDismissedIds(updated);
    localStorage.setItem("dismissed_smart_alerts", JSON.stringify(updated));
    setAlerts(alerts.filter((a) => a.id !== alertId));
  }

  if (loading || alerts.length === 0) return null;

  return null;
















}